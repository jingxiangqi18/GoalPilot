package com.qijx.goalpilot.goal.service;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.qijx.goalpilot.goal.domain.GoalReadiness;
import com.qijx.goalpilot.goal.dto.GoalAnalysisResponse;
import com.qijx.goalpilot.goal.dto.GoalClarificationAnswer;

@Service
public class GoalAnalysisService {
    private final ChatClient chatClient;
    private static final String SYSTEM_PROMPT = """
            你是 GoalPilot 的目标分析助手。

            你的任务是分析用户输入的目标，不要生成执行计划

            请完成：
            1. 用清晰的话重新简述用户目标
            2. 提取用户已经提供的时间、范围、限制和期望等信息，knownInformation 至少包含一项从用户目标中确认的信息。
            3. 识别会影响计划生成、必须由用户补充的关键缺失信息。
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
            14. goalSummary 不得超过 1000 个字符。
            15. knownInformation 必须包含 1 至 20 项，每项不得超过 500 个字符。
            16. missingInformation 最多包含 10 项，每项不得超过 500 个字符。
            17. clarificationQuestions 最多包含 3 项，每项不得超过 300 个字符，并且不得包含重复问题。

            输出包含：
            goalSummary：目标概述
            knownInformation：已知信息
            missingInformation：缺失信息
            readiness：只能是 READY 或 NEEDS_CLARIFICATION
            clarificationQuestions：需要用户回答的澄清问题
            """;

    private static final int MAX_GOAL_SUMMARY_LENGTH = 1000;
    private static final int MAX_KNOWN_INFORMATION_COUNT = 20;
    private static final int MAX_MISSING_INFORMATION_COUNT = 10;
    private static final int MAX_INFORMATION_ITEM_LENGTH = 500;
    private static final int MAX_CLARIFICATION_QUESTION_LENGTH = 300;

    public GoalAnalysisService(ChatClient.Builder chatClientBuilder){
        this.chatClient = chatClientBuilder.build();
    }

    //分析用户输入的目标
    public GoalAnalysisResponse analyzeGoal(String goalText){
        String normalizedGoalText = normalizeGoalText(goalText);

        GoalAnalysisResponse analysis = requestGoalAnalysis(normalizedGoalText);

        return analysis;
    }

    public GoalAnalysisResponse clarifyGoal(String goalText, List<GoalClarificationAnswer> clarificationHistory){
        String normalizedGoalText = normalizeGoalText(goalText);

        validateClarificationHistory(clarificationHistory);

        String userPrompt = buildClarificationUserPrompt(normalizedGoalText, clarificationHistory);

        GoalAnalysisResponse analysis = requestGoalAnalysis(userPrompt);

        return analysis;
    }

    //标准化输入的目标，避免空内容
    private String normalizeGoalText(String goalText){
        if(goalText == null || goalText.isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "目标不能为空");
        }

        return goalText.trim();
    }

    //校验是否为有效的分析回答
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
        if(analysis.goalSummary() == null
            || analysis.goalSummary().isBlank()
            || analysis.goalSummary().trim().length() > MAX_GOAL_SUMMARY_LENGTH){
            return false;
        }

        //分析当前的状况不能为空
        if(analysis.readiness() == null){
            return false;
        }

        List<String> knownInformation = analysis.knownInformation();

        //分析已有的信息一定不为空，而且不能包含空的内容
        if(knownInformation == null
                || knownInformation.isEmpty()
                || knownInformation.size() > MAX_KNOWN_INFORMATION_COUNT
                || containsBlankItem(analysis.knownInformation())
                || containsOversizedItem(knownInformation, MAX_INFORMATION_ITEM_LENGTH)){
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
        List<String> missingInformation = analysis.missingInformation();


        if(missingInformation.isEmpty()
            || missingInformation.size() > MAX_MISSING_INFORMATION_COUNT){
            return false;
        }

        if(containsBlankItem(missingInformation)){
            return false;
        }

        if (containsOversizedItem(missingInformation, MAX_INFORMATION_ITEM_LENGTH)){
            return false;
        }

        List<String> clarificationQuestions = analysis.clarificationQuestions();

        if(clarificationQuestions.isEmpty()){
            return false;
        }

        if(analysis.clarificationQuestions().size() > 3){
            return false;
        }

        if(containsBlankItem(analysis.clarificationQuestions())){
            return false;
        }

        if(containsOversizedItem(clarificationQuestions, MAX_CLARIFICATION_QUESTION_LENGTH)
            || containsDuplicateItem(clarificationQuestions)){
                return false;
            }

        return true;
    }

    private void validateClarificationHistory(List<GoalClarificationAnswer> clarificationHistory){
        if(clarificationHistory == null
            || clarificationHistory.isEmpty()
            || clarificationHistory.size() > 10){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "澄清回答数量必须在1到10项之间");
        }

        Set<String> questions = new HashSet<>();

        for(GoalClarificationAnswer clarification : clarificationHistory){
            if(clarification == null
                || clarification.question() == null
                || clarification.question().isBlank()
                || clarification.answer() == null
                || clarification.answer().isBlank()
            ){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "澄清问题和回答不能为空");
            }

            String normalizedQuestion = clarification.question().trim();

            if(!questions.add(normalizedQuestion)){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不能重复提交同一个澄清问题");
            }
        }
    }

    private String buildClarificationUserPrompt(String normalizedGoalText, List<GoalClarificationAnswer> clarificationHistory){
        StringBuilder promptBuilder = new StringBuilder();

        promptBuilder
                .append("原始目标：\n")
                .append(normalizedGoalText)
                .append("\n\n")
                .append("用户已经确认补充的信息：\n\n");

        for(int index = 0; index < clarificationHistory.size(); index++){
            GoalClarificationAnswer clarification = clarificationHistory.get(index);

            promptBuilder
                    .append("问题 ")
                    .append(index + 1)
                    .append("：\n")
                    .append(clarification.question().trim())
                    .append("\n")
                    .append("回答 ")
                    .append(index + 1)
                    .append("： \n")
                    .append(clarification.answer().trim())
                    .append("\n\n");
        }

        promptBuilder.append("""
                请结合原始目标和所有补充回答，重新分析目标。
                用户回答是用户最新确认的信息；如果回答与原始目标存在冲突，以最新回答为准。
                只进行目标分析，不要生成执行计划。
                """);

        return promptBuilder.toString();
    }

    private GoalAnalysisResponse requestGoalAnalysis(String userPrompt){
        GoalAnalysisResponse analysis = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user(userPrompt)
                .call()
                .entity(GoalAnalysisResponse.class);

        if(!isValidAnalysisResponse(analysis)){
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "分析结果出错");
        }

        return analysis;
    }

    private boolean containsOversizedItem(List<String> items, int maxLength){
        for(String item : items){
            if(item == null || item.trim().length() > maxLength){
                return true;
            }
        }

        return false;
    }

    private boolean containsDuplicateItem(List<String> items){
        Set<String> normalizedItems = new HashSet<>();

        for(String item : items){
            if(item == null){
                return true;
            }

            String normalizedItem = item.trim().toLowerCase(Locale.ROOT);

            if(!normalizedItems.add(normalizedItem)){
                return true;
            }
        }

        return false;
    }
}
