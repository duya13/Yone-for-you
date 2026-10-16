<script setup>
/* ============================================================================
   EmptyState —— 可复用空状态
   ----------------------------------------------------------------------------
   搜索没结果、筛选后为空都要显示提示。文案和图标不同，其他都一样，
   所以：图标 / 文案用 props（数据），额外补充说明用默认插槽（模板内容）。
   ========================================================================== */

defineProps({
  icon: { type: String, default: '🗂️' },
  title: { type: String, default: '暂无内容' },
  description: { type: String, default: '' }
})
</script>

<template>
  <div class="empty">
    <span class="empty__icon">{{ icon }}</span>
    <p class="empty__title">{{ title }}</p>
    <p v-if="description" class="empty__desc">{{ description }}</p>
    <!-- 默认插槽：父组件可以再塞一个「清空筛选」按钮之类的操作 -->
    <div v-if="$slots.default" class="empty__extra">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  color: var(--muted);
  padding: 28px 16px;
  font-size: 14px;
  border: 1px dashed var(--line);
  border-radius: 14px;
  background: var(--soft);
}
.empty__icon {
  font-size: 30px;
  display: block;
  margin-bottom: 6px;
}
.empty__title {
  font-weight: 600;
  color: var(--text);
}
.empty__desc {
  font-size: 12.5px;
  margin-top: 4px;
}
.empty__extra {
  margin-top: 12px;
}
</style>
