<script setup>
/* ============================================================================
   AboutView —— 关于本站（/about）
   ----------------------------------------------------------------------------
   这一页的作用是把「本实验到底配了哪些路由、建了哪些 Store」讲清楚，
   方便对照指导书验收，同时也顺便演示：
     · 普通页面路由不需要任何额外配置，写个组件挂上去就行
     · 静态展示数据直接用数组写在组件里（不需要进 store）
     · ★ 实验四新增：同一页同时读四个 Store —— 说明 Store 之间互不耦合，
       谁需要谁 import，不需要「中央仓库」转发
   ========================================================================== */

import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import BaseCard from '../components/common/BaseCard.vue'
import BaseTag from '../components/common/BaseTag.vue'
import { useUserStore } from '../stores/useUserStore.js'
import { useProjectStore } from '../stores/useProjectStore.js'
import { useArticleStore } from '../stores/useArticleStore.js'
import { useUiStore } from '../stores/useUiStore.js'
import { siteInfo } from '../data/content.js'

const route = useRoute()

const userStore = useUserStore()
const projectStore = useProjectStore()
const articleStore = useArticleStore()
const uiStore = useUiStore()

/* 只读展示：用 storeToRefs 把「数据」解构出来（getters 同样支持） */
const { isAuthed, loginCount, displayName } = storeToRefs(userStore)
const { total: projectTotal, favoriteIds, avgProgress } = storeToRefs(projectStore)
const { total: articleTotal, publishedCount, draftCount, totalViews } = storeToRefs(articleStore)
const { theme, logCount } = storeToRefs(uiStore)

/**
 * Store 速查表：把四个 Store 的三件套与「当前实时值」放在一起，
 * 既是一份速查，也证明数据确实是响应式的（页面上的数字会跟着变化）。
 */
const storeTable = computed(() => [
  {
    name: 'useUserStore',
    file: 'stores/useUserStore.js',
    state: 'account / nickname / isAuthed / loginAt / loginCount / profile',
    getters: 'isGuest / displayName / authLabel / loginTimeText',
    actions: 'login / logout / saveProfile / resetProfile',
    persist: 'account · nickname · isAuthed · loginAt · loginCount · profile',
    live: `当前：${isAuthed.value ? `已登录（${displayName.value}）` : '未登录'} · 累计登录 ${loginCount.value} 次`
  },
  {
    name: 'useProjectStore',
    file: 'stores/useProjectStore.js',
    state: 'projects / favoriteIds / lastAction',
    getters: 'total / doneCount / avgProgress / categories / getProject(id)',
    actions: 'addProject / updateProject / removeProject / resetProjects / toggleFavorite',
    persist: 'projects · favoriteIds',
    live: `当前：项目 ${projectTotal.value} 个 · 收藏 ${favoriteIds.value.length} 个 · 平均完成度 ${avgProgress.value}%`
  },
  {
    name: 'useArticleStore',
    file: 'stores/useArticleStore.js',
    state: 'articles / lastAction',
    getters: 'total / publishedCount / draftCount / categories / tagCloud / getArticle(id)',
    actions: 'addArticle / updateArticle / removeArticle / togglePublish / incrementViews',
    persist: 'articles',
    live: `当前：文章 ${articleTotal.value} 篇（已发布 ${publishedCount.value} · 草稿 ${draftCount.value}）· 总阅读 ${totalViews.value}`
  },
  {
    name: 'useUiStore',
    file: 'stores/useUiStore.js',
    state: 'theme / logs',
    getters: 'isDark / themeLabel / logCount / latestLog',
    actions: 'toggleTheme / setTheme / pushLog / clearLogs / stamp',
    persist: 'theme（logs 属于临时状态，故意不持久化）',
    live: `当前：主题 ${theme.value} · 日志 ${logCount.value} 条`
  }
])

