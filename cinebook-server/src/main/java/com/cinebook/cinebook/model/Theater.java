package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "theater")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Theater {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String city;
    private String address;

    /** Comma separated, e.g. "Parking,Food Court,Dolby Atmos". */
    private String facilities;
}
