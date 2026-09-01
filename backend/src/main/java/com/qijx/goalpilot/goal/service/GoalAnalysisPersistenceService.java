package com.qijx.goalpilot.goal.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.qijx.goalpilot.goal.domain.GoalReadiness;
import com.qijx.goalpilot.goal.domain.GoalStatus;
import com.qijx.goalpilot.goal.dto.GoalAnalysisResponse;
import com.qijx.goalpilot.goal.dto.GoalAnalysisSnapshotResponse;
import com.qijx.goalpilot.goal.dto.GoalClarificationQuestionResponse;
import com.qijx.goalpilot.goal.entity.Goal;
import com.qijx.goalpilot.goal.entity.GoalAnalysis;
import com.qijx.goalpilot.goal.entity.GoalClarificationQuestion;
import com.qijx.goalpilot.goal.mapper.GoalAnalysisMapper;
import com.qijx.goalpilot.goal.mapper.GoalClarificationQuestionMapper;
import com.qijx.goalpilot.goal.mapper.GoalMapper;

@Service
public class GoalAnalysisPersistenceService {
    private final GoalAnalysisMapper goalAnalysisMapper;
    private final GoalClarificationQuestionMapper questionMapper;
    private final GoalMapper goalMapper;

    public GoalAnalysisPersistenceService(
        GoalAnalysisMapper goalAnalysisMapper,
        GoalClarificationQuestionMapper questionMapper,
        GoalMapper goalMapper
    ){
        this.goalAnalysisMapper = goalAnalysisMapper;
        this.questionMapper = questionMapper;
        this.goalMapper = goalMapper;
    }

    @Transactional
    public GoalAnalysisSnapshotResponse saveInitialAnalysis(Goal goal, GoalAnalysisResponse analysisResult){
        LocalDateTime now = LocalDateTime.now();

        GoalAnalysis analysis = new GoalAnalysis();

        analysis.setGoalId(goal.getId());
        analysis.setVersionNumber(1);
        analysis.setGoalSummary(analysisResult.goalSummary().trim());
        analysis.setKnownInformation(normalizeInformation(analysisResult.knownInformation()));
        analysis.setMissingInformation(normalizeInformation(analysisResult.missingInformation()));
        analysis.setReadiness(analysisResult.readiness());
        analysis.setCreatedAt(now);

        int insertedAnalysisRows = goalAnalysisMapper.insert(analysis);

        if(insertedAnalysisRows != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "目标分析保存失败");
        }

        List<GoalClarificationQuestion> savedQuestions = saveQuestions(analysis.getId(), analysisResult.clarificationQuestions(), now);

        goal.setStatus(mapGoalStatus(analysisResult.readiness()));
        goal.setUpdatedAt(now);

        int updatedGoalRows = goalMapper.updateById(goal);

        if(updatedGoalRows != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "目标状态更新失败");
        }

        return toResponse(analysis, savedQuestions);
    }

    private List<String> normalizeInformation(List<String> information){
        return information.stream()
            .map(String::trim)
            .toList();
    }

    private List<GoalClarificationQuestion> saveQuestions(Long analysisId, List<String> questions, LocalDateTime createdAt){
        List<GoalClarificationQuestion> savedQuestions = new ArrayList<>(questions.size());

        for(int index = 0; index < questions.size(); index++){
            GoalClarificationQuestion question = new GoalClarificationQuestion();

            question.setAnalysisId(analysisId);
            question.setQuestionText(questions.get(index).trim());
            question.setSortOrder(index + 1);
            question.setCreatedAt(createdAt);

            int insertedQuestionRows = questionMapper.insert(question);

            if(insertedQuestionRows != 1){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "澄清问题保存失败");
            }

            savedQuestions.add(question);
        }

        return savedQuestions;
    }

    private GoalStatus mapGoalStatus(GoalReadiness readiness){
        if(readiness == null){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "目标分析状态不能为空");
        }

        return switch (readiness){
            case READY -> GoalStatus.READY_TO_PLAN;

            case NEEDS_CLARIFICATION -> GoalStatus.NEEDS_CLARIFICATION;
        };
    }

    private GoalAnalysisSnapshotResponse toResponse(
        GoalAnalysis analysis,
        List<GoalClarificationQuestion> questions
    ) {
        List<GoalClarificationQuestionResponse> questionResponses =
            questions.stream()
                .map(question ->
                    new GoalClarificationQuestionResponse(
                        question.getId(),
                        question.getQuestionText(),
                        question.getAnswerText()
                    )
                )
                .toList();

        return new GoalAnalysisSnapshotResponse(
            analysis.getId(),
            analysis.getGoalId(),
            analysis.getVersionNumber(),
            analysis.getGoalSummary(),
            analysis.getKnownInformation(),
            analysis.getMissingInformation(),
            analysis.getReadiness(),
            questionResponses,
            analysis.getCreatedAt()
        );
    }
}
