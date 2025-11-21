package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "movies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 2000)
    private String description;

    private String posterUrl;
    private String trailerUrl;

    private double duration;
    private String genre;
    private String language;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL)
    private List<ShowTime> showTimes;
}
