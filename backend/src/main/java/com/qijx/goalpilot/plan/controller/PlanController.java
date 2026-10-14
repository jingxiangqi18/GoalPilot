package com.qijx.goalpilot.plan.controller;

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
import com.qijx.goalpilot.plan.domain.PlanStatus;
import com.qijx.goalpilot.plan.dto.PlanApprovalResponse;
import com.qijx.goalpilot.plan.dto.PlanGenerationRequest;
import com.qijx.goalpilot.plan.dto.PlanPageResponse;
import com.qijx.goalpilot.plan.dto.PlanSnapshotResponse;
import com.qijx.goalpilot.plan.service.PlanQueryService;
import com.qijx.goalpilot.plan.service.PlanService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/plans")
public class PlanController {
    private final PlanService planService;
    private final PlanQueryService planQueryService;

    public PlanController(PlanService planService, PlanQueryService planQueryService){
        this.planService = planService;
        this.planQueryService = planQueryService;
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

    @PostMapping("/{planId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectPlan(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long planId
    ){
        planService.rejectPlan(userId, planId);
    }

    @GetMapping
    public PlanPageResponse findPlanByStatus(
        @CurrentUserId Long userId,
        @RequestParam @Positive Long goalId,
        @RequestParam PlanStatus status,
        @RequestParam(defaultValue = "1") @Min(1) long page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(20) long size
    ){
        return planQueryService.findPlanByStatus(userId, goalId, status, page, size);
    }
}
