package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    long countByRole(com.cinebook.cinebook.model.Role role);

    @org.springframework.data.jpa.repository.Query("select count(u) from User u where u.blocked = true")
    long countBlocked();

    long countByCreatedAtAfter(java.time.LocalDateTime time);
}
