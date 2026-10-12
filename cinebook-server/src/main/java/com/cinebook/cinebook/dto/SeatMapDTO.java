package com.cinebook.cinebook.dto;

import java.util.List;

public record SeatMapDTO(ShowtimeResponseDTO showtime, int rows, int columns, List<SeatDTO> seats,
                         int holdMinutes, int maxSeats) {
}
