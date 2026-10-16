/* ============================================================================
   实验四 · 文章数据源（项目展示之外的第二块「可管理内容」）
   ----------------------------------------------------------------------------
   为什么单独抽一个文件？
     和实验二的 data/content.js 同一个理由：文章 Store 需要一个「初始数据集」，
     把它和 Store 逻辑分开，改文案时只动这一个文件。

   字段说明：
     id           唯一编号（后台新增时会校验唯一性）
     title        标题
     cover        封面 emoji（离线也能显示，不依赖图片资源）
     accent       主色，用于卡片顶部色块与标签配色
     category     分类，列表页的筛选下拉自动去重生成
     tags         标签数组
     status       已发布 / 草稿 —— 列表页默认只展示「已发布」
     featured     是否置顶推荐
     author       作者
     summary      一句话摘要（列表卡片显示）
     content      正文；用极简的类 Markdown 语法书写，由详情页解析渲染：
                     '## 小标题'   → 三级标题
                     '- 列表项'    → 无序列表
                     '```' 围栏     → 代码块
                     空行           → 段落分隔
     publishedAt  发布日期
     updatedAt    最近更新
     views        阅读量（详情页每次打开 +1，用来演示 Store 的 action）
     readMinutes  预计阅读时长（分钟）
   ========================================================================== */

