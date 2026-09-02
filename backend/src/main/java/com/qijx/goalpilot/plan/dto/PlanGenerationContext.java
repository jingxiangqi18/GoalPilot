package com.qijx.goalpilot.plan.dto;

import java.util.List;

public record PlanGenerationContext(
    String goalText,
    String goalSummary,
    List<String> knownInformation
) {
}
