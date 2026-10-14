package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Something customers can add at checkout: popcorn, a drink, a combo. */
@Entity
@Table(name = "snack")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Snack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 300)
    private String description;

    /** Free text used to group the menu, e.g. "Popcorn", "Drinks", "Combos". */
    @Column(length = 40)
    private String category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 1000)
    private String imageUrl;

    /** Inactive snacks are hidden from checkout but kept for old bookings. */
    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
