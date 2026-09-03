package com.qijx.goalpilot.plan.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qijx.goalpilot.goal.domain.GoalStatus;
import com.qijx.goalpilot.goal.entity.Goal;
import com.qijx.goalpilot.goal.entity.GoalAnalysis;
import com.qijx.goalpilot.goal.mapper.GoalMapper;
import com.qijx.goalpilot.plan.domain.PlanStatus;
import com.qijx.goalpilot.plan.domain.PlanTaskStatus;
import com.qijx.goalpilot.plan.dto.PlanApprovalResponse;
import com.qijx.goalpilot.plan.dto.PlanGenerationResponse;
import com.qijx.goalpilot.plan.dto.PlanSnapshotResponse;
import com.qijx.goalpilot.plan.dto.PlanStage;
import com.qijx.goalpilot.plan.dto.PlanStageResponse;
import com.qijx.goalpilot.plan.dto.PlanTaskResponse;
import com.qijx.goalpilot.plan.dto.PlannedTask;
import com.qijx.goalpilot.plan.entity.Plan;
import com.qijx.goalpilot.plan.entity.PlanStageEntity;
import com.qijx.goalpilot.plan.entity.PlanTask;
import com.qijx.goalpilot.plan.mapper.PlanMapper;
import com.qijx.goalpilot.plan.mapper.PlanStageMapper;
import com.qijx.goalpilot.plan.mapper.PlanTaskMapper;

@Service
public class PlanPersistenceService {
    private final PlanMapper planMapper;
    private final PlanStageMapper planStageMapper;
    private final PlanTaskMapper planTaskMapper;
    private final GoalMapper goalMapper;

    public PlanPersistenceService(
        PlanMapper planMapper,
        PlanStageMapper planStageMapper,
        PlanTaskMapper planTaskMapper,
        GoalMapper goalMapper
    ){
        this.planMapper = planMapper;
        this.planStageMapper = planStageMapper;
        this.planTaskMapper = planTaskMapper;
        this.goalMapper = goalMapper;
    }

    public boolean hasDraft(Long goalId){
        Long draftCount = planMapper.selectCount(
            new LambdaQueryWrapper<Plan>()
                .eq(Plan::getGoalId, goalId)
                .eq(Plan::getStatus, PlanStatus.DRAFT)
        );

        return draftCount > 0;
    }

    @Transactional
    public PlanSnapshotResponse saveDraft(
        Goal goal,
        GoalAnalysis sourceAnalysis,
        PlanGenerationResponse generatedPlan
    ){
        LocalDateTime now = LocalDateTime.now();

        Plan plan = new Plan();

        plan.setGoalId(goal.getId());
        plan.setSourceAnalysisId(sourceAnalysis.getId());
        plan.setStatus(PlanStatus.DRAFT);
        plan.setTitle(generatedPlan.planTitle().trim());
        plan.setSummary(generatedPlan.planSummary().trim());
        plan.setCreatedAt(now);
        plan.setUpdatedAt(now);

        int insertedPlanRows = planMapper.insert(plan);

        if(insertedPlanRows != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "计划草稿保存失败");
        }

        List<PlanStageResponse> stageResponses = new ArrayList<>(
            generatedPlan.stages().size()
        );

        for(int stageIndex = 0; stageIndex < generatedPlan.stages().size(); stageIndex++){
            PlanStage generatedStage = generatedPlan.stages().get(stageIndex);

            PlanStageEntity stage = new PlanStageEntity();

            stage.setPlanId(plan.getId());
            stage.setSortOrder(stageIndex + 1);
            stage.setTitle(generatedStage.title().trim());
            stage.setObjective(generatedStage.objective().trim());
            stage.setTimeRange(generatedStage.timeRange().trim());
            stage.setCreatedAt(now);

            int insertedStageRows = planStageMapper.insert(stage);

            if(insertedStageRows != 1){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "计划阶段保存失败");
            }

            List<PlanTaskResponse> taskResponses = saveTasks(
                stage.getId(),
                generatedStage.tasks(),
                now
            );

            stageResponses.add(
                new PlanStageResponse(
                    stage.getId(),
                    stage.getSortOrder(),
                    stage.getTitle(),
                    stage.getObjective(),
                    stage.getTimeRange(),
                    taskResponses
                )
            );
        }

        return new PlanSnapshotResponse(
            plan.getId(),
            plan.getGoalId(),
            plan.getSourceAnalysisId(),
            plan.getVersionNumber(),
            plan.getStatus(),
            plan.getTitle(),
            plan.getSummary(),
            stageResponses,
            plan.getCreatedAt()
        );
    }

    @Transactional
    public PlanApprovalResponse approveDraft(Plan plan, Goal goal){
        Integer versionNumber = calculateNextVersionNumber(goal.getId());

        plan.setStatus(PlanStatus.ACTIVE);
        plan.setVersionNumber(versionNumber);
        goal.setStatus(GoalStatus.ACTIVE);

        LocalDateTime now = LocalDateTime.now();

        plan.setUpdatedAt(now);
        goal.setUpdatedAt(now);

        int planUpdatedRow = planMapper.updateById(plan);
        int goalUpdatedRow = goalMapper.updateById(goal);

        if(planUpdatedRow != 1 || goalUpdatedRow != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "更新状态失败");
        }

        return PlanApprovalResponse.from(plan, goal);
    }

    private Integer calculateNextVersionNumber(Long goalId){
        Plan latestPlan = planMapper.selectOne(
            new LambdaQueryWrapper<Plan>()
                .eq(Plan::getGoalId, goalId)
                .isNotNull(Plan::getVersionNumber)
                .orderByDesc(Plan::getVersionNumber)
                .last("LIMIT 1")
        );

        if(latestPlan == null){
            return 1;
        }

        return latestPlan.getVersionNumber() + 1;
    }

    private List<PlanTaskResponse> saveTasks(
        Long stageId,
        List<PlannedTask> generatedTasks,
        LocalDateTime createdAt
    ){
        List<PlanTaskResponse> taskResponses = new ArrayList<>(generatedTasks.size());

        for(int taskIndex = 0; taskIndex < generatedTasks.size(); taskIndex++){
            PlannedTask generatedTask = generatedTasks.get(taskIndex);

            PlanTask task = new PlanTask();

            task.setPlanStageId(stageId);
            task.setSortOrder(taskIndex + 1);
            task.setTitle(generatedTask.title().trim());
            task.setDescription(generatedTask.description().trim());
            task.setCompletionCriteria(generatedTask.completionCriteria().trim());
            task.setStatus(PlanTaskStatus.TODO);
            task.setCreatedAt(createdAt);
            task.setUpdatedAt(createdAt);

            int insertedTaskRows = planTaskMapper.insert(task);

            if(insertedTaskRows != 1){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "计划任务保存失败");
            }

            taskResponses.add(
                new PlanTaskResponse(
                    task.getId(),
                    task.getSortOrder(),
                    task.getTitle(),
                    task.getDescription(),
                    task.getCompletionCriteria(),
                    task.getStatus()
                )
            );
        }

        return taskResponses;
    }
}
