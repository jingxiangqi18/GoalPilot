package com.qijx.goalpilot.goal.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("goal_clarification_questions")
public class GoalClarificationQuestion {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long analysisId;

    private String questionText;

    private Integer sortOrder;

    private String answerText;

    private LocalDateTime answeredAt;

    private LocalDateTime createdAt;
}
