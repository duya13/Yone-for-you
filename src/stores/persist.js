/* ============================================================================
   实验四 · localStorage 持久化工具 + Pinia 持久化插件
   ----------------------------------------------------------------------------
   Pinia 只负责「内存里的响应式状态」，刷新页面后状态会重置为初始值。
   指导书 3.1「localStorage」一节要求我们自己补上持久化能力，这里的做法是：

     ① 两个纯函数（load / save）封装 localStorage 的读写与异常兜底
     ② 一个 Pinia 插件：给 Store 加一个 `persist` 选项，
        插件在 Store 创建时把磁盘数据回填进 state，
        并订阅 `$subscribe`，只要 state 变化就自动写回 localStorage

   用法（在 defineStore 的第三个参数里声明即可，组件代码完全不用关心持久化）：

     defineStore('project', { state, getters, actions,
       persist: { key: 'project', paths: ['projects', 'favoriteIds'] }
     })

   `paths` 省略时持久化整个 state；写上就只存这几个字段，
   避免把「一次性的提示信息」之类临时状态也写进磁盘。
   ========================================================================== */

/** 统一的 key 前缀，避免和同一个域名下其它项目的 localStorage 混在一起 */
export const PERSIST_PREFIX = 'exp4:'

/** 浏览器环境判断：构建期（Node）没有 localStorage，直接跳过 */
function hasStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

/**
 * 从 localStorage 读回一个对象。
 * 任何异常（被禁用、内容是坏的 JSON）都退化成 fallback，绝不让页面白屏。
 */
export function loadState(key, fallback = null) {
  if (!hasStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(PERSIST_PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch (err) {
    console.warn('[persist] 读取失败，已忽略：', PERSIST_PREFIX + key, err)
    return fallback
  }
}

/** 写入 localStorage（写失败只告警，不影响页面功能） */
export function saveState(key, value) {
  if (!hasStorage()) return
  try {
    /* JSON.parse(JSON.stringify()) 先剥掉响应式 Proxy——
       Proxy 直接序列化虽然也能成功，但会带上很多无意义的包装层。 */
    window.localStorage.setItem(PERSIST_PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.warn('[persist] 写入失败，已忽略：', PERSIST_PREFIX + key, err)
  }
}

/** 删除某个 key（「恢复默认数据」时用得上） */
export function clearState(key) {
  if (!hasStorage()) return
  try {
    window.localStorage.removeItem(PERSIST_PREFIX + key)
  } catch (err) {
    console.warn('[persist] 删除失败，已忽略：', PERSIST_PREFIX + key, err)
  }
}

/** 当前 localStorage 里所有本实验的 key，供 DevTools / 调试页展示 */
export function listPersistedKeys() {
  if (!hasStorage()) return []
  const keys = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k && k.startsWith(PERSIST_PREFIX)) keys.push(k)
  }
  return keys.sort()
}

/* ---------------------------------------------------------------------------
   ★ Pinia 插件本体
   ---------------------------------------------------------------------------
   Pinia 的插件就是一个「接收 context、返回扩展」的函数，
   pinia.use(persistPlugin) 之后，每个 Store 创建时都会走一遍这里。
   options 就是 defineStore 第三个参数里写的那个对象。
   --------------------------------------------------------------------------- */
export function persistPlugin({ store, options }) {
  const config = options.persist
  // 没写 persist 选项的 Store 不参与持久化
  if (!config) return

  const key = config.key || store.$id
  const paths = config.paths // undefined = 整个 state 都存

  /** 只取出需要持久化的那部分 state */
  const pick = (state) => {
    if (!paths || !paths.length) return state
    const out = {}
    paths.forEach((p) => {
      out[p] = state[p]
    })
    return out
  }

  /* ① 回填：Store 一被创建就把上次的磁盘数据打进 state */
  const saved = loadState(key)
  if (saved) store.$patch(saved)

  /* ② 订阅：任何一次 state 改动都自动落盘
       detached: true 让订阅不属于某个组件实例，组件卸载后依然有效 */
  store.$subscribe(
    (_mutation, state) => {
      saveState(key, JSON.parse(JSON.stringify(pick(state))))
    },
    { detached: true }
  )
}
