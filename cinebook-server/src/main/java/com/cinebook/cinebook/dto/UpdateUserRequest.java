package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.Role;
import jakarta.validation.constraints.Size;

/** Partial update; null fields are left unchanged. */
public record UpdateUserRequest(
        @Size(max = 80) String name,
        Role role,
        Boolean blocked,
        @Size(min = 6, message = "Password must be at least 6 characters") String password) {
}
