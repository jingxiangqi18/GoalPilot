package com.qijx.goalpilot.auth.service;

import java.time.Instant;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.qijx.goalpilot.auth.config.JwtProperties;
import com.qijx.goalpilot.auth.security.GoalPilotUserPrincipal;

@Service
public class TokenService {
    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public TokenService(
        JwtEncoder jwtEncoder,
        JwtProperties jwtProperties
    ){
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
    }

    public String generateAccessToken(GoalPilotUserPrincipal principal){
        Instant issuedAt = Instant.now();
        Instant expiredAt = issuedAt.plus(jwtProperties.accessTokenTtl());

        JwsHeader header = JwsHeader
            .with(MacAlgorithm.HS256)
            .type("JWT")
            .build();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(jwtProperties.issuer())
            .subject(principal.userId().toString())
            .issuedAt(issuedAt)
            .expiresAt(expiredAt)
            .claim("userId", principal.userId())
            .claim("username", principal.getUsername())
            .build();

        return jwtEncoder
            .encode(JwtEncoderParameters.from(header, claims))
            .getTokenValue();
    }

    public long getAccessTokenExpiresInSeconds(){
        return jwtProperties.accessTokenTtl().toSeconds();
    }
}
