<script setup>
/* ============================================================================
   ArticleListView —— 文章列表页（/articles，公开）
   ----------------------------------------------------------------------------
   本页是实验四新增的「公开内容页」，把 ProjectListView 的组织方式复用到文章上：

     ① 数据来源：useArticleStore
        ★ 用 storeToRefs 解构 state 与 getters —— 保持响应式的同时，
          数据（refs）与操作（store.xxx()）在代码里一眼可分
     ② 只展示「已发布」：草稿属于后台内容，访客看不到
     ③ 筛选条件（关键词 / 分类 / 标签 / 排序）留在组件里，
        因为「离开这一页就该忘掉」；而「分类列表」「总数」这类
        与页面无关的派生值放在 Store 的 getters 里 —— 这就是「状态归属」的划分依据
     ④ 打开详情走编程式导航：router.push({ name: 'article-detail', params: { id } })
   ========================================================================== */

import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Search } from '@element-plus/icons-vue'
import ActivityLog from '../components/common/ActivityLog.vue'
import ArticleCard from '../components/article/ArticleCard.vue'
import { useArticleStore } from '../stores/useArticleStore.js'
import { useUiStore } from '../stores/useUiStore.js'

const router = useRouter()
const articleStore = useArticleStore()
const uiStore = useUiStore()

/* ★ 数据全部走 storeToRefs；下面只用 refs，不再碰 articleStore.state */
const { publishedArticles, featuredArticles, categories, tagCloud, publishedCount, draftCount, totalViews } =
  storeToRefs(articleStore)
const { logs } = storeToRefs(uiStore)

/* ============================ 组件内部状态 ============================ */
/* 只影响本页面的筛选条件，离开页面即销毁，所以不进 Store */
const keyword = ref('')
const category = ref('')
const activeTag = ref('')
const sortBy = ref('updatedAt')

const sortOptions = [
  { value: 'updatedAt', label: '按更新时间' },
  { value: 'publishedAt', label: '按发布时间' },
  { value: 'views', label: '按阅读量' },
  { value: 'title', label: '按标题' }
]

/* ============================== computed ============================== */
/* 把「页面筛选条件」与「Store 里的已发布文章」组合起来 ——
   这一步刻意放在组件里：因为 keyword / category 是页面私有状态，
   放进 Store 就等于把页面状态污染成全局状态了。 */
const visibleArticles = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  let list = publishedArticles.value.filter((a) => {
    if (category.value && a.category !== category.value) return false
    if (activeTag.value && !(a.tags || []).includes(activeTag.value)) return false
    if (!kw) return true
    return (
      a.title.toLowerCase().includes(kw) ||
      a.summary.toLowerCase().includes(kw) ||
      a.category.toLowerCase().includes(kw) ||
      (a.tags || []).join(' ').toLowerCase().includes(kw)
    )
  })

  list = [...list]
  if (sortBy.value === 'publishedAt') list.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
  else if (sortBy.value === 'views') list.sort((a, b) => Number(b.views) - Number(a.views))
  else if (sortBy.value === 'title') list.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
  else list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  return list
})

/* 顶部概览：数字全部来自 Store 的 getters / state，没有硬编码 */
const statItems = computed(() => [
  { icon: '📝', label: '已发布文章', value: publishedCount.value, unit: '篇' },
  { icon: '📌', label: '置顶推荐', value: featuredArticles.value.length, unit: '篇', tone: 'warn' },
  { icon: '🗂️', label: '分类数', value: categories.value.length, unit: '类' },
  { icon: '👀', label: '总阅读量', value: totalViews.value, unit: '次', tone: 'ok' },
  { icon: '✍️', label: '草稿（仅后台可见）', value: draftCount.value, unit: '篇', tone: 'brand' }
])

const hasFilter = computed(() => !!keyword.value || !!category.value || !!activeTag.value)

/* =============================== watch =============================== */
watch([keyword, category, activeTag, sortBy], ([kw, cat, tag, sort]) => {
  uiStore.pushLog(
    uiStore.stamp(
      `[ArticleListView] 筛选 → 关键词「${kw || '空'}」· 分类「${cat || '全部'}」· 标签「${tag || '全部'}」· 排序「${sort}」`
    )
  )
})

/* ============================== 生命周期 ============================== */
onMounted(() => {
  console.log('%c[实验四] 文章列表页（ArticleListView）挂载完成', 'color:#4f46e5;font-weight:bold;')
  console.log('[ArticleListView][mounted] 已发布文章数：', publishedCount.value)
  console.log('[ArticleListView][mounted] 数据来源：useArticleStore（Pinia）')

  uiStore.pushLog(
    uiStore.stamp(`[ArticleListView] mounted · 已发布 ${publishedCount.value} 篇 / 草稿 ${draftCount.value} 篇`)
  )
})

