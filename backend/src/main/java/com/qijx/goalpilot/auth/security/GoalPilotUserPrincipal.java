package com.qijx.goalpilot.auth.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record GoalPilotUserPrincipal(
    Long userId,
    String username,
    String passwordHash,
    boolean enabled
) implements UserDetails {
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities(){
        return List.of();
    }

    @Override
    public String getPassword(){
        return passwordHash;
    }

    @Override
    public String getUsername(){
        return username;
    }

    @Override
    public boolean isEnabled(){
        return enabled;
    }
}
