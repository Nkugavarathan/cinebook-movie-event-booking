package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * A live event (concert, comedy show, play...). Its performances are {@link ShowTime}s on a
 * venue hall ({@link Screen}), so seat selection, holds, payment and tickets work as for movies.
 */
@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String posterUrl;

    @Column(length = 1000)
    private String bannerUrl;

    @Column(length = 2000)
    private String description;

    /** Concert, Comedy, Theatre, Sports, Workshop... */
    private String category;

    /** Artist / performer / organiser line shown on the event page. */
    private String performer;

    private String language;

    /** e.g. "All ages", "18+" */
    private String ageLimit;

    /** Length in minutes; used to block the hall when scheduling. */
    private int duration;

    /** Free-text location hint for listings (the bookable venue comes from the showtime). */
    private String location;

    @Builder.Default
    private boolean active = true;
}
