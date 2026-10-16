<script setup>
/* ============================================================================
   BaseCard —— 可复用卡片外壳
   ----------------------------------------------------------------------------
   设计思路（实验二要求「设计具有复用价值的组件」）：
     页面里到处是「圆角卡片 + 标题区 + 主体 + 底部」这套结构，
     把它抽成一个组件后，各页面只负责往插槽里塞内容，样式和结构不再重复。

   用到的插槽：
     默认插槽        卡片主体内容
     #header  具名   标题区（不传时回退到 title / subtitle 属性）
     #actions 具名   标题区右侧的操作按钮区
     #footer  具名   卡片底部（如操作按钮、日志、说明）

   注意：props 传「数据」，插槽传「模板」——
     标题文字是数据，所以用 prop；
     操作区里放几个什么按钮由父组件决定，属于模板内容，所以用插槽。
   ========================================================================== */

defineProps({
  /** 卡片标题；提供了 #header 插槽时以插槽为准 */
  title: { type: String, default: '' },
  /** 标题下方的小字说明 */
  subtitle: { type: String, default: '' },
  /** 标题前的图标（emoji 即可，离线也能显示） */
  icon: { type: String, default: '' },
  /** 去掉主体区的内边距，适合放表格、网格这类自带外边距的内容 */
  flush: { type: Boolean, default: false }
})
</script>

<template>
  <section class="base-card">
    <!-- ① 标题区：只要「有自定义 header」或「传了 title」就渲染 -->
    <header v-if="$slots.header || title" class="base-card__head">
      <slot name="header">
        <!-- 插槽默认内容：父组件不传 #header 时用这两行渲染 -->
        <div class="titles">
          <h2 class="base-card__title">
            <span v-if="icon" class="base-card__icon">{{ icon }}</span>{{ title }}
          </h2>
          <p v-if="subtitle" class="base-card__sub">{{ subtitle }}</p>
        </div>
      </slot>

      <div v-if="$slots.actions" class="base-card__actions">
        <slot name="actions" />
      </div>
    </header>

    <!-- ② 主体区：默认插槽 -->
    <div class="base-card__body" :class="{ 'is-flush': flush }">
      <slot />
    </div>

    <!-- ③ 底部区：父组件不传 #footer 时整块不渲染 -->
    <footer v-if="$slots.footer" class="base-card__foot">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.base-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
  /* 让内部内容（如表格、网格）的圆角不被直角元素戳出来 */
  overflow: hidden;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.base-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 20px 24px 0;
}

.base-card__title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
}
.base-card__icon {
  margin-right: 6px;
}
.base-card__sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}

.base-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 主体区：默认有内边距，flush 时交给内容自己控制（表格、满宽网格用得上） */
.base-card__body {
  padding: 16px 24px;
}
.base-card__body.is-flush {
  padding: 0;
}
.base-card > .base-card__body:first-child {
  padding-top: 22px;
}
.base-card > .base-card__body:last-child {
  padding-bottom: 22px;
}

.base-card__foot {
  padding: 14px 24px 18px;
  border-top: 1px dashed var(--line);
}
</style>
