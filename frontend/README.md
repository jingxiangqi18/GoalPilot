# GoalPilot Frontend

GoalPilot 的 Vue 3 + Vite 前端，覆盖账户认证、目标持久化与“目标分析 → 信息澄清 → 计划生成”完整流程。

当前接入接口：

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/goals
GET  /api/goals?page=1&size=9
GET  /api/goals/{goalId}
POST /api/goals/analyze
POST /api/goals/clarify
POST /api/plans/generate
```

登录成功后，前端会在本地保存 JWT，并为后续受保护请求自动添加 Bearer Token；
Token 失效或接口返回 `401` 时会清理会话并返回登录页。

用户提交新目标时，前端会先保存目标草稿，再进行 AI 分析。“我的目标”支持分页查看、
状态筛选、详情抽屉以及继续分析已有目标。当前后端还未提供编辑、删除和状态更新接口，
因此前端只展示这些预留字段，不模拟尚未存在的写入能力。

澄清流程会保留原始目标并累计提交问答历史；当分析状态变为 `READY` 后，
页面会开放计划生成，并展示阶段、时间范围、任务说明和完成标准。

## 启动

先按项目根目录 README 配置 MySQL、JWT 和 DeepSeek 并启动 `backend`（默认端口 `8080`），再执行：

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。开发服务器会把 `/api` 请求代理到
`http://localhost:8080`，因此本地开发不需要额外配置 CORS。

可通过环境变量覆盖后端地址：

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

## 构建

```bash
npm run build
npm run preview
```
