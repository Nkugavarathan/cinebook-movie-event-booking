package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.BookingRequestDTO;
import com.cinebook.cinebook.dto.BookingResponseDTO;

public interface BookingService {
    BookingResponseDTO createBooking(BookingRequestDTO request);
    BookingResponseDTO getBooking(Long bookingId);
}
