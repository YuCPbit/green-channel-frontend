# 高校绿色通道系统前端

本仓库只存放 Vue 3 + Vite 前端。后端位于独立仓库
[`green-channel-backend`](https://github.com/YuCPbit/green-channel-backend)。前端只访问 `/api`，
开发环境由 Vite 转发到后端 `gateway-service` 的 8080 端口，不直接连接 8081—8085 的业务服务。

## 本地启动

```bash
npm install
npm run dev
```

默认访问 `http://localhost:5173`，开发服务器会将 `/api` 代理到 `http://localhost:8080`。

生产构建：

```bash
npm run build
```

跨域允许来源由后端网关环境变量 `APP_CORS_ALLOWED_ORIGINS` 统一配置，多个来源使用英文逗号分隔。
