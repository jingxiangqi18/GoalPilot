package com.qijx.goalpilot.plan.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.auth.security.CurrentUserId;
import com.qijx.goalpilot.plan.dto.PlanTaskResponse;
import com.qijx.goalpilot.plan.dto.PlanTaskStatusUpdateRequest;
import com.qijx.goalpilot.plan.service.PlanService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

@RestController 
@RequestMapping("/api/tasks")
public class PlanTaskController {
    private final PlanService planService;

    public PlanTaskController(
        PlanService planService
    ){
        this.planService = planService;
    }

    @PatchMapping("{taskId}/status")
    public PlanTaskResponse updateTaskStatus(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long taskId,
        @Valid @RequestBody PlanTaskStatusUpdateRequest request
    ){
        return planService.updateTaskStatus(userId, taskId, request);
    }
}
