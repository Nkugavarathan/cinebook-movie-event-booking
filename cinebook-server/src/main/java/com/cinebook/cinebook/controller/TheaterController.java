package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.TheaterDetailDTO;
import com.cinebook.cinebook.service.TheaterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/theaters")
@RequiredArgsConstructor
public class TheaterController {

    private final TheaterService theaterService;

    @GetMapping
    public List<TheaterDetailDTO> getAll() {
        return theaterService.getAllTheaters();
    }

    @GetMapping("/{id}")
    public TheaterDetailDTO get(@PathVariable Long id) {
        return theaterService.getTheater(id);
    }
}
