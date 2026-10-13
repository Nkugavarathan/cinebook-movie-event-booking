package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByMovieIdOrderByCreatedAtDesc(Long movieId);
    List<Review> findByEventIdOrderByCreatedAtDesc(Long eventId);

    Optional<Review> findByUserIdAndMovieId(Long userId, Long movieId);
    Optional<Review> findByUserIdAndEventId(Long userId, Long eventId);

    List<Review> findAllByOrderByCreatedAtDesc();

    /** [movieId, average, count] over visible reviews. */
    @Query("select r.movie.id, avg(r.rating), count(r) from Review r where r.movie is not null and r.hidden = false group by r.movie.id")
    List<Object[]> movieRatings();

    /** [eventId, average, count] over visible reviews. */
    @Query("select r.event.id, avg(r.rating), count(r) from Review r where r.event is not null and r.hidden = false group by r.event.id")
    List<Object[]> eventRatings();
}
