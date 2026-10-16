<script setup>
/* ============================================================================
   LevelBar —— 可复用进度条
   ----------------------------------------------------------------------------
   「熟练度」和「项目进度」用的是同一个视觉元素，所以抽出来复用。
   props 传的是数据（数值、颜色），没有可变的模板内容，所以不需要插槽——
   这正是「props 与插槽如何选择」的判断依据：传数据用 props，传结构用插槽。
   ========================================================================== */

defineProps({
  /** 进度值 0 - 100 */
  value: { type: Number, default: 0 },
  /** 进度条高度 */
  height: { type: Number, default: 7 },
  /** 自定义渐变色，不传则使用主题色 */
  from: { type: String, default: '' },
  to: { type: String, default: '' }
})
</script>

<template>
  <div
    class="bar"
    :style="{ height: height + 'px' }"
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <!-- 宽度由 props 决定，颜色可选自定义 -->
    <span
      class="bar__inner"
      :style="{
        width: Math.max(0, Math.min(100, value)) + '%',
        background: from && to ? `linear-gradient(90deg, ${from}, ${to})` : ''
      }"
    ></span>
  </div>
</template>

<style scoped>
.bar {
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.2);
  overflow: hidden;
}
.bar__inner {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
  transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
