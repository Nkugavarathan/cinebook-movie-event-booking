package com.cinebook.cinebook.dto;

import java.time.LocalDateTime;

/** userEmail is only filled for admins. */
public record ReviewDTO(
        Long id,
        String kind,
        Long listingId,
        String listingTitle,
        int rating,
        String comment,
        String userName,
        String userEmail,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean hidden,
        boolean mine) {
}
