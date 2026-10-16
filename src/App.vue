<script setup>
/* ============================================================================
   App.vue —— 根组件（组合式 API + 路由出口 + Element Plus 布局容器）
   ----------------------------------------------------------------------------
   实验二里 App.vue 的两大职责是：
     ① 组织「顶部 — 主体 — 底部」三段式布局
     ② 持有全站共享状态，并用 props / emit 把数据分发给页面组件

   实验三把职责② 交给了手写 store；实验四第一次换成 Pinia：
     · 主题与活动日志 → useUiStore
     · 登录态、个人资料、项目、文章 → 各自独立的 Store，谁需要谁自己取

   ★ 实验四第二次：整体结构改用 Element Plus 的布局组件
     原来是自己写 div + CSS 实现三段式，现在换成官方布局容器：

       <el-container>                 外层容器（垂直排列，撑满视口）
         ├── <el-header>  <TheHeader>  顶部公共元素
         ├── <el-main>    <RouterView> ★ 路由出口
         └── <el-footer>  <TheFooter>  底部公共元素

     el-container 会自动判断方向：只要直接子节点里出现 el-header 或 el-footer，
     它就给自己加上 is-vertical，按「上中下」排列；el-main 自动 flex:1 撑满剩余高度。
     这就是布局组件的价值 —— 不用再手写 flex 与 min-height。

     注意两个默认样式的处理（写在下方 <style> 里）：
       · el-header / el-footer 默认 height: 60px，会把内容挤变形 → 改成 auto
       · el-main 默认 overflow: auto，会让「整页滚动」变成「区域滚动」，
         从而破坏回到顶部的逻辑 → 改成 visible
   ========================================================================== */

import { computed, ref, watch, onMounted, provide } from 'vue'
import { RouterView } from 'vue-router'

/* ---------- 布局组件（顶部 / 底部 / 悬浮按钮） ---------- */
import TheHeader from './components/layout/TheHeader.vue'
import TheFooter from './components/layout/TheFooter.vue'
import BackToTop from './components/layout/BackToTop.vue'

/* ---------- 数据与共享状态 ---------- */
import { siteInfo, navItems } from './data/content.js'
import { useUiStore } from './stores/useUiStore.js'
import { ACTIVITY_KEY } from './composables/useActivity.js'

const uiStore = useUiStore()

/* ======================= ① 主题：影响全站，需要同步到 <html> =======================
   Element Plus 的暗色主题变量挂在 html.dark 上，
   所以这一步现在同时承担两个作用：本站自己的 CSS 变量 + 组件库的配色。 */
const isDark = computed(() => uiStore.isDark)

watch(
  () => uiStore.theme,
  (value) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', value === 'dark')
    }
  },
  { immediate: true }
)

/* ======================= ② 活动日志：provide / inject 与 Pinia 并存 =======================
   实验二用 provide / inject 共享日志；实验四把日志的「真身」搬进了 useUiStore，
   但 provide 这一层保留下来，正好和 Store 形成对照：
     · 日志偏向「某个组件树内部到处都能写」→ provide / inject 顺手
     · 页面级业务数据要跨路由复用       → Pinia Store
   两者最终都指向 useUiStore 里同一份 logs，不会出现两份数据。 */
const logs = computed(() => uiStore.logs)

provide(ACTIVITY_KEY, {
  logs,
  pushLog: (msg) => uiStore.pushLog(msg),
  clearLogs: () => uiStore.clearLogs()
})

/* ======================= ③ 生命周期 ======================= */
/* 组件树里第一个挂载完成的组件，用它记录「应用就绪时间」并输出一条总览日志 */
const appReadyAt = ref('')

onMounted(() => {
  appReadyAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })

  console.log('%c[实验四] App 根组件挂载完成', 'color:#4f46e5;font-weight:bold;')
  console.log('[App][mounted] 挂载时间：', appReadyAt.value)
  console.log('[App][mounted] 布局：el-container / el-header / el-main / el-footer（Element Plus）')
  console.log('[App][mounted] Pinia 已注册，页面组件由 <RouterView> 按 URL 渲染')
  console.log('[App][mounted] 请在 Vue DevTools 的 Pinia 面板中查看 user / project / article / ui 四个 Store')

  uiStore.pushLog(uiStore.stamp(`[App] mounted · 应用启动完成，当前地址 ${window.location.pathname}`))
})

/* ======================= ④ 悬浮返回顶部 ======================= */
function handleBackToTop() {
  uiStore.pushLog(uiStore.stamp('[App] 收到 back-to-top 事件，已回到顶部'))
}
</script>

<template>
  <!-- 主题类绑在这一层：所有子组件都能继承到 CSS 变量；
       el-container 作为最外层容器，垂直方向自动排列 header / main / footer -->
  <el-container class="page" :class="{ dark: isDark }">
    <!-- ============ 顶部公共元素 ============
         导航是 el-menu（router 模式），登录态/收藏数/主题都从各自 Store 直接读 -->
    <el-header class="page__header">
      <div class="container">
        <TheHeader :site="siteInfo" :nav-items="navItems" />
      </div>
    </el-header>

    <!-- ============ ★ 主体区：路由出口 ============ -->
    <el-main class="page__main">
      <div class="container">
        <RouterView v-slot="{ Component }">
          <Transition name="route" mode="out-in">
            <!-- 不加 :key —— 同一路由换参数（/articles/a1 → /articles/a2）时
                 复用同一个组件实例，只是 params 变了，
                 所以「参数变化时要做事」必须用 watch(route.params) 而不是 onMounted。 -->
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </el-main>

    <!-- ============ 底部公共元素 ============ -->
    <el-footer class="page__footer">
      <div class="container">
        <TheFooter :site="siteInfo" :quick-links="navItems" @back-to-top="handleBackToTop" />
      </div>
    </el-footer>

    <!-- ============ 悬浮返回顶部：显示与否是组件内部状态 ============ -->
    <BackToTop @click="handleBackToTop" />
  </el-container>
</template>

<style scoped>
/* ---------- 抹平 Element Plus 布局容器的默认样式 ----------
   el-header / el-footer 默认 height: 60px、左右 20px 内边距；
   el-main 默认 padding: 20px 且 overflow: auto。
   本站的间距由 .page 与 .container 统一控制，所以这里把它们全部还原成「透明」，
   只借用布局组件的排列能力。 */
.page :deep(.el-header),
.page :deep(.el-footer) {
  height: auto;
  padding: 0;
  line-height: inherit;
}

.page :deep(.el-main) {
  padding: 0;
  /* 默认的 overflow:auto 会把整页滚动变成「主体区内部滚动」，
     导致 window.scrollY 永远为 0、返回顶部按钮失效，这里必须打开 */
  overflow: visible;
}

/* el-footer 默认是 flex 居中，会让内部 .container 的宽度行为变得奇怪 */
.page :deep(.el-footer) {
  display: block;
}

.page__header {
  flex-shrink: 0;
}
.page__main {
  min-height: 40vh;
}

/* ---------- 路由切换过渡动画 ---------- */
.route-enter-active,
.route-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.route-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.route-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
