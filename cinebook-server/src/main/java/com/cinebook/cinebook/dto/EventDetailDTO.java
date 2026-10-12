package com.cinebook.cinebook.dto;

import java.util.List;

public record EventDetailDTO(EventSummaryDTO event, List<ShowtimeResponseDTO> showtimes) {
}
