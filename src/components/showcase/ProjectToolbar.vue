<script setup>
/* ============================================================================
   ProjectToolbar —— 项目展示页的筛选 / 排序工具栏
   ----------------------------------------------------------------------------
   ★ 一个组件里用了 4 个 defineModel，正好说明它的适用场景：
     凡是「父组件读取 + 子组件要改写」的状态，都适合做成 model。

     v-model:keyword    搜索关键词
     v-model:category   分类筛选
     v-model:sortBy     排序方式
     v-model:viewMode   网格 / 列表视图

   对比一下父组件 ShowcaseView 的写法：
     <ProjectToolbar
       v-model:keyword="keyword"
       v-model:category="category"
       v-model:sort-by="sortBy"
       v-model:view-mode="viewMode"
     />
   一行一个，不需要任何 props + emit 的样板代码。
   ========================================================================== */

import BaseSearch from '../common/BaseSearch.vue'
import BaseChips from '../common/BaseChips.vue'
import { useActivity, stamp } from '../../composables/useActivity.js'

/* ---------- 四个 defineModel ---------- */
const keyword = defineModel('keyword', { type: String, default: '' })
const category = defineModel('category', { type: String, default: '' })
const sortBy = defineModel('sortBy', { type: String, default: 'default' })
const viewMode = defineModel('viewMode', { type: String, default: 'grid' })

defineProps({
  /** 分类选项（由父组件从项目数据里去重得到） */
  categories: { type: Array, default: () => [] },
  /** 排序选项：[{ value, label }] */
  sortOptions: { type: Array, default: () => [] },
  /** 筛选后的结果条数，用于提示 */
  resultCount: { type: Number, default: 0 },
  /** 全部项目条数 */
  totalCount: { type: Number, default: 0 }
})

const { pushLog } = useActivity()

/** 视图切换：两个按钮，选中态由 viewMode 决定 */
const viewModes = [
  { value: 'grid', label: '▦ 网格' },
  { value: 'list', label: '☰ 列表' }
]

function onReset() {
  keyword.value = ''
  category.value = ''
  sortBy.value = 'default'
  pushLog(stamp('[ProjectToolbar] 已重置全部筛选条件'))
}
</script>

<template>
  <div class="toolbar">
    <!-- 第一行：搜索 + 排序 + 视图切换 -->
    <div class="toolbar__row">
      <BaseSearch v-model="keyword" placeholder="搜索项目名称、简介或技术栈，如 Vue / MySQL" />

      <label class="toolbar__sort">
        <span class="hint">排序</span>
        <select v-model="sortBy" class="input toolbar__select">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>

      <div class="toolbar__views">
        <button
          v-for="mode in viewModes"
          :key="mode.value"
          type="button"
          class="btn sm"
          :class="{ active: viewMode === mode.value }"
          @click="viewMode = mode.value"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- 第二行：分类筛选 + 结果统计 + 重置 -->
    <div class="toolbar__row toolbar__row--second">
      <BaseChips v-model="category" :options="categories" label="分类：" />

      <div class="toolbar__right">
        <span class="hint">共 {{ totalCount }} 个，当前显示 {{ resultCount }} 个</span>
        <button class="btn sm" type="button" @click="onReset">重置筛选</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toolbar__row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.toolbar__row--second {
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}
.toolbar__sort {
  display: flex;
  align-items: center;
  gap: 6px;
}
.toolbar__select {
  width: auto;
  padding: 7px 10px;
  font-size: 13px;
  cursor: pointer;
}
.toolbar__views {
  display: flex;
  gap: 6px;
}
.toolbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}
</style>