/* 路由表（与 src/router/index.js 一一对应，写在这里方便截图写报告） */
const routeTable = [
  {
    path: '/',
    name: 'root',
    component: '—',
    feature: 'redirect',
    note: '根路径重定向到 /home，访问域名不会看到空白页'
  },
  {
    path: '/home',
    name: 'home',
    component: 'ProfileView',
    feature: '基础路由',
    note: '首页（个人主页）：整体介绍 + 技能 + 联系我'
  },
  {
    path: '/projects',
    name: 'projects',
    component: 'ProjectsLayout → ProjectListView',
    feature: '嵌套路由（父 + 默认子路由）',
    note: '项目模块父级提供公共头部与面包屑，列表渲染在子路由出口'
  },
  {
    path: '/projects/:id',
    name: 'project-detail',
    component: 'ProjectsLayout → ProjectDetailView',
    feature: '动态路由',
    note: '一条规则匹配所有项目详情，useRoute().params.id 区分具体项目'
  },
  {
    path: '/articles',
    name: 'articles',
    component: 'ArticleListView',
    feature: '基础路由 + Pinia',
    note: '文章列表（公开）：数据来自 useArticleStore，只展示「已发布」，含关键词 / 分类 / 排序'
  },
  {
    path: '/articles/manage',
    name: 'articles-manage',
    component: 'ArticleManageView',
    feature: 'meta.requiresAuth + 全局守卫',
    note: '文章管理：文章的增删改查与发布切换，未登录会被守卫拦到 /login?redirect=…'
  },
  {
    path: '/articles/:id',
    name: 'article-detail',
    component: 'ArticleDetailView',
    feature: '动态路由 + Store 查询',
    note: '文章详情：用 store.getArticle(id) 取数据；打开一次调用 incrementViews 让阅读量 +1'
  },
  {
    path: '/about',
    name: 'about',
    component: 'AboutView',
    feature: '基础路由',
    note: '就是当前这一页'
  },
  {
    path: '/login',
    name: 'login',
    component: 'LoginView',
    feature: '基础路由 + alias',
    note: '身份认证页；别名 /auth 也能打开'
  },
  {
    path: '/admin',
    name: 'admin',
    component: 'AdminView',
    feature: 'meta.requiresAuth + 全局守卫',
    note: '后台管理：未登录访问会被 beforeEach 拦截到 /login'
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: 'NotFoundView',
    feature: '通配符 404',
    note: '放在路由表最后，兜住所有没匹配上的地址'
  }
]

/* 特性标签配色 */
const toneOf = (feature) => {
  if (feature.includes('动态')) return 'brand'
  if (feature.includes('嵌套')) return 'ok'
  if (feature.includes('守卫') || feature.includes('404')) return 'warn'
  return 'hollow'
}

/* Hash / History 模式的实际取值（router/index.js 里由环境变量决定） */
const historyMode = computed(() =>
  import.meta.env.VITE_ROUTER_MODE === 'hash' ? 'Hash 模式（URL 带 #）' : 'History 模式（URL 干净）'
)

/* 其它导航 API 的小抄 */
const apiNotes = [
  { api: '<RouterView />', desc: '路由出口：当前匹配到的页面组件渲染在这里' },
  { api: '<RouterLink to="…" />', desc: '声明式导航，渲染成 <a>，自动带高亮类' },
  { api: 'router-link-active', desc: '前缀匹配高亮：父路由在子路由下也会保持高亮' },
  { api: 'router-link-exact-active', desc: '精确匹配高亮：只有路径完全相同时才生效' },
  { api: 'useRoute()', desc: '读当前路由信息：params / query / meta / fullPath' },
  { api: 'useRouter()', desc: '拿路由实例：push / replace / go / back' },
  { api: 'beforeEach', desc: '全局前置守卫：更新标题、拦截未登录访问（读 useUserStore）' },
  { api: 'scrollBehavior', desc: '切换路由时的滚动位置控制' }
]

/* ★ 实验四新增：Pinia 速查 */
const piniaNotes = [
  { api: 'createPinia() + app.use(pinia)', desc: 'main.js 里注册；必须早于 app.use(router)' },
  { api: 'defineStore(id, { state, getters, actions })', desc: '定义一个 Store 的三件套写法' },
  { api: 'useXxxStore()', desc: '在组件 / 守卫里取实例；不要在模块顶层调用' },
  { api: 'storeToRefs(store)', desc: '解构 state 与 getters 保持响应式；actions 不要解构' },
  { api: 'getters 返回函数', desc: 'getProject(id) 这类带参查询；注意它不参与缓存' },
  { api: 'store.$patch(obj)', desc: '一次合并更新多个字段，只触发一次订阅' },
  { api: 'store.$subscribe(cb, { detached: true })', desc: '监听 state 变化，持久化插件的基础' },
  { api: 'pinia.use(plugin)', desc: '注册插件；本项目用它实现 localStorage 持久化' }
]

