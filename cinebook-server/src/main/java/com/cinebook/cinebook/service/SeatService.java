package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.SeatDTO;
import java.util.List;

public interface SeatService {
    List<SeatDTO> getSeatsForScreen(Long screenId);
    List<Long> getBookedSeatIdsForShowtime(Long showTimeId);

    List<SeatDTO> getSeatsForShowtime(Long screenId, Long showTimeId);
}

