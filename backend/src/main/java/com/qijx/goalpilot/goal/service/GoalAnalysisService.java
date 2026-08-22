package com.qijx.goalpilot.goal.service;

import java.util.List;

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
            2. 提取用户已经提供的时间、范围、限制和期望等信息，knownInformation 至少包含一项从用户目标中确认的信息。
            3. 只识别会显著影响计划生成、必须由用户补充的关键缺失信息。
            4. 判断当前信息是否足以生成一份合理的初步执行计划。
            5. 如果缺失的信息会显著改变计划内容，readiness 返回 NEEDS_CLARIFICATION。
            6. 如果当前信息已经足以生成初步计划，readiness 返回 READY。
            7. 不要因为缺少非必要细节而一律返回 NEEDS_CLARIFICATION。
            8. 当 readiness 为 NEEDS_CLARIFICATION 时，根据最重要的缺失信息生成 1 至 3 个澄清问题。
            9. 每个澄清问题只询问一项信息，问题必须具体并便于用户直接回答。
            10. 只询问会明显影响后续计划内容的信息，不要追问非必要细节。
            11. 当 readiness 为 READY 时，missingInformation 和 clarificationQuestions 都必须返回空列表。
            12. 不得虚构用户未提供的信息。
            13. 使用简洁的中文回复。

            输出包含：
            goalSummary：目标概述
            knownInformation：已知信息
            missingInformation：缺失信息
            readiness：只能是 READY 或 NEEDS_CLARIFICATION
            clarificationQuestions：需要用户回答的澄清问题
            """;

    public GoalAnalysisService(ChatClient.Builder chatClientBuilder){
        this.chatClient = chatClientBuilder.build();
    }

    public GoalAnalysisResponse analyzeGoal(String goalText){
        String normalizedGoalText = normalizeGoalText(goalText);

        GoalAnalysisResponse analysis = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user(normalizedGoalText)
                .call()
                .entity(GoalAnalysisResponse.class);

        if(!isValidAnalysisResponse(analysis)){
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "分析结果无效");
        }

        return analysis;
    }

    private String normalizeGoalText(String goalText){
        if(goalText == null || goalText.isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "目标不能为空");
        }

        return goalText.trim();
    }

    private boolean isValidAnalysisResponse(GoalAnalysisResponse analysis){
        if(!hasValidBaseStructure(analysis)){
            return false;
        }

        if(analysis.readiness() == GoalReadiness.READY){
            return isValidReadyResponse(analysis);
        }

        if(analysis.readiness() == GoalReadiness.NEEDS_CLARIFICATION){
            return isValidNeedsClarificationResponse(analysis);
        }

        return false;
    }

    private boolean hasValidBaseStructure(GoalAnalysisResponse analysis){
        //总分析不是空
        if(analysis == null){
            return false;
        }

        //分析的总结不为空，且必须有内容
        if(analysis.goalSummary() == null || analysis.goalSummary().isBlank()){
            return false;
        }

        //分析当前的状况不能为空
        if(analysis.readiness() == null){
            return false;
        }

        //分析已有的信息一定不为空，而且不能包含空的内容
        if(analysis.knownInformation() == null
                || analysis.knownInformation().isEmpty()
                || containsBlankItem(analysis.knownInformation())){
            return false;
        }

        //缺失信息和澄清问题列表可以为空，但列表本身不能为 null
        if(analysis.missingInformation() == null
                || analysis.clarificationQuestions() == null){
            return false;
        }

        return true;
    }

    //确认list里面的内容不能是空白
    private boolean containsBlankItem(List<String> items){
        for(String item : items){
            if(item != null){
                if(item.trim().isBlank()){
                    return true;
                }
            }else{
                return true;
            }
        }

        return false;
    }

    private boolean isValidReadyResponse(GoalAnalysisResponse analysis){
        if(analysis.missingInformation().isEmpty() && analysis.clarificationQuestions().isEmpty()){
            return true;
        }

        return false;
    }

    private boolean isValidNeedsClarificationResponse(GoalAnalysisResponse analysis){
        if(analysis.missingInformation().isEmpty()){
            return false;
        }

        if(containsBlankItem(analysis.missingInformation())){
            return false;
        }

        if(analysis.clarificationQuestions().isEmpty()){
            return false;
        }

        if(analysis.clarificationQuestions().size() > 3){
            return false;
        }

        if(containsBlankItem(analysis.clarificationQuestions())){
            return false;
        }

        return true;
    }
}
