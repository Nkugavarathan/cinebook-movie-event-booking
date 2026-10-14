package com.cinebook.cinebook.dto;

import java.math.BigDecimal;

public record SnackDTO(
        Long id,
        String name,
        String description,
        String category,
        BigDecimal price,
        String imageUrl,
        boolean active,
        String currency,
        /** Units sold on paid bookings (admin list only; 0 on the public menu). */
        long unitsSold) {
}
