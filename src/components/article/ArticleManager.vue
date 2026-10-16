<script setup>
/* ============================================================================
   ArticleManager —— 文章增删改查（后台管理）
   ----------------------------------------------------------------------------
   为什么把它抽成组件，而不是直接写在页面里？
     它被两处使用：
       · src/views/ArticleManageView.vue  → 独立页面 /articles/manage
       · AdminView 的「文章管理」Tab      → 内嵌在后台页里
     一处实现、两个入口，避免把同一套增删改查维护两遍 ——
     这正对应指导书 4.1 第 6 条「实现文章信息的增删改查」。

   ── 本组件演示的 Pinia 用法 ───────────────────────────────────────────────
     · storeToRefs 解构 articles / 统计值（保持响应式）
     · 所有写操作都走 useArticleStore 的 actions，组件里没有一处直接改 state
     · 新增 / 编辑用「草稿对象」，点保存才提交 ——
       这样「取消」就是简单地丢掉草稿，Store 完全没被污染

   ── 实验四第二次：换用 Element Plus ────────────────────────────────────────
     el-table + el-table-column   文章列表（含状态列、操作列、空数据提示）
     el-dialog + el-form          新增 / 编辑文章（指导书要求的「对话框 + 表单」）
     el-input / el-select / el-input-number / el-switch / el-color-picker  各类控件
     el-radio-group               表格视图 / 卡片视图切换
     el-statistic                 顶部统计数字
     el-tag                       状态与分类
     ElMessageBox                 删除 / 恢复默认数据的确认
   ========================================================================== */

import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessageBox } from 'element-plus'
import { Plus, Refresh, EditPen, Delete, View, Star, StarFilled } from '@element-plus/icons-vue'
import ArticleCard from './ArticleCard.vue'
import { ARTICLE_STATUS_OPTIONS } from '../../data/articles.js'
import { useArticleStore } from '../../stores/useArticleStore.js'
import { useUiStore } from '../../stores/useUiStore.js'

const emit = defineEmits({
  /** 向上报告一条提示文案，由父组件决定怎么显示（ElMessage / 提示条） */
  notify: null
})

const articleStore = useArticleStore()
const uiStore = useUiStore()

/* ★ 数据走 storeToRefs；动作（addArticle…）继续从 articleStore 上调用 */
const { articles, total, publishedCount, draftCount, totalViews } = storeToRefs(articleStore)

const notify = (msg) => {
  emit('notify', msg)
  uiStore.pushLog(uiStore.stamp(`[ArticleManager] ${msg}`))
}

/* ------------------------------ 页面状态 ------------------------------ */
const viewMode = ref('table') // 'table' | 'grid'
const dialogVisible = ref(false)
const formRef = ref(null)
const editingId = ref('') // '' 表示新增模式

const draft = reactive({
  id: '',
  title: '',
  cover: '📝',
  accent: '#4f46e5',
  category: '学习笔记',
  tagsText: '',
  status: '草稿',
  featured: false,
  author: '殷康竣',
  summary: '',
  content: '',
  publishedAt: '',
  updatedAt: '',
  views: 0,
  readMinutes: 3
})

const isCreating = computed(() => editingId.value === '')

const deepClone = (v) => JSON.parse(JSON.stringify(v))
const today = () => new Date().toISOString().slice(0, 10)

/** 顶部统计：交给 el-row / el-col + el-statistic 渲染 */
const statItems = computed(() => [
  { icon: '📚', label: '文章总数', value: total.value, suffix: '篇' },
  { icon: '✅', label: '已发布', value: publishedCount.value, suffix: '篇' },
  { icon: '📝', label: '草稿', value: draftCount.value, suffix: '篇' },
  { icon: '👀', label: '总阅读量', value: totalViews.value, suffix: '次' }
])

