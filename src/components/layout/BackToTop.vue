<script setup>
/* ============================================================================
   BackToTop —— 悬浮「返回顶部」按钮
   ----------------------------------------------------------------------------
   这个组件展示了「组件内部状态」的判定：
     「浮窗要不要显示」只跟当前滚动位置有关，别的组件完全不关心，
     所以 visible 这个状态留在组件内部即可，不需要提升到父组件。
     （对比一下：主题 theme、个人信息 profile 是全站共享的，就必须放在 App.vue。）

   生命周期：挂载时注册 scroll 监听，卸载时一定要移除，否则会内存泄漏。
   ========================================================================== */

import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  /** 滚动超过多少像素后显示按钮 */
  visibleAfter: { type: Number, default: 320 }
})

const emit = defineEmits({
  click: null
})

/* 组件内部状态 */
const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > props.visibleAfter
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  // 只是「报告」一次点击，父组件可借此记日志，不做也不影响功能
  emit('click')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <!-- <Transition> 是 Vue 内置组件，负责进出场动画 -->
  <Transition name="fade-up">
    <button v-show="visible" class="to-top" type="button" title="回到顶部" @click="toTop">↑</button>
  </Transition>
</template>

<style scoped>
.to-top {
  position: fixed;
  right: 22px;
  bottom: 26px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--brand);
  font-size: 19px;
  font-weight: 700;
  cursor: pointer;
  z-index: 30;
  box-shadow: var(--shadow);
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.to-top:hover {
  transform: translateY(-3px);
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: #fff;
  border-color: transparent;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
