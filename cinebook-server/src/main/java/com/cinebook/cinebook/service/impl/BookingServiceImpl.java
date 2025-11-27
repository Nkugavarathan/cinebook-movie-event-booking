package com.cinebook.cinebook.service.impl;

import com.cinebook.cinebook.dto.BookingRequestDTO;
import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.dto.SeatDTO;
import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.Seat;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.model.User;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.SeatRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import com.cinebook.cinebook.repository.UserRepository;
import com.cinebook.cinebook.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

//@Service
//@RequiredArgsConstructor
//public class BookingServiceImpl implements BookingService {
//
//    private final BookingRepository bookingRepo;
//    private final ShowTimeRepository showTimeRepo;
//    private final SeatRepository seatRepo;
//    private final UserRepository userRepo;
//
//
//    @Override
//    @Transactional
//    public BookingResponseDTO createBooking(BookingRequestDTO request) {
//        // basic validations
//        User user = userRepo.findById(request.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
//        ShowTime showTime = showTimeRepo.findById(request.getShowTimeId()).orElseThrow(() -> new RuntimeException("ShowTime not found"));
//
//        // load seats
//        List<Seat> seats = seatRepo.findAllById(request.getSeatIds());
//        if (seats.size() != request.getSeatIds().size()) {
//            throw new RuntimeException("One or more seats not found");
//        }
//
//        // ensure all seats belong to the showtime.screen
//        Long screenId = showTime.getScreen().getId();
//        for (Seat s : seats) {
//            if (!Objects.equals(s.getScreen().getId(), screenId)) {
//                throw new RuntimeException("Seat " + s.getId() + " does not belong to the show's screen");
//            }
//        }
//
//        // check already booked seat ids for this showtime
//        List<Long> alreadyBooked = bookingRepo.findBookedSeatIdsByShowTime(showTime.getId());
//        for (Seat s: seats) {
//            if (alreadyBooked.contains(s.getId())) {
//                throw new RuntimeException("Seat " + s.getId() + " already booked");
//            }
//        }
//
//        // compute total price (simple sum of showtime.price)
//        double total = showTime.getPrice() * seats.size();
//
//        // optional check expected amount
//        if (request.getExpectedAmount() > 0 && Math.abs(request.getExpectedAmount() - total) > 0.01) {
//            throw new RuntimeException("Amount mismatch");
//        }
//
//        Booking booking = Booking.builder()
//                .user(user)
//                .showTime(showTime)
//                .seats(new ArrayList<>(seats))
//                .totalAmount(total)
//                .paymentId(null)
//                .paymentSuccess(false) // set false until payment confirms (Stripe webhook)
//                .build();
//
//        Booking saved = bookingRepo.save(booking);
//
//
//        List<SeatDTO> seatDtos = seats.stream()
//                .map(s -> SeatDTO.builder()
//                        .id(s.getId())
//                        .rowNumber(s.getRowNumber())
//                        .seatNumber(s.getSeatNumber())
//                        .available(false)
//                        .build())
//                .collect(Collectors.toList());
//
//        return BookingResponseDTO.builder()
//                .bookingId(saved.getId())
//                .paymentSuccess(saved.isPaymentSuccess())
//                .totalAmount(saved.getTotalAmount())
//                .seats(seatDtos)
//                .build();
//    }
//
//    @Override
//    public BookingResponseDTO getBooking(Long bookingId) {
//        Booking b = bookingRepo.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
//        List<SeatDTO> seats = b.getSeats().stream()
//                .map(s -> SeatDTO.builder()
//                        .id(s.getId())
//                        .rowNumber(s.getRowNumber())
//                        .seatNumber(s.getSeatNumber())
//                        .available(!b.isPaymentSuccess())
//                        .build()).collect(Collectors.toList());
//
//        return BookingResponseDTO.builder()
//                .bookingId(b.getId())
//                .paymentSuccess(b.isPaymentSuccess())
//                .seats(seats)
//                .totalAmount(b.getTotalAmount())
//                .build();
//    }
//}


@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepo;
    private final UserRepository userRepo;
    private final ShowTimeRepository showTimeRepo;
    private final SeatRepository seatRepo;

    @Override
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request) {

        User user = userRepo.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        ShowTime showTime = showTimeRepo.findById(request.getShowTimeId())
                .orElseThrow(() -> new RuntimeException("ShowTime not found"));

        List<Long> bookedSeatIds = bookingRepo.findBookedSeatIdsByShowTime(request.getShowTimeId());
        List<Seat> selectedSeats = seatRepo.findAllById(request.getSeatIds());

        for (Seat seat : selectedSeats) {
            if (bookedSeatIds.contains(seat.getId())) {
                throw new RuntimeException("Seat already booked: " + seat.getSeatNumber());
            }
        }

        double total = showTime.getPrice() * selectedSeats.size();

        Booking booking = Booking.builder()
                .user(user)
                .showTime(showTime)
                .seats(selectedSeats)
                .totalAmount(total)
                .paymentSuccess(true) // dummy payment = always success
                .build();

        Booking saved = bookingRepo.save(booking);

        return BookingResponseDTO.builder()
                .bookingId(saved.getId())
                .paymentSuccess(true)
                .totalAmount(total)
                .seats(selectedSeats.stream()
                        .map(s -> SeatDTO.builder()
                                .id(s.getId())
                                .rowNumber(s.getRowNumber())
                                .seatNumber(s.getSeatNumber())
                                .available(false)
                                .build())
                        .toList())
                .build();
    }

    @Override
    public BookingResponseDTO getBooking(Long bookingId) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        return BookingResponseDTO.builder()
                .bookingId(b.getId())
                .paymentSuccess(b.isPaymentSuccess())
                .totalAmount(b.getTotalAmount())
                .seats(b.getSeats().stream().map(s ->
                        SeatDTO.builder()
                                .id(s.getId())
                                .rowNumber(s.getRowNumber())
                                .seatNumber(s.getSeatNumber())
                                .available(false)
                                .build()
                ).toList())
                .build();
    }
}
