package com.cinebook.cinebook.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * A performance of a movie or an event. For events the movie* fields carry the event's
 * title/poster/duration so the seat, checkout and ticket screens work unchanged;
 * use {@code kind} with {@code movieId} / {@code eventId} to link back to the listing.
 */
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
        boolean bookable,
        String kind,
        Long eventId,
        String category,
        /** Seats sold (paid) and seats already checked in at the door. */
        Long soldSeats,
        Long checkedInSeats) {
}
