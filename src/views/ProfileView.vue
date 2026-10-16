<script setup>
/* ============================================================================
   ProfileView —— 首页 / 个人主页（路由 /home）
   ----------------------------------------------------------------------------
   本组件一路改造过来的痕迹：

   ① 数据来源：Pinia Store 取代 props
       实验二：App.vue 用 :profile="profile" 下发
       实验三：改为 useAppStore() 手写 store
       实验四：改为 useUserStore()（Pinia）+ storeToRefs 解构
       静态数据（技能、社交链接、时间线）仍直接从 data/content.js 引入。
       页面自己的交互状态（搜索词、展开、弹窗…）仍然留在本组件里，
       因为离开首页后它们本来就该销毁 —— 这正是「状态归属」原则在路由下的体现。

   ② 修改入口：与访客浏览区分
       未登录时点「编辑信息」，不会直接弹窗，而是跳到 /admin，
       由路由守卫把你送到登录页；登录后才真正打开编辑弹窗。

   ★ 实验四第二次（本文件是重构的重点页）：
     指导书要求「在个人信息页面新增时间线」，这里用 el-timeline 呈现
     从实验一到实验四的完整成长轨迹 —— 时间线的数据放在 data/content.js，
     组件只负责渲染，符合「数据与视图分离」。

     本页用到的 Element Plus 组件：
       el-card / el-row / el-col      栅格与卡片布局（重构的整体结构）
       el-timeline / el-timeline-item 成长时间线（本次新增的核心）
       el-statistic                   数据概览里的数字展示
       el-tag                         状态标签
       el-alert                       权限说明与提示
       el-link                        外链
       el-empty                       空状态（技能列表里）
   ========================================================================== */

import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import ActivityLog from '../components/common/ActivityLog.vue'
import ProfileCard from '../components/profile/ProfileCard.vue'
import SkillList from '../components/profile/SkillList.vue'
import SocialLinks from '../components/profile/SocialLinks.vue'
import ProfileEditDialog from '../components/profile/ProfileEditDialog.vue'
import { skillData, socialData, timelineData, timelineStats } from '../data/content.js'
import { useUserStore } from '../stores/useUserStore.js'
import { useUiStore } from '../stores/useUiStore.js'

const router = useRouter()
const userStore = useUserStore()
const uiStore = useUiStore()

/* ---------- 数据：来自 Store 与静态数据文件 ----------
   ★ storeToRefs：state 与 getters 解构成 ref 后仍与 Store 保持同步；
     actions（saveProfile…）不解构，直接 userStore.saveProfile() 调用。 */
const { profile, isAuthed, account } = storeToRefs(userStore)
const { logs } = storeToRefs(uiStore)

const skills = skillData
const socials = socialData
const timeline = timelineData

/* ============================ 组件内部状态 ============================ */
/* 只影响本页面的状态留在组件里。路由组件有个特点：
   离开 /home 时组件被卸载，再回来这些值会重置为初始值。
   （实验二用 v-show 时它们会一直保留 —— 这是两种方案最直观的差别之一。） */
const keyword = ref('')
const expanded = ref(false)
const detailOpenCount = ref(0)
const searchHistory = ref([])
const editVisible = ref(false)
const editForm = ref({})
const openedAt = ref('')

/* ============================== computed ============================== */
const filteredSkills = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return skills
  return skills.filter(
    (s) =>
      s.name.toLowerCase().includes(kw) ||
      s.category.toLowerCase().includes(kw) ||
      s.desc.toLowerCase().includes(kw)
  )
})

const categories = computed(() => [...new Set(skills.map((s) => s.category))])

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，早点休息'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const avgLevel = computed(() => {
  if (!skills.length) return 0
  return Math.round(skills.reduce((acc, s) => acc + s.level, 0) / skills.length)
})

/* 数据概览：交给 el-row / el-col + el-statistic 渲染，这里只负责算数 */
const statItems = computed(() => [
  { icon: '🧩', label: '技能总数', value: skills.length, suffix: '项' },
  { icon: '🔍', label: '当前匹配', value: filteredSkills.value.length, suffix: '项', color: 'var(--brand)' },
  { icon: '🗂️', label: '技能分类', value: categories.value.length, suffix: '类' },
  { icon: '📈', label: '平均熟练度', value: avgLevel.value, suffix: '%', color: 'var(--ok)' },
  { icon: '👀', label: '已展开详情', value: detailOpenCount.value, suffix: '次', color: 'var(--warn)' }
])

/** 时间线的统计：已完成 / 总数 */
const timelineSummary = computed(() => `${timelineStats.done} / ${timelineStats.total} 个阶段已完成`)

