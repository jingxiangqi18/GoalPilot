<div align="center">

# GoalPilot

**让目标有计划，让行动有方向。**

基于 Java 后端与 Spring AI 的个人目标管理应用<br>
从目标分析、信息澄清到计划确认，再逐步连接任务执行。

<p>
  <img src="https://img.shields.io/badge/Java-17-E76F00?style=flat-square" alt="Java 17">
  <img src="https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F?style=flat-square" alt="Spring Boot 4.1.1">
  <img src="https://img.shields.io/badge/Spring_AI-2.0.0-3A8D5D?style=flat-square" alt="Spring AI 2.0.0">
  <img src="https://img.shields.io/badge/MySQL-Persistence-4479A1?style=flat-square" alt="MySQL persistence">
  <img src="https://img.shields.io/badge/Status-In_Development-D99A26?style=flat-square" alt="In development">
</p>

<a href="#overview">项目概览</a> ·
<a href="#architecture">实现思路</a> ·
<a href="#quick-start">快速开始</a> ·
<a href="#api">接口速览</a> ·
<a href="#structure">目录结构</a> ·
<a href="#roadmap">近期计划</a>

</div>

---

<a id="overview"></a>

## 项目概览

GoalPilot 将模糊的目标整理为可理解、可确认的分阶段计划。AI 负责分析与生成，后端负责**身份认证、权限校验、业务状态、输出校验和持久化**。

**目标输入 → 目标分析 → 信息澄清 → 计划草稿 → 用户确认 → 执行与调整**

以上是产品的整体方向。当前已实现目标规划和正式计划查询，独立任务模块正在建设，尚未完成整个执行与调整闭环。

### 当前能力

| 能力 | 当前实现 | 状态 |
| :--- | :--- | :---: |
| 账户与认证 | 注册、登录、JWT 签发与校验、当前用户查询 | 已实现 |
| 目标管理 | 创建、详情、分页查询、状态筛选、部分字段修改 | 已实现 |
| 目标分析 | 结构化分析、信息澄清、分析快照与回答持久化 | 已实现 |
| 计划生命周期 | 草稿生成、批准、拒绝、正式版本与阶段任务查询 | 已实现 |
| 计划任务状态 | 待开始、进行中、已完成、已跳过 | 已实现 |
| 目标计划助手 | 在选定 Goal 后，通过 Tool Calling 查询正式计划 | 已实现 |
| 独立任务与清单 | 新表定义、`Task` 实体及状态、优先级枚举 | 建设中 |

> **当前开发重点：计划定义与执行任务分离。**
>
> 现有执行状态仍保存在 `plan_tasks`。新 `tasks` 模块尚未接入 approve、状态更新和查询链路，不能将新表与实体的存在理解为功能已经完成。

<a id="architecture"></a>

## 实现思路

### AI 参与业务，业务规则留在后端

- **模型接入**：Spring AI `ChatClient` 通过 OpenAI 兼容接口调用 DeepSeek。
- **结构化输出**：目标分析和计划生成映射为业务 Java DTO，校验通过后再保存。
- **可信上下文**：生成计划时根据 `goalId` 读取服务端最新分析，而不是信任客户端回传的分析结果。
- **用户确认**：计划先保存为 `DRAFT`，批准后分配正式版本号，Plan 和 Goal 进入 `ACTIVE`；拒绝后 Plan 进入 `REJECTED`。
- **数据隔离**：用户身份来自认证信息，业务查询和修改校验资源所有权。

### Tool Calling：从问题到真实数据

```text
用户询问当前 Goal 的计划
    ↓
GoalAssistantController → GoalAssistantService
    ↓
ChatClient / 模型请求调用工具
    ↓
Spring AI 执行 GoalPlanTools.getCurrentPlan
    ↓
PlanQueryService → Mapper → MySQL
    ↓
工具结果返回模型 → 自然语言回答
```

`userId` 来自认证信息，`goalId` 来自接口路径。后端先校验目标所有权，再通过 `ToolContext` 传递两者；工具复用已有查询服务，模型不直接访问数据库。

