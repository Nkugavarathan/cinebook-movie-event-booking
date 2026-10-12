package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.SeatType;

import java.math.BigDecimal;

/**
 * status: AVAILABLE, HELD (someone is paying), BOOKED; null in a layout-only view.
 */
public record SeatDTO(Long id, int row, int col, String label, SeatType type, boolean active,
                      String status, BigDecimal price) {
}
