package com.cinebook.cinebook.model;

public enum Role {
    USER,
    /** Door staff: can only use the ticket check-in scanner in the admin app. */
    STAFF,
    ADMIN
}
