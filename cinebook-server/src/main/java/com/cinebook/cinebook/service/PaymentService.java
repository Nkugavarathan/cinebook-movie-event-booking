package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.dto.CheckoutResponse;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.*;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.BookingSeatRepository;
import com.cinebook.cinebook.repository.ProcessedStripeEventRepository;
import com.cinebook.cinebook.security.CurrentUser;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Stripe Checkout integration. A booking is only ever marked CONFIRMED after the server itself
 * has seen a paid Checkout Session from Stripe (via webhook or by retrieving the session) -
 * nothing the browser says is trusted.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    /** Stripe requires Checkout Sessions to live at least 30 minutes. */
    private static final int SESSION_MINUTES = 30;
    private static final DateTimeFormatter SHOW_FMT = DateTimeFormatter.ofPattern("EEE d MMM, h:mm a");

    private final BookingRepository bookingRepo;
    private final BookingSeatRepository bookingSeatRepo;
    private final ProcessedStripeEventRepository processedEventRepo;
    private final BookingService bookingService;
    private final StripeGateway stripe;
    private final CurrentUser currentUser;
    private final DtoMapper mapper;

    @Value("${app.client-url}")
    private String clientUrl;

    @Transactional
    public CheckoutResponse createCheckout(Long bookingId) {
        stripe.requireConfigured();
        User user = currentUser.require();
        Booking booking = bookingRepo.findByIdForUpdate(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (!booking.getUser().getId().equals(user.getId())) {
            throw ApiException.notFound("Booking not found");
        }
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw ApiException.conflict("This booking is already paid");
        }
        if (booking.getStatus() != BookingStatus.PENDING || booking.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.conflict("Your seat hold has expired. Please select your seats again.");
        }

        // Re-use an open session so double clicks don't create two payments.
        if (booking.getStripeSessionId() != null) {
            Session existing = stripe.retrieveSession(booking.getStripeSessionId());
            if ("open".equals(existing.getStatus())) {
                return new CheckoutResponse(existing.getUrl(), existing.getId());
            }
        }

        ShowTime st = booking.getShowTime();
        String currency = booking.getCurrency();
        String description = st.getScreen().getTheater().getName() + " - " + st.getScreen().getScreenName()
                + " | " + st.getStartsAt().format(SHOW_FMT) + " | Seats " + booking.getSeatLabels();

        // One line item per seat type, e.g. "2 x Premium".
        Map<SeatType, long[]> byType = new LinkedHashMap<>(); // [quantity, unitAmount]
        for (BookingSeat bs : booking.getSeats()) {
            long unit = stripe.toMinorUnits(bs.getPrice(), currency);
            byType.computeIfAbsent(bs.getSeatType(), t -> new long[]{0, unit})[0]++;
        }

        long expiresAt = Instant.now().plusSeconds(SESSION_MINUTES * 60L + 30).getEpochSecond();
        SessionCreateParams.Builder params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setCustomerEmail(user.getEmail())
                .setClientReferenceId(String.valueOf(booking.getId()))
                .putMetadata("bookingId", String.valueOf(booking.getId()))
                .putMetadata("reference", booking.getReference())
                .setPaymentIntentData(SessionCreateParams.PaymentIntentData.builder()
                        .putMetadata("bookingId", String.valueOf(booking.getId()))
                        .putMetadata("reference", booking.getReference())
                        .setDescription("CineBook " + booking.getReference())
                        .build())
                .setExpiresAt(expiresAt)
                .setSuccessUrl(clientUrl + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(clientUrl + "/payment/cancel?booking=" + booking.getId());

        byType.forEach((type, qtyAndUnit) -> {
            SessionCreateParams.LineItem.PriceData.ProductData.Builder product =
                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                            .setName(st.getTitle() + " - " + pretty(type) + " seat")
                            .setDescription(description);
            if (st.getPosterUrl() != null && st.getPosterUrl().startsWith("https://")) {
                product.addImage(st.getPosterUrl());
            }
            params.addLineItem(SessionCreateParams.LineItem.builder()
                    .setQuantity(qtyAndUnit[0])
                    .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency(currency)
                            .setUnitAmount(qtyAndUnit[1])
                            .setProductData(product.build())
                            .build())
                    .build());
        });

        Session session = stripe.createSession(params.build());
        booking.setStripeSessionId(session.getId());
        // Keep the seats for as long as Stripe will accept the payment.
        LocalDateTime sessionEnd = LocalDateTime.ofInstant(Instant.ofEpochSecond(expiresAt), ZoneId.systemDefault());
        if (booking.getExpiresAt().isBefore(sessionEnd)) {
            booking.setExpiresAt(sessionEnd.plusMinutes(1));
        }
        bookingRepo.save(booking);
        log.info("Checkout session {} created for booking {}", session.getId(), booking.getReference());
        return new CheckoutResponse(session.getUrl(), session.getId());
    }

    /**
     * Called by the client's success page. The session id comes from the browser, but its payment
     * state is read directly from Stripe, so it can't be forged.
     */
    @Transactional
    public BookingResponseDTO confirmFromRedirect(String sessionId) {
        User user = currentUser.require();
        Session session = stripe.retrieveSession(sessionId);
        Long bookingId = bookingIdOf(session);
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (!booking.getUser().getId().equals(user.getId())) {
            throw ApiException.notFound("Booking not found");
        }
        return mapper.booking(applySession(session));
    }

    /** Handles a verified Stripe webhook. Duplicate deliveries of the same event are ignored. */
    @Transactional
    public String handleWebhook(String payload, String signature) {
        Event event = stripe.verifyWebhook(payload, signature);
        if (processedEventRepo.existsById(event.getId())) {
            log.info("Duplicate Stripe event {} ignored", event.getId());
            return "duplicate";
        }

        switch (event.getType()) {
            case "checkout.session.completed", "checkout.session.async_payment_succeeded" ->
                    applySession(sessionOf(event));
            case "checkout.session.expired", "checkout.session.async_payment_failed" -> {
                Session session = sessionOf(event);
                bookingRepo.findByStripeSessionId(session.getId()).ifPresent(b -> {
                    Booking locked = bookingRepo.findByIdForUpdate(b.getId()).orElseThrow();
                    if (locked.getStatus() == BookingStatus.PENDING) {
                        bookingService.release(locked, BookingStatus.EXPIRED);
                        log.info("Checkout for {} ended without payment; seats released", locked.getReference());
                    }
                });
            }
            default -> log.debug("Ignoring Stripe event type {}", event.getType());
        }

        processedEventRepo.save(new ProcessedStripeEvent(event.getId(), event.getType(), LocalDateTime.now()));
        return "ok";
    }

    /**
     * Applies the Stripe session state to its booking. Idempotent and serialized by a row lock,
     * so the webhook and the redirect can race safely.
     */
    private Booking applySession(Session session) {
        Booking booking = bookingRepo.findByIdForUpdate(bookingIdOf(session))
                .orElseThrow(() -> ApiException.notFound("Booking not found"));

        if (!"paid".equals(session.getPaymentStatus())) {
            return booking; // still processing or unpaid; nothing to do yet
        }
        if (booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.REFUNDED) {
            return booking; // already handled
        }

        String paymentIntent = session.getPaymentIntent();
        long expected = stripe.toMinorUnits(booking.getTotalAmount(), booking.getCurrency());
        if (session.getAmountTotal() == null || session.getAmountTotal() != expected
                || !booking.getCurrency().equalsIgnoreCase(session.getCurrency())) {
            log.error("Amount mismatch for {}: expected {} {}, Stripe says {} {}", booking.getReference(),
                    expected, booking.getCurrency(), session.getAmountTotal(), session.getCurrency());
            refundAndClose(booking, paymentIntent);
            return booking;
        }

        if (booking.getStatus() == BookingStatus.PENDING) {
            confirm(booking, session, paymentIntent);
            return booking;
        }

        // Paid after the hold expired / was cancelled: re-take the seats if nobody else did.
        List<Long> seatIds = booking.getSeats().stream().map(bs -> bs.getSeat().getId()).toList();
        if (bookingSeatRepo.findLockedForSeats(booking.getShowTime().getId(), seatIds).isEmpty()) {
            booking.getSeats().forEach(bs -> bs.setLocked(Boolean.TRUE));
            confirm(booking, session, paymentIntent);
            log.info("Late payment for {} accepted; seats were still free", booking.getReference());
        } else {
            log.warn("Late payment for {} but seats were re-sold; refunding", booking.getReference());
            refundAndClose(booking, paymentIntent);
        }
        return booking;
    }

    private void confirm(Booking booking, Session session, String paymentIntent) {
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(LocalDateTime.now());
        booking.setStripeSessionId(session.getId());
        booking.setStripePaymentIntentId(paymentIntent);
        booking.setCancelledAt(null);
        bookingRepo.saveAndFlush(booking);
        log.info("Booking {} CONFIRMED ({} {})", booking.getReference(), booking.getTotalAmount(), booking.getCurrency());
    }

    private void refundAndClose(Booking booking, String paymentIntent) {
        booking.setStripePaymentIntentId(paymentIntent);
        if (paymentIntent != null) {
            booking.setStripeRefundId(stripe.refund(paymentIntent));
        }
        bookingService.release(booking, BookingStatus.REFUNDED);
    }

    private static Long bookingIdOf(Session session) {
        String id = session.getMetadata() != null ? session.getMetadata().get("bookingId") : null;
        if (id == null) id = session.getClientReferenceId();
        if (id == null) throw ApiException.badRequest("Payment session is not linked to a booking");
        return Long.valueOf(id);
    }

    private static Session sessionOf(Event event) {
        StripeObject obj = event.getDataObjectDeserializer().getObject().orElseGet(() -> {
            try {
                return event.getDataObjectDeserializer().deserializeUnsafe();
            } catch (EventDataObjectDeserializationException e) {
                throw ApiException.badRequest("Unreadable Stripe event");
            }
        });
        if (!(obj instanceof Session session)) {
            throw ApiException.badRequest("Unexpected Stripe object");
        }
        return session;
    }

    private static String pretty(SeatType type) {
        String n = type.name().toLowerCase();
        return type == SeatType.VIP ? "VIP" : Character.toUpperCase(n.charAt(0)) + n.substring(1);
    }
}
