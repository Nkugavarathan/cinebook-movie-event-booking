package com.cinebook.cinebook.dto;
import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TheaterDetailDTO {
    private Long id;
    private String name;
    private String city;
    private String address;
    private List<ScreenWithSeatsDTO> screens;
}
