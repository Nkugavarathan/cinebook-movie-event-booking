package com.cinebook.cinebook.service;

/** Published when a booking becomes CONFIRMED (payment verified). */
public record BookingConfirmedEvent(Long bookingId) {
}
