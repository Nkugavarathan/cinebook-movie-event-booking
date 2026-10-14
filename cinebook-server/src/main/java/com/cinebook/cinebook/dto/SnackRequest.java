package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SnackRequest(
        @NotBlank(message = "Name is required") @Size(max = 80, message = "Name can be up to 80 characters") String name,
        @Size(max = 300, message = "Description can be up to 300 characters") String description,
        @Size(max = 40, message = "Category can be up to 40 characters") String category,
        @NotNull(message = "Price is required") @DecimalMin(value = "0.01", message = "Price must be more than 0") BigDecimal price,
        @Size(max = 1000) String imageUrl,
        Boolean active) {
}
