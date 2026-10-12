package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "Name is required") @Size(max = 80) String name,
        @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
        @NotBlank(message = "Password is required") @Size(min = 6, message = "Password must be at least 6 characters") String password,
        @NotNull(message = "Role is required") Role role) {
}
