<script setup>
/* ============================================================================
   ArticleManageView —— 文章管理页（/articles/manage，需登录）
   ----------------------------------------------------------------------------
   路由表里给它配了 meta: { requiresAuth: true }，所以未登录访问时：

     useUserStore().isAuthed === false
              ↓
     router/index.js 的 beforeEach 改写跳转目标
              ↓
     /login?redirect=/articles/manage
              ↓
     登录成功后 router.replace(redirect) 回到这里

   和 /admin 完全一样的权限思路，说明「守卫 + 用户 Store」这套组合是可以复用的：
   新增一个受保护页面时，只需要在路由表里加一行 meta，不用写任何权限代码。

   本页自己还会在 onMounted 里再查一次登录态（双保险），
   避免有人绕过守卫直接渲染组件。

   内容部分直接复用 ArticleManager 组件 —— 与后台管理的「文章管理」Tab 是同一份实现。
   ========================================================================== */

import { ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import BaseCard from '../components/common/BaseCard.vue'
import BaseTag from '../components/common/BaseTag.vue'
import ActivityLog from '../components/common/ActivityLog.vue'
import ArticleManager from '../components/article/ArticleManager.vue'
import { useUserStore } from '../stores/useUserStore.js'
import { useArticleStore } from '../stores/useArticleStore.js'
import { useUiStore } from '../stores/useUiStore.js'

const router = useRouter()
const userStore = useUserStore()
const articleStore = useArticleStore()
const uiStore = useUiStore()

const { account, isAuthed } = storeToRefs(userStore)
const { lastAction } = storeToRefs(articleStore)
const { logs } = storeToRefs(uiStore)

/* ArticleManager 通过 notify 事件把提示抛上来，这里统一显示 */
const toast = ref('')
function showToast(text) {
  toast.value = text
  window.clearTimeout(showToast.timer)
  showToast.timer = window.setTimeout(() => (toast.value = ''), 3000)
}

onMounted(() => {
  console.log('%c[实验四] 文章管理页（ArticleManageView）挂载完成', 'color:#4f46e5;font-weight:bold;')
  console.log('[ArticleManageView][mounted] 当前账号：', account.value)
  console.log('[ArticleManageView][mounted] 说明：能挂载成功 = 路由守卫已放行')

  /* 双保险：绕过守卫直接渲染时，立刻送回登录页并带上 redirect */
  if (!isAuthed.value) {
    uiStore.pushLog(uiStore.stamp('[ArticleManageView] 检测到未登录，replace 回登录页'))
    router.replace({ name: 'login', query: { redirect: '/articles/manage' } })
    return
  }

  uiStore.pushLog(uiStore.stamp('[ArticleManageView] 进入文章管理页，已通过守卫校验'))
})
</script>

<template>
  <div class="view">
    <!-- ============ 顶部状态条 ============ -->
    <BaseCard
      icon="✍️"
      title="文章管理"
      subtitle="受保护页面：路由表里的 meta.requiresAuth 由全局守卫统一拦截，本页不做权限判断"
    >
      <template #actions>
        <BaseTag :label="`已登录：${account}`" tone="ok" />
        <RouterLink class="btn sm" :to="{ name: 'articles' }">📖 查看文章列表</RouterLink>
        <RouterLink class="btn sm" :to="{ name: 'admin' }">⚙️ 后台管理</RouterLink>
      </template>

      <p class="tip">
        🔐 这一页和 <code>/admin</code> 用的是同一套权限机制：路由表里加一行
        <code>meta: {{ '{' }} requiresAuth: true {{ '}' }}</code>，
        守卫就会在未登录时把你送到
        <code>/login?redirect=/articles/manage</code>，登录后再送回来。
      </p>

      <p v-if="toast" class="toast">{{ toast }}</p>
      <p v-if="lastAction" class="hint last-action">最后一次 Store 操作：{{ lastAction }}</p>
    </BaseCard>

    <!-- ============ 增删改查（与后台管理 Tab 共用同一组件） ============ -->
    <BaseCard
      icon="📝"
      title="文章增删改查"
      subtitle="新增 / 编辑 / 删除 / 发布切换 / 置顶 / 恢复默认数据，全部走 useArticleStore 的 actions"
    >
      <ArticleManager @notify="showToast" />
    </BaseCard>

    <!-- ============ 日志 ============ -->
    <BaseCard>
      <ActivityLog :logs="logs" title="文章管理页 · 活动日志" @clear="uiStore.clearLogs" />
    </BaseCard>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
}

.tip {
  font-size: 13.2px;
  line-height: 1.95;
  color: var(--muted);
  background: var(--soft);
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 10px 13px;
  margin-top: 12px;
}

.toast {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ok);
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  padding: 9px 12px;
}

.last-action {
  display: block;
  margin-top: 10px;
}

.view :deep(a.btn) {
  text-decoration: none;
}
</style>
