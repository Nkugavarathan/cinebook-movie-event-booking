package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.SeatType;

/** One cell of a screen layout sent by the admin seat designer. */
public record SeatLayoutDTO(int row, int col, SeatType type, boolean active) {
}
