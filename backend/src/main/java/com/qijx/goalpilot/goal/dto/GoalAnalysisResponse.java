package com.qijx.goalpilot.goal.dto;

import java.util.List;

public record GoalAnalysisResponse(
    String goalSummary,
    List<String> knownInformation,
    List<String> missingInformation
){
    
}
