# toolSystem

在线工具箱前端项目：基于 **Vue 3 + TypeScript + Vite** 的单页应用，提供首页工具展示、分类浏览、笔记列表以及对接后端的 **AI 对话**（通义千问 OpenAI 兼容接口）等功能。

## 技术栈

| 类别 | 选用 |
|------|------|
| 框架 | Vue 3（Composition API + `<script setup>`） |
| 语言 | TypeScript |
| 构建 | Vite 8 |
| UI | Element Plus、@element-plus/icons-vue |
| 路由 | Vue Router 4 |

## 仓库结构

```
toolSystem/
├── README.md
└── toolbox/                 # 前端工程根目录
    ├── package.json
    ├── vite.config.ts
    ├── .env                 # 本地环境变量（勿提交敏感信息到公开仓库时可改用 .env.local）
    ├── index.html
    └── src/
        ├── App.vue          # 布局：侧栏 + 顶栏 + 主内容
        ├── main.ts
        ├── api/             # 接口封装（如 chat）
        ├── components/      # 公共组件（侧栏、顶栏、工具网格等）
        ├── data/            # 静态数据与配置
        ├── router/          # 路由定义
        ├── utils/
        └── views/           # 页面（按领域分子目录，页面入口多为 index.vue）
            ├── home/
            ├── category/
            ├── notes/
            ├── placeholder/
            └── catAi/       # AI 对话等
```

## 环境要求

- Node.js（建议 LTS 版本，如 20.x）
- npm（或 pnpm / yarn）

## 本地开发

```bash
cd toolbox
npm install
npm run dev
```

默认在开发服务器启动后按终端提示访问（常见为 `http://localhost:5173`）。

开发环境下，Vite 将 **`/api` 代理到后端**（具体目标见 `toolbox/vite.config.ts` 中的 `server.proxy`）。若前端直接请求完整后端地址，可在环境变量中配置 `VITE_API_BASE`（见下文）。

## 构建与预览

```bash
cd toolbox
npm run build    # vue-tsc 类型检查 + Vite 生产构建，输出 dist/
npm run preview  # 本地预览构建结果
```

## 环境变量

在 **`toolbox/.env`** 或 **`toolbox/.env.local`** 中配置（变量需以 `VITE_` 开头才会暴露给前端）：

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE` | 后端 API 根地址，**不要**带末尾斜杠。例如 `http://127.0.0.1:3030`。设置后，聊天与健康检查等请求会发往 `{VITE_API_BASE}/api/...`。未设置时则使用相对路径 `/api/...`，由开发代理或部署时的反向代理转发。 |

直连后端时，请确保后端已配置 **CORS** 允许你的前端来源；仅使用同源 `/api` 代理时可减少跨域配置负担。

## 主要页面与路由（节选）

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/category/:id` | 工具分类详情 |
| `/notes/dev`、`/notes/soft` | 笔记列表（开发杂记 / 软件推荐） |
| `/tools/ai-chat` | AI 对话（对接 `POST /api/chat`、`GET /api/health`） |
| `/latest`、`/trending` | 占位页（建设中） |

AI 对话页使用独立布局（主区域固定高度、消息区滚动、底部输入栏），详见路由 `meta.layout === 'chat'` 与 `App.vue` 中的样式。

## 许可证

若需对外开源，请在本仓库补充所选许可证文件（如 `LICENSE`）。
