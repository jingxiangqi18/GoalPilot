package com.qijx.goalpilot.plan.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.qijx.goalpilot.plan.domain.PlanStatus;

public record PlanSnapshotResponse(
    Long planId,
    Long goalId,
    Long sourceAnalysisId,
    Integer versionNumber,
    PlanStatus status,
    String planTitle,
    String planSummary,
    List<PlanStageResponse> stages,
    LocalDateTime createdAt
) {
}
