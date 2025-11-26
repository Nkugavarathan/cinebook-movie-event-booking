package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.service.ScreenService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

//@RestController
//@RequestMapping("/api/screens")
//@RequiredArgsConstructor
//public class ScreenController {
//
//    private final ScreenService screenService;
//
//    @PostMapping
//    public ResponseEntity<Screen> create(@RequestBody Screen screen) {
//        Screen saved = screenService.createScreen(screen);
//        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
//    }
//
//    @GetMapping("/by-theater/{theaterId}")
//    public List<ScreenWithSeatsDTO> getByTheater(@PathVariable Long theaterId) {
//        return screenService.getScreensByTheater(theaterId);
//    }
//}

@RestController
@RequestMapping("/api/admin/screens")
@RequiredArgsConstructor
public class AdminScreenController {

    private final ScreenService screenService;

    @PostMapping("/{theaterId}")
    public Screen addScreen(@RequestBody Screen screen, @PathVariable Long theaterId) {
        return screenService.addScreen(screen, theaterId);
    }

    @GetMapping
    public List<Screen> getScreens() {
        return screenService.getAllScreens();
    }

    //get single theater
    @GetMapping("/theater/{theaterId}")
    public List<Screen> getScreensByTheater(@PathVariable Long theaterId) {
        return screenService.getScreensByTheater(theaterId);
    }

    @DeleteMapping("/{id}")
    public void deleteScreen(@PathVariable Long id) {
        screenService.deleteScreen(id);
    }
}
