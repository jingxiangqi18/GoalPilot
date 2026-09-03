package com.qijx.goalpilot.plan.dto;

import java.time.LocalDateTime;

import com.qijx.goalpilot.goal.domain.GoalStatus;
import com.qijx.goalpilot.goal.entity.Goal;
import com.qijx.goalpilot.plan.domain.PlanStatus;
import com.qijx.goalpilot.plan.entity.Plan;

public record PlanApprovalResponse(
    Long planId,
    Long goalId,
    Integer versionNumber,
    PlanStatus planStatus,
    GoalStatus goalStatus,
    LocalDateTime updatedAt
) {
    public static PlanApprovalResponse from(Plan plan, Goal goal){
        return new PlanApprovalResponse(
            plan.getId(),
            goal.getId(),
            plan.getVersionNumber(),
            plan.getStatus(),
            goal.getStatus(),
            plan.getUpdatedAt()
        );
    }
}
