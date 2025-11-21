package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.ShowtimeResponseDTO;
import com.cinebook.cinebook.model.ShowTime;
import java.time.LocalDate;
import java.util.List;

public interface ShowtimeService {
    ShowTime createShowtime(ShowTime showTime);
    List<ShowtimeResponseDTO> getShowtimesForMovieOnDate(Long movieId, LocalDate showDate);
    List<ShowtimeResponseDTO> getShowtimesForScreenOnDate(Long screenId, LocalDate showDate);
}