/* =============================== watch =============================== */
watch(keyword, (newVal, oldVal) => {
  uiStore.pushLog(uiStore.stamp(`[ProfileView] watch keyword：${oldVal || '(空)'} → ${newVal || '(空)'}`))
  console.log('[ProfileView][watch] keyword：', oldVal, '→', newVal)

  const v = String(newVal).trim()
  if (v && v !== searchHistory.value[0]) {
    searchHistory.value.unshift(v)
    if (searchHistory.value.length > 5) searchHistory.value.pop()
  }
})

watch(expanded, (newVal) => {
  uiStore.pushLog(uiStore.stamp(`[ProfileView] watch expanded → ${newVal ? '展开' : '收起'}`))
})

/* ============================== 生命周期 ============================== */
onMounted(() => {
  openedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })

  console.log('%c[实验四] 首页 / 个人主页（ProfileView）挂载完成', 'color:#4f46e5;font-weight:bold;')
  console.log('[ProfileView][mounted] 挂载时间：', openedAt.value)
  console.log('[ProfileView][mounted] 当前路由：', router.currentRoute.value.fullPath)
  console.log('[ProfileView][mounted] 数据来源：useUserStore + useUiStore + data/content.js')
  console.log('[ProfileView][mounted] Element Plus 组件：el-timeline / el-statistic / el-card / el-row')

  uiStore.pushLog(
    uiStore.stamp(`[ProfileView] mounted · ${greeting.value} · 技能 ${skills.length} 项 · 时间线 ${timeline.length} 段`)
  )
})

/* ============================== 事件处理 ============================== */
function toggleDetail() {
  expanded.value = !expanded.value
  if (expanded.value) detailOpenCount.value++
}

/**
 * ★ 修改入口的权限区分：
 *   已登录 → 打开编辑弹窗，改完写入 store，全站同步
 *   未登录 → 跳到 /admin，由 beforeEach 守卫改送到 /login
 */
function openEdit() {
  if (!isAuthed.value) {
    uiStore.pushLog(uiStore.stamp('[ProfileView] 未登录，编辑入口改为跳转后台（将被守卫送到登录页）'))
    router.push({ name: 'admin' })
    return
  }
  editForm.value = JSON.parse(JSON.stringify(profile.value))
  editVisible.value = true
  uiStore.pushLog(uiStore.stamp('[ProfileView] 打开编辑弹窗（使用 profile 的副本作为草稿）'))
}

function cancelEdit() {
  uiStore.pushLog(uiStore.stamp('[ProfileView] 已取消编辑，profile 未被修改'))
}

function saveEdit() {
  userStore.saveProfile({ ...editForm.value })
  editVisible.value = false
  uiStore.pushLog(uiStore.stamp('[ProfileView] 已保存个人信息（写入 store，其它页面同步更新）'))
}

function onPickSkill(skill) {
  uiStore.pushLog(uiStore.stamp(`[ProfileView] 点击技能：${skill.name}（熟练度 ${skill.level}%）`))
}

function onTimelineClick(item) {
  uiStore.pushLog(uiStore.stamp(`[ProfileView] 点击时间线节点：${item.title}`))
}
</script>

