package com.cinebook.cinebook.service;
import com.cinebook.cinebook.dto.*;

public interface AuthService {
    AuthResponse signup(SignupRequest request);
    AuthResponse login(LoginRequest request);
}
