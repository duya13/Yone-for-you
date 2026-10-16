/* ============================================================================
   实验四 · 界面 Store（Pinia）
   ----------------------------------------------------------------------------
   职责：存放「和业务无关、但全站都要读」的界面状态：

     theme   亮色 / 暗色（顶部按钮切换，App.vue 同步到 <html> 让弹窗也变色）
     logs    活动日志（watch / 事件 / 生命周期里记一条，方便边操作边截图写报告）

   为什么日志也进 Store？
     实验二用 provide / inject 共享日志，实验三沿用了它。
     实验四把 theme 与 logs 一并收进 Store，好处是：
       · 任何组件（哪怕不在 App 的 provide 作用域内）都能直接读到
       · 逻辑集中在 action 里，App.vue 不必再当「日志的转发者」

   注意 logs 故意**不做持久化**：它是过程信息，刷新后重新记录更干净，
   也正好演示「同一个应用里，有的 Store 持久化、有的不持久化」。
   ========================================================================== */

import { defineStore } from 'pinia'

/** 日志最多保留多少条：防止长时间操作把内存撑爆 */
const MAX_LOGS = 80

export const useUiStore = defineStore('ui', {
  /* ------------------------------------------------------------------ state */
  state: () => ({
    /** 'light' | 'dark' */
    theme: 'light',
    /** 活动日志，最新的在最前面 */
    logs: []
  }),

  /* ---------------------------------------------------------------- getters */
  getters: {
    isDark: (state) => state.theme === 'dark',
    /** 给按钮用的文案，省得模板里写三元 */
    themeLabel: (state) => (state.theme === 'dark' ? '☀️ 亮色' : '🌙 暗色'),
    logCount: (state) => state.logs.length,
    /** 最近一条日志，用于页面顶部做「最后发生了什么」的提示 */
    latestLog: (state) => state.logs[0] || ''
  },

  /* ---------------------------------------------------------------- actions */
  actions: {
    /** 亮色 / 暗色来回切 */
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      return this.theme
    },

    setTheme(theme) {
      this.theme = theme === 'dark' ? 'dark' : 'light'
    },

    /**
     * 记一条日志。
     * 所有页面、所有组件都调它 —— 这就是「action 是唯一修改入口」的价值：
     * 截断长度、是否输出到控制台这些规则只写一遍。
     */
    pushLog(message) {
      if (!message) return
      this.logs.unshift(String(message))
      if (this.logs.length > MAX_LOGS) this.logs.length = MAX_LOGS
    },

    clearLogs() {
      this.logs = []
    },

    /** 给日志加时间戳，等价于实验三 useAppStore 里的 stamp() */
    stamp(message) {
      const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
      return `[${time}] ${message}`
    }
  },

  /* -------------------------------------------------------------- 持久化配置 */
  persist: {
    key: 'ui',
    /* 只存主题；logs 属于临时状态，刷新即清空 */
    paths: ['theme']
  }
})
