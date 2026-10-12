package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Stripe event ids already handled, so duplicate webhook deliveries are ignored. */
@Entity
@Table(name = "processed_stripe_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProcessedStripeEvent {

    @Id
    private String eventId;

    private String type;

    private LocalDateTime processedAt;
}
