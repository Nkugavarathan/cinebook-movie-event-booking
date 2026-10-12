package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.Screen;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScreenRepository extends JpaRepository<Screen, Long> {
    List<Screen> findByTheaterIdOrderByScreenNameAsc(Long theaterId);
    long countByTheaterId(Long theaterId);
}