/* ★ 实验四（第二次）新增：Element Plus 组件清单
   指导书要求「不少于 10 种组件，并说明其作用」，这里把实际用到的组件按分组列出来，
   每条都写了「它解决什么问题」，方便对照验收与写报告。 */
const elPlusGroups = [
  {
    group: '布局',
    tone: 'primary',
    items: [
      { name: 'el-container / el-header / el-main / el-footer', desc: '三段式页面骨架；el-main 自动撑满剩余高度' },
      { name: 'el-row / el-col', desc: '24 栅格布局，xs/sm/md/lg 做响应式列数' }
    ]
  },
  {
    group: '导航',
    tone: 'success',
    items: [
      { name: 'el-menu / el-menu-item', desc: '横向导航；开 router 后点菜单项直接路由跳转' },
      { name: 'el-tabs / el-tab-pane', desc: '后台管理的三个页签' },
      { name: 'el-divider', desc: '带文字的分隔线' }
    ]
  },
  {
    group: '数据展示',
    tone: 'warning',
    items: [
      { name: 'el-timeline / el-timeline-item', desc: '成长时间线；type 配色、hollow 空心、timestamp 时间' },
      { name: 'el-statistic', desc: '数字统计，prefix/suffix 插槽放图标与单位' },
      { name: 'el-descriptions / el-descriptions-item', desc: 'label-value 自动对齐的详细信息表' },
      { name: 'el-table / el-table-column', desc: '数据表格，作用域插槽自定义单元格' },
      { name: 'el-card', desc: '卡片容器，自带分区与阴影' },
      { name: 'el-tag', desc: '标签；type/effect 控制配色' },
      { name: 'el-progress', desc: '进度条；status 控制状态色' },
      { name: 'el-avatar', desc: '头像，支持加载失败兜底' },
      { name: 'el-badge', desc: '角标，用于收藏数' },
      { name: 'el-empty', desc: '空状态插画 + 操作按钮' }
    ]
  },
  {
    group: '表单',
    tone: 'danger',
    items: [
      { name: 'el-form / el-form-item', desc: 'model + rules 声明式校验，自动显示错误提示' },
      { name: 'el-input', desc: '输入框；clearable 清空、show-password 密码显隐、textarea 多行' },
      { name: 'el-input-number', desc: '数字输入，带步进与范围限制' },
      { name: 'el-select / el-option', desc: '下拉选择' },
      { name: 'el-radio-group / el-radio-button', desc: '药丸式单选按钮组' },
      { name: 'el-switch', desc: '开关；主题切换、文章置顶' },
      { name: 'el-color-picker', desc: '取色器，选文章卡片主色' }
    ]
  },
  {
    group: '反馈',
    tone: 'info',
    items: [
      { name: 'el-dialog', desc: '对话框；自带遮罩、层级与 Esc 关闭' },
      { name: 'el-alert', desc: '提示条；type 区分信息/警告/成功' },
      { name: 'el-tooltip', desc: '悬停文字提示' },
      { name: 'el-link', desc: '文字链接' },
      { name: 'el-collapse-transition', desc: '折叠展开的过渡动画' },
      { name: 'el-result', desc: '结果页，404 用它' },
      { name: 'ElMessage / ElMessageBox', desc: '方法式轻提示与确认框，替代 alert / confirm' }
    ]
  }
]
</script>