/* ------------------------------ 表单校验规则 ------------------------------ */
const rules = {
  id: [
    { required: true, message: '文章编号不能为空', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (isCreating.value && value && articleStore.getArticle(String(value).trim())) {
          callback(new Error('该文章编号已存在'))
        } else callback()
      },
      trigger: 'blur'
    }
  ],
  title: [
    { required: true, message: '标题不能为空', trigger: 'blur' },
    { min: 2, message: '标题至少 2 个字', trigger: 'blur' }
  ],
  category: [{ required: true, message: '分类不能为空', trigger: 'blur' }],
  summary: [{ required: true, message: '一句话摘要不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '正文不能为空', trigger: 'blur' }],
  readMinutes: [
    {
      validator: (_rule, value, callback) => {
        const n = Number(value)
        if (Number.isNaN(n) || n <= 0) callback(new Error('阅读时长需为正数'))
        else callback()
      },
      trigger: 'change'
    }
  ]
}

/* ------------------------------ 新增 / 编辑 ------------------------------ */
function blankArticle() {
  return {
    id: articleStore.suggestedId,
    title: '',
    cover: '📝',
    accent: '#4f46e5',
    category: '学习笔记',
    tagsText: '',
    status: '草稿',
    featured: false,
    author: '殷康竣',
    summary: '',
    content: '',
    publishedAt: '',
    updatedAt: today(),
    views: 0,
    readMinutes: 3
  }
}

function startCreate() {
  editingId.value = ''
  Object.assign(draft, blankArticle())
  dialogVisible.value = true
  notify('开始新增文章')
}

function startEdit(article) {
  editingId.value = article.id
  Object.assign(draft, {
    ...deepClone(article),
    /* 标签在表单里用逗号分隔的字符串更好输入，保存时再拆回数组 */
    tagsText: (article.tags || []).join(', ')
  })
  dialogVisible.value = true
  uiStore.pushLog(uiStore.stamp(`[ArticleManager] 开始编辑「${article.title}」`))
}

function cancelEdit() {
  dialogVisible.value = false
  formRef.value?.clearValidate()
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    notify('保存失败：请先修正标红的字段')
    return
  }

  const tags = String(draft.tagsText ?? '')
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean)

  const { tagsText, ...rest } = draft
  const payload = {
    ...rest,
    id: String(draft.id).trim(),
    title: String(draft.title).trim(),
    tags,
    readMinutes: Number(draft.readMinutes),
    updatedAt: today()
  }
  /* 直接发布时补上发布日期 */
  if (payload.status === '已发布' && !payload.publishedAt) payload.publishedAt = today()

  if (isCreating.value) {
    articleStore.addArticle(payload)
    notify(`✅ 已新增文章「${payload.title}」`)
  } else {
    articleStore.updateArticle(editingId.value, payload)
    notify(`✅ 已更新文章「${payload.title}」`)
  }
  cancelEdit()
}

