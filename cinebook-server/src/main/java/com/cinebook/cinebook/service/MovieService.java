package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.MovieDetailDTO;
import com.cinebook.cinebook.dto.MovieRequestDTO;
import com.cinebook.cinebook.dto.MovieSummaryDTO;

import java.util.List;

public interface MovieService {

    /** Active movies for the client app, optionally filtered. */
    List<MovieSummaryDTO> listPublic(String search, String genre, String language);

    /** Active movie with its upcoming showtimes. */
    MovieDetailDTO getPublicDetail(Long movieId);

    List<MovieSummaryDTO> listAll();

    MovieSummaryDTO get(Long id);

    MovieSummaryDTO create(MovieRequestDTO dto);

    MovieSummaryDTO update(Long id, MovieRequestDTO dto);

    void delete(Long id);
}
