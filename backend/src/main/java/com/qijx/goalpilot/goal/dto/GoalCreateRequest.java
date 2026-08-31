package com.qijx.goalpilot.goal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoalCreateRequest(
    @NotBlank(message = "目标信息不能为空")
    @Size(max = 1000)
    String goalText
) {
}
