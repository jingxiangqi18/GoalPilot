package com.qijx.goalpilot.goal.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.qijx.goalpilot.goal.domain.GoalReadiness;
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
            4. 判断当前信息是否足以生成一份合理的初步执行计划。
            5. 如果缺失的信息会显著改变计划内容，readiness 返回 NEEDS_CLARIFICATION。
            6. 如果当前信息已经足以生成初步计划，readiness 返回 READY。
            7. 不要因为缺少非必要细节而一律返回 NEEDS_CLARIFICATION。
            8. 不得虚构用户未提供的信息。
            9. 使用简洁的中文回复。

            输出包含：
            goalSummary：目标概述
            knownInformation：已知信息
            missingInformation：缺失信息
            readiness：只能是 READY 或 NEEDS_CLARIFICATION
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

        GoalAnalysisResponse analysis = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user(normalizedGoalText)
                .call()
                .entity(GoalAnalysisResponse.class);

        if(analysis == null
            || analysis.goalSummary() == null
            || analysis.goalSummary().isBlank()
            || analysis.knownInformation() == null
            || analysis.missingInformation() == null
            || analysis.readiness() == null
            || (analysis.readiness() == GoalReadiness.NEEDS_CLARIFICATION && analysis.missingInformation().isEmpty())
        ){
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY , "目标分析失败");
        }

        return analysis;
    }
}
