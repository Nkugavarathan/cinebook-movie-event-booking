package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.ShowTime;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ShowTimeRepository extends JpaRepository<ShowTime, Long> {
//    List<ShowTime> findByMovieIdAndShowDate(Long movieId, LocalDate showDate);
//    List<ShowTime> findByScreenIdAndShowDate(Long screenId, LocalDate showDate
//    );
List<ShowTime> findByMovieId(Long movieId);
}
