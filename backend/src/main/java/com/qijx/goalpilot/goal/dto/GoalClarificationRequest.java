package com.qijx.goalpilot.goal.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GoalClarificationRequest(
    @NotEmpty(message = "澄清回答不能为空")
    @Size(max = 3, message = "一次最多提交三个澄清回答")
    List<
        @NotNull(message = "澄清回答不能为空")
        @Valid GoalClarificationAnswerRequest
    > answers
) {
    
}
