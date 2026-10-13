package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** status: ACTIVE, SCHEDULED, EXPIRED, USED_UP or DISABLED. */
public record PromoCodeDTO(
        Long id,
        String code,
        String description,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal maxDiscount,
        BigDecimal minOrderAmount,
        LocalDateTime startsAt,
        LocalDateTime expiresAt,
        Integer usageLimit,
        Integer perUserLimit,
        boolean active,
        LocalDateTime createdAt,
        long timesUsed,
        BigDecimal totalDiscountGiven,
        String status,
        String currency) {
}
