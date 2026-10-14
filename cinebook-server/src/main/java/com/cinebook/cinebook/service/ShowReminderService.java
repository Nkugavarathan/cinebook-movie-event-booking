package com.cinebook.cinebook.service;

import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import static com.cinebook.cinebook.service.EmailService.esc;

/**
 * Emails "your show starts soon" a few hours before each paid show (app.reminder.hours-before).
 * Runs every few minutes, like the seat-hold sweeper; reminderEmailedAt makes sure each booking
 * gets one reminder at most, even after a restart.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShowReminderService {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEE d MMM", Locale.ENGLISH);

    private final BookingRepository bookingRepo;
    private final EmailService email;
    private final TransactionTemplate tx;

    @Value("${app.reminder.enabled:true}")
    private boolean enabled;

    @Value("${app.reminder.hours-before:3}")
    private int hoursBefore;

    @Value("${app.client-url}")
    private String clientUrl;

    @Scheduled(fixedDelayString = "${app.reminder.check-interval-ms:300000}", initialDelay = 60000)
    public void sendDueReminders() {
        if (!enabled || !email.isConfigured()) return;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowEnd = now.plusHours(hoursBefore);
        List<Long> due = tx.execute(status -> bookingRepo
                .findReminderCandidates(BookingStatus.CONFIRMED, LocalDate.now(), windowEnd.toLocalDate()).stream()
                .filter(b -> {
                    LocalDateTime start = b.getShowTime().getStartsAt();
                    // Only shows that haven't started and start inside the window. Skip people who
                    // booked inside the window: they just got their ticket email.
                    return start.isAfter(now) && !start.isAfter(windowEnd)
                            && b.getConfirmedAt() != null && b.getConfirmedAt().isBefore(start.minusHours(hoursBefore));
                })
                .map(Booking::getId)
                .toList());

        for (Long id : due) {
            try {
                sendReminder(id);
            } catch (Exception e) {
                log.error("Reminder for booking {} failed: {}", id, e.getMessage());
            }
        }
    }

    private void sendReminder(Long bookingId) throws Exception {
        Mail mail = tx.execute(status -> {
            Booking b = bookingRepo.findById(bookingId).orElseThrow();
            ShowTime st = b.getShowTime();
            String to = b.getContactEmail() != null ? b.getContactEmail() : b.getUser().getEmail();
            String name = b.getContactName() != null ? b.getContactName() : b.getUser().getName();
            String when = st.getShowDate().equals(LocalDate.now()) ? "today at " + st.getStartTime().format(TIME)
                    : st.getShowDate().format(DAY) + " at " + st.getStartTime().format(TIME);
            String subject = "Starts soon: " + st.getTitle() + " " + when;
            return new Mail(to, name, subject, plain(b, name, when), html(b, name, when));
        });
        email.send(mail.to, mail.name, mail.subject, mail.plain, mail.html);
        tx.executeWithoutResult(status -> bookingRepo.findById(bookingId)
                .ifPresent(b -> b.setReminderEmailedAt(LocalDateTime.now())));
        log.info("Show reminder for booking {} sent to {}", bookingId, mail.to);
    }

    private String html(Booking b, String name, String when) {
        ShowTime st = b.getShowTime();
        String row = "<tr><td style=\"padding:6px 0;color:#6b6b80;font-size:13px;width:110px\">%s</td>"
                + "<td style=\"padding:6px 0;color:#15151f;font-size:14px;font-weight:600\">%s</td></tr>";
        String address = st.getScreen().getTheater().getAddress();
        String rows = String.format(row, st.isEvent() ? "Venue" : "Cinema", esc(st.getScreen().getTheater().getName()))
                + (address != null && !address.isBlank() ? String.format(row, "Address", esc(address)) : "")
                + String.format(row, st.isEvent() ? "Hall" : "Screen", esc(st.getScreen().getScreenName()))
                + String.format(row, "Seats", esc(b.getSeatLabels()))
                + (b.getSnacks().isEmpty() ? "" : String.format(row, "Snacks", esc(TicketPdfService.snackSummary(b))))
                + String.format(row, "Booking ref", esc(b.getReference()));
        String body = """
                <p style="margin:0 0 4px;color:#15151f;font-size:16px">Hi %s,</p>
                <p style="margin:0 0 16px;color:#4b4b5c;font-size:14px"><b>%s</b> starts %s. Please arrive a few minutes early and have your QR code ready at the entrance.</p>
                <table role="presentation" cellpadding="0" cellspacing="0">%s</table>
                """.formatted(esc(name), esc(st.getTitle()), esc(when), rows);
        return EmailService.layout("See you soon", body, "Show my ticket", clientUrl + "/bookings/" + b.getId(),
                b.getSnacks().isEmpty() ? null : "Your snacks are ready to collect at the snack counter - just show your ticket.");
    }

    private static String plain(Booking b, String name, String when) {
        ShowTime st = b.getShowTime();
        return "Hi " + name + ",\n\n" + st.getTitle() + " starts " + when + " at "
                + st.getScreen().getTheater().getName() + ", " + st.getScreen().getScreenName()
                + ".\nSeats: " + b.getSeatLabels() + "\nBooking ref: " + b.getReference()
                + "\n\nHave your QR code ready at the entrance. Enjoy the show!\nCineBook";
    }

    private record Mail(String to, String name, String subject, String plain, String html) {
    }
}