<template>
  <div class="view">
    <BaseCard icon="📄" title="关于本站" subtitle="本站是 Web 前端框架程序设计课程的实验成果，逐次迭代">
      <p class="intro">
        我是 <b>{{ siteInfo.name }}</b>（{{ siteInfo.enName }}），这里是实验四的成果，分两步完成：<br />
        <b>第一步 · 状态管理</b>：在实验三「路由化的个人主页」基础上，用 <b>Pinia</b> 接管全站共享状态 ——
        把跨组件、跨页面的数据拆成四个 Store，用 getters 承载派生计算、
        用 actions 收口每一处修改，并配一个基于 <code>$subscribe</code> 的
        localStorage 插件让刷新不丢状态；同时新增了文章列表 / 文章详情 / 文章管理三个页面。<br />
        <b>第二步 · UI 组件库与上线</b>：引入 <b>Element Plus</b> 全局注册（并把配色接到本站品牌色、跟随暗色主题），
        用 <code>el-container</code> 系布局组件重构整体结构、<code>el-menu</code> 接管导航、
        <code>el-table</code> 与表单对话框接管增删改查，并在个人信息页新增
        <code>el-timeline</code> 成长时间线，累计使用 40 种组件；
        最后配置 Vite <code>base</code> 与 Hash 路由，用 <b>GitHub Actions</b> 自动发布到 GitHub Pages。
      </p>

      <div class="meta">
        <BaseTag label="Vue 3" tone="brand" />
        <BaseTag v-for="t in siteInfo.techStack" :key="t" :label="t" tone="hollow" />
        <BaseTag label="Vue Router 4" tone="ok" />
      </div>

      <template #footer>
        <p class="hint">
          当前访问路径：<code>{{ route.fullPath }}</code> ·
          路由名：<code>{{ String(route.name) }}</code> ·
          页面标题：<code>{{ route.meta.title || '—' }}</code> ·
          history：<code>{{ historyMode }}</code>
        </p>
      </template>
    </BaseCard>

    <!-- ============ 路由表 ============ -->
    <BaseCard
      icon="🗺️"
      title="本站路由表"
      subtitle="path / name / component / meta 四个配置项的实际用法，与 src/router/index.js 完全一致"
    >
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>path</th>
              <th>name</th>
              <th>component</th>
              <th>涉及知识点</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in routeTable" :key="r.path">
              <td><code>{{ r.path }}</code></td>
              <td><code>{{ r.name }}</code></td>
              <td><code>{{ r.component }}</code></td>
              <td>
                <BaseTag :label="r.feature" :tone="toneOf(r.feature)" />
                <p class="note">{{ r.note }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- ============ ★ 实验四：Store 速查 + 实时值 ============ -->
    <BaseCard
      icon="🍍"
      title="本站的四个 Pinia Store"
      subtitle="state / getters / actions / 持久化字段一览；最后一列是页面上真实读到的当前值"
    >
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Store</th>
              <th>state</th>
              <th>getters</th>
              <th>actions</th>
              <th>持久化</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in storeTable" :key="s.name">
              <td>
                <code>{{ s.name }}</code>
                <p class="note">{{ s.file }}</p>
              </td>
              <td class="mono">{{ s.state }}</td>
              <td class="mono">{{ s.getters }}</td>
              <td class="mono">{{ s.actions }}</td>
              <td>
                <p class="note">{{ s.persist }}</p>
                <p class="live">{{ s.live }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <p class="hint">
          打开浏览器 F12 → <b>Vue</b> 面板 → <b>Pinia</b> 标签页，能看到同样这四个 Store，
          并且可以手动改值、查看每次变更的来源与时间线 —— 这就是指导书 4.1 第 7 条要求的观察方式。
        </p>
      </template>
    </BaseCard>

    <!-- ============ API 小抄 ============ -->
    <BaseCard icon="🧠" title="Vue Router 速查" subtitle="本次实验实际用到的 API 及它们在项目里的位置">
      <ul class="api-list">
        <li v-for="a in apiNotes" :key="a.api">
          <code>{{ a.api }}</code>
          <span>{{ a.desc }}</span>
        </li>
      </ul>
    </BaseCard>

    <BaseCard icon="🍍" title="Pinia 速查" subtitle="从注册到持久化，一条链路上的关键 API">
      <ul class="api-list">
        <li v-for="a in piniaNotes" :key="a.api">
          <code>{{ a.api }}</code>
          <span>{{ a.desc }}</span>
        </li>
      </ul>
    </BaseCard>

    <!-- ============ ★ 实验四（第二次）：Element Plus 组件清单 ============ -->
    <el-card class="elplus-card" shadow="hover">
      <template #header>
        <div class="elplus-head">
          <div>
            <h2 class="elplus-head__title">🧱 本站用到的 Element Plus 组件</h2>
            <p class="elplus-head__sub">
              按功能分组，共 40 种；指导书要求「不少于 10 种并说明其作用」，这里逐条列出用途
            </p>
          </div>
          <el-tag type="primary" effect="dark" round>Element Plus 2.14</el-tag>
        </div>
      </template>

      <div class="elplus-groups">
        <div v-for="g in elPlusGroups" :key="g.group" class="elplus-group">
          <el-tag :type="g.tone" effect="light" round class="elplus-group__title">{{ g.group }}</el-tag>
          <ul class="api-list">
            <li v-for="item in g.items" :key="item.name">
              <code>{{ item.name }}</code>
              <span>{{ item.desc }}</span>
            </li>
          </ul>
        </div>
      </div>
    </el-card>

    <!-- ============ 快速验证入口 ============ -->
    <BaseCard icon="🧪" title="快速验证" subtitle="点一下就能直接验证各类路由行为">
      <div class="actions">
        <RouterLink class="btn sm" to="/home">/home 首页</RouterLink>
        <RouterLink class="btn sm" to="/projects">/projects 列表</RouterLink>
        <RouterLink class="btn sm" to="/projects/p3">/projects/p3 有效详情</RouterLink>
        <RouterLink class="btn sm" to="/projects/不存在的id">/projects/不存在的id 无效参数</RouterLink>
        <RouterLink class="btn sm" to="/articles">/articles 文章列表</RouterLink>
        <RouterLink class="btn sm" to="/articles/a1">/articles/a1 文章详情（阅读量 +1）</RouterLink>
        <RouterLink class="btn sm" :to="{ name: 'articles-manage' }">/articles/manage 需登录</RouterLink>
        <RouterLink class="btn sm" :to="{ name: 'admin' }">/admin 未登录会被拦截</RouterLink>
        <RouterLink class="btn sm" to="/this-page-does-not-exist">随便一个坏地址 → 404</RouterLink>
        <RouterLink class="btn sm" to="/auth">/auth（login 的别名）</RouterLink>
      </div>

      <template #footer>
        <p class="hint">
          提示：每次跳转都会写一条日志到 useUiStore，可以直接打开
          <RouterLink to="/articles">文章列表</RouterLink>
          或后台页底部的日志区查看；未登录访问 <code>/articles/manage</code> 会先被送到登录页。
        </p>
      </template>
    </BaseCard>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
}

.intro {
  font-size: 14px;
  line-height: 1.9;
  color: var(--text);
}
.meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 14px;
}

