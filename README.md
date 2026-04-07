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

## 功能梳理（按状态）

### 已开发

| 模块 | 功能 | 路由 |
|------|------|------|
| 基础页面 | 首页 | `/` |
| 基础页面 | 分类详情 | `/category/:id` |
| 基础页面 | 笔记列表（开发杂记） | `/notes/dev` |
| 基础页面 | 笔记列表（软件推荐） | `/notes/soft` |
| AI 工具 | AI 对话（对接 `POST /api/chat`、`GET /api/health`） | `/tools/ai-chat` |
| 图片工具 | 图片格式转换 | `/tools/img-format` |
| 图片工具 | 图片生成 | `/tools/img-generate` |
| 数字工具 | 进制转换 | `/tools/radix-convert` |
| 图片工具 | 图片 Base64 编解码 | `/tools/img-base64` |
| 图片工具 | 图片压缩 | `/tools/img-compress` |
| 图片工具 | 合并长图 | `/tools/img-merge-long` |
| 图片工具 | 九宫格切图 | `/tools/img-grid9` |
| 文本工具 | 大小写转换 | `/tools/text-case-convert` |
| 图片工具 | 像素画转换 | `/tools/img-pixelate` |
| 文档工具 | 身份证生成 | `/tools/id-card-generate` |
| 文档工具 | 银行卡生成 | `/tools/bank-card-generate` |
| 文档工具 | VIN 码生成 | `/tools/vin-generate` |
| 文档工具 | 车牌号生成 | `/tools/plate-generate` |
| 办公工具 | PDF 合并 | `/tools/pdf-merge` |
| 办公工具 | PDF 拆分 | `/tools/pdf-split` |

### 待开发 / 建设中

| 模块 | 功能 | 路由 |
|------|------|------|
| 基础页面 | 最新发布（占位页） | `/latest` |
| 基础页面 | 热度排行（占位页） | `/trending` |

> 维护规则：后续功能开发完成后，从“待开发 / 建设中”移动到“已开发”列表末尾，按完成时间顺序追加。

AI 对话页使用独立布局（主区域固定高度、消息区滚动、底部输入栏），详见路由 `meta.layout === 'chat'` 与 `App.vue` 中的样式。

## 许可证

若需对外开源，请在本仓库补充所选许可证文件（如 `LICENSE`）。
