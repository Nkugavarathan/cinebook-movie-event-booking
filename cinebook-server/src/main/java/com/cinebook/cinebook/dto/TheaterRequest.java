package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.NotBlank;

public record TheaterRequest(
        @NotBlank(message = "Name is required") String name,
        @NotBlank(message = "City is required") String city,
        String address,
        String facilities) {
}
