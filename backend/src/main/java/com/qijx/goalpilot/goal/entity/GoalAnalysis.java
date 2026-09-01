package com.qijx.goalpilot.goal.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.qijx.goalpilot.goal.domain.GoalReadiness;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName(value = "goal_analyses", autoResultMap = true)
public class GoalAnalysis {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long goalId;

    private Integer versionNumber;

    private String goalSummary;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> knownInformation;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> missingInformation;

    private GoalReadiness readiness;

    private LocalDateTime createdAt;
}
