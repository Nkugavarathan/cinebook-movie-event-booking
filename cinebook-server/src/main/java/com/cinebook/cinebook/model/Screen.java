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

    private String screenName;
    @Column(name = "total_rows")
    private int rows;

    @Column(name = "total_columns")
    private int columns;

    @ManyToOne
    private Theater theater;
}
