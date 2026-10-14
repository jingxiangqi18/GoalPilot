package com.qijx.goalpilot.task.dto;

import java.time.LocalDateTime;

import com.qijx.goalpilot.task.entity.TaskPriority;
import com.qijx.goalpilot.task.entity.TaskStatus;

import jakarta.validation.constraints.Size;

public record TaskUpdateRequest(
    @Size(max = 300, message = "标题不能超过300个字符")
    String title,

    @Size(max = 5000, message = "描述不能超过5000个字符")
    String description,

    @Size(max = 2000, message = "完成标准不能超过2000个字符")
    String completionCriteria,

    TaskPriority priority,

    TaskStatus status,

    LocalDateTime deadline,

    Boolean clearDeadline
) {
}
