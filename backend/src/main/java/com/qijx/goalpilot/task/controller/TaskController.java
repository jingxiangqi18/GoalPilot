package com.qijx.goalpilot.task.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.auth.security.CurrentUserId;
import com.qijx.goalpilot.task.dto.TaskCreateRequest;
import com.qijx.goalpilot.task.dto.TaskPageResponse;
import com.qijx.goalpilot.task.dto.TaskResponse;
import com.qijx.goalpilot.task.dto.TaskUpdateRequest;
import com.qijx.goalpilot.task.service.TaskService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(
        TaskService taskService
    ){
        this.taskService = taskService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse createTask(
        @CurrentUserId Long userId,
        @Valid @RequestBody TaskCreateRequest request
    ){
        return taskService.createTask(userId, request);
    }

    @GetMapping
    public TaskPageResponse findMyTasks(
        @CurrentUserId Long userId,
        @RequestParam(defaultValue = "1") @Min(1) long page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) long size
    ){
        return taskService.findMyTasks(userId, page, size);
    }

    @PatchMapping("/{taskId}")
    public TaskResponse updateTask(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long taskId,
        @Valid @RequestBody TaskUpdateRequest request
    ){
        return taskService.updateTask(userId, taskId, request);
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(
        @CurrentUserId Long userId,
        @PathVariable @Positive Long taskId
    ){
        taskService.deleteTask(userId, taskId);
    }
}
