package com.qijx.goalpilot.goal.dto;

import java.util.List;

import com.qijx.goalpilot.goal.domain.GoalReadiness;

public record GoalAnalysisResponse(
    String goalSummary,
    List<String> knownInformation,
    List<String> missingInformation,
    GoalReadiness readiness,
    List<String> clarificationQuestions
){   
}
