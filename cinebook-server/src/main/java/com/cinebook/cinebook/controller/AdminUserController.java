package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.*;
import com.cinebook.cinebook.model.Role;
import com.cinebook.cinebook.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService userService;

    @GetMapping
    public List<AdminUserDTO> list(@RequestParam(required = false) String q,
                                   @RequestParam(required = false) Role role,
                                   @RequestParam(required = false) Boolean blocked) {
        return userService.list(q, role, blocked);
    }

    @GetMapping("/summary")
    public UserStatsDTO summary() {
        return userService.summary();
    }

    /** User with their recent bookings. */
    @GetMapping("/{id}")
    public AdminUserDetailDTO get(@PathVariable Long id) {
        return userService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserDTO create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    /** Change name, role, blocked state or password (only the fields sent). */
    @PatchMapping("/{id}")
    public AdminUserDTO update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
