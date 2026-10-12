package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.MovieRequestDTO;
import com.cinebook.cinebook.dto.MovieSummaryDTO;
import com.cinebook.cinebook.service.MovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/movies")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminMovieController {

    private final MovieService movieService;

    @GetMapping
    public List<MovieSummaryDTO> list() {
        return movieService.listAll();
    }

    @GetMapping("/{id}")
    public MovieSummaryDTO get(@PathVariable Long id) {
        return movieService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovieSummaryDTO createMovie(@Valid @RequestBody MovieRequestDTO dto) {
        return movieService.create(dto);
    }

    @PutMapping("/{id}")
    public MovieSummaryDTO update(@PathVariable Long id, @Valid @RequestBody MovieRequestDTO dto) {
        return movieService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMovie(@PathVariable Long id) {
        movieService.delete(id);
    }
}
