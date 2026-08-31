package com.qijx.goalpilot.goal.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qijx.goalpilot.goal.domain.GoalStatus;
import com.qijx.goalpilot.goal.dto.GoalCreateRequest;
import com.qijx.goalpilot.goal.dto.GoalListResponse;
import com.qijx.goalpilot.goal.dto.GoalResponse;
import com.qijx.goalpilot.goal.entity.Goal;
import com.qijx.goalpilot.goal.mapper.GoalMapper;

@Service
public class GoalService {
    private final GoalMapper goalMapper;

    public GoalService(GoalMapper goalMapper){
        this.goalMapper = goalMapper;
    }

    public GoalResponse createGoal(Long userId, GoalCreateRequest request){
        String normalizedGoalText = request.goalText().trim();

        Goal goal = new Goal();

        goal.setUserId(userId);
        goal.setGoalText(normalizedGoalText);
        goal.setStatus(GoalStatus.DRAFT);

        LocalDateTime now = LocalDateTime.now();

        goal.setCreatedAt(now);
        goal.setUpdatedAt(now);

        int insertedRows = goalMapper.insert(goal);

        if(insertedRows != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "目标插入失败");
        }

        return GoalResponse.from(goal);
    }

    public GoalListResponse findMyGoals(Long userId, long page, long size){
        Page<Goal> goalPage = new Page<>(page, size);

        Page<Goal> resultPage = goalMapper.selectPage(
            goalPage,
            new LambdaQueryWrapper<Goal>()
                .eq(Goal::getUserId, userId)
                .orderByDesc(Goal::getCreatedAt)
                .orderByDesc(Goal::getId)
            );

        List<GoalResponse> items = resultPage.getRecords()
            .stream()
            .map(GoalResponse::from)
            .toList();

        return new GoalListResponse(
            items,
            resultPage.getCurrent(),
            resultPage.getSize(),
            resultPage.getTotal(),
            resultPage.getPages()
        );
    }

    public GoalResponse findGoalDetails(Long userId, Long goalId){
        Goal goal = findOwnedGoal(userId, goalId);

        return GoalResponse.from(goal);
    }

    private Goal findOwnedGoal(Long userId, Long goalId){
        Goal goal = goalMapper.selectOne(
            new LambdaQueryWrapper<Goal>()
                .eq(Goal::getId, goalId)
                .eq(Goal::getUserId, userId)
        );

        if(goal == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "目标不存在");
        }

        return goal;
    }
}
