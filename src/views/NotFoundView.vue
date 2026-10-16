<script setup>
/* ============================================================================
   NotFoundView —— 404 页面（通配符路由 /:pathMatch(.*)*）
   ----------------------------------------------------------------------------
   路由表最后一条规则把「所有没匹配上的地址」都交给这个组件，
   所以用户输错地址时看到的是一个友好页面，而不是空白。

   这里顺便演示「拿到当前路径」和「几种离开 404 的方式」：
     · 回首页：router.replace —— 不把错误地址留在历史记录里
     · 返回上一页：router.go(-1) —— 如果是从站内跳过来的才有意义
     · 换个地址：用 RouterLink 直接去别的路由

   注意：自己访问 /404 这种不存在的路径时，是从外部进来的，
   历史记录里「上一页」可能是浏览器新标签页，go(-1) 不一定有反应，
   所以「回首页」用 replace 才是这个场景下最稳的做法。
   ========================================================================== */

import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '../stores/useUiStore.js'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

/* 能回到哪里去：把路由表里的主要页面列出来，方便用户自救 */
const hotLinks = [
  { name: 'home', label: '🧑‍💻 个人主页', path: '/home' },
  { name: 'projects', label: '📁 项目展示', path: '/projects' },
  { name: 'articles', label: '📝 文章列表', path: '/articles' },
  { name: 'about', label: '📄 关于本站', path: '/about' },
  { name: 'login', label: '🔒 身份认证', path: '/login' }
]

/* 被匹配到的错误地址（通配符参数会存进 params.pathMatch） */
const wrongPath = computed(() => route.fullPath)

onMounted(() => {
  console.warn('[NotFoundView][mounted] 通配符路由命中，地址：', route.fullPath)
  console.warn('[NotFoundView][mounted] params.pathMatch =', route.params.pathMatch)
  uiStore.pushLog(uiStore.stamp(`[404] 未匹配的地址：${route.fullPath}`))
})

function goHomeReplace() {
  uiStore.pushLog(uiStore.stamp('[NotFoundView] 点击「返回首页」，使用 replace 不留下错误地址'))
  router.replace({ name: 'home' })
}

function goBack() {
  uiStore.pushLog(uiStore.stamp('[NotFoundView] 点击「返回上一页」，使用 go(-1)'))
  router.go(-1)
}
</script>

<template>
  <div class="view">
    <el-card class="block" shadow="hover">
      <!-- el-result：Element Plus 的结果页组件，直接内置 404 / 500 / 成功等状态图标 -->
      <el-result icon="warning" title="404 · 没有找到这个页面" :sub-title="`未匹配的地址：${wrongPath}`">
        <template #extra>
          <p class="nf__desc">
            没有匹配到任何一条路由规则，所以被最后的通配符规则
            <code>/:pathMatch(.*)*</code> 兜住了。
          </p>

          <div class="nf__actions">
            <el-button type="primary" @click="goHomeReplace">🏠 返回首页（replace）</el-button>
            <el-button @click="goBack">← 返回上一页（go(-1)）</el-button>
          </div>

          <el-divider content-position="center">或者直接去</el-divider>

          <div class="nf__links">
            <!-- el-button 的 text 模式做成「链接样」的快捷入口 -->
            <el-button
              v-for="l in hotLinks"
              :key="l.name"
              text
              type="primary"
              @click="router.push({ name: l.name })"
            >
              {{ l.label }}
            </el-button>
          </div>

          <el-alert
            class="nf__tip"
            type="info"
            :closable="false"
            show-icon
            title="小提示"
            description="想验证 404：把地址栏的 /home 改成 /home123 回车即可；而 /projects/xx 属于「动态路由参数无效」，不会走这一页，会由项目详情页自己提示。"
          />
        </template>
      </el-result>
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
}

.nf__desc {
  font-size: 13.5px;
  line-height: 2;
  color: var(--muted);
  margin-bottom: 16px;
}
.nf__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.nf__links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.nf__tip {
  margin-top: 18px;
  text-align: left;
}
</style>
