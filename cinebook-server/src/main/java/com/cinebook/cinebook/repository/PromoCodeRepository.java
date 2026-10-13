package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {
    Optional<PromoCode> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
    List<PromoCode> findAllByOrderByCreatedAtDesc();
}
