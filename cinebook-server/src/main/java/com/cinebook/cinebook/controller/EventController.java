package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.EventDetailDTO;
import com.cinebook.cinebook.dto.EventSummaryDTO;
import com.cinebook.cinebook.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public event listings for the client app. */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public List<EventSummaryDTO> list(@RequestParam(required = false) String category,
                                      @RequestParam(required = false) String search) {
        return eventService.listPublic(category, search);
    }

    @GetMapping("/{id}")
    public EventDetailDTO get(@PathVariable Long id) {
        return eventService.getPublicDetail(id);
    }
}
