package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.ProcessedStripeEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessedStripeEventRepository extends JpaRepository<ProcessedStripeEvent, String> {
}
