package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A discount code customers can apply at checkout, e.g. FIRSTSHOW20. */
@Entity
@Table(name = "promo_code")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromoCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stored upper-case; matched case-insensitively. */
    @Column(nullable = false, unique = true, length = 40)
    private String code;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    /** Cap for PERCENT codes (null = no cap). */
    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscount;

    /** Order subtotal needed to use the code (null = any order). */
    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderAmount;

    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;

    /** Total uses across all customers (null = unlimited). */
    private Integer usageLimit;

    /** Uses per customer (null = unlimited). */
    private Integer perUserLimit;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
