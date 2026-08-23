# GoalPilot Frontend

用于测试 GoalPilot 目标分析接口的 Vue 3 + Vite 前端。

## 启动

先启动 `backend`（默认端口 `8080`），再执行：

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

