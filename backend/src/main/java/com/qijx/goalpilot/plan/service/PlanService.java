package com.qijx.goalpilot.plan.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qijx.goalpilot.goal.domain.GoalReadiness;
import com.qijx.goalpilot.goal.domain.GoalStatus;
import com.qijx.goalpilot.goal.entity.Goal;
import com.qijx.goalpilot.goal.entity.GoalAnalysis;
import com.qijx.goalpilot.goal.mapper.GoalMapper;
import com.qijx.goalpilot.goal.service.GoalAnalysisPersistenceService;
import com.qijx.goalpilot.plan.domain.PlanStatus;
import com.qijx.goalpilot.plan.dto.PlanApprovalResponse;
import com.qijx.goalpilot.plan.dto.PlanGenerationContext;
import com.qijx.goalpilot.plan.dto.PlanGenerationResponse;
import com.qijx.goalpilot.plan.dto.PlanSnapshotResponse;
import com.qijx.goalpilot.plan.entity.Plan;
import com.qijx.goalpilot.plan.mapper.PlanMapper;

@Service
public class PlanService {
    private final GoalMapper goalMapper;
    private final GoalAnalysisPersistenceService goalAnalysisPersistenceService;
    private final PlanGenerationService planGenerationService;
    private final PlanPersistenceService planPersistenceService;
    private final PlanMapper planMapper;

    public PlanService(
        GoalMapper goalMapper,
        GoalAnalysisPersistenceService goalAnalysisPersistenceService,
        PlanGenerationService planGenerationService,
        PlanPersistenceService planPersistenceService,
        PlanMapper planMapper
    ){
        this.goalMapper = goalMapper;
        this.goalAnalysisPersistenceService = goalAnalysisPersistenceService;
        this.planGenerationService = planGenerationService;
        this.planPersistenceService = planPersistenceService;
        this.planMapper = planMapper;
    }

    public PlanSnapshotResponse generateDraft(Long userId, Long goalId){
        Goal goal = findOwnedGoal(userId, goalId);

        if(goal.getStatus() != GoalStatus.READY_TO_PLAN){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "当前目标尚未准备好生成计划");
        }

        if(planPersistenceService.hasDraft(goalId)){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "当前目标已经存在计划草稿");
        }

        GoalAnalysis latestAnalysis =
            goalAnalysisPersistenceService.findLatestAnalysis(goalId);

        if(latestAnalysis.getReadiness() != GoalReadiness.READY
            || latestAnalysis.getMissingInformation() == null
            || !latestAnalysis.getMissingInformation().isEmpty()){
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "目标状态与最新分析结果不一致"
            );
        }

        PlanGenerationContext context = new PlanGenerationContext(
            goal.getGoalText(),
            latestAnalysis.getGoalSummary(),
            latestAnalysis.getKnownInformation()
        );

        PlanGenerationResponse generatedPlan =
            planGenerationService.generatePlan(context);

        return planPersistenceService.saveDraft(
            goal,
            latestAnalysis,
            generatedPlan
        );
    }

    public PlanApprovalResponse approvePlan(Long userId, Long planId){
        Plan plan = planMapper.selectById(planId);

        if(plan == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "计划不存在");
        }

        Goal goal = goalMapper.selectOne(
            new LambdaQueryWrapper<Goal>()
                .eq(Goal::getId, plan.getGoalId())
                .eq(Goal::getUserId, userId)
        );

        if(goal == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "目标不存在");
        }

        if(plan.getStatus() != PlanStatus.DRAFT){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "计划状态必须为草稿");
        }

        if(goal.getStatus() != GoalStatus.READY_TO_PLAN){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "目标状态必须为可计划");
        }

        return planPersistenceService.approveDraft(plan, goal);
    }

    private Goal findOwnedGoal(Long userId, Long goalId){
        Goal goal = goalMapper.selectOne(
            new LambdaQueryWrapper<Goal>()
                .eq(Goal::getId, goalId)
                .eq(Goal::getUserId, userId)
        );

        if(goal == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "目标不存在");
        }

        return goal;
    }
}
