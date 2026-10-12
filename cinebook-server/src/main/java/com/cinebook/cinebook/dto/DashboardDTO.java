package com.cinebook.cinebook.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardDTO(
        BigDecimal totalRevenue,
        long confirmedBookings,
        long pendingBookings,
        long ticketsSold,
        long activeMovies,
        long activeEvents,
        long theaters,
        long screens,
        long upcomingShowtimes,
        long users,
        String currency,
        List<DailyRevenue> last7Days,
        List<TopMovie> topMovies,
        List<BookingResponseDTO> recentBookings) {

    public record DailyRevenue(LocalDate date, BigDecimal revenue, long tickets) {
    }

    public record TopMovie(Long id, String kind, String title, String posterUrl, BigDecimal revenue, long tickets) {
    }
}
