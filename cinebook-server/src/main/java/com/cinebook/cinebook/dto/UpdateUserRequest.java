package com.cinebook.cinebook.dto;

import com.cinebook.cinebook.model.Role;
import jakarta.validation.constraints.Size;

/** Partial update; null fields are left unchanged. Admins never see or set passwords. */
public record UpdateUserRequest(
        @Size(max = 80) String name,
        Role role,
        Boolean blocked) {
}
