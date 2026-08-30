# GoalPilot

GoalPilot 是一个面向个人目标管理的 AI 应用，目标是构建“目标输入 → 目标分析 → 信息澄清 → 计划生成 → 用户确认 → 执行与调整”的闭环。

后端采用 Java、Spring Boot 和 Spring AI，通过 OpenAI 兼容接口接入 DeepSeek。业务模型保持为普通 Java 类型，不依赖具体的大模型供应商或 Spring AI 类型。

## 当前阶段：账户认证、目标理解与初步计划生成

当前后端已经实现从自然语言目标到初步执行计划的基础链路：使用 Spring AI `ChatClient` 调用 DeepSeek，通过 Structured Output 映射为 GoalPilot 自己的 Java DTO，并在 Service 中校验模型输出是否符合业务约束。

当前已实现的接口：

```text
POST http://localhost:8080/api/auth/register
POST http://localhost:8080/api/auth/login
GET  http://localhost:8080/api/auth/me
POST http://localhost:8080/api/goals/analyze
POST http://localhost:8080/api/goals/clarify
POST http://localhost:8080/api/plans/generate
```

注册用户保存在 MySQL 中，登录成功后签发 JWT。除注册、登录和健康检查外，
其余接口均需要在 `Authorization` 请求头中携带 Bearer Token。

目标分析会返回目标概述、已知信息、缺失信息、信息充分性状态和最多 3 个澄清问题。用户补充回答后可以重新分析；当状态为 `READY` 时，可以生成包含阶段、阶段目标、时间范围、具体任务和完成标准的结构化初步计划。

当前只持久化用户账户；Goal、分析结果和 Plan 仍然只存在于单次请求中，尚未保存到数据库，也没有计划版本管理。

## 本地启动

首先配置 MySQL、JWT 和 DeepSeek。JWT 密钥必须是 Base64 编码且解码后不少于 32 字节：

```bash
export DEEPSEEK_API_KEY="your-api-key"
export DB_URL="jdbc:mysql://localhost:3306/goalpilot?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai"
export DB_USERNAME="root"
export DB_PASSWORD="your-password"
export JWT_SECRET_BASE64="your-base64-encoded-secret"
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

先注册并登录，再使用返回的 `accessToken` 调用业务接口：

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"goal_user","email":"user@example.com","password":"secret123"}'

curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"user@example.com","password":"secret123"}'
```

Goal Analysis 测试（将 `<access-token>` 替换为登录响应中的 Token）：

```bash
curl -X POST http://localhost:8080/api/goals/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{"goalText":"我想在三个月内完成一个适合找 Java 后端实习的项目"}'
```

Plan Generation 测试需要提交一个状态为 `READY` 的最终分析结果：

```bash
curl -X POST http://localhost:8080/api/plans/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
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
backend/   Spring Boot、Spring Security、Spring AI 与 MySQL 后端
frontend/  Vue 3 + Vite 认证及目标规划界面
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
