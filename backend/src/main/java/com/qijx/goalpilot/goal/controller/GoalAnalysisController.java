package com.qijx.goalpilot.goal.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.auth.security.CurrentUserId;
import com.qijx.goalpilot.goal.dto.GoalAnalysisSnapshotResponse;
import com.qijx.goalpilot.goal.dto.GoalClarificationRequest;
import com.qijx.goalpilot.goal.service.GoalService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/goals")
public class GoalAnalysisController {
    private final GoalService goalService;

    public GoalAnalysisController(GoalService goalService){
        this.goalService = goalService;
    }

    @PostMapping("/{goalId}/analyze")
    @ResponseStatus(HttpStatus.CREATED)
    public GoalAnalysisSnapshotResponse analyzeGoal(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long goalId
    ){
        return goalService.analyzeGoal(userId, goalId);
    }

    @PostMapping("/{goalId}/clarifications")
    @ResponseStatus(HttpStatus.CREATED)
    public GoalAnalysisSnapshotResponse clarifyGoal(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long goalId,
        @Valid @RequestBody GoalClarificationRequest request
    ){
        return goalService.clarifyGoal(userId, goalId, request);
    }
}
