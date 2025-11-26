package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.service.ScreenService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/screens")
@RequiredArgsConstructor
public class ScreenController {
<<<<<<< Updated upstream

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
=======
private final ScreenService screenService;
//get all
@GetMapping()
    public List<Screen> getScreens() {
        return screenService.getAllScreens();
    }

>>>>>>> Stashed changes
}

