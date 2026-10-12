package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.*;
import com.cinebook.cinebook.model.*;
import com.cinebook.cinebook.repository.BookingSeatRepository;
import com.cinebook.cinebook.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.EnumSet;

@Component
@RequiredArgsConstructor
public class DtoMapper {

    private final SeatRepository seatRepository;
    private final BookingSeatRepository bookingSeatRepository;

    @Value("${app.currency}")
    private String currency;

    public String currency() {
        return currency.toLowerCase();
    }

    public MovieSummaryDTO movie(Movie m, long upcomingShows) {
        return new MovieSummaryDTO(m.getId(), m.getTitle(), m.getDescription(), m.getPosterUrl(),
                m.getBackdropUrl(), m.getTrailerUrl(), m.getDuration(), m.getGenre(), m.getLanguage(),
                m.getCertificate(), m.getDirector(), m.getCastMembers(), m.getReleaseDate(), m.isActive(),
                upcomingShows);
    }

    public TheaterDetailDTO theater(Theater t, long screenCount) {
        return new TheaterDetailDTO(t.getId(), t.getName(), t.getCity(), t.getAddress(), t.getFacilities(), screenCount);
    }

    /** @param withAvailability also count free seats (one extra query pair per showtime). */
    public ShowtimeResponseDTO showtime(ShowTime st, boolean withAvailability) {
        Movie m = st.getMovie();
        Event e = st.getEvent();
        Screen sc = st.getScreen();
        Theater t = sc.getTheater();
        Long total = null;
        Long available = null;
        if (withAvailability) {
            total = seatRepository.countActiveByScreenId(sc.getId());
            long taken = bookingSeatRepository.countLocked(st.getId(),
                    EnumSet.of(BookingStatus.PENDING, BookingStatus.CONFIRMED));
            available = Math.max(0, total - taken);
        }
        boolean bookable = st.getStartsAt().isAfter(LocalDateTime.now()) && st.isListingActive();
        return new ShowtimeResponseDTO(st.getId(), st.getShowDate(), st.getStartTime(), st.getEndTime(),
                st.getPriceStandard(), st.getPricePremium(), st.getPriceVip(), currency(),
                m != null ? m.getId() : null, st.getTitle(), st.getPosterUrl(),
                m != null ? m.getBackdropUrl() : e.getBannerUrl(), st.getDurationMinutes(),
                m != null ? m.getCertificate() : e.getAgeLimit(),
                m != null ? m.getLanguage() : e.getLanguage(),
                sc.getId(), sc.getScreenName(), sc.getFormat(),
                t.getId(), t.getName(), t.getCity(), t.getAddress(),
                total, available, bookable,
                st.getKind(), e != null ? e.getId() : null, e != null ? e.getCategory() : null);
    }

    public SeatDTO seat(Seat s, String status, java.math.BigDecimal price) {
        return new SeatDTO(s.getId(), s.getRowNumber(), s.getSeatNumber(), s.getLabel(), s.getType(),
                s.isActive(), status, price);
    }

    public BookingResponseDTO booking(Booking b) {
        User u = b.getUser();
        return new BookingResponseDTO(b.getId(), b.getReference(), b.getStatus(), b.getTotalAmount(),
                b.getCurrency(), b.getSeatLabels(),
                b.getSeats().stream()
                        .map(bs -> new BookingSeatDTO(bs.getSeat().getId(), bs.getSeatLabel(), bs.getSeatType(), bs.getPrice()))
                        .toList(),
                showtime(b.getShowTime(), false),
                b.getCreatedAt(), b.getExpiresAt(), b.getConfirmedAt(), b.getCancelledAt(),
                u.getId(), u.getName(), u.getEmail(),
                b.getContactName(), b.getContactEmail(), b.getContactPhone(),
                b.getStripePaymentIntentId(), b.getStripeRefundId());
    }
}
