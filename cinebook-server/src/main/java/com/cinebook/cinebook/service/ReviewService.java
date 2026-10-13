package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.ReviewDTO;
import com.cinebook.cinebook.dto.ReviewRequest;
import com.cinebook.cinebook.dto.ReviewSummaryDTO;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.*;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.EventRepository;
import com.cinebook.cinebook.repository.MovieRepository;
import com.cinebook.cinebook.repository.ReviewRepository;
import com.cinebook.cinebook.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Ratings & reviews. Only customers who attended (paid booking, show started or checked in) can post. */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    /** [average, count] for a listing; used on movie / event cards. */
    public record Rating(double average, long count) {
    }

    private final ReviewRepository reviewRepo;
    private final BookingRepository bookingRepo;
    private final MovieRepository movieRepo;
    private final EventRepository eventRepo;
    private final CurrentUser currentUser;

    // ---------------------------------------------------------------- public

    @Transactional(readOnly = true)
    public ReviewSummaryDTO forMovie(Long movieId) {
        return summary("MOVIE", movieId, reviewRepo.findByMovieIdOrderByCreatedAtDesc(movieId));
    }

    @Transactional(readOnly = true)
    public ReviewSummaryDTO forEvent(Long eventId) {
        return summary("EVENT", eventId, reviewRepo.findByEventIdOrderByCreatedAtDesc(eventId));
    }

    public Map<Long, Rating> movieRatings() {
        return toMap(reviewRepo.movieRatings());
    }

    public Map<Long, Rating> eventRatings() {
        return toMap(reviewRepo.eventRatings());
    }

    // ---------------------------------------------------------------- customer

    /** Creates or updates the signed-in customer's review. */
    @Transactional
    public ReviewDTO upsert(ReviewRequest req) {
        if ((req.movieId() == null) == (req.eventId() == null)) {
            throw ApiException.badRequest("Choose a movie or an event to review");
        }
        User user = currentUser.require();
        boolean movie = req.movieId() != null;
        Long id = movie ? req.movieId() : req.eventId();
        String reason = ineligibleReason(user, movie ? "MOVIE" : "EVENT", id);
        if (reason != null) throw ApiException.forbidden(reason);

        Review r = (movie ? reviewRepo.findByUserIdAndMovieId(user.getId(), id) : reviewRepo.findByUserIdAndEventId(user.getId(), id))
                .orElseGet(() -> {
                    Review n = new Review();
                    n.setUser(user);
                    n.setCreatedAt(LocalDateTime.now());
                    if (movie) n.setMovie(movieRepo.findById(id).orElseThrow(() -> ApiException.notFound("Movie not found")));
                    else n.setEvent(eventRepo.findById(id).orElseThrow(() -> ApiException.notFound("Event not found")));
                    return n;
                });
        if (r.getId() != null) r.setUpdatedAt(LocalDateTime.now());
        r.setRating(req.rating());
        r.setComment(req.comment() == null || req.comment().isBlank() ? null : req.comment().trim());
        Review saved = reviewRepo.save(r);
        log.info("{} rated {} {} with {} stars", user.getEmail(), movie ? "movie" : "event", id, req.rating());
        return toDto(saved, user.getId(), false);
    }

    @Transactional
    public void deleteOwn(Long reviewId) {
        User user = currentUser.require();
        Review r = reviewRepo.findById(reviewId).orElseThrow(() -> ApiException.notFound("Review not found"));
        if (!r.getUser().getId().equals(user.getId())) throw ApiException.notFound("Review not found");
        reviewRepo.delete(r);
    }

    // ---------------------------------------------------------------- admin

    @Transactional(readOnly = true)
    public List<ReviewDTO> adminList() {
        return reviewRepo.findAllByOrderByCreatedAtDesc().stream().map(r -> toDto(r, null, true)).toList();
    }

    @Transactional
    public ReviewDTO setHidden(Long id, boolean hidden) {
        Review r = reviewRepo.findById(id).orElseThrow(() -> ApiException.notFound("Review not found"));
        r.setHidden(hidden);
        return toDto(reviewRepo.save(r), null, true);
    }

    @Transactional
    public void adminDelete(Long id) {
        reviewRepo.delete(reviewRepo.findById(id).orElseThrow(() -> ApiException.notFound("Review not found")));
    }

    // ---------------------------------------------------------------- helpers

    private ReviewSummaryDTO summary(String kind, Long id, List<Review> all) {
        User user = currentUser.find().orElse(null);
        Long uid = user == null ? null : user.getId();
        List<Review> visible = all.stream().filter(r -> !r.isHidden()).toList();
        long[] dist = new long[5];
        visible.forEach(r -> dist[r.getRating() - 1]++);
        double avg = visible.isEmpty() ? 0 : visible.stream().mapToInt(Review::getRating).average().orElse(0);
        ReviewDTO mine = uid == null ? null : all.stream()
                .filter(r -> r.getUser().getId().equals(uid)).findFirst().map(r -> toDto(r, uid, false)).orElse(null);
        String reason = user == null ? "Sign in to write a review" : ineligibleReason(user, kind, id);
        return new ReviewSummaryDTO(Math.round(avg * 10) / 10.0, visible.size(), dist,
                visible.stream().map(r -> toDto(r, uid, false)).toList(), mine, reason == null, reason);
    }

    private String ineligibleReason(User user, String kind, Long id) {
        LocalDate today = LocalDate.now();
        LocalTime time = LocalTime.now();
        boolean attended = "MOVIE".equals(kind)
                ? bookingRepo.attendedMovie(user.getId(), id, BookingStatus.CONFIRMED, today, time)
                : bookingRepo.attendedEvent(user.getId(), id, BookingStatus.CONFIRMED, today, time);
        return attended ? null : "You can review after you've watched it with a CineBook ticket";
    }

    private ReviewDTO toDto(Review r, Long viewerId, boolean admin) {
        boolean movie = r.getMovie() != null;
        String name = r.getUser().getName() == null ? "Guest" : r.getUser().getName().trim();
        // Public pages show "Jane P." rather than the full name.
        String shown = admin ? name : shortName(name);
        return new ReviewDTO(r.getId(), movie ? "MOVIE" : "EVENT",
                movie ? r.getMovie().getId() : r.getEvent().getId(),
                movie ? r.getMovie().getTitle() : r.getEvent().getName(),
                r.getRating(), r.getComment(), shown, admin ? r.getUser().getEmail() : null,
                r.getCreatedAt(), r.getUpdatedAt(), r.isHidden(),
                viewerId != null && r.getUser().getId().equals(viewerId));
    }

    private static String shortName(String name) {
        String[] parts = name.split("\\s+");
        return parts.length > 1 ? parts[0] + " " + Character.toUpperCase(parts[parts.length - 1].charAt(0)) + "." : parts[0];
    }

    private static Map<Long, Rating> toMap(List<Object[]> rows) {
        Map<Long, Rating> m = new HashMap<>();
        for (Object[] r : rows) {
            m.put((Long) r[0], new Rating(Math.round(((Number) r[1]).doubleValue() * 10) / 10.0, ((Number) r[2]).longValue()));
        }
        return m;
    }
}
