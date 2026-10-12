package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.TheaterDetailDTO;
import com.cinebook.cinebook.dto.TheaterRequest;
import com.cinebook.cinebook.service.TheaterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/theaters")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminTheaterController {

    private final TheaterService theaterService;

    @GetMapping
    public List<TheaterDetailDTO> getAll() {
        return theaterService.getAllTheaters();
    }

    @GetMapping("/{id}")
    public TheaterDetailDTO getOne(@PathVariable Long id) {
        return theaterService.getTheater(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TheaterDetailDTO addTheater(@Valid @RequestBody TheaterRequest req) {
        return theaterService.addTheater(req);
    }

    @PutMapping("/{id}")
    public TheaterDetailDTO updateTheater(@PathVariable Long id, @Valid @RequestBody TheaterRequest req) {
        return theaterService.updateTheater(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTheater(@PathVariable Long id) {
        theaterService.deleteTheater(id);
    }
}
