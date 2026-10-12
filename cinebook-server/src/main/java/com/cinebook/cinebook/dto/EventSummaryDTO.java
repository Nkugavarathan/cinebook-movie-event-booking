package com.cinebook.cinebook.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Event card / admin row. nextDate, fromPrice and venues come from upcoming performances. */
public record EventSummaryDTO(
        Long id,
        String name,
        String description,
        String posterUrl,
        String bannerUrl,
        String category,
        String performer,
        String language,
        String ageLimit,
        int duration,
        String location,
        boolean active,
        long upcomingShows,
        LocalDate nextDate,
        BigDecimal fromPrice,
        String currency,
        String venues) {
}
