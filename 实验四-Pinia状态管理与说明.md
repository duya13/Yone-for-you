# 实验四（第一次）· 状态管理（Pinia）实现说明

> 对应指导书《04 实验四指导书》的实验内容与「4.1 基本要求（必做）」第 1–7 条。
> 工程目录：`D:\vue\vue-project`（在实验三的路由化个人主页上继续改造）
> 仓库：`https://github.com/duya13/Yone-for-you`
>
> 👉 **第二次实验（Element Plus 重构 + GitHub Pages 部署）见同目录
> `实验四（第二次）-ElementPlus重构与部署说明.md`。**
> 本文档部分描述写于第二次改造之前，界面已换成 Element Plus，
> 但 Store 划分、持久化插件、守卫配合等核心逻辑完全未变。

---

## 一、本次做了什么

在实验三「路由化的个人主页」基础上**引入 Pinia 接管全站共享状态**，并新增文章模块：

| 改动 | 说明 |
| --- | --- |
| 安装注册 Pinia | `npm i pinia`，`main.js` 里 `createPinia()` → `app.use(pinia)` |
| 四个 Store | `user` / `project` / `article` / `ui`，均为 state + getters + actions 结构 |
| localStorage 持久化 | `stores/persist.js` 写了一个 Pinia 插件，Store 只要声明 `persist` 选项即可 |
| Store 与路由守卫配合 | 守卫里读 `useUserStore().isAuthed`，未登录拦截后台页 |
| 新增文章三页 | `/articles` 列表、`/articles/:id` 详情、`/articles/manage` 管理 |
| 项目增删改查 | 由 `useProjectStore` 的 actions 承载（原手写 store 迁移过来） |
| 迁移既有页面 | App.vue / TheHeader / ProfileView / ProjectListView / ProjectsLayout / ProjectDetailView / AdminView / NotFoundView / AboutView / router |

---

## 二、四个 Store 的划分依据

划分标准是**数据的生命周期与读取范围**，不是页面：

| Store | 文件 | state | 代表性 getters | 代表性 actions | 持久化 |
| --- | --- | --- | --- | --- | --- |
| `useUserStore` | `stores/useUserStore.js` | account / nickname / isAuthed / loginAt / loginCount / profile | `isGuest`、`displayName`、`authLabel` | `login`、`logout`、`saveProfile` | account, nickname, isAuthed, loginAt, loginCount, profile |
| `useProjectStore` | `stores/useProjectStore.js` | projects / favoriteIds / lastAction | `total`、`avgProgress`、`categories`、`getProject(id)` | `addProject`、`updateProject`、`removeProject`、`toggleFavorite` | projects, favoriteIds |
| `useArticleStore` | `stores/useArticleStore.js` | articles / lastAction | `publishedCount`、`draftCount`、`tagCloud`、`getArticle(id)` | `addArticle`、`updateArticle`、`removeArticle`、`togglePublish`、`incrementViews` | articles |
| `useUiStore` | `stores/useUiStore.js` | theme / logs | `isDark`、`themeLabel`、`logCount` | `toggleTheme`、`pushLog`、`clearLogs`、`stamp` | theme（logs 故意不持久化） |

**划分原则**：
- 谁的生命周期长、被多少人读，谁就进 Store（登录态被「守卫 + 导航栏 + 首页 + 后台」四处读）
- 只影响单个页面的临时状态（搜索词、展开状态、表单草稿）留在组件里
- 「与 Store 自身 state 无关」的过滤/排序留在组件的 computed 里；
  「只依赖 Store state」的统计/去重/按 id 查询放进 getters

---

## 三、7 条基本要求逐条对照

| 指导书 4.1 要求 | 落点 |
| --- | --- |
| 1. 安装并注册 Pinia，新增文章列表、文章管理等相关页面 | `main.js` + `views/ArticleListView.vue`、`views/ArticleDetailView.vue`、`views/ArticleManageView.vue` |
| 2. 分析项目结构，创建 Store，用 state/getters/actions 组织共享状态 | `src/stores/` 下四个 Store，见上表 |
| 3. 使用 storeToRefs 解构 Store 数据，保持响应式 | `TheHeader`、`ProfileView`、`ProjectListView`、`ProjectsLayout`、`ProjectDetailView`、`AdminView`、`ArticleListView`、`ArticleManager`、`ArticleManageView`、`LoginView`、`AboutView` —— 统一「数据 storeToRefs / 方法 store.xxx()」两段式 |
| 4. 跨组件跨页面共享 + localStorage 持久化 | `stores/persist.js` 插件（`$patch` 回填 + `$subscribe` 落盘），localStorage 前缀 `exp4:` |
| 5. 用户 Store + 路由守卫实现后台访问控制 | `router/index.js` 的 `beforeEach` 读 `useUserStore()`，`/admin` 与 `/articles/manage` 均打 `meta.requiresAuth` |
| 6. 文章 Store + 项目 Store 实现增删改查 | `AdminView` 项目管理 Tab / 文章管理 Tab，以及 `ArticleManageView` + `components/article/ArticleManager.vue` |
| 7. 用 Vue DevTools 观察 Store | 四个 Store 在 Pinia 面板中可见；`AboutView` 的「四个 Pinia Store」表里实时显示当前值 |

---

## 四、关键实现要点（写报告可直接引用）

