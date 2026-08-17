package com.qijx.goalpilot.agent;

import com.google.adk.agents.LlmAgent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/spike/adk")
public class AdkSpikeController {

    private final LlmAgent spikeAgent;
    private final AdkSpikeService adkSpikeService;
    private final String model;

    public AdkSpikeController(
            LlmAgent spikeAgent,
            AdkSpikeService adkSpikeService,
            @Value("${goalpilot.agent.model:gemini-3.5-flash-lite}") String model) {
        this.spikeAgent = spikeAgent;
        this.adkSpikeService = adkSpikeService;
        this.model = model;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
                "agent", spikeAgent.name(),
                "model", model,
                "tool", "getDemoGoals",
                "googleApiKeyConfigured", hasGoogleApiKey(),
                "nextStep", "POST /api/spike/adk/run invokes Gemini with userId in ADK session state."
        );
    }

    @PostMapping("/run")
    public AdkSpikeService.AdkSpikeResult run() {
        return adkSpikeService.run();
    }

    private boolean hasGoogleApiKey() {
        String apiKey = System.getenv("GOOGLE_API_KEY");
        return apiKey != null && !apiKey.isBlank();
    }
}
