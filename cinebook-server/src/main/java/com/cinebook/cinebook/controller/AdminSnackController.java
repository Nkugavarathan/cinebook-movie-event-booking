package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.SnackDTO;
import com.cinebook.cinebook.dto.SnackRequest;
import com.cinebook.cinebook.service.SnackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/snacks")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminSnackController {

    private final SnackService snackService;

    @GetMapping
    public List<SnackDTO> list() {
        return snackService.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SnackDTO create(@Valid @RequestBody SnackRequest request) {
        return snackService.create(request);
    }

    @PutMapping("/{id}")
    public SnackDTO update(@PathVariable Long id, @Valid @RequestBody SnackRequest request) {
        return snackService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        snackService.delete(id);
    }
}
