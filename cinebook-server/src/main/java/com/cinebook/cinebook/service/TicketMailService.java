package com.cinebook.cinebook.service;

import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.repository.BookingRepository;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Emails the PDF ticket once a booking is confirmed. Runs after the payment transaction commits
 * and on a background thread, so a slow or failing mail server never affects the payment itself.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TicketMailService {

    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEE d MMM, h:mm a", Locale.ENGLISH);

    private final JavaMailSender mailSender;
    private final BookingRepository bookingRepo;
    private final TicketPdfService pdfService;
    private final TransactionTemplate tx;
    private final RefundPolicy refundPolicy;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${app.mail.from-name:CineBook}")
    private String fromName;

    @Value("${app.client-url}")
    private String clientUrl;

    public boolean isConfigured() {
        return username != null && !username.isBlank() && password != null && !password.isBlank();
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        if (!isConfigured()) {
            log.warn("MAIL_USERNAME / MAIL_PASSWORD not set - ticket email for booking {} skipped", event.bookingId());
            return;
        }
        try {
            sendTicket(event.bookingId());
        } catch (Exception e) {
            log.error("Ticket email for booking {} failed: {}", event.bookingId(), e.getMessage());
        }
    }

    /** Builds the PDF and sends it to the booking's contact email (or the account email). */
    public String sendTicket(Long bookingId) throws Exception {
        if (!isConfigured()) {
            throw new IllegalStateException("Email is not configured on the server");
        }
        // Read everything we need inside a transaction (lazy seat list), then send outside it.
        Mail mail = tx.execute(status -> {
            Booking b = bookingRepo.findById(bookingId).orElseThrow();
            if (b.getStatus() != BookingStatus.CONFIRMED) {
                throw new IllegalStateException("Only confirmed bookings have a ticket");
            }
            String to = b.getContactEmail() != null ? b.getContactEmail() : b.getUser().getEmail();
            String name = b.getContactName() != null ? b.getContactName() : b.getUser().getName();
            return new Mail(to, name, b.getReference(), subject(b), html(b, name), pdfService.render(b));
        });

        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setFrom(new InternetAddress(username, fromName));
        helper.setTo(new InternetAddress(mail.to, mail.name));
        helper.setSubject(mail.subject);
        helper.setText(plain(mail), mail.html);
        helper.addAttachment("CineBook-" + mail.reference + ".pdf", new ByteArrayResource(mail.pdf), "application/pdf");
        mailSender.send(msg);

        tx.executeWithoutResult(status -> bookingRepo.findById(bookingId)
                .ifPresent(b -> b.setTicketEmailedAt(LocalDateTime.now())));
        log.info("Ticket {} emailed to {}", mail.reference, mail.to);
        return mail.to;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingRefunded(BookingRefundedEvent event) {
        if (!isConfigured()) {
            log.warn("MAIL_USERNAME / MAIL_PASSWORD not set - refund email for booking {} skipped", event.bookingId());
            return;
        }
        try {
            sendRefundNotice(event.bookingId());
        } catch (Exception e) {
            log.error("Refund email for booking {} failed: {}", event.bookingId(), e.getMessage());
        }
    }

    /** Tells the customer their booking was cancelled and how much is coming back to their card. */
    public String sendRefundNotice(Long bookingId) throws Exception {
        Mail mail = tx.execute(status -> {
            Booking b = bookingRepo.findById(bookingId).orElseThrow();
            if (b.getStatus() != BookingStatus.REFUNDED) {
                throw new IllegalStateException("Booking " + b.getReference() + " is not refunded");
            }
            String to = b.getContactEmail() != null ? b.getContactEmail() : b.getUser().getEmail();
            String name = b.getContactName() != null ? b.getContactName() : b.getUser().getName();
            String subject = "Refund confirmed: " + b.getShowTime().getTitle() + " (" + b.getReference() + ")";
            return new Mail(to, name, b.getReference(), subject, refundHtml(b, name), null);
        });

        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setFrom(new InternetAddress(username, fromName));
        helper.setTo(new InternetAddress(mail.to, mail.name));
        helper.setSubject(mail.subject);
        helper.setText("Hi " + mail.name + ",\n\nBooking " + mail.reference + " has been cancelled and refunded to the card "
                + "you paid with. Banks usually take 5-10 business days to show it.\n\nCineBook", mail.html);
        mailSender.send(msg);

        tx.executeWithoutResult(status -> bookingRepo.findById(bookingId)
                .ifPresent(b -> b.setRefundEmailedAt(LocalDateTime.now())));
        log.info("Refund notice for {} emailed to {}", mail.reference, mail.to);
        return mail.to;
    }

    private String refundHtml(Booking b, String name) {
        ShowTime st = b.getShowTime();
        java.math.BigDecimal refunded = b.getRefundAmount() != null ? b.getRefundAmount() : b.getTotalAmount();
        java.math.BigDecimal fee = b.getTotalAmount().subtract(refunded);
        String reason = switch (b.getCancelledBy() == null ? "" : b.getCancelledBy()) {
            case "CUSTOMER" -> "As requested, we've cancelled your booking.";
            case "ADMIN" -> "Your booking has been cancelled by CineBook. We're sorry for the inconvenience.";
            case "SYSTEM" -> "Your payment arrived after your seat hold had ended and the seats were no longer available, so we couldn't issue tickets.";
            default -> "Your booking has been cancelled.";
        };
        String row = "<tr><td style=\"padding:6px 0;color:#6b6b80;font-size:13px;width:120px\">%s</td>"
                + "<td style=\"padding:6px 0;color:#15151f;font-size:14px;font-weight:600\">%s</td></tr>";
        String rows = String.format(row, "Booking ref", esc(b.getReference()))
                + String.format(row, "Show", esc(st.getTitle()))
                + String.format(row, "Was on", esc(st.getStartsAt().format(WHEN)))
                + String.format(row, st.isEvent() ? "Venue" : "Cinema", esc(st.getScreen().getTheater().getName()))
                + String.format(row, "Seats", esc(b.getSeatLabels()) + " <span style=\"color:#8a8aa0;font-weight:400\">(released)</span>")
                + (b.getPromoCode() != null && b.getDiscountAmount() != null
                    ? String.format(row, "Promo " + esc(b.getPromoCode()), "-" + esc(money(b.getDiscountAmount(), b.getCurrency())))
                    : "")
                + String.format(row, "You paid", esc(money(b.getTotalAmount(), b.getCurrency())))
                + (fee.signum() > 0 ? String.format(row, "Cancellation fee", esc(money(fee, b.getCurrency()))) : "");
        return """
                <div style="background:#f4f4f8;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
                  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
                    <div style="background:#0284c7;padding:18px 24px;color:#ffffff;font-size:20px;font-weight:bold">CineBook &middot; Refund confirmed</div>
                    <div style="padding:24px">
                      <p style="margin:0 0 4px;color:#15151f;font-size:16px">Hi %s,</p>
                      <p style="margin:0 0 20px;color:#4b4b5c;font-size:14px">%s</p>
                      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;text-align:center">
                        <div style="color:#0369a1;font-size:12px;font-weight:bold;letter-spacing:1px">REFUND</div>
                        <div style="color:#0c4a6e;font-size:30px;font-weight:bold;margin:4px 0">%s</div>
                        <div style="color:#4b4b5c;font-size:13px">to the card you paid with &middot; usually visible in 5-10 business days</div>
                      </div>
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px">%s</table>
                      <p style="margin:16px 0 0;color:#4b4b5c;font-size:13px">Your old ticket and QR code no longer work.</p>
                      <div style="text-align:center;margin:24px 0 4px">
                        <a href="%s" style="background:#e11d48;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;font-size:14px;display:inline-block">Book again</a>
                      </div>
                    </div>
                  </div>
                </div>
                """.formatted(esc(name), esc(reason), esc(money(refunded, b.getCurrency())), rows, clientUrl);
    }

    private static String money(java.math.BigDecimal amount, String currency) {
        return Money.format(amount, currency);
    }

    private record Mail(String to, String name, String reference, String subject, String html, byte[] pdf) {
    }

    private static String subject(Booking b) {
        ShowTime st = b.getShowTime();
        return "Your tickets: " + st.getTitle() + " - " + st.getStartsAt().format(WHEN) + " (" + b.getReference() + ")";
    }

    private static String plain(Mail m) {
        return "Hi " + m.name + ",\n\nYour booking " + m.reference + " is confirmed. "
                + "Your ticket is attached as a PDF - show its QR code at the entrance.\n\nEnjoy the show!\nCineBook";
    }

    private String html(Booking b, String name) {
        ShowTime st = b.getShowTime();
        String row = "<tr><td style=\"padding:6px 0;color:#6b6b80;font-size:13px;width:110px\">%s</td>"
                + "<td style=\"padding:6px 0;color:#15151f;font-size:14px;font-weight:600\">%s</td></tr>";
        String rows = String.format(row, "When", esc(st.getStartsAt().format(WHEN)))
                + String.format(row, st.isEvent() ? "Venue" : "Cinema", esc(st.getScreen().getTheater().getName()))
                + String.format(row, st.isEvent() ? "Hall" : "Screen", esc(st.getScreen().getScreenName()))
                + String.format(row, "Seats", esc(b.getSeatLabels()))
                + (b.getSnacks().isEmpty() ? "" : String.format(row, "Snacks", esc(TicketPdfService.snackSummary(b))))
                + (b.getPromoCode() != null && b.getDiscountAmount() != null
                    ? String.format(row, "Promo " + esc(b.getPromoCode()), "-" + esc(money(b.getDiscountAmount(), b.getCurrency())))
                    : "")
                + String.format(row, "Paid", esc(TicketPdfService.money(b)))
                + String.format(row, "Booking ref", esc(b.getReference()));
        String poster = st.getPosterUrl() != null
                ? "<img src=\"" + esc(st.getPosterUrl()) + "\" width=\"96\" style=\"border-radius:10px;display:block\" alt=\"\">"
                : "";
        return """
                <div style="background:#f4f4f8;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
                  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
                    <div style="background:#e11d48;padding:18px 24px;color:#ffffff;font-size:20px;font-weight:bold">CineBook</div>
                    <div style="padding:24px">
                      <p style="margin:0 0 4px;color:#15151f;font-size:16px">Hi %s,</p>
                      <p style="margin:0 0 20px;color:#4b4b5c;font-size:14px">Your booking is confirmed. Your ticket is attached as a PDF - show its QR code at the entrance.</p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%%"><tr>
                        <td valign="top" width="110">%s</td>
                        <td valign="top" style="padding-left:16px">
                          <div style="color:#e11d48;font-size:11px;font-weight:bold;letter-spacing:1px">%s</div>
                          <div style="color:#15151f;font-size:20px;font-weight:bold;margin:2px 0 10px">%s</div>
                          <table role="presentation" cellpadding="0" cellspacing="0">%s</table>
                        </td>
                      </tr></table>
                      <div style="text-align:center;margin:26px 0 6px">
                        <a href="%s/bookings/%d" style="background:#e11d48;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;font-size:14px;display:inline-block">View ticket online</a>
                      </div>
                      <p style="margin:18px 0 0;color:#8a8aa0;font-size:12px;text-align:center">Plans changed? You can cancel for a refund from My Tickets until %d hours before the show.</p>
                    </div>
                  </div>
                </div>
                """.formatted(esc(name), poster, st.isEvent() ? "EVENT" : "MOVIE", esc(st.getTitle()), rows, clientUrl, b.getId(), refundPolicy.cutoffHours());
    }

    private static String esc(String s) {
        return s == null ? "" : HtmlUtils.htmlEscape(s);
    }
}
