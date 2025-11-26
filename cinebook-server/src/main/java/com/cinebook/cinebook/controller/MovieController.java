package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.MovieSummaryDTO;
import com.cinebook.cinebook.model.Movie;
import com.cinebook.cinebook.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
    private final MovieService movieService;

    // public list for frontend browsing
    @GetMapping
    public List<MovieSummaryDTO> listMovies() {
        return movieService.listAllMovies();
    }

    // aggregated detail incl. showtimes
    @GetMapping("/{id}")
    public Movie getMovie(@PathVariable Long id) {
        return movieService.getMovieById(id);
    }

    // admin create
    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        Movie saved = movieService.createMovie(movie);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // admin update
    @PutMapping("/{id}")
    public Movie update(@PathVariable Long id, @RequestBody Movie movie) {
        return movieService.updateMovie(id, movie);
    }

    //delete movie
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }
}
