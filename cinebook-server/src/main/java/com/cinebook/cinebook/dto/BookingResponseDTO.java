package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponseDTO(
        Long id,
        String reference,
        BookingStatus status,
        BigDecimal totalAmount,
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
        String stripePaymentIntentId,
        String stripeRefundId) {
}
