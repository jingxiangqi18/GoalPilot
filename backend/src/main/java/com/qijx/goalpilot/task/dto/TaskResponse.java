package com.qijx.goalpilot.task.dto;

import java.time.LocalDateTime;

import com.qijx.goalpilot.task.entity.Task;
import com.qijx.goalpilot.task.entity.TaskPriority;
import com.qijx.goalpilot.task.entity.TaskStatus;

public record TaskResponse(
    Long id,

    Long goalId,

    Long planTaskId,

    String title,

    String description,

    String completionCriteria,

    TaskStatus status,

    TaskPriority priority,

    LocalDateTime deadline,

    LocalDateTime completedAt,

    LocalDateTime createdAt,

    LocalDateTime updatedAt
) {
    public static TaskResponse from(Task task){
        return new TaskResponse(
            task.getId(),
            task.getGoalId(),
            task.getPlanTaskId(),
            task.getTitle(),
            task.getDescription(),
            task.getCompletionCriteria(),
            task.getStatus(),
            task.getPriority(),
            task.getDeadline(),
            task.getCompletedAt(),
            task.getCreatedAt(),
            task.getUpdatedAt()
        );
    }
}
