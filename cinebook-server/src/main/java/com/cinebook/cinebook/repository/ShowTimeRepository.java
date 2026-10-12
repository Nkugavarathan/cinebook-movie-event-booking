package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.ShowTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ShowTimeRepository extends JpaRepository<ShowTime, Long> {

    @Query("""
            select st from ShowTime st
            where st.movie.id = :movieId and st.showDate >= :fromDate
            order by st.showDate, st.startTime
            """)
    List<ShowTime> findUpcomingForMovie(@Param("movieId") Long movieId, @Param("fromDate") LocalDate fromDate);

    @Query("""
            select st from ShowTime st
            where st.showDate >= :fromDate and st.movie.active = true
            order by st.showDate, st.startTime
            """)
    List<ShowTime> findAllUpcoming(@Param("fromDate") LocalDate fromDate);

    List<ShowTime> findByScreenIdAndShowDate(Long screenId, LocalDate showDate);

    @Query("""
            select st from ShowTime st
            where (:movieId is null or st.movie.id = :movieId)
              and (:theaterId is null or st.screen.theater.id = :theaterId)
              and (:date is null or st.showDate = :date)
            order by st.showDate desc, st.startTime desc
            """)
    List<ShowTime> search(@Param("movieId") Long movieId,
                          @Param("theaterId") Long theaterId,
                          @Param("date") LocalDate date);

    List<ShowTime> findByMovieId(Long movieId);
    List<ShowTime> findByScreenId(Long screenId);
    boolean existsByScreenId(Long screenId);

    long countByShowDateGreaterThanEqual(LocalDate date);
}
