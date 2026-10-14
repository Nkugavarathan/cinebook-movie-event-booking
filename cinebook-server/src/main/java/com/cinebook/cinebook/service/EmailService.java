package com.cinebook.cinebook.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

/** Plain HTML emails (password reset, show reminders). Ticket emails with a PDF live in TicketMailService. */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${app.mail.from-name:CineBook}")
    private String fromName;

    public boolean isConfigured() {
        return username != null && !username.isBlank() && password != null && !password.isBlank();
    }

    public void send(String to, String name, String subject, String plain, String html) throws Exception {
        if (!isConfigured()) {
            throw new IllegalStateException("Email is not configured on the server");
        }
        MimeMessage msg = mailSender.createMimeMessage();
        // multipart = true: needed to send both a plain-text and an HTML version.
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setFrom(new InternetAddress(username, fromName));
        helper.setTo(new InternetAddress(to, name));
        helper.setSubject(subject);
        helper.setText(plain, html);
        mailSender.send(msg);
    }

    /** Sends on a background thread so the HTTP request answers at once (and takes the same time either way). */
    @Async
    public void sendAsync(String to, String name, String subject, String plain, String html) {
        try {
            send(to, name, subject, plain, html);
            log.info("Email \"{}\" sent to {}", subject, to);
        } catch (Exception e) {
            log.error("Email \"{}\" to {} failed: {}", subject, to, e.getMessage());
        }
    }

    /** The shared email frame: coloured header, white card, optional button and a small grey note under it. */
    public static String layout(String heading, String bodyHtml, String buttonText, String buttonUrl, String note) {
        String button = buttonText == null ? "" : """
                <div style="text-align:center;margin:26px 0 6px">
                  <a href="%s" style="background:#e11d48;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;font-size:14px;display:inline-block">%s</a>
                </div>
                """.formatted(esc(buttonUrl), esc(buttonText));
        String footer = note == null ? ""
                : "<p style=\"margin:18px 0 0;color:#8a8aa0;font-size:12px;text-align:center\">" + esc(note) + "</p>";
        return """
                <div style="background:#f4f4f8;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
                  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
                    <div style="background:#e11d48;padding:18px 24px;color:#ffffff;font-size:20px;font-weight:bold">CineBook &middot; %s</div>
                    <div style="padding:24px">%s%s%s</div>
                  </div>
                </div>
                """.formatted(esc(heading), bodyHtml, button, footer);
    }

    public static String esc(String s) {
        return s == null ? "" : HtmlUtils.htmlEscape(s);
    }
}
