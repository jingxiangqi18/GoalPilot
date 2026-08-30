package com.qijx.goalpilot.auth.service;

import java.time.LocalDateTime;
import java.util.Locale;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qijx.goalpilot.auth.dto.UserLoginRequest;
import com.qijx.goalpilot.auth.dto.UserLoginResponse;
import com.qijx.goalpilot.auth.dto.UserRegisterRequest;
import com.qijx.goalpilot.auth.security.GoalPilotUserPrincipal;
import com.qijx.goalpilot.user.domain.UserStatus;
import com.qijx.goalpilot.user.dto.UserResponse;
import com.qijx.goalpilot.user.entity.User;
import com.qijx.goalpilot.user.mapper.UserMapper;

@Service
public class AuthService {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    public AuthService(
        UserMapper userMapper,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        TokenService tokenService
    ){
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    public UserResponse register(
        UserRegisterRequest request
    ){
        String normalizedUsername = request.username().trim();
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        Long usernameCount = userMapper.selectCount(
            new LambdaQueryWrapper<User>()
                .eq(User::getUsername, normalizedUsername)
        );

        if(usernameCount > 0){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已存在");
        }

        Long emailCount = userMapper.selectCount(
            new LambdaQueryWrapper<User>()
                .eq(User::getEmail, normalizedEmail)
        );

        if(emailCount > 0){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "邮箱已被使用");
        }

        LocalDateTime now = LocalDateTime.now();

        User user = new User();

        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(
            passwordEncoder.encode(request.password())
        );
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        int insertedRows;

        try{
            insertedRows = userMapper.insert(user);
        }catch(DuplicateKeyException exception){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名或邮箱已存在");
        }

        if(insertedRows != 1){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "用户注册失败");
        }

        return UserResponse.from(user);
    }

    public UserLoginResponse login(UserLoginRequest request){
        String normalizedAccount = request.account().trim();

        Authentication authenticationRequest = UsernamePasswordAuthenticationToken.unauthenticated(normalizedAccount, request.password());

        Authentication authentication;

        try{
            authentication = authenticationManager.authenticate(authenticationRequest);
        }catch(AuthenticationException exception){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
        }

        GoalPilotUserPrincipal principal = (GoalPilotUserPrincipal) authentication.getPrincipal();

        User user = userMapper.selectById(principal.userId());

        if(user == null){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户不存在");
        }

        String accessToken = tokenService.generateAccessToken(principal);

        return new UserLoginResponse(
            accessToken,
            "Bearer",
            tokenService.getAccessTokenExpiresInSeconds(),
            UserResponse.from(user)
        );
    }
}
