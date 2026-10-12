package com.cinebook.cinebook.service;

import com.cinebook.cinebook.model.Booking;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Row lock on a booking (SELECT ... FOR UPDATE) that also reloads its state.
 *
 * A plain locking query is not enough: if the booking was already loaded earlier in the same
 * transaction (e.g. for an ownership check), Hibernate returns that cached copy, so a request that
 * waited for the lock would still see the old status and could confirm or refund the booking twice.
 * Refreshing under the lock always yields the committed state.
 */
@Component
public class BookingLock {

    @PersistenceContext
    private EntityManager em;

    /** Must be called inside a transaction. */
    public Optional<Booking> lock(Long bookingId) {
        Booking b = em.find(Booking.class, bookingId);
        if (b == null) return Optional.empty();
        em.refresh(b, LockModeType.PESSIMISTIC_WRITE);
        return Optional.of(b);
    }
}
