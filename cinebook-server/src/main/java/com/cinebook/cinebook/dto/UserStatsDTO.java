package com.cinebook.cinebook.dto;

public record UserStatsDTO(long total, long admins, long blocked, long newThisWeek, String currency) {
}
