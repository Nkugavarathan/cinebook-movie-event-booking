package com.cinebook.cinebook.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A user row in the admin Users page, with confirmed-booking stats. */
public record AdminUserDTO(
        Long id,
        String name,
        String email,
        String role,
        boolean blocked,
        LocalDateTime createdAt,
        long bookings,
        BigDecimal totalSpent,
        LocalDateTime lastBookingAt,
        boolean self) {
}
