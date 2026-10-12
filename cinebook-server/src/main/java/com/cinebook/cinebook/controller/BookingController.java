package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.BookingRequestDTO;
import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Bookings of the signed-in user. The user always comes from the JWT, never the request body. */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /** Holds the selected seats; pay for them with POST /api/payments/checkout/{id}. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponseDTO hold(@Valid @RequestBody BookingRequestDTO request) {
        return bookingService.hold(request);
    }

    @GetMapping("/my")
    public List<BookingResponseDTO> myBookings() {
        return bookingService.myBookings();
    }

    @GetMapping("/{id}")
    public BookingResponseDTO getBooking(@PathVariable Long id) {
        return bookingService.getForCurrentUser(id);
    }

    @PostMapping("/{id}/cancel")
    public BookingResponseDTO cancel(@PathVariable Long id) {
        return bookingService.cancelPending(id);
    }
}
