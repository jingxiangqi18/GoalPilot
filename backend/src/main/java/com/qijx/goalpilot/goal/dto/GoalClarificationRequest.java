package com.qijx.goalpilot.goal.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GoalClarificationRequest(
    @NotBlank
    @Size(max = 1000, message = "目标不能超过1000个字符")
    String goalText,

    @NotEmpty(message = "澄清回答不能为空")
    @Size(max = 10, message = "澄清回答不能超过10项")
    List<
        @NotNull(message = "澄清回答项不能为空")
        @Valid GoalClarificationAnswer
    > clarificationHistory
) {
    
}
