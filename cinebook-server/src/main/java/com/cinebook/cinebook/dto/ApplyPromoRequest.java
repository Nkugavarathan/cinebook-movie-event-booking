package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApplyPromoRequest(@NotBlank(message = "Enter a promo code") @Size(max = 40) String code) {
}
