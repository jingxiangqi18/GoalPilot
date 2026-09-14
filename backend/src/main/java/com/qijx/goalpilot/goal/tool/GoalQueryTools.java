package com.qijx.goalpilot.goal.tool;

import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import com.qijx.goalpilot.goal.domain.GoalPriority;
import com.qijx.goalpilot.goal.dto.GoalListResponse;
import com.qijx.goalpilot.goal.service.GoalService;

@Component
public class GoalQueryTools {
    private final GoalService goalService;

    private static final int PAGE_SIZE = 20;

    public GoalQueryTools(
        GoalService goalService
    ){
        this.goalService = goalService;
    }

    @Tool(description = """
            按优先级分页查询当前用户的目标。
            仅支持 LOW、MEDIUM、HIGH，每页最多返回20条。
            首次查询使用第1页，返回结果包含总记录数和总页数。
            忽略未设置优先级的目标。
            """)
    public GoalListResponse getGoalsByProirity(
        @ToolParam(description = "查询优先级：LOW低、MEDIUM中、HIGH高")
        GoalPriority priority,

        @ToolParam(description = "页码，从1开始")
        int page,

        ToolContext toolContext
    ){
        if(toolContext == null){
            throw new IllegalStateException("工具上下文缺失");
        }

        Object userIdValue = toolContext.getContext().get("userId");

        if(!(userIdValue instanceof Long userId)){
            throw new IllegalStateException("用户上下文无效");
        }

        if(userId <= 0){
            throw new IllegalStateException("用户上下文无效");
        }

        if(priority == null){
            throw new IllegalArgumentException("优先级不能为空");
        }

        if(page < 1){
            throw new IllegalArgumentException("页码必须大于等于1");
        }

        return goalService.findGoalsByPriority(userId, priority, page, PAGE_SIZE);
    }
}
