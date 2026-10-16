<script setup>
/* ============================================================================
   TheFooter —— 页面底部公共元素（实验三：快捷链接改成路由链接）
   ----------------------------------------------------------------------------
   实验二：底部快捷入口是 <button @click="emit('navigate', key)">，
           由 App.vue 收事件后切换视图。
   实验三：改成 <RouterLink :to="{ name: link.name }">，
           渲染成真正的 <a>，还能右键「在新标签页打开」、能被搜索引擎抓取。

   保留的事件只剩一个：
     back-to-top  返回顶部是「行为」不是「导航」，不适合用链接，仍然是事件
   ========================================================================== */

import { RouterLink } from 'vue-router'

defineProps({
  /** 站点信息：{ name, footerNote, year } */
  site: { type: Object, required: true },
  /** 底部快捷链接：[{ name, label, icon, group }]，name 是路由名 */
  quickLinks: { type: Array, default: () => [] }
})

const emit = defineEmits({
  'back-to-top': null
})
</script>

<template>
  <footer class="footer">
    <div class="footer__inner">
      <p class="footer__note">{{ site.footerNote }}</p>
      <p class="footer__meta">
        © {{ site.year }} {{ site.name }} · 按 <kbd>F12</kbd> 打开控制台可查看路由与组件日志
      </p>
    </div>

    <div class="footer__actions">
      <!-- 快捷入口：直接是路由链接，点一下 URL 就变 -->
      <RouterLink
        v-for="link in quickLinks.filter((l) => l.group !== 'private')"
        :key="link.name"
        class="btn sm"
        :to="{ name: link.name }"
      >
        <span>{{ link.icon }}</span>{{ link.label }}
      </RouterLink>

      <button type="button" class="btn sm primary" @click="emit('back-to-top')">↑ 回到顶部</button>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 6px;
  padding: 18px 22px;
  text-align: center;
  color: var(--muted);
  font-size: 12.5px;
  border-top: 1px dashed var(--line);
}
.footer__note {
  line-height: 1.9;
}
.footer__meta {
  margin-top: 2px;
}
.footer__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}
/* RouterLink 渲染成 <a>，去掉默认下划线，外观交给全局 .btn 控制 */
.footer__actions a {
  text-decoration: none;
}
</style>
