package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.model.Event;
import com.cinebook.cinebook.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepo;

    @GetMapping
    public List<Event> list() {
        return eventRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<Event> create(@RequestBody Event event) {
        Event saved = eventRepo.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public Event get(@PathVariable Long id) {
        return eventRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
    }

    @PutMapping("/{id}")
    public Event update(@PathVariable Long id, @RequestBody Event event) {
        Event ex = eventRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        ex.setName(event.getName());
        ex.setDescription(event.getDescription());
        ex.setPosterUrl(event.getPosterUrl());
        ex.setLocation(event.getLocation());
        ex.setCategory(event.getCategory());
        return eventRepo.save(ex);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        eventRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
