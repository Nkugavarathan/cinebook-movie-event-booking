package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.MovieDetailDTO;
import com.cinebook.cinebook.dto.MovieSummaryDTO;
import com.cinebook.cinebook.model.Movie;
import java.util.List;

public interface MovieService {
    List<MovieSummaryDTO> listAllMovies();
<<<<<<< Updated upstream
    MovieDetailDTO getMovieDetail(Long movieId);
    Movie createMovie(Movie movie);
    Movie updateMovie(Long id, Movie movie);
=======

//    MovieDetailDTO getMovieDetail(Long movieId);
//List<Movie> getMovieById(Long id);

//    List<Movie> getAllMovies();
    public Movie getMovieById(Long id) ;
    Movie createMovie(MovieRequestDTO dto);

    Movie updateMovie(Long id, MovieRequestDTO dto);

>>>>>>> Stashed changes
    void deleteMovie(Long id);
}
