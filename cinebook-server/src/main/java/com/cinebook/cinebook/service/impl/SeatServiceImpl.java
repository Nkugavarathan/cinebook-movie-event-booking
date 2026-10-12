package com.cinebook.cinebook.service.impl;

import com.cinebook.cinebook.dto.SeatDTO;
import com.cinebook.cinebook.dto.SeatMapDTO;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.*;
import com.cinebook.cinebook.repository.BookingSeatRepository;
import com.cinebook.cinebook.repository.SeatRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import com.cinebook.cinebook.security.CurrentUser;
import com.cinebook.cinebook.service.DtoMapper;
import com.cinebook.cinebook.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SeatServiceImpl implements SeatService {

    private final SeatRepository seatRepo;
    private final ShowTimeRepository showTimeRepo;
    private final BookingSeatRepository bookingSeatRepo;
    private final CurrentUser currentUser;
    private final DtoMapper mapper;

    @Value("${app.booking.hold-minutes}")
    private int holdMinutes;

    @Value("${app.booking.max-seats}")
    private int maxSeats;

    @Override
    @Transactional(readOnly = true)
    public SeatMapDTO getSeatMap(Long showTimeId) {
        ShowTime st = showTimeRepo.findById(showTimeId)
                .orElseThrow(() -> ApiException.notFound("Showtime not found"));
        Long userId = currentUser.find().map(User::getId).orElse(null);
        LocalDateTime now = LocalDateTime.now();

        Map<Long, String> statusBySeat = new HashMap<>();
        for (BookingSeat bs : bookingSeatRepo.findLockedForShowTime(showTimeId)) {
            Booking b = bs.getBooking();
            if (b.getStatus() == BookingStatus.CONFIRMED) {
                statusBySeat.put(bs.getSeat().getId(), "BOOKED");
            } else if (b.getStatus() == BookingStatus.PENDING && b.getExpiresAt().isAfter(now)
                    && !b.getUser().getId().equals(userId)) {
                statusBySeat.put(bs.getSeat().getId(), "HELD");
            }
        }

        List<SeatDTO> seats = seatRepo.findByScreenIdOrderByRowNumberAscSeatNumberAsc(st.getScreen().getId()).stream()
                .map(s -> mapper.seat(s,
                        s.isActive() ? statusBySeat.getOrDefault(s.getId(), "AVAILABLE") : "UNAVAILABLE",
                        st.priceFor(s.getType())))
                .toList();

        Screen screen = st.getScreen();
        return new SeatMapDTO(mapper.showtime(st, true), screen.getRows(), screen.getColumns(), seats,
                holdMinutes, maxSeats);
    }
}
