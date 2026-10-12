package com.cinebook.cinebook.dto;

import java.util.List;

public record AdminUserDetailDTO(AdminUserDTO user, List<BookingResponseDTO> bookings, String currency) {
}
