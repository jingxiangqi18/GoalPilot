# GoalPilot

GoalPilot 是一个面向个人目标管理的 AI 应用，目标是构建“目标输入 → 目标分析 → 信息澄清 → 计划生成 → 用户确认 → 执行与调整”的闭环。

后端采用 Java、Spring Boot 和 Spring AI，通过 OpenAI 兼容接口接入 DeepSeek。业务模型保持为普通 Java 类型，不依赖具体的大模型供应商或 Spring AI 类型。

## 当前阶段：账户认证、目标分析与计划草稿持久化

当前后端已经实现从登录用户创建 Goal、持久化目标分析和澄清记录，到生成并保存计划草稿的基础链路。AI 能力使用 Spring AI `ChatClient` 调用 DeepSeek，通过 Structured Output 映射为 GoalPilot 自己的 Java DTO，并在写入数据库前校验模型输出。

当前已实现的接口：

```text
POST http://localhost:8080/api/auth/register
POST http://localhost:8080/api/auth/login
GET  http://localhost:8080/api/auth/me
POST http://localhost:8080/api/goals
GET  http://localhost:8080/api/goals
GET  http://localhost:8080/api/goals/{goalId}
POST http://localhost:8080/api/goals/{goalId}/analyze
POST http://localhost:8080/api/goals/{goalId}/clarifications
POST http://localhost:8080/api/plans/generate
```

注册用户保存在 MySQL 中，登录成功后签发 JWT。除注册、登录和健康检查外，
其余接口均需要在 `Authorization` 请求头中携带 Bearer Token。

Goal、分析快照、澄清问题与回答均保存在 MySQL 中，并按登录用户校验所有权。目标达到 `READY_TO_PLAN` 后，后端根据 `goalId` 读取可信的最新分析，生成并保存包含阶段和任务的计划草稿。

当前保存的是尚待用户确认的 Plan 草稿；草稿确认、正式 `Plan V1` 和任务执行属于下一阶段。

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

创建 Goal 后，使用返回的 `id` 发起分析：

```bash
curl -X POST http://localhost:8080/api/goals \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"goalText":"我想在三个月内完成一个适合找 Java 后端实习的项目"}'

curl -X POST http://localhost:8080/api/goals/<goal-id>/analyze \
  -H "Authorization: Bearer <access-token>"
```

当 Goal 状态为 `READY_TO_PLAN` 时，只提交 `goalId` 生成计划草稿：

```bash
curl -X POST http://localhost:8080/api/plans/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{"goalId": <goal-id>}'
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
