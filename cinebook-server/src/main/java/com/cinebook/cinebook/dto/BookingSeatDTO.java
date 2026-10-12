package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.SeatType;

import java.math.BigDecimal;

public record BookingSeatDTO(Long seatId, String label, SeatType type, BigDecimal price) {
}
