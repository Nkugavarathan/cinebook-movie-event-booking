package com.cinebook.cinebook.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record ShowtimeResponseDTO(
        Long id,
        LocalDate showDate,
        LocalTime startTime,
        LocalTime endTime,
        BigDecimal priceStandard,
        BigDecimal pricePremium,
        BigDecimal priceVip,
        String currency,
        Long movieId,
        String movieTitle,
        String moviePosterUrl,
        String movieBackdropUrl,
        int movieDuration,
        String certificate,
        String language,
        Long screenId,
        String screenName,
        String format,
        Long theaterId,
        String theaterName,
        String city,
        String address,
        Long totalSeats,
        Long availableSeats,
        boolean bookable) {
}
