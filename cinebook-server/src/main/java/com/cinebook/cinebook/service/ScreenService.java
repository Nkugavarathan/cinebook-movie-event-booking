package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.ScreenWithSeatsDTO;
import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.model.Seat;
import com.cinebook.cinebook.model.Theater;
import com.cinebook.cinebook.repository.ScreenRepository;
import com.cinebook.cinebook.repository.SeatRepository;
import com.cinebook.cinebook.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScreenService {
    private final ScreenRepository screenRepository;
    private final TheaterRepository theaterRepository;
    private final SeatRepository seatRepository;
    public Screen addScreen(Screen screen, Long theaterId) {
        Theater theater = theaterRepository.findById(theaterId)
                .orElseThrow(() -> new RuntimeException("Theater not found"));

        screen.setTheater(theater);
        Screen savedScreen= screenRepository.save(screen);
        // AUTO GENERATE SEATS
        for (int row = 1; row <= screen.getRows(); row++) {
            for (int col = 1; col <= screen.getColumns(); col++) {
                Seat seat = Seat.builder()
                        .rowNumber(row)
                        .seatNumber(col)
                        .screen(savedScreen)
                        .build();

                seatRepository.save(seat);
            }
        }

        return savedScreen;
    }
    public List<Screen> getScreensByTheater(Long theaterId) {
        return screenRepository.findByTheaterId(theaterId);
    }

    public List<Screen> getAllScreens() {
        return screenRepository.findAll();
    }

    public void deleteScreen(Long id) {
        screenRepository.deleteById(id);
    }
}