/* ============================== 事件处理 ============================== */
/** 编程式导航：打开文章详情（动态路由 /articles/:id） */
function openArticle(article) {
  uiStore.pushLog(uiStore.stamp(`[ArticleListView] 跳转详情路由 /articles/${article.id}`))
  router.push({ name: 'article-detail', params: { id: article.id } })
}

function resetFilters() {
  keyword.value = ''
  category.value = ''
  activeTag.value = ''
  uiStore.pushLog(uiStore.stamp('[ArticleListView] 已清空筛选条件'))
}

function pickTag(name) {
  activeTag.value = activeTag.value === name ? '' : name
}
</script>

<template>
  <div class="view">
    <!-- ① 概览：数字来自 Store 的 getters，用 el-row/el-col + el-statistic 排版 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">📊 文章概览</h2>
          <p class="block-head__sub">
            统计值全部由 useArticleStore 的 getters 实时算出，页面不做任何二次加工
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

    <!-- ② 工具栏 -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div class="block-head">
          <div>
            <h2 class="block-head__title">📝 我的文章</h2>
            <p class="block-head__sub">
              列表只展示「已发布」；点卡片进入详情（动态路由 /articles/:id），打开一次阅读量 +1
            </p>
          </div>
          <div class="block-head__actions">
            <el-button @click="router.push({ name: 'projects' })">📁 去看项目</el-button>
            <el-button type="primary" plain @click="router.push({ name: 'articles-manage' })">
              ✍️ 文章管理（需登录）
            </el-button>
          </div>
        </div>
      </template>

      <div class="toolbar">
        <!-- el-input：带搜索图标与一键清空 -->
        <el-input
          v-model="keyword"
          class="toolbar__search"
          placeholder="搜索标题 / 摘要 / 分类 / 标签…"
          :prefix-icon="Search"
          clearable
        />

        <!-- el-select：分类筛选 -->
        <el-select v-model="category" class="toolbar__select" placeholder="全部分类" clearable>
          <el-option label="全部分类" value="" />
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>

        <!-- el-select：排序方式 -->
        <el-select v-model="sortBy" class="toolbar__select2">
          <el-option v-for="o in sortOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>

        <el-button v-if="hasFilter" @click="resetFilters">清空筛选</el-button>
        <span class="hint toolbar__count">命中 {{ visibleArticles.length }} / {{ publishedCount }} 篇</span>
      </div>

      <!-- 标签云：数据来自 Store 的 tagCloud getter（含出现次数）；用 el-tag 呈现 -->
      <div class="tagcloud">
        <span class="hint">按标签筛选：</span>
        <el-tag
          v-for="t in tagCloud"
          :key="t.name"
          class="chip"
          :type="activeTag === t.name ? 'primary' : 'info'"
          :effect="activeTag === t.name ? 'dark' : 'plain'"
          round
          @click="pickTag(t.name)"
        >
          {{ t.name }} <small>{{ t.count }}</small>
        </el-tag>
      </div>
    </el-card>

    <!-- ③ 文章网格 -->
    <el-card v-if="visibleArticles.length" class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">📚 文章列表</h2>
          <p class="block-head__sub">卡片组件与后台管理共用同一个 ArticleCard</p>
        </div>
      </template>
      <div class="grid">
        <ArticleCard
          v-for="a in visibleArticles"
          :key="a.id"
          :article="a"
          @open="openArticle"
        />
      </div>
    </el-card>

    <!-- el-empty：没有匹配结果时的空状态 -->
    <el-card v-else class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">🔍 没有匹配的文章</h2>
          <p class="block-head__sub">换个关键词，或清空筛选条件再看看</p>
        </div>
      </template>
      <el-empty description="没有匹配的文章">
        <el-button type="primary" plain @click="resetFilters">清空筛选条件</el-button>
      </el-empty>
    </el-card>

    <!-- ④ 活动日志：日志同样来自 Store（useUiStore） -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">⌨️ 状态观察日志</h2>
          <p class="block-head__sub">与 F12 控制台输出一致，方便边操作边截图写实验报告</p>
        </div>
      </template>
      <ActivityLog :logs="logs" title="文章列表页 · 活动日志" @clear="uiStore.clearLogs" />
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

/* ---------- 工具栏 ---------- */
.toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.toolbar__search {
  flex: 1 1 220px;
  min-width: 180px;
}
.toolbar__select {
  width: 150px;
}
.toolbar__select2 {
  width: 140px;
}
.toolbar__count {
  margin-left: auto;
}

/* ---------- 标签云 ---------- */
.tagcloud {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
}
.chip {
  cursor: pointer;
}
.chip small {
  font-size: 11px;
  opacity: 0.75;
}

/* ---------- 网格 ---------- */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
</style>
