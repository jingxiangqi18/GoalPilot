package com.qijx.goalpilot.plan.dto;

import java.util.List;

public record PlanGenerationResponse(
    String planTitle,

    String planSummary,

    List<PlanStage> stages
) {
}
