package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * One seat in one booking. While the booking is live (PENDING or CONFIRMED) {@code locked}
 * is TRUE; once released it becomes NULL. The unique key on (show_time_id, seat_id, locked)
 * lets only one live booking own a seat for a showtime, so the database itself rejects a
 * concurrent double booking, while released rows (NULLs never collide in a unique index)
 * keep the booking history.
 */
@Entity
@Table(name = "booking_seat", uniqueConstraints =
        @UniqueConstraint(name = "uk_showtime_seat_locked", columnNames = {"show_time_id", "seat_id", "locked"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Booking booking;

    @ManyToOne(optional = false)
    private ShowTime showTime;

    @ManyToOne(optional = false)
    private Seat seat;

    @Enumerated(EnumType.STRING)
    private SeatType seatType;

    private String seatLabel;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    /** TRUE while the seat is held/booked, NULL once released. Never FALSE. */
    private Boolean locked;
}
