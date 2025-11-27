package com.cinebook.cinebook.dto;

import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingRequestDTO {
    private Long userId;
    private Long showTimeId;
    private List<Long> seatIds;
//    private double expectedAmount;
}
