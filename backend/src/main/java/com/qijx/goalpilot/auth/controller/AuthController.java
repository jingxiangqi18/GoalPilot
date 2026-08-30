package com.qijx.goalpilot.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.qijx.goalpilot.auth.dto.UserLoginRequest;
import com.qijx.goalpilot.auth.dto.UserLoginResponse;
import com.qijx.goalpilot.auth.dto.UserRegisterRequest;
import com.qijx.goalpilot.auth.security.CurrentUserId;
import com.qijx.goalpilot.auth.service.AuthService;
import com.qijx.goalpilot.user.dto.UserResponse;
import com.qijx.goalpilot.user.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final UserService userService;

    public AuthController(
        AuthService authService,
        UserService userService
    ){
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(
        @Valid @RequestBody UserRegisterRequest request
    ){
        return authService.register(request);
    }

    @PostMapping("/login")
    public UserLoginResponse login(
        @Valid @RequestBody UserLoginRequest request
    ){
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(
        @CurrentUserId Long userId
    ){
        return userService.getCurrentUser(userId);
    }
}