/* ------------------------------ 其它操作 ------------------------------ */
async function removeArticle(article) {
  try {
    await ElMessageBox.confirm(
      `确定删除文章「${article.title}」吗？此操作不可撤销。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }
  articleStore.removeArticle(article.id)
  if (editingId.value === article.id) cancelEdit()
  notify(`🗑️ 已删除文章「${article.title}」`)
}

function togglePublish(article) {
  const next = articleStore.togglePublish(article.id)
  notify(`「${article.title}」已${next === '已发布' ? '发布' : '撤回为草稿'}`)
}

function toggleFeatured(article) {
  const on = articleStore.toggleFeatured(article.id)
  notify(`「${article.title}」${on ? '已置顶' : '已取消置顶'}`)
}

async function resetAll() {
  try {
    await ElMessageBox.confirm('确定把文章数据恢复为初始状态吗？你的新增与修改会丢失。', '恢复默认数据', {
      type: 'warning'
    })
  } catch (e) {
    return
  }
  articleStore.resetArticles()
  cancelEdit()
  notify('↩️ 文章数据已恢复初始值')
}
</script>

<template>
  <div class="mgr">
    <!-- ============ 统计条：el-row / el-col + el-statistic ============ -->
    <el-row :gutter="12" class="stats">
      <el-col v-for="item in statItems" :key="item.label" :xs="12" :sm="6">
        <div class="stat">
          <el-statistic :value="item.value">
            <template #prefix><span class="stat__icon">{{ item.icon }}</span></template>
            <template #suffix><span class="stat__suffix">{{ item.suffix }}</span></template>
          </el-statistic>
          <span class="stat__label">{{ item.label }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- ============ 工具栏 ============ -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="startCreate">新增文章</el-button>
      <el-button :icon="Refresh" @click="resetAll">恢复默认数据</el-button>

      <!-- el-radio-group 做「表格 / 卡片」视图切换 -->
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button value="table">☰ 表格</el-radio-button>
        <el-radio-button value="grid">▦ 卡片</el-radio-button>
      </el-radio-group>

      <span class="hint">数据来自 useArticleStore，共 {{ articles.length }} 条（含草稿）</span>
    </div>

    <!-- ============ 表格视图：el-table ============ -->
    <el-table
      v-if="viewMode === 'table'"
      :data="articles"
      border
      stripe
      max-height="560"
      style="width: 100%"
    >
      <el-table-column prop="id" label="编号" width="70" />

      <el-table-column label="标题" min-width="260">
        <template #default="{ row }">
          <b>{{ row.cover }} {{ row.title }}</b>
          <p class="note">{{ row.summary }}</p>
        </template>
      </el-table-column>

      <el-table-column label="分类" width="110">
        <template #default="{ row }">
          <el-tag type="primary" effect="light" size="small">{{ row.category }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === '已发布' ? 'success' : 'info'" effect="light" size="small">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="置顶" width="80" align="center">
        <template #default="{ row }">
          <!-- el-switch：直接以开关形式切换置顶状态 -->
          <el-switch
            :model-value="row.featured"
            @update:model-value="toggleFeatured(row)"
          />
        </template>
      </el-table-column>

      <el-table-column prop="views" label="阅读量" width="90" sortable />

      <el-table-column label="操作" width="330" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :icon="EditPen" @click="startEdit(row)">编辑</el-button>
          <el-button size="small" @click="togglePublish(row)">
            {{ row.status === '已发布' ? '撤回' : '发布' }}
          </el-button>
          <el-button
            size="small"
            type="warning"
            plain
            :icon="row.featured ? StarFilled : Star"
            @click="toggleFeatured(row)"
          >
            {{ row.featured ? '取消置顶' : '置顶' }}
          </el-button>
          <el-button
            size="small"
            :icon="View"
            @click="$router.push({ name: 'article-detail', params: { id: row.id } })"
          >
            查看
          </el-button>
          <el-button size="small" type="danger" plain :icon="Delete" @click="removeArticle(row)">
            删除
          </el-button>
        </template>
      </el-table-column>

      <!-- 空数据：el-table 自带空状态，这里换成更明确的文案 -->
      <template #empty>
        <el-empty description="暂无文章，点上方「新增文章」创建一篇" />
      </template>
    </el-table>

    <!-- ============ 卡片视图：复用 ArticleCard ============ -->
    <div v-else class="grid">
      <ArticleCard
        v-for="a in articles"
        :key="a.id"
        :article="a"
        @open="startEdit"
        @remove="removeArticle"
        @toggle-publish="togglePublish"
      >
        <template #actions="{ article }">
          <el-button size="small" @click="startEdit(article)">编辑</el-button>
          <el-button size="small" @click="togglePublish(article)">
            {{ article.status === '已发布' ? '撤回' : '发布' }}
          </el-button>
          <el-button size="small" type="danger" plain @click="removeArticle(article)">删除</el-button>
        </template>
      </ArticleCard>
    </div>

    <!-- ============ 新增 / 编辑对话框：el-dialog + el-form ============ -->
    <el-dialog
      v-model="dialogVisible"
      :title="isCreating ? '＋ 新增文章' : `✏️ 编辑文章：${draft.title || draft.id}`"
      width="760px"
      top="5vh"
      :close-on-click-modal="false"
    >
      <p class="dialog-sub">必填项、编号唯一性、阅读时长范围都会检查</p>

      <el-form ref="formRef" :model="draft" :rules="rules" label-width="96px" label-position="left">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="文章编号" prop="id">
              <el-input v-model="draft.id" :disabled="!isCreating" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="draft.title" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="分类" prop="category">
              <el-input v-model="draft.category" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="状态">
              <el-select v-model="draft.status" style="width: 100%">
                <el-option v-for="s in ARTICLE_STATUS_OPTIONS" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="封面 emoji">
              <el-input v-model="draft.cover" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="主色">
              <!-- el-color-picker：取色器，用来选文章卡片的主色 -->
              <el-color-picker v-model="draft.accent" />
              <span class="hint color-hint">{{ draft.accent }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="阅读时长" prop="readMinutes">
              <el-input-number v-model="draft.readMinutes" :min="1" :max="120" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="置顶推荐">
              <el-switch v-model="draft.featured" active-text="置顶" inactive-text="不置顶" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标签">
              <el-input v-model="draft.tagsText" placeholder="用逗号分隔，如：Pinia, 学习笔记" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="一句话摘要" prop="summary">
              <el-input v-model="draft.summary" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="正文" prop="content">
              <el-input
                v-model="draft.content"
                type="textarea"
                :rows="9"
                placeholder="支持极简 Markdown：## 小标题 / - 列表 / 三反引号代码块"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="submit">
          {{ isCreating ? '＋ 创建文章' : '💾 保存修改' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mgr {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ---------- 统计条 ---------- */
.stat {
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 10px 13px;
  margin-bottom: 10px;
}
.stat__icon {
  font-size: 13px;
  margin-right: 4px;
}
.stat__suffix {
  font-size: 12px;
  color: var(--muted);
  margin-left: 2px;
}
.stat__label {
  display: block;
  font-size: 12.3px;
  color: var(--muted);
  margin-top: 2px;
}
.stat :deep(.el-statistic__content) {
  font-size: 20px;
  font-weight: 700;
}

/* ---------- 工具栏 ---------- */
.toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.toolbar .hint {
  margin-left: auto;
}

.note {
  font-size: 12.2px;
  color: var(--muted);
  line-height: 1.65;
  margin-top: 4px;
  max-width: 400px;
}

/* ---------- 卡片视图 ---------- */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 14px;
}

.dialog-sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-bottom: 12px;
}
.color-hint {
  margin-left: 10px;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
