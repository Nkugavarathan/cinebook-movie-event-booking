package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** code: the QR content ("CINEBOOK:CB-XXXXXXX") or the reference typed by hand. showtimeId: the show being admitted (optional). */
public record CheckInRequest(@NotBlank(message = "Scan or type a ticket code") @Size(max = 64) String code, Long showtimeId) {
}
