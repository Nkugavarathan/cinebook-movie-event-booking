package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** Set exactly one of movieId / eventId. */
public record ReviewRequest(
        Long movieId,
        Long eventId,
        @Min(value = 1, message = "Pick 1 to 5 stars") @Max(value = 5, message = "Pick 1 to 5 stars") int rating,
        @Size(max = 1000, message = "Keep your review under 1000 characters") String comment) {
}
