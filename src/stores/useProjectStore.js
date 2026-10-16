/* ============================================================================
   实验四 · 项目 Store（Pinia）
   ----------------------------------------------------------------------------
   职责：把「项目列表 + 我的收藏」从实验三的 useAppStore 里独立出来，
        并补上完整的增删改查（指导书 4.1 第 6 条：项目信息的增删改查）。

   谁在用这一份数据？
     · ProjectListView  列表 / 筛选 / 排序 / 收藏
     · ProjectDetailView 动态路由 /projects/:id 取单个项目
     · ProjectsLayout   父路由的子导航快链
     · AdminView        后台项目管理（增删改）
     · TheHeader        顶部收藏数徽标
   五个位置跨了四层组件树，这正是「必须进 Store」的典型信号。

   ── getters 与「函数式 getter」────────────────────────────────────────────
     普通 getter 返回计算好的值：total / avgProgress / categories
     需要传参的查询写成返回函数的 getter：getProject(id) / isFavorite(id)
     返回函数的 getter 不会被缓存，这点和 computed 的缓存语义不同，值得注意。

   ── 持久化 ───────────────────────────────────────────────────────────────
     只持久化 projects 与 favoriteIds；两者正好是「用户改过的数据」。
   ========================================================================== */

import { defineStore } from 'pinia'
import { projectData, STATUS_OPTIONS } from '../data/content.js'

const deepClone = (value) => JSON.parse(JSON.stringify(value))

export const useProjectStore = defineStore('project', {
  /* ------------------------------------------------------------------ state */
  state: () => ({
    /** 项目列表：初始值来自 data/content.js，登录后由 localStorage 回填覆盖 */
    projects: deepClone(projectData),
    /** 收藏的项目 id 列表 */
    favoriteIds: [],
    /** 最近一次操作说明，后台用来做「操作回显」 */
    lastAction: ''
  }),

  /* ---------------------------------------------------------------- getters */
  getters: {
    /** 项目总数 */
    total: (state) => state.projects.length,

    /** 按状态计数 —— 后台与列表页的统计条共用 */
    statusCount: (state) => (status) => state.projects.filter((p) => p.status === status).length,

    doneCount: (state) => state.projects.filter((p) => p.status === '已完成').length,
    doingCount: (state) => state.projects.filter((p) => p.status === '进行中').length,
    planningCount: (state) => state.projects.filter((p) => p.status === '计划中').length,

    /** 平均完成度（保留整数，列表页统计条直接用） */
    avgProgress: (state) => {
      if (!state.projects.length) return 0
      const sum = state.projects.reduce((acc, p) => acc + Number(p.progress || 0), 0)
      return Math.round(sum / state.projects.length)
    },

    /** 分类去重列表：筛选下拉框的选项来源，不需要手写 */
    categories: (state) => [...new Set(state.projects.map((p) => p.category))],

    /** 可供选择的状态选项（放在数据层作为唯一来源） */
    statusOptions: () => STATUS_OPTIONS,

    /** 收藏的项目对象（不是 id），供「我的收藏」区块直接渲染 */
    favoriteProjects: (state) => state.projects.filter((p) => state.favoriteIds.includes(p.id)),

    /**
     * ★ 函数式 getter：按 id 查项目。
     * 用法和普通方法一样：store.getProject('p1')
     * 返回 null 表示不存在 —— 详情页据此走「无效地址」分支。
     */
    getProject: (state) => (id) => state.projects.find((p) => p.id === String(id)) || null,

    /** 函数式 getter：判断是否已收藏 */
    isFavorite: (state) => (id) => state.favoriteIds.includes(String(id)),

    /** 该项目的上一个 / 下一个（详情页「上一个 / 下一个」按钮用） */
    neighbors: (state) => (id) => {
      const i = state.projects.findIndex((p) => p.id === String(id))
      return {
        prev: i > 0 ? state.projects[i - 1] : null,
        next: i > -1 && i < state.projects.length - 1 ? state.projects[i + 1] : null
      }
    },

    /** 新建项目时推荐的下一个编号（避开已占用的编号） */
    suggestedId: (state) => {
      const used = new Set(state.projects.map((p) => p.id))
      let n = state.projects.length
      while (used.has(`p${n}`)) n++
      return `p${n}`
    }
  },

  /* ---------------------------------------------------------------- actions */
  actions: {
    /** 新增：整条记录由页面组装好（含 id / 时间戳），Store 只负责入库 */
    addProject(project) {
      this.projects.unshift(project)
      this.lastAction = `新增项目「${project.name}」`
    },

    /** 修改：按 id 覆盖，保持数组顺序不变 */
    updateProject(id, patch) {
      const i = this.projects.findIndex((p) => p.id === id)
      if (i === -1) return false
      this.projects[i] = { ...this.projects[i], ...patch, id }
      this.lastAction = `更新项目「${this.projects[i].name}」`
      return true
    },

    /** 删除：连同它的收藏记录一起清掉，避免留下孤儿 id */
    removeProject(id) {
      const target = this.getProject(id)
      this.projects = this.projects.filter((p) => p.id !== id)
      this.favoriteIds = this.favoriteIds.filter((fid) => fid !== id)
      this.lastAction = `删除项目「${target ? target.name : id}」`
    },

    /** 恢复初始数据 */
    resetProjects() {
      this.projects = deepClone(projectData)
      this.favoriteIds = []
      this.lastAction = '项目数据已恢复初始值'
    },

    /** 收藏 / 取消收藏（一个 action 内按当前状态分流） */
    toggleFavorite(id) {
      const key = String(id)
      if (this.favoriteIds.includes(key)) {
        this.favoriteIds = this.favoriteIds.filter((fid) => fid !== key)
      } else {
        this.favoriteIds.push(key)
      }
      return this.favoriteIds.includes(key)
    },

    /** 批量清空收藏 */
    clearFavorites() {
      this.favoriteIds = []
    }
  },

  /* -------------------------------------------------------------- 持久化配置 */
  persist: {
    key: 'project',
    paths: ['projects', 'favoriteIds']
  }
})
