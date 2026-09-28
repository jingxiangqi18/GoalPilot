package com.qijx.goalpilot.task.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qijx.goalpilot.goal.service.GoalService;
import com.qijx.goalpilot.task.dto.TaskCreateRequest;
import com.qijx.goalpilot.task.dto.TaskPageResponse;
import com.qijx.goalpilot.task.dto.TaskResponse;
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
}
