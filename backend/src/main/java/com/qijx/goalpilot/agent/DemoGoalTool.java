package com.qijx.goalpilot.agent;

import com.google.adk.tools.ToolContext;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Spike-only tool. It demonstrates the security rule that a tool obtains the
 * current user from ADK invocation state rather than from model arguments.
 */
@Component
public class DemoGoalTool {

    public Map<String, Object> getDemoGoals(ToolContext toolContext) {
        Object userId = toolContext.state().get("userId");
        if (!(userId instanceof Long authenticatedUserId)) {
            throw new IllegalStateException("ADK invocation state does not contain an authenticated userId");
        }

        return Map.of(
                "userId", authenticatedUserId,
                "goals", List.of("Prepare for a Java backend interview", "Run three times this week")
        );
    }
}

