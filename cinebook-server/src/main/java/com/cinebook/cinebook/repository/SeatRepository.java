package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByScreenIdOrderByRowNumberAscSeatNumberAsc(Long screenId);

    @Query("select count(s) from Seat s where s.screen.id = :screenId and s.active = true")
    long countActiveByScreenId(@Param("screenId") Long screenId);

    @Modifying
    @Query("delete from Seat s where s.screen.id = :screenId")
    void deleteByScreenId(@Param("screenId") Long screenId);
}
