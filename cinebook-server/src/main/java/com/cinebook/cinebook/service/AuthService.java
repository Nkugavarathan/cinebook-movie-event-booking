package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.AuthResponse;
import com.cinebook.cinebook.dto.LoginRequest;
import com.cinebook.cinebook.dto.SignupRequest;

public interface AuthService {
    AuthResponse signup(SignupRequest request);

    AuthResponse login(LoginRequest request);

    /** Profile of the signed-in user (token field is null). */
    AuthResponse me();
}
