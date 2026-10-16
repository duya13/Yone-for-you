/* ============================================================================
   实验四 · 路由配置（Vue Router + Pinia 守卫）
   ----------------------------------------------------------------------------
   本文件是「整个单页面应用的导航地图」，只做四件事：

     ① 创建 history（History / Hash 两种模式）
     ② 声明路由表 routes（基础路由 / 动态路由 / 嵌套路由 / 重定向 / 通配符 404）
     ③ 导出 router 实例，交给 main.js 注册：app.use(router)
     ④ 注册全局前置守卫 beforeEach（更新标题 + 后台管理访问控制）

   ── 与实验三的差别（只有「守卫读哪份数据」这一处）────────────────────────
     实验三：守卫里读 useAppStore().state.isAuthed（自己写的响应式 store）
     实验四：守卫里读 useUserStore().isAuthed（Pinia Store）
     路由表结构、meta 约定、返回值语义全部保持不变，改造是「换个数据源」而已。

   ── 路由配置项速查（对应指导书 3.1 表 2）────────────────────────────────
     path       定义 URL 路径，如 '/home'、'/projects/:id'
     name       路由名，编程式导航可以按名跳转，不用拼字符串
     component  该路径对应的页面组件（渲染进 <RouterView>）
     meta       路由元信息：title（浏览器标题）、requiresAuth（是否需要登录）
     redirect   重定向：/ → /home
     children   嵌套子路由，把子页面渲染到父组件的 <RouterView> 里
   ========================================================================== */

import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/useUserStore.js'
import { useUiStore } from '../stores/useUiStore.js'
import { siteInfo } from '../data/content.js'

/* ---------------------------------------------------------------------------
   页面组件（路由组件）
   ---------------------------------------------------------------------------
   约定（指导书 3.1「路由组件与普通组件」）：
     路由组件 → src/views      代表一个完整页面，由路由规则决定何时显示
     普通组件 → src/components  可复用的局部结构，由父组件决定何时显示
   --------------------------------------------------------------------------- */
import ProfileView from '../views/ProfileView.vue'
import ProjectsLayout from '../views/ProjectsLayout.vue'
import ProjectListView from '../views/ProjectListView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import NotFoundView from '../views/NotFoundView.vue'
/* ★ 实验四新增的三个文章页面 */
import ArticleListView from '../views/ArticleListView.vue'
import ArticleDetailView from '../views/ArticleDetailView.vue'
import ArticleManageView from '../views/ArticleManageView.vue'

/* ============================================================================
   ① 路由表
   ========================================================================== */
const routes = [
  /* ---------- 重定向：根路径 / 自动跳到 /home ---------- */
  {
    path: '/',
    name: 'root',
    redirect: { name: 'home' }
  },

  /* ---------- 基础路由 1：首页（个人主页） ---------- */
  {
    path: '/home',
    name: 'home',
    component: ProfileView,
    meta: { title: '个人主页', icon: '🧑‍💻' }
  },

  /* ---------- 嵌套路由：项目页 = 一个父级 + 两个子页面 ---------- */
  {
    path: '/projects',
    name: 'projects-module',
    component: ProjectsLayout,
    meta: { title: '项目展示', icon: '📁' },
    children: [
      {
        path: '',
        name: 'projects',
        component: ProjectListView,
        meta: { title: '项目列表', icon: '📋' }
      },
      {
        /* ★ 动态路由：:id 是动态片段，一条规则匹配所有 /projects/xxx */
        path: ':id',
        name: 'project-detail',
        component: ProjectDetailView,
        props: true,
        meta: { title: '项目详情', icon: '🔍' },
        beforeEnter: (to) => {
          // 这里只是演示「路由独享守卫」，因此不做拦截，永远放行
          console.log('[router][beforeEnter] 进入项目详情：', to.params.id)
          return true
        }
      }
    ]
  },

  /* ==========================================================================
     ★ 实验四新增：文章模块
     --------------------------------------------------------------------------
     三条规则用到三种不同性质的路由，正好把实验三学的知识再用一遍：
       /articles          基础路由（公开列表）
       /articles/manage   静态路径 + meta.requiresAuth（需登录的后台页面）
       /articles/:id      动态路由（详情页，props: true 把参数当 props 传）
     注意顺序：静态段 /manage 写在动态段 /:id 之前。
     vue-router 4 本身会按「静态优先」给路由打分，这里显式排前面是为了读起来更直观。
     ========================================================================== */
  {
    path: '/articles',
    name: 'articles',
    component: ArticleListView,
    meta: { title: '文章列表', icon: '📝' }
  },
  {
    path: '/articles/manage',
    name: 'articles-manage',
    component: ArticleManageView,
    /* ★ 与 /admin 完全一样的权限思路：路由表里打标记，守卫统一拦截 */
    meta: { title: '文章管理', icon: '✍️', requiresAuth: true }
  },
  {
    path: '/articles/:id',
    name: 'article-detail',
    component: ArticleDetailView,
    props: true,
    meta: { title: '文章详情', icon: '📖' }
  },

  /* ---------- 基础路由 2：关于页 ---------- */
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: { title: '关于本站', icon: '📄' }
  },

  /* ---------- 身份认证页（后台管理的入口） ---------- */
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '身份认证', icon: '🔒' },
    alias: '/auth'
  },

  /* ---------- 后台管理页：必须登录（meta 标记 + 全局守卫拦截） ---------- */
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { title: '后台管理', icon: '⚙️', requiresAuth: true }
  },

  /* ---------- ★ 404 通配符路由 ---------- */
  /* 必须放在路由表最后 —— 路由匹配是「从上到下、先匹配先生效」 */
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在', icon: '🚫' }
  }
]

