package com.cinebook.cinebook.service.impl;

import com.cinebook.cinebook.dto.ScreenWithSeatsDTO;
import com.cinebook.cinebook.dto.SeatDTO;
import com.cinebook.cinebook.dto.TheaterDetailDTO;
import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.model.Seat;
import com.cinebook.cinebook.model.Theater;
import com.cinebook.cinebook.repository.ScreenRepository;
import com.cinebook.cinebook.repository.SeatRepository;
import com.cinebook.cinebook.repository.TheaterRepository;
import com.cinebook.cinebook.service.TheaterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TheaterServiceImpl implements TheaterService {

    private final TheaterRepository theaterRepo;
    private final ScreenRepository screenRepo;
    private final SeatRepository seatRepo;

    @Override
    public List<Theater> listTheaters() {
        return theaterRepo.findAll();
    }

    @Override
    public TheaterDetailDTO getTheaterDetail(Long theaterId) {
        Theater theater = theaterRepo.findById(theaterId).orElseThrow(() -> new RuntimeException("Theater not found"));

        List<Screen> screens = screenRepo.findByTheaterId(theaterId);

        List<ScreenWithSeatsDTO> screenDtos = screens.stream().map(screen -> {
            List<Seat> seats = seatRepo.findByScreenId(screen.getId());
            List<SeatDTO> seatDtos = seats.stream()
                    .map(s -> SeatDTO.builder()
                            .id(s.getId())
                            .rowNumber(s.getRowNumber())
                            .seatNumber(s.getSeatNumber())
                            .available(true) // availability computed at showtime level
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

        return TheaterDetailDTO.builder()
                .id(theater.getId())
                .name(theater.getName())
                .city(theater.getCity())
                .address(theater.getAddress())
                .screens(screenDtos)
                .build();
    }

    @Override
    public Theater createTheater(Theater theater) {
        return theaterRepo.save(theater);
    }
//    @Override
//    public TheaterDetailDTO updateTheater(Long id, TheaterDetailDTO dto) {
//        Theater theater = theaterRepo.findById(id)
//                .orElseThrow(() -> new RuntimeException("Theater not found"));
//
//        theater.setName(dto.getName());
//        theater.setCity(dto.getCity());
//        theater.setAddress(dto.getAddress());
//
//        theaterRepo.save(theater);
//        return
//    }

    @Override
    public void deleteTheater(Long id) {
        theaterRepo.deleteById(id);
    }

}
