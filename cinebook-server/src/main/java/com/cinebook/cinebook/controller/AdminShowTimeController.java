package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.SeatMapDTO;
import com.cinebook.cinebook.dto.ShowtimeRequest;
import com.cinebook.cinebook.dto.ShowtimeResponseDTO;
import com.cinebook.cinebook.service.SeatService;
import com.cinebook.cinebook.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/showtimes")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminShowTimeController {

    private final ShowtimeService showtimeService;
    private final SeatService seatService;

    @GetMapping
    public List<ShowtimeResponseDTO> getShowTimes(
            @RequestParam(required = false) String kind,
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) Long eventId,
            @RequestParam(required = false) Long theaterId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return showtimeService.search(kind, movieId, eventId, theaterId, date);
    }

    /** Creates one showtime per start time in the request. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<ShowtimeResponseDTO> addShowTimes(@Valid @RequestBody ShowtimeRequest request) {
        return showtimeService.create(request);
    }

    /** Occupancy view of a showtime. */
    @GetMapping("/{id}/seats")
    public SeatMapDTO seats(@PathVariable Long id) {
        return seatService.getSeatMap(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteShowTime(@PathVariable Long id) {
        showtimeService.delete(id);
    }
}
