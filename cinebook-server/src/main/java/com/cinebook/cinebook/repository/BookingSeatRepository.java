package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.BookingSeat;
import com.cinebook.cinebook.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {

    /** Seats currently held or booked for a showtime. */
    @Query("""
            select bs from BookingSeat bs join fetch bs.booking b
            where bs.showTime.id = :showTimeId and bs.locked = true
            """)
    List<BookingSeat> findLockedForShowTime(@Param("showTimeId") Long showTimeId);

    @Query("""
            select bs from BookingSeat bs
            where bs.showTime.id = :showTimeId and bs.locked = true and bs.seat.id in :seatIds
            """)
    List<BookingSeat> findLockedForSeats(@Param("showTimeId") Long showTimeId,
                                         @Param("seatIds") Collection<Long> seatIds);

    @Query("""
            select count(bs) from BookingSeat bs
            where bs.showTime.id = :showTimeId and bs.locked = true and bs.booking.status in :statuses
            """)
    long countLocked(@Param("showTimeId") Long showTimeId, @Param("statuses") Collection<BookingStatus> statuses);

    /** Seats of paid bookings for a showtime; checkedIn = true counts only those already scanned in. */
    @Query("""
            select count(bs) from BookingSeat bs
            where bs.showTime.id = :showTimeId and bs.locked = true and bs.booking.status = :status
              and (:checkedIn = false or bs.booking.checkedInAt is not null)
            """)
    long countPaidSeats(@Param("showTimeId") Long showTimeId, @Param("status") BookingStatus status,
                        @Param("checkedIn") boolean checkedIn);
}
