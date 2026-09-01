package com.qijx.goalpilot.goal.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.qijx.goalpilot.goal.domain.GoalReadiness;

public record GoalAnalysisSnapshotResponse(
    Long analysisId,

    Long goalId,

    Integer versionNumber,

    String goalSummary,

    List<String> knownInformation,

    List<String> missingInformation,

    GoalReadiness readiness,

    List<GoalClarificationQuestionResponse> clarificationQuestions,
    
    LocalDateTime createdAt
) {
    
}