/* ============================================================================
   ② history —— History / Hash 两种路由模式
   ========================================================================== */
const useHashMode = import.meta.env.VITE_ROUTER_MODE === 'hash'

/* 变量名不叫 history，避免和浏览器的 window.history 全局同名，读代码时更好区分 */
const routerHistory = useHashMode
  ? createWebHashHistory(import.meta.env.BASE_URL)
  : createWebHistory(import.meta.env.BASE_URL)

const router = createRouter({
  history: routerHistory,
  routes,

  /* ③ 滚动行为：切换路由时的滚动位置 */
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  }
})

/* ============================================================================
   ④ 全局前置守卫 beforeEach
   ----------------------------------------------------------------------------
   每次路由跳转「开始之前」执行。它不修改业务数据，只做三件事：
     1) 根据 meta.title 更新浏览器标题
     2) 记一条日志到 useUiStore（方便截图写实验报告）
     3) 检查 meta.requiresAuth，没登录就改写跳转目标到 /login

   ★ 为什么 useUserStore() / useUiStore() 要写在守卫函数「内部」？
     模块顶层只会在首次 import 时求值一次，那时 app.use(pinia) 还没执行，
     拿不到 Pinia 实例。写在守卫内部则是「每次导航时现取」——
     Pinia 内部就是「有实例就返回、没有才创建」，开销可以忽略。
     这正是指导书 3.1「路由守卫与 Store 的配合」强调的那一点。

   返回值约定：
     return true / undefined  → 放行
     return { name: 'login' } → 中断本次跳转，改为跳到 /login（会再走一遍守卫）
     return false             → 中断本次跳转，停在原地
   ========================================================================== */
router.beforeEach((to, from) => {
  const userStore = useUserStore()
  const uiStore = useUiStore()

  /* ---- 1) 浏览器标题跟随页面变化 ---- */
  const suffix = `${siteInfo.name} · 个人主页`
  document.title = to.meta.title ? `${to.meta.title} | ${suffix}` : suffix

  uiStore.pushLog(
    uiStore.stamp(
      `[守卫 beforeEach] ${from.fullPath || '(入口)'} → ${to.fullPath}｜标题「${to.meta.title || '—'}」`
    )
  )
  console.log('[router][beforeEach]', from.fullPath, '→', to.fullPath, to.meta)

  /* ---- 2) 后台管理 / 文章管理访问控制 ---- */
  if (to.meta.requiresAuth && !userStore.isAuthed) {
    uiStore.pushLog(uiStore.stamp('[守卫 beforeEach] 未登录，已拦截并跳转到登录页'))
    console.warn('[router][beforeEach] 未登录，拦截访问：', to.fullPath)

    /* 把原本想去的地址放在 query.redirect 里，登录成功后可以跳回去 */
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  /* ---- 3) 已登录还去登录页 → 直接送回后台，避免重复登录 ---- */
  if (to.name === 'login' && userStore.isAuthed) {
    uiStore.pushLog(uiStore.stamp('[守卫 beforeEach] 已登录，跳过登录页直接进入后台'))
    return { name: 'admin' }
  }

  return true
})

/* 后置钩子：跳转完成后记一条日志 */
router.afterEach((to) => {
  const uiStore = useUiStore()
  uiStore.pushLog(uiStore.stamp(`[守卫 afterEach] 已到达「${to.meta.title || to.path}」`))
})

export { routes, useHashMode }
export default router
