/* ============================================================================
   实验四 · 文章 Store（Pinia）
   ----------------------------------------------------------------------------
   职责：实验四新增的「文章」内容全部由它管理，支撑三处界面：

     ArticleListView   公开列表：按「已发布」筛选 + 关键词 + 分类 + 排序
     ArticleDetailView 公开详情：动态路由 /articles/:id，打开一次阅读量 +1
     ArticleManager    后台管理：新增 / 编辑 / 删除 / 发布切换（需登录）

   ── 和项目 Store 的对比（同一个模式，换个数据域）─────────────────────────
     useProjectStore  侧重「进度 + 收藏」
     useArticleStore  侧重「发布状态 + 阅读量 + 标签」

   ── 为什么阅读量要写成 action ─────────────────────────────────────────────
     「读一篇文章」这件事会改 state（views + 1），凡是改 state 的动作，
     在 Pinia 里都必须走 action，这样 DevTools 的时间线才能完整记录到它。
     如果直接在组件里写 \`article.views++\`，虽然也能生效，但会绕过 DevTools。
   ========================================================================== */

import { defineStore } from 'pinia'
import { articleData, ARTICLE_STATUS, ARTICLE_STATUS_OPTIONS, getArticleStatusTone } from '../data/articles.js'

const deepClone = (value) => JSON.parse(JSON.stringify(value))
const today = () => new Date().toISOString().slice(0, 10)

export const useArticleStore = defineStore('article', {
  /* ------------------------------------------------------------------ state */
  state: () => ({
    /** 全部文章（含草稿） */
    articles: deepClone(articleData),
    /** 最近一次操作说明，后台操作回显用 */
    lastAction: ''
  }),

  /* ---------------------------------------------------------------- getters */
  getters: {
    total: (state) => state.articles.length,

    /** 已发布 / 草稿：列表页与后台统计条共用 */
    publishedArticles: (state) => state.articles.filter((a) => a.status === ARTICLE_STATUS.PUBLISHED),
    draftArticles: (state) => state.articles.filter((a) => a.status === ARTICLE_STATUS.DRAFT),

    publishedCount() {
      return this.publishedArticles.length
    },
    draftCount() {
      return this.draftArticles.length
    },

    /** 置顶推荐（只挑已发布的） */
    featuredArticles() {
      return this.publishedArticles.filter((a) => a.featured)
    },

    /** 分类去重：筛选下拉的选项，自动跟随数据变化 */
    categories: (state) => [...new Set(state.articles.map((a) => a.category))],

    /** 标签去重并统计出现次数，按次数倒序 —— 「标签云」的数据来源 */
    tagCloud: (state) => {
      const counter = {}
      state.articles.forEach((a) => (a.tags || []).forEach((t) => (counter[t] = (counter[t] || 0) + 1)))
      return Object.entries(counter)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-Hans-CN'))
    },

    /** 全部已发布文章的阅读量之和 */
    totalViews() {
      return this.publishedArticles.reduce((acc, a) => acc + Number(a.views || 0), 0)
    },

    /** 平均阅读时长，用于概览统计 */
    avgReadMinutes() {
      if (!this.publishedArticles.length) return 0
      const sum = this.publishedArticles.reduce((acc, a) => acc + Number(a.readMinutes || 0), 0)
      return Math.round((sum / this.publishedArticles.length) * 10) / 10
    },

    /** 按更新时间倒序（列表页默认排序用它） */
    sortedByUpdated: (state) =>
      [...state.articles].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),

    /** getter 里用到的两个映射函数，直接透出给视图层复用 */
    statusOptions: () => ARTICLE_STATUS_OPTIONS,
    statusTone: () => getArticleStatusTone,

    /** ★ 函数式 getter：按 id 查文章，找不到返回 null */
    getArticle: (state) => (id) => state.articles.find((a) => a.id === String(id)) || null,

    /** 函数式 getter：某一篇文章在「已发布」序列中的上一篇 / 下一篇 */
    neighbors: (state) => (id) => {
      const list = state.articles.filter((a) => a.status === ARTICLE_STATUS.PUBLISHED)
      const i = list.findIndex((a) => a.id === String(id))
      return {
        prev: i > 0 ? list[i - 1] : null,
        next: i > -1 && i < list.length - 1 ? list[i + 1] : null
      }
    },

    /** 新建文章时推荐的编号 */
    suggestedId: (state) => {
      const used = new Set(state.articles.map((a) => a.id))
      let n = state.articles.length + 1
      while (used.has(`a${n}`)) n++
      return `a${n}`
    }
  },

  /* ---------------------------------------------------------------- actions */
  actions: {
    /** 新增：默认进草稿箱，避免误发 */
    addArticle(article) {
      this.articles.unshift(article)
      this.lastAction = `新增文章「${article.title}」`
    },

    updateArticle(id, patch) {
      const i = this.articles.findIndex((a) => a.id === id)
      if (i === -1) return false
      this.articles[i] = { ...this.articles[i], ...patch, id, updatedAt: today() }
      this.lastAction = `更新文章「${this.articles[i].title}」`
      return true
    },

    removeArticle(id) {
      const target = this.getArticle(id)
      this.articles = this.articles.filter((a) => a.id !== id)
      this.lastAction = `删除文章「${target ? target.title : id}」`
    },

    /** 发布 / 撤回：草稿 ⇄ 已发布 */
    togglePublish(id) {
      const article = this.getArticle(id)
      if (!article) return null
      const next =
        article.status === ARTICLE_STATUS.PUBLISHED ? ARTICLE_STATUS.DRAFT : ARTICLE_STATUS.PUBLISHED
      article.status = next
      /* 第一次发布时补上发布日期 */
      if (next === ARTICLE_STATUS.PUBLISHED && !article.publishedAt) article.publishedAt = today()
      article.updatedAt = today()
      this.lastAction = `「${article.title}」已${next === ARTICLE_STATUS.PUBLISHED ? '发布' : '撤回为草稿'}`
      return next
    },

    toggleFeatured(id) {
      const article = this.getArticle(id)
      if (!article) return null
      article.featured = !article.featured
      this.lastAction = `「${article.title}」${article.featured ? '已置顶' : '已取消置顶'}`
      return article.featured
    },

    /** 阅读量 +1：详情页每次挂载都会调用 */
    incrementViews(id) {
      const article = this.getArticle(id)
      if (!article) return 0
      article.views = Number(article.views || 0) + 1
      return article.views
    },

    resetArticles() {
      this.articles = deepClone(articleData)
      this.lastAction = '文章数据已恢复初始值'
    }
  },

  /* -------------------------------------------------------------- 持久化配置 */
  persist: {
    key: 'article',
    paths: ['articles']
  }
})

export { ARTICLE_STATUS }
