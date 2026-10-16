/* ============================================================================
   实验二 · 集中数据源（实验三扩展路由数据，实验四扩展文章数据）
   ----------------------------------------------------------------------------
   为什么要单独抽一个 data 文件？
     组件拆分之后，App.vue / ProfileView / ProjectListView 都需要同一批数据。
     把「数据」和「视图」彻底分开，组件只负责「怎么展示」，
     改内容时只动这一个文件，不用在多个组件里来回找。

   ★ 实验四的变化：
     这些静态数据变成 Pinia Store 的「初始值」——
     Store 负责共享与持久化，本文件继续承担「数据从哪来」这一件事。
     文章相关数据另见 src/data/articles.js。
   ========================================================================== */

/* ------------------------- 站点信息（顶部 / 底部公共元素） ------------------------- */
export const siteInfo = {
  name: '殷康竣',
  enName: 'Yin Kangjun',
  title: '个人主页 & 项目展示',
  logoText: 'YKJ',
  tagline: 'Vue 3 + Pinia + Element Plus · 实验四',
  footerNote:
    '实验四 · 状态管理与 UI 组件库应用 —— Pinia（state / getters / actions）+ storeToRefs + localStorage 持久化 + 路由守卫 + Element Plus 组件库 + GitHub Pages 自动部署',
  year: new Date().getFullYear(),
  techStack: ['Vue 3', 'Vite', '组合式 API', 'Vue Router 4', 'Pinia 3', 'Element Plus', 'localStorage', 'GitHub Actions']
}

/* ------------------------- 顶部导航项（props 传给 TheHeader） -------------------------
   ★ 实验三的变化：导航项不再是「视图 key」而是「路由名」。
     实验二：{ key: 'profile' } + @click emit navigate + App.vue 改 activeView
     实验三：{ name: 'home' }    + <RouterLink :to="{ name }">，谁是当前页由路由说了算

   字段说明：
     name    路由名（对应 src/router/index.js 里的 name），RouterLink 用它生成地址
     label   显示文字
     icon    显示图标
     group   'main' 普通导航 / 'private' 需要权限的入口（视觉上单独区分）
   -------------------------------------------------------------------------------------- */
export const navItems = [
  { name: 'home', label: '个人主页', icon: '🧑‍💻', group: 'main' },
  { name: 'projects', label: '项目展示', icon: '📁', group: 'main' },
  /* ★ 实验四新增：文章列表是「公开浏览页」，任何人都能看 */
  { name: 'articles', label: '文章列表', icon: '📝', group: 'main' },
  { name: 'about', label: '关于本站', icon: '📄', group: 'main' },
  /* 内容修改入口：访客点它会先被路由守卫送到登录页，
     所以样式上和普通浏览入口区分开（见 TheHeader 的 .nav__item.is-private）。 */
  { name: 'articles-manage', label: '文章管理', icon: '✍️', group: 'private' },
  { name: 'admin', label: '后台管理', icon: '⚙️', group: 'private' }
]

/* ------------------------------- ① 个人信息 ------------------------------- */
export const profileData = {
  avatar: '', // 留空时使用内置兜底头像（见 ProfileCard.vue）
  name: '殷康竣',
  enName: 'Yin Kangjun',
  studentId: '249980641',
  major: '计算机科学与技术',
  className: '24计科2班',
  direction: 'Web 前端开发',
  city: '江苏 · 南京',
  // ↓ 邮箱与电话是占位内容，请替换成你自己的
  email: 'yinkangjun@example.com',
  phone: '138 0000 0000',
  bio: '我是 Vue 初学者，喜欢前端开发，正在学习 Vue 3。实验一用选项式 API 完成了单页个人信息页面；实验二把它迁移到 Vue 工程，改用组合式 API，把页面拆成多个单文件组件，并通过 props / emit / v-model / 插槽打通父子组件通信；实验三引入 Vue Router，把「一个页面靠 v-show 切换」升级成「多个真实 URL 的路由页面」，并加了动态路由、嵌套路由、编程式导航与后台管理守卫；实验四引入 Pinia 做状态管理，把跨组件共享的数据拆成用户 / 项目 / 文章 / 界面四个 Store，用 getters 承载派生数据、用 actions 收口全部修改，并配合 localStorage 插件实现刷新不丢状态、配合路由守卫实现后台访问控制。',
  interestTags: ['前端开发', 'Vue 3', '组件化', 'Pinia', 'MySQL']
}

