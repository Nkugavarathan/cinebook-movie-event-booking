package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.SeatMapDTO;

public interface SeatService {

    /**
     * Seat grid for a showtime with each seat's live status. Seats the current user is holding
     * show as AVAILABLE, so they can go back and change their selection.
     */
    SeatMapDTO getSeatMap(Long showTimeId);
}
