package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "show_time")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShowTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate showDate;

    @Column(nullable = false)
    private LocalTime startTime;

    private LocalTime endTime;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceStandard;

    @Column(precision = 10, scale = 2)
    private BigDecimal pricePremium;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceVip;

    @ManyToOne(optional = false)
    private Movie movie;

    @ManyToOne(optional = false)
    private Screen screen;

    public BigDecimal priceFor(SeatType type) {
        return switch (type) {
            case PREMIUM -> pricePremium;
            case VIP -> priceVip;
            default -> priceStandard;
        };
    }

    public LocalDateTime getStartsAt() {
        return LocalDateTime.of(showDate, startTime);
    }
}
