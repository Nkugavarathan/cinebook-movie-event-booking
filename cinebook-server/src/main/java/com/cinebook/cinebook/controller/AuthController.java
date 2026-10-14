package com.cinebook.cinebook.controller;

import com.cinebook.cinebook.dto.AuthResponse;
import com.cinebook.cinebook.dto.ForgotPasswordRequest;
import com.cinebook.cinebook.dto.LoginRequest;
import com.cinebook.cinebook.dto.ResetPasswordRequest;
import com.cinebook.cinebook.dto.SignupRequest;
import com.cinebook.cinebook.service.AuthService;
import com.cinebook.cinebook.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    /** Always the same answer, whether or not the email has an account. */
    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.email());
        return Map.of("message", "If an account exists for that email, we've sent a link to reset the password.");
    }

    @GetMapping("/reset-password/validate")
    public Map<String, Boolean> validateResetToken(@RequestParam(required = false) String token) {
        return Map.of("valid", passwordResetService.isValid(token));
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.password());
        return Map.of("message", "Your password has been changed. You can sign in now.");
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponse me() {
        return authService.me();
    }
}
