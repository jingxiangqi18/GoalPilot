package com.qijx.goalpilot.goal.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.goal.dto.GoalAnalysisRequest;
import com.qijx.goalpilot.goal.dto.GoalAnalysisResponse;
import com.qijx.goalpilot.goal.service.GoalAnalysisService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/goals")
public class GoalAnalysisController {
    private final GoalAnalysisService goalAnalysisService;

    public GoalAnalysisController(GoalAnalysisService goalAnalysisService){
        this.goalAnalysisService = goalAnalysisService;
    }

    @PostMapping("/analyze")
    public GoalAnalysisResponse analyzeGoal(
        @Valid @RequestBody GoalAnalysisRequest request
    ){
        return goalAnalysisService.analyzeGoal(request.goalText());
    }
}
