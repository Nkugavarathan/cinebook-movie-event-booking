package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A customer's rating (1-5) and optional comment for a movie or an event (exactly one is set).
 * One review per customer per listing; NULLs never collide in the unique keys.
 */
@Entity
@Table(name = "review", uniqueConstraints = {
        @UniqueConstraint(name = "uk_review_user_movie", columnNames = {"user_id", "movie_id"}),
        @UniqueConstraint(name = "uk_review_user_event", columnNames = {"user_id", "event_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    @ManyToOne
    private Movie movie;

    @ManyToOne
    private Event event;

    @Column(nullable = false)
    private int rating;

    @Column(length = 1000)
    private String comment;

    /** Hidden by an admin: not shown and not counted in the average. */
    @Builder.Default
    private boolean hidden = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
