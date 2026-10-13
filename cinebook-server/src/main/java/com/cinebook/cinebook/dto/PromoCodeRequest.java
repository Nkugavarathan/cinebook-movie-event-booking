package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.DiscountType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromoCodeRequest(
        @NotBlank(message = "Code is required")
        @Pattern(regexp = "^[A-Za-z0-9_-]{3,40}$", message = "Code: 3-40 letters, numbers, - or _")
        String code,
        @Size(max = 200) String description,
        @NotNull(message = "Choose percent or fixed amount") DiscountType discountType,
        @NotNull(message = "Discount value is required") @DecimalMin(value = "0.01", message = "Discount must be more than 0") BigDecimal discountValue,
        @DecimalMin(value = "0.01", message = "Max discount must be more than 0") BigDecimal maxDiscount,
        @DecimalMin(value = "0", message = "Minimum order can't be negative") BigDecimal minOrderAmount,
        LocalDateTime startsAt,
        LocalDateTime expiresAt,
        @Min(value = 1, message = "Usage limit must be at least 1") Integer usageLimit,
        @Min(value = 1, message = "Per-customer limit must be at least 1") Integer perUserLimit,
        Boolean active) {
}
