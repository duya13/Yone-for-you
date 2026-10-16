<script setup>
/* ============================================================================
   ProjectDetailDialog —— 项目详情弹窗
   ----------------------------------------------------------------------------
   通信组合：
     v-model:visible    defineModel 控制显隐（父组件打开，子组件关闭）
     props project      要展示的项目数据
     emit toggle-favorite  收藏操作报告给父组件（数据在父组件，子组件不能直接改）
     具名插槽 #extra / #actions  给父组件留出「追加内容」和「自定义按钮」的位置，
                              这样别的页面也能拿它当通用详情弹窗用。
   ========================================================================== */

import { computed } from 'vue'
import BaseTag from '../common/BaseTag.vue'
import LevelBar from '../common/LevelBar.vue'
import { getStatusTone } from '../../data/content.js'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** 当前查看的项目；为空时弹窗不渲染内容 */
  project: { type: Object, default: null },
  /** 是否已收藏 */
  favorite: { type: Boolean, default: false }
})

const emit = defineEmits({
  'toggle-favorite': null
})

const statusTone = computed(() => getStatusTone(props.project?.status))

/** 详情里的字段列表 */
const rows = computed(() => {
  const p = props.project
  if (!p) return []
  return [
    { key: '项目分类', value: p.category },
    { key: '当前状态', value: p.status },
    { key: '开始时间', value: p.startedAt },
    { key: '最近更新', value: p.updatedAt },
    { key: '技术栈', value: (p.tech || []).join(' / ') }
  ]
})

function close() {
  visible.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && project" class="mask" @click.self="close">
      <div class="dialog">
        <header class="dialog__head" :style="{ background: `${project.accent}1a` }">
          <span class="dialog__cover">{{ project.cover }}</span>
          <div class="dialog__titles">
            <h3>{{ project.name }}</h3>
            <div class="dialog__tags">
              <BaseTag :label="project.status" :tone="statusTone" />
              <BaseTag :label="project.category" tone="brand" />
              <BaseTag v-for="t in project.tags" :key="t" :label="t" tone="hollow" />
            </div>
          </div>
          <button class="dialog__close" type="button" title="关闭" @click="close">✕</button>
        </header>

        <div class="dialog__body">
          <p class="dialog__detail">{{ project.detail || project.summary }}</p>

          <div class="dialog__progress">
            <LevelBar :value="project.progress" :height="8" :from="project.accent" to="var(--brand-2)" />
            <div class="dialog__progress-meta">
              <span class="hint">项目完成度</span>
              <b>{{ project.progress }}%</b>
            </div>
          </div>

          <dl class="dialog__rows">
            <div v-for="row in rows" :key="row.key" class="row">
              <dt>{{ row.key }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>

          <div v-if="project.highlights?.length" class="dialog__highlights">
            <p class="dialog__label">技术要点</p>
            <ul>
              <li v-for="h in project.highlights" :key="h">{{ h }}</li>
            </ul>
          </div>

          <!-- 具名插槽 #extra：父组件可在此追加自定义区块 -->
          <div v-if="$slots.extra" class="dialog__extra">
            <slot name="extra" :project="project" />
          </div>
        </div>

        <footer class="dialog__actions">
          <button class="btn" type="button" :class="{ active: favorite }" @click="emit('toggle-favorite')">
            {{ favorite ? '★ 已收藏' : '☆ 收藏' }}
          </button>

          <a v-if="project.repo" class="btn" :href="project.repo" target="_blank" rel="noopener">
            🐙 源码仓库
          </a>

          <!-- 具名插槽 #actions：父组件可追加按钮 -->
          <slot name="actions" :project="project" />

          <button class="btn primary" type="button" @click="close">关闭</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
}

.dialog {
  width: 100%;
  max-width: 620px;
  max-height: 88vh;
  overflow-y: auto;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow);
  animation: pop 0.25s ease;
}
@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.dialog__head {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 20px 22px;
  border-bottom: 1px dashed var(--line);
}
.dialog__cover {
  font-size: 34px;
  line-height: 1;
}
.dialog__titles h3 {
  font-size: 17px;
  margin-bottom: 6px;
  padding-right: 26px;
}
.dialog__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.dialog__close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--muted);
  cursor: pointer;
  line-height: 1;
}
.dialog__close:hover {
  color: var(--danger);
  border-color: var(--danger);
}

.dialog__body {
  padding: 18px 22px;
}
.dialog__detail {
  font-size: 13.8px;
  line-height: 1.85;
  color: var(--muted);
}
.dialog__progress {
  margin: 16px 0;
}
.dialog__progress-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12.5px;
}

.dialog__rows {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}
.row {
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 9px 12px;
}
.row dt {
  font-size: 12px;
  color: var(--muted);
}
.row dd {
  font-size: 13.5px;
  font-weight: 600;
  margin-top: 2px;
}

.dialog__highlights {
  margin-top: 16px;
}
.dialog__label {
  font-size: 12.5px;
  color: var(--muted);
  margin-bottom: 6px;
}
.dialog__highlights ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dialog__highlights li {
  font-size: 13.2px;
  background: var(--soft);
  border-left: 3px solid var(--brand);
  border-radius: 8px;
  padding: 7px 12px;
}

.dialog__extra {
  margin-top: 16px;
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 22px 20px;
  border-top: 1px dashed var(--line);
}
.dialog__actions .btn {
  text-decoration: none;
}
</style>
