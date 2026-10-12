package com.cinebook.cinebook.service.impl;

import com.cinebook.cinebook.dto.AuthResponse;
import com.cinebook.cinebook.dto.LoginRequest;
import com.cinebook.cinebook.dto.SignupRequest;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Role;
import com.cinebook.cinebook.model.User;
import com.cinebook.cinebook.repository.UserRepository;
import com.cinebook.cinebook.security.CurrentUser;
import com.cinebook.cinebook.security.JwtUtil;
import com.cinebook.cinebook.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final CurrentUser currentUser;

    @Override
    public AuthResponse signup(SignupRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }

        User user = User.builder()
                .name(request.name().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();
        userRepository.save(user);

        return toResponse(user, jwtUtil.generateToken(user.getEmail(), user.getRole().name()));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        return toResponse(user, jwtUtil.generateToken(user.getEmail(), user.getRole().name()));
    }

    @Override
    public AuthResponse me() {
        return toResponse(currentUser.require(), null);
    }

    private AuthResponse toResponse(User user, String token) {
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }
}
