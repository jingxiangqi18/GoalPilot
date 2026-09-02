package com.qijx.goalpilot.plan.dto;

import java.util.List;

public record PlanStageResponse(
    Long stageId,
    Integer sortOrder,
    String title,
    String objective,
    String timeRange,
    List<PlanTaskResponse> tasks
) {
}
