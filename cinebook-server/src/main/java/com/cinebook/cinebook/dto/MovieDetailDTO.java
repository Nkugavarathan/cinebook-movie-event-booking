package com.cinebook.cinebook.dto;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieDetailDTO {
    private Long id;
    private String title;
    private String description;
    private String posterUrl;
    private String trailerUrl;
    private List<ShowtimeResponseDTO> showtimes;
}
