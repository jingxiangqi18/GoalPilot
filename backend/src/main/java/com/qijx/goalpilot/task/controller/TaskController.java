package com.qijx.goalpilot.task.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.qijx.goalpilot.auth.security.CurrentUserId;
import com.qijx.goalpilot.task.dto.TaskCreateRequest;
import com.qijx.goalpilot.task.dto.TaskResponse;
import com.qijx.goalpilot.task.service.TaskService;

import jakarta.validation.Valid;

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
}
