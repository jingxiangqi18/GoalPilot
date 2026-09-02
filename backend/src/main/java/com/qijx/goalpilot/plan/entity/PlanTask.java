package com.qijx.goalpilot.plan.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.qijx.goalpilot.plan.domain.PlanTaskStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("plan_tasks")
public class PlanTask {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long planStageId;

    private Integer sortOrder;

    private String title;

    private String description;

    private String completionCriteria;

    private PlanTaskStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
