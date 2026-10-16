<script setup>
/* ============================================================================
   ProjectListView —— 项目列表页（/projects）
   ----------------------------------------------------------------------------
   由实验二的 ShowcaseView 改造而来，改动集中在两处：

     ① 数据来源：实验二靠 App.vue 用 props 下发（因为 App 直接持有页面组件）；
        实验三改成从手写 store 取；★ 实验四改成从 Pinia 的 useProjectStore 取，
        并用 storeToRefs 解构 projects / favoriteIds 保持响应式。
     ② 打开详情：实验二弹 ProjectDetailDialog；
        实验三改成「跳转到详情路由」——列表与详情成为两个真实 URL：
          router.push({ name: 'project-detail', params: { id: project.id } })
        这样详情页可以被分享、被收藏、被刷新，浏览器前进后退也能用。

   插槽用法（实验二成果，保持不变）：
     作用域插槽 ProjectGrid → 本页面拿到 v-for 出来的每一项
     默认插槽   ProjectCard 主体
     具名插槽   #title / #status / #actions / #footer
   ========================================================================== */

import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import BaseTag from '../components/common/BaseTag.vue'
import ActivityLog from '../components/common/ActivityLog.vue'
import ProjectToolbar from '../components/showcase/ProjectToolbar.vue'
import ProjectGrid from '../components/showcase/ProjectGrid.vue'
import ProjectCard from '../components/showcase/ProjectCard.vue'
import { getStatusTone, sortOptions } from '../data/content.js'
import { useProjectStore } from '../stores/useProjectStore.js'
import { useUiStore } from '../stores/useUiStore.js'

const router = useRouter()
const projectStore = useProjectStore()
const uiStore = useUiStore()

/* ★ 数据走 storeToRefs，操作走 Store 实例自身 */
const { projects, favoriteIds } = storeToRefs(projectStore)
const { logs } = storeToRefs(uiStore)

/* ============================ 组件内部状态 ============================ */
/* 只有本页面关心，所以不放进 store；离开列表页后它们随组件一起销毁，
   再回来时是初始值（这是路由组件与 v-show 组件最大的区别之一）。 */
const keyword = ref('')
const category = ref('')
const sortBy = ref('default')
const viewMode = ref('grid')

/* ============================== computed ============================== */
/* 注意：storeToRefs 解出来的是 ref，脚本里访问要写 .value */
const categories = computed(() => [...new Set(projects.value.map((p) => p.category))])

const visibleProjects = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  let list = projects.value.filter((p) => {
    if (category.value && p.category !== category.value) return false
    if (!kw) return true
    return (
      p.name.toLowerCase().includes(kw) ||
      p.summary.toLowerCase().includes(kw) ||
      p.category.toLowerCase().includes(kw) ||
      p.tech.join(' ').toLowerCase().includes(kw)
    )
  })

  list = [...list]
  if (sortBy.value === 'progress') list.sort((a, b) => b.progress - a.progress)
  else if (sortBy.value === 'updatedAt') list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  else if (sortBy.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
  return list
})

const statItems = computed(() => {
  const all = projects.value
  const done = all.filter((p) => p.status === '已完成').length
  const doing = all.filter((p) => p.status === '进行中').length
  const avg = all.length ? Math.round(all.reduce((s, p) => s + p.progress, 0) / all.length) : 0
  return [
    { icon: '📁', label: '项目总数', value: all.length, unit: '个' },
    { icon: '✅', label: '已完成', value: done, unit: '个', tone: 'ok' },
    { icon: '🚧', label: '进行中', value: doing, unit: '个', tone: 'warn' },
    { icon: '📈', label: '平均完成度', value: avg, unit: '%', tone: 'brand' },
    { icon: '⭐', label: '我的收藏', value: favoriteIds.value.length, unit: '个' }
  ]
})

/* =============================== watch =============================== */
watch([keyword, category, sortBy], ([kw, cat, sort]) => {
  uiStore.pushLog(
    uiStore.stamp(`[ProjectListView] 筛选条件 → 关键词「${kw || '空'}」· 分类「${cat || '全部'}」· 排序「${sort}」`)
  )
})

/* ============================== 生命周期 ============================== */
onMounted(() => {
  console.log('%c[实验四] 项目列表页（ProjectListView）挂载完成', 'color:#0ea5e9;font-weight:bold;')
  console.log('[ProjectListView][mounted] 当前完整路径：', router.currentRoute.value.fullPath)
  console.log('[ProjectListView][mounted] 项目总数：', projects.value.length)
  uiStore.pushLog(uiStore.stamp(`[ProjectListView] mounted · 共 ${projects.value.length} 个项目`))
})

/* ============================== 事件处理 ============================== */
/** 收藏：状态在 store，页面只负责调用 */
function onToggleFavorite(id) {
  const p = projects.value.find((item) => item.id === id)
  const willFavorite = !projectStore.isFavorite(id)
  projectStore.toggleFavorite(id)
  uiStore.pushLog(uiStore.stamp(`[ProjectListView] ${willFavorite ? '收藏' : '取消收藏'}：${p ? p.name : id}`))
}

/**
 * ★ 编程式导航：打开项目详情
 * 实验二这里是「打开弹窗」，实验三改成「跳转路由」：
 *   push 会新增一条历史记录 → 详情页的「返回上一页」才有东西可回。
 * 如果希望「打开详情」不留下历史（例如从搜索结果直接进入），
 * 换成 router.replace 即可。
 */
function openDetail(project) {
  uiStore.pushLog(uiStore.stamp(`[ProjectListView] 跳转详情路由 /projects/${project.id}`))
  router.push({ name: 'project-detail', params: { id: project.id } })
}

