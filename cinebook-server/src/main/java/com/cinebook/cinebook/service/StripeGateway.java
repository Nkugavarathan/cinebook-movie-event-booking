package com.cinebook.cinebook.service;

import com.cinebook.cinebook.exception.ApiException;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Set;

/** Thin wrapper over the Stripe SDK so the rest of the code never touches API keys. */
@Slf4j
@Component
public class StripeGateway {

    /** Currencies Stripe expects in whole units rather than cents. */
    private static final Set<String> ZERO_DECIMAL = Set.of(
            "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf");

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @PostConstruct
    void init() {
        if (isConfigured()) {
            Stripe.apiKey = secretKey;
            log.info("Stripe configured ({} mode)", secretKey.startsWith("sk_live") ? "LIVE" : "test");
        } else {
            log.warn("STRIPE_SECRET_KEY is not set - checkout is disabled until you add it to cinebook-server/.env");
        }
    }

    public boolean isConfigured() {
        return secretKey != null && secretKey.startsWith("sk_");
    }

    public boolean isWebhookConfigured() {
        return webhookSecret != null && webhookSecret.startsWith("whsec_");
    }

    public void requireConfigured() {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Online payments are not configured yet. Add STRIPE_SECRET_KEY to the server .env file.");
        }
    }

    public Session createSession(SessionCreateParams params) {
        requireConfigured();
        try {
            return Session.create(params);
        } catch (StripeException e) {
            log.error("Stripe session create failed", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not start payment: " + e.getUserMessage());
        }
    }

    public Session retrieveSession(String sessionId) {
        requireConfigured();
        try {
            return Session.retrieve(sessionId);
        } catch (StripeException e) {
            throw ApiException.badRequest("Unknown payment session");
        }
    }

    /** Best effort: stops an abandoned checkout from being paid later. */
    public void expireSessionQuietly(String sessionId) {
        if (!isConfigured() || sessionId == null) return;
        try {
            Session session = Session.retrieve(sessionId);
            if ("open".equals(session.getStatus())) {
                session.expire();
            }
        } catch (StripeException e) {
            log.debug("Could not expire session {}: {}", sessionId, e.getMessage());
        }
    }

    public String refund(String paymentIntentId) {
        return refund(paymentIntentId, null);
    }

    /** @param amountMinor amount in the smallest currency unit, or null for a full refund */
    public String refund(String paymentIntentId, Long amountMinor) {
        requireConfigured();
        try {
            RefundCreateParams.Builder params = RefundCreateParams.builder().setPaymentIntent(paymentIntentId);
            if (amountMinor != null) params.setAmount(amountMinor);
            Refund refund = Refund.create(params.build());
            return refund.getId();
        } catch (StripeException e) {
            log.error("Refund failed for {}", paymentIntentId, e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Refund failed: " + e.getUserMessage());
        }
    }

    public Event verifyWebhook(String payload, String signature) {
        if (!isWebhookConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Webhook secret not configured");
        }
        try {
            return Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw ApiException.badRequest("Invalid Stripe signature");
        }
    }

    /** Converts an amount to Stripe's smallest currency unit. */
    public long toMinorUnits(BigDecimal amount, String currency) {
        if (ZERO_DECIMAL.contains(currency.toLowerCase())) {
            return amount.setScale(0, RoundingMode.HALF_UP).longValueExact();
        }
        return amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
    }
}
