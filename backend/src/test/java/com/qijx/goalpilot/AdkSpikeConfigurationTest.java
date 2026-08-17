package com.qijx.goalpilot;

import com.google.adk.agents.LlmAgent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AdkSpikeConfigurationTest {

    @Autowired
    private LlmAgent spikeAgent;

    @Test
    void createsAnAdkAgentWithTheSpringManagedGoalTool() {
        assertThat(spikeAgent.name()).isEqualTo("goalpilot_spike_agent");
        assertThat(spikeAgent.tools().blockingGet())
                .extracting(tool -> tool.name())
                .contains("getDemoGoals");
    }
}

