package com.cinebook.cinebook.service;

/** Published when a paid booking is refunded (by the customer, an admin, or automatically). */
public record BookingRefundedEvent(Long bookingId) {
}
