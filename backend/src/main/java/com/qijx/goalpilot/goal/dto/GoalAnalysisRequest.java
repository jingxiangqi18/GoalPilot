package com.qijx.goalpilot.goal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoalAnalysisRequest(
    //用户的描述
    @NotBlank(message = "目标信息不能为空")
    @Size(max = 1000, message = "目标信息不能超过1000个字符")
    String goalText
){
}
