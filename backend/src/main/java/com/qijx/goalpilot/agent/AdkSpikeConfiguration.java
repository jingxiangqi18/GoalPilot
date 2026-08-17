package com.qijx.goalpilot.agent;

import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.FunctionTool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * This configuration deliberately creates only the Agent and FunctionTool.
 * The next step will add a Runner, temporary ADK session and real Gemini call.
 */
@Configuration
public class AdkSpikeConfiguration {

    @Bean
    public LlmAgent spikeAgent(
            DemoGoalTool demoGoalTool,
            @Value("${goalpilot.agent.model:gemini-3.5-flash-lite}") String model) {
        return LlmAgent.builder()
                .name("goalpilot_spike_agent")
                .model(model)
                .instruction("Use getDemoGoals when you need the current user's goals. "
                        + "Never ask the user for an ID and never invent one.")
                .tools(FunctionTool.create(demoGoalTool, "getDemoGoals"))
                .maxSteps(3)
                .build();
    }
}

