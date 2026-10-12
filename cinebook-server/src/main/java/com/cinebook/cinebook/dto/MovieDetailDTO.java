package com.cinebook.cinebook.dto;

import java.util.List;

public record MovieDetailDTO(MovieSummaryDTO movie, List<ShowtimeResponseDTO> showtimes) {
}
