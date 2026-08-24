# GoalPilot

GoalPilot 是一个面向个人目标管理的 AI 应用，目标是构建“目标输入 → 目标分析 → 信息澄清 → 计划生成 → 用户确认 → 执行与调整”的闭环。

后端采用 Java、Spring Boot 和 Spring AI，通过 OpenAI 兼容接口接入 DeepSeek。业务模型保持为普通 Java 类型，不依赖具体的大模型供应商或 Spring AI 类型。

## 当前阶段：目标理解与初步计划生成

当前后端已经实现从自然语言目标到初步执行计划的基础链路：使用 Spring AI `ChatClient` 调用 DeepSeek，通过 Structured Output 映射为 GoalPilot 自己的 Java DTO，并在 Service 中校验模型输出是否符合业务约束。

当前已实现的接口：

```text
POST http://localhost:8080/api/goals/analyze
POST http://localhost:8080/api/goals/clarify
POST http://localhost:8080/api/plans/generate
```

目标分析会返回目标概述、已知信息、缺失信息、信息充分性状态和最多 3 个澄清问题。用户补充回答后可以重新分析；当状态为 `READY` 时，可以生成包含阶段、阶段目标、时间范围、具体任务和完成标准的结构化初步计划。

当前 Goal、分析结果和 Plan 仍然只存在于单次请求中，尚未接入数据库或计划版本。为了方便本地开发，安全配置暂时允许所有请求；接入 JWT 前不得部署为公开服务或保存真实用户数据。

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

Plan Generation 测试需要提交一个状态为 `READY` 的最终分析结果：

```bash
curl -X POST http://localhost:8080/api/plans/generate \
  -H "Content-Type: application/json" \
  -d '{
    "goalText":"我想在三个月内完成一个适合找 Java 后端实习的项目",
    "goalAnalysis":{
      "goalSummary":"三个月内完成一个适合 Java 后端求职展示的项目",
      "knownInformation":[
        "目标方向是 Java 后端",
        "完成期限是三个月",
        "项目需要用于求职展示"
      ],
      "missingInformation":[],
      "readiness":"READY",
      "clarificationQuestions":[]
    }
  }'
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
