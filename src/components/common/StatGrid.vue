<script setup>
/* ============================================================================
   StatGrid —— 通用数据概览统计条（被个人主页和项目展示页同时复用）
   ----------------------------------------------------------------------------
   纯展示组件：只接收 props，不发事件、不改数据。
   父组件用 computed 把数据算好后传进来，组件本身不知道数字是怎么来的，
   所以它才能在两个页面里复用。
   ========================================================================== */

defineProps({
  /**
   * 统计项数组：[{ icon, label, value, unit, tone }]
   * 例如 { icon: '🧩', label: '技能总数', value: 8, unit: '项' }
   */
  items: { type: Array, default: () => [] },
  /** 每列最小宽度，用于自适应换行 */
  minWidth: { type: Number, default: 132 }
})
</script>

<template>
  <div class="stats" :style="{ '--min-w': minWidth + 'px' }">
    <div v-for="item in items" :key="item.label" class="stat" :class="`stat--${item.tone || 'default'}`">
      <span v-if="item.icon" class="stat__icon">{{ item.icon }}</span>
      <b class="stat__value">
        {{ item.value }}<small v-if="item.unit">{{ item.unit }}</small>
      </b>
      <span class="stat__label">{{ item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--min-w), 1fr));
  gap: 10px;
}
.stat {
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px 14px;
  position: relative;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.stat:hover {
  border-color: var(--brand);
  transform: translateY(-2px);
}
.stat--warn .stat__value {
  color: var(--warn);
}
.stat--ok .stat__value {
  color: var(--ok);
}
.stat--brand .stat__value {
  color: var(--brand);
}

.stat__icon {
  position: absolute;
  right: 12px;
  top: 10px;
  font-size: 15px;
  opacity: 0.75;
}
.stat__value {
  display: block;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 700;
}
.stat__value small {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
  margin-left: 2px;
}
.stat__label {
  font-size: 12.5px;
  color: var(--muted);
}
</style>
