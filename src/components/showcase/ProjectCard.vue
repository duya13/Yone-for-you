<script setup>
/* ============================================================================
   ProjectCard —— 项目卡片（可复用组件，插槽最密集的地方）
   ----------------------------------------------------------------------------
   ★ 本组件刻意把「结构」留成插槽，把「数据」留成 props，
     正好对应指导书里「props 与插槽如何选择」那张表的判断依据：

     props（传的是数据 / 配置）
       project   项目对象本身
       favorite  是否已收藏
       rank      在列表中的序号
       compact   是否紧凑模式（列表视图）

     插槽（传的是由父组件决定的模板内容）
       默认插槽   卡片主体内容     → 父组件可换成自定义简介、图表等
       #cover     封面区           → 可换成真实图片 / 图标
       #title     标题区           → 可在标题后加序号徽章
       #status    状态区           → 可换成自定义状态样式
       #actions   操作区           → 按钮由父组件决定
       #footer    底部区           → 更新时间、附加说明

   事件（子组件 → 父组件）
       toggle-favorite  请求父组件切换收藏（子组件不直接改收藏列表）
       open-detail      请求父组件打开详情弹窗
   ========================================================================== */

import { computed } from 'vue'
import BaseTag from '../common/BaseTag.vue'
import LevelBar from '../common/LevelBar.vue'
import { getStatusTone } from '../../data/content.js'

const props = defineProps({
  /** 项目数据对象 */
  project: { type: Object, required: true },
  /** 是否已收藏，由父组件决定 */
  favorite: { type: Boolean, default: false },
  /** 在列表中的序号（从 1 开始） */
  rank: { type: Number, default: 0 },
  /** 紧凑模式：列表视图下用横向布局 */
  compact: { type: Boolean, default: false },
  /** 是否显示进度条 */
  showProgress: { type: Boolean, default: true }
})

const emit = defineEmits({
  'toggle-favorite': null,
  'open-detail': null
})

/** 状态 → 颜色：数据里的状态文字决定标签颜色（映射表放在数据层统一维护） */
const statusTone = computed(() => getStatusTone(props.project.status))

/** 封面渐变：用项目自带的 accent 色做成柔和的渐变背景 */
const coverStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.project.accent}2e, ${props.project.accent}0d)`,
  borderColor: `${props.project.accent}55`
}))
</script>

<template>
  <article class="pcard" :class="{ 'is-compact': compact, 'is-fav': favorite }">
    <!-- ============ 封面区：具名插槽 #cover ============ -->
    <div class="pcard__cover" :style="coverStyle">
      <slot name="cover">
        <!-- 默认内容：emoji 占位封面 -->
        <span class="pcard__emoji">{{ project.cover }}</span>
      </slot>

      <span v-if="rank" class="pcard__rank">No.{{ rank }}</span>

      <button
        class="pcard__fav"
        type="button"
        :class="{ 'is-on': favorite }"
        :title="favorite ? '取消收藏' : '收藏该项目'"
        @click.stop="emit('toggle-favorite')"
      >
        {{ favorite ? '★' : '☆' }}
      </button>
    </div>

    <!-- ============ 主体区 ============ -->
    <div class="pcard__body">
      <div class="pcard__head">
        <!-- 具名插槽 #title -->
        <slot name="title">
          <h3 class="pcard__name">{{ project.name }}</h3>
        </slot>

        <!-- 具名插槽 #status -->
        <slot name="status">
          <BaseTag :label="project.status" :tone="statusTone" />
        </slot>
      </div>

      <!-- ★ 默认插槽：卡片最核心的「项目简介」内容，父组件拥有完全决定权 -->
      <slot>
        <p class="pcard__summary">{{ project.summary }}</p>
      </slot>

      <!-- 技术栈：数据来自 props，所以直接用 props 渲染，不必开插槽 -->
      <div class="pcard__tech">
        <BaseTag v-for="t in project.tech" :key="t" :label="t" tone="muted" />
      </div>

      <!-- 进度：复用公共组件 LevelBar -->
      <div v-if="showProgress" class="pcard__progress">
        <LevelBar :value="project.progress" :from="project.accent" to="var(--brand-2)" />
        <div class="pcard__progress-meta">
          <span class="hint">完成度</span>
          <b>{{ project.progress }}%</b>
        </div>
      </div>
    </div>

    <!-- ============ 底部区：具名插槽 #footer / #actions ============ -->
    <footer class="pcard__foot">
      <div class="pcard__meta">
        <slot name="footer">
          <span class="hint">更新于 {{ project.updatedAt }}</span>
        </slot>
      </div>

      <div class="pcard__actions">
        <!-- 具名插槽 #actions：按钮完全由父组件决定 -->
        <slot name="actions">
          <button class="btn sm" type="button" @click="emit('open-detail')">查看详情</button>
        </slot>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.pcard {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.pcard:hover {
  transform: translateY(-3px);
  border-color: var(--brand);
  box-shadow: var(--shadow-sm);
}
.pcard.is-fav {
  border-color: rgba(245, 158, 11, 0.6);
}

/* ---------- 封面 ---------- */
.pcard__cover {
  position: relative;
  height: 92px;
  display: grid;
  place-items: center;
  border-bottom: 1px dashed var(--line);
}
.pcard__emoji {
  font-size: 34px;
  line-height: 1;
}
.pcard__rank {
  position: absolute;
  left: 10px;
  top: 9px;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  background: var(--card);
  border-radius: 999px;
  padding: 1px 8px;
}
.pcard__fav {
  position: absolute;
  right: 9px;
  top: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--muted);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.18s ease;
}
.pcard__fav:hover {
  color: var(--warn);
  border-color: var(--warn);
  transform: scale(1.08);
}
.pcard__fav.is-on {
  color: var(--warn);
  border-color: var(--warn);
}

/* ---------- 主体 ---------- */
.pcard__body {
  flex: 1 1 auto;
  padding: 13px 15px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.pcard__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.pcard__name {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
}
.pcard__summary {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
}
.pcard__tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pcard__progress {
  margin-top: auto;
}
.pcard__progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
  font-size: 12px;
}
.pcard__progress-meta b {
  font-size: 12.5px;
}

/* ---------- 底部 ---------- */
.pcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 15px;
  border-top: 1px dashed var(--line);
}
.pcard__meta {
  font-size: 12px;
}
.pcard__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* ---------- 列表（紧凑）模式 ---------- */
.pcard.is-compact {
  flex-direction: row;
  align-items: stretch;
}
.pcard.is-compact .pcard__cover {
  width: 96px;
  height: auto;
  flex: 0 0 96px;
  border-bottom: 0;
  border-right: 1px dashed var(--line);
}
.pcard.is-compact .pcard__body {
  padding: 12px 16px;
}
.pcard.is-compact .pcard__foot {
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  border-top: 0;
  border-left: 1px dashed var(--line);
  padding: 12px 14px;
}
.pcard.is-compact .pcard__head {
  align-items: center;
}
</style>
