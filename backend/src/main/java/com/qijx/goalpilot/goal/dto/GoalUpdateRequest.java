package com.qijx.goalpilot.goal.dto;

import java.time.LocalDateTime;

import com.qijx.goalpilot.goal.domain.GoalPriority;

import jakarta.validation.constraints.Size;

public record GoalUpdateRequest(
    @Size(max = 1000, message = "目标信息不能超过1000个字符")
    String goalText,

    GoalPriority priority,

    LocalDateTime deadline
) {
    
}
