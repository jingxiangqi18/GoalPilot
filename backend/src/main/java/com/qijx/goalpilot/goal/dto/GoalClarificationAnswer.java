package com.qijx.goalpilot.goal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoalClarificationAnswer(
    @NotBlank(message = "澄清问题不能为空")
    @Size(max = 300, message = "问题长度不得超过300")
    String question,

    @NotBlank(message = "澄清回答不能为空")
    @Size(max = 1000, message = "回答最大长度不得超过1000")
    String answer
) {
    
}
