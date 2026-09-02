package com.qijx.goalpilot.plan.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.qijx.goalpilot.plan.domain.PlanStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("plans")
public class Plan {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long goalId;

    private Long sourceAnalysisId;

    private Integer versionNumber;

    private PlanStatus status;

    private String title;

    private String summary;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
