package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BookingRequestDTO(
        @NotNull(message = "Showtime is required") Long showTimeId,
        @NotEmpty(message = "Select at least one seat") List<Long> seatIds) {
}
