package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.*;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.BookingStatus;
import com.cinebook.cinebook.model.Role;
import com.cinebook.cinebook.model.User;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.UserRepository;
import com.cinebook.cinebook.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Admin user management: view accounts and their activity, change roles, block and delete.
 * Admins never handle passwords - customers create their own accounts. Guard rails: an admin can't block, demote or delete themselves,
 * and the last remaining admin can never be demoted, blocked or deleted.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepo;
    private final BookingRepository bookingRepo;
    private final CurrentUser currentUser;
    private final DtoMapper mapper;

    @Transactional(readOnly = true)
    public List<AdminUserDTO> list(String query, Role role, Boolean blocked) {
        Map<Long, Object[]> stats = stats();
        Long me = currentUser.require().getId();
        String q = query == null ? "" : query.trim().toLowerCase();
        return userRepo.findAll().stream()
                .filter(u -> q.isEmpty() || contains(u.getName(), q) || contains(u.getEmail(), q))
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> blocked == null || u.isBlocked() == blocked)
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(u -> toDto(u, stats.get(u.getId()), me))
                .toList();
    }

    @Transactional(readOnly = true)
    public UserStatsDTO summary() {
        return new UserStatsDTO(userRepo.count(), userRepo.countByRole(Role.ADMIN), userRepo.countBlocked(),
                userRepo.countByCreatedAtAfter(LocalDateTime.now().minusDays(7)), mapper.currency());
    }

    @Transactional(readOnly = true)
    public AdminUserDetailDTO get(Long id) {
        User u = find(id);
        List<BookingResponseDTO> bookings = bookingRepo.findByUserIdOrderByCreatedAtDesc(id).stream()
                .limit(50).map(mapper::booking).toList();
        return new AdminUserDetailDTO(toDto(u, stats().get(id), currentUser.require().getId()), bookings, mapper.currency());
    }

    @Transactional
    public AdminUserDTO update(Long id, UpdateUserRequest req) {
        User me = currentUser.require();
        User u = find(id);
        boolean self = u.getId().equals(me.getId());

        if (req.name() != null && !req.name().isBlank()) {
            u.setName(req.name().trim());
        }
        if (req.role() != null && req.role() != u.getRole()) {
            if (self) throw ApiException.badRequest("You can't change your own role");
            if (u.getRole() == Role.ADMIN) requireAnotherAdmin();
            u.setRole(req.role());
            log.info("Admin {} changed role of {} to {}", me.getEmail(), u.getEmail(), req.role());
        }
        if (req.blocked() != null && req.blocked() != u.isBlocked()) {
            if (self) throw ApiException.badRequest("You can't block your own account");
            if (req.blocked() && u.getRole() == Role.ADMIN) requireAnotherAdmin();
            u.setBlocked(req.blocked());
            log.info("Admin {} {} {}", me.getEmail(), req.blocked() ? "blocked" : "unblocked", u.getEmail());
        }
        return toDto(userRepo.save(u), stats().get(id), me.getId());
    }

    @Transactional
    public void delete(Long id) {
        User me = currentUser.require();
        User u = find(id);
        if (u.getId().equals(me.getId())) throw ApiException.badRequest("You can't delete your own account");
        if (u.getRole() == Role.ADMIN) requireAnotherAdmin();
        if (bookingRepo.existsByUserId(id)) {
            throw ApiException.conflict("This user has bookings, so the account can't be deleted. Block it instead.");
        }
        userRepo.delete(u);
        log.info("Admin {} deleted user {}", me.getEmail(), u.getEmail());
    }

    private void requireAnotherAdmin() {
        if (userRepo.countByRole(Role.ADMIN) <= 1) {
            throw ApiException.badRequest("This is the only admin account. Make someone else an admin first.");
        }
    }

    private User find(Long id) {
        return userRepo.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    private Map<Long, Object[]> stats() {
        Map<Long, Object[]> map = new HashMap<>();
        for (Object[] row : bookingRepo.statsByUser(BookingStatus.CONFIRMED)) {
            map.put((Long) row[0], row);
        }
        return map;
    }

    private static AdminUserDTO toDto(User u, Object[] s, Long me) {
        long count = s == null ? 0 : ((Number) s[1]).longValue();
        BigDecimal spent = s == null ? BigDecimal.ZERO : (BigDecimal) s[2];
        LocalDateTime last = s == null ? null : (LocalDateTime) s[3];
        return new AdminUserDTO(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.isBlocked(),
                u.getCreatedAt(), count, spent, last, u.getId().equals(me));
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase().contains(q);
    }
}
