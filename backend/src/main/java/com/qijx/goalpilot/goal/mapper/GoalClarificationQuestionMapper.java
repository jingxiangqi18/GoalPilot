package com.qijx.goalpilot.goal.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qijx.goalpilot.goal.entity.GoalClarificationQuestion;

@Mapper
public interface GoalClarificationQuestionMapper extends BaseMapper<GoalClarificationQuestion>{
    @Select("""
            SELECT q.*
            FROM goal_clarification_questions q
            INNER JOIN goal_analyses a
                ON q.analysis_id = a.id
            WHERE a.goal_id = #{goalId}
                AND q.answer_text IS NOT NULL
            ORDER BY a.version_number ASC,
                q.sort_order ASC
            """)
    List<GoalClarificationQuestion> selectAnsweredByGoalId(
        @Param("goalId") Long goalId);
}
