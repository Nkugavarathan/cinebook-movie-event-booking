package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponseDTO(
        Long id,
        String reference,
        BookingStatus status,
        /** What the customer pays (after any promo discount). */
        BigDecimal totalAmount,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        String promoCode,
        String currency,
        String seatLabels,
        List<BookingSeatDTO> seats,
        ShowtimeResponseDTO showtime,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        LocalDateTime confirmedAt,
        LocalDateTime cancelledAt,
        Long userId,
        String userName,
        String userEmail,
        String contactName,
        String contactEmail,
        String contactPhone,
        String stripePaymentIntentId,
        String stripeRefundId,
        /** Whether the customer can still cancel this booking for a refund. */
        boolean refundable,
        LocalDateTime refundDeadline,
        /** Refunded amount, or for a refundable booking the amount they would get back. */
        BigDecimal refundAmount,
        String cancelledBy,
        LocalDateTime ticketEmailedAt,
        LocalDateTime refundEmailedAt) {
}