export const articleData = [
  {
    id: 'a1',
    title: '为什么需要 Pinia：一次跨组件共享数据的复盘',
    cover: '🍍',
    accent: '#4f46e5',
    category: '状态管理',
    tags: ['课程实验', 'Pinia', '心得'],
    status: '已发布',
    featured: true,
    author: '殷康竣',
    summary:
      '从实验二的 props/emit 到实验三的「手写响应式 store」，再到实验四正式引入 Pinia，梳理状态共享方案的演进路线。',
    content: `## 一、问题的起点
实验二里，个人信息由 App.vue 持有，再通过 props 一层层往下传；子组件要改数据，就 emit 一个事件请父组件代劳。
组件少的时候这套机制很清晰，但它有两个硬伤：
- 数据要从顶层传到底层时，中间每一层都得「当搬运工」，props 越写越多
- 数据的所有权卡在父组件上，兄弟组件之间想共享一件事，得先绕到共同父级

## 二、实验三的做法及其局限
实验三把页面共享数据抽成了 stores/useAppStore.js —— 一个用 reactive() 手写的模块级单例。
它已经解决了「跨路由共享」的问题，但代价是所有能力都得自己实现：

\`\`\`
// 手写 store 需要自己负责：响应式、state 修改入口、派生值缓存、持久化、调试
const state = reactive({ ... })
const isDark = computed(() => state.theme === 'dark')
function pushLog(msg) { ... }
function restore() { /* 手动从 localStorage 读回来 */ }
\`\`\`

## 三、Pinia 补齐了什么
Pinia 把上面这些「样板代码」标准化了，它带来四个直接收益：
- state / getters / actions 概念与组件里的 data / computed / methods 一一对应，学习成本低
- 有专门的 DevTools 面板，能看每个 Store 的 state、时间线、甚至手动改值
- 插件机制：像持久化这种横切关注点可以写成插件，一次注册、全站生效
- 完整的 TypeScript 类型推导（本项目用 JS，但结构是照 TS 习惯组织的）

## 四、本项目最终的划分
按「数据的生命周期」而不是「页面」来切分，得到四个 Store：

\`\`\`
useUserStore    登录态 + 个人资料     —— 需要跨路由、且在守卫里被读取
useProjectStore 项目列表 + 收藏       —— 被 5 个组件共享
useArticleStore 文章列表 + 草稿状态   —— 实验四新增内容
useUiStore      主题 + 活动日志       —— 与业务无关的界面偏好
\`\`\`

划分依据很简单：**谁的生命周期更长、谁被更多人读，谁就该进 Store**；
只影响某一个页面的临时状态（搜索词、展开状态）继续留在组件里。`,
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    views: 128,
    readMinutes: 6
  },
  {
    id: 'a2',
    title: 'storeToRefs 详解：解构 Store 为什么会丢响应式',
    cover: '🔗',
    accent: '#0ea5e9',
    category: '状态管理',
    tags: ['Pinia', 'storeToRefs', '响应式'],
    status: '已发布',
    featured: true,
    author: '殷康竣',
    summary:
      '直接解构 Store 会丢掉响应式，原因是解构取的是「值」而不是「引用」。storeToRefs 用 toRef 把每个属性重新包装成 ref。',
    content: `## 一、现象
下面这段代码在页面上永远是初始值，点了按钮也不更新：

\`\`\`
const store = useProjectStore()
const { projects } = store        // ✗ 响应式丢了
\`\`\`

## 二、原因
Store 本身是一个 reactive 对象，访问 store.projects 这个「属性访问」动作才是响应式的。
解构赋值的本质是「取出当前的值再赋给一个新变量」，新变量是个普通数组，
它和 Store 之间已经没有任何链路了。

## 三、正确写法
\`\`\`
import { storeToRefs } from 'pinia'
const store = useProjectStore()
const { projects, favoriteIds } = storeToRefs(store)  // ✓ 得到两个 ref
\`\`\`

storeToRefs 对 state 和 getters 逐个调用 toRef，返回一批 ref；
在 \`<template>\` 里会自动解包，在 \`<script>\` 里要写 \`projects.value\`。

## 四、两个容易踩的坑
- **方法不要用 storeToRefs 解**：actions 是绑定了 this 的函数，
  解构出来会丢掉 this 指向；正确做法是 store.addProject(...) 直接调用。
- **getter 返回函数时**：\`const { getProject } = storeToRefs(store)\` 拿到的是
  一个 ref 包的函数，仍然要写成 \`getProject.value(id)\`，
  这种情况直接用 \`store.getProject(id)\` 反而更清楚。

## 五、本项目的用法约定
统一采用「两段式」：
\`\`\`
const store = useProjectStore()               // 方法都从 store 调
const { projects, total } = storeToRefs(store) // 数据都从 refs 取
\`\`\`
这样一眼就能看出「哪些是数据、哪些是操作」，比混在一起可读得多。`,
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    views: 96,
    readMinutes: 5
  },
  {
    id: 'a3',
    title: '让 Pinia 自己持久化：写一个 localStorage 插件',
    cover: '💾',
    accent: '#10b981',
    category: '工程化',
    tags: ['Pinia', 'localStorage', '插件'],
    status: '已发布',
    featured: false,
    author: '殷康竣',
    summary:
      'Pinia 只负责内存状态，刷新即重置。用插件 + $subscribe 把「回填」和「落盘」两件事一次做完。',
    content: `## 一、手动持久化的问题
最直接的办法是在每个 action 末尾写一行 save()，再在 Store 创建时 restore()。
问题是：**每个 Store 都要重复一遍**，而且很容易漏写。

## 二、插件要做的两件事
Pinia 插件是一个普通函数，接收 \`{ store, options }\`，在 Store 创建时执行一次。

\`\`\`
export function persistPlugin({ store, options }) {
  const config = options.persist
  if (!config) return

  // ① 回填：把磁盘里上次的数据打进 state
  const saved = loadState(config.key)
  if (saved) store.$patch(saved)

  // ② 落盘：订阅 state 变化
  store.$subscribe((_m, state) => saveState(config.key, state), { detached: true })
}
\`\`\`

## 三、两个细节
- \`$patch(saved)\` 比逐个赋值好：它会做一次合并更新，只触发一次订阅回调。
- \`{ detached: true }\` 很关键。默认的 \$subscribe 会绑定到「当前活跃组件实例」，
  组件卸载时订阅就被注销了；持久化属于 Store 的生命周期，必须 detach。

## 四、别把什么都存下来
本项目只持久化「用户改过的数据」：
\`\`\`
persist: { key: 'project', paths: ['projects', 'favoriteIds'] }
\`\`\`
- 活动日志不存：它是过程信息，刷新后重新记更干净
- 登录失败提示不存：属于临时状态
- 演示账号不存：它是常量

## 五、验证方法
打开 DevTools → Application → Local Storage，能看到 \`exp4:user\`、
\`exp4:project\`、\`exp4:article\` 三个 key，值就是对应的 state 快照。
清掉某个 key 再刷新，该 Store 就回到初始数据，其余两个不受影响 ——
这正好证明了「持久化是按 Store 独立配置的」。`,
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    views: 74,
    readMinutes: 5
  },
  {
    id: 'a4',
    title: '路由守卫里怎么安全地拿到 Store 实例',
    cover: '🛡️',
    accent: '#8b5cf6',
    category: 'Vue Router',
    tags: ['路由守卫', 'Pinia', '权限'],
    status: '已发布',
    featured: false,
    author: '殷康竣',
    summary:
      '在 beforeEach 里可以访问 Store，但调用位置有讲究：必须在守卫函数内部调用，不能在模块顶层。',
    content: `## 一、常见的错误写法
\`\`\`
import { useUserStore } from '../stores/useUserStore.js'

const userStore = useUserStore()   // ✗ 模块顶层：此时 Pinia 还没装到 app 上

router.beforeEach(() => {
  if (!userStore.isAuthed) return { name: 'login' }
})
\`\`\`
报错通常是 "getActivePinia() was called but there was no active Pinia"。
原因：模块只会被求值一次，而那时 \`app.use(pinia)\` 还没执行。

## 二、正确写法
\`\`\`
router.beforeEach((to) => {
  const userStore = useUserStore()   // ✓ 每次守卫执行时才取实例
  if (to.meta.requiresAuth && !userStore.isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
\`\`\`
每次导航都调用一次看起来「浪费」，实际上 useUserStore() 内部就是
「从当前 Pinia 取已有实例，没有则创建」，开销可以忽略。

## 三、守卫的返回值语义
| 返回值 | 效果 |
| --- | --- |
| \`true\` / \`undefined\` | 放行 |
| \`false\` | 中断本次导航，停在原地 |
| 一个路由地址 | 中断本次导航，改为跳转到该地址（会重新走一遍守卫） |

## 四、为什么要把 redirect 带在 query 上
直接跳到 \`/login\` 会丢掉「用户本来想去哪」这个信息。
带上 \`?redirect=/articles/manage\`，登录成功后就能把他送回原处，
体验上比「登录完统一回首页」自然得多。

## 五、双保险
守卫能拦住导航，但拦不住「已经渲染出来的组件」。
所以后台页面自己在 onMounted 里还会再检查一次登录态，
发现未登录就 replace 回登录页 —— 这种「路由层 + 组件层」的双重校验，
在真实项目里也是常见做法。`,
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    views: 61,
    readMinutes: 4
  },
  {
    id: 'a5',
    title: '把筛选、排序、分页交给 getters 还是组件？',
    cover: '🧮',
    accent: '#f59e0b',
    category: '设计取舍',
    tags: ['getters', 'computed', '设计'],
    status: '已发布',
    featured: false,
    author: '殷康竣',
    summary:
      '筛选条件属于「页面本地状态」，筛选结果属于「派生数据」。前者留在组件，后者可以放 Store，也可以放组件 —— 判断标准是什么？',
    content: `## 一、先分清两类东西
以文章列表页为例：

| 名称 | 性质 | 放到哪 |
| --- | --- | --- |
| keyword / category / sortBy | 页面自己的交互状态，离开页面就该销毁 | 组件 ref |
| 文章总数、已发布数、分类列表 | 由 Store 数据派生，多页共用 | Store getters |
| 过滤后的列表 | 依赖上面的关键词，只在列表页有意义 | 组件 computed |

## 二、判断标准
一句话：**getter 只依赖 Store 自己的 state 时，才适合放 Store。**
「按关键词过滤」依赖的是组件的 keyword，不是 Store 的 state，
放进 Store 就得把 keyword 也搬进去 —— 那就等于把页面状态污染到全局了。

## 三、本项目的实际做法
\`\`\`
// useArticleStore 里：只做「与页面无关」的统计
publishedCount: (s) => s.articles.filter(a => a.status === '已发布').length,
categories:     (s) => [...new Set(s.articles.map(a => a.category))],

// ArticleListView 里：把页面条件与 Store 数据组合起来
const visibleArticles = computed(() => { /* 用 keyword + category + sortBy 过滤 */ })
\`\`\`

## 四、附带一个性能提示
不要在模板里直接写 \`store.articles.filter(...)\`。模板每次重渲染都会重新执行，
而 computed 会缓存 —— 列表稍大就能看出差别。`,
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    views: 43,
    readMinutes: 4
  },
  {
    id: 'a6',
    title: '草稿：用 Pinia 的 $subscribe 做操作埋点',
    cover: '🧪',
    accent: '#64748b',
    category: '状态管理',
    tags: ['Pinia', '草稿'],
    status: '草稿',
    featured: false,
    author: '殷康竣',
    summary: '记录每次 state 变更的 Store、字段与时间，输出成一份可回放的操作轨迹。这条还是草稿。',
    content: `## 想法
\$subscribe 能拿到 mutation 的 type、storeId 与 payload，
理论上可以拼出一条完整的操作轨迹，用来做「用户行为回放」。

## 待验证
- payload 里只有变更的字段，还是整个 state？
- flush 时机的三个选项（pre / post / sync）分别有什么影响？
- 高频变更（比如拖拽进度条）会不会产生大量日志？

## 结论
还没写完，先放在草稿箱里 —— 顺便演示一下「草稿状态」在列表页默认不显示。`,
    publishedAt: '',
    updatedAt: '2026-10-13',
    views: 0,
    readMinutes: 2
  }
]

/* 文章状态选项：与项目状态分开维护，避免语义混淆 */
export const ARTICLE_STATUS = {
  PUBLISHED: '已发布',
  DRAFT: '草稿'
}

export const ARTICLE_STATUS_OPTIONS = [ARTICLE_STATUS.PUBLISHED, ARTICLE_STATUS.DRAFT]

/* 状态 → BaseTag 的 tone */
export function getArticleStatusTone(status) {
  return status === ARTICLE_STATUS.PUBLISHED ? 'ok' : 'muted'
}