/* ------------------------------- ② 技能列表 ------------------------------- */
export const skillData = [
  { id: 1, name: 'HTML', category: '前端基础', level: 85, desc: '语义化标签、表单与页面结构' },
  { id: 2, name: 'CSS', category: '前端基础', level: 80, desc: 'Flex / Grid 布局与响应式' },
  { id: 3, name: 'JavaScript', category: '前端基础', level: 75, desc: 'ES6+ 语法、DOM 操作与数组方法' },
  { id: 4, name: 'Vue 3', category: '前端框架', level: 72, desc: '组合式 API、组件通信、插槽' },
  { id: 5, name: 'Vite 工程化', category: '前端框架', level: 58, desc: '项目搭建、开发服务器与打包构建' },
  { id: 6, name: 'Git 版本控制', category: '工具效率', level: 60, desc: '提交、分支与协作流程' },
  { id: 7, name: 'Python', category: '后端相关', level: 65, desc: '基础语法与脚本编写' },
  { id: 8, name: 'MySQL', category: '后端相关', level: 60, desc: '建表、增删改查与简单查询' }
]

/* ------------------------------- ③ 社交链接 ------------------------------- */
export const socialData = [
  { id: 'gh', icon: '🐙', name: 'GitHub', url: 'https://github.com' },
  { id: 'vue', icon: '💚', name: 'Vue 官网', url: 'https://cn.vuejs.org' },
  { id: 'mail', icon: '✉️', name: '发邮件', url: 'mailto:yinkangjun@example.com' }
]

/* ============================================================================
   ④ 项目展示页数据
   ----------------------------------------------------------------------------
   状态取值：已完成 / 进行中 / 计划中（ProjectCard 据此决定状态色）
   分类取值：用于筛选，ProjectToolbar 会自动从数据里去重生成，不需要手写
   ========================================================================== */
