<script setup>
/* ============================================================================
   BaseSearch —— 可复用搜索框（演示 defineModel）
   ----------------------------------------------------------------------------
   为什么用 defineModel？
     搜索框内部需要「读取」关键词（决定要不要显示清空按钮），
     用户输入后又要「写回」父组件，而且点击清空按钮还要「由子组件改写」父组件状态。
     这种需要双向更新的状态，用 defineModel 最省事：
       const keyword = defineModel()   →  它就是一个可读可写的 ref
       父组件写 <BaseSearch v-model="keyword" />，两边自动同步，
       不需要再手写 props + emit('update:xxx')。
   ========================================================================== */

/** 默认 model：父组件用 v-model="xxx" 绑定 */
const keyword = defineModel({ type: String, default: '' })

defineProps({
  placeholder: { type: String, default: '输入关键词搜索' },
  /** 清空按钮的提示文字 */
  clearTitle: { type: String, default: '清空' }
})

/** 子组件直接修改 model 值，父组件会同步收到更新 */
function clear() {
  keyword.value = ''
}
</script>

<template>
  <label class="search-box">
    <span class="search-box__icon">🔍</span>
    <!-- v-model 直接绑在 defineModel 返回的 ref 上 -->
    <input v-model="keyword" type="text" :placeholder="placeholder" />
    <button v-if="keyword" class="search-box__clear" type="button" :title="clearTitle" @click="clear">
      ✕
    </button>
  </label>
</template>

<style scoped>
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 12px;
  min-width: 220px;
  flex: 1 1 220px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search-box:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.16);
}
.search-box__icon {
  font-size: 14px;
}
.search-box input {
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  width: 100%;
}
.search-box input::placeholder {
  color: var(--muted);
}
.search-box__clear {
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  padding: 2px 4px;
}
.search-box__clear:hover {
  color: var(--brand);
}
</style>
