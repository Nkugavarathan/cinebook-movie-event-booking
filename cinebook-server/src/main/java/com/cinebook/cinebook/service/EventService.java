package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.EventDetailDTO;
import com.cinebook.cinebook.dto.EventRequestDTO;
import com.cinebook.cinebook.dto.EventSummaryDTO;
import com.cinebook.cinebook.dto.ShowtimeResponseDTO;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Event;
import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.EventRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepo;
    private final ShowTimeRepository showTimeRepo;
    private final BookingRepository bookingRepo;
    private final DtoMapper mapper;
    private final ReviewService reviewService;

    /** Active events, soonest first; events with no upcoming dates go last. */
    @Transactional(readOnly = true)
    public List<EventSummaryDTO> listPublic(String category, String search) {
        Map<Long, List<ShowTime>> upcoming = upcomingByEvent();
        return eventRepo.findByActiveTrue().stream()
                .filter(e -> category == null || category.isBlank() || category.equalsIgnoreCase(e.getCategory()))
                .filter(e -> matches(e.getName(), search) || matches(e.getPerformer(), search))
                .map(e -> summary(e, upcoming.getOrDefault(e.getId(), List.of())))
                .sorted(Comparator.comparing(EventSummaryDTO::nextDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDetailDTO getPublicDetail(Long id) {
        Event e = find(id);
        if (!e.isActive()) throw ApiException.notFound("Event not found");
        List<ShowTime> shows = upcomingFor(id);
        List<ShowtimeResponseDTO> showtimes = shows.stream().map(st -> mapper.showtime(st, true)).toList();
        return new EventDetailDTO(summary(e, shows), showtimes);
    }

    @Transactional(readOnly = true)
    public List<EventSummaryDTO> listAll() {
        Map<Long, List<ShowTime>> upcoming = upcomingByEvent();
        return eventRepo.findAllByOrderByIdDesc().stream()
                .map(e -> summary(e, upcoming.getOrDefault(e.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public EventSummaryDTO get(Long id) {
        return summary(find(id), upcomingFor(id));
    }

    public EventSummaryDTO create(EventRequestDTO dto) {
        Event e = new Event();
        apply(e, dto);
        return summary(eventRepo.save(e), List.of());
    }

    @Transactional
    public EventSummaryDTO update(Long id, EventRequestDTO dto) {
        Event e = find(id);
        apply(e, dto);
        return summary(eventRepo.save(e), upcomingFor(id));
    }

    @Transactional
    public void delete(Long id) {
        Event e = find(id);
        List<ShowTime> shows = showTimeRepo.findByEventId(id);
        List<Long> ids = shows.stream().map(ShowTime::getId).toList();
        if (!ids.isEmpty() && bookingRepo.existsByShowTimeIdIn(ids)) {
            throw ApiException.conflict(
                    "This event has bookings, so it can't be deleted. Edit it and turn off \"Active\" to hide it instead.");
        }
        showTimeRepo.deleteAll(shows);
        eventRepo.delete(e);
    }

    private Event find(Long id) {
        return eventRepo.findById(id).orElseThrow(() -> ApiException.notFound("Event not found"));
    }

    private List<ShowTime> upcomingFor(Long eventId) {
        LocalDateTime now = LocalDateTime.now();
        return showTimeRepo.findUpcomingForEvent(eventId, LocalDate.now()).stream()
                .filter(st -> st.getStartsAt().isAfter(now))
                .toList();
    }

    private Map<Long, List<ShowTime>> upcomingByEvent() {
        LocalDateTime now = LocalDateTime.now();
        return showTimeRepo.findAllUpcomingEvents(LocalDate.now()).stream()
                .filter(st -> st.getStartsAt().isAfter(now))
                .collect(Collectors.groupingBy(st -> st.getEvent().getId()));
    }

    private EventSummaryDTO summary(Event e, List<ShowTime> shows) {
        ReviewService.Rating rating = reviewService.eventRatings().get(e.getId());
        LocalDate next = shows.stream().map(ShowTime::getShowDate).min(Comparator.naturalOrder()).orElse(null);
        BigDecimal from = shows.stream().map(ShowTime::getPriceStandard).filter(Objects::nonNull)
                .min(Comparator.naturalOrder()).orElse(null);
        String venues = shows.stream().map(st -> st.getScreen().getTheater().getName())
                .distinct().collect(Collectors.joining(", "));
        return new EventSummaryDTO(e.getId(), e.getName(), e.getDescription(), e.getPosterUrl(), e.getBannerUrl(),
                e.getCategory(), e.getPerformer(), e.getLanguage(), e.getAgeLimit(), e.getDuration(), e.getLocation(),
                e.isActive(), shows.size(), next, from, mapper.currency(), venues.isEmpty() ? null : venues,
                rating == null ? null : rating.average(), rating == null ? 0 : rating.count());
    }

    private void apply(Event e, EventRequestDTO dto) {
        e.setName(dto.name().trim());
        e.setDescription(dto.description());
        e.setPosterUrl(blankToNull(dto.posterUrl()));
        e.setBannerUrl(blankToNull(dto.bannerUrl()));
        e.setCategory(dto.category().trim());
        e.setPerformer(dto.performer());
        e.setLanguage(dto.language());
        e.setAgeLimit(dto.ageLimit());
        e.setDuration(dto.duration());
        e.setLocation(dto.location());
        e.setActive(dto.active() == null || dto.active());
    }

    private static boolean matches(String value, String query) {
        if (query == null || query.isBlank()) return true;
        return value != null && value.toLowerCase().contains(query.trim().toLowerCase());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
