package com.qijx.goalpilot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;

@Configuration
public class MyBatisPlusConfiguration {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        PaginationInnerInterceptor paginationInterceptor =
            new PaginationInnerInterceptor(DbType.MYSQL);

        paginationInterceptor.setMaxLimit(100L);

        MybatisPlusInterceptor interceptor =
            new MybatisPlusInterceptor();

        interceptor.addInnerInterceptor(paginationInterceptor);

        return interceptor;
    }
}