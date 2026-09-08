package com.qijx.goalpilot.plan.service;

import java.time.LocalDateTime;

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
import com.qijx.goalpilot.plan.domain.PlanTaskStatus;
import com.qijx.goalpilot.plan.dto.PlanApprovalResponse;
import com.qijx.goalpilot.plan.dto.PlanGenerationContext;
import com.qijx.goalpilot.plan.dto.PlanGenerationResponse;
import com.qijx.goalpilot.plan.dto.PlanSnapshotResponse;
import com.qijx.goalpilot.plan.dto.PlanTaskResponse;
import com.qijx.goalpilot.plan.dto.PlanTaskStatusUpdateRequest;
import com.qijx.goalpilot.plan.entity.Plan;
import com.qijx.goalpilot.plan.entity.PlanStageEntity;
import com.qijx.goalpilot.plan.entity.PlanTask;
import com.qijx.goalpilot.plan.mapper.PlanMapper;
import com.qijx.goalpilot.plan.mapper.PlanStageMapper;
import com.qijx.goalpilot.plan.mapper.PlanTaskMapper;

@Service
public class PlanService {
    private final GoalMapper goalMapper;
    private final GoalAnalysisPersistenceService goalAnalysisPersistenceService;
    private final PlanGenerationService planGenerationService;
    private final PlanPersistenceService planPersistenceService;
    private final PlanMapper planMapper;
    private final PlanTaskMapper planTaskMapper;
    private final PlanStageMapper planStageMapper;

    public PlanService(
        GoalMapper goalMapper,
        GoalAnalysisPersistenceService goalAnalysisPersistenceService,
        PlanGenerationService planGenerationService,
        PlanPersistenceService planPersistenceService,
        PlanMapper planMapper,
        PlanTaskMapper planTaskMapper,
        PlanStageMapper planStageMapper
    ){
        this.goalMapper = goalMapper;
        this.goalAnalysisPersistenceService = goalAnalysisPersistenceService;
        this.planGenerationService = planGenerationService;
        this.planPersistenceService = planPersistenceService;
        this.planMapper = planMapper;
        this.planTaskMapper = planTaskMapper;
        this.planStageMapper = planStageMapper;
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

    public void rejectPlan(Long userId, Long planId){
        Plan plan = planMapper.selectById(planId);

        if(plan == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "该计划不存在");
        }

        Goal goal = findOwnedGoal(userId, plan.getGoalId());

        if(plan.getStatus() != PlanStatus.DRAFT || goal.getStatus() != GoalStatus.READY_TO_PLAN){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "计划或目标状态有误");
        }

        LocalDateTime now = LocalDateTime.now();

        plan.setStatus(PlanStatus.REJECTED);
        plan.setUpdatedAt(now);

        int updatedRows = planMapper.update(
            plan,
            new LambdaQueryWrapper<Plan>()
            .eq(Plan::getId, plan.getId())
            .eq(Plan::getStatus, PlanStatus.DRAFT)
        );

        if(updatedRows != 1){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "计划状态已变化");
        }
    }

    public PlanTaskResponse updateTaskStatus(Long userId, Long taskId, PlanTaskStatusUpdateRequest request){
        PlanTask task = planTaskMapper.selectById(taskId);

        if(task == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "任务不存在");
        }

        PlanStageEntity stage = planStageMapper.selectById(task.getPlanStageId());

        if(stage == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "任务阶段不存在");
        }

        Plan plan = planMapper.selectById(stage.getPlanId());

        if(plan == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "任务计划不存在");
        }

        Goal goal = goalMapper.selectOne(
            new LambdaQueryWrapper<Goal>()
                .eq(Goal::getId, plan.getGoalId())
                .eq(Goal::getUserId, userId)
        );

        if(goal == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "目标不存在");
        }

        if(plan.getStatus() != PlanStatus.ACTIVE){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "任务计划状态有误");
        }

        if(goal.getStatus() != GoalStatus.ACTIVE){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "目标状态有误");
        }

        PlanTaskStatus currentStatus = task.getStatus();
        PlanTaskStatus targetStatus = request.status();

        if(currentStatus == targetStatus){
            return PlanTaskResponse.from(task);
        }

        LocalDateTime now = LocalDateTime.now();

        task.setStatus(targetStatus);
        task.setUpdatedAt(now);

        int updatedRows = planTaskMapper.update(
            task,
            new LambdaQueryWrapper<PlanTask>()
                .eq(PlanTask::getId, taskId)
                .eq(PlanTask::getStatus, currentStatus)
        );

        if(updatedRows != 1){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "任务状态更新失败");
        }

        return PlanTaskResponse.from(task);
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
