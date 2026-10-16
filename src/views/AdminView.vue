<script setup>
/* ============================================================================
   AdminView —— 后台管理页（/admin）
   ----------------------------------------------------------------------------
   这是「内容修改入口」，普通访客看不到也进不来：

     ① 路由层面被拦：路由表里写了 meta: { requiresAuth: true }，
        全局守卫 beforeEach 检查到未登录就会改跳到 /login?redirect=/admin
     ② 页面层面再兜一次：组件挂载时如果发现未登录，
        立刻 router.replace 回登录页（防止有人绕过守卫直接渲染）

   页面功能：
     Tab 1 个人资料：改姓名 / 方向 / 城市 / 简介 / 兴趣标签，带校验与保存提示
     Tab 2 项目管理：新增 / 编辑 / 删除 / 预览 / 一键恢复默认数据
     Tab 3 文章管理：直接内嵌 ArticleManager 组件（与 /articles/manage 共用同一份实现）

   所有改动都写进 Store，因为首页、列表页、详情页都是从 Store 读的数据，
   改完回到公开展示页立刻就能看到效果。

   数据来源（实验四第一次）：四个 Pinia Store
     useUserStore 登录态 / 账号 / 个人资料 · useProjectStore 项目增删改查
     useArticleStore 文章统计 · useUiStore 活动日志

   ★ 实验四第二次（本文件的改造）：全面换用 Element Plus
     el-card / el-tabs + el-tab-pane   页面分区与页签
     el-form + el-form-item + rules    表单与校验（不再手写 errors 对象）
     el-input / el-select / el-input-number / el-switch   各类表单控件
     el-dialog                         新增 / 编辑项目（指导书要求「对话框组件实现新增与编辑」）
     el-table + el-table-column        项目列表（自带排序、边框、空数据提示）
     el-progress / el-tag              进度与状态
     el-descriptions                   顶部信息摘要
     ElMessage / ElMessageBox          轻提示与确认框（替代 window.alert / window.confirm）
   ========================================================================== */

import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, EditPen, Delete, View, House } from '@element-plus/icons-vue'
import ProjectDetailDialog from '../components/showcase/ProjectDetailDialog.vue'
import ArticleManager from '../components/article/ArticleManager.vue'
import { getStatusTone, STATUS_OPTIONS } from '../data/content.js'
import { useUserStore } from '../stores/useUserStore.js'
import { useProjectStore } from '../stores/useProjectStore.js'
import { useArticleStore } from '../stores/useArticleStore.js'
import { useUiStore } from '../stores/useUiStore.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const projectStore = useProjectStore()
const articleStore = useArticleStore()
const uiStore = useUiStore()

/* 需要渲染的数据全部经 storeToRefs 解构；方法继续从各自的 Store 上调用 */
const { account, isAuthed, profile } = storeToRefs(userStore)
const { projects, favoriteIds, total: projectTotal, avgProgress } = storeToRefs(projectStore)
const { total: articleTotal, publishedCount, draftCount, totalViews } = storeToRefs(articleStore)

/* ============================ 页面状态 ============================ */
/* 支持 ?tab=articles 这类深链接：别的页面可以直接把用户送到指定 Tab */
const TAB_KEYS = ['profile', 'projects', 'articles']
const initialTab = TAB_KEYS.includes(String(route.query.tab)) ? String(route.query.tab) : 'profile'
const activeTab = ref(initialTab)

/** 统一提示：把 ElMessage 包一层，方便一处改风格（也复用了原来的函数名） */
function showToast(text, type = 'success') {
  ElMessage({ message: text, type, duration: 2200, showClose: true })
}

/**
 * 切换 Tab 时把当前 Tab 写进地址栏 query，
 * 这样每个 Tab 都能被直接分享、刷新后也能保持。
 */
function onTabChange(key) {
  router.replace({ name: 'admin', query: { ...route.query, tab: key } })
}

