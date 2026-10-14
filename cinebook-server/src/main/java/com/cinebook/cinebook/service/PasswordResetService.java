package com.cinebook.cinebook.service;

import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.PasswordResetToken;
import com.cinebook.cinebook.model.User;
import com.cinebook.cinebook.repository.PasswordResetTokenRepository;
import com.cinebook.cinebook.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

import static com.cinebook.cinebook.service.EmailService.esc;

/**
 * "Forgot password": emails a one-time link that expires after app.auth.reset-minutes.
 * The answer never says whether an email has an account, so the form can't be used to find users.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepo;
    private final PasswordResetTokenRepository tokenRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService email;

    @Value("${app.auth.reset-minutes:30}")
    private int resetMinutes;

    @Value("${app.client-url}")
    private String clientUrl;

    @Transactional
    public void requestReset(String rawEmail) {
        User user = userRepo.findByEmailIgnoreCase(rawEmail.trim()).orElse(null);
        if (user == null || user.isBlocked()) {
            log.info("Password reset asked for unknown or blocked email {}", rawEmail.trim());
            return;
        }
        // One email per minute per account, so the form can't be used to flood someone's inbox.
        LocalDateTime now = LocalDateTime.now();
        if (tokenRepo.existsByUserIdAndCreatedAtAfter(user.getId(), now.minusMinutes(1))) {
            return;
        }
        // A new link replaces any older link that was not used yet.
        tokenRepo.findByUserIdAndUsedAtIsNull(user.getId()).forEach(t -> t.setUsedAt(now));

        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokenRepo.save(PasswordResetToken.builder()
                .user(user)
                .tokenHash(hash(token))
                .createdAt(now)
                .expiresAt(now.plusMinutes(resetMinutes))
                .build());

        String link = clientUrl + "/reset-password?token=" + token;
        if (!email.isConfigured()) {
            log.warn("MAIL_USERNAME / MAIL_PASSWORD not set - reset email not sent. Dev only, reset link for {}: {}",
                    user.getEmail(), link);
            return;
        }
        String body = """
                <p style="margin:0 0 4px;color:#15151f;font-size:16px">Hi %s,</p>
                <p style="margin:0 0 8px;color:#4b4b5c;font-size:14px">We got a request to reset the password for your CineBook account. Click the button to choose a new one.</p>
                <p style="margin:0;color:#4b4b5c;font-size:14px">This link works once and expires in %d minutes.</p>
                """.formatted(esc(user.getName()), resetMinutes);
        email.sendAsync(user.getEmail(), user.getName(), "Reset your CineBook password",
                "Hi " + user.getName() + ",\n\nReset your CineBook password here (valid for " + resetMinutes + " minutes):\n"
                        + link + "\n\nDidn't ask for this? Ignore this email.\n\nCineBook",
                EmailService.layout("Reset password", body, "Choose a new password", link,
                        "Didn't ask for this? You can ignore this email - your password stays the same."));
    }

    /** Lets the reset page say early that a link is old, before the user types a new password. */
    @Transactional(readOnly = true)
    public boolean isValid(String token) {
        return token != null && !token.isBlank()
                && tokenRepo.findByTokenHash(hash(token)).map(PasswordResetToken::isUsable).orElse(false);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken t = tokenRepo.findByTokenHash(hash(token))
                .filter(PasswordResetToken::isUsable)
                .orElseThrow(() -> ApiException.badRequest("This reset link is invalid or has expired. Please ask for a new one."));
        User user = t.getUser();
        if (user.isBlocked()) {
            throw ApiException.forbidden("This account has been blocked. Please contact CineBook support.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
        LocalDateTime now = LocalDateTime.now();
        tokenRepo.findByUserIdAndUsedAtIsNull(user.getId()).forEach(other -> other.setUsedAt(now));
        log.info("Password reset for {}", user.getEmail());
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