### 1. 持久化插件（`stores/persist.js`）

```js
export function persistPlugin({ store, options }) {
  const config = options.persist
  if (!config) return
  const saved = loadState(config.key)          // ① 回填：Store 创建时把上次的数据打进 state
  if (saved) store.$patch(saved)
  store.$subscribe(                            // ② 落盘：state 一变就写 localStorage
    (_m, state) => saveState(config.key, JSON.parse(JSON.stringify(state))),
    { detached: true }
  )
}
```

- `$patch` 合并更新，只触发一次订阅
- `{ detached: true }` 必须加：默认 `$subscribe` 绑定「当前活跃组件实例」，组件卸载即失效
- 声明式用法：`persist: { key: 'project', paths: ['projects', 'favoriteIds'] }`
- 注意：**Pinia 插件要在 `app.use(pinia)` 之后才生效**，所以 `main.js` 里是先 `createPinia()` + `pinia.use()`，再 `app.use(pinia)`

### 2. Store 与路由守卫的配合（`router/index.js`）

```js
router.beforeEach((to) => {
  const userStore = useUserStore()   // ★ 必须写在守卫函数内部
  if (to.meta.requiresAuth && !userStore.isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```

写在模块顶层会报 `getActivePinia() was called but there was no active Pinia` —— 因为模块只求值一次，那时 `app.use(pinia)` 还没执行。

### 3. storeToRefs 的两段式写法

```js
const projectStore = useProjectStore()
const { projects, favoriteIds } = storeToRefs(projectStore) // 数据 → ref
// 脚本里访问要写 projects.value；模板里自动解包
projectStore.toggleFavorite(id)                              // 方法 → 直接从 store 调
```

坑：**actions 不能用 storeToRefs 解构**（会丢 this）；getter 返回函数时解构后仍要 `.value(id)`，这种直接用 `store.getProject(id)` 更清楚。

### 4. 函数式 getter

```js
getProject: (state) => (id) => state.projects.find((p) => p.id === String(id)) || null
```
注意它**不参与缓存**，所以适合「按 id 查询」这类本身很快的操作。

---

## 五、页面与路由一览（新增部分）

| path | name | 组件 | 权限 | 说明 |
| --- | --- | --- | --- | --- |
| `/articles` | `articles` | `ArticleListView` | 公开 | 只展示「已发布」，含关键词 / 分类 / 标签 / 排序 |
| `/articles/:id` | `article-detail` | `ArticleDetailView` | 公开 | 动态路由；打开一次 `incrementViews` 让阅读量 +1 |
| `/articles/manage` | `articles-manage` | `ArticleManageView` | **需登录** | 文章增删改查、发布切换、置顶、恢复默认数据 |

导航新增：顶部主导航「📝 文章列表」，登录后出现的私密入口「✍️ 文章管理」。

---

## 六、验证与截图建议（对应评价标准）

已在本地跑过三类验证，全部通过：

1. **构建**：`npm run build` → 108 modules transformed，无错误
2. **SSR 挂载**：用 Vite `ssrLoadModule` + `renderToString` 渲染 14 条路由
   - 全部 PASS，`console.error` 0 条、Vue warn 0 条
   - 确认 `/admin`、`/articles/manage` 未登录时被守卫改写到 `/login?redirect=…`
3. **Store 行为 + 持久化**：55 项断言全部 PASS
   - 登录成功/失败、项目增删改查、收藏、文章增删改查、发布切换、阅读量 +1、Tag 云排序
   - localStorage 写入 4 个 key（`exp4:user` / `exp4:project` / `exp4:article` / `exp4:ui`）
   - 模拟刷新后：登录态、资料、主题、业务数据均保留；日志按设计被清空

### 建议截图清单

| 截图 | 操作 |
| --- | --- |
| ① Pinia 面板 | F12 → Vue → Pinia，展开 4 个 Store，看到 state 树 |
| ② 跨页面共享 | 首页点「编辑信息」改城市 → 去 `/admin` 看资料 Tab 同步 |
| ③ 持久化 | 登录后刷新页面，仍是登录态；Application → Local Storage 看到 `exp4:*` |
| ④ 路由守卫 | 未登录直接访问 `/articles/manage` → 被送到登录页，地址栏带 `?redirect=` |
| ⑤ 登录后跳回 | 登录成功 → 自动回到 `/articles/manage` |
| ⑥ 文章 CRUD | 后台/管理页新增一篇文章 → 去 `/articles` 看到它 |
| ⑦ 详情阅读量 | 打开 `/articles/a1`，状态数字 +1，Pinia 时间线记录 `incrementViews` |
| ⑧ actions 调用时机 | DevTools 时间线里对比「点击收藏」与「路由跳转」分别触发了哪个 action |

---

## 七、遗留说明

- 实验三的手写 store `src/stores/useAppStore.js` 与旧登录页
  `src/views/LoginView.vue` 已归档为同目录下的 `*.exp3.bak`（本次改造中，
  它们的职责全部由 Pinia Store 接管）。若需查阅实验三的写法可打开备份文件。
- 演示账号：**admin / 123456**（已在登录页「演示账号」卡片中展示）。
- 后端、接口、鉴权均为前端模拟；真实项目应由服务端签发凭证。

*后续（第二次实验）待补充的要求收到后再继续实现。*
