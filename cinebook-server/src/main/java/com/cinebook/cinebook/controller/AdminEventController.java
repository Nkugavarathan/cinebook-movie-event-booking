package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.EventRequestDTO;
import com.cinebook.cinebook.dto.EventSummaryDTO;
import com.cinebook.cinebook.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminEventController {

    private final EventService eventService;

    @GetMapping
    public List<EventSummaryDTO> list() {
        return eventService.listAll();
    }

    @GetMapping("/{id}")
    public EventSummaryDTO get(@PathVariable Long id) {
        return eventService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventSummaryDTO create(@Valid @RequestBody EventRequestDTO dto) {
        return eventService.create(dto);
    }

    @PutMapping("/{id}")
    public EventSummaryDTO update(@PathVariable Long id, @Valid @RequestBody EventRequestDTO dto) {
        return eventService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        eventService.delete(id);
    }
}
