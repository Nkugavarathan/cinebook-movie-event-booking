package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.ShowtimeRequest;
import com.cinebook.cinebook.dto.ShowtimeResponseDTO;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Event;
import com.cinebook.cinebook.model.Movie;
import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.EventRepository;
import com.cinebook.cinebook.repository.MovieRepository;
import com.cinebook.cinebook.repository.ScreenRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    /** Cleaning / ad break between two shows on the same screen. */
    private static final int TURNAROUND_MINUTES = 15;
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final ShowTimeRepository showTimeRepository;
    private final MovieRepository movieRepository;
    private final EventRepository eventRepository;
    private final ScreenRepository screenRepository;
    private final BookingRepository bookingRepository;
    private final DtoMapper mapper;

    /** Creates one showtime per start time; all are validated before anything is saved. */
    @Transactional
    public List<ShowtimeResponseDTO> create(ShowtimeRequest req) {
        if ((req.movieId() == null) == (req.eventId() == null)) {
            throw ApiException.badRequest("Choose either a movie or an event");
        }
        Movie movie = req.movieId() == null ? null : movieRepository.findById(req.movieId())
                .orElseThrow(() -> ApiException.notFound("Movie not found"));
        Event event = req.eventId() == null ? null : eventRepository.findById(req.eventId())
                .orElseThrow(() -> ApiException.notFound("Event not found"));
        int duration = movie != null ? movie.getDuration() : event.getDuration();
        Screen screen = screenRepository.findById(req.screenId())
                .orElseThrow(() -> ApiException.notFound("Screen not found"));

        BigDecimal standard = money(req.priceStandard());
        BigDecimal premium = req.pricePremium() != null ? money(req.pricePremium())
                : money(standard.multiply(new BigDecimal("1.5")));
        BigDecimal vip = req.priceVip() != null ? money(req.priceVip())
                : money(standard.multiply(new BigDecimal("2")));

        List<ShowTime> existing = new ArrayList<>(showTimeRepository.findByScreenIdAndShowDate(screen.getId(), req.showDate()));
        List<ShowTime> created = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (LocalTime start : req.startTimes().stream().distinct().sorted().toList()) {
            if (!LocalDateTime.of(req.showDate(), start).isAfter(now)) {
                throw ApiException.badRequest("Showtime " + start.format(HH_MM) + " on " + req.showDate() + " is in the past");
            }
            LocalTime end = start.plusMinutes(duration); // may wrap past midnight
            ShowTime candidate = ShowTime.builder()
                    .showDate(req.showDate())
                    .startTime(start)
                    .endTime(end)
                    .priceStandard(standard)
                    .pricePremium(premium)
                    .priceVip(vip)
                    .movie(movie)
                    .event(event)
                    .screen(screen)
                    .build();

            for (ShowTime other : existing) {
                if (overlaps(candidate, other)) {
                    throw ApiException.conflict(String.format(
                            "%s at %s clashes with \"%s\" (%s-%s) on %s. Allow %d minutes between shows.",
                            screen.getScreenName(), start.format(HH_MM), other.getTitle(),
                            other.getStartTime().format(HH_MM), other.getEndTime().format(HH_MM),
                            req.showDate(), TURNAROUND_MINUTES));
                }
            }
            existing.add(candidate);
            created.add(candidate);
        }

        return showTimeRepository.saveAll(created).stream().map(st -> mapper.showtime(st, true)).toList();
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponseDTO> search(String kind, Long movieId, Long eventId, Long theaterId, LocalDate date) {
        String k = kind == null || kind.isBlank() ? null : kind.toUpperCase();
        return showTimeRepository.search(k, movieId, eventId, theaterId, date).stream()
                .map(st -> mapper.showtime(st, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public ShowtimeResponseDTO get(Long id) {
        return mapper.showtime(find(id), true);
    }

    @Transactional
    public void delete(Long id) {
        ShowTime st = find(id);
        if (bookingRepository.existsByShowTimeIdIn(List.of(id))) {
            throw ApiException.conflict(
                    "This showtime already has bookings and can't be deleted. Cancel the bookings first.");
        }
        showTimeRepository.delete(st);
    }

    public ShowTime find(Long id) {
        return showTimeRepository.findById(id).orElseThrow(() -> ApiException.notFound("Showtime not found"));
    }

    private static boolean overlaps(ShowTime a, ShowTime b) {
        return a.getStartTime().isBefore(blockedUntil(b)) && b.getStartTime().isBefore(blockedUntil(a));
    }

    /** End of the show plus turnaround, capped at midnight for shows that run into the next day. */
    private static LocalTime blockedUntil(ShowTime st) {
        LocalTime end = st.getEndTime();
        if (end == null || end.isBefore(st.getStartTime())) return LocalTime.MAX;
        LocalTime withGap = end.plusMinutes(TURNAROUND_MINUTES);
        return withGap.isBefore(end) ? LocalTime.MAX : withGap;
    }

    private static BigDecimal money(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}
