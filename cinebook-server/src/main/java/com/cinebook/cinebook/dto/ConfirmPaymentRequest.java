package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmPaymentRequest(@NotBlank(message = "sessionId is required") String sessionId) {
}
