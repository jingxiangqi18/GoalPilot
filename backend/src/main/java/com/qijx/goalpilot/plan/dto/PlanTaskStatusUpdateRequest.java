package com.qijx.goalpilot.plan.dto;

import com.qijx.goalpilot.plan.domain.PlanTaskStatus;

import jakarta.validation.constraints.NotNull;

public record PlanTaskStatusUpdateRequest(
    @NotNull(message = "状态不能为空")
    PlanTaskStatus status
) {
    
}