/* ==================== ① 个人资料：el-form + 校验规则 ==================== */
/* 兴趣标签在数据层是数组，表单里用「逗号分隔的字符串」更好输入，
   所以草稿里多一个 interestTagsText 字段，保存时再拆回数组。 */
const profileFormRef = ref(null)
const profileDraft = reactive({
  name: '',
  enName: '',
  studentId: '',
  major: '',
  className: '',
  direction: '',
  city: '',
  email: '',
  phone: '',
  bio: '',
  interestTagsText: ''
})

/** 用 Store 里的资料重置草稿 */
function syncProfileDraft() {
  Object.assign(profileDraft, {
    ...profile.value,
    interestTagsText: (profile.value.interestTags || []).join(', ')
  })
}
syncProfileDraft()

/** 校验规则：交给 el-form 管理，模板里用 :rules 绑定 */
const profileRules = {
  name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  direction: [{ required: true, message: '方向不能为空', trigger: 'blur' }],
  bio: [
    { required: true, message: '个人简介不能为空', trigger: 'blur' },
    { min: 10, message: '个人简介至少 10 个字', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}

async function saveProfile() {
  if (!profileFormRef.value) return
  try {
    await profileFormRef.value.validate()
  } catch (e) {
    showToast('保存失败：请先修正标红的字段', 'error')
    return
  }
  // 兴趣标签：把「前端开发、Vue 3」这种逗号分隔的字符串拆成数组
  const tags = String(profileDraft.interestTagsText ?? '')
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean)

  const { interestTagsText, ...rest } = profileDraft
  userStore.saveProfile({ ...rest, interestTags: tags.length ? tags : profile.value.interestTags })
  showToast('个人资料已保存，回到首页即可看到效果')
  uiStore.pushLog(uiStore.stamp('[AdminView] 保存个人资料成功'))
}

function resetProfileDraft() {
  syncProfileDraft()
  profileFormRef.value?.clearValidate()
  showToast('已撤销修改，恢复为当前生效的资料', 'info')
}

/* ==================== ② 项目管理：el-table + el-dialog ==================== */
const projectDialogVisible = ref(false)
const projectFormRef = ref(null)
const editingId = ref('') // '' 表示新增模式
const projectDraft = reactive({})
const isCreating = computed(() => editingId.value === '')

/** 校验规则：编号唯一性用自定义 validator（要读 Store 判断是否重复） */
const projectRules = {
  id: [
    { required: true, message: '项目编号不能为空', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (isCreating.value && value && projectStore.getProject(String(value).trim())) {
          callback(new Error('该项目编号已存在'))
        } else callback()
      },
      trigger: 'blur'
    }
  ],
  name: [
    { required: true, message: '项目名称不能为空', trigger: 'blur' },
    { min: 2, message: '项目名称至少 2 个字', trigger: 'blur' }
  ],
  category: [{ required: true, message: '分类不能为空', trigger: 'blur' }],
  summary: [{ required: true, message: '一句话简介不能为空', trigger: 'blur' }]
}

function blankProject() {
  /* 编号交给 Store 的 suggestedId getter 推荐，避免和已有编号撞车 */
  return {
    id: projectStore.suggestedId,
    name: '',
    cover: '📦',
    accent: '#4f46e5',
    category: '前端开发',
    status: '计划中',
    progress: 0,
    summary: '',
    detail: '',
    tech: [],
    tags: [],
    repo: '',
    demo: '',
    startedAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
    highlights: []
  }
}

function startCreate() {
  editingId.value = ''
  Object.assign(projectDraft, blankProject())
  projectDialogVisible.value = true
  uiStore.pushLog(uiStore.stamp('[AdminView] 打开「新增项目」对话框'))
}

function startEdit(project) {
  editingId.value = project.id
  Object.assign(projectDraft, JSON.parse(JSON.stringify(project)))
  projectDialogVisible.value = true
  uiStore.pushLog(uiStore.stamp(`[AdminView] 打开「编辑项目」对话框：${project.name}`))
}

function cancelEdit() {
  projectDialogVisible.value = false
  projectFormRef.value?.clearValidate()
}

