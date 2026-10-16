<script setup>
/* ============================================================================
   BaseChips —— 可复用「单选标签组」（同样演示 defineModel）
   ----------------------------------------------------------------------------
   个人主页的「技能分类快捷按钮」和项目展示页的「项目分类筛选」长得一样、
   行为也一样（点一下选中、再点一下取消），所以抽成一个组件。
   选中值需要向上同步 → 用 defineModel 做双向绑定。
   ========================================================================== */

/** 选中值；空字符串表示「不限 / 全部」 */
const selected = defineModel({ type: String, default: '' })

const props = defineProps({
  /** 选项数组，可以是字符串数组，也可以是 { value, label } 对象数组 */
  options: { type: Array, default: () => [] },
  /** 前置说明文字 */
  label: { type: String, default: '' },
  /** 点「全部」时使用的值 */
  allValue: { type: String, default: '' },
  /** 是否显示「全部」按钮 */
  showAll: { type: Boolean, default: true }
})

/** 统一取值逻辑，兼容字符串数组与对象数组两种传法 */
function toValue(option) {
  return typeof option === 'string' ? option : option.value
}
function toLabel(option) {
  return typeof option === 'string' ? option : option.label
}

/** 点已选中的项 = 取消选择（回到「全部」） */
function pick(value) {
  selected.value = selected.value === value ? props.allValue : value
}
</script>

<template>
  <div class="chips">
    <span v-if="label" class="chips__label">{{ label }}</span>

    <button
      v-if="showAll"
      type="button"
      class="chip"
      :class="{ 'is-active': selected === allValue }"
      @click="selected = allValue"
    >
      全部
    </button>

    <button
      v-for="option in options"
      :key="toValue(option)"
      type="button"
      class="chip"
      :class="{ 'is-active': selected === toValue(option) }"
      @click="pick(toValue(option))"
    >
      {{ toLabel(option) }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.chips__label {
  font-size: 12.5px;
  color: var(--muted);
}
.chip {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.18s ease;
}
.chip:hover {
  border-color: var(--brand);
  color: var(--brand);
  background: var(--soft-brand);
}
.chip.is-active {
  background: var(--soft-brand);
  border-color: var(--brand);
  color: var(--brand);
  font-weight: 600;
}
</style>
