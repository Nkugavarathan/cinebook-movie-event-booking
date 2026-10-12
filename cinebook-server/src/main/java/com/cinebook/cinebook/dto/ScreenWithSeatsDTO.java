package com.cinebook.cinebook.dto;

import java.util.List;

public record ScreenWithSeatsDTO(
        Long id,
        String screenName,
        String format,
        int rows,
        int columns,
        Long theaterId,
        String theaterName,
        String city,
        long activeSeats,
        boolean hasShowtimes,
        List<SeatDTO> seats) {
}
