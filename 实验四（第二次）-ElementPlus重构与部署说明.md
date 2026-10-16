# 实验四（第二次）· Element Plus 重构与 GitHub Pages 部署说明

> 对应指导书《04 实验四指导书（全）》的「第二次实验」与「4.1 基本要求（必做）」第 41–44 条、
> 「4.2 拓展要求（选做）」的部署要求。
> 工程目录：`D:\vue\vue-project`　仓库：`https://github.com/duya13/Yone-for-you`
> 第一次实验（Pinia 状态管理）见同目录 `实验四-Pinia状态管理与说明.md`。

---

## 一、本次做了什么

| 类别 | 内容 |
| --- | --- |
| UI 组件库 | 安装 Element Plus 2.14.7 + 图标库，`main.js` 全局注册（中文语言包） |
| 主题对接 | 在自己的 `theme.css` 里覆盖 `--el-*` 变量，把组件库主色接到本站品牌色；引入官方暗色变量，跟随站点主题切换 |
| 整体布局重构 | `App.vue` 换成 `el-container / el-header / el-main / el-footer` |
| 导航重构 | `TheHeader` 换成 `el-menu`（router 模式）+ `el-badge` + `el-switch` |
| 个人信息页 | 新增 **成长时间线**（`el-timeline`）+ `el-descriptions` + `el-avatar` + `el-statistic` |
| 列表 | 项目管理 / 文章管理换成 `el-table`；项目、文章卡片列表用 `el-row / el-col + el-statistic` |
| 表单与对话框 | 新增 / 编辑全部换成 `el-dialog + el-form + rules`，覆盖个人资料、项目、文章 |
| 反馈 | `ElMessage` 轻提示 + `ElMessageBox` 确认框，替代原生 alert / confirm |
| 部署 | `vite.config.js` 加 `base`、`.env.production` 切 Hash 路由、新增 `.github/workflows/deploy.yml` |

---

## 二、Element Plus 组件清单（共 40 种，含作用说明）

> 指导书第 43 条要求「总共使用不少于 10 种 Element Plus 组件，并说明其作用」。
> 下表按功能分组，把实际用到的组件、作用与使用位置一一列出。

### 1. 布局组件（Layout）

| 组件 | 作用 | 用在哪 |
| --- | --- | --- |
| `el-container` | 布局容器。子节点含 header/footer 时自动变垂直排列 | `App.vue` 最外层 |
| `el-header` | 顶部区域容器 | 包住 `TheHeader` |
| `el-main` | 主体区域容器，自动 `flex:1` 撑满剩余高度 | 包住 `<RouterView>` |
| `el-footer` | 底部区域容器 | 包住 `TheFooter` |
| `el-row` | 24 栅格的行容器，`gutter` 控制列间距 | 数据概览、表单两列排布 |
| `el-col` | 栅格列，`xs/sm/md/lg` 做响应式列数 | 统计卡片、表单项 |

### 2. 导航组件（Navigation）

| 组件 | 作用 | 用在哪 |
| --- | --- | --- |
| `el-menu` | 导航菜单，`mode="horizontal"` 横向；开 `router` 后点菜单项直接路由跳转 | `TheHeader` 主导航 |
| `el-menu-item` | 菜单项，`index` 作为唯一标识（这里直接放路由路径） | 首页 / 项目 / 文章 / 关于 |
| `el-tabs` | 标签页容器 | `AdminView` 三个管理页签 |
| `el-tab-pane` | 标签页面板，`#label` 插槽自定义标题 | 个人资料 / 项目管理 / 文章管理 |
| `el-divider` | 分隔线，`content-position` 支持中间带文字 | 个人简介、404 页 |

### 3. 数据展示组件（Data）

| 组件 | 作用 | 用在哪 |
| --- | --- | --- |
| `el-card` | 卡片容器，自带 header / body 分区与阴影 | 全站所有页面分区 |
| `el-timeline` | **时间线容器** | 个人信息页「我的成长时间线」 |
| `el-timeline-item` | 时间线节点：`timestamp` 时间、`type` 配色、`hollow` 空心、`size` 尺寸、`placement` 位置 | 实验一到实验四各阶段 + 规划 |
| `el-statistic` | 数字统计展示，`prefix/suffix` 插槽可放图标与单位 | 数据概览、文章概览、管理统计条 |
| `el-descriptions` | 描述列表，把 label-value 自动对齐成表格式排布 | 个人详细信息、演示账号、后台概览 |
| `el-descriptions-item` | 描述项，声明 `label` 与内容 | 同上 |
| `el-tag` | 标签，`type/effect/size/round` 控制配色与形状 | 状态、分类、技术栈、标签云 |
| `el-progress` | 进度条，`percentage` 数值、`stroke-width` 粗细、`status` 状态色 | 技能熟练度、项目完成度 |
| `el-avatar` | 头像，`shape` 支持圆/方，`@error` 可兜底 | 个人卡片 |
| `el-badge` | 角标，`value/max/hidden` | 顶部收藏数 |
| `el-table` | 数据表格，自带边框、斑马纹、吸顶表头、空数据提示 | 项目管理、文章管理 |
| `el-table-column` | 表格列，`#default` 作用域插槽自定义单元格 | 编号 / 标题 / 状态 / 操作列 |
| `el-empty` | 空状态，自带插画 + `description` + 默认插槽 | 技能筛选无结果、文章无匹配 |

