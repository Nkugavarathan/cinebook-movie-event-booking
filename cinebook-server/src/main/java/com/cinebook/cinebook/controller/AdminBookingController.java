package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.model.BookingStatus;
import com.cinebook.cinebook.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/bookings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminBookingController {

    private final BookingService bookingService;

    @GetMapping
    public List<BookingResponseDTO> list(@RequestParam(required = false) BookingStatus status,
                                         @RequestParam(required = false) String q) {
        return bookingService.adminSearch(status, q);
    }

    @GetMapping("/{id}")
    public BookingResponseDTO get(@PathVariable Long id) {
        return bookingService.adminGet(id);
    }

    /** Cancels a hold, or cancels and refunds a paid booking through Stripe. */
    @PostMapping("/{id}/cancel")
    public BookingResponseDTO cancel(@PathVariable Long id) {
        return bookingService.adminCancel(id);
    }
}
