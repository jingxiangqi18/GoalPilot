package com.qijx.goalpilot.goal.dto;

import java.util.List;

public record GoalListResponse(
    List<GoalResponse> items,
    long page,
    long size,
    long total,
    long totalPages
) {
}
