package com.qijx.goalpilot.goal.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.auth.security.CurrentUserId;
import com.qijx.goalpilot.goal.dto.GoalAssistantRequest;
import com.qijx.goalpilot.goal.dto.GoalAssistantResponse;
import com.qijx.goalpilot.goal.service.GoalAssistantService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/goals")
public class GoalAssistantController {
    private final GoalAssistantService goalAssistantService;

    public GoalAssistantController(
        GoalAssistantService goalAssistantService
    ){
        this.goalAssistantService = goalAssistantService;
    }

    @PostMapping("/{goalId}/assistant")
    public GoalAssistantResponse ask(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long goalId,
        @Valid @RequestBody GoalAssistantRequest request
    ){
        return goalAssistantService.ask(userId, goalId, request);
    }
}
