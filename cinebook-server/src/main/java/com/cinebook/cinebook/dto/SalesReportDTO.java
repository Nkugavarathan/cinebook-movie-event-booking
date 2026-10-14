package com.cinebook.cinebook.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Paid sales between two dates (by payment date), grouped three ways. */
public record SalesReportDTO(
        LocalDate from,
        LocalDate to,
        String currency,
        Totals totals,
        List<DayRow> byDay,
        List<ListingRow> byListing,
        List<TheaterRow> byTheater) {

    public record Totals(BigDecimal revenue, long bookings, long tickets,
                         BigDecimal ticketRevenue, BigDecimal snackRevenue, BigDecimal discounts) {
    }

    public record DayRow(LocalDate date, BigDecimal revenue, long bookings, long tickets) {
    }

    /** A movie or an event. kind = MOVIE or EVENT. */
    public record ListingRow(String kind, Long id, String title, BigDecimal revenue, long bookings, long tickets) {
    }

    public record TheaterRow(Long id, String name, String city, BigDecimal revenue, long bookings, long tickets) {
    }
}
