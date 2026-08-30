package com.qijx.goalpilot.auth.security;

import java.util.Locale;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qijx.goalpilot.user.domain.UserStatus;
import com.qijx.goalpilot.user.entity.User;
import com.qijx.goalpilot.user.mapper.UserMapper;

@Service
public class DatabaseUserDetailsService implements UserDetailsService{
    private final UserMapper userMapper;

    public DatabaseUserDetailsService(UserMapper userMapper){
        this.userMapper = userMapper;
    }

    @Override
    public UserDetails loadUserByUsername(String account){
        String normalizedAccount = account.trim();

        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();

        if(normalizedAccount.contains("@")){
            queryWrapper.eq(
                User::getEmail,
                normalizedAccount.toLowerCase(Locale.ROOT)
            );
        }else{
            queryWrapper.eq(User::getUsername, normalizedAccount);
        }

        User user = userMapper.selectOne(queryWrapper);

        if(user == null){
            throw new UsernameNotFoundException("账号或密码错误");
        }

        return new GoalPilotUserPrincipal(user.getId(), user.getUsername(), user.getPasswordHash(), UserStatus.ACTIVE.equals(user.getStatus()));
    }
}
