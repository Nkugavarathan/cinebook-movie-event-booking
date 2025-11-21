package com.cinebook.cinebook.dto;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SeatDTO {
    private Long id;
    private int rowNumber;
    private int seatNumber;
    private boolean available; // computed by backend
}
