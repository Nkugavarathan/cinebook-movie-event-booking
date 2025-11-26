package com.cinebook.cinebook.service.impl;

<<<<<<< Updated upstream
import com.cinebook.cinebook.dto.MovieDetailDTO;
=======
import com.cinebook.cinebook.dto.MovieRequestDTO;
>>>>>>> Stashed changes
import com.cinebook.cinebook.dto.MovieSummaryDTO;
import com.cinebook.cinebook.model.Movie;
import com.cinebook.cinebook.repository.MovieRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import com.cinebook.cinebook.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieRepository movieRepo;
    private final ShowTimeRepository showTimeRepo;

    @Override
    public List<MovieSummaryDTO> listAllMovies() {
        return movieRepo.findAll().stream()
                .map(m -> MovieSummaryDTO.builder()
                        .id(m.getId())
                        .title(m.getTitle())
                        .posterUrl(m.getPosterUrl())
                        .language(m.getLanguage())
                        .genre(m.getGenre())
                        .duration(m.getDuration())
                        .build())
                .collect(Collectors.toList());
    }

<<<<<<< Updated upstream
    @Override
    public MovieDetailDTO getMovieDetail(Long movieId) {
        Movie m = movieRepo.findById(movieId).orElseThrow(() -> new RuntimeException("Movie not found"));
        List<ShowtimeResponseDTO> showtimes = showTimeRepo.findByMovieIdAndShowDate(movieId, m.getDuration() > 0 ? showTimeRepo.findAll().stream().findFirst().map(s->s.getShowDate()).orElse(null) : null)
                .stream()
                .map(st -> ShowtimeResponseDTO.builder()
                        .id(st.getId())
                        .showDate(st.getShowDate())
                        .startTime(st.getStartTime())
                        .price(st.getPrice())
                        .movieId(st.getMovie().getId())
                        .screenId(st.getScreen().getId())
                        .screenName(st.getScreen().getScreenName())
                        .build())
                .collect(Collectors.toList());

        return MovieDetailDTO.builder()
                .id(m.getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .posterUrl(m.getPosterUrl())
                .trailerUrl(m.getTrailerUrl())
                .showtimes(showtimes)
                .build();
    }
=======
//    @Override
//    public MovieDetailDTO getMovieDetail(Long movieId) {
//        Movie movie = movieRepo.findById(movieId)
//                .orElseThrow(() -> new RuntimeException("Movie not found"));
//
//        List<ShowtimeResponseDTO> showtimes =
//                showTimeRepo.findByMovieId(movieId).stream()
//                        .map(st -> ShowtimeResponseDTO.builder()
//                                .id(st.getId())
//                                .showDate(st.getShowDate())
//                                .startTime(st.getStartTime())
//                                .price(st.getPrice())
//                                .movieId(movie.getId())
//                                .screenId(st.getScreen().getId())
//                                .screenName(st.getScreen().getScreenName())
//                                .build())
//                        .collect(Collectors.toList());
//
//        return MovieDetailDTO.builder()
//                .id(movie.getId())
//                .title(movie.getTitle())
//                .description(movie.getDescription())
//                .posterUrl(movie.getPosterUrl())
//                .trailerUrl(movie.getTrailerUrl())
//                .showtimes(showtimes)
//                .build();
//    }
//    @Override
//    public MovieDetailDTO getMovieDetail(Long movieId) {
//        Movie m = movieRepo.findById(movieId).orElseThrow(() -> new RuntimeException("Movie not found"));
//        List<ShowtimeResponseDTO> showtimes = showTimeRepo.findByMovieIdAndShowDate(movieId, m.getDuration() > 0 ? showTimeRepo.findAll().stream().findFirst().map(s->s.getShowDate()).orElse(null) : null)
//                .stream()
//                .map(st -> ShowtimeResponseDTO.builder()
//                        .id(st.getId())
//                        .showDate(st.getShowDate())
//                        .startTime(st.getStartTime())
//                        .price(st.getPrice())
//                        .movieId(st.getMovie().getId())
//                        .screenId(st.getScreen().getId())
//                        .screenName(st.getScreen().getScreenName())
//                        .build())
//                .collect(Collectors.toList());
//
//        return MovieDetailDTO.builder()
//                .id(m.getId())
//                .title(m.getTitle())
//                .description(m.getDescription())
//                .posterUrl(m.getPosterUrl())
//                .trailerUrl(m.getTrailerUrl())
//                .showtimes(showtimes)
//                .build();
//    }
>>>>>>> Stashed changes

    @Override
<<<<<<< Updated upstream
    public Movie createMovie(Movie movie) {
=======
    public Movie getMovieById(Long id) {
        return movieRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }
    @Override
    public Movie createMovie(MovieRequestDTO dto) {
        Movie movie = Movie.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .posterUrl(dto.getPosterUrl())
                .trailerUrl(dto.getTrailerUrl())
                .duration(dto.getDuration())
                .genre(dto.getGenre())
                .language(dto.getLanguage())
                .build();

>>>>>>> Stashed changes
        return movieRepo.save(movie);
    }

    @Override
    public Movie updateMovie(Long id, Movie movie) {
        Movie exists = movieRepo.findById(id).orElseThrow(() -> new RuntimeException("Movie not found"));
        exists.setTitle(movie.getTitle());
        exists.setDescription(movie.getDescription());
        exists.setPosterUrl(movie.getPosterUrl());
        exists.setTrailerUrl(movie.getTrailerUrl());
        exists.setDuration(movie.getDuration());
        exists.setGenre(movie.getGenre());
        exists.setLanguage(movie.getLanguage());
        return movieRepo.save(exists);
    }

    @Override
    public void deleteMovie(Long id) {
        movieRepo.deleteById(id);
    }
}
