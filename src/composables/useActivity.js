/* ============================================================================
   组合式函数（composable）· 活动日志
   ----------------------------------------------------------------------------
   实验二的一个重点是把「可复用的逻辑」也抽出来，而不仅是抽 UI。
   watch 输出、事件上报这些「记一条日志」的行为在两个页面里都要用，
   所以封装成一个 composable：

     const { logs, pushLog, clearLogs } = useActivity()

   它内部用 inject 读取 App.vue 通过 provide 提供的「全局活动日志」，
   这样深层子组件就不必一层层 emit 往上传，避免 props/emit 透传地狱。
   同时它也演示了「组合式 API 可以把逻辑复用到任何组件里」。
   ========================================================================== */

import { inject, ref } from 'vue'

/** 注入的 key，统一放这里避免写错字符串 */
export const ACTIVITY_KEY = 'activity'

export function useActivity() {
  // 默认值保证组件在「没有 provide 的独立场景」下也不会报错
  const fallback = {
    logs: ref([]),
    pushLog: (msg) => console.log(msg),
    clearLogs: () => {}
  }

  const activity = inject(ACTIVITY_KEY, fallback)

  return {
    logs: activity.logs,
    pushLog: activity.pushLog,
    clearLogs: activity.clearLogs
  }
}

/** 生成一条带时间戳的日志文本 */
export function stamp(message) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  return `[${time}] ${message}`
}
