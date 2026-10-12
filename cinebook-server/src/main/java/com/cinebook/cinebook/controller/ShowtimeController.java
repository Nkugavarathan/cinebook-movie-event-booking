package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.ShowtimeResponseDTO;
import com.cinebook.cinebook.service.ShowtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping("/{id}")
    public ShowtimeResponseDTO get(@PathVariable Long id) {
        return showtimeService.get(id);
    }
}
