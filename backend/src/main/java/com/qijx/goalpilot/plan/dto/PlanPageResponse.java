package com.qijx.goalpilot.plan.dto;

import java.util.List;

public record PlanPageResponse(
    List<PlanSnapshotResponse> items,
    long page,
    long size,
    long total,
    long totalPages
) {
}