async function submitProject() {
  if (!projectFormRef.value) return
  try {
    await projectFormRef.value.validate()
  } catch (e) {
    showToast('保存失败：请先修正标红的字段', 'error')
    return
  }
  const d = projectDraft
  const payload = {
    ...d,
    id: String(d.id).trim(),
    name: String(d.name).trim(),
    progress: Number(d.progress),
    updatedAt: new Date().toISOString().slice(0, 10)
  }

  if (isCreating.value) {
    projectStore.addProject(payload)
    showToast(`已新增项目「${payload.name}」`)
  } else {
    projectStore.updateProject(editingId.value, payload)
    showToast(`已更新项目「${payload.name}」`)
  }
  projectDialogVisible.value = false
}

/** 删除确认改用 ElMessageBox：比 window.confirm 好看，也支持 Promise 流程 */
async function removeProject(project) {
  try {
    await ElMessageBox.confirm(
      `确定删除项目「${project.name}」吗？此操作不可撤销。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch (e) {
    return // 点取消
  }
  projectStore.removeProject(project.id)
  showToast(`已删除项目「${project.name}」`, 'warning')
}

async function resetAllProjects() {
  try {
    await ElMessageBox.confirm('确定把项目数据恢复为初始状态吗？你的新增与修改会丢失。', '恢复默认数据', {
      type: 'warning'
    })
  } catch (e) {
    return
  }
  projectStore.resetProjects()
  cancelEdit()
  showToast('项目数据已恢复初始值', 'info')
}

/* ==================== ③ 预览弹窗（复用实验二的 ProjectDetailDialog） ==================== */
const previewVisible = ref(false)
const previewProject = ref(null)

function openPreview(project) {
  previewProject.value = project
  previewVisible.value = true
}

/* ==================== ④ 退出登录 ==================== */
function doLogout() {
  userStore.logout()
  router.replace({ name: 'home' })
}

/* ============================== 生命周期 ============================== */
onMounted(() => {
  console.log('%c[实验四] 后台管理页（AdminView）挂载完成', 'color:#10b981;font-weight:bold;')
  console.log('[AdminView][mounted] 当前账号：', account.value)
  console.log('[AdminView][mounted] 说明：本页能挂载成功，说明路由守卫已放行（已登录）')
  console.log('[AdminView][mounted] Element Plus：el-tabs / el-table / el-form / el-dialog / ElMessageBox')

  // 双保险：万一有人绕过守卫直接渲染本组件，立刻送回登录页
  if (!isAuthed.value) {
    uiStore.pushLog(uiStore.stamp('[AdminView] 检测到未登录，replace 回登录页'))
    router.replace({ name: 'login', query: { redirect: '/admin' } })
  }
})
</script>

<template>
  <div class="view">
    <!-- ============ 顶部状态条 ============ -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div class="block-head">
          <div>
            <h2 class="block-head__title">⚙️ 后台管理</h2>
            <p class="block-head__sub">
              只有登录后的账号能看到这一页；所有修改即时生效于公开展示页
            </p>
          </div>
          <div class="block-head__actions">
            <el-tag type="success" effect="light" round>{{ account }}</el-tag>
            <el-button @click="router.push({ name: 'home' })">🏠 去首页</el-button>
            <el-button type="danger" plain @click="doLogout">退出登录</el-button>
          </div>
        </div>
      </template>

      <!-- el-descriptions：随时看一眼当前 Store 里的概况 -->
      <el-descriptions :column="4" border size="small" class="overview">
        <el-descriptions-item label="项目总数">{{ projectTotal }}</el-descriptions-item>
        <el-descriptions-item label="平均完成度">{{ avgProgress }}%</el-descriptions-item>
        <el-descriptions-item label="我的收藏">{{ favoriteIds.length }}</el-descriptions-item>
        <el-descriptions-item label="文章">
          {{ articleTotal }} 篇（发布 {{ publishedCount }} · 草稿 {{ draftCount }}）
        </el-descriptions-item>
      </el-descriptions>

      <!-- ★ el-tabs：三个管理页签；tab-change 时把页签写进 URL query -->
      <el-tabs v-model="activeTab" class="tabs" @tab-change="onTabChange">
        <el-tab-pane name="profile">
          <template #label><span>🧑‍💻 个人资料</span></template>
        </el-tab-pane>
        <el-tab-pane name="projects">
          <template #label><span>📁 项目管理 ({{ projectTotal }})</span></template>
        </el-tab-pane>
        <el-tab-pane name="articles">
          <template #label><span>📝 文章管理 ({{ articleTotal }})</span></template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- ================= Tab 1：个人资料 ================= -->
    <el-card v-if="activeTab === 'profile'" class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">🧑‍💻 修改个人资料</h2>
          <p class="block-head__sub">改动写入 useUserStore，首页（ProfileView）会立刻同步</p>
        </div>
      </template>

      <!-- el-form：:model 绑定草稿对象，:rules 绑定校验规则 -->
      <el-form
        ref="profileFormRef"
        :model="profileDraft"
        :rules="profileRules"
        label-width="96px"
        label-position="left"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="profileDraft.name" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="英文名">
              <el-input v-model="profileDraft.enName" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="学号">
              <el-input v-model="profileDraft.studentId" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="专业方向" prop="direction">
              <el-input v-model="profileDraft.direction" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="城市">
              <el-input v-model="profileDraft.city" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileDraft.email" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="兴趣标签">
              <el-input
                v-model="profileDraft.interestTagsText"
                placeholder="用逗号分隔，如：前端开发, Vue 3, 组件化"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="个人简介" prop="bio">
              <el-input v-model="profileDraft.bio" type="textarea" :rows="4" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="actions">
        <el-button type="primary" @click="saveProfile">💾 保存修改</el-button>
        <el-button @click="resetProfileDraft">撤销</el-button>
        <el-button @click="router.push({ name: 'home' })">🏠 去首页看效果</el-button>
      </div>
    </el-card>

    <!-- ================= Tab 2：项目管理 ================= -->
    <el-card v-else-if="activeTab === 'projects'" class="block" shadow="hover">
      <template #header>
        <div class="block-head">
          <div>
            <h2 class="block-head__title">📁 项目管理</h2>
            <p class="block-head__sub">
              el-table 列表 + el-dialog 新增/编辑；改动会同步到项目列表页与详情页
            </p>
          </div>
          <div class="block-head__actions">
            <el-button type="primary" :icon="Plus" @click="startCreate">新增项目</el-button>
            <el-button :icon="Refresh" @click="resetAllProjects">恢复默认数据</el-button>
          </div>
        </div>
      </template>

      <!-- ★ el-table：带边框、表头吸顶；data 直接绑 Store 的 projects -->
      <el-table :data="projects" border stripe style="width: 100%" max-height="520">
        <el-table-column prop="id" label="编号" width="80" />

        <el-table-column label="项目" min-width="240">
          <template #default="{ row }">
            <b>{{ row.cover }} {{ row.name }}</b>
            <p class="note">{{ row.summary }}</p>
          </template>
        </el-table-column>

        <el-table-column label="分类 / 状态" width="170">
          <template #default="{ row }">
            <el-tag type="primary" effect="light" size="small">{{ row.category }}</el-tag>
            <el-tag :type="getStatusTone(row.status) === 'ok' ? 'success' : getStatusTone(row.status) === 'warn' ? 'warning' : 'info'" effect="light" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="进度" width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :stroke-width="10"
              :color="row.accent"
              :show-text="false"
            />
            <span class="hint">{{ row.progress }}%</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="290" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :icon="EditPen" @click="startEdit(row)">编辑</el-button>
            <el-button size="small" :icon="View" @click="openPreview(row)">预览</el-button>
            <el-button size="small" @click="router.push({ name: 'project-detail', params: { id: row.id } })">
              详情
            </el-button>
            <el-button size="small" type="danger" plain :icon="Delete" @click="removeProject(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ================= ★ Tab 3：文章管理 =================
         直接复用 /articles/manage 独立页面所用的同一个 ArticleManager 组件：
         一处实现、两个入口，避免把「文章的增删改查」写两遍。 -->
    <el-card v-else class="block" shadow="hover">
      <template #header>
        <div class="block-head">
          <div>
            <h2 class="block-head__title">📝 文章管理</h2>
            <p class="block-head__sub">
              新增 / 编辑 / 删除 / 发布切换；改动会立刻同步到文章列表页与详情页
            </p>
          </div>
          <div class="block-head__actions">
            <el-tag type="primary" effect="light">共 {{ articleTotal }} 篇</el-tag>
            <el-tag type="success" effect="light">已发布 {{ publishedCount }}</el-tag>
            <el-tag type="info" effect="light">草稿 {{ draftCount }}</el-tag>
            <el-tag type="warning" effect="light">总阅读 {{ totalViews }}</el-tag>
            <el-button @click="router.push({ name: 'articles' })">📖 去文章列表</el-button>
          </div>
        </div>
      </template>

      <ArticleManager @notify="showToast" />
    </el-card>

    <!-- ============ 项目新增 / 编辑对话框（el-dialog） ============ -->
    <el-dialog
      v-model="projectDialogVisible"
      :title="isCreating ? '＋ 新增项目' : `✏️ 编辑项目：${projectDraft.name || projectDraft.id}`"
      width="720px"
      top="6vh"
      :close-on-click-modal="false"
    >
      <p class="dialog-sub">带表单校验：必填项、编号唯一性、进度范围都会检查</p>

      <el-form
        ref="projectFormRef"
        :model="projectDraft"
        :rules="projectRules"
        label-width="96px"
        label-position="left"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目编号" prop="id">
              <el-input v-model="projectDraft.id" :disabled="!isCreating" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="projectDraft.name" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="分类" prop="category">
              <el-input v-model="projectDraft.category" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="状态">
              <!-- el-select + el-option：下拉选择，替代原生 <select> -->
              <el-select v-model="projectDraft.status" style="width: 100%">
                <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="完成度">
              <!-- el-input-number：数字输入，自带上下步进与范围限制 -->
              <el-input-number
                v-model="projectDraft.progress"
                :min="0"
                :max="100"
                :step="5"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="封面 emoji">
              <el-input v-model="projectDraft.cover" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="一句话简介" prop="summary">
              <el-input v-model="projectDraft.summary" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细介绍">
              <el-input v-model="projectDraft.detail" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="submitProject">
          {{ isCreating ? '＋ 创建项目' : '💾 保存修改' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览弹窗：复用实验二的 ProjectDetailDialog，保持组件不闲置 -->
    <ProjectDetailDialog
      v-model:visible="previewVisible"
      :project="previewProject"
      :favorite="!!previewProject && projectStore.isFavorite(previewProject.id)"
      @toggle-favorite="previewProject && projectStore.toggleFavorite(previewProject.id)"
    >
      <template #extra="{ project }">
        <p class="dialog-tip">
          💡 这是后台的「预览」弹窗。想看到独立页面效果，请点列表里的
          <RouterLink :to="{ name: 'project-detail', params: { id: project.id } }">
            查看详情页
          </RouterLink>
          （对应路由 <code>/projects/{{ project.id }}</code>）。
        </p>
      </template>
    </ProjectDetailDialog>
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
  align-items: center;
}

.overview {
  margin-bottom: 12px;
}
.tabs {
  margin-top: 4px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.note {
  font-size: 12.2px;
  color: var(--muted);
  line-height: 1.65;
  margin-top: 4px;
  max-width: 360px;
}

.dialog-sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-bottom: 12px;
}

.dialog-tip {
  font-size: 12.5px;
  color: var(--muted);
  background: var(--soft);
  border: 1px dashed var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  line-height: 1.8;
}

.view :deep(a.btn) {
  text-decoration: none;
}
</style>
