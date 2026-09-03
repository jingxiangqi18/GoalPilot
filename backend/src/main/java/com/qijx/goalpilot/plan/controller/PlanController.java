package com.qijx.goalpilot.plan.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.auth.security.CurrentUserId;
import com.qijx.goalpilot.plan.dto.PlanApprovalResponse;
import com.qijx.goalpilot.plan.dto.PlanGenerationRequest;
import com.qijx.goalpilot.plan.dto.PlanSnapshotResponse;
import com.qijx.goalpilot.plan.service.PlanService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/plans")
public class PlanController {
    private final PlanService planService;

    public PlanController(PlanService planService){
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

    @PostMapping("/{planId}/approve")
    public PlanApprovalResponse approvePlan(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long planId
    ){
        return planService.approvePlan(userId, planId);
    }
}
