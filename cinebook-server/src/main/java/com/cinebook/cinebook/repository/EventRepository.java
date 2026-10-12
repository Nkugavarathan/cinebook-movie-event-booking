package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByActiveTrue();
    List<Event> findAllByOrderByIdDesc();
    long countByActiveTrue();
}
