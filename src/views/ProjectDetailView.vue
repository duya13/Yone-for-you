<script setup>
/* ============================================================================
   ProjectDetailView —— 项目详情页（动态路由 /projects/:id）
   ----------------------------------------------------------------------------
   这是实验三最核心的一个页面，把「动态路由 + useRoute + 编程式导航」
   三件事集中演示了一遍。

   ① 动态路由参数怎么拿？
      路由表里写的是 path: ':id'，URL 里 /projects/p3 的 p3 就会成为 params.id。
      两种取法（本项目两种都演示）：
        A. useRoute().params.id   —— 最常用；params 是响应式的，
                                     在 /projects/p1 → /projects/p2 之间切换时
                                     computed 会自动重算，不用监听。
        B. props: true            —— 路由表里给这条规则加 props: true，
                                     参数会作为 props 传进来，组件不必依赖 route。

   ② 无效地址怎么处理？
      用户手输 /projects/不存在的id 是完全可能的（分享链接、改 URL）。
      这里不直接把用户甩到 404，而是先给出「该编号不存在」的提示，
      并提供恢复导航；同时把这次无效访问 replace 掉，
      不让无效地址留在历史记录里（指导书：离开无效地址用 replace）。

   ③ 编程式导航的三种用法都在这个文件里：
        router.go(-1)                  返回上一页（按历史记录回退）
        router.push({ name: 'projects' })   进入列表（新增一条历史记录）
        router.replace({ name: 'home' })    替换当前记录（不留无效地址）
   ========================================================================== */

import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import BaseCard from '../components/common/BaseCard.vue'
import BaseTag from '../components/common/BaseTag.vue'
import LevelBar from '../components/common/LevelBar.vue'
import ActivityLog from '../components/common/ActivityLog.vue'
import { getStatusTone } from '../data/content.js'
import { useProjectStore } from '../stores/useProjectStore.js'
import { useUiStore } from '../stores/useUiStore.js'

/* 路由表里写了 props: true，所以 :id 会作为 prop 传进来 */
const props = defineProps({
  id: { type: String, default: '' }
})

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const uiStore = useUiStore()

const { projects } = storeToRefs(projectStore)
const { logs } = storeToRefs(uiStore)

/* 优先用 prop（props:true 传来的），没有就退回 route.params（容错写法） */
const projectId = computed(() => props.id || String(route.params.id || ''))

/* 当前项目：不存在时为 null，模板据此走「无效地址」分支 */
const project = computed(() => projectStore.getProject(projectId.value))
const notFound = computed(() => !project.value)

/* 同分类下的上一个 / 下一个项目：演示「换参数但不换组件」的复用 */
/* 注意：projects 是 storeToRefs 解出来的 ref，脚本里必须写 .value */
const siblings = computed(() => projects.value.filter((p) => p.id !== projectId.value))
const prevProject = computed(() => {
  const list = projects.value
  const i = list.findIndex((p) => p.id === projectId.value)
  return i > 0 ? list[i - 1] : null
})
const nextProject = computed(() => {
  const list = projects.value
  const i = list.findIndex((p) => p.id === projectId.value)
  return i > -1 && i < list.length - 1 ? list[i + 1] : null
})

const detailRows = computed(() => {
  const p = project.value
  if (!p) return []
  return [
    { key: '项目编号', value: p.id },
    { key: '项目分类', value: p.category },
    { key: '当前状态', value: p.status },
    { key: '开始时间', value: p.startedAt },
    { key: '最近更新', value: p.updatedAt },
    { key: '技术栈', value: (p.tech || []).join(' / ') }
  ]
})

const favorite = computed(() => (project.value ? projectStore.isFavorite(project.value.id) : false))

/* =============================== watch =============================== */
/* 演示「组件被复用」这件事：从 /projects/p1 点「下一个」到 /projects/p2，
   组件实例并没有销毁重建，只是 params 变了。
   所以想「参数变化时做点事」，必须监听 route.params，onMounted 只跑一次。 */
watch(
  projectId,
  (id, oldId) => {
    console.log('[ProjectDetailView][watch route.params.id]', oldId, '→', id)
    uiStore.pushLog(uiStore.stamp(`[ProjectDetailView] 路由参数变化：${oldId || '(空)'} → ${id}`))
  },
  { immediate: true }
)

onMounted(() => {
  console.log('%c[实验四] 项目详情页（ProjectDetailView）挂载完成', 'color:#8b5cf6;font-weight:bold;')
  console.log('[ProjectDetailView][mounted] route.fullPath =', route.fullPath)
  console.log('[ProjectDetailView][mounted] route.params   =', route.params)
  console.log('[ProjectDetailView][mounted] route.query    =', route.query)
  console.log('[ProjectDetailView][mounted] 命中项目       =', project.value?.name || '未找到')
})

/* ============================== 导航操作 ============================== */
/** 编程式导航 ①：进入某个项目的详情（复用同一个组件的不同参数） */
function goProject(id) {
  router.push({ name: 'project-detail', params: { id } })
}

/** 编程式导航 ②：返回上一页 —— 按浏览器历史记录回退，比 push 更符合直觉 */
function goBack() {
  uiStore.pushLog(uiStore.stamp('[ProjectDetailView] router.go(-1) 返回上一页'))
  router.go(-1)
}

/** 编程式导航 ③：返回列表 —— 新增一条历史记录 */
function backToList() {
  uiStore.pushLog(uiStore.stamp('[ProjectDetailView] router.push 返回项目列表'))
  router.push({ name: 'projects' })
}

/**
 * 编程式导航 ④：离开无效地址
 * replace 不会留下历史记录 → 用户点「返回」不会又回到这个坏地址。
 */