/* ---------- 表格 ---------- */
.table-wrap {
  overflow-x: auto;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th,
.table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
}
.table th {
  font-size: 12.5px;
  color: var(--muted);
  background: var(--soft);
  font-weight: 600;
}
.table tbody tr:hover {
  background: var(--soft);
}
.note {
  font-size: 12.3px;
  color: var(--muted);
  line-height: 1.7;
  margin-top: 5px;
}
/* Store 速查表里的等宽字段描述 */
.mono {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 11.8px;
  color: var(--muted);
  line-height: 1.75;
}
/* 实时值：加深强调，一眼看出它是「活的」 */
.live {
  margin-top: 5px;
  font-size: 12.3px;
  font-weight: 600;
  color: var(--brand);
  line-height: 1.7;
}

/* ---------- API 列表 ---------- */
.api-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 8px;
}
.api-list li {
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 9px 12px;
}
.api-list span {
  font-size: 12.4px;
  color: var(--muted);
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.actions a {
  text-decoration: none;
}

/* ---------- Element Plus 组件清单卡片 ---------- */
.elplus-card {
  border-radius: 20px;
  margin-bottom: 16px;
}
.elplus-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.elplus-head__title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
}
.elplus-head__sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
.elplus-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.elplus-group__title {
  margin-bottom: 8px;
}
</style>
