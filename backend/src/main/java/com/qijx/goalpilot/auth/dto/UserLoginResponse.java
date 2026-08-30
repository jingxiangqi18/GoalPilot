package com.qijx.goalpilot.auth.dto;

import com.qijx.goalpilot.user.dto.UserResponse;

public record UserLoginResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    UserResponse user
) {
}
