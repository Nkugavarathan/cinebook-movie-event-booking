package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.dto.CheckInRequest;
import com.cinebook.cinebook.dto.CheckInResultDTO;
import com.cinebook.cinebook.dto.CheckInShowDTO;
import com.cinebook.cinebook.service.CheckInService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Door scanner API for staff and admins. */
@RestController
@RequestMapping("/api/admin/checkin")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminCheckInController {

    private final CheckInService checkInService;

    @GetMapping("/shows")
    public List<CheckInShowDTO> shows(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return checkInService.shows(date);
    }

    @GetMapping("/shows/{id}")
    public CheckInShowDTO show(@PathVariable Long id) {
        return checkInService.show(id);
    }

    /** Always 200: the body says whether to admit (ok) and why not. */
    @PostMapping("/scan")
    public CheckInResultDTO scan(@Valid @RequestBody CheckInRequest request) {
        return checkInService.scan(request);
    }

    @PostMapping("/undo/{bookingId}")
    public BookingResponseDTO undo(@PathVariable Long bookingId) {
        return checkInService.undo(bookingId);
    }
}
