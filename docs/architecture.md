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
→ Java 检查模型返回内容
→ GoalAnalysisResponse
→ HTTP 200 response
```

当前 Goal Analysis 使用一次同步模型调用并返回普通文本。它还不是 Agent：没有工具调用、循环决策、会话记忆或自主执行。

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
- 尚未使用 Structured Output、Tool Calling、Chat Memory 或 RAG。
- 本地网络如果需要代理，应通过开发环境或 JVM 启动参数配置，不写入业务配置并提交。

## 下一阶段

```text
普通文本 Goal Analysis
→ Structured Output
→ 信息充分性判断
→ 澄清问题
→ Goal Ready
→ Plan Generation
```

下一步只实现 Structured Output：把模型结果映射为包含目标概述、已知信息和缺失信息的 Java 数据结构，并由 Java 校验结构是否可用。
