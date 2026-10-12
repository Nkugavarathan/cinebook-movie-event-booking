package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    List<Movie> findByActiveTrueOrderByReleaseDateDesc();
    List<Movie> findAllByOrderByIdDesc();
    long countByActiveTrue();
}
