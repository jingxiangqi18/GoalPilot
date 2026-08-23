package com.qijx.goalpilot.goal.controller;

import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.goal.dto.GoalAnalysisRequest;
import com.qijx.goalpilot.goal.dto.GoalAnalysisResponse;
import com.qijx.goalpilot.goal.dto.GoalClarificationAnswer;
import com.qijx.goalpilot.goal.dto.GoalClarificationRequest;
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

    @PostMapping("/clarify")
    public GoalAnalysisResponse clarifyGoal(
        @Valid @RequestBody GoalClarificationRequest request
    ){
        String goalText = request.goalText();

        List<GoalClarificationAnswer> clarificationHistory = request.clarificationHistory();

        return goalAnalysisService.clarifyGoal(goalText, clarificationHistory);
    }
}
