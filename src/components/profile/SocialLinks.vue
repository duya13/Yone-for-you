<script setup>
/* ============================================================================
   SocialLinks —— 社交 / 联系方式链接列表
   ----------------------------------------------------------------------------
   组件边界：这块只负责「把一组链接渲染成按钮」，数据来自 props，
   既不需要内部状态，也不需要向父组件报告事件（点击是浏览器自己的跳转行为）。

   注意 v-bind 的一个细节：
     外链用 _blank 时必须同时加 rel="noopener"，否则新页面能通过
     window.opener 操作本页，存在安全风险。
   ========================================================================== */

defineProps({
  /** 链接数组：[{ id, icon, name, url }] */
  links: { type: Array, default: () => [] }
})

/** 判断是否站外链接，用于决定新窗口打开还是当前页打开 */
function isExternal(url) {
  return /^https?:/i.test(url)
}
</script>

<template>
  <div class="links">
    <a
      v-for="link in links"
      :key="link.id"
      class="link"
      :href="link.url"
      :target="isExternal(link.url) ? '_blank' : '_self'"
      :rel="isExternal(link.url) ? 'noopener' : undefined"
    >
      <span class="link__icon">{{ link.icon }}</span>
      <span>{{ link.name }}</span>
    </a>
  </div>
</template>

<style scoped>
.links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 7px 15px;
  color: var(--text);
  font-size: 13.5px;
  background: var(--soft);
  transition: all 0.18s ease;
}
.link:hover {
  border-color: var(--brand);
  color: var(--brand);
  background: var(--soft-brand);
  transform: translateY(-2px);
}
.link__icon {
  font-size: 14px;
}
</style>
