package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;
import com.cinebook.cinebook.model.Role;
import com.cinebook.cinebook.model.User;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.security.CurrentUser;
import com.cinebook.cinebook.service.TicketMailService;
import com.cinebook.cinebook.service.TicketPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/** PDF ticket download and re-send for the booking owner (or an admin). */
@Slf4j
@RestController
@RequestMapping("/api/bookings/{id}")
@RequiredArgsConstructor
public class TicketController {

    private final BookingRepository bookingRepo;
    private final CurrentUser currentUser;
    private final TicketPdfService pdfService;
    private final TicketMailService mailService;

    @GetMapping(value = "/ticket.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        Booking b = confirmedTicket(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("CineBook-" + b.getReference() + ".pdf").build().toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfService.render(b));
    }

    /** Sends the ticket again. Limited to once a minute per booking. */
    @PostMapping("/email-ticket")
    public Map<String, String> resend(@PathVariable Long id) {
        Booking b = confirmedTicket(id);
        if (!mailService.isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Email isn't set up on the server yet.");
        }
        if (b.getTicketEmailedAt() != null && b.getTicketEmailedAt().isAfter(LocalDateTime.now().minusMinutes(1))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Ticket was just sent. Please check your inbox (and spam folder).");
        }
        try {
            String to = mailService.sendTicket(id);
            return Map.of("message", "Ticket sent to " + to, "to", to);
        } catch (Exception e) {
            log.error("Resend ticket {} failed", b.getReference(), e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not send the email right now. Please try again shortly.");
        }
    }

    private Booking confirmedTicket(Long id) {
        User user = currentUser.require();
        Booking b = bookingRepo.findById(id).orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (!b.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw ApiException.notFound("Booking not found");
        }
        if (b.getStatus() != BookingStatus.CONFIRMED) {
            throw ApiException.badRequest("Only confirmed bookings have a ticket");
        }
        return b;
    }
}
