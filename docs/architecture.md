# v0.1 architecture note

当前 Spike 只验证如下最小链路：

```text
HTTP request
→ Spring Controller
→ ADK LlmAgent
→ FunctionTool wrapping a Spring Bean
→ ToolContext state containing authenticated userId
```

后续会将 ADK 会话限制在单次调用内；业务目标、任务、记忆、ChangeSet 和计划版本将持久化到 MySQL。