### 4. 表单组件（Form）

| 组件 | 作用 | 用在哪 |
| --- | --- | --- |
| `el-form` | 表单容器，`:model` 绑数据、`:rules` 绑规则、`label-width` 统一标签宽 | 登录、个人资料、项目、文章 |
| `el-form-item` | 表单域，`prop` 关联校验字段并自动显示错误提示 | 所有表单项 |
| `el-input` | 输入框：`prefix-icon` 前置图标、`clearable` 一键清空、`show-password` 密码显隐、`type="textarea"` 多行 | 搜索、账号密码、简介、正文 |
| `el-input-number` | 数字输入，带步进按钮与 `min/max` 范围 | 项目完成度、文章阅读时长 |
| `el-select` | 下拉选择 | 分类筛选、排序、状态选择 |
| `el-option` | 下拉选项 | 同上 |
| `el-radio-group` | 单选按钮组 | 技能分类筛选、表格/卡片视图切换 |
| `el-radio-button` | 药丸式单选按钮 | 同上 |
| `el-switch` | 开关 | 主题亮/暗切换、文章置顶 |
| `el-color-picker` | 取色器 | 文章卡片主色 |

### 5. 反馈与其它（Feedback / Others）

| 组件 | 作用 | 用在哪 |
| --- | --- | --- |
| `el-dialog` | 对话框，自带遮罩、层级、Esc 关闭、`#footer` 插槽 | 新增/编辑项目、文章、个人资料 |
| `el-alert` | 提示条，`type` 区分信息/警告/成功，`show-icon` 带图标 | 权限说明、守卫拦截提示、404 小贴士 |
| `el-tooltip` | 文字提示，鼠标悬停显示 | 图标按钮、主题开关 |
| `el-link` | 文字链接，`type` 控制颜色 | 首页权限说明区的快捷入口 |
| `el-collapse-transition` | 折叠过渡动画容器 | 个人详细资料的展开/收起 |
| `el-result` | 结果页，内置状态插画 | 404 页面 |
| `ElMessage` | 轻提示（方法式调用） | 保存成功/失败、登录结果 |
| `ElMessageBox` | 确认对话框（返回 Promise） | 删除确认、恢复默认数据确认 |
| 图标（`@element-plus/icons-vue`） | 具名引入常用图标，按需注册避免全量打包 | 按钮、输入框、菜单 |

---

## 三、指导书条目逐条对照

| 要求 | 落点 |
| --- | --- |
| 41. 安装并引入 Element Plus，查阅文档了解属性/事件/插槽 | `main.js` 全局注册（含 `zhCn` 语言包与图标）；各组件按官方 API 使用 `:type`、`:effect`、`#default`、`#header`、`#footer`、`#prefix`、`#suffix`、`#label`、`#extra` 等插槽与 `validate()`、`@tab-change`、`@update:model-value` 等事件 |
| 42. 用布局组件重构个人主页整体结构 + 个人信息页新增时间线 | `App.vue` 用 `el-container` 系重构；`ProfileView` 新增「我的成长时间线」（`el-timeline`，6 个节点），数据在 `src/data/content.js` 的 `timelineData` |
| 43. 菜单做导航 / 列表展示项目与文章 / 表单+对话框做新增与编辑 / ≥10 种组件并说明作用 | `el-menu`（导航）、`el-table` 与 `el-row+el-col`（列表）、`el-form+el-dialog`（新增编辑）；组件清单见上一节，共 40 种 |
| 44. 整合 Router、Pinia、Element Plus | 三者在 `main.js` 依序注册（Element Plus → Pinia → Router，保证守卫读取 Store 时 Pinia 已就绪）；页面数据来自 Store，跳转来自 Router，呈现来自 Element Plus |
| 4.2 部署到 GitHub Pages | `vite.config.js` 的 `base` + `.env.production` 的 Hash 模式 + `.github/workflows/deploy.yml` |

---

## 四、主题对接：让组件库不像「外来的」

