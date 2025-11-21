package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.TheaterDetailDTO;
import com.cinebook.cinebook.model.Theater;
import com.cinebook.cinebook.service.TheaterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/theaters")
@RequiredArgsConstructor
public class TheaterController {

    private final TheaterService theaterService;

    @GetMapping
    public List<Theater> list() {
        return theaterService.listTheaters();
    }

    @GetMapping("/{id}")
    public TheaterDetailDTO get(@PathVariable Long id) {
        return theaterService.getTheaterDetail(id);
    }

    @PostMapping
    public ResponseEntity<Theater> create(@RequestBody Theater theater) {
        Theater t = theaterService.createTheater(theater);
        return ResponseEntity.status(HttpStatus.CREATED).body(t);
    }
}
