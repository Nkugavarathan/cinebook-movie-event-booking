package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.PromoCodeDTO;
import com.cinebook.cinebook.dto.PromoCodeRequest;
import com.cinebook.cinebook.service.PromoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/promos")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPromoController {

    private final PromoService promoService;

    @GetMapping
    public List<PromoCodeDTO> list() {
        return promoService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromoCodeDTO create(@Valid @RequestBody PromoCodeRequest request) {
        return promoService.create(request);
    }

    @PutMapping("/{id}")
    public PromoCodeDTO update(@PathVariable Long id, @Valid @RequestBody PromoCodeRequest request) {
        return promoService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        promoService.delete(id);
    }
}
