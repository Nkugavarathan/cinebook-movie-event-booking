package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.BookingRequestDTO;
import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.dto.ApplyPromoRequest;
import com.cinebook.cinebook.service.BookingService;
import com.cinebook.cinebook.service.PromoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Bookings of the signed-in user. The user always comes from the JWT, never the request body. */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final PromoService promoService;

    /** Holds the selected seats; pay for them with POST /api/payments/checkout/{id}. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponseDTO hold(@Valid @RequestBody BookingRequestDTO request) {
        return bookingService.hold(request);
    }

    @GetMapping("/my")
    public List<BookingResponseDTO> myBookings() {
        return bookingService.myBookings();
    }

    @GetMapping("/{id}")
    public BookingResponseDTO getBooking(@PathVariable Long id) {
        return bookingService.getForCurrentUser(id);
    }

    /** Apply a promo code to a held booking; the server works out the discount. */
    @PostMapping("/{id}/promo")
    public BookingResponseDTO applyPromo(@PathVariable Long id, @Valid @RequestBody ApplyPromoRequest request) {
        return promoService.apply(id, request.code());
    }

    @DeleteMapping("/{id}/promo")
    public BookingResponseDTO removePromo(@PathVariable Long id) {
        return promoService.remove(id);
    }

    /** Cancel a paid ticket and get the money back (allowed until the refund deadline). */
    @PostMapping("/{id}/refund")
    public BookingResponseDTO refund(@PathVariable Long id) {
        return bookingService.cancelAndRefund(id);
    }

    @PostMapping("/{id}/cancel")
    public BookingResponseDTO cancel(@PathVariable Long id) {
        return bookingService.cancelPending(id);
    }
}
