package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ShowtimeRequest(
        /** Set exactly one of movieId / eventId. */
        Long movieId,
        Long eventId,
        @NotNull(message = "Screen is required") Long screenId,
        @NotNull(message = "Date is required") LocalDate showDate,
        @NotEmpty(message = "Add at least one start time") List<LocalTime> startTimes,
        @NotNull(message = "Standard price is required") @DecimalMin(value = "0.5", message = "Price is too low") BigDecimal priceStandard,
        BigDecimal pricePremium,
        BigDecimal priceVip) {
}
