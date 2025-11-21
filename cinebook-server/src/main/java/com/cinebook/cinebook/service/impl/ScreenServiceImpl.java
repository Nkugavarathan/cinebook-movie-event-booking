package com.cinebook.cinebook.service.impl;

import com.cinebook.cinebook.dto.ScreenWithSeatsDTO;
import com.cinebook.cinebook.dto.SeatDTO;
import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.model.Seat;
import com.cinebook.cinebook.repository.ScreenRepository;
import com.cinebook.cinebook.repository.SeatRepository;
import com.cinebook.cinebook.service.ScreenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScreenServiceImpl implements ScreenService {

    private final ScreenRepository screenRepo;
    private final SeatRepository seatRepo;

    @Override
    public Screen createScreen(Screen screen) {
        Screen saved = screenRepo.save(screen);

        // Optionally seed seats automatically based on rows x columns
        for (int r = 1; r <= saved.getRows(); r++) {
            for (int c = 1; c <= saved.getColumns(); c++) {
                Seat seat = Seat.builder()
                        .rowNumber(r)
                        .seatNumber(c)
                        .screen(saved)
                        .build();
                seatRepo.save(seat);
            }
        }
        return saved;
    }

    @Override
    public List<ScreenWithSeatsDTO> getScreensByTheater(Long theaterId) {
        return screenRepo.findByTheaterId(theaterId).stream().map(screen -> {
            List<Seat> seats = seatRepo.findByScreenId(screen.getId());
            List<SeatDTO> seatDtos = seats.stream()
                    .map(s -> SeatDTO.builder()
                            .id(s.getId())
                            .rowNumber(s.getRowNumber())
                            .seatNumber(s.getSeatNumber())
                            .available(true)
                            .build())
                    .collect(Collectors.toList());
            return ScreenWithSeatsDTO.builder()
                    .screenId(screen.getId())
                    .screenName(screen.getScreenName())
                    .rows(screen.getRows())
                    .columns(screen.getColumns())
                    .seats(seatDtos)
                    .build();
        }).collect(Collectors.toList());
    }
}
