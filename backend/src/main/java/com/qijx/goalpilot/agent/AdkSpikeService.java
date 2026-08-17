package com.qijx.goalpilot.agent;

import com.google.adk.agents.LlmAgent;
import com.google.adk.agents.RunConfig;
import com.google.adk.events.Event;
import com.google.adk.runner.InMemoryRunner;
import com.google.adk.sessions.Session;
import com.google.genai.types.Content;
import com.google.genai.types.Part;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Executes one isolated ADK invocation for the technical Spike. */
@Service
public class AdkSpikeService {

    private static final Long SPIKE_AUTHENTICATED_USER_ID = 1L;
    private static final String SPIKE_SESSION_USER = "spike-authenticated-user";

    private final LlmAgent spikeAgent;

    public AdkSpikeService(LlmAgent spikeAgent) {
        this.spikeAgent = spikeAgent;
    }

    public AdkSpikeResult run() {
        requireApiKey();

        InMemoryRunner runner = new InMemoryRunner(spikeAgent, "goalpilot-spike");
        Session session = runner.sessionService()
                .createSession(
                        runner.appName(),
                        SPIKE_SESSION_USER,
                        Map.of("userId", SPIKE_AUTHENTICATED_USER_ID),
                        UUID.randomUUID().toString())
                .blockingGet();

        List<Event> events = runner.runAsync(
                        session.userId(),
                        session.id(),
                        Content.fromParts(Part.fromText(
                                "Read my current goals using getDemoGoals, then give a one-sentence summary.")),
                        RunConfig.builder().build())
                .toList()
                .blockingGet();

        List<String> calledTools = events.stream()
                .flatMap(event -> event.functionResponses().stream())
                .flatMap(response -> response.name().stream())
                .distinct()
                .toList();

        String finalResponse = events.stream()
                .filter(Event::finalResponse)
                .map(Event::stringifyContent)
                .filter(text -> !text.isBlank())
                .reduce((first, second) -> second)
                .orElse("Gemini did not return a final text response.");

        return new AdkSpikeResult(
                SPIKE_AUTHENTICATED_USER_ID,
                calledTools,
                calledTools.contains("getDemoGoals"),
                finalResponse);
    }

    private void requireApiKey() {
        String apiKey = System.getenv("GOOGLE_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GOOGLE_API_KEY is required to run the Gemini ADK Spike.");
        }
    }

    public record AdkSpikeResult(
            Long authenticatedUserId,
            List<String> calledTools,
            boolean demoGoalToolCalled,
            String finalResponse) {
    }
}
