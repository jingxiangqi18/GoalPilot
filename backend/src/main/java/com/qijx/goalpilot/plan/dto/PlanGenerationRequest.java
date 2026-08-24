package com.qijx.goalpilot.plan.dto;

import com.qijx.goalpilot.goal.dto.GoalAnalysisResponse;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PlanGenerationRequest(
    @NotBlank(message = "目标不能为空")
    @Size(max = 1000, message = "目标不能超过1000个字符")
    String goalText,

    @NotNull(message = "目标分析不能为空")
    GoalAnalysisResponse goalAnalysis
) {
    
}
