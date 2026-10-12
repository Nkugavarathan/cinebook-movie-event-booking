package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.DashboardDTO;
import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;
import com.cinebook.cinebook.model.Movie;
import com.cinebook.cinebook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BookingRepository bookingRepo;
    private final MovieRepository movieRepo;
    private final TheaterRepository theaterRepo;
    private final ScreenRepository screenRepo;
    private final ShowTimeRepository showTimeRepo;
    private final UserRepository userRepo;
    private final DtoMapper mapper;

    @Transactional(readOnly = true)
    public DashboardDTO summary() {
        List<Booking> confirmed = bookingRepo.findByStatus(BookingStatus.CONFIRMED);
        long tickets = confirmed.stream().mapToLong(b -> b.getSeats().size()).sum();

        LocalDate today = LocalDate.now();
        Map<LocalDate, List<Booking>> byDay = confirmed.stream()
                .filter(b -> b.getConfirmedAt() != null && !b.getConfirmedAt().toLocalDate().isBefore(today.minusDays(6)))
                .collect(Collectors.groupingBy(b -> b.getConfirmedAt().toLocalDate()));
        List<DashboardDTO.DailyRevenue> last7 = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            List<Booking> day = byDay.getOrDefault(d, List.of());
            last7.add(new DashboardDTO.DailyRevenue(d, sum(day), day.stream().mapToLong(b -> b.getSeats().size()).sum()));
        }

        Map<Movie, List<Booking>> byMovie = confirmed.stream()
                .collect(Collectors.groupingBy(b -> b.getShowTime().getMovie()));
        List<DashboardDTO.TopMovie> top = byMovie.entrySet().stream()
                .map(e -> new DashboardDTO.TopMovie(e.getKey().getId(), e.getKey().getTitle(), e.getKey().getPosterUrl(),
                        sum(e.getValue()), e.getValue().stream().mapToLong(b -> b.getSeats().size()).sum()))
                .sorted(Comparator.comparing(DashboardDTO.TopMovie::revenue).reversed())
                .limit(5)
                .toList();

        return new DashboardDTO(
                sum(confirmed),
                confirmed.size(),
                bookingRepo.countByStatus(BookingStatus.PENDING),
                tickets,
                movieRepo.countByActiveTrue(),
                theaterRepo.count(),
                screenRepo.count(),
                showTimeRepo.countByShowDateGreaterThanEqual(today),
                userRepo.count(),
                mapper.currency(),
                last7,
                top,
                bookingRepo.findByOrderByCreatedAtDesc(PageRequest.of(0, 8)).stream().map(mapper::booking).toList());
    }

    private static BigDecimal sum(List<Booking> bookings) {
        return bookings.stream().map(Booking::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
