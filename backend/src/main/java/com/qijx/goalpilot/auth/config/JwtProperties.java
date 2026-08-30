package com.qijx.goalpilot.auth.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
    @NotBlank
    String secretBase64,

    @NotBlank
    String issuer,

    @NotNull
    Duration accessTokenTtl
) {
}
