package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.ScreenWithSeatsDTO;
import com.cinebook.cinebook.service.ScreenService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public list of a theater's screens. */
@RestController
@RequestMapping("/api/theaters/{theaterId}/screens")
@RequiredArgsConstructor
public class ScreenController {

    private final ScreenService screenService;

    @GetMapping
    public List<ScreenWithSeatsDTO> getScreens(@PathVariable Long theaterId) {
        return screenService.list(theaterId);
    }
}
