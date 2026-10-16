<script setup>
/* ============================================================================
   ActivityLog —— 可复用「状态观察日志」
   ----------------------------------------------------------------------------
   用途：把 watch / 事件 / 生命周期里的关键动作同时输出到控制台和页面上，
        方便一边操作一边截图写实验报告。

   通信方式说明（props 向下、事件向上）：
     - props.logs  父组件把日志数组传进来（子组件只读，绝不直接修改）
     - emit('clear') 子组件不自己清空数组，而是「报告」给父组件，由父组件清空。
       这就是单向数据流：子组件不能改父组件的数据，只能发事件请父组件改。
   ========================================================================== */

defineProps({
  /** 日志列表，最新的在最前面 */
  logs: { type: Array, default: () => [] },
  /** 最多显示多少条 */
  limit: { type: Number, default: 12 },
  title: { type: String, default: '状态观察' },
  hint: { type: String, default: '与 F12 控制台输出一致' }
})

const emit = defineEmits({
  clear: null
})

/** 只报告意图，真正的清空动作由父组件完成 */
function onClear() {
  emit('clear')
}
</script>

<template>
  <div class="log">
    <div class="log__head">
      <span class="log__title">⌨️ {{ title }}</span>
      <span class="log__hint">{{ hint }}</span>
      <button v-if="logs.length" class="btn sm" type="button" @click="onClear">清空日志</button>
    </div>

    <ul v-if="logs.length" class="log__list">
      <li v-for="(item, index) in logs.slice(0, limit)" :key="index">{{ item }}</li>
    </ul>
    <p v-else class="log__empty">暂无日志，操作页面后这里会实时更新。</p>
  </div>
</template>

<style scoped>
.log__head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.log__title {
  font-size: 12.5px;
  font-weight: 600;
}
.log__hint {
  font-size: 12px;
  color: var(--muted);
  margin-right: auto;
}
.log__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 148px;
  overflow-y: auto;
}
.log__list li {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  color: var(--muted);
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 6px 10px;
  word-break: break-all;
}
.log__empty {
  font-size: 12.5px;
  color: var(--muted);
}
</style>
