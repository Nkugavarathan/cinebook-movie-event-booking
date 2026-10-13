package com.cinebook.cinebook.dto;

/**
 * result: CHECKED_IN (admit) or a reason to refuse: ALREADY_CHECKED_IN, NOT_FOUND, NOT_PAID, CANCELLED,
 * REFUNDED, WRONG_SHOW, TOO_EARLY, SHOW_ENDED. ok is true only for CHECKED_IN.
 */
public record CheckInResultDTO(boolean ok, String result, String title, String message,
                               BookingResponseDTO booking, CheckInShowDTO show) {
}
