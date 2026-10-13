package com.cinebook.cinebook.service.impl;

import com.cinebook.cinebook.dto.MovieDetailDTO;
import com.cinebook.cinebook.dto.MovieRequestDTO;
import com.cinebook.cinebook.dto.MovieSummaryDTO;
import com.cinebook.cinebook.dto.ShowtimeResponseDTO;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Movie;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.MovieRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import com.cinebook.cinebook.service.DtoMapper;
import com.cinebook.cinebook.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieRepository movieRepo;
    private final ShowTimeRepository showTimeRepo;
    private final BookingRepository bookingRepo;
    private final DtoMapper mapper;
    private final com.cinebook.cinebook.service.ReviewService reviewService;

    @Override
    @Transactional(readOnly = true)
    public List<MovieSummaryDTO> listPublic(String search, String genre, String language) {
        Map<Long, Long> upcoming = upcomingCounts();
        var ratings = reviewService.movieRatings();
        return movieRepo.findByActiveTrueOrderByReleaseDateDesc().stream()
                .filter(m -> matches(m.getTitle(), search) || matches(m.getCastMembers(), search)
                        || matches(m.getDirector(), search))
                .filter(m -> matches(m.getGenre(), genre))
                .filter(m -> matches(m.getLanguage(), language))
                .map(m -> mapper.movie(m, upcoming.getOrDefault(m.getId(), 0L), ratings.get(m.getId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MovieDetailDTO getPublicDetail(Long movieId) {
        Movie m = find(movieId);
        if (!m.isActive()) {
            throw ApiException.notFound("Movie not found");
        }
        LocalDateTime now = LocalDateTime.now();
        List<ShowtimeResponseDTO> showtimes = showTimeRepo.findUpcomingForMovie(movieId, LocalDate.now()).stream()
                .filter(st -> st.getStartsAt().isAfter(now))
                .map(st -> mapper.showtime(st, true))
                .toList();
        return new MovieDetailDTO(mapper.movie(m, showtimes.size(), reviewService.movieRatings().get(m.getId())), showtimes);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovieSummaryDTO> listAll() {
        Map<Long, Long> upcoming = upcomingCounts();
        var ratings = reviewService.movieRatings();
        return movieRepo.findAllByOrderByIdDesc().stream()
                .map(m -> mapper.movie(m, upcoming.getOrDefault(m.getId(), 0L), ratings.get(m.getId())))
                .toList();
    }

    @Override
    public MovieSummaryDTO get(Long id) {
        return mapper.movie(find(id), 0);
    }

    @Override
    public MovieSummaryDTO create(MovieRequestDTO dto) {
        Movie movie = new Movie();
        apply(movie, dto);
        return mapper.movie(movieRepo.save(movie), 0);
    }

    @Override
    public MovieSummaryDTO update(Long id, MovieRequestDTO dto) {
        Movie movie = find(id);
        apply(movie, dto);
        return mapper.movie(movieRepo.save(movie), 0);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Movie movie = find(id);
        List<ShowTime> showTimes = showTimeRepo.findByMovieId(id);
        List<Long> ids = showTimes.stream().map(ShowTime::getId).toList();
        if (!ids.isEmpty() && bookingRepo.existsByShowTimeIdIn(ids)) {
            throw ApiException.conflict(
                    "This movie has bookings, so it can't be deleted. Edit it and turn off \"Active\" to hide it instead.");
        }
        showTimeRepo.deleteAll(showTimes);
        movieRepo.delete(movie);
    }

    private Movie find(Long id) {
        return movieRepo.findById(id).orElseThrow(() -> ApiException.notFound("Movie not found"));
    }

    private void apply(Movie m, MovieRequestDTO dto) {
        m.setTitle(dto.title().trim());
        m.setDescription(dto.description());
        m.setPosterUrl(blankToNull(dto.posterUrl()));
        m.setBackdropUrl(blankToNull(dto.backdropUrl()));
        m.setTrailerUrl(blankToNull(dto.trailerUrl()));
        m.setDuration(dto.duration());
        m.setGenre(dto.genre());
        m.setLanguage(dto.language());
        m.setCertificate(dto.certificate());
        m.setDirector(dto.director());
        m.setCastMembers(dto.castMembers());
        m.setReleaseDate(dto.releaseDate());
        m.setActive(dto.active() == null || dto.active());
    }

    private Map<Long, Long> upcomingCounts() {
        LocalDateTime now = LocalDateTime.now();
        return showTimeRepo.findAllUpcoming(LocalDate.now()).stream()
                .filter(st -> st.getStartsAt().isAfter(now))
                .collect(Collectors.groupingBy(st -> st.getMovie().getId(), Collectors.counting()));
    }

    private static boolean matches(String value, String query) {
        if (query == null || query.isBlank()) return true;
        return value != null && value.toLowerCase().contains(query.trim().toLowerCase());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
