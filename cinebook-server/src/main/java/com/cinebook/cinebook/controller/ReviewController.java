package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.ReviewDTO;
import com.cinebook.cinebook.dto.ReviewRequest;
import com.cinebook.cinebook.dto.ReviewSummaryDTO;
import com.cinebook.cinebook.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /** Public; when signed in also tells whether the user may review. */
    @GetMapping("/api/movies/{id}/reviews")
    public ReviewSummaryDTO movieReviews(@PathVariable Long id) {
        return reviewService.forMovie(id);
    }

    @GetMapping("/api/events/{id}/reviews")
    public ReviewSummaryDTO eventReviews(@PathVariable Long id) {
        return reviewService.forEvent(id);
    }

    /** Create or update your review (only after attending). */
    @PostMapping("/api/reviews")
    public ReviewDTO save(@Valid @RequestBody ReviewRequest request) {
        return reviewService.upsert(request);
    }

    @DeleteMapping("/api/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        reviewService.deleteOwn(id);
    }
}
