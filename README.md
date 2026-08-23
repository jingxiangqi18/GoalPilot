# GoalPilot

GoalPilot 是一个面向个人目标管理的 AI 应用，目标是构建“目标输入 → 目标分析 → 信息澄清 → 计划生成 → 用户确认 → 执行与调整”的闭环。

后端采用 Java、Spring Boot 和 Spring AI，通过 OpenAI 兼容接口接入 DeepSeek。业务模型保持为普通 Java 类型，不依赖具体的大模型供应商或 Spring AI 类型。

## 当前阶段：基础 Goal Analysis

当前仓库已经完成第一个可运行的 Goal Analysis 功能：后端接收用户的自然语言目标，通过 Spring AI `ChatClient` 调用 DeepSeek，并返回目标概述、已知信息和缺失信息组成的文本分析结果。

已完成并验证的接口：

```text
POST http://localhost:8080/api/goals/analyze
```

当前分析结果还是普通文本。下一步将使用 Spring AI Structured Output，把分析结果转换为稳定的 Java 数据结构，再继续实现信息充分性判断和澄清问题。

当前阶段尚未保存 Goal 或分析结果，也尚未接入数据库。为了方便本地开发，安全配置暂时允许所有请求；接入 JWT 前不得部署为公开服务或保存真实用户数据。

## 本地启动

首先配置 DeepSeek API Key：

```bash
export DEEPSEEK_API_KEY="your-api-key"
```

然后启动后端：

```bash
cd backend
mvn spring-boot:run
```

健康检查：

```text
GET http://localhost:8080/actuator/health
```

Goal Analysis 测试：

```bash
curl -X POST http://localhost:8080/api/goals/analyze \
  -H "Content-Type: application/json" \
  -d '{"goalText":"我想在三个月内完成一个适合找 Java 后端实习的项目"}'
```

## 当前目录

```text
backend/   Spring Boot + Spring AI 后端
frontend/  Vue 3 + Vite 目标分析演示界面
docs/      项目架构说明
```

前端本地启动：

```bash
cd frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`，开发服务器会将 `/api` 请求代理到默认的
`http://localhost:8080` 后端服务。

> 不要向仓库提交真实 API Key。可配置的环境变量名称参考 [.env.example](.env.example)。
