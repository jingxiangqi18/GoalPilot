package com.qijx.goalpilot.plan.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.auth.security.CurrentUserId;
import com.qijx.goalpilot.plan.dto.PlanGenerationRequest;
import com.qijx.goalpilot.plan.dto.PlanSnapshotResponse;
import com.qijx.goalpilot.plan.service.PlanService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/plans")
public class PlanGenerationController {
    private final PlanService planService;

    public PlanGenerationController(PlanService planService){
        this.planService = planService;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public PlanSnapshotResponse generatePlan(
        @CurrentUserId Long userId,
        @Valid @RequestBody PlanGenerationRequest request
    ){
        return planService.generateDraft(userId, request.goalId());
    }
}
