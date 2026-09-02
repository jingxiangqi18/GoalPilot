package com.qijx.goalpilot.plan.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("plan_stages")
public class PlanStageEntity {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long planId;

    private Integer sortOrder;

    private String title;

    private String objective;

    private String timeRange;

    private LocalDateTime createdAt;
}
