package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "screen")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Screen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String screenName;

    /** e.g. 2D, 3D, IMAX, 4DX */
    private String format;

    @Column(name = "total_rows")
    private int rows;

    @Column(name = "total_columns")
    private int columns;

    @ManyToOne(optional = false)
    private Theater theater;
}