function resetFilters() {
  keyword.value = ''
  category.value = ''
  uiStore.pushLog(uiStore.stamp('[ProjectListView] 已清空筛选条件'))
}
</script>

<template>
  <div class="view">
    <!-- ① 项目概览：el-row / el-col 栅格 + el-statistic 数字展示 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">📊 项目概览</h2>
          <p class="block-head__sub">
            统计结果全部由 computed 从 useProjectStore 的项目数据实时算出
          </p>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col v-for="item in statItems" :key="item.label" :xs="12" :sm="8" :md="8" :lg="4.8">
          <div class="stat">
            <el-statistic :value="item.value">
              <template #prefix><span class="stat__icon">{{ item.icon }}</span></template>
              <template #suffix><span class="stat__suffix">{{ item.unit }}</span></template>
            </el-statistic>
            <span class="stat__label">{{ item.label }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- ② 工具栏 + 项目列表 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div class="block-head">
          <div>
            <h2 class="block-head__title">📋 我的项目</h2>
            <p class="block-head__sub">
              点「详情」进入独立详情页（动态路由 /projects/:id），列表页与详情页是两个真实 URL
            </p>
          </div>
          <div class="block-head__actions">
            <el-button @click="router.push({ name: 'articles' })">📝 去看文章列表</el-button>
            <el-button @click="router.push({ name: 'about' })">关于本站</el-button>
          </div>
        </div>
      </template>

      <ProjectToolbar
        v-model:keyword="keyword"
        v-model:category="category"
        v-model:sort-by="sortBy"
        v-model:view-mode="viewMode"
        :categories="categories"
        :sort-options="sortOptions"
        :result-count="visibleProjects.length"
        :total-count="projects.length"
      />

      <!-- el-empty：Element Plus 的空状态组件（替代自研 EmptyState） -->
      <el-empty v-if="visibleProjects.length === 0" description="没有匹配的项目">
        <el-button type="primary" plain @click="resetFilters">清空筛选条件</el-button>
        <p class="empty-desc">试试换个关键词，或者点上面的按钮清空筛选条件</p>
      </el-empty>

      <!-- ★ 作用域插槽：ProjectGrid 把每一项的数据抛给本页面 -->
      <ProjectGrid
        v-else
        :projects="visibleProjects"
        :favorites="favoriteIds"
        :view-mode="viewMode"
        @toggle-favorite="onToggleFavorite"
        @open-detail="openDetail"
      >
        <template #default="{ project, index, rank, total, favorite, compact, onToggle, onOpen }">
          <ProjectCard
            :project="project"
            :rank="rank"
            :favorite="favorite"
            :compact="compact"
            @toggle-favorite="onToggle"
            @open-detail="onOpen"
          >
            <template #title>
              <h3 class="card-title">
                <span class="card-title__idx">{{ index + 1 }}/{{ total }}</span>
                {{ project.name }}
                <span v-if="favorite" class="card-title__star" title="已收藏">★</span>
              </h3>
            </template>

            <template #status>
              <span class="card-status">
                <i class="card-status__dot" :class="`is-${getStatusTone(project.status)}`"></i>
                <BaseTag :label="project.status" :tone="getStatusTone(project.status)" />
              </span>
            </template>

            <p class="card-summary">{{ project.summary }}</p>
            <div class="card-tags">
              <BaseTag v-for="t in project.tags" :key="t" :label="t" tone="hollow" />
            </div>

            <!-- 具名插槽 #actions：把「详情」换成 RouterLink，语义上是链接而不是按钮 -->
            <template #actions>
              <RouterLink
                class="btn sm"
                :to="{ name: 'project-detail', params: { id: project.id } }"
              >
                详情 →
              </RouterLink>
              <button
                class="btn sm"
                type="button"
                :class="{ active: favorite }"
                @click="onToggle"
              >
                {{ favorite ? '★ 已收藏' : '☆ 收藏' }}
              </button>
            </template>

            <template #footer>
              <span class="hint">更新于 {{ project.updatedAt }} · {{ project.category }}</span>
            </template>
          </ProjectCard>
        </template>
      </ProjectGrid>
    </el-card>

    <!-- ③ 活动日志 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">⌨️ 状态观察日志</h2>
          <p class="block-head__sub">与 F12 控制台输出一致，方便边操作边截图写实验报告</p>
        </div>
      </template>
      <ActivityLog :logs="logs" title="项目列表页 · 活动日志" @clear="uiStore.clearLogs" />
    </el-card>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
}

.block {
  border-radius: 20px;
  margin-bottom: 16px;
}
.block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.block-head__title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
}
.block-head__sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
.block-head__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ---------- 数据概览：el-statistic 外层的自绘小卡片 ---------- */
.stat {
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 10px 12px;
  margin-bottom: 10px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.stat:hover {
  border-color: var(--brand);
  transform: translateY(-2px);
}
.stat__icon {
  font-size: 14px;
  margin-right: 4px;
}
.stat__suffix {
  font-size: 12.5px;
  color: var(--muted);
  margin-left: 2px;
}
.stat__label {
  display: block;
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
.stat :deep(.el-statistic__content) {
  font-size: 22px;
  font-weight: 700;
}

.empty-desc {
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--muted);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
}
.card-title__idx {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 1px 7px;
}
.card-title__star {
  color: var(--warn);
}

.card-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.card-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand);
}
.card-status__dot.is-ok {
  background: var(--ok);
}
.card-status__dot.is-warn {
  background: var(--warn);
}
.card-status__dot.is-muted {
  background: var(--muted);
}

.card-summary {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
}
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* RouterLink 渲染出来是 <a>，去掉下划线、统一由 .btn 控制外观 */
.view :deep(a.btn) {
  text-decoration: none;
}
</style>
