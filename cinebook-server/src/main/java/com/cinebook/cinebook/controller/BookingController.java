package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.BookingRequestDTO;
import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // create booking (returns booking record; payment handled separately)
    @PostMapping("/create")
    public ResponseEntity<BookingResponseDTO> create(@RequestBody BookingRequestDTO req) {
        BookingResponseDTO resp = bookingService.createBooking(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @GetMapping("/{id}")
    public BookingResponseDTO get(@PathVariable Long id) {
        return bookingService.getBooking(id);
    }
}
