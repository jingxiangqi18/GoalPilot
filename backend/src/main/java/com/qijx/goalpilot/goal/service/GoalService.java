package com.qijx.goalpilot.goal.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qijx.goalpilot.goal.domain.GoalReadiness;
import com.qijx.goalpilot.goal.domain.GoalStatus;
import com.qijx.goalpilot.goal.dto.GoalAnalysisResponse;
import com.qijx.goalpilot.goal.dto.GoalAnalysisSnapshotResponse;
import com.qijx.goalpilot.goal.dto.GoalClarificationAnswerRequest;
import com.qijx.goalpilot.goal.dto.GoalClarificationContext;
import com.qijx.goalpilot.goal.dto.GoalClarificationRequest;
import com.qijx.goalpilot.goal.dto.GoalCreateRequest;
import com.qijx.goalpilot.goal.dto.GoalListResponse;
import com.qijx.goalpilot.goal.dto.GoalResponse;
import com.qijx.goalpilot.goal.entity.Goal;
import com.qijx.goalpilot.goal.entity.GoalAnalysis;
import com.qijx.goalpilot.goal.entity.GoalClarificationQuestion;
import com.qijx.goalpilot.goal.mapper.GoalMapper;

@Service
public class GoalService {
    private final GoalMapper goalMapper;
    private final GoalAnalysisService goalAnalysisService;
    private final GoalAnalysisPersistenceService goalAnalysisPersistenceService;

    public GoalService(
        GoalMapper goalMapper,
        GoalAnalysisService goalAnalysisService,
        GoalAnalysisPersistenceService goalAnalysisPersistenceService
    ){
        this.goalMapper = goalMapper;
        this.goalAnalysisService = goalAnalysisService;
        this.goalAnalysisPersistenceService = goalAnalysisPersistenceService;

    }

    public GoalResponse createGoal(Long userId, GoalCreateRequest request){
        String normalizedGoalText = request.goalText().trim();

        Goal goal = new Goal();

        goal.setUserId(userId);
        goal.setGoalText(normalizedGoalText);
        goal.setStatus(GoalStatus.DRAFT);

        LocalDateTime now = LocalDateTime.now();

        goal.setCreatedAt(now);
        goal.setUpdatedAt(now);

        int insertedRows = goalMapper.insert(goal);

        if(insertedRows != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "目标插入失败");
        }

