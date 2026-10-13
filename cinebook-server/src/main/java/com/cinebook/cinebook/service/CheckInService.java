package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.dto.CheckInRequest;
import com.cinebook.cinebook.dto.CheckInResultDTO;
import com.cinebook.cinebook.dto.CheckInShowDTO;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.model.User;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.BookingSeatRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import com.cinebook.cinebook.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Door check-in. Each ticket can be admitted once; the booking row is locked while scanning so two
 * staff scanning the same ticket at the same moment can't both admit it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CheckInService {

    /** Doors open this long before the show. */
    private static final int EARLY_MINUTES = 180;
    /** Late arrivals accepted until this long after the show ends. */
    private static final int LATE_MINUTES = 60;
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEE d MMM, h:mm a", Locale.ENGLISH);

    private final BookingRepository bookingRepo;
    private final BookingSeatRepository bookingSeatRepo;
    private final ShowTimeRepository showTimeRepo;
    private final BookingLock bookingLock;
    private final CurrentUser currentUser;
    private final DtoMapper mapper;

    /** Shows on a date (default today) with live door numbers. */
    @Transactional(readOnly = true)
    public List<CheckInShowDTO> shows(LocalDate date) {
        LocalDate d = date == null ? LocalDate.now() : date;
        return showTimeRepo.search(null, null, null, null, d).stream()
                .sorted(Comparator.comparing(ShowTime::getStartTime))
                .map(st -> stats(st, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public CheckInShowDTO show(Long showtimeId) {
        return stats(showTimeRepo.findById(showtimeId).orElseThrow(() -> ApiException.notFound("Showtime not found")), true);
    }

    @Transactional
    public CheckInResultDTO scan(CheckInRequest req) {
        User staff = currentUser.require();
        String ref = normalize(req.code());
        Booking found = bookingRepo.findByReferenceIgnoreCase(ref).orElse(null);
        if (found == null) {
            return fail("NOT_FOUND", "Ticket not found", "No booking matches \"" + ref + "\". Check the code and try again.", null, req.showtimeId());
        }
        Booking b = bookingLock.lock(found.getId()).orElseThrow();
        ShowTime st = b.getShowTime();
        LocalDateTime now = LocalDateTime.now();

        switch (b.getStatus()) {
            case REFUNDED -> { return fail("REFUNDED", "Refunded ticket", "This booking was refunded and is not valid for entry.", b, req.showtimeId()); }
            case CANCELLED, EXPIRED -> { return fail("CANCELLED", "Cancelled ticket", "This booking was cancelled and is not valid for entry.", b, req.showtimeId()); }
            case PENDING -> { return fail("NOT_PAID", "Not paid", "This booking hasn't been paid. Send the customer to complete payment.", b, req.showtimeId()); }
            default -> { }
        }
        if (b.getCheckedInAt() != null) {
            return fail("ALREADY_CHECKED_IN", "Already checked in",
                    "This ticket was scanned at " + b.getCheckedInAt().format(TIME)
                            + (b.getCheckedInBy() != null ? " by " + b.getCheckedInBy() : "") + ". It can't be used twice.", b, req.showtimeId());
        }
        if (req.showtimeId() != null && !req.showtimeId().equals(st.getId())) {
            return fail("WRONG_SHOW", "Wrong show",
                    "This ticket is for " + st.getTitle() + " on " + st.getStartsAt().format(WHEN) + " at "
                            + st.getScreen().getTheater().getName() + " - " + st.getScreen().getScreenName() + ".", b, req.showtimeId());
        }
        LocalDateTime opens = st.getStartsAt().minusMinutes(EARLY_MINUTES);
        LocalDateTime closes = st.getStartsAt().plusMinutes(st.getDurationMinutes() + LATE_MINUTES);
        if (now.isBefore(opens)) {
            return fail("TOO_EARLY", "Too early",
                    "This ticket is for " + st.getStartsAt().format(WHEN) + ". Check-in opens at " + opens.format(WHEN) + ".", b, req.showtimeId());
        }
        if (now.isAfter(closes)) {
            return fail("SHOW_ENDED", "Show has ended", "This ticket was for " + st.getStartsAt().format(WHEN) + ".", b, req.showtimeId());
        }

        b.setCheckedInAt(now);
        b.setCheckedInBy(staff.getEmail());
        bookingRepo.saveAndFlush(b);
        log.info("Checked in {} ({} seats) for showtime {} by {}", b.getReference(), b.getSeats().size(), st.getId(), staff.getEmail());
        String who = b.getContactName() != null ? b.getContactName() : b.getUser().getName();
        return new CheckInResultDTO(true, "CHECKED_IN", "Admit " + b.getSeats().size(),
                who + " - seats " + b.getSeatLabels(), mapper.booking(b), stats(st, false));
    }

    /** Reverses an accidental check-in. */
    @Transactional
    public BookingResponseDTO undo(Long bookingId) {
        Booking b = bookingLock.lock(bookingId).orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (b.getCheckedInAt() == null) throw ApiException.badRequest("This ticket isn't checked in");
        log.info("Check-in of {} undone by {}", b.getReference(), currentUser.require().getEmail());
        b.setCheckedInAt(null);
        b.setCheckedInBy(null);
        bookingRepo.save(b);
        return mapper.booking(b);
    }

    private CheckInResultDTO fail(String result, String title, String message, Booking b, Long showtimeId) {
        CheckInShowDTO show = showtimeId == null ? null
                : showTimeRepo.findById(showtimeId).map(st -> stats(st, false)).orElse(null);
        return new CheckInResultDTO(false, result, title, message, b == null ? null : mapper.booking(b), show);
    }

    private CheckInShowDTO stats(ShowTime st, boolean withRecent) {
        long sold = bookingSeatRepo.countPaidSeats(st.getId(), BookingStatus.CONFIRMED, false);
        long in = bookingSeatRepo.countPaidSeats(st.getId(), BookingStatus.CONFIRMED, true);
        List<BookingResponseDTO> recent = withRecent
                ? bookingRepo.checkedInFor(st.getId(), BookingStatus.CONFIRMED, PageRequest.of(0, 20)).stream().map(mapper::booking).toList()
                : List.of();
        return new CheckInShowDTO(st.getId(), st.getKind(), st.getTitle(), st.getPosterUrl(),
                st.getScreen().getTheater().getName(), st.getScreen().getScreenName(),
                st.getShowDate(), st.getStartTime(), st.getEndTime(), sold, in, recent);
    }

    /** "CINEBOOK:CB-7K2P9QX", "cb-7k2p9qx" or "7K2P9QX" -> "CB-7K2P9QX". */
    static String normalize(String code) {
        String c = code.trim().toUpperCase(Locale.ROOT);
        if (c.startsWith("CINEBOOK:")) c = c.substring("CINEBOOK:".length());
        c = c.replaceAll("\\s", "");
        if (!c.startsWith("CB-") && c.length() == 7) c = "CB-" + c;
        return c;
    }
}
