<script setup>
/* ============================================================================
   SkillList —— 技能列表（实验四第二次：改用 Element Plus 呈现）
   ----------------------------------------------------------------------------
   ★ 本组件是 defineModel 的主要示例（实验二建立，一直保留）。

   为什么这里必须要双向绑定？
     搜索关键词既属于「父组件状态」（ProfileView 要用它算「当前匹配 N 项」
     和「最近搜索」记录），又要被「子组件改写」（用户在输入框里打字、
     点分类按钮、点清空按钮）。这种双向往来的状态，用 defineModel 最合适：
       const keyword = defineModel('keyword')  →  返回一个可读可写的 ref
     父组件写 <SkillList v-model:keyword="keyword" />，
     之后无论是父组件改还是子组件改，两边都会自动同步。

   另一个细节（props 单向数据流）：
     props.skills 是父组件已经筛选好的列表，本组件只渲染、绝不修改。

   ★ 换用 Element Plus 后的对应关系：
     BaseCard（自研卡片）      → el-card
     BaseSearch（自研搜索框）  → el-input（clearable + prefix-icon，自带清空按钮）
     BaseChips（自研筛选条）   → el-radio-group + el-radio-button（单选按钮组）
     自研进度条 LevelBar       → el-progress（:percentage + :stroke-width + 状态色）
     自研标签 BaseTag          → el-tag
     自研空状态 EmptyState     → el-empty（自带插画与描述插槽）
   ========================================================================== */

import { computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useActivity, stamp } from '../../composables/useActivity.js'

/* ---------- defineModel：与父组件双向同步的关键词 ---------- */
const keyword = defineModel('keyword', { type: String, default: '' })

/* ---------- props：父组件传入的只读数据 ---------- */
const props = defineProps({
  /** 已经筛选好的技能列表（筛选逻辑由父组件的 computed 负责） */
  skills: { type: Array, default: () => [] },
  /** 技能总数，用于显示「共 N 项」 */
  total: { type: Number, default: 0 },
  /** 分类选项，由父组件从数据里去重得到 */
  categories: { type: Array, default: () => [] },
  /** 最近搜索过的关键词（由父组件的 watch 维护，这里只负责展示） */
  history: { type: Array, default: () => [] }
})

const emit = defineEmits({
  /** 点击某个技能，把技能对象报告给父组件（父组件可在日志里记录） */
  pick: (skill) => !!skill && typeof skill === 'object'
})

const { pushLog } = useActivity()

/**
 * el-radio-group 的选中值：'' 表示「全部」。
 * 分类筛选与搜索框共用同一个 keyword，所以这里做一个双向映射，
 * 保证「点分类按钮」和「在搜索框里输入分类名」是同一件事。
 */
const activeCategory = computed({
  get: () => (props.categories.includes(keyword.value) ? keyword.value : ''),
  set: (value) => {
    keyword.value = value
    pushLog(stamp(`[SkillList] 分类筛选 → ${value || '全部'}`))
  }
})

/** 熟练度颜色：按数值分档，给 el-progress 用不同状态色 */
function levelStatus(level) {
  if (level >= 80) return 'success'
  if (level >= 65) return undefined // 默认主色
  return 'warning'
}

/** 把命中的关键词片段包上 <mark> 高亮（mark 的样式定义在全局 theme.css） */
function highlight(text) {
  const kw = keyword.value.trim()
  if (!kw) return text
  const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  try {
    return String(text).replace(new RegExp(safe, 'gi'), (m) => `<mark>${m}</mark>`)
  } catch (e) {
    return text
  }
}

function pickHistory(word) {
  keyword.value = word
  pushLog(stamp(`[SkillList] 点击最近搜索：${word}`))
}

function onClear() {
  keyword.value = ''
  pushLog(stamp('[SkillList] 已清空关键词'))
}
</script>

<template>
  <el-card class="skill-card" shadow="hover">
    <template #header>
      <div class="card-head">
        <div>
          <h2 class="card-head__title">🧩 技能与兴趣</h2>
          <p class="card-head__sub">
            v-model:keyword 双向绑定 · el-input / el-radio-group / el-progress / el-empty 呈现 ·
            共 {{ total }} 项，当前匹配 {{ skills.length }} 项
          </p>
        </div>
        <!-- el-input：clearable 自带清空按钮，prefix-icon 用 Element Plus 的 Search 图标 -->
        <el-input
          v-model="keyword"
          class="card-head__search"
          placeholder="输入关键词筛选技能，如 Vue / 前端 / MySQL"
          :prefix-icon="Search"
          clearable
        />
      </div>
    </template>

    <!-- 分类筛选：el-radio-group + el-radio-button 做成药丸式单选按钮组 -->
    <div class="filter-row">
      <span class="filter-row__label">快速筛选：</span>
      <el-radio-group v-model="activeCategory" size="small">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button v-for="c in categories" :key="c" :value="c">{{ c }}</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 最近搜索：点一下把值写回 keyword model -->
    <div v-if="history.length" class="filter-row">
      <span class="filter-row__label">最近搜索：</span>
      <el-tag
        v-for="word in history"
        :key="word"
        class="history-tag"
        type="info"
        effect="plain"
        round
        @click="pickHistory(word)"
      >
        {{ word }}
      </el-tag>
    </div>

    <!-- el-empty：内置插画 + description 插槽 + 默认插槽放操作按钮 -->
    <el-empty v-if="skills.length === 0" description="没有找到匹配的技能">
      <el-button type="primary" plain @click="onClear">清空筛选</el-button>
      <p class="empty-desc">
        {{ keyword ? `当前关键词：「${keyword}」，换个词试试～` : '换个关键词试试～' }}
      </p>
    </el-empty>

    <!-- 列表：v-for + :key -->
    <div v-else class="skills">
      <el-card
        v-for="skill in skills"
        :key="skill.id"
        class="skill"
        shadow="never"
        @click="emit('pick', skill)"
      >
        <div class="skill__row">
          <!-- v-html 输出的高亮片段用的是全局 mark 样式 -->
          <span class="skill__name" v-html="highlight(skill.name)"></span>
          <el-tag type="primary" effect="light" size="small">{{ skill.category }}</el-tag>
        </div>
        <p class="skill__desc" v-html="highlight(skill.desc)"></p>
        <el-progress
          :percentage="skill.level"
          :stroke-width="8"
          :status="levelStatus(skill.level)"
          :show-text="false"
        />
        <span class="skill__level">熟练度 {{ skill.level }}%</span>
      </el-card>
    </div>
  </el-card>
</template>

<style scoped>
.skill-card {
  border-radius: 20px;
  margin-bottom: 16px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.card-head__title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
}
.card-head__sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
.card-head__search {
  max-width: 320px;
  min-width: 200px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.filter-row__label {
  font-size: 12.5px;
  color: var(--muted);
}
.history-tag {
  cursor: pointer;
}

.empty-desc {
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--muted);
}

.skills {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(258px, 1fr));
  gap: 10px;
  margin-top: 6px;
}
.skill {
  background: var(--soft);
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.2s ease;
}
.skill:hover {
  transform: translateY(-2px);
  border-color: var(--brand);
}
.skill :deep(.el-card__body) {
  padding: 12px 14px;
}
.skill__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.skill__name {
  font-weight: 700;
  font-size: 14.5px;
}
.skill__desc {
  font-size: 12.8px;
  color: var(--muted);
  margin-bottom: 9px;
  min-height: 18px;
}
.skill__level {
  display: block;
  font-size: 11.5px;
  color: var(--muted);
  margin-top: 5px;
}
</style>
