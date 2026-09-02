package com.qijx.goalpilot.goal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record GoalClarificationAnswerRequest(
    @NotNull
    @Positive
    Long questionId,

    @NotBlank
    @Size(max = 1000)
    String answer
) {
    
}
