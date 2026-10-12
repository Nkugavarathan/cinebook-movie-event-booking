package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.SeatMapDTO;
import com.cinebook.cinebook.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** Live seat availability for a showtime. */
@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class SeatController {

    private final SeatService seatService;

    @GetMapping("/{showTimeId}/seats")
    public SeatMapDTO getSeatMap(@PathVariable Long showTimeId) {
        return seatService.getSeatMap(showTimeId);
    }
}
