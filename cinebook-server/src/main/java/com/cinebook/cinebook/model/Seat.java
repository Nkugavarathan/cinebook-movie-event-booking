package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * A physical position in a screen's grid. Inactive seats are gaps (aisles, pillars)
 * and are never bookable; they are kept so the grid shape is preserved.
 */
@Entity
@Table(name = "seat", uniqueConstraints =
        @UniqueConstraint(name = "uk_seat_position", columnNames = {"screen_id", "seat_row", "seat_col"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 1-based row index (1 = row A, closest to the screen). */
    @Column(name = "seat_row")
    private int rowNumber;

    /** 1-based column index. */
    @Column(name = "seat_col")
    private int seatNumber;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SeatType type = SeatType.STANDARD;

    @Builder.Default
    private boolean active = true;

    @ManyToOne(optional = false)
    private Screen screen;

    public String getLabel() {
        return rowLabel(rowNumber) + seatNumber;
    }

    public static String rowLabel(int row) {
        StringBuilder sb = new StringBuilder();
        int n = row;
        while (n > 0) {
            int rem = (n - 1) % 26;
            sb.insert(0, (char) ('A' + rem));
            n = (n - 1) / 26;
        }
        return sb.toString();
    }
}