Element Plus 默认主色是 `#409EFF` 蓝色，直接引入会和本站靛蓝品牌色冲突。做法是在
`src/assets/theme.css` 末尾重新声明 `--el-*` 变量：

```css
:root,
.page {
  --el-color-primary: var(--brand);
  --el-color-primary-light-3: color-mix(in srgb, var(--brand) 70%, #fff);
  /* …light-5 / 7 / 8 / 9 / dark-2 同理 */
  --el-border-radius-base: 10px;
}
/* 暗色用 :root.dark（特异度 0,2,1）压过组件库自带的 html.dark（0,1,1） */
.page.dark,
:root.dark { /* 换成深色混合 */ }
```

两个要点：
1. **样式引入顺序**：`main.js` 里先 `element-plus` 再 `./assets/main.css`，否则同优先级下组件库的默认值会盖掉我们的覆盖。
2. **暗色特异度**：组件库的暗色变量挂在 `html.dark` 上，`.page.dark` 压不住，必须用 `:root.dark`。

站点顶部的 `el-switch` 切换主题时会同时更新 `document.documentElement` 的 `dark` 类，
所以本站变量与组件库变量会一起切换。

---

## 五、GitHub Pages 部署

### 已经配好的三处

| 文件 | 关键内容 | 为什么 |
| --- | --- | --- |
| `vite.config.js` | `base: isProd ? './' : '/'` | Pages 站点挂在 `/<仓库名>/` 子路径下，用相对基准就不必关心仓库叫什么，换仓库也不用改配置 |
| `.env.production` | `VITE_ROUTER_MODE=hash` | 静态托管没有「任意路径回退到 index.html」，History 模式刷新子路由会 404；Hash 模式（`/#/articles/a1`）刷新永远命中 `index.html` |
| `.github/workflows/deploy.yml` | push 到 `main` → `npm ci` → `npm run build` → 上传 `dist` → 发布 Pages | 自动化，不需要手动打包提交 |

### 还需要你手动做的两步

**第 1 步：推送代码**（本地仓库已经初始化并提交好了，只差推送）

> ⚠️ 这台电脑上没有独立安装 Git，PowerShell 里直接敲 `git` 会报
> 「无法将"git"项识别为 cmdlet…」。可用的 git 是 WorkBuddy 自带的 PortableGit，
> 它位于 `D:\新建文件夹 (2)\WorkBuddy\resources\vendor\PortableGit`。
> 只要把它临时加进当前会话的 PATH 就能用（关掉窗口即失效，不改系统设置）：

```powershell
# 1) 把 PortableGit 加进本次会话的 PATH
$env:Path = "D:\新建文件夹 (2)\WorkBuddy\resources\vendor\PortableGit\mingw64\bin;" + `
            "D:\新建文件夹 (2)\WorkBuddy\resources\vendor\PortableGit\cmd;" + $env:Path

# 2) 确认 git 可用
git --version

# 3) 推送（第一次会弹出 GitHub 授权窗口，登录账号 duya13 即可）
git -C D:\vue\vue-project push -u origin main
```

- 授权走的是 Git Credential Manager，登录成功后 token 会存进「Windows 凭据管理器」，
  以后再推就不用重复登录了。
- 用 VS Code 也可以：先让 VS Code 能识别 git（`Ctrl+,` 搜 `git.path`，
  填 `D:\新建文件夹 (2)\WorkBuddy\resources\vendor\PortableGit\mingw64\bin\git.exe`），
  再在「源代码管理」面板点「发布分支」。
- 如果想一劳永逸（以后任何终端都能直接用 `git`），把上面那两个目录写进「用户环境变量 Path」即可。
- **为什么这一步不能由 WorkBuddy 代劳**：本机的运行环境里带了一层本地代理
  （`http_proxy=http://127.0.0.1:55912`），GitHub 的网页能访问，但 git 协议端点会被代理拒绝
  （`curl 7 CONNECT tunnel failed, response 502`），绕开代理直连又会超时。
  所以推送必须在**你自己的终端**里执行 —— 那里没有这层代理。
- 另外，凭据助手已配好（`credential.helper=manager`），登录一次即可；
  我没有写入任何 token 到仓库或配置文件里。

> 本地提交（5 个）：
> `f00dbbe feat: 实验四 —— Pinia 状态管理 + Element Plus 重构 + GitHub Pages 自动部署`
> → `3c5bfd9 docs: 补充实验四（第二次）说明文档、README 重写、About 页新增组件清单`
> → `fb8abfc docs: 第一次实验文档补充第二次实验与仓库指引`
> → `90e9de6 docs: 补充 PortableGit 推送指引`
> → `446b36f docs: 提交邮箱更正为 GitHub 绑定邮箱`
>
> 远程已绑定：`origin → https://github.com/duya13/Yone-for-you.git`
> 提交身份：`duya13 <528949034@qq.com>`（与 GitHub 账号绑定邮箱一致，提交会关联到账号）

