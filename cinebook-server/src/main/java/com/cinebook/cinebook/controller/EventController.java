package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Event;
import com.cinebook.cinebook.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Read is public; changes are admin only. */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepo;

    @GetMapping
    public List<Event> list() {
        return eventRepo.findAll();
    }

    @GetMapping("/{id}")
    public Event get(@PathVariable Long id) {
        return eventRepo.findById(id).orElseThrow(() -> ApiException.notFound("Event not found"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Event create(@RequestBody Event event) {
        event.setId(null);
        return eventRepo.save(event);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Event update(@PathVariable Long id, @RequestBody Event event) {
        Event ex = get(id);
        ex.setName(event.getName());
        ex.setDescription(event.getDescription());
        ex.setPosterUrl(event.getPosterUrl());
        ex.setLocation(event.getLocation());
        ex.setCategory(event.getCategory());
        return eventRepo.save(ex);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        eventRepo.deleteById(id);
    }
}
