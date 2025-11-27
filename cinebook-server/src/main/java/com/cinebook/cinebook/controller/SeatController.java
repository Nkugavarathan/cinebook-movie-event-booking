package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.SeatDTO;
import com.cinebook.cinebook.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/seats")
@RequiredArgsConstructor
public class SeatController {

    private final SeatService seatService;

    // seat grid for a screen (availability at showtime level checked separately)
    @GetMapping("/screen/{screenId}")
    public List<SeatDTO> getSeats(@PathVariable Long screenId) {
        return seatService.getSeatsForScreen(screenId);
    }
    @GetMapping("/screen/{screenId}/showtime/{showTimeId}")
    public List<SeatDTO> getSeats(
            @PathVariable Long screenId,
            @PathVariable Long showTimeId
    ) {
        return seatService.getSeatsForShowtime(screenId, showTimeId);
    }
    // get booked seat ids for a showtime
    @GetMapping("/booked/{showTimeId}")
    public List<Long> getBooked(@PathVariable Long showTimeId) {
        return seatService.getBookedSeatIdsForShowtime(showTimeId);
    }
}
