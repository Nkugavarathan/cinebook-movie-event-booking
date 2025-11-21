package com.cinebook.cinebook.dto;

import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ScreenWithSeatsDTO {
    private Long screenId;
    private String screenName;
    private int rows;
    private int columns;
    private List<SeatDTO> seats;
}
