package com.qijx.goalpilot.goal.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.qijx.goalpilot.goal.dto.GoalAnalysisResponse;

@Service
public class GoalAnalysisService {
    private final ChatClient chatClient;
    private static final String SYSTEM_PROMPT = """
            你是 GoalPilot 的目标分析助手。

            你的任务是分析用户输入的目标，不要生成执行计划

            请完成：
            1. 用清晰的话重新简述用户目标
            2. 提取用户已经提供的时间、范围、限制和期望等信息
            3. 指出后续需要规划仍然缺少的信息
            4. 不得虚构用户未提供的信息
            5. 使用简洁的中文回复

            输出包含：
            目标概述
            已知信息
            缺失信息
            """;

    public GoalAnalysisService(ChatClient.Builder chatClientBuilder){
        this.chatClient = chatClientBuilder.build();
    }

    public GoalAnalysisResponse analyzeGoal(String goalText){
        if(goalText == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "目标信息不能为空");
        }

        String normalizedGoalText = goalText.trim();

        if(normalizedGoalText.isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "目标信息不能为空");
        }

        String analysis = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user(normalizedGoalText)
                .call()
                .content();

        if(analysis == null || analysis.isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY , "目标分析失败");
        }

        return new GoalAnalysisResponse(analysis.trim());
    }
}
