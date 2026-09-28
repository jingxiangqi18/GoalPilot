package com.qijx.goalpilot.task.dto;

import java.util.List;

public record TaskPageResponse(
    List<TaskResponse> items,

    long page,

    long size,

    long total,

    long totalPages
) {
    
}