**当前边界：** 助手只读，不提供对话记忆或自然语言写操作。按优先级查询目标的 `GoalQueryTools` 与对应 Service 已有代码，但尚未注册到当前助手。

### 计划与任务的数据职责

| 数据表 | 职责 | 当前情况 |
| :--- | :--- | :--- |
| `plans` / `plan_stages` | 计划版本、阶段安排及顺序 | 已接入业务 |
| `plan_tasks` | 计划版本中的任务定义、完成标准及排序 | 目前仍保存执行状态，待迁出 |
| `tasks` | 实际执行任务：状态、优先级、截止时间、完成时间 | 已有表定义和实体，待接入业务 |
| `task_lists` | 用户自己的任务清单，不等同于计划阶段 | 已有表定义，待开发 |

目标设计中，Task 必须属于用户，但可以不属于清单、Goal 或 Plan。批准计划时才创建对应执行任务；临时琐事则可以单独创建。**这部分是正在落地的设计，不是当前已完成的行为。**

### 技术栈

| 领域 | 技术 |
| :--- | :--- |
| 后端框架 | Java 17 · Spring Boot 4.1.1 |
| AI 集成 | Spring AI 2.0.0 · DeepSeek · Structured Output · Tool Calling |
| 认证与权限 | Spring Security · OAuth2 Resource Server · JWT |
| 数据访问 | MyBatis-Plus 3.5.16 · MySQL |
| 请求校验与健康检查 | Jakarta Validation · Spring Boot Actuator |

依赖版本以 [backend/pom.xml](backend/pom.xml) 为准。

<a id="quick-start"></a>

## 快速开始

### 1. 准备数据库

本地需要 **JDK 17、Maven 和 MySQL**。先创建 `goalpilot` 数据库，并准备能够访问该库的账号。

当前 `spring.sql.init.mode=always`，后端启动时会执行 [schema.sql](backend/src/main/resources/schema.sql)。

> **初始化不等于迁移。**
>
> `CREATE TABLE IF NOT EXISTS` 只创建缺失的表，不会更新已有表的字段或约束，也不会清空数据。已有数据库的结构调整需要单独执行 SQL。

### 2. 配置环境变量

变量清单见 [.env.example](.env.example)。终端启动前，先设置：

```bash
export DEEPSEEK_API_KEY="your-api-key"
export DB_URL="jdbc:mysql://localhost:3306/goalpilot?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai"
export DB_USERNAME="your-db-user"
export DB_PASSWORD="your-password"
export JWT_SECRET_BASE64="your-base64-encoded-secret"
```

- **JWT 密钥**：必须是 Base64 编码，解码后不少于 32 字节。
- **VS Code 调试**：当前 `.vscode/launch.json` 使用 `envFile` 读取根目录 `.env`；其中的代理参数需与本机环境匹配。
- **终端启动**：Maven 不会因为项目存在 `.env` 就自动加载它，需要向启动终端提供环境变量。
- **WSL 开发**：MySQL 位于 Windows 时，`DB_URL` 应填写实际可达的数据库地址。

**请勿提交真实 API Key、数据库密码或 JWT 密钥。**

### 3. 启动后端

```bash
cd backend
mvn spring-boot:run
```

默认服务地址：`http://localhost:8080`

健康检查：`GET /actuator/health`

### 4. 使用业务接口

先注册并登录，再通过以下请求头访问业务接口：

```http
Authorization: Bearer <access-token>
```

<details>
<summary><strong>展开示例：注册、登录、创建目标与生成草稿</strong></summary>

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

示例中的 `<access-token>` 和 `<goal-id>` 需要替换为实际值。分析结果需要澄清时，先提交澄清回答，达到 `READY_TO_PLAN` 后才能生成草稿。

</details>

<details>
<summary><strong>可选：启动已有前端</strong></summary>

在另一终端中运行：

```bash
cd frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`，开发服务器将 `/api` 请求代理到默认的 `http://localhost:8080` 后端服务。前端说明见 [frontend/README.md](frontend/README.md)。

</details>

<a id="api"></a>

## 接口速览

默认地址：`http://localhost:8080`。除注册、登录和健康检查外，下列接口均需要 Bearer Token。

