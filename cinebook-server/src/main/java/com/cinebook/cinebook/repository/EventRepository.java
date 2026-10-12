package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
}