export const projectData = [
  {
    id: 'p9',
    name: 'Pinia 状态管理 + Element Plus 重构与上线（实验四）',
    cover: '🍍',
    accent: '#4f46e5',
    category: '前端开发',
    status: '已完成',
    progress: 100,
    summary:
      '引入 Pinia 管理共享状态、Element Plus 重构界面并新增时间线，最后用 GitHub Actions 自动部署到 GitHub Pages。',
    detail:
      '实验四成果。第一阶段引入 Pinia：按「数据生命周期」划分出 useUserStore（登录态 + 个人资料）、useProjectStore（项目 + 收藏）、useArticleStore（文章 + 发布状态）、useUiStore（主题 + 日志）四个 Store，用 getters 承载全部派生数据、用 actions 收口每一处 state 修改，组件侧统一用 storeToRefs 解构保持响应式，并写了一个基于 $subscribe 的 localStorage 插件让刷新不丢状态；新增文章列表 / 文章详情 / 文章管理三个页面。第二阶段引入 Element Plus 全局注册，用 el-container 系布局组件重构整体结构、el-menu 做导航、el-table 与 el-row/el-col 做列表、el-form 与 el-dialog 做新增编辑、el-timeline 在个人信息页新增成长时间线，累计使用二十余种组件。最后配置 vite base 与 Hash 路由，用 GitHub Actions 自动构建发布到 GitHub Pages。',
    tech: ['Vue 3', 'Pinia', 'Vue Router 4', 'Element Plus', 'localStorage', 'GitHub Actions'],
    tags: ['课程实验', '状态管理', '组件库', '自动部署'],
    repo: 'https://github.com',
    demo: '',
    startedAt: '2026-10-10',
    updatedAt: '2026-10-16',
    highlights: [
      '四个 Store 按数据生命周期划分，state / getters / actions 三件套齐备',
      'storeToRefs 解构保持响应式，actions 不解构',
      'localStorage 持久化插件：$patch 回填 + $subscribe 落盘',
      '用户 Store 与路由守卫配合实现后台访问控制',
      'Element Plus 二十余种组件：布局 / 菜单 / 时间线 / 列表 / 表单 / 对话框 / 反馈',
      'GitHub Actions 自动构建部署，push 即上线',
      '文章与项目两套增删改查，共用表单校验与提示模式'
    ]
  },
  {
    id: 'p0',
    name: '路由化个人主页（实验三）',
    cover: '🧭',
    accent: '#6366f1',
    category: '前端开发',
    status: '进行中',
    progress: 92,
    summary: '引入 Vue Router，把单页 v-show 切换改造成多页面路由，并加上守卫控制后台入口。',
    detail:
      '实验三成果。配置了基础路由（首页 / 项目 / 关于）、动态路由（/projects/:id）、嵌套路由（项目列表与详情作为项目模块的子路由）、重定向（/ → /home）与 404 通配符路由；顶部导航改用命名路由 + RouterLink，并区分 router-link-active 与 router-link-exact-active 两种高亮；详情页用 useRoute() 取参数、用 useRouter() 完成 push / replace / go(-1) 三种编程式导航；最后用 meta + beforeEach 实现浏览器标题更新和后台管理的登录守卫。',
    tech: ['Vue 3', 'Vue Router 4', 'Vite'],
    tags: ['课程实验', '路由配置', '导航守卫'],
    repo: 'https://github.com',
    demo: '',
    startedAt: '2026-09-24',
    updatedAt: '2026-10-09',
    highlights: [
      '基础 / 动态 / 嵌套 / 通配符 四类路由齐备',
      '命名路由 + router-link-active 导航高亮',
      'useRoute() 取参 + useRouter() 三种编程式导航',
      'meta 元信息 + beforeEach 标题更新与权限守卫'
    ]
  },
  {
    id: 'p1',
    name: '个人信息主页（实验一）',
    cover: '🧑‍💻',
    accent: '#6366f1',
    category: '前端开发',
    status: '已完成',
    progress: 100,
    summary: '单文件 HTML + CDN 引入 Vue 3，用选项式 API 完成的信息展示页面。',
    detail:
      '实验一成果。一个 HTML 文件里用 CDN 引入 Vue 3，通过 data / computed / watch / mounted 展示了个人信息、技能列表与社交链接，并做了关键词搜索与详情展开收起。',
    tech: ['HTML', 'CSS', 'JavaScript', 'Vue 3'],
    tags: ['课程实验', '选项式 API'],
    repo: 'https://github.com',
    demo: '',
    startedAt: '2026-09-08',
    updatedAt: '2026-09-14',
    highlights: ['v-for + :key 渲染列表', 'computed 筛选 + watch 监听', 'mounted 输出运行日志']
  },
  {
    id: 'p2',
    name: '组件化个人主页与项目展示（实验二）',
    cover: '🧩',
    accent: '#4f46e5',
    category: '前端开发',
    status: '进行中',
    progress: 78,
    summary: '把实验一迁入 Vue 工程，改用组合式 API，并拆分为多个单文件组件。',
    detail:
      '实验二成果。页面拆成 顶部 / 主体 / 底部 三段结构，主体内容由 ProfileView 与 ShowcaseView 两个页面组件组成；用 defineProps 向下传数据、defineEmits 向上报事件、defineModel 完成搜索词与编辑值的双向绑定，并用默认插槽 / 具名插槽 / 作用域插槽定制卡片内容。',
    tech: ['Vue 3', 'Vite', 'Composition API'],
    tags: ['课程实验', '组件化', '插槽'],
    repo: 'https://github.com',
    demo: '',
    startedAt: '2026-09-15',
    updatedAt: '2026-09-23',
    highlights: [
      'defineProps / defineEmits / defineModel 全部覆盖',
      '默认插槽 + 具名插槽 + 作用域插槽',
      '状态归属划分：共享状态提升到 App.vue'
    ]
  },
  {
    id: 'p3',
    name: '校园二手交易平台',
    cover: '🛒',
    accent: '#0ea5e9',
    category: '全栈项目',
    status: '进行中',
    progress: 62,
    summary: '面向校内学生的闲置物品发布与交易平台，含商品列表、发布与下单流程。',
    detail:
      '前端使用 Vue 3 + Vue Router 组织页面，后端用 Node.js + Express 提供接口，MySQL 存储用户、商品与订单数据。目前已完成商品列表与详情页，正在做发布表单与图片上传。',
    tech: ['Vue 3', 'Vue Router', 'Node.js', 'MySQL'],
    tags: ['全栈', '团队协作'],
    repo: 'https://github.com',
    demo: '',
    startedAt: '2026-08-20',
    updatedAt: '2026-09-21',
    highlights: ['商品列表分页与筛选', '登录态与权限控制', '图片上传与压缩']
  },
  {
    id: 'p4',
    name: '学生成绩管理系统',
    cover: '📊',
    accent: '#10b981',
    category: '后端开发',
    status: '已完成',
    progress: 100,
    summary: '课程设计：成绩录入、查询与统计，按班级 / 课程多维度分析。',
    detail:
      '使用 Python + Flask 编写接口，MySQL 设计学生、课程、成绩三张主表，实现了成绩录入、按班级与课程查询、平均分与及格率统计，并导出了 Excel 报表。',
    tech: ['Python', 'Flask', 'MySQL'],
    tags: ['课程设计', '数据库'],
    repo: 'https://github.com',
    demo: '',
    startedAt: '2026-05-06',
    updatedAt: '2026-06-18',
    highlights: ['三表关联查询', '及格率 / 平均分统计', 'Excel 报表导出']
  },
  {
    id: 'p5',
    name: '图书借阅管理系统',
    cover: '📚',
    accent: '#8b5cf6',
    category: '后端开发',
    status: '已完成',
    progress: 95,
    summary: '数据库课程实验：图书、读者、借阅记录的管理与超期提醒。',
    detail:
      '以 MySQL 为核心，设计了图书、读者、借阅三张表与触发器，实现了借书、还书、超期天数计算与提醒列表；用存储过程封装了常用统计。',
    tech: ['MySQL', 'SQL', 'Java'],
    tags: ['数据库实验', 'SQL'],
    repo: '',
    demo: '',
    startedAt: '2026-04-10',
    updatedAt: '2026-05-02',
    highlights: ['触发器维护借阅状态', '超期天数自动计算', '存储过程做统计']
  },
  {
    id: 'p6',
    name: '天气查询小工具',
    cover: '🌤️',
    accent: '#f59e0b',
    category: '前端开发',
    status: '已完成',
    progress: 100,
    summary: '输入城市名调用公开接口查询实时天气，支持未来三天预报与城市收藏。',
    detail:
      '用原生 JavaScript 的 fetch 调用公开天气接口，做了输入防抖、加载状态与错误提示；城市列表用 localStorage 持久化，刷新后仍保留。',
    tech: ['HTML', 'CSS', 'JavaScript'],
    tags: ['小工具', '接口调用'],
    repo: 'https://github.com',
    demo: '',
    startedAt: '2026-03-12',
    updatedAt: '2026-03-20',
    highlights: ['fetch 调用公开接口', '输入防抖与错误兜底', 'localStorage 持久化']
  },
  {
    id: 'p7',
    name: '学习待办清单 TodoList',
    cover: '✅',
    accent: '#22d3ee',
    category: '前端开发',
    status: '进行中',
    progress: 80,
    summary: '支持添加、完成、删除与筛选的待办清单，正在改造为 Vue 组件版本。',
    detail:
      '最初用原生 JavaScript 实现（增删改查 + localStorage 持久化），目前正在用 Vue 3 组合式 API 重写，把清单、条目、编辑表单拆成独立组件。',
    tech: ['Vue 3', 'JavaScript', 'CSS'],
    tags: ['Vue 改造中', '练习项目'],
    repo: 'https://github.com',
    demo: '',
    startedAt: '2026-07-02',
    updatedAt: '2026-09-10',
    highlights: ['增删改查完整流程', '本地持久化', '正在迁移为组件化写法']
  },
  {
    id: 'p8',
    name: '校园数据可视化大屏',
    cover: '📈',
    accent: '#ef4444',
    category: '数据可视化',
    status: '计划中',
    progress: 20,
    summary: '把图书馆、食堂、考勤等校园数据汇总成一块可视化大屏。',
    detail:
      '计划用 ECharts 做图表，数据用 Python 脚本清洗后以 JSON 输出；大屏按「总览 — 分区 — 明细」三层组织，目前完成了需求梳理与技术选型。',
    tech: ['ECharts', 'Vue 3', 'Python'],
    tags: ['规划中', '数据可视化'],
    repo: '',
    demo: '',
    startedAt: '2026-09-20',
    updatedAt: '2026-09-22',
    highlights: ['三层信息架构', '图表选型与配色方案', '数据清洗脚本设计']
  }
]

