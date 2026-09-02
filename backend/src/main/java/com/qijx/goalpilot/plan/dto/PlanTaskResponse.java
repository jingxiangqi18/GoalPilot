package com.qijx.goalpilot.plan.dto;

import com.qijx.goalpilot.plan.domain.PlanTaskStatus;

public record PlanTaskResponse(
    Long taskId,
    Integer sortOrder,
    String title,
    String description,
    String completionCriteria,
    PlanTaskStatus status
) {
}
