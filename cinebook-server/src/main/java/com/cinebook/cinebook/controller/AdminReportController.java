package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.SalesReportDTO;
import com.cinebook.cinebook.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    /** GET /api/admin/reports/sales?from=2026-10-01&to=2026-10-31 */
    @GetMapping("/sales")
    public SalesReportDTO sales(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.report(from, to);
    }

    /** GET /api/admin/reports/sales.csv?type=day|listing|theater|bookings&from=...&to=... */
    @GetMapping("/sales.csv")
    public ResponseEntity<byte[]> salesCsv(@RequestParam(defaultValue = "day") String type,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        // The BOM makes Excel read the file as UTF-8 (names with accents, the rupee sign).
        byte[] body = ("﻿" + reportService.csv(type, from, to)).getBytes(StandardCharsets.UTF_8);
        String filename = "cinebook-sales-" + type + "-" + from + "-to-" + to + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(body);
    }
}
