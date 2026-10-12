package com.cinebook.cinebook.security;

import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.User;
import com.cinebook.cinebook.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** Resolves the signed-in user from the JWT-populated security context. */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepository userRepository;

    public Optional<User> find() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        return userRepository.findByEmailIgnoreCase(auth.getName());
    }

    public User require() {
        return find().orElseThrow(() ->
                new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in to continue"));
    }
}
