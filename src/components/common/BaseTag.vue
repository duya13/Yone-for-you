<script setup>
/* ============================================================================
   BaseTag —— 可复用标签
   ----------------------------------------------------------------------------
   全站有四五处都要显示「小圆角标签」（兴趣标签、技术栈、状态、分类…），
   抽出来后统一外观，只需要通过 props 切换颜色和样式。
   这也体现了「props 用来传数据 / 配置」这条判断依据。
   ========================================================================== */

defineProps({
  /** 标签文字 */
  label: { type: [String, Number], default: '' },
  /** 配色：brand 主色 / ok 成功 / warn 进行中 / muted 中性 / hollow 虚线 */
  tone: {
    type: String,
    default: 'brand',
    validator: (v) => ['brand', 'ok', 'warn', 'danger', 'muted', 'hollow'].includes(v)
  },
  /** 标签前的图标 */
  icon: { type: String, default: '' }
})
</script>

<template>
  <span class="tag" :class="`tag--${tone}`">
    <span v-if="icon" class="tag__icon">{{ icon }}</span>
    <!-- 默认插槽兜底：没传 label 属性时允许父组件直接用内容写 -->
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  padding: 3px 11px;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}

.tag--brand {
  background: var(--soft-brand);
  color: var(--brand);
}
.tag--ok {
  background: rgba(16, 185, 129, 0.16);
  color: var(--ok);
}
.tag--warn {
  background: rgba(245, 158, 11, 0.18);
  color: var(--warn);
}
.tag--danger {
  background: rgba(239, 68, 68, 0.16);
  color: var(--danger);
}
.tag--muted {
  background: var(--soft);
  color: var(--muted);
}
.tag--hollow {
  background: transparent;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-weight: 500;
}
</style>
