package com.qijx.goalpilot.goal.dto;

import java.time.LocalDateTime;

import com.qijx.goalpilot.goal.domain.GoalPriority;
import com.qijx.goalpilot.goal.domain.GoalStatus;
import com.qijx.goalpilot.goal.entity.Goal;

public record GoalResponse(
    Long id,

    String goalText,

    GoalStatus status,

    GoalPriority priority,

    LocalDateTime deadline,

    String successCriteria,

    String constraintText,

    LocalDateTime createdAt,

    LocalDateTime updatedAt
) {
    public static GoalResponse from(Goal goal){
        return new GoalResponse(
            goal.getId(),
            goal.getGoalText(),
            goal.getStatus(),
            goal.getPriority(),
            goal.getDeadline(),
            goal.getSuccessCriteria(),
            goal.getConstraintText(),
            goal.getCreatedAt(),
            goal.getUpdatedAt());
    }
}
