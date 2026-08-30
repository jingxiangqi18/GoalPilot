package com.qijx.goalpilot.user.dto;

import java.time.LocalDateTime;

import com.qijx.goalpilot.user.domain.UserStatus;
import com.qijx.goalpilot.user.entity.User;

public record UserResponse(
    Long id,
    String username,
    String email,
    UserStatus status,
    LocalDateTime createdAt
) {
    public static UserResponse from(User user){
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getStatus(),
            user.getCreatedAt()
        );
    }
}