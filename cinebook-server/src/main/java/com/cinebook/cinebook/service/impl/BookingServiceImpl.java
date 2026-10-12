package com.cinebook.cinebook.service.impl;

import com.cinebook.cinebook.dto.BookingRequestDTO;
import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.*;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.BookingSeatRepository;
import com.cinebook.cinebook.repository.SeatRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import com.cinebook.cinebook.security.CurrentUser;
import com.cinebook.cinebook.service.BookingService;
import com.cinebook.cinebook.service.BookingLock;
import com.cinebook.cinebook.service.DtoMapper;
import com.cinebook.cinebook.service.RefundPolicy;
import com.cinebook.cinebook.service.StripeGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final String REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final BookingRepository bookingRepo;
    private final BookingLock bookingLock;
    private final BookingSeatRepository bookingSeatRepo;
    private final ShowTimeRepository showTimeRepo;
    private final SeatRepository seatRepo;
    private final CurrentUser currentUser;
    private final DtoMapper mapper;
    private final StripeGateway stripe;
    private final RefundPolicy refundPolicy;

    @Value("${app.booking.hold-minutes}")
    private int holdMinutes;

    @Value("${app.booking.max-seats}")
    private int maxSeats;

    @Override
    @Transactional
    public BookingResponseDTO hold(BookingRequestDTO request) {
        User user = currentUser.require();
        ShowTime st = showTimeRepo.findById(request.showTimeId())
                .orElseThrow(() -> ApiException.notFound("Showtime not found"));
        LocalDateTime now = LocalDateTime.now();

        if (!st.getStartsAt().isAfter(now)) {
            throw ApiException.badRequest("This show has already started");
        }
        if (!st.isListingActive()) {
            throw ApiException.badRequest("Bookings for this show are closed");
        }
        List<Long> seatIds = request.seatIds().stream().filter(Objects::nonNull).distinct().toList();
        if (seatIds.isEmpty()) {
            throw ApiException.badRequest("Select at least one seat");
        }
        if (seatIds.size() > maxSeats) {
            throw ApiException.badRequest("You can book up to " + maxSeats + " seats at a time");
        }

        // Starting a new selection replaces this user's earlier hold for the same show.
        for (Booking previous : bookingRepo.findByUserIdAndShowTimeIdAndStatus(user.getId(), st.getId(), BookingStatus.PENDING)) {
            stripe.expireSessionQuietly(previous.getStripeSessionId());
            release(previous, BookingStatus.CANCELLED);
        }
        // Free seats from holds that timed out but have not been swept yet.
        for (Booking stale : bookingRepo.findByStatusAndExpiresAtBefore(BookingStatus.PENDING, now)) {
            if (stale.getShowTime().getId().equals(st.getId())) {
                release(stale, BookingStatus.EXPIRED);
            }
        }
        // Updates must hit the database before the inserts below, or the unique key would see both.
        bookingSeatRepo.flush();

        List<Seat> seats = seatRepo.findAllById(seatIds);
        if (seats.size() != seatIds.size()) {
            throw ApiException.badRequest("One or more seats do not exist");
        }
        for (Seat s : seats) {
            if (!s.getScreen().getId().equals(st.getScreen().getId())) {
                throw ApiException.badRequest("Seat " + s.getLabel() + " is not in this screen");
            }
            if (!s.isActive()) {
                throw ApiException.badRequest("Seat " + s.getLabel() + " cannot be booked");
            }
        }

        List<BookingSeat> taken = bookingSeatRepo.findLockedForSeats(st.getId(), seatIds);
        if (!taken.isEmpty()) {
            String labels = taken.stream().map(BookingSeat::getSeatLabel).sorted().collect(Collectors.joining(", "));
            throw ApiException.conflict("Sorry, " + labels + (taken.size() == 1 ? " was" : " were")
                    + " just taken. Please choose other seats.");
        }

        seats.sort(Comparator.comparingInt(Seat::getRowNumber).thenComparingInt(Seat::getSeatNumber));

        Booking booking = Booking.builder()
                .reference(newReference())
                .user(user)
                .showTime(st)
                .status(BookingStatus.PENDING)
                .currency(mapper.currency())
                .createdAt(now)
                .expiresAt(now.plusMinutes(holdMinutes))
                .seatLabels(seats.stream().map(Seat::getLabel).collect(Collectors.joining(", ")))
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (Seat s : seats) {
            BigDecimal price = st.priceFor(s.getType());
            total = total.add(price);
            booking.getSeats().add(BookingSeat.builder()
                    .booking(booking)
                    .showTime(st)
                    .seat(s)
                    .seatType(s.getType())
                    .seatLabel(s.getLabel())
                    .price(price)
                    .locked(Boolean.TRUE)
                    .build());
        }
        booking.setTotalAmount(total);

        // If another request grabbed a seat in the meantime the unique key fails here -> HTTP 409.
        Booking saved = bookingRepo.saveAndFlush(booking);
        log.info("Hold {} for {} seats on showtime {} by {}", saved.getReference(), seats.size(), st.getId(), user.getEmail());
        return mapper.booking(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> myBookings() {
        User user = currentUser.require();
        return bookingRepo.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(mapper::booking)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getForCurrentUser(Long bookingId) {
        return mapper.booking(findOwned(bookingId));
    }

    @Override
    @Transactional
    public BookingResponseDTO cancelPending(Long bookingId) {
        Booking booking = findOwned(bookingId);
        booking = bookingLock.lock(booking.getId()).orElseThrow();
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw ApiException.badRequest("Only unpaid bookings can be released");
        }
        stripe.expireSessionQuietly(booking.getStripeSessionId());
        booking.setCancelledBy("CUSTOMER");
        release(booking, BookingStatus.CANCELLED);
        return mapper.booking(booking);
    }

    @Override
    @Transactional
    public BookingResponseDTO cancelAndRefund(Long bookingId) {
        Booking booking = bookingLock.lock(findOwned(bookingId).getId()).orElseThrow();
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw ApiException.badRequest("Only confirmed tickets can be cancelled for a refund");
        }
        if (!refundPolicy.isRefundable(booking)) {
            throw ApiException.badRequest("Tickets can be cancelled for a refund until "
                    + refundPolicy.cutoffHours() + " hours before the show. This show is too close to cancel now.");
        }
        BigDecimal amount = refundPolicy.customerRefundAmount(booking);
        long minor = stripe.toMinorUnits(amount, booking.getCurrency());
        boolean full = amount.compareTo(booking.getTotalAmount()) >= 0;
        // Refund first: if Stripe fails, the exception rolls back and the ticket stays valid.
        booking.setStripeRefundId(stripe.refund(booking.getStripePaymentIntentId(), full ? null : minor));
        booking.setRefundAmount(amount);
        booking.setCancelledBy("CUSTOMER");
        release(booking, BookingStatus.REFUNDED);
        log.info("Customer cancelled {}; refunded {} {}; seats {} back on sale",
                booking.getReference(), amount, booking.getCurrency(), booking.getSeatLabels());
        return mapper.booking(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> adminSearch(BookingStatus status, String query) {
        String q = query == null || query.isBlank() ? null : query.trim();
        return bookingRepo.search(status, q, PageRequest.of(0, 500)).stream()
                .map(mapper::booking)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO adminGet(Long bookingId) {
        return mapper.booking(bookingRepo.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found")));
    }

    @Override
    @Transactional
    public BookingResponseDTO adminCancel(Long bookingId) {
        Booking booking = bookingLock.lock(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));

        booking.setCancelledBy("ADMIN");
        switch (booking.getStatus()) {
            case PENDING -> {
                stripe.expireSessionQuietly(booking.getStripeSessionId());
                release(booking, BookingStatus.CANCELLED);
            }
            case CONFIRMED -> {
                if (booking.getStripePaymentIntentId() != null) {
                    booking.setStripeRefundId(stripe.refund(booking.getStripePaymentIntentId()));
                    booking.setRefundAmount(booking.getTotalAmount());
                    release(booking, BookingStatus.REFUNDED);
                } else {
                    release(booking, BookingStatus.CANCELLED);
                }
            }
            default -> throw ApiException.badRequest("Booking is already " + booking.getStatus().name().toLowerCase());
        }
        log.info("Admin cancelled booking {} -> {}", booking.getReference(), booking.getStatus());
        return mapper.booking(booking);
    }

    @Override
    @Transactional
    public void release(Booking booking, BookingStatus newStatus) {
        booking.setStatus(newStatus);
        if (newStatus != BookingStatus.EXPIRED) {
            booking.setCancelledAt(LocalDateTime.now());
        }
        for (BookingSeat bs : booking.getSeats()) {
            bs.setLocked(null);
        }
        bookingRepo.save(booking);
    }

    @Override
    @Scheduled(fixedDelayString = "${app.booking.sweep-interval-ms:30000}", initialDelay = 10000)
    @Transactional
    public int expireStaleHolds() {
        List<Booking> stale = bookingRepo.findByStatusAndExpiresAtBefore(BookingStatus.PENDING, LocalDateTime.now());
        for (Booking b : stale) {
            stripe.expireSessionQuietly(b.getStripeSessionId());
            release(b, BookingStatus.EXPIRED);
            log.info("Hold {} expired; seats {} released", b.getReference(), b.getSeatLabels());
        }
        return stale.size();
    }

    private Booking findOwned(Long bookingId) {
        User user = currentUser.require();
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (!booking.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            // 404 rather than 403 so booking ids can't be probed
            throw ApiException.notFound("Booking not found");
        }
        return booking;
    }

    private String newReference() {
        String ref;
        do {
            StringBuilder sb = new StringBuilder("CB-");
            for (int i = 0; i < 7; i++) {
                sb.append(REF_ALPHABET.charAt(RANDOM.nextInt(REF_ALPHABET.length())));
            }
            ref = sb.toString();
        } while (bookingRepo.existsByReference(ref));
        return ref;
    }
}
