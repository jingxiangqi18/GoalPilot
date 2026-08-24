# GoalPilot architecture note

## 技术方向

GoalPilot 后端采用以下技术：

```text
Java 17
Spring Boot 4
Spring AI 2
DeepSeek（OpenAI 兼容接口）
MyBatis-Plus + MySQL（后续持久化阶段接入）
```

当前 AI 能力统一通过 Spring AI 接入，业务层不直接依赖 DeepSeek SDK。

## 当前已实现链路

```text
HTTP POST /api/goals/analyze
→ GoalAnalysisController
→ 请求参数校验
→ GoalAnalysisService
→ Spring AI ChatClient
→ DeepSeek
→ Structured Output 映射
→ Java 检查模型返回内容
→ GoalAnalysisResponse
→ READY 或 NEEDS_CLARIFICATION
```

```text
NEEDS_CLARIFICATION
→ HTTP POST /api/goals/clarify
→ 提交原始目标和澄清回答
→ GoalAnalysisService 重新分析
→ GoalAnalysisResponse
```

```text
READY
→ HTTP POST /api/plans/generate
→ PlanGenerationController
→ PlanGenerationService 校验计划生成前置条件
→ Spring AI ChatClient
→ DeepSeek
→ Structured Output 映射
→ Java 校验阶段和任务结构
→ PlanGenerationResponse
```

当前 Goal Analysis、Clarification 和 Plan Generation 都采用同步模型调用。它们还不是完整 Agent：没有工具调用、循环决策、会话记忆或自主执行。

## 分层原则

```text
Controller
→ 处理 HTTP 请求、参数校验和响应

Service
→ 执行业务规则、构造模型指令、调用 AI 并校验结果

DTO
→ 定义 GoalPilot 自己的请求和响应结构

Spring AI
→ 封装模型调用，当前通过 OpenAI 兼容接口连接 DeepSeek
```

Controller 和 DTO 不暴露 `ChatClient`、`ChatResponse` 等 Spring AI 类型。未来的 Goal、Plan 和 Task 领域对象也应保持为普通 Java 类型。

## 当前边界

- 尚未保存 Goal 或分析结果。
- 尚未启用 MySQL 数据源。
- 尚未接入 JWT，当前安全配置仅用于本地开发。
- Goal Analysis 和 Plan Generation 已使用 Structured Output，并由 Java 校验模型输出。
- 尚未使用 Tool Calling、Chat Memory、Workflow 或 RAG。
- 本地网络如果需要代理，应通过开发环境或 JVM 启动参数配置，不写入业务配置并提交。

## 下一阶段

```text
Goal Analysis
→ Clarification
→ Goal Ready
→ Initial Plan Generation
→ 用户确认
→ Goal / Plan 持久化
→ Plan Version
```

当前生成的 Plan 是尚未持久化的初步建议。下一步先验证完整 API 链路，再设计用户确认以及 Goal、Plan 和 Plan Version 的持久化边界；在此之前不提前引入 Tool Calling、Memory 或复杂 Agent Workflow。
