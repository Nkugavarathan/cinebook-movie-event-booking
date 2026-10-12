package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.ScreenRequest;
import com.cinebook.cinebook.dto.ScreenWithSeatsDTO;
import com.cinebook.cinebook.service.ScreenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/screens")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminScreenController {

    private final ScreenService screenService;

    @GetMapping
    public List<ScreenWithSeatsDTO> getScreens(@RequestParam(required = false) Long theaterId) {
        return screenService.list(theaterId);
    }

    /** Screen with its full seat layout. */
    @GetMapping("/{id}")
    public ScreenWithSeatsDTO get(@PathVariable Long id) {
        return screenService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScreenWithSeatsDTO addScreen(@Valid @RequestBody ScreenRequest request) {
        return screenService.create(request);
    }

    @PutMapping("/{id}")
    public ScreenWithSeatsDTO update(@PathVariable Long id, @Valid @RequestBody ScreenRequest request) {
        return screenService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteScreen(@PathVariable Long id) {
        screenService.deleteScreen(id);
    }
}