function escapeInvalid() {
  uiStore.pushLog(uiStore.stamp(`[ProjectDetailView] 无效地址 ${route.fullPath} → replace 到项目列表`))
  router.replace({ name: 'projects' })
}

function onToggleFavorite() {
  if (!project.value) return
  projectStore.toggleFavorite(project.value.id)
  uiStore.pushLog(
    uiStore.stamp(`[ProjectDetailView] ${favorite.value ? '收藏' : '取消收藏'}：${project.value.name}`)
  )
}
</script>

<template>
  <div class="view">
    <!-- ================= 正常情况：渲染项目详情 ================= -->
    <template v-if="project">
      <BaseCard
        icon="🔍"
        title="项目详情"
        :subtitle="`当前路由：/projects/:id，本页匹配到的 id = ${projectId}`"
      >
        <template #actions>
          <BaseTag :label="project.status" :tone="getStatusTone(project.status)" />
          <BaseTag :label="project.category" tone="brand" />
        </template>

        <!-- 头部：封面 + 标题 + 标签 -->
        <header class="hero" :style="{ background: `${project.accent}1a` }">
          <span class="hero__cover">{{ project.cover }}</span>
          <div class="hero__titles">
            <h3 class="hero__name">{{ project.name }}</h3>
            <div class="hero__tags">
              <BaseTag v-for="t in project.tags" :key="t" :label="t" tone="hollow" />
            </div>
          </div>
        </header>

        <p class="detail">{{ project.detail || project.summary }}</p>

        <div class="progress">
          <LevelBar
            :value="project.progress"
            :height="8"
            :from="project.accent"
            to="var(--brand-2)"
          />
          <div class="progress__meta">
            <span class="hint">项目完成度</span>
            <b>{{ project.progress }}%</b>
          </div>
        </div>

        <dl class="rows">
          <div v-for="row in detailRows" :key="row.key" class="row">
            <dt>{{ row.key }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <div v-if="project.highlights?.length" class="highlights">
          <p class="label">技术要点</p>
          <ul>
            <li v-for="h in project.highlights" :key="h">{{ h }}</li>
          </ul>
        </div>

        <!-- ============ 编程式导航按钮组 ============ -->
        <template #footer>
          <div class="nav-actions">
            <button class="btn sm" type="button" @click="goBack">← 返回上一页（go(-1)）</button>
            <button class="btn sm" type="button" @click="backToList">📋 返回项目列表（push）</button>

            <button
              v-if="prevProject"
              class="btn sm"
              type="button"
              @click="goProject(prevProject.id)"
            >
              ← 上一个：{{ prevProject.id }}
            </button>
            <button
              v-if="nextProject"
              class="btn sm"
              type="button"
              @click="goProject(nextProject.id)"
            >
              下一个：{{ nextProject.id }} →
            </button>

            <button class="btn sm" type="button" :class="{ active: favorite }" @click="onToggleFavorite">
              {{ favorite ? '★ 已收藏' : '☆ 收藏' }}
            </button>

            <a v-if="project.repo" class="btn sm" :href="project.repo" target="_blank" rel="noopener">
              🐙 源码仓库
            </a>

            <RouterLink class="btn sm" :to="{ name: 'admin' }">⚙️ 去后台修改</RouterLink>
          </div>
        </template>
      </BaseCard>
    </template>

    <!-- ================= 无效地址：/projects/不存在的id ================= -->
    <template v-else>
      <BaseCard icon="🚫" title="没有找到这个项目" subtitle="这是动态路由参数校验失败时的兜底页面">
        <p class="invalid">
          地址中的参数 <code>id = {{ projectId || '(空)' }}</code> 在项目数据里不存在。<br />
          可用的项目编号：<code>{{ siblings.map((p) => p.id).join('、') }}</code>
        </p>

        <template #footer>
          <div class="nav-actions">
            <button class="btn sm primary" type="button" @click="escapeInvalid">
              🧹 离开这个无效地址（replace 到列表）
            </button>
            <button class="btn sm" type="button" @click="backToList">📋 返回项目列表（push）</button>
            <button class="btn sm" type="button" @click="goBack">← 返回上一页（go(-1)）</button>
            <RouterLink class="btn sm" :to="{ name: 'home' }">🏠 回首页</RouterLink>
          </div>
        </template>
      </BaseCard>
    </template>

    <!-- ================= 活动日志 ================= -->
    <BaseCard>
      <ActivityLog :logs="logs" title="项目详情页 · 活动日志" @clear="uiStore.clearLogs" />
    </BaseCard>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
}

.hero {
  display: flex;
  gap: 14px;
  align-items: center;
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 16px;
}
.hero__cover {
  font-size: 36px;
  line-height: 1;
}
.hero__name {
  font-size: 18px;
  margin-bottom: 6px;
}
.hero__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.detail {
  font-size: 13.8px;
  line-height: 1.85;
  color: var(--muted);
}

.progress {
  margin: 16px 0;
}
.progress__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12.5px;
}

.rows {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}
.row {
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 9px 12px;
}
.row dt {
  font-size: 12px;
  color: var(--muted);
}
.row dd {
  font-size: 13.5px;
  font-weight: 600;
  margin-top: 2px;
}

.highlights {
  margin-top: 16px;
}
.label {
  font-size: 12.5px;
  color: var(--muted);
  margin-bottom: 6px;
}
.highlights ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.highlights li {
  font-size: 13.2px;
  background: var(--soft);
  border-left: 3px solid var(--brand);
  border-radius: 8px;
  padding: 7px 12px;
}

.nav-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.nav-actions a {
  text-decoration: none;
}

.invalid {
  font-size: 13.5px;
  line-height: 2;
  color: var(--muted);
}
</style>
