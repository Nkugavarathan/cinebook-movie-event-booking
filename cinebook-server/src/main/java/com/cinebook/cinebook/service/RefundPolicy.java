package com.cinebook.cinebook.service;

import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * When a customer may cancel a paid ticket themselves, and how much they get back.
 * Configured with app.booking.refund-cutoff-hours and app.booking.refund-fee-percent.
 */
@Component
public class RefundPolicy {

    @Value("${app.booking.refund-cutoff-hours:24}")
    private int cutoffHours;

    @Value("${app.booking.refund-fee-percent:0}")
    private BigDecimal feePercent;

    /** Last moment the customer can cancel for a refund. */
    public LocalDateTime deadline(Booking b) {
        return b.getShowTime().getStartsAt().minusHours(cutoffHours);
    }

    public boolean isRefundable(Booking b) {
        return b.getStatus() == BookingStatus.CONFIRMED
                && b.getStripePaymentIntentId() != null
                && LocalDateTime.now().isBefore(deadline(b));
    }

    /** Amount returned to the customer after the cancellation fee. */
    public BigDecimal customerRefundAmount(Booking b) {
        BigDecimal keep = BigDecimal.valueOf(100).subtract(feePercent);
        return b.getTotalAmount().multiply(keep).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    public int cutoffHours() {
        return cutoffHours;
    }

    public BigDecimal feePercent() {
        return feePercent;
    }
}
