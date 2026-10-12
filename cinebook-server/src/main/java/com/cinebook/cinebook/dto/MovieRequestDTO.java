package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MovieRequestDTO(
        @NotBlank(message = "Title is required") String title,
        String description,
        String posterUrl,
        String backdropUrl,
        String trailerUrl,
        @NotNull(message = "Duration is required") @Min(value = 1, message = "Duration must be positive") Integer duration,
        String genre,
        String language,
        String certificate,
        String director,
        String castMembers,
        LocalDate releaseDate,
        Boolean active) {
}
