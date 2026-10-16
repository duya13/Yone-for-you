<script setup>
/* ============================================================================
   ArticleDetailView —— 文章详情页（动态路由 /articles/:id）
   ----------------------------------------------------------------------------
   本页把实验三「动态路由」的套路完整复用到文章上，并多演示两件 Pinia 的事：

     ① 用 Store 的「函数式 getter」取数据
          const article = computed(() => articleStore.getArticle(id))
        id 变化时 computed 自动重算，不需要手动监听数组变化

     ② 用 action 制造一次 state 变更
          进入页面时调用 articleStore.incrementViews(id)
        阅读量是 state 的一部分，改动必须走 action —— 这样在 Vue DevTools 的
        Pinia 时间线里能看到「谁在什么时候把 views 加了一」

   另外还演示：正文的极简解析（## 标题 / - 列表 / ``` 代码块 / | 表格 |）
   全部由 computed 完成，模板只负责渲染，这也是「派生数据用 computed」的体现。
   ========================================================================== */

import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import BaseCard from '../components/common/BaseCard.vue'
import BaseTag from '../components/common/BaseTag.vue'
import ActivityLog from '../components/common/ActivityLog.vue'
import { getArticleStatusTone } from '../data/articles.js'
import { useArticleStore } from '../stores/useArticleStore.js'
import { useUiStore } from '../stores/useUiStore.js'

/* 路由表里写了 props: true，所以 :id 会作为 prop 传进来 */
const props = defineProps({
  id: { type: String, default: '' }
})

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const uiStore = useUiStore()

const { logs } = storeToRefs(uiStore)

/* 优先用 prop（props:true 传来的），没有就退回 route.params（容错写法） */
const articleId = computed(() => props.id || String(route.params.id || ''))

/* ★ 用 Store 的函数式 getter 取当前文章；找不到返回 null */
const article = computed(() => articleStore.getArticle(articleId.value))
const notFound = computed(() => !article.value)

/* 上一篇 / 下一篇（同样来自 Store 的 getter） */
const neighbors = computed(() => articleStore.neighbors(articleId.value))

/* ---------------------------------------------------------------------------
   正文解析：把 content 里的极简 Markdown 转成可渲染的块数组。
   放在 computed 里 → 只有 article 变化时才重新解析，模板重渲染不会重复计算。
   --------------------------------------------------------------------------- */
const blocks = computed(() => {
  if (!article.value) return []
  const lines = String(article.value.content || '').split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    /* 代码块：``` 开头 / 结尾 */
    if (line.trim().startsWith('```')) {
      const code = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++ // 跳过结束的 ```
      out.push({ type: 'code', text: code.join('\n') })
      continue
    }

    /* 小标题：## xxx */
    if (/^#{2,3}\s+/.test(line)) {
      out.push({ type: 'h', text: line.replace(/^#{2,3}\s+/, '') })
      i++
      continue
    }

    /* 无序列表：连续的 - xxx */
    if (/^\s*-\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ''))
        i++
      }
      out.push({ type: 'ul', items })
      continue
    }

    /* 表格：连续以 | 开头的行；第二行是 | --- | 分隔行，跳过 */
    if (line.trim().startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const raw = lines[i].trim()
        i++
        if (/^\|[\s:|-]+\|$/.test(raw)) continue // 分隔行
        rows.push(
          raw
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim())
        )
      }
      if (rows.length) out.push({ type: 'table', rows })
      continue
    }

    /* 空行：跳过（段落之间靠 margin 分隔） */
    if (!line.trim()) {
      i++
      continue
    }

    /* 其余：普通段落 */
    out.push({ type: 'p', text: line })
    i++
  }

  return out
})

/* =============================== watch =============================== */
/* 组件复用：/articles/a1 → /articles/a2 时组件不会重建，只是 params 变了 */
watch(
  articleId,
  (id, oldId) => {
    console.log('[ArticleDetailView][watch route.params.id]', oldId, '→', id)
    uiStore.pushLog(uiStore.stamp(`[ArticleDetailView] 路由参数变化：${oldId || '(空)'} → ${id}`))
    /* 换文章时重新计数（有效文章才计） */
    if (articleStore.getArticle(id)) articleStore.incrementViews(id)
  },
  { immediate: true }
)

onMounted(() => {
  console.log('%c[实验四] 文章详情页（ArticleDetailView）挂载完成', 'color:#4f46e5;font-weight:bold;')
  console.log('[ArticleDetailView][mounted] route.fullPath =', route.fullPath)
  console.log('[ArticleDetailView][mounted] 命中文章 =', article.value?.title || '未找到')
  console.log('[ArticleDetailView][mounted] 阅读量已 +1（通过 action incrementViews）')

  uiStore.pushLog(
    uiStore.stamp(
      `[ArticleDetailView] mounted · ${article.value ? `打开《${article.value.title}》，阅读量 +1` : `无效地址 ${route.fullPath}`}`
    )
  )
})

/* ============================== 导航操作 ============================== */
function goArticle(id) {
  router.push({ name: 'article-detail', params: { id } })
}

function backToList() {
  uiStore.pushLog(uiStore.stamp('[ArticleDetailView] router.push 返回文章列表'))
  router.push({ name: 'articles' })
}

function escapeInvalid() {
  uiStore.pushLog(uiStore.stamp(`[ArticleDetailView] 无效地址 ${route.fullPath} → replace 到文章列表`))
  router.replace({ name: 'articles' })
}
</script>

