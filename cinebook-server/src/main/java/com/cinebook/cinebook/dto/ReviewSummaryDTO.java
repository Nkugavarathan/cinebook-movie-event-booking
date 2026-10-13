package com.cinebook.cinebook.dto;

import java.util.List;

/**
 * Ratings block for a movie / event page. distribution[i] = number of (i+1)-star reviews.
 * canReview + reason tell the signed-in user whether they may post (only after attending).
 */
public record ReviewSummaryDTO(
        double average,
        long count,
        long[] distribution,
        List<ReviewDTO> reviews,
        ReviewDTO myReview,
        boolean canReview,
        String reason) {
}
