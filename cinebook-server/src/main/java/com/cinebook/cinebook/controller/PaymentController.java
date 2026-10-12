package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.dto.CheckoutRequest;
import com.cinebook.cinebook.dto.CheckoutResponse;
import com.cinebook.cinebook.dto.ConfirmPaymentRequest;
import com.cinebook.cinebook.service.PaymentService;
import com.cinebook.cinebook.service.StripeGateway;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final StripeGateway stripeGateway;

    @GetMapping("/config")
    public Map<String, Object> config() {
        return Map.of("enabled", stripeGateway.isConfigured(), "webhook", stripeGateway.isWebhookConfigured());
    }

    /** Starts Stripe Checkout for a held booking and returns the hosted payment page URL. */
    @PostMapping("/checkout/{bookingId}")
    public CheckoutResponse checkout(@PathVariable Long bookingId, @Valid @RequestBody CheckoutRequest contact) {
        return paymentService.createCheckout(bookingId, contact);
    }

    /** Success page calls this; the server checks the session with Stripe before confirming. */
    @PostMapping("/confirm")
    public BookingResponseDTO confirm(@Valid @RequestBody ConfirmPaymentRequest request) {
        return paymentService.confirmFromRedirect(request.sessionId());
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody String payload,
                                          @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        try {
            return ResponseEntity.ok(paymentService.handleWebhook(payload, signature));
        } catch (DataIntegrityViolationException e) {
            // Same event delivered twice at the same moment; the other delivery handled it.
            log.info("Concurrent duplicate webhook ignored");
            return ResponseEntity.ok("duplicate");
        }
    }
}
