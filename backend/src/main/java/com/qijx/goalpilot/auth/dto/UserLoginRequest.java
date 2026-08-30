package com.qijx.goalpilot.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UserLoginRequest(
    @NotBlank(message = "账号不能为空")
    String account,

    @NotBlank(message = "密码不能为空")
    String password
) {
    
}