| 模块 | 方法 | 路径 | 用途 |
| :--- | :---: | :--- | :--- |
| 认证 | `POST` | `/api/auth/register` | 注册账号 |
| 认证 | `POST` | `/api/auth/login` | 登录并获取 Token |
| 认证 | `GET` | `/api/auth/me` | 当前用户 |
| 目标 | `POST` | `/api/goals` | 创建目标 |
| 目标 | `GET` | `/api/goals` | 分页查询，支持状态筛选 |
| 目标 | `GET` | `/api/goals/{goalId}` | 目标详情 |
| 目标 | `PATCH` | `/api/goals/{goalId}` | 修改目标信息 |
| 分析 | `POST` | `/api/goals/{goalId}/analyze` | 分析目标 |
| 分析 | `POST` | `/api/goals/{goalId}/clarifications` | 提交澄清回答 |
| 计划 | `POST` | `/api/plans/generate` | 生成并保存草稿 |
| 计划 | `POST` | `/api/plans/{planId}/approve` | 批准为正式计划 |
| 计划 | `POST` | `/api/plans/{planId}/reject` | 拒绝草稿 |
| 计划 | `GET` | `/api/goals/{goalId}/active-plan` | 读取当前正式计划 |
| 计划任务 | `PATCH` | `/api/tasks/{taskId}/status` | 更新现有计划任务状态 |
| 助手 | `POST` | `/api/goals/{goalId}/assistant` | 自然语言查询当前计划 |

**使用约定**

- 目标列表支持 `page`、`size` 和可选的 `status`。
- 目标修改支持 `goalText`、`priority`、`deadline`；修改原文要求 Goal 为 `DRAFT`，当前不能用 `null` 清空字段。
- 计划任务状态支持 `TODO`、`IN_PROGRESS`、`DONE`、`SKIPPED`，修改时所属 Plan 和 Goal 均须为 `ACTIVE`。
- 助手请求为 `{"message":"我目前的计划是什么？"}`，响应为 `{"reply":"..."}`。

> **任务 ID 注意事项**
>
> 当前 `PATCH /api/tasks/{taskId}/status` 中的 `taskId` 指向 **`plan_tasks.id`**，不是新表 `tasks.id`。接口尚未切换到独立 Task 模块。

<a id="structure"></a>

## 目录结构

```text
GoalPilot/
├── backend/
│   ├── src/main/java/com/qijx/goalpilot/
│   │   ├── auth/       注册登录、JWT 与当前用户解析
│   │   ├── user/       用户资料与数据库访问
│   │   ├── goal/       目标管理、分析澄清与 AI 助手
│   │   ├── plan/       计划生成、生命周期、查询与现有任务状态
│   │   ├── task/       独立任务实体与枚举，业务链路建设中
│   │   └── config/     MyBatis-Plus 等后端配置
│   └── src/main/resources/
│       ├── application.yml
│       └── schema.sql
├── frontend/           已有客户端
├── docs/               项目设计文档
└── .env.example        环境变量示例
```

<a id="roadmap"></a>

## 近期计划

当前优先完成 **Task 执行模型**，再继续拓展清单管理与 Agent 能力。

- [x] 注册登录与用户数据隔离
- [x] 目标分析、澄清与计划草稿持久化
- [x] 计划批准、拒绝及正式计划查询
- [x] 基于 Tool Calling 的只读计划助手
- [x] 独立任务表定义、Task 实体及状态和优先级枚举
- [ ] 补齐 Task Mapper 和 `tasks.plan_task_id` 唯一约束
- [ ] 在批准计划的事务内创建执行任务
- [ ] 将计划进度查询、任务状态更新切换到 `tasks`
- [ ] 移除旧代码及 `plan_tasks.status`
- [ ] 实现独立任务与任务清单 CRUD

当前仓库的建表脚本尚缺 `UNIQUE (plan_task_id)`；实际数据库若已手动添加，也应同步脚本，保证重新初始化时结构一致。

---

<div align="center">
  <sub>GoalPilot · Java 后端工程 × Agent 应用实践</sub>
</div>
