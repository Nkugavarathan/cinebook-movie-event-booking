package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EventRequestDTO(
        @NotBlank(message = "Name is required") String name,
        String description,
        String posterUrl,
        String bannerUrl,
        @NotBlank(message = "Category is required") String category,
        String performer,
        String language,
        String ageLimit,
        @NotNull(message = "Duration is required") @Min(value = 1, message = "Duration must be positive") Integer duration,
        String location,
        Boolean active) {
}
