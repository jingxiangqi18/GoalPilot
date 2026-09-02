# GoalPilot architecture note

## 技术方向

GoalPilot 后端采用以下技术：

```text
Java 17
Spring Boot 4
Spring AI 2
DeepSeek（OpenAI 兼容接口）
MyBatis-Plus + MySQL
```

当前 AI 能力统一通过 Spring AI 接入，业务层不直接依赖 DeepSeek SDK。

## 当前已实现链路

```text
HTTP POST /api/goals/{goalId}/analyze
→ GoalAnalysisController
→ GoalService 校验登录用户、Goal 所有权和状态
→ GoalAnalysisService
→ Spring AI ChatClient
→ DeepSeek
→ Structured Output 映射
→ Java 检查模型返回内容
→ 事务保存分析快照和澄清问题
→ READY 或 NEEDS_CLARIFICATION
```

```text
NEEDS_CLARIFICATION
→ HTTP POST /api/goals/{goalId}/clarifications
→ 根据 questionId 校验并恢复数据库中的问题与历史回答
→ GoalAnalysisService 重新分析
→ 事务保存回答、新分析版本、新问题和 Goal 状态
```

```text
READY
→ HTTP POST /api/plans/generate
→ PlanGenerationController
→ 客户端只提交 goalId
→ PlanService 校验登录用户、Goal 所有权和 READY 状态
→ 从数据库读取最新分析
→ PlanGenerationService
→ Spring AI ChatClient
→ DeepSeek
→ Structured Output 映射
→ Java 校验阶段和任务结构
→ 事务保存 Plan 草稿、阶段和任务
→ PlanSnapshotResponse
```

当前 Goal Analysis、Clarification 和 Plan Generation 都采用同步模型调用。它们还不是完整 Agent：没有工具调用、循环决策、会话记忆或自主执行。

## 分层原则

```text
Controller
→ 处理 HTTP 请求、登录用户、参数校验和响应

业务 Service
→ 校验资源所有权和状态，组织数据库与 AI 调用

AI Service
→ 构造模型指令、调用模型并校验结构化输出

Persistence Service / Mapper
→ 查询持久化上下文，通过事务保存一次业务操作的多张表变化

DTO
→ 定义 GoalPilot 自己的请求和响应结构

Spring AI
→ 封装模型调用，当前通过 OpenAI 兼容接口连接 DeepSeek
```

Controller 和 DTO 不暴露 `ChatClient`、`ChatResponse` 等 Spring AI 类型。未来的 Goal、Plan 和 Task 领域对象也应保持为普通 Java 类型。

## 当前边界

- 用户、Goal、分析版本、澄清记录和 Plan 草稿已经持久化到 MySQL。
- 业务接口使用 Spring Security + JWT，并根据当前用户校验 Goal 所有权。
- Goal Analysis 和 Plan Generation 使用 Structured Output，并由 Java 校验模型输出。
- Plan 当前仍是草稿，尚未实现用户确认、正式版本和执行状态变更。
- 尚未使用 Tool Calling、Chat Memory、Workflow 或 RAG。
- 本地网络如果需要代理，应通过开发环境或 JVM 启动参数配置，不写入业务配置并提交。

## 下一阶段

```text
Plan 草稿
→ 用户确认或拒绝
→ 确认后形成 Plan V1
→ Goal 进入 ACTIVE
→ 任务执行
```

下一步实现 Plan 草稿确认或拒绝。确认后才分配正式版本号并让 Goal 进入 `ACTIVE`；AI 输出不能直接覆盖正式计划。
