package com.qijx.goalpilot.plan.dto;

import java.util.List;

public record PlanStage(
    String title,
    String objective,
    String timeRange,
    List<PlannedTask> tasks
) {
    
}