<template>
  <div class="view">
    <!-- ================= 正常情况 ================= -->
    <template v-if="article">
      <BaseCard :icon="article.cover" :title="article.title" :subtitle="`当前路由：/articles/:id，匹配到的 id = ${articleId}`">
        <template #actions>
          <BaseTag :label="article.category" tone="brand" />
          <BaseTag :label="article.status" :tone="getArticleStatusTone(article.status)" />
          <BaseTag v-if="article.featured" label="置顶" tone="warn" />
        </template>

        <header class="hero" :style="{ background: `${article.accent}1a` }">
          <span class="hero__cover">{{ article.cover }}</span>
          <div class="hero__titles">
            <h3 class="hero__name">{{ article.title }}</h3>
            <p class="hero__meta">
              ✍️ {{ article.author }} · 📅 {{ article.publishedAt || '未发布' }} · ⏱️
              {{ article.readMinutes }} 分钟 · 👀 {{ article.views }} 次阅读
            </p>
            <div class="hero__tags">
              <BaseTag v-for="t in article.tags" :key="t" :label="t" tone="hollow" />
            </div>
          </div>
        </header>

        <p class="summary">{{ article.summary }}</p>

        <!-- ============ 正文：由 computed 解析后逐块渲染 ============ -->
        <article class="content">
          <template v-for="(b, i) in blocks" :key="i">
            <h4 v-if="b.type === 'h'" class="content__h">{{ b.text }}</h4>

            <ul v-else-if="b.type === 'ul'" class="content__ul">
              <li v-for="(it, j) in b.items" :key="j">{{ it }}</li>
            </ul>

            <pre v-else-if="b.type === 'code'" class="content__code"><code>{{ b.text }}</code></pre>

            <div v-else-if="b.type === 'table'" class="content__table-wrap">
              <table class="content__table">
                <tbody>
                  <tr v-for="(row, r) in b.rows" :key="r">
                    <td v-for="(cell, c) in row" :key="c">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p v-else class="content__p">{{ b.text }}</p>
          </template>
        </article>

        <template #footer>
          <div class="nav-actions">
            <button class="btn sm" type="button" @click="backToList">📋 返回文章列表（push）</button>
            <button v-if="neighbors.prev" class="btn sm" type="button" @click="goArticle(neighbors.prev.id)">
              ← 上一篇：{{ neighbors.prev.id }}
            </button>
            <button v-if="neighbors.next" class="btn sm" type="button" @click="goArticle(neighbors.next.id)">
              下一篇：{{ neighbors.next.id }} →
            </button>
            <RouterLink class="btn sm" :to="{ name: 'articles-manage' }">✍️ 去后台修改</RouterLink>
          </div>
        </template>
      </BaseCard>
    </template>

    <!-- ================= 无效地址 ================= -->
    <template v-else>
      <BaseCard icon="🚫" title="没有找到这篇文章" subtitle="动态路由参数校验失败时的兜底页面">
        <p class="invalid">
          地址中的参数 <code>id = {{ articleId || '(空)' }}</code> 在文章数据里不存在。<br />
          可用的文章编号：<code>{{ articleStore.articles.map((a) => a.id).join('、') }}</code>
        </p>

        <template #footer>
          <div class="nav-actions">
            <button class="btn sm primary" type="button" @click="escapeInvalid">
              🧹 离开这个无效地址（replace 到列表）
            </button>
            <button class="btn sm" type="button" @click="backToList">📋 返回文章列表</button>
            <RouterLink class="btn sm" :to="{ name: 'home' }">🏠 回首页</RouterLink>
          </div>
        </template>
      </BaseCard>
    </template>

    <!-- ================= 日志 ================= -->
    <BaseCard>
      <ActivityLog :logs="logs" title="文章详情页 · 活动日志" @clear="uiStore.clearLogs" />
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
.hero__meta {
  font-size: 12.5px;
  color: var(--muted);
  margin-bottom: 8px;
}
.hero__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.summary {
  font-size: 13.8px;
  line-height: 1.85;
  color: var(--muted);
  border-left: 3px solid var(--brand);
  background: var(--soft);
  border-radius: 0 10px 10px 0;
  padding: 10px 14px;
  margin-bottom: 6px;
}

/* ---------- 正文排版 ---------- */
.content {
  margin-top: 14px;
}
.content__h {
  font-size: 15px;
  font-weight: 700;
  margin: 18px 0 8px;
  padding-left: 10px;
  border-left: 3px solid var(--brand);
}
.content__p {
  font-size: 13.9px;
  line-height: 2;
  margin: 10px 0;
}
.content__ul {
  margin: 8px 0 8px 4px;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.content__ul li {
  font-size: 13.6px;
  line-height: 1.85;
  color: var(--muted);
}
.content__code {
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  margin: 12px 0;
  overflow-x: auto;
}
.content__code code {
  background: transparent;
  color: var(--text);
  font-size: 12.4px;
  line-height: 1.8;
  padding: 0;
  white-space: pre;
}
.content__table-wrap {
  overflow-x: auto;
  margin: 12px 0;
}
.content__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.content__table td {
  border: 1px solid var(--line);
  padding: 8px 11px;
  vertical-align: top;
  line-height: 1.7;
}
.content__table tr:first-child td {
  background: var(--soft);
  font-weight: 600;
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
