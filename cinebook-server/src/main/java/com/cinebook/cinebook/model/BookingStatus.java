package com.cinebook.cinebook.model;

public enum BookingStatus {
    /** Seats are held while the user pays. Released automatically at expiresAt. */
    PENDING,
    /** Paid (verified with Stripe on the server). */
    CONFIRMED,
    /** Hold ran out before payment completed. */
    EXPIRED,
    /** Released by the user, or cancelled by an admin before payment. */
    CANCELLED,
    /** Paid, then refunded (admin cancel, or payment arrived after the seats were taken). */
    REFUNDED
}
