package com.cinebook.cinebook.dto;

import java.time.LocalDate;

public record MovieSummaryDTO(
        Long id,
        String title,
        String description,
        String posterUrl,
        String backdropUrl,
        String trailerUrl,
        int duration,
        String genre,
        String language,
        String certificate,
        String director,
        String castMembers,
        LocalDate releaseDate,
        boolean active,
        long upcomingShows) {
}
