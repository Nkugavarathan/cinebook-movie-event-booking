package com.cinebook.cinebook.dto;
import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingResponseDTO {
    private Long bookingId;
    private boolean paymentSuccess;
    private double totalAmount;
    private List<SeatDTO> seats;
}
