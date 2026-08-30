package com.qijx.goalpilot.user.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.qijx.goalpilot.user.dto.UserResponse;
import com.qijx.goalpilot.user.entity.User;
import com.qijx.goalpilot.user.mapper.UserMapper;

@Service
public class UserService {
    private final UserMapper userMapper;

    public UserService(UserMapper userMapper){
        this.userMapper = userMapper;
    }

    public UserResponse getCurrentUser(Long userId){
        User user = userMapper.selectById(userId);

        if(user == null){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户不存在");
        }

        return UserResponse.from(user);
    }
}
