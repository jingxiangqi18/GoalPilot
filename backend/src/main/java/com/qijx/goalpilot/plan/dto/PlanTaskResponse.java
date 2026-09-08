package com.qijx.goalpilot.plan.dto;

import com.qijx.goalpilot.plan.domain.PlanTaskStatus;
import com.qijx.goalpilot.plan.entity.PlanTask;

public record PlanTaskResponse(
    Long taskId,
    Integer sortOrder,
    String title,
    String description,
    String completionCriteria,
    PlanTaskStatus status
) {
    public static PlanTaskResponse from(PlanTask task){
        return new PlanTaskResponse(
            task.getId(),
            task.getSortOrder(),
            task.getTitle(),
            task.getDescription(),
            task.getCompletionCriteria(),
            task.getStatus());
    }
}
