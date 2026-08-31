package com.qijx.goalpilot.goal.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.qijx.goalpilot.goal.domain.GoalPriority;
import com.qijx.goalpilot.goal.domain.GoalStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("goals")
public class Goal {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String goalText;

    private GoalStatus status;

    private GoalPriority priority;

    private LocalDateTime deadline;

    private String successCriteria;

    private String constraintText;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
