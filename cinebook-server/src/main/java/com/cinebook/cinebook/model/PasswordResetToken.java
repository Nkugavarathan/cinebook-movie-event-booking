package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One "forgot password" link. Only a SHA-256 hash of the token is stored, so someone who reads
 * the database still can't use the link that was emailed.
 */
@Entity
@Table(name = "password_reset_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** Set once the link has been used (or replaced by a newer link). */
    private LocalDateTime usedAt;

    public boolean isUsable() {
        return usedAt == null && LocalDateTime.now().isBefore(expiresAt);
    }
}
