package com.qijx.goalpilot.goal.tool;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.qijx.goalpilot.plan.dto.PlanSnapshotResponse;
import com.qijx.goalpilot.plan.service.PlanQueryService;

@Component
public class GoalPlanTools {
    private static final Logger log = LoggerFactory.getLogger(GoalPlanTools.class);
    private final PlanQueryService planQueryService;

    public GoalPlanTools(PlanQueryService planQueryService){
        this.planQueryService = planQueryService;
    }

    @Tool(description = "查询当前目标的正式计划，返回计划版本、阶段、任务内容和任务状态")
    public PlanSnapshotResponse getCurrentPlan(ToolContext toolContext){
        if(toolContext == null){
            throw new IllegalStateException("工具上下文缺失");
        }

        Object userIdValue = toolContext.getContext().get("userId");
        Object goalIdValue = toolContext.getContext().get("goalId");

        if(!(userIdValue instanceof Long userId)){
            throw new IllegalStateException("用户上下文无效");
        }

        if(userId <= 0){
            throw new IllegalStateException("用户上下文无效");
        }

        if(!(goalIdValue instanceof Long goalId)){
            throw new IllegalStateException("目标上下文无效");
        }

        if(goalId <= 0){
            throw new IllegalStateException("目标上下文无效");
        }

        try{
            return planQueryService.findCurrentActivePlan(userId, goalId);
        }catch(ResponseStatusException exception){
            if(exception.getStatusCode().value() == HttpStatus.NOT_FOUND.value()){
                throw new IllegalStateException(exception.getReason());
            }

            log.error(
                "查询目标计划失败, userId={}, goalId={}",
                userId, goalId, exception
            );

            throw new IllegalStateException("计划查询失败，请稍后再试");
        }catch(RuntimeException exception){
            log.error(
                "查询目标计划失败, userId={}, goalId={}",
                userId, goalId, exception
            );

        throw new IllegalStateException("计划查询失败，请稍后再试");
        }
    }
}
