package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.SnackDTO;
import com.cinebook.cinebook.service.SnackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The snack menu shown at checkout. */
@RestController
@RequestMapping("/api/snacks")
@RequiredArgsConstructor
public class SnackController {

    private final SnackService snackService;

    @GetMapping
    public List<SnackDTO> menu() {
        return snackService.menu();
    }
}
