package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.ShowtimeResponseDTO;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.service.ShowtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @PostMapping
    public ResponseEntity<ShowTime> create(@RequestBody ShowTime showTime) {
        ShowTime saved = showtimeService.createShowtime(showTime);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // aggregated endpoints
    @GetMapping("/movie/{movieId}")
    public List<ShowtimeResponseDTO> getByMovieAndDate(@PathVariable Long movieId, @RequestParam("date") String date) {
        LocalDate d = LocalDate.parse(date);
        return showtimeService.getShowtimesForMovieOnDate(movieId, d);
    }

    @GetMapping("/screen/{screenId}")
    public List<ShowtimeResponseDTO> getByScreenAndDate(@PathVariable Long screenId, @RequestParam("date") String date) {
        LocalDate d = LocalDate.parse(date);
        return showtimeService.getShowtimesForScreenOnDate(screenId, d);
    }
}
