package com.qijx.goalpilot.goal.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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

        GoalAnalysis analysis = saveAnalysis(
            goal.getId(),
            1,
            analysisResult,
            now
        );

        List<GoalClarificationQuestion> savedQuestions = saveQuestions(analysis.getId(), analysisResult.clarificationQuestions(), now);

        updateGoalStatus(goal, analysisResult.readiness(), now);

        return toResponse(analysis, savedQuestions);
    }

    @Transactional
    public GoalAnalysisSnapshotResponse saveClarifiedAnalysis(
        Goal goal,
        GoalAnalysis previousAnalysis,
        List<GoalClarificationQuestion> answeredQuestions,
        GoalAnalysisResponse analysisResult
    ){
        LocalDateTime now = LocalDateTime.now();

        for(GoalClarificationQuestion question : answeredQuestions){
            question.setAnsweredAt(now);

            int updatedQuestionRows = questionMapper.updateById(question);

            if(updatedQuestionRows != 1){
                throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "澄清回答保存失败"
                );
            }
        }

        GoalAnalysis analysis = saveAnalysis(
            goal.getId(),
            previousAnalysis.getVersionNumber() + 1,
            analysisResult,
            now
        );

        List<GoalClarificationQuestion> savedQuestions = saveQuestions(
            analysis.getId(),
            analysisResult.clarificationQuestions(),
            now
        );

        updateGoalStatus(goal, analysisResult.readiness(), now);

        return toResponse(analysis, savedQuestions);
    }

    public GoalAnalysis findLatestAnalysis(Long goalId){
        GoalAnalysis analysis = goalAnalysisMapper.selectOne(
            new LambdaQueryWrapper<GoalAnalysis>()
                .eq(GoalAnalysis::getGoalId, goalId)
                .orderByDesc(GoalAnalysis::getVersionNumber)
                .last("LIMIT 1")
        );

        if(analysis == null){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "目标缺少分析记录");
        }

        return analysis;
    }

    public List<GoalClarificationQuestion> findQuestionsByAnalysisId(Long analysisId){
        List<GoalClarificationQuestion> questions = questionMapper.selectList(
            new LambdaQueryWrapper<GoalClarificationQuestion>()
                .eq(GoalClarificationQuestion::getAnalysisId, analysisId)
                .orderByAsc(GoalClarificationQuestion::getSortOrder)
        );

        return questions;
    }

    public List<GoalClarificationQuestion> findAnsweredHistory(Long goalId){
        return questionMapper.selectAnsweredByGoalId(goalId);
    }

    private GoalAnalysis saveAnalysis(
        Long goalId,
        Integer versionNumber,
        GoalAnalysisResponse analysisResult,
        LocalDateTime createdAt
    ){
        GoalAnalysis analysis = new GoalAnalysis();

        analysis.setGoalId(goalId);
        analysis.setVersionNumber(versionNumber);
        analysis.setGoalSummary(analysisResult.goalSummary().trim());
        analysis.setKnownInformation(normalizeInformation(analysisResult.knownInformation()));
        analysis.setMissingInformation(normalizeInformation(analysisResult.missingInformation()));
        analysis.setReadiness(analysisResult.readiness());
        analysis.setCreatedAt(createdAt);

        int insertedAnalysisRows = goalAnalysisMapper.insert(analysis);

        if(insertedAnalysisRows != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "目标分析保存失败");
        }

        return analysis;
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

    private void updateGoalStatus(
        Goal goal,
        GoalReadiness readiness,
        LocalDateTime updatedAt
    ){
        goal.setStatus(mapGoalStatus(readiness));
        goal.setUpdatedAt(updatedAt);

        int updatedGoalRows = goalMapper.updateById(goal);

        if(updatedGoalRows != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "目标状态更新失败");
        }
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