        return GoalResponse.from(goal);
    }

    public GoalListResponse findMyGoals(Long userId, long page, long size){
        Page<Goal> goalPage = new Page<>(page, size);

        Page<Goal> resultPage = goalMapper.selectPage(
            goalPage,
            new LambdaQueryWrapper<Goal>()
                .eq(Goal::getUserId, userId)
                .orderByDesc(Goal::getCreatedAt)
                .orderByDesc(Goal::getId)
            );

        List<GoalResponse> items = resultPage.getRecords()
            .stream()
            .map(GoalResponse::from)
            .toList();

        return new GoalListResponse(
            items,
            resultPage.getCurrent(),
            resultPage.getSize(),
            resultPage.getTotal(),
            resultPage.getPages()
        );
    }

    public GoalResponse findGoalDetails(Long userId, Long goalId){
        Goal goal = findOwnedGoal(userId, goalId);

        return GoalResponse.from(goal);
    }

    public GoalAnalysisSnapshotResponse analyzeGoal(Long userId, Long goalId){
        Goal goal = findOwnedGoal(userId, goalId);

        if(goal.getStatus() != GoalStatus.DRAFT){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "目标状态不正确");
        }

        GoalAnalysisResponse response = goalAnalysisService.analyzeGoal(goal.getGoalText());

        GoalAnalysisSnapshotResponse snapshotResponse = goalAnalysisPersistenceService.saveInitialAnalysis(goal, response);

        return snapshotResponse;
    }

    public GoalAnalysisSnapshotResponse clarifyGoal(
        Long userId,
        Long goalId,
        GoalClarificationRequest request
    ){
        Goal goal = findOwnedGoal(userId, goalId);

        if(goal.getStatus() != GoalStatus.NEEDS_CLARIFICATION){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "当前目标不需要澄清");
        }

        GoalAnalysis latestAnalysis =
            goalAnalysisPersistenceService.findLatestAnalysis(goalId);

        if(latestAnalysis.getReadiness() != GoalReadiness.NEEDS_CLARIFICATION){
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "目标状态与最新分析状态不一致"
            );
        }

        List<GoalClarificationQuestion> currentQuestions =
            goalAnalysisPersistenceService.findQuestionsByAnalysisId(latestAnalysis.getId());

        List<GoalClarificationQuestion> currentAnsweredQuestions =
            resolveCurrentAnswers(currentQuestions, request.answers());

        List<GoalClarificationQuestion> previousAnsweredQuestions =
            goalAnalysisPersistenceService.findAnsweredHistory(goalId);

        List<GoalClarificationContext> clarificationHistory =
            buildClarificationHistory(
                previousAnsweredQuestions,
                currentAnsweredQuestions
            );

        GoalAnalysisResponse analysisResult =
            goalAnalysisService.clarifyGoal(goal.getGoalText(), clarificationHistory);

        return goalAnalysisPersistenceService.saveClarifiedAnalysis(
            goal,
            latestAnalysis,
            currentAnsweredQuestions,
            analysisResult
        );
    }

    private Goal findOwnedGoal(Long userId, Long goalId){
        Goal goal = goalMapper.selectOne(
            new LambdaQueryWrapper<Goal>()
                .eq(Goal::getId, goalId)
                .eq(Goal::getUserId, userId)
        );

        if(goal == null){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "目标不存在");
        }

        return goal;
    }

    private List<GoalClarificationQuestion> resolveCurrentAnswers(
        List<GoalClarificationQuestion> currentQuestions,
        List<GoalClarificationAnswerRequest> submittedAnswers
    ){
        if(currentQuestions == null || currentQuestions.isEmpty()){
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "当前分析缺少澄清问题"
            );
        }

        if(submittedAnswers == null
            || submittedAnswers.size() != currentQuestions.size()){
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "必须完整回答当前全部澄清问题"
            );
        }

        Map<Long, GoalClarificationAnswerRequest> answersByQuestionId =
            new HashMap<>();

        for(GoalClarificationAnswerRequest submittedAnswer : submittedAnswers){
            GoalClarificationAnswerRequest existingAnswer =
                answersByQuestionId.putIfAbsent(
                    submittedAnswer.questionId(),
                    submittedAnswer
                );

            if(existingAnswer != null){
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "不能重复回答同一个澄清问题"
                );
            }
        }

        for(GoalClarificationQuestion currentQuestion : currentQuestions){
            GoalClarificationAnswerRequest submittedAnswer =
                answersByQuestionId.remove(currentQuestion.getId());

            if(submittedAnswer == null){
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "提交的回答与当前澄清问题不匹配"
                );
            }

            if(currentQuestion.getAnswerText() != null){
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "当前澄清问题已经回答"
                );
            }

            currentQuestion.setAnswerText(submittedAnswer.answer().trim());
        }

        if(!answersByQuestionId.isEmpty()){
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "提交了不属于当前分析的澄清问题"
            );
        }

        return currentQuestions;
    }

    private List<GoalClarificationContext> buildClarificationHistory(
        List<GoalClarificationQuestion> previousAnsweredQuestions,
        List<GoalClarificationQuestion> currentAnsweredQuestions
    ){
        List<GoalClarificationContext> clarificationHistory = new ArrayList<>(
            previousAnsweredQuestions.size() + currentAnsweredQuestions.size()
        );

        for(GoalClarificationQuestion question : previousAnsweredQuestions){
            clarificationHistory.add(
                new GoalClarificationContext(
                    question.getQuestionText().trim(),
                    question.getAnswerText().trim()
                )
            );
        }

        for(GoalClarificationQuestion question : currentAnsweredQuestions){
            clarificationHistory.add(
                new GoalClarificationContext(
                    question.getQuestionText().trim(),
                    question.getAnswerText().trim()
                )
            );
        }

        return clarificationHistory;
    }
}
