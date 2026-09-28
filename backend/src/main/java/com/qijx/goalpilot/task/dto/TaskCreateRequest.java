package com.qijx.goalpilot.task.dto;

import java.time.LocalDateTime;

import com.qijx.goalpilot.task.entity.TaskPriority;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record TaskCreateRequest(
    @NotBlank(message = "标题不能为空")
    @Size(max = 300, message = "标题不能超过300个字符")
    String title,

    @Size(max = 5000, message = "描述不能超过5000个字符")
    String description,

    @Size(max = 2000, message = "完成标准不能超过2000个字符")
    String completionCriteria,

    TaskPriority priority,

    LocalDateTime deadline,

    @Positive(message = "目标ID必须大于0")
    Long goalId
) {
}
