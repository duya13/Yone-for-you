/* ============================================================================
   实验四 · 用户 Store（Pinia）
   ----------------------------------------------------------------------------
   职责：管理「登录状态 + 个人资料」这类跨组件、跨页面共享的数据。

   为什么它必须进 Store？
     · 顶部导航（TheHeader）要按登录状态切换按钮 → 它在 App.vue 那一层
     · 路由守卫（router/index.js 的 beforeEach）要读登录状态 → 它在组件树之外
     · 首页 / 后台页都要读同一份个人资料
   这三个位置互相谁也不是谁的父子，props / provide 都送不到，所以只能放 Store。

   ── Pinia 的三件套在本文件里的体现 ────────────────────────────────────────
     state    见 state()：账号、登录标记、登录时间等
     getters  见 getters：由 state 派生的只读值（是否访客、展示名…）
     actions  见 actions：唯一允许修改 state 的地方（login / logout / saveProfile）

   ── 持久化 ──────────────────────────────────────────────────────────────
     末尾的 persist 选项交给 stores/persist.js 里的插件处理：
     刷新页面后登录状态不会丢，这正是指导书 4.1 第 4 条的要求。
     注意 demoAccount 故意不持久化 —— 它是常量，没必要写进磁盘。
   ========================================================================== */

import { defineStore } from 'pinia'
import { profileData } from '../data/content.js'

/* 演示账号：真实项目里当然要放到后端校验，这里只做前端流程演示 */
const DEMO_USER = 'admin'
const DEMO_PASSWORD = '123456'

/** 深拷贝，避免 Store 里的修改把 data/content.js 的原始数据一起改掉 */
const deepClone = (value) => JSON.parse(JSON.stringify(value))

export const useUserStore = defineStore('user', {
  /* ------------------------------------------------------------------ state */
  state: () => ({
    /** 登录账号（未登录时为空串） */
    account: '',
    /** 昵称，登录后用于顶部展示 */
    nickname: '',
    /** ★ 全站唯一的「是否已登录」标记：路由守卫、导航栏都读它 */
    isAuthed: false,
    /** 最近一次登录时间，用于个人主页展示 */
    loginAt: '',
    /** 累计登录次数（演示 state 变化 → getters 重算 → 视图更新） */
    loginCount: 0,
    /** 上一次登录失败的原因，供登录页显示 */
    lastLoginError: '',
    /** 个人资料：首页展示 + 后台编辑共用同一份 */
    profile: deepClone(profileData),
    /** 演示账号（只读常量，不参与持久化） */
    demoAccount: { username: DEMO_USER, password: DEMO_PASSWORD }
  }),

  /* ---------------------------------------------------------------- getters */
  getters: {
    /** 是否访客（isAuthed 的取反，语义更清楚） */
    isGuest: (state) => !state.isAuthed,

    /** 顶部 / 后台统一使用的展示名 */
    displayName: (state) => (state.isAuthed ? state.nickname || state.account : '访客'),

    /** 直接给 BaseTag 用的状态文案 */
    authLabel(state) {
      return state.isAuthed ? `已登录（${this.displayName}）` : '访客（未登录）'
    },

    /** 登录时间没有时给一个占位符，避免模板里写三元 */
    loginTimeText: (state) => state.loginAt || '—',

    /** 兴趣标签的只读副本 */
    profileTags: (state) => state.profile.interestTags || []
  },

  /* ---------------------------------------------------------------- actions */
  actions: {
    /**
     * 登录。返回 { ok, message }，由页面决定怎么提示——
     * action 只负责改状态，不负责弹窗、跳转这些「视图行为」。
     */
    login(username, password) {
      const name = String(username || '').trim()
      if (!name) {
        this.lastLoginError = '请输入账号'
        return { ok: false, message: this.lastLoginError }
      }
      if (!password) {
        this.lastLoginError = '请输入密码'
        return { ok: false, message: this.lastLoginError }
      }
      if (name !== this.demoAccount.username || password !== this.demoAccount.password) {
        this.lastLoginError = '账号或密码不正确'
        return { ok: false, message: this.lastLoginError }
      }

      this.account = name
      this.nickname = this.profile.name || name
      this.isAuthed = true
      this.loginAt = new Date().toLocaleString('zh-CN', { hour12: false })
      this.loginCount += 1
      this.lastLoginError = ''
      return { ok: true, message: '登录成功' }
    },

    /** 退出登录：清掉身份信息，但保留个人资料 */
    logout() {
      this.account = ''
      this.nickname = ''
      this.isAuthed = false
      this.lastLoginError = ''
    },

    /** 保存个人资料（首页编辑弹窗与后台表单共用） */
    saveProfile(patch) {
      this.profile = { ...this.profile, ...patch }
      /* 昵称跟着姓名走，顶部的展示名不会和资料对不上 */
      if (patch && patch.name && this.isAuthed) this.nickname = patch.name
    },

    /** 恢复初始个人资料 */
    resetProfile() {
      this.profile = deepClone(profileData)
    },

    /** 清掉登录失败提示 */
    clearLoginError() {
      this.lastLoginError = ''
    }
  },

  /* -------------------------------------------------------------- 持久化配置 */
  persist: {
    key: 'user',
    /* 只存「需要跨刷新保留」的字段；lastLoginError / demoAccount 属于临时或常量 */
    paths: ['account', 'nickname', 'isAuthed', 'loginAt', 'loginCount', 'profile']
  }
})
