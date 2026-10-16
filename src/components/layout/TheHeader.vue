<script setup>
/* ============================================================================
   TheHeader —— 页面顶部公共元素（实验四第二次：改用 Element Plus 菜单组件）
   ----------------------------------------------------------------------------
   导航的演进过程（一路都在解决「怎么让用户切换页面」）：
     实验二：<button @click="emit('navigate', key)"> + 父组件 v-show 切视图
             —— URL 永远不变，无法分享、无法刷新回到原页面
     实验三：<RouterLink :to="{ name }"> 渲染成真正的 <a href>
             —— 跳转交给 vue-router，URL 同步变化，高亮由 router-link-active 自动处理
     ★ 实验四第二次：改用 Element Plus 的 <el-menu mode="horizontal" router>
             —— 菜单的「当前选中项」由 default-active 控制，
                开启 router 属性后点击菜单项会直接调用 router.push(index)，
                也就是说 el-menu 内部替我们做了 RouterLink 的事。

   本组件用到的 Element Plus 组件：
     el-menu / el-menu-item  横向菜单导航（核心）
     el-badge                收藏数角标（不受 el-menu 影响的自定义徽标）
     el-switch               主题亮/暗切换
     el-button               登录 / 后台管理 / 退出等操作按钮
     el-tag                  技术栈标签
     el-icon                 菜单项前的图标

   数据来源：site 由 App.vue 通过 props 传；主题 / 收藏数 / 登录态从 Pinia Store 读
   （storeToRefs 解构「数据」，方法保持从 store 实例上调用）。
   ========================================================================== */

import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Star, Lock, SwitchButton, Setting } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/useUserStore.js'
import { useProjectStore } from '../../stores/useProjectStore.js'
import { useUiStore } from '../../stores/useUiStore.js'

const props = defineProps({
  /** 站点信息：{ name, enName, title, logoText, tagline, techStack } */
  site: { type: Object, required: true },
  /** 导航项：[{ name, label, icon, group }]，name 是路由名 */
  navItems: { type: Array, default: () => [] }
})

const userStore = useUserStore()
const projectStore = useProjectStore()
const uiStore = useUiStore()

const route = useRoute()
const router = useRouter()

/* 模板里要用的「数据」全部经 storeToRefs 解构，保持响应式 */
const { isAuthed, displayName } = storeToRefs(userStore)
const { favoriteIds } = storeToRefs(projectStore)
const { isDark } = storeToRefs(uiStore)

/* ---------------------------------------------------------------------------
   把导航项转成 el-menu 需要的形状：菜单项用 index 作为唯一标识，
   这里直接用路由路径（而不是路由名），因为 el-menu 的 router 模式
   拿到 index 后是当作 URL 去 push 的。
   --------------------------------------------------------------------------- */
const mainNav = computed(() =>
  props.navItems
    .filter((i) => i.group !== 'private')
    .map((i) => ({ ...i, path: router.resolve({ name: i.name }).path }))
)

const privateNav = computed(() =>
  props.navItems
    .filter((i) => i.group === 'private')
    .map((i) => ({ ...i, path: router.resolve({ name: i.name }).path }))
)

/**
 * 当前高亮项。
 * 取「能匹配当前路径的最长前缀」——这样在 /projects/p1 时 /projects 仍然亮着，
 * 等价于 RouterLink 的 router-link-active（前缀匹配）语义。
 * （路由名 'login' 有别名 /auth，所以再补一个别名的判断。）
 */
const activeIndex = computed(() => {
  const path = route.path
  const alias = { '/auth': '/login' }
  const current = alias[path] || path
  const hits = mainNav.value.filter((i) => current === i.path || current.startsWith(i.path + '/'))
  if (!hits.length) return current
  return hits.sort((a, b) => b.path.length - a.path.length)[0].path
})

/* ---------------------------------------------------------------------------
   主题切换：el-switch 只认布尔值，而 Store 里存的是 'light' / 'dark' 字符串，
   所以在这里做一次双向转换（让 Store 保持自己更易读的数据结构）。
   --------------------------------------------------------------------------- */
function onThemeSwitch(dark) {
  uiStore.setTheme(dark ? 'dark' : 'light')
  uiStore.pushLog(uiStore.stamp(`[TheHeader] 切换主题 → ${dark ? '暗色' : '亮色'}`))
}

/**
 * 退出登录。
 * 注意：退出只是把 isAuthed 改成 false，并不会自动触发一次路由跳转，
 * 所以如果用户正停在需要权限的页面（/admin），页面会「留在原地但已失效」。
 * 这里补一步：只有当当前路由需要权限时才把用户送回首页，
 * 其余情况（比如在 /about 上退出）保持当前页不动，体验更自然。
 */
