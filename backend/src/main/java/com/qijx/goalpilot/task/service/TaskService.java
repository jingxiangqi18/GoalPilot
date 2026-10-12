package com.qijx.goalpilot.task.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qijx.goalpilot.goal.service.GoalService;
import com.qijx.goalpilot.task.dto.TaskCreateRequest;
import com.qijx.goalpilot.task.dto.TaskPageResponse;
import com.qijx.goalpilot.task.dto.TaskResponse;
import com.qijx.goalpilot.task.dto.TaskUpdateRequest;
import com.qijx.goalpilot.task.entity.Task;
import com.qijx.goalpilot.task.entity.TaskPriority;
import com.qijx.goalpilot.task.entity.TaskStatus;
import com.qijx.goalpilot.task.mapper.TaskMapper;

@Service
public class TaskService {
    private final TaskMapper taskMapper;
    private final GoalService goalService;

    public TaskService(
        TaskMapper taskMapper,
        GoalService goalService
    ){
        this.taskMapper = taskMapper;
        this.goalService = goalService;
    }

    public TaskResponse createTask(Long userId, TaskCreateRequest request){
        if(request.goalId() != null){
            goalService.findGoalDetails(userId, request.goalId());
        }

        Task task = new Task();

        task.setUserId(userId);
        task.setGoalId(request.goalId());
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setCompletionCriteria(request.completionCriteria());
        task.setDeadline(request.deadline());
        task.setStatus(TaskStatus.TODO);

        if(request.priority() == null){
            task.setPriority(TaskPriority.MEDIUM);
        }else{
            task.setPriority(request.priority());
        }

        LocalDateTime now = LocalDateTime.now();

        task.setCreatedAt(now);
        task.setUpdatedAt(now);

        int insertedRows = taskMapper.insert(task);

        if(insertedRows != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "任务创建失败");
        }

        return TaskResponse.from(task);
    }

    public TaskPageResponse findMyTasks(Long userId, long page, long size){
        Page<Task> taskPage = new Page<>(page, size);

        LambdaQueryWrapper<Task> queryWrapper = new LambdaQueryWrapper<Task>()
            .eq(Task::getUserId, userId)
            .orderByDesc(Task::getCreatedAt)
            .orderByDesc(Task::getId);

        Page<Task> resultPage = taskMapper.selectPage(taskPage, queryWrapper);

        List<TaskResponse> items = new ArrayList<>();

        for(Task task : resultPage.getRecords()){
            items.add(TaskResponse.from(task));
        }

        return new TaskPageResponse(
            items,
            resultPage.getCurrent(),
            resultPage.getSize(),
            resultPage.getTotal(),
            resultPage.getPages()
        );
    }

    public TaskResponse updateTask(Long userId, Long taskId, TaskUpdateRequest request){
        findOwnedTask(userId, taskId);

        if(Boolean.TRUE.equals(request.clearDeadline()) && request.deadline() != null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不能同时设置和清除截止时间");
        }

        boolean hasUpdates = false;

        LambdaUpdateWrapper<Task> updateWrapper = 
            new LambdaUpdateWrapper<Task>()
                .eq(Task::getId, taskId)
                .eq(Task::getUserId, userId);

        if(request.title() != null){
            String normalizedTitle = request.title().trim();

            if(normalizedTitle.isBlank()){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "任务标题不能为空");
            }

            updateWrapper.set(Task::getTitle, normalizedTitle);

            hasUpdates = true;
        }

        if(request.description() != null){
            updateWrapper.set(
                Task::getDescription,
                request.description().trim()
            );

            hasUpdates = true;
        }

        if(request.completionCriteria() != null){
            updateWrapper.set(
                Task::getCompletionCriteria,
                request.completionCriteria().trim()
            );

            hasUpdates = true;
        }

        if(request.priority() != null){
            updateWrapper.set(Task::getPriority, request.priority());

            hasUpdates = true;
        }

        if(Boolean.TRUE.equals(request.clearDeadline())){
            updateWrapper.set(Task::getDeadline, null);
            hasUpdates = true;
        }else if(request.deadline() != null){
            updateWrapper.set(Task::getDeadline, request.deadline());
            hasUpdates = true;
        }

        if(!hasUpdates){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "至少提供一个更新字段");
        }

        updateWrapper.set(Task::getUpdatedAt, LocalDateTime.now());

        int updatedRows = taskMapper.update(null, updateWrapper);

        if(updatedRows != 1){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "任务更新未成功，请刷新后重试");
        }

        Task updatedTask = findOwnedTask(userId, taskId);

        return TaskResponse.from(updatedTask);
    }

    private Task findOwnedTask(Long userId, Long taskId){
        Task task = taskMapper.selectOne(
            new LambdaQueryWrapper<Task>()
                .eq(Task::getId, taskId)
                .eq(Task::getUserId, userId)
        );

        if(task == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "任务不存在");
        }

        return task;
    }
}
