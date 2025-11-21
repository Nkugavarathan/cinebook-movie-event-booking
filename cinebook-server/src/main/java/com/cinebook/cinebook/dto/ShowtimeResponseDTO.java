package com.cinebook.cinebook.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ShowtimeResponseDTO {
    private Long id;
    private LocalDate showDate;
    private LocalTime startTime;
    private double price;
    private Long movieId;
    private Long screenId;
    private String screenName;
}
