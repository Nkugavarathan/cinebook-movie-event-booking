package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.Snack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SnackRepository extends JpaRepository<Snack, Long> {

    List<Snack> findByActiveTrueOrderByCategoryAscPriceAsc();

    List<Snack> findAllByOrderByCategoryAscNameAsc();

    /** Per snack: [snackId, units sold on paid bookings]. */
    @Query("""
            select bs.snack.id, coalesce(sum(bs.quantity), 0) from BookingSnack bs
            where bs.booking.status = com.cinebook.cinebook.model.BookingStatus.CONFIRMED
            group by bs.snack.id
            """)
    List<Object[]> unitsSold();

    @Query("select count(bs) > 0 from BookingSnack bs where bs.snack.id = :snackId")
    boolean isUsed(@org.springframework.data.repository.query.Param("snackId") Long snackId);
}
