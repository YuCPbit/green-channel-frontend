# 高校绿色通道系统前端

基于 Vue 3、Vite 和 Element Plus 的高校绿色通道系统前端。本仓库只保存前端；后端位于
[`green-channel-backend`](https://github.com/YuCPbit/green-channel-backend)，两端保持独立构建，
通过 8080 统一网关联调。

当前支持学生、辅导员、学院管理员、学校资助中心和系统管理员五类角色，覆盖礼包、困难补助、
资助方案、申诉、问卷、辅导员事务、勤工助学、报表消息和系统管理页面。

## 本地启动

先按后端仓库的
[`系统操作手册`](https://github.com/YuCPbit/green-channel-backend/blob/main/docs/01-%E7%8E%B0%E8%A1%8C%E8%A7%84%E8%8C%83/%E7%B3%BB%E7%BB%9F%E6%93%8D%E4%BD%9C%E6%89%8B%E5%86%8C.md)
启动网关和六个业务服务；第一次获取或拉取新版本时，先按
[`项目更新与复现指南`](https://github.com/YuCPbit/green-channel-backend/blob/main/docs/01-%E7%8E%B0%E8%A1%8C%E8%A7%84%E8%8C%83/%E9%A1%B9%E7%9B%AE%E6%9B%B4%E6%96%B0%E4%B8%8E%E5%A4%8D%E7%8E%B0%E6%8C%87%E5%8D%97.md)
完成两个仓库和数据库的同步，再在本仓库执行：

```bash
npm ci
npm run dev
```

默认访问 `http://localhost:5173`，开发服务器把 `/api` 代理到 `http://localhost:8080`。
前端不应直连 8081—8086，也不应自行发送用户 ID、角色或学院身份头。

## 构建验收

```bash
npm run build
```

GitHub 的“前端持续集成”会在 PR 和 `main` 上自动执行 `npm ci` 与生产构建。
最终交付基线已完成五角色 87 个业务页面的应用内浏览器逐页检查。详细范围见后端仓库的
[`前端逐页验收报告`](https://github.com/YuCPbit/green-channel-backend/blob/main/docs/04-%E5%AE%9E%E6%96%BD%E4%B8%8E%E9%AA%8C%E6%94%B6/%E5%89%8D%E7%AB%AF%E9%80%90%E9%A1%B5%E9%AA%8C%E6%94%B6%E6%8A%A5%E5%91%8A-2026-07-25.md)。

业务页面按菜单异步加载，Element Plus 组件按需打包。当前生产构建的最大 JavaScript 块
低于 200 KB，不再产生 Vite 的 500 KB 大包警告。

本地初始化账号只用于开发。共享、演示或部署前必须重置密码，并清理浏览器中旧的登录令牌。
