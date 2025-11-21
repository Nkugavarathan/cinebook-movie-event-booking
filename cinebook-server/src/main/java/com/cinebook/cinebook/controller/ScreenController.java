package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.ScreenWithSeatsDTO;
import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.service.ScreenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/screens")
@RequiredArgsConstructor
public class ScreenController {

    private final ScreenService screenService;

    @PostMapping
    public ResponseEntity<Screen> create(@RequestBody Screen screen) {
        Screen saved = screenService.createScreen(screen);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/by-theater/{theaterId}")
    public List<ScreenWithSeatsDTO> getByTheater(@PathVariable Long theaterId) {
        return screenService.getScreensByTheater(theaterId);
    }
}
