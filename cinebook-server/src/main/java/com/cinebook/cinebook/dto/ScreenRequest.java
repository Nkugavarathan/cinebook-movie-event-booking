package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** seats is optional; cells not listed default to an active STANDARD seat. */
public record ScreenRequest(
        @NotNull(message = "Theater is required") Long theaterId,
        @NotBlank(message = "Screen name is required") String screenName,
        String format,
        @Min(value = 1, message = "At least 1 row") @Max(value = 26, message = "At most 26 rows") int rows,
        @Min(value = 1, message = "At least 1 column") @Max(value = 40, message = "At most 40 columns") int columns,
        List<SeatLayoutDTO> seats) {
}
