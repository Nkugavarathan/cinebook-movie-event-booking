package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.MovieDetailDTO;
import com.cinebook.cinebook.dto.MovieSummaryDTO;
import com.cinebook.cinebook.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public catalogue for the client app. */
@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping
    public List<MovieSummaryDTO> listMovies(@RequestParam(required = false) String search,
                                            @RequestParam(required = false) String genre,
                                            @RequestParam(required = false) String language) {
        return movieService.listPublic(search, genre, language);
    }

    @GetMapping("/{id}")
    public MovieDetailDTO getMovie(@PathVariable Long id) {
        return movieService.getPublicDetail(id);
    }
}
