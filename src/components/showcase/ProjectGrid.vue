<script setup>
/* ============================================================================
   ProjectGrid —— 项目列表容器（★ 作用域插槽的核心示例）
   ----------------------------------------------------------------------------
   问题背景：
     列表的「循环」发生在子组件里，但父组件往往需要用循环中的当前项做定制渲染：
     序号徽章、隔行样式、当前项是否收藏、是不是最后一项……
     而父组件模板默认只能访问自己的数据，拿不到子组件 v-for 的中间结果。

   解决办法 —— 作用域插槽：
     子组件在 <slot> 上用 v-bind 把内部数据「抛」出来：
         <slot :project="project" :index="index" :favorite="..." />
     父组件用解构的方式接住：
         <template #default="{ project, index, favorite }"> ... </template>
     这样「谁遍历」是子组件的事，「每一项长什么样」由父组件决定，两边都不越权。

   同时保留了插槽的默认内容：父组件不传插槽时，自动使用 ProjectCard 默认渲染。
   ========================================================================== */

import ProjectCard from './ProjectCard.vue'

const props = defineProps({
  /** 要渲染的项目数组（父组件已经过滤 + 排序好） */
  projects: { type: Array, default: () => [] },
  /** 已收藏的项目 id 数组，由父组件持有 */
  favorites: { type: Array, default: () => [] },
  /** 'grid' 网格 | 'list' 列表 */
  viewMode: { type: String, default: 'grid' }
})

const emit = defineEmits({
  'toggle-favorite': (id) => typeof id === 'string',
  'open-detail': (project) => !!project
})

function isFavorite(id) {
  return props.favorites.includes(id)
}
</script>

<template>
  <ul class="grid" :class="`grid--${viewMode}`">
    <li v-for="(project, index) in projects" :key="project.id" class="grid__item">
      <!--
        ★ 作用域插槽：把 v-for 得到的内部数据全部暴露给父组件模板。
        父组件用 v-slot="{ project, index, favorite, compact, onToggle, onOpen }" 接收。
      -->
      <slot
        :project="project"
        :index="index"
        :rank="index + 1"
        :total="projects.length"
        :favorite="isFavorite(project.id)"
        :compact="viewMode === 'list'"
        :on-toggle="() => emit('toggle-favorite', project.id)"
        :on-open="() => emit('open-detail', project)"
      >
        <!-- 插槽默认内容：父组件不传插槽时走这里 -->
        <ProjectCard
          :project="project"
          :rank="index + 1"
          :favorite="isFavorite(project.id)"
          :compact="viewMode === 'list'"
          @toggle-favorite="emit('toggle-favorite', project.id)"
          @open-detail="emit('open-detail', project)"
        />
      </slot>
    </li>
  </ul>
</template>

<style scoped>
.grid {
  list-style: none;
  display: grid;
  gap: 12px;
}
.grid--grid {
  grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
  align-items: stretch;
}
.grid--list {
  grid-template-columns: 1fr;
}
.grid__item {
  display: flex;
}
/* 让插槽内容（卡片）撑满整格高度，网格才不会参差不齐 */
.grid__item > :deep(*) {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
