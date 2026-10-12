package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(length = 1000)
    private String posterUrl;

    @Column(length = 1000)
    private String backdropUrl;

    @Column(length = 1000)
    private String trailerUrl;

    /** Running time in minutes. */
    private int duration;

    private String genre;
    private String language;

    /** Age certificate, e.g. "PG-13". */
    private String certificate;

    private String director;

    @Column(length = 1000)
    private String castMembers;

    private LocalDate releaseDate;

    /** Inactive movies are hidden from the client app. */
    @Builder.Default
    private boolean active = true;
}
