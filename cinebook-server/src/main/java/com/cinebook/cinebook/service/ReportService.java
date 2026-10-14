package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.SalesReportDTO;
import com.cinebook.cinebook.dto.SalesReportDTO.*;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.model.Theater;
import com.cinebook.cinebook.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Sales reports for the admin: revenue per day, per movie/event and per theater, plus CSV export.
 * Counts CONFIRMED bookings by the day they were paid, in the active currency only (never mixes LKR and USD).
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int MAX_DAYS = 366;
    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final BookingRepository bookingRepo;
    private final DtoMapper mapper;

    @Transactional(readOnly = true)
    public SalesReportDTO report(LocalDate from, LocalDate to) {
        List<Booking> paid = paidBookings(from, to);

        List<DayRow> byDay = new ArrayList<>();
        Map<LocalDate, List<Booking>> days = paid.stream().collect(Collectors.groupingBy(b -> b.getConfirmedAt().toLocalDate()));
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            List<Booking> list = days.getOrDefault(d, List.of());
            byDay.add(new DayRow(d, revenue(list), list.size(), tickets(list)));
        }

        List<ListingRow> byListing = group(paid, b -> b.getShowTime().getKind() + ":" + b.getShowTime().getListingId(), list -> {
            ShowTime st = list.get(0).getShowTime();
            return new ListingRow(st.getKind(), st.getListingId(), st.getTitle(), revenue(list), list.size(), tickets(list));
        }).stream().sorted(Comparator.comparing(ListingRow::revenue).reversed()).toList();

        List<TheaterRow> byTheater = group(paid, b -> b.getShowTime().getScreen().getTheater().getId(), list -> {
            Theater t = list.get(0).getShowTime().getScreen().getTheater();
            return new TheaterRow(t.getId(), t.getName(), t.getCity(), revenue(list), list.size(), tickets(list));
        }).stream().sorted(Comparator.comparing(TheaterRow::revenue).reversed()).toList();

        BigDecimal snacks = sum(paid, Booking::getSnacksAmount);
        BigDecimal discounts = sum(paid, b -> b.getPromoCode() != null ? b.getDiscountAmount() : null);
        BigDecimal ticketRevenue = sum(paid, b -> b.getSubtotalAmount() != null ? b.getSubtotalAmount() : b.getTotalAmount());
        Totals totals = new Totals(revenue(paid), paid.size(), tickets(paid), ticketRevenue, snacks, discounts);

        return new SalesReportDTO(from, to, mapper.currency(), totals, byDay, byListing, byTheater);
    }

    /** CSV text for one of: day, listing, theater, bookings. Opens in Excel or Google Sheets. */
    @Transactional(readOnly = true)
    public String csv(String type, LocalDate from, LocalDate to) {
        String cur = mapper.currency().toUpperCase();
        StringBuilder out = new StringBuilder();
        switch (type) {
            case "day" -> {
                line(out, "Date", "Revenue (" + cur + ")", "Bookings", "Tickets");
                report(from, to).byDay().forEach(r -> line(out, r.date(), r.revenue(), r.bookings(), r.tickets()));
            }
            case "listing" -> {
                line(out, "Type", "Title", "Revenue (" + cur + ")", "Bookings", "Tickets");
                report(from, to).byListing().forEach(r -> line(out, r.kind(), r.title(), r.revenue(), r.bookings(), r.tickets()));
            }
            case "theater" -> {
                line(out, "Theater", "City", "Revenue (" + cur + ")", "Bookings", "Tickets");
                report(from, to).byTheater().forEach(r -> line(out, r.name(), r.city(), r.revenue(), r.bookings(), r.tickets()));
            }
            case "bookings" -> {
                line(out, "Reference", "Paid at", "Type", "Title", "Show date", "Show time", "Theater", "Screen", "Seats",
                        "Tickets", "Tickets subtotal", "Promo code", "Discount", "Snacks", "Snacks amount",
                        "Total (" + cur + ")", "Customer", "Customer email");
                for (Booking b : paidBookings(from, to)) {
                    ShowTime st = b.getShowTime();
                    line(out, b.getReference(), b.getConfirmedAt().format(STAMP), st.getKind(), st.getTitle(),
                            st.getShowDate(), st.getStartTime(), st.getScreen().getTheater().getName(), st.getScreen().getScreenName(),
                            b.getSeatLabels(), b.getSeats().size(), b.getSubtotalAmount(), b.getPromoCode(),
                            b.getPromoCode() != null ? b.getDiscountAmount() : null, TicketPdfService.snackSummary(b),
                            b.getSnacksAmount(), b.getTotalAmount(),
                            b.getContactName() != null ? b.getContactName() : b.getUser().getName(),
                            b.getContactEmail() != null ? b.getContactEmail() : b.getUser().getEmail());
                }
            }
            default -> throw ApiException.badRequest("Unknown report type. Use day, listing, theater or bookings.");
        }
        return out.toString();
    }

    private List<Booking> paidBookings(LocalDate from, LocalDate to) {
        if (from == null || to == null) throw ApiException.badRequest("Choose a start and end date");
        if (to.isBefore(from)) throw ApiException.badRequest("The end date must be on or after the start date");
        if (ChronoUnit.DAYS.between(from, to) >= MAX_DAYS) {
            throw ApiException.badRequest("Reports can cover up to " + MAX_DAYS + " days at a time");
        }
        String currency = mapper.currency();
        return bookingRepo.findByStatusConfirmedBetween(BookingStatus.CONFIRMED, from.atStartOfDay(), to.plusDays(1).atStartOfDay())
                .stream()
                .filter(b -> currency.equalsIgnoreCase(b.getCurrency()))
                .sorted(Comparator.comparing(Booking::getConfirmedAt))
                .toList();
    }

    private static <K, R> List<R> group(List<Booking> bookings, Function<Booking, K> key, Function<List<Booking>, R> row) {
        Map<K, List<Booking>> groups = bookings.stream().collect(Collectors.groupingBy(key, LinkedHashMap::new, Collectors.toList()));
        return groups.values().stream().map(row).toList();
    }

    private static BigDecimal revenue(List<Booking> list) {
        return sum(list, Booking::getTotalAmount);
    }

    private static long tickets(List<Booking> list) {
        return list.stream().mapToLong(b -> b.getSeats().size()).sum();
    }

    private static BigDecimal sum(List<Booking> list, Function<Booking, BigDecimal> field) {
        return list.stream().map(field).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** One CSV row. Quotes values with commas/quotes/newlines, and stops Excel running text as a formula. */
    private static void line(StringBuilder out, Object... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) out.append(',');
            String v = values[i] == null ? "" : values[i].toString();
            if (!v.isEmpty() && "=+-@".indexOf(v.charAt(0)) >= 0 && !(values[i] instanceof Number)) {
                v = "'" + v;
            }
            if (v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r")) {
                v = "\"" + v.replace("\"", "\"\"") + "\"";
            }
            out.append(v);
        }
        out.append("\r\n");
    }
}