/* ------------------------- 排序下拉选项（ProjectToolbar 使用） ------------------------- */
export const sortOptions = [
  { value: 'default', label: '默认顺序' },
  { value: 'progress', label: '按进度' },
  { value: 'updatedAt', label: '按更新时间' },
  { value: 'name', label: '按名称' }
]

/* ------------------------- 状态 → 标签配色 的映射（多处共用） ------------------------- */
const STATUS_TONE = {
  已完成: 'ok',
  进行中: 'warn',
  计划中: 'muted'
}

/* --------------------- 项目状态选项（后台下拉框的唯一来源） --------------------- */
export const STATUS_OPTIONS = ['已完成', '进行中', '计划中']

/**
 * 把项目状态文字映射成 BaseTag 的 tone 值。
 * 放在数据层作为唯一来源，避免 ProjectCard / ProjectDetailDialog / ProjectListView
 * 各自维护一份一模一样的映射表。
 */
export function getStatusTone(status) {
  return STATUS_TONE[status] || 'brand'
}


/* ============================================================================
   ⑤ 个人成长时间线（实验四第二次新增 · 由 el-timeline 渲染）
   ----------------------------------------------------------------------------
   为什么把时间线数据放在这里而不是直接写死在组件里？
     和项目、技能数据同一个理由：ProfileView 只负责「怎么展示」，
     内容改动只动这一个文件。以后要加一条经历，不用进 .vue 里翻模板。

   字段说明：
     date     显示在时间线节点左侧的时间文字（el-timeline-item 的 timestamp）
     title    事件标题
     desc     事件说明
     type     el-timeline-item 的节点配色：primary / success / warning / danger / info
     icon     节点内的小图标（emoji，离线可用）
     tags     该阶段的标签，用 el-tag 渲染
     highlight 是否强调（强调的节点会加粗标题）
   ========================================================================== */
