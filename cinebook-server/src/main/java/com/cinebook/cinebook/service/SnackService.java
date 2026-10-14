package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.dto.SnackDTO;
import com.cinebook.cinebook.dto.SnackRequest;
import com.cinebook.cinebook.dto.UpdateSnacksRequest;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.*;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.SnackRepository;
import com.cinebook.cinebook.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Snacks and combos: the admin menu, and adding them to a held (PENDING) booking.
 * Prices always come from the database here; the client only sends snack ids and quantities.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SnackService {

    private static final int MAX_ITEMS = 20;

    private final SnackRepository snackRepo;
    private final BookingRepository bookingRepo;
    private final BookingLock bookingLock;
    private final CurrentUser currentUser;
    private final StripeGateway stripe;
    private final DtoMapper mapper;

    // ---------------------------------------------------------------- checkout

    @Transactional(readOnly = true)
    public List<SnackDTO> menu() {
        return snackRepo.findByActiveTrueOrderByCategoryAscPriceAsc().stream().map(s -> toDto(s, 0)).toList();
    }

    @Transactional
    public BookingResponseDTO updateBookingSnacks(Long bookingId, UpdateSnacksRequest request) {
        User user = currentUser.require();
        Booking b = bookingLock.lock(bookingId).orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (!b.getUser().getId().equals(user.getId())) throw ApiException.notFound("Booking not found");
        if (b.getStatus() != BookingStatus.PENDING || b.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("Snacks can only be changed before you pay");
        }

        // Merge repeated ids and drop zero quantities.
        Map<Long, Integer> wanted = new LinkedHashMap<>();
        for (UpdateSnacksRequest.Item item : request.items()) {
            if (item.quantity() > 0) wanted.merge(item.snackId(), item.quantity(), Integer::sum);
        }
        int units = wanted.values().stream().mapToInt(Integer::intValue).sum();
        if (units > MAX_ITEMS) {
            throw ApiException.badRequest("You can add up to " + MAX_ITEMS + " snacks to one booking");
        }
        if (wanted.values().stream().anyMatch(q -> q > 10)) {
            throw ApiException.badRequest("You can add up to 10 of each snack");
        }

        Map<Long, Snack> snacks = new HashMap<>();
        snackRepo.findAllById(wanted.keySet()).forEach(s -> snacks.put(s.getId(), s));
        b.getSnacks().clear();
        BigDecimal sum = BigDecimal.ZERO;
        for (var entry : wanted.entrySet()) {
            Snack s = snacks.get(entry.getKey());
            if (s == null || !s.isActive()) {
                throw ApiException.badRequest("One of the snacks is no longer available. Please refresh the page.");
            }
            BookingSnack line = BookingSnack.builder()
                    .booking(b).snack(s).name(s.getName()).unitPrice(s.getPrice()).quantity(entry.getValue())
                    .build();
            b.getSnacks().add(line);
            sum = sum.add(line.getLineTotal());
        }
        b.setSnacksAmount(b.getSnacks().isEmpty() ? null : sum);
        b.recalculateTotal();
        // A Stripe session made for the old total must not be paid.
        if (b.getStripeSessionId() != null) {
            stripe.expireSessionQuietly(b.getStripeSessionId());
            b.setStripeSessionId(null);
        }
        bookingRepo.save(b);
        log.info("Snacks on {} set to {} item(s), {} {}", b.getReference(), units, sum, b.getCurrency());
        return mapper.booking(b);
    }

    // ---------------------------------------------------------------- admin

    @Transactional(readOnly = true)
    public List<SnackDTO> listAll() {
        Map<Long, Long> sold = new HashMap<>();
        for (Object[] row : snackRepo.unitsSold()) sold.put((Long) row[0], ((Number) row[1]).longValue());
        return snackRepo.findAllByOrderByCategoryAscNameAsc().stream()
                .map(s -> toDto(s, sold.getOrDefault(s.getId(), 0L)))
                .toList();
    }

    @Transactional
    public SnackDTO create(SnackRequest req) {
        Snack s = new Snack();
        s.setCreatedAt(LocalDateTime.now());
        apply(s, req);
        return toDto(snackRepo.save(s), 0);
    }

    @Transactional
    public SnackDTO update(Long id, SnackRequest req) {
        Snack s = find(id);
        apply(s, req);
        return toDto(snackRepo.save(s), 0);
    }

    @Transactional
    public void delete(Long id) {
        Snack s = find(id);
        if (snackRepo.isUsed(id)) {
            throw ApiException.conflict("This snack is on existing bookings, so it can't be deleted. Turn it off instead.");
        }
        snackRepo.delete(s);
    }

    private void apply(Snack s, SnackRequest r) {
        s.setName(r.name().trim());
        s.setDescription(blankToNull(r.description()));
        s.setCategory(blankToNull(r.category()));
        s.setPrice(r.price());
        s.setImageUrl(blankToNull(r.imageUrl()));
        s.setActive(r.active() == null || r.active());
    }

    private Snack find(Long id) {
        return snackRepo.findById(id).orElseThrow(() -> ApiException.notFound("Snack not found"));
    }

    private SnackDTO toDto(Snack s, long unitsSold) {
        return new SnackDTO(s.getId(), s.getName(), s.getDescription(), s.getCategory(), s.getPrice(), s.getImageUrl(),
                s.isActive(), mapper.currency(), unitsSold);
    }

    private static String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
