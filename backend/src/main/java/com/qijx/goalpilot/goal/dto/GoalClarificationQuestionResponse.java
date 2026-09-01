package com.qijx.goalpilot.goal.dto;

public record GoalClarificationQuestionResponse(
    Long questionId,
    String question,
    String answer
) {
}
