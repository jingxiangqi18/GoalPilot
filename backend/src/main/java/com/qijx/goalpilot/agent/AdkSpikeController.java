package com.qijx.goalpilot.agent;

import com.google.adk.agents.LlmAgent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/spike/adk")
public class AdkSpikeController {

    private final LlmAgent spikeAgent;
    private final String model;

    public AdkSpikeController(
            LlmAgent spikeAgent,
            @Value("${goalpilot.agent.model:gemini-3.5-flash-lite}") String model) {
        this.spikeAgent = spikeAgent;
        this.model = model;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
                "agent", spikeAgent.name(),
                "model", model,
                "tool", "getDemoGoals",
                "geminiApiKeyConfigured", hasGeminiApiKey(),
                "nextStep", "Create an ADK Runner and invoke Gemini with userId in invocation state."
        );
    }

    private boolean hasGeminiApiKey() {
        String apiKey = System.getenv("GEMINI_API_KEY");
        return apiKey != null && !apiKey.isBlank();
    }
}

