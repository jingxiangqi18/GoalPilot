package com.qijx.goalpilot.plan.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.plan.dto.PlanGenerationRequest;
import com.qijx.goalpilot.plan.dto.PlanGenerationResponse;
import com.qijx.goalpilot.plan.service.PlanGenerationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/plans")
public class PlanGenerationController {
    private final PlanGenerationService planGenerationService;

    public PlanGenerationController(PlanGenerationService planGenerationService){
        this.planGenerationService = planGenerationService;
    }

    @PostMapping("/generate")
    public PlanGenerationResponse generatePlan(
        @Valid @RequestBody PlanGenerationRequest request){
        return planGenerationService.generatePlan(request.goalText(), request.goalAnalysis());
    }
}
