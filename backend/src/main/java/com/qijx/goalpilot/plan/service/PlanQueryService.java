package com.qijx.goalpilot.plan.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qijx.goalpilot.goal.entity.Goal;
import com.qijx.goalpilot.goal.mapper.GoalMapper;
import com.qijx.goalpilot.plan.domain.PlanStatus;
import com.qijx.goalpilot.plan.dto.PlanSnapshotResponse;
import com.qijx.goalpilot.plan.dto.PlanStageResponse;
import com.qijx.goalpilot.plan.dto.PlanTaskResponse;
import com.qijx.goalpilot.plan.entity.Plan;
import com.qijx.goalpilot.plan.entity.PlanStageEntity;
import com.qijx.goalpilot.plan.entity.PlanTask;
import com.qijx.goalpilot.plan.mapper.PlanMapper;
import com.qijx.goalpilot.plan.mapper.PlanStageMapper;
import com.qijx.goalpilot.plan.mapper.PlanTaskMapper;

@Service 
public class PlanQueryService {
    private final PlanMapper planMapper;
    private final GoalMapper goalMapper;
    private final PlanStageMapper planStageMapper;
    private final PlanTaskMapper planTaskMapper;

    public PlanQueryService(
        PlanMapper planMapper,
        GoalMapper goalMapper,
        PlanStageMapper planStageMapper,
        PlanTaskMapper planTaskMapper
    ){
        this.planMapper = planMapper;
        this.goalMapper = goalMapper;
        this.planStageMapper = planStageMapper;
        this.planTaskMapper = planTaskMapper;
    }

    public PlanSnapshotResponse findCurrentActivePlan(Long userId, Long goalId){
        Goal goal = goalMapper.selectOne(
            new LambdaQueryWrapper<Goal>()
                .eq(Goal::getId, goalId)
                .eq(Goal::getUserId, userId)
        );

        if(goal == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "目标不存在");
        }

        List<Plan> activePlans = planMapper.selectList(
            new LambdaQueryWrapper<Plan>()
                .eq(Plan::getGoalId, goalId)
                .eq(Plan::getStatus, PlanStatus.ACTIVE)
        );

        if(activePlans.isEmpty()){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "当前没有正式计划");
        }

        if(activePlans.size() > 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "正式计划状态异常");
        }

        Plan plan = activePlans.get(0);

        if(plan.getVersionNumber() == null || plan.getVersionNumber() < 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "版本号有误");
        }

        return buildSnapshot(plan);
    }

    private PlanSnapshotResponse buildSnapshot(Plan plan){
        List<PlanStageEntity> stages = planStageMapper.selectList(
            new LambdaQueryWrapper<PlanStageEntity>()
                .eq(PlanStageEntity::getPlanId, plan.getId())
                .orderByAsc(PlanStageEntity::getSortOrder)
        );

        if(stages.isEmpty()){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "阶段不能为空");
        }

        List<Long> stageIds = stages.stream()
            .map(PlanStageEntity::getId)
            .toList();

        List<PlanTask> tasks = planTaskMapper.selectList(
            new LambdaQueryWrapper<PlanTask>()
                .in(PlanTask::getPlanStageId, stageIds)
                .orderByAsc(PlanTask::getPlanStageId)
                .orderByAsc(PlanTask::getSortOrder)
        );

        Map<Long, List<PlanTask>> tasksByStageId = tasks.stream()
            .collect(Collectors.groupingBy(PlanTask::getPlanStageId));

        List<PlanStageResponse> stageResponses = new ArrayList<>();

        for(PlanStageEntity stage : stages){
            List<PlanTask> tasksByStage = tasksByStageId.get(stage.getId());

            if(tasksByStage == null || tasksByStage.isEmpty()){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "任务数据不完整");
            }

            List<PlanTaskResponse> taskResponses = new ArrayList<>();

            for(PlanTask task : tasksByStage){
                PlanTaskResponse taskResponse = new PlanTaskResponse(
                    task.getId(),
                    task.getSortOrder(),
                    task.getTitle(),
                    task.getDescription(),
                    task.getCompletionCriteria(),
                    task.getStatus()
                );

                taskResponses.add(taskResponse);
            }

            PlanStageResponse planStageResponse = new PlanStageResponse(
                stage.getId(),
                stage.getSortOrder(),
                stage.getTitle(),
                stage.getObjective(),
                stage.getTimeRange(),
                taskResponses
            );

            stageResponses.add(planStageResponse);
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
}
