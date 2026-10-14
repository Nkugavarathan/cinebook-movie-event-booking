package com.cinebook.cinebook.dto;

import java.math.BigDecimal;

public record BookingSnackDTO(Long snackId, String name, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
}