**第 2 步：在仓库里开启 Pages**

GitHub 仓库页面 → **Settings** → 左侧 **Pages** → **Build and deployment** →
**Source** 选择 **GitHub Actions**。

### 验证

推送后进入仓库的 **Actions** 页，能看到 `Deploy Vue Site to GitHub Pages` 工作流在跑；
出现绿色对勾即部署成功，随后访问：

**https://duya13.github.io/Yone-for-you/**

之后每次 `git push` 到 `main`，GitHub 都会自动重新构建并更新线上页面。

---

## 六、验证结果（本地，无需浏览器）

| 验证项 | 结果 |
| --- | --- |
| `npm run build` | ✅ 1673 modules transformed，无错误；产物 CSS 402 KB / JS 1.17 MB |
| 生产产物资源路径 | ✅ `dist/index.html` 引用 `./assets/…`（相对路径，适配任意仓库名的子路径） |
| 逐路由挂载渲染（Vite `ssrLoadModule` + `renderToString`，19 条用例） | ✅ 全部 PASS，`console.error` 0 条、真实 Vue 告警 0 条 |
| 其中：受保护页面守卫 | ✅ 未登录访问 `/admin`、`/articles/manage` 均被改写到 `/login?redirect=…` |
| 其中：Element Plus 生效 | ✅ 断言 `el-container / el-timeline / el-statistic / el-progress / el-select / el-form / el-input / el-table / el-result` 的类名确实出现在渲染结果里 |
| 其中：已登录后台 | ✅ `/admin`、`/admin?tab=articles`、`/articles/manage` 正常渲染出表单与表格 |

### 建议截图清单（写报告用）

| 截图 | 操作 |
| --- | --- |
| ① 首页整体 | `/home`，展示 el-container 三段式 + 卡片分区 |
| ② 成长时间线 | 首页「我的成长时间线」，展示 el-timeline 的节点配色与空心/实心差异 |
| ③ 数据概览 | 首页 el-statistic 一排数字 |
| ④ 顶部导航 | el-menu 选中态、收藏角标、主题开关（切一次暗色再截一张） |
| ⑤ 项目/文章列表 | `/projects`、`/articles` 的筛选与卡片网格 |
| ⑥ 表单校验 | `/admin` → 项目管理 → 点「新增项目」留空提交，截 el-form 的红色错误提示 |
| ⑦ 对话框 | 同一个新增/编辑对话框的完整样子 |
| ⑧ 删除确认 | 点删除弹出的 ElMessageBox |
| ⑨ 轻提示 | 保存成功后右上角 ElMessage |
| ⑩ 守卫拦截 | 退出登录后访问 `/articles/manage`，看地址栏 `?redirect=` |
| ⑪ 暗色主题 | 切到暗色后的首页（证明 Element Plus 跟着变色） |
| ⑫ 404 | 随便输个坏地址，看 el-result |
| ⑬ Actions | 仓库 Actions 页绿色对勾 |
| ⑭ 线上页面 | https://duya13.github.io/Yone-for-you/ |

---

## 七、说明与取舍

- **全局注册 vs 按需引入**：指导书 3.2 要求全局注册，本次照做，代价是首屏 JS 约 1.17 MB。
  生产项目可换成 `unplugin-vue-components` + `unplugin-auto-import` 按需引入（指导书 3.1 提到的另一种方式），
  配置改动集中在 `vite.config.js`，业务代码不用动。
- **图标按需**：`main.js` 里只把常用图标注册成全局组件（具名 import，便于 tree-shaking），
  没有用 `import * as icons` 把上千个图标全打进包。
- **保留下来的自研组件**：`BaseCard` / `BaseTag` / `LevelBar` / `ActivityLog` / `ProjectCard` /
  `ProjectGrid` / `ProjectToolbar` / `BackToTop` 等仍在使用。它们是实验二、三的成果，
  且部分承担「插槽 / 组件通信」的教学演示作用；详情页与关于页因此仍以自研卡片为主。
  这是有意的取舍：组件库用来提升规范性与开发效率，而不是把所有自研组件都删掉。
- **本地 git 身份**：仓库内与全局都设置为 `user.name=duya13` / `user.email=528949034@qq.com`
  （与 GitHub 账号绑定的邮箱一致，提交会正确关联到账号头像）。
  已有的 4 个提交在推送前已用 `git filter-branch --env-filter` 统一重写为这个邮箱，
  提交时间戳保持原样。若以后要换邮箱，只需
  `git config user.email "新邮箱"`，之后的提交就会用新身份。
