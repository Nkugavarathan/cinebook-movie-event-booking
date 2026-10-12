package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.BookingRequestDTO;
import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;

import java.util.List;

public interface BookingService {

    /** Reserves seats for the signed-in user as a PENDING booking that expires after the hold window. */
    BookingResponseDTO hold(BookingRequestDTO request);

    List<BookingResponseDTO> myBookings();

    /** Owner or admin only. */
    BookingResponseDTO getForCurrentUser(Long bookingId);

    /** Lets the owner give back seats they are holding but have not paid for. */
    BookingResponseDTO cancelPending(Long bookingId);

    List<BookingResponseDTO> adminSearch(BookingStatus status, String query);

    BookingResponseDTO adminGet(Long bookingId);

    /** Cancels a hold, or cancels + refunds a paid booking via Stripe. */
    BookingResponseDTO adminCancel(Long bookingId);

    /** Ends the booking and frees its seats. */
    void release(Booking booking, BookingStatus newStatus);

    /** Releases holds whose time ran out. */
    int expireStaleHolds();
}
