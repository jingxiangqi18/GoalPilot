package com.qijx.goalpilot.goal.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.auth.security.CurrentUserId;
import com.qijx.goalpilot.goal.domain.GoalStatus;
import com.qijx.goalpilot.goal.dto.GoalCreateRequest;
import com.qijx.goalpilot.goal.dto.GoalListResponse;
import com.qijx.goalpilot.goal.dto.GoalResponse;
import com.qijx.goalpilot.goal.service.GoalService;
import com.qijx.goalpilot.plan.dto.PlanSnapshotResponse;
import com.qijx.goalpilot.plan.service.PlanQueryService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/goals")
public class GoalController {
    private final GoalService goalService;
    private final PlanQueryService planQueryService;

    public GoalController(GoalService goalService, PlanQueryService planQueryService){
        this.goalService = goalService;
        this.planQueryService = planQueryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse createGoal(
        @CurrentUserId Long userId,
        @Valid @RequestBody GoalCreateRequest request
    ){
        return goalService.createGoal(userId, request);
    }

    @GetMapping
    public GoalListResponse findMyGoals(
        @CurrentUserId Long userId,
        @RequestParam(required = false) GoalStatus status,
        @RequestParam(defaultValue = "1") @Min(1) long page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) long size
    ){
        if(status == null){
            return goalService.findMyGoals(userId, page, size);
        }

        return goalService.findGoalsByStatus(userId, status, size, page);
    }

    @GetMapping("/{goalId}")
    public GoalResponse findGoalDetails(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long goalId
    ){
        return goalService.findGoalDetails(userId, goalId);
    }

    @GetMapping("/{goalId}/active-plan")
    public PlanSnapshotResponse findCurrentActivePlan(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long goalId
    ){
        return planQueryService.findCurrentActivePlan(userId, goalId);
    }
}
