# GoalPilot

GoalPilot 是一个面向个人目标管理的 Agentic 应用，计划使用 Google ADK、Gemini 和 Google Cloud 构建“目标 → 计划建议 → 用户审核 → 执行 → 现实变化后重规划”的闭环。

## 当前阶段：ADK 技术验证

当前仓库已完成最小 ADK Spike：Spring Boot 可以构造带 Spring Bean 工具的 Google ADK `LlmAgent`，并通过自动化测试验证工具已注册。配置 `GOOGLE_API_KEY` 后，可调用真实 Gemini 并让模型调用该工具。

此阶段没有用户数据，也尚未接入数据库；为了方便验证 Spike，安全配置暂时放行本地请求。接入 JWT 前不得部署或保存真实用户数据。

## 本地启动

```bash
cd backend
mvn spring-boot:run
```

启动后访问：

```text
GET http://localhost:8080/actuator/health
GET http://localhost:8080/api/spike/adk/status
POST http://localhost:8080/api/spike/adk/run
```

## 当前目录

```text
backend/   Spring Boot + Google ADK 骨架
frontend/  后续 Vue 3 演示界面
docs/      架构、评测与比赛材料
```

详细复用声明见 [PRE_EXISTING_WORK.md](PRE_EXISTING_WORK.md)。

> `GOOGLE_API_KEY` 不能提交到仓库；Google ADK 使用该变量读取 Gemini API Key。变量名称参考 [.env.example](.env.example)。
