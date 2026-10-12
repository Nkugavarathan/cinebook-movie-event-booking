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

    /** Exactly one of movie / event is set. */
    @ManyToOne
    private Movie movie;

    @ManyToOne
    private Event event;

    @ManyToOne(optional = false)
    private Screen screen;

    public boolean isEvent() {
        return event != null;
    }

    public String getKind() {
        return isEvent() ? "EVENT" : "MOVIE";
    }

    public Long getListingId() {
        return isEvent() ? event.getId() : movie.getId();
    }

    public String getTitle() {
        return isEvent() ? event.getName() : movie.getTitle();
    }

    public String getPosterUrl() {
        return isEvent() ? event.getPosterUrl() : movie.getPosterUrl();
    }

    public int getDurationMinutes() {
        return isEvent() ? event.getDuration() : movie.getDuration();
    }

    /** Whether the movie/event is still listed for sale. */
    public boolean isListingActive() {
        return isEvent() ? event.isActive() : movie.isActive();
    }

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
