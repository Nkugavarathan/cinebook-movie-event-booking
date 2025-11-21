package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.MovieDetailDTO;
import com.cinebook.cinebook.dto.MovieSummaryDTO;
import com.cinebook.cinebook.model.Movie;
import java.util.List;

public interface MovieService {
    List<MovieSummaryDTO> listAllMovies();
    MovieDetailDTO getMovieDetail(Long movieId);
    Movie createMovie(Movie movie);
    Movie updateMovie(Long id, Movie movie);
    void deleteMovie(Long id);
}
