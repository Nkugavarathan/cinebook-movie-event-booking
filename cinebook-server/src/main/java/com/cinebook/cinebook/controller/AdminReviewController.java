package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.ReviewDTO;
import com.cinebook.cinebook.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public List<ReviewDTO> list() {
        return reviewService.adminList();
    }

    /** Body: {"hidden": true|false} */
    @PatchMapping("/{id}")
    public ReviewDTO setHidden(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return reviewService.setHidden(id, Boolean.TRUE.equals(body.get("hidden")));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        reviewService.adminDelete(id);
    }
}
