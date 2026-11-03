package com.cinebook.cinebook.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
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
        addLogo(helper);
        mailSender.send(msg);
    }

    /** Content id of the logo embedded in every email; the header's img points at it. */
    public static final String LOGO_CID = "cinebook-logo";

    /** Embeds the logo so it shows without the mail client fetching anything. Call after setText. */
    public static void addLogo(MimeMessageHelper helper) throws MessagingException {
        helper.addInline(LOGO_CID, new ClassPathResource("brand/logo.png"), "image/png");
    }

    /** White band with the logo, an optional label on the right, underlined in the accent colour. */
    public static String header(String label, String accent) {
        return """
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="border-bottom:4px solid %s">
                  <tr>
                    <td style="padding:18px 24px"><img src="cid:%s" alt="CineBook" width="139" height="32" style="display:block;border:0;width:139px;height:32px;color:#e11d48;font-size:20px;font-weight:bold"></td>
                    <td align="right" style="padding:18px 24px;color:%s;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">%s</td>
                  </tr>
                </table>
                """.formatted(accent, LOGO_CID, accent, esc(label));
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
                    %s
                    <div style="padding:24px">%s%s%s</div>
                  </div>
                </div>
                """.formatted(header(heading, "#e11d48"), bodyHtml, button, footer);
    }

    public static String esc(String s) {
        return s == null ? "" : HtmlUtils.htmlEscape(s);
    }
}
