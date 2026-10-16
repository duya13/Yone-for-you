# 个人主页 & 项目展示 —— Vue 3 课程实验

Web 前端框架程序设计课程的实验工程，从「单页 HTML」一路迭代到「组件化 → 路由化 → 状态管理 → UI 组件库 → 自动部署」。

> 线上预览（部署完成后即为此地址）：**https://duya13.github.io/Yone-for-you/**

## 技术栈

| 分类 | 内容 |
| --- | --- |
| 框架 | Vue 3（组合式 API + `<script setup>`） |
| 构建 | Vite |
| 路由 | Vue Router 4（基础 / 动态 / 嵌套 / 通配符路由 + 全局守卫） |
| 状态 | Pinia 3（state / getters / actions + localStorage 持久化插件） |
| UI 库 | Element Plus（全局注册，中文语言包，跟随暗色主题） |
| 部署 | GitHub Actions → GitHub Pages |

## 实验迭代

| 实验 | 主题 | 关键产出 |
| --- | --- | --- |
| 实验一 | 单页个人信息页面 | 一个 HTML + CDN 引入 Vue 3，选项式 API |
| 实验二 | 组件化与工程化 | 迁入 Vite 工程，改用组合式 API，拆组件，props / emit / v-model / 插槽 |
| 实验三 | 路由配置与页面导航 | Vue Router 4：动态路由、嵌套路由、编程式导航、404、守卫 |
| 实验四（上） | Pinia 状态管理 | 四个 Store、storeToRefs、localStorage 持久化、用户 Store + 路由守卫、文章模块增删改查 |
| 实验四（下） | Element Plus + 部署 | 布局/菜单/时间线/列表/表单/对话框等 40+ 组件重构界面，GitHub Actions 自动部署 |

## 目录结构（核心部分）

```
src/
├── main.js                 入口：注册 Element Plus（含中文包与图标）、Pinia、Router
├── App.vue                 根组件：el-container 三段式布局 + 路由出口
├── assets/theme.css        主题变量 + Element Plus 配色对接（--el-* 覆盖）
├── router/index.js         路由表 + beforeEach 守卫（读 useUserStore）
├── stores/
│   ├── persist.js          localStorage 工具 + Pinia 持久化插件
│   ├── useUserStore.js     登录态 + 个人资料
│   ├── useProjectStore.js  项目 + 收藏
│   ├── useArticleStore.js  文章 + 发布状态 + 阅读量
│   └── useUiStore.js       主题 + 活动日志
├── data/                   静态数据源（站点信息 / 项目 / 文章 / 成长时间线）
├── views/                  路由页面（首页 / 项目 / 文章 / 后台 / 登录 / 404）
└── components/             通用与业务组件（common / layout / profile / showcase / article）
```

## 本地开发

```sh
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建（产物在 dist/，同时读取 .env.production 切到 Hash 路由）
npm run preview  # 本地预览构建产物
```

演示账号：**admin / 123456**（登录页上也有说明，点「填入演示账号」即可）。

## 部署说明

仓库根目录的 `.github/workflows/deploy.yml` 会在每次 push 到 `main` 时自动构建并发布到 GitHub Pages。

两个关键前提：

1. **`vite.config.js` 里的 `base`**：生产构建使用相对基准 `'./'`，
   这样无论仓库叫什么名字、Pages 挂在什么子路径下，静态资源都能正确加载。
2. **`.env.production` 里的 `VITE_ROUTER_MODE=hash`**：GitHub Pages 是纯静态托管，
   没有服务端做「任意路径回退到 index.html」，History 模式刷新子路由会 404，
   所以生产环境统一切到 Hash 模式（URL 形如 `/#/articles/a1`）。

首次部署还需要在 GitHub 仓库的 **Settings → Pages → Build and deployment → Source**
里把来源改成 **GitHub Actions**。
