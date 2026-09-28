package com.qijx.goalpilot.task.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("tasks")
public class Task {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long taskListId;

    private Long goalId;

    private Long planTaskId;

    private String title;

    private String description;

    private String completionCriteria;

    private TaskStatus status;

    private TaskPriority priority;

    private LocalDateTime deadline;

    private LocalDateTime completedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
