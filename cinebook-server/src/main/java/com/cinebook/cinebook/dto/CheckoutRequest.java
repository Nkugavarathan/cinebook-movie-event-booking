package com.cinebook.cinebook.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Contact details collected before payment; the ticket is issued to this person. */
public record CheckoutRequest(
        @NotBlank(message = "Name is required") @Size(max = 80, message = "Name is too long") String name,
        @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^\\+?[0-9][0-9 ()-]{6,18}[0-9]$", message = "Enter a valid mobile number")
        String phone) {
}
