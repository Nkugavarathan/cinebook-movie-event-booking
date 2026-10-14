package com.cinebook.cinebook.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** The full snack order for a held booking; it replaces whatever was there. An empty list removes all snacks. */
public record UpdateSnacksRequest(@NotNull(message = "Items are required") List<@Valid Item> items) {

    public record Item(
            @NotNull(message = "Snack is required") Long snackId,
            @Min(value = 0, message = "Quantity can't be negative") @Max(value = 10, message = "You can add up to 10 of each snack") int quantity) {
    }
}