<template>
  <div class="view">
    <!-- ① 个人基本信息：数据来自 store，编辑动作先过权限判断 -->
    <ProfileCard
      :profile="profile"
      :expanded="expanded"
      :open-count="detailOpenCount"
      @toggle-detail="toggleDetail"
      @edit="openEdit"
    />

    <!-- ② 数据概览：el-row / el-col 栅格 + el-statistic 数字展示 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div class="block-head">
          <div>
            <h2 class="block-head__title">📊 数据概览</h2>
            <p class="block-head__sub">
              el-row / el-col 自适应栅格 + el-statistic 数字展示；数值全部由 computed 实时算出
            </p>
          </div>
          <div class="block-head__actions">
            <el-button @click="router.push({ name: 'projects' })">📁 去看项目展示</el-button>
            <el-button @click="router.push({ name: 'articles' })">📝 去看文章列表</el-button>
          </div>
        </div>
      </template>

      <!-- :gutter 控制列间距；:xs/:sm/:md 实现响应式列数 -->
      <el-row :gutter="16">
        <el-col v-for="item in statItems" :key="item.label" :xs="12" :sm="8" :md="8" :lg="4.8">
          <div class="stat">
            <el-statistic :value="item.value">
              <template #prefix>
                <span class="stat__icon">{{ item.icon }}</span>
              </template>
              <template #suffix>
                <span class="stat__suffix">{{ item.suffix }}</span>
              </template>
            </el-statistic>
            <span class="stat__label">{{ item.label }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- ③ ★ 成长时间线：本次实验要求新增的部分 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div class="block-head">
          <div>
            <h2 class="block-head__title">🕒 我的成长时间线</h2>
            <p class="block-head__sub">
              el-timeline / el-timeline-item 呈现 · 数据来自 data/content.js 的 timelineData ·
              {{ timelineSummary }}
            </p>
          </div>
          <el-tag type="success" effect="dark" round>{{ timeline.length }} 个节点</el-tag>
        </div>
      </template>

      <!--
        el-timeline 的常用配置：
          :timestamp         节点左侧的时间文字（这里用日期）
          :type              节点圆点的配色 primary/success/warning/danger/info
          :hollow            空心圆点，用来弱化「规划中」这类未完成节点
          placement="top"    时间文字显示在内容上方（内容较长时更易读）
          @click             节点可点击，这里用来记操作日志
      -->
      <el-timeline>
        <el-timeline-item
          v-for="item in timeline"
          :key="item.title"
          :timestamp="item.date"
          :type="item.type"
          :hollow="!item.highlight"
          placement="top"
          size="large"
          @click="onTimelineClick(item)"
        >
          <el-card class="tl-card" :class="{ 'is-highlight': item.highlight }" shadow="never">
            <h3 class="tl-card__title">
              <span class="tl-card__icon">{{ item.icon }}</span>
              {{ item.title }}
            </h3>
            <p class="tl-card__desc">{{ item.desc }}</p>
            <div class="tl-card__tags">
              <el-tag
                v-for="t in item.tags"
                :key="t"
                size="small"
                effect="plain"
                :type="item.type === 'success' ? 'success' : 'info'"
              >
                {{ t }}
              </el-tag>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- ④ 技能列表：v-model:keyword 双向绑定，筛选结果作为 props 传入 -->
    <SkillList
      v-model:keyword="keyword"
      :skills="filteredSkills"
      :total="skills.length"
      :categories="categories"
      :history="searchHistory"
      @pick="onPickSkill"
    />

    <!-- ⑤ 社交链接：纯展示组件 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">🔗 找到我</h2>
          <p class="block-head__sub">v-bind 绑定动态链接，外链自动新窗口打开</p>
        </div>
      </template>
      <SocialLinks :links="socials" />
    </el-card>

    <!-- ⑥ 修改入口说明：让访客一眼看出「哪里能改内容、为什么需要登录」 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">🔐 关于内容修改</h2>
          <p class="block-head__sub">公开展示对所有人开放，修改需要一个入口</p>
        </div>
      </template>

      <p class="perm">
        当前状态：
        <el-tag :type="isAuthed ? 'success' : 'info'" effect="light" round>
          {{ isAuthed ? `已登录（${account}）` : '访客（未登录）' }}
        </el-tag>
      </p>

      <el-alert
        v-if="isAuthed"
        class="perm-alert"
        type="success"
        :closable="false"
        show-icon
        title="你现在可以修改内容"
        description="在「个人卡片」点「编辑信息」直接改资料，或进入后台管理做更完整的资料 / 项目 / 文章编辑。"
      />
      <el-alert
        v-else
        class="perm-alert"
        type="warning"
        :closable="false"
        show-icon
        title="你当前是访客"
        description="公开展示页可以随意浏览，但点「编辑信息」会被路由守卫带到身份认证页，登录成功后才会跳回你原本想去的 /admin。"
      />

      <div class="perm-links">
        <el-link type="primary" @click="router.push({ name: 'admin' })">⚙️ 进入后台管理</el-link>
        <el-link type="primary" @click="router.push({ name: 'login' })">🔒 去身份认证页</el-link>
        <el-link type="primary" @click="router.push({ name: 'about' })">📄 关于本站</el-link>
      </div>
    </el-card>

    <!-- ⑦ 活动日志：日志来自 store，同时 App.vue 也把它 provide 了出去 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">⌨️ 状态观察日志</h2>
          <p class="block-head__sub">与 F12 控制台输出一致，方便边操作边截图写实验报告</p>
        </div>
      </template>
      <ActivityLog :logs="logs" title="首页 · 活动日志" @clear="uiStore.clearLogs" />
    </el-card>

    <!-- ⑧ 编辑弹窗：只有登录后才会被打开 -->
    <ProfileEditDialog
      v-model:visible="editVisible"
      v-model:form="editForm"
      @save="saveEdit"
      @cancel="cancelEdit"
    />
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

/* ---------- 数据概览 ---------- */
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

/* ---------- 时间线 ---------- */
.tl-card {
  border-radius: 14px;
  background: var(--soft);
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.tl-card:hover {
  border-color: var(--brand);
  transform: translateX(2px);
}
/* 强调节点：用主色边框 + 淡色底突出「当前最重要的阶段」 */
.tl-card.is-highlight {
  background: var(--soft-brand);
  border-left: 3px solid var(--brand);
}
.tl-card__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  margin-bottom: 6px;
}
.tl-card__icon {
  margin-right: 4px;
}
.tl-card__desc {
  font-size: 13.2px;
  line-height: 1.9;
  color: var(--muted);
}
.tl-card__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

/* ---------- 权限说明 ---------- */
.perm {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  margin-bottom: 10px;
}
.perm-alert {
  margin-bottom: 12px;
}
.perm-links {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
}
</style>