export const timelineData = [
  {
    date: '2026-09-08',
    title: '实验一 · 单页个人信息页面',
    desc:
      '用一个 HTML 文件 + CDN 引入 Vue 3，用选项式 API（data / computed / watch / mounted）做出个人信息展示页，完成了 v-for 列表渲染、关键词搜索与详情展开收起。',
    type: 'info',
    icon: '1️⃣',
    tags: ['选项式 API', 'CDN 引入'],
    highlight: false
  },
  {
    date: '2026-09-15',
    title: '实验二 · 组件化与工程化',
    desc:
      '把页面迁进 Vite 工程，改用组合式 API，拆成顶部 / 主体 / 底部三段结构；打通了 defineProps 向下传数据、defineEmits 向上报事件、defineModel 双向绑定，以及默认 / 具名 / 作用域三类插槽。',
    type: 'info',
    icon: '2️⃣',
    tags: ['组合式 API', '组件通信', '插槽'],
    highlight: false
  },
  {
    date: '2026-09-24',
    title: '实验三 · 路由配置与页面导航',
    desc:
      '引入 Vue Router 4，把「一个页面靠 v-show 切换」升级成多个真实 URL 的路由页面；补齐基础路由、动态路由、嵌套路由、重定向与 404 通配符，并第一次用 meta + beforeEach 实现后台管理守卫。',
    type: 'primary',
    icon: '3️⃣',
    tags: ['Vue Router', '动态路由', '路由守卫'],
    highlight: false
  },
  {
    date: '2026-10-10',
    title: '实验四（上）· 引入 Pinia 做状态管理',
    desc:
      '按「数据生命周期」把共享状态拆成用户 / 项目 / 文章 / 界面四个 Store，用 getters 承载派生数据、actions 收口修改；实现了基于 $subscribe 的 localStorage 持久化插件，并新增文章列表 / 详情 / 管理三个页面。',
    type: 'primary',
    icon: '🍍',
    tags: ['Pinia', 'storeToRefs', 'localStorage'],
    highlight: false
  },
  {
    date: '2026-10-16',
    title: '实验四（下）· Element Plus 重构与上线',
    desc:
      '引入 Element Plus 并全局注册，用布局容器重构整体结构、el-menu 接管导航、el-table 与表单对话框接管增删改查，并在个人信息页新增这条时间线；最后配置 vite base 与 Hash 路由，用 GitHub Actions 把项目自动发布到 GitHub Pages。',
    type: 'success',
    icon: '🎨',
    tags: ['Element Plus', '时间线', 'GitHub Pages'],
    highlight: true
  },
  {
    date: '进行中',
    title: '下一步计划',
    desc:
      '继续完善作品集内容，尝试把 Vue 项目与后端接口打通（Node.js + MySQL），并补充移动端响应式布局与暗色主题的细节。',
    type: 'warning',
    icon: '🚀',
    tags: ['规划中', '全栈'],
    highlight: false
  }
]

/* ------------------------- 时间线节点的展示统计 ------------------------- */
export const timelineStats = {
  total: timelineData.length,
  done: timelineData.filter((t) => t.type === 'success' || t.type === 'primary').length
}
