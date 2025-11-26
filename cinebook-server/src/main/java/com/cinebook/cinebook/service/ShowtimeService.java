package com.cinebook.cinebook.service;

import com.cinebook.cinebook.model.Movie;
import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.repository.MovieRepository;
import com.cinebook.cinebook.repository.ScreenRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

//public class ShowtimeService {
//    ShowTime createShowtime(ShowTime showTime);
//    List<ShowtimeResponseDTO> getShowtimesForMovieOnDate(Long movieId, LocalDate showDate);
//    List<ShowtimeResponseDTO> getShowtimesForScreenOnDate(Long screenId, LocalDate showDate);
//}

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowTimeRepository showTimeRepository;
    private final MovieRepository movieRepository;
    private final ScreenRepository screenRepository;

    public ShowTime addShowTime(Long movieId, Long screenId, ShowTime showTime) {

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        Screen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new RuntimeException("Screen not found"));

        showTime.setMovie(movie);
        showTime.setScreen(screen);

        return showTimeRepository.save(showTime);
    }

    public List<ShowTime> getAllShowTimes() {
        return showTimeRepository.findAll();
    }

    public void deleteShowTime(Long id) {
        showTimeRepository.deleteById(id);
    }
}

