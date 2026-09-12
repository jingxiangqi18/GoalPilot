package com.qijx.goalpilot.goal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoalAssistantRequest(
    @NotBlank(message = "请求消息不能为空")
    @Size(max = 2000, message = "请求不能超过2000个字符")
    String message
) {
    
}
