package com.cinebook.cinebook.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Door stats for one showtime; recent is only filled on the detail call. */
public record CheckInShowDTO(
        Long showtimeId,
        String kind,
        String title,
        String posterUrl,
        String theaterName,
        String screenName,
        LocalDate showDate,
        LocalTime startTime,
        LocalTime endTime,
        long soldSeats,
        long checkedInSeats,
        List<BookingResponseDTO> recent) {
}
