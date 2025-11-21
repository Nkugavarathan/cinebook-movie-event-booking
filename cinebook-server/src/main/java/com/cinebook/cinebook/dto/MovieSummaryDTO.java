package com.cinebook.cinebook.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieSummaryDTO {
    private Long id;
    private String title;
    private String posterUrl;
    private String language;
    private String genre;
    private double duration;
}
