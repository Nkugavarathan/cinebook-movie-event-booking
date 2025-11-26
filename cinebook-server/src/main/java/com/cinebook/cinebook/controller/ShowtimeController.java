package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.model.ShowTime;
import com.cinebook.cinebook.service.ShowTimeService;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/showtime")
@RequiredArgsConstructor
public class ShowTimeController {
private final ShowTimeService showTimeService;
    @PostMapping("/{movieId}/{screenId}")
    public ShowTime addShowTime(
            @PathVariable Long movieId,
            @PathVariable Long screenId,
            @RequestBody ShowTime showTime) {
        return showTimeService.addShowTime(movieId, screenId, showTime);
    }
}
