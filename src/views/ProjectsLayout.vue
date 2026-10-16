<script setup>
/* ============================================================================
   ProjectsLayout —— 项目模块的「父路由组件」
   ----------------------------------------------------------------------------
   为什么需要它？这正是嵌套路由的价值：

     路由表里 /projects 下面挂了两个子路由：
       /projects        → ProjectListView     （列表）
       /projects/:id    → ProjectDetailView   （详情）

     这两个页面共享同一套「模块头部」：模块标题、子导航、说明。
     如果把它们直接写成两个平行的顶层路由，这段公共结构就得复制两遍。
     现在把它放在父路由组件里，只写一次，子页面通过下面的 <RouterView>
     渲染到「子路由出口」中。

   组件树上的表现：
       App.vue
        └── ProjectsLayout            ← 父路由（本组件）
             ├── 模块头部（列表页、详情页都能看到）
             └── <RouterView>          ← 子路由出口
                  ├── ProjectListView （/projects）
                  └── ProjectDetailView（/projects/:id）

   通信方式：
     子组件通过 useRoute() 就能知道自己被挂在哪，
     父组件通过 useRoute() 也能判断当前是列表态还是详情态。
   ========================================================================== */

import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import BaseCard from '../components/common/BaseCard.vue'
import { useProjectStore } from '../stores/useProjectStore.js'

const route = useRoute()
const projectStore = useProjectStore()

/* 子导航只需要「前 3 个项目」这个只读列表，用 storeToRefs 解构出来即可 */
const { projects } = storeToRefs(projectStore)

/* 当前是不是「项目详情」子路由？用来显示面包屑的第二段 */
const isDetail = computed(() => route.name === 'project-detail')

/* 面包屑：由当前路由实时算出来，不需要各页面自己维护 */
const crumbs = computed(() => [
  { label: '首页', to: { name: 'home' } },
  { label: '项目展示', to: { name: 'projects' } },
  ...(isDetail.value ? [{ label: `项目 ${route.params.id}`, to: null }] : [])
])
</script>

<template>
  <div class="layout">
    <!-- ============ 模块公共头部：列表页和详情页都会显示 ============ -->
    <BaseCard icon="📁" title="项目展示模块" subtitle="父路由 ProjectsLayout 提供公共头部，子路由渲染在下方出口">
      <template #actions>
        <!-- 面包屑：用 RouterLink 生成 <a>，语义比 button 更贴切 -->
        <nav class="crumbs">
          <template v-for="(c, i) in crumbs" :key="c.label">
            <span v-if="i > 0" class="crumbs__sep">/</span>
            <RouterLink v-if="c.to" class="crumbs__link" :to="c.to">{{ c.label }}</RouterLink>
            <span v-else class="crumbs__current">{{ c.label }}</span>
          </template>
        </nav>
      </template>

      <!-- 子导航：在嵌套路由之间切换，RouterLink 会自动加上高亮类 -->
      <div class="sub-nav">
        <RouterLink class="sub-nav__item" :to="{ name: 'projects' }" exact-active-class="is-exact">
          📋 项目列表 <code>/projects</code>
        </RouterLink>

        <!--
          动态路由的「示例地址」：直接写死于 URL 也行，但按名 + 参数更稳
          :to="{ name: 'project-detail', params: { id: 'p1' } }" 会生成 /projects/p1
        -->
        <RouterLink
          v-for="p in projects.slice(0, 3)"
          :key="p.id"
          class="sub-nav__item"
          :to="{ name: 'project-detail', params: { id: p.id } }"
          exact-active-class="is-exact"
        >
          <span>{{ p.cover }}</span> {{ p.id }}
        </RouterLink>

        <span class="hint">↑ 前 3 个项目快链，演示按名 + 参数生成动态地址</span>
      </div>
    </BaseCard>

    <!-- ============ ★ 子路由出口 ============
         列表页 / 详情页就是渲染在这里的。 -->
    <RouterView v-slot="{ Component }">
      <Transition name="child" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
}

/* ---------- 面包屑 ---------- */
.crumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
}
.crumbs__link {
  color: var(--brand);
  text-decoration: none;
}
.crumbs__link:hover {
  text-decoration: underline;
}
.crumbs__sep {
  color: var(--muted);
}
.crumbs__current {
  color: var(--muted);
}

/* ---------- 子导航 ---------- */
.sub-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}
.sub-nav__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--text);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12.5px;
  text-decoration: none;
  transition: all 0.2s ease;
}
.sub-nav__item:hover {
  border-color: var(--brand);
  color: var(--brand);
}
.sub-nav__item code {
  font-size: 11px;
}
/* RouterLink 自动加上的类：router-link-active（当前路由前缀匹配） */
.sub-nav__item.router-link-active {
  color: var(--brand);
  border-color: var(--brand);
}
/* exact-active-class 手动改名成 is-exact，表示「精确匹配」 */
.sub-nav__item.is-exact {
  background: var(--soft-brand);
  font-weight: 700;
}

/* ---------- 子路由切换动画 ---------- */
.child-enter-active,
.child-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.child-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.child-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