function onLogout() {
  userStore.logout()
  if (route.meta.requiresAuth) {
    uiStore.pushLog(uiStore.stamp('[TheHeader] 已在需鉴权页面退出登录，replace 回首页'))
    router.replace({ name: 'home' })
  }
}
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <!-- 品牌区：整块也是 RouterLink，点了回首页 -->
      <RouterLink class="brand" :to="{ name: 'home' }" title="回到首页">
        <span class="brand__logo">{{ site.logoText }}</span>
        <div class="brand__text">
          <p class="brand__name">
            {{ site.name }}
            <small v-if="site.enName">/ {{ site.enName }}</small>
          </p>
          <p class="brand__tagline">{{ site.title }} · {{ site.tagline }}</p>
        </div>
      </RouterLink>

      <div class="header__right">
        <!-- ============ ★ 主导航：Element Plus 横向菜单 ============
             router 属性打开后，点菜单项 = router.push(index) -->
        <el-menu
          class="nav"
          mode="horizontal"
          router
          :default-active="activeIndex"
          :ellipsis="false"
        >
          <el-menu-item v-for="item in mainNav" :key="item.name" :index="item.path">
            {{ item.icon }} {{ item.label }}
          </el-menu-item>
        </el-menu>

        <!-- 收藏数：el-badge 角标，数据来自 useProjectStore -->
        <el-badge
          :value="favoriteIds.length"
          :max="99"
          type="warning"
          :hidden="favoriteIds.length === 0"
        >
          <el-tooltip content="已收藏的项目数" placement="bottom">
            <el-button :icon="Star" circle @click="router.push({ name: 'projects' })" />
          </el-tooltip>
        </el-badge>

        <!-- 主题切换：状态在 useUiStore，切换后全站生效并写入 localStorage -->
        <el-tooltip :content="isDark ? '切换到亮色' : '切换到暗色'" placement="bottom">
          <el-switch
            :model-value="isDark"
            inline-prompt
            active-text="🌙"
            inactive-text="☀️"
            :width="56"
            @update:model-value="onThemeSwitch"
          />
        </el-tooltip>

        <!-- ============ 内容修改入口：与普通浏览入口分开 ============
             未登录 → 去登录页；已登录 → 进后台管理，并显示退出按钮。
             真正的权限判断在 router/index.js 的 beforeEach 里，
             这里只是「给用户一个合适的入口」。 -->
        <template v-if="isAuthed">
          <el-button
            v-for="item in privateNav"
            :key="item.name"
            plain
            type="primary"
            @click="router.push({ name: item.name })"
          >
            {{ item.icon }} {{ item.label }}
          </el-button>
          <el-button :icon="SwitchButton" @click="onLogout">退出（{{ displayName }}）</el-button>
        </template>
        <template v-else>
          <el-button type="primary" :icon="Lock" @click="router.push({ name: 'login' })">
            登录后台
          </el-button>
        </template>
      </div>
    </div>

    <!-- 技术栈标签：直接遍历 props.site.techStack；用 el-tag 统一外观 -->
    <div class="header__stack">
      <el-tag v-for="t in site.techStack" :key="t" size="small" type="info" effect="plain">
        {{ t }}
      </el-tag>
      <el-tag class="stack-item--route" size="small" effect="dark">
        当前地址：{{ $route.fullPath }}
      </el-tag>
      <el-tag v-if="route.meta.requiresAuth" size="small" type="danger" effect="plain">
        <el-icon><Setting /></el-icon> 需登录
      </el-tag>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: var(--shadow);
  padding: 18px 22px;
  margin-bottom: 16px;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

/* ---------- 品牌（RouterLink 渲染成 <a>，要去掉默认下划线） ---------- */
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}
.brand__logo {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.5px;
  color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  box-shadow: 0 10px 22px -12px var(--brand);
}
.brand__name {
  font-size: 16.5px;
  font-weight: 700;
  line-height: 1.3;
}
.brand__name small {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
}
.brand__tagline {
  font-size: 12.5px;
  color: var(--muted);
}

/* ---------- 右侧操作区 ---------- */
.header__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ---------- ★ el-menu 的样式覆盖 ----------
   Element Plus 的横向菜单默认有一条下边框、选中项是「下划线 + 主色文字」，
   这里把它改成和整站一致的「药丸 + 淡色底」风格。 */
.nav {
  border-bottom: none;
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px;
  height: auto;
}
.nav :deep(.el-menu-item) {
  height: 32px;
  line-height: 32px;
  padding: 0 14px;
  margin: 0 2px;
  border-radius: 999px;
  font-size: 13.5px;
  color: var(--muted);
  background: transparent;
}
.nav :deep(.el-menu-item:hover) {
  background: var(--soft-brand);
  color: var(--brand);
}
/* 选中态：Element Plus 给选中项加 .is-active，这里换掉它默认的下划线样式 */
.nav :deep(.el-menu-item.is-active) {
  background: var(--card);
  color: var(--brand);
  font-weight: 700;
  border-bottom: none;
  box-shadow: 0 4px 12px -6px rgba(30, 41, 59, 0.4);
}

/* el-badge 的数字会挤到按钮右上角，稍微外扩一点避免被裁掉 */
.header__right :deep(.el-badge) {
  display: inline-flex;
  line-height: 1;
}

/* ---------- 技术栈标签 ---------- */
.header__stack {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
}
.stack-item--route {
  font-family: Consolas, 'Courier New', monospace;
  margin-left: auto;
}
.header__stack :deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
</style>
