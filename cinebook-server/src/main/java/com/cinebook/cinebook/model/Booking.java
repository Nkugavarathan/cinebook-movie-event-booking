package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "booking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human friendly ticket code, e.g. CB-7K2P9QX. */
    @Column(unique = true, nullable = false)
    private String reference;

    @ManyToOne(optional = false)
    private User user;

    @ManyToOne(optional = false)
    private ShowTime showTime;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("seatLabel ASC")
    @Builder.Default
    private List<BookingSeat> seats = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    /** Amount to pay: subtotalAmount - discountAmount. */
    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;

    /** Sum of seat prices before any promo code (null on old bookings = totalAmount). */
    @Column(precision = 10, scale = 2)
    private BigDecimal subtotalAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountAmount;

    /** Promo code applied at checkout, if any. */
    private String promoCode;

    private String currency;

    /** Snapshot like "A5, A6" so the history survives seat releases. */
    private String seatLabels;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;

    /** Who the ticket is for, entered at checkout (may differ from the account holder). */
    private String contactName;
    private String contactEmail;
    private String contactPhone;

    private String stripeSessionId;
    private String stripePaymentIntentId;
    private String stripeRefundId;

    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount;

    /** CUSTOMER, ADMIN or SYSTEM (late payment) - who cancelled / refunded. */
    private String cancelledBy;

    /** When the PDF ticket was last emailed (null = not sent yet / email disabled). */
    private LocalDateTime ticketEmailedAt;

    /** When the refund confirmation email was sent. */
    private LocalDateTime refundEmailedAt;

    /** When the ticket was scanned at the door (null = not yet). */
    private LocalDateTime checkedInAt;

    /** Email of the staff member who checked it in. */
    private String checkedInBy;
}
