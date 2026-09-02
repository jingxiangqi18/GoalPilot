package com.qijx.goalpilot.plan.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PlanGenerationRequest(
    @NotNull(message = "目标ID不能为空")
    @Positive(message = "目标ID必须为正数")
    Long goalId
) {
}
