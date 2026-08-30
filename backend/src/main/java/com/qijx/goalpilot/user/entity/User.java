package com.qijx.goalpilot.user.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.qijx.goalpilot.user.domain.UserStatus;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("users")
public class User {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private String username;

    private String email;

    private String passwordHash;

    private UserStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
