package com.cinebook.cinebook.service.impl;

import com.cinebook.cinebook.dto.SeatDTO;
import com.cinebook.cinebook.model.Seat;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.SeatRepository;
import com.cinebook.cinebook.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeatServiceImpl implements SeatService {

    private final SeatRepository seatRepo;
    private final BookingRepository bookingRepo;

    @Override
    public List<SeatDTO> getSeatsForScreen(Long screenId) {
        List<Seat> seats = seatRepo.findByScreenId(screenId);
        return seats.stream().map(s -> SeatDTO.builder()
                .id(s.getId())
                .rowNumber(s.getRowNumber())
                .seatNumber(s.getSeatNumber())
                .available(true)
                .build()).collect(Collectors.toList());}

    @Override
    public List<Long> getBookedSeatIdsForShowtime(Long showTimeId) {
        return bookingRepo.findBookedSeatIdsByShowTime(showTimeId);
    }
}
