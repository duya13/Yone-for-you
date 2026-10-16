<script setup>
/* ============================================================================
   ProfileCard —— 个人基本信息卡片（实验四第二次：改用 Element Plus 呈现）
   ----------------------------------------------------------------------------
   组件边界分析：
     这是一块「职责独立、结构完整」的页面区域（头像 + 基本信息 + 简介 + 详情），
     所以从 App.vue 里拆出来单独成组件。

   本组件覆盖的通信方式（实验二建立，一直没变）：
     ① defineProps  接收父组件传下来的 profile（只读）
     ② defineEmits  把「用户点了展开 / 点了编辑」报告给父组件
     ③ 插槽         卡片右上角的操作区交给父组件塞

   ★ 换用 Element Plus 后各元素的对应关系：
     原来                    现在
     ──────────────────────  ──────────────────────
     BaseCard（自研卡片）    el-card（shadow="hover"，自带 header/body 分区）
     自研圆形徽章 + <img>    el-avatar（shape="square"、:size，自带加载失败兜底）
     自研标签                el-tag（可切换 type / effect 配色）
     自研 detail-grid        el-descriptions（描述列表：label + value 自动对齐）
     自研按钮                el-button（type="primary" 等语义化样式）
     自研分隔线              el-divider

   头像兜底策略保留：el-avatar 自己有 error 事件，
   但这里仍用「显式替换 src」的方式，方便演示 el-avatar 的 :src 绑定与错误处理。
   ========================================================================== */

import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useActivity, stamp } from '../../composables/useActivity.js'
import { useProjectStore } from '../../stores/useProjectStore.js'

/* ---------- ① props：父组件传入的数据，子组件只读 ---------- */
const props = defineProps({
  /** 个人信息对象：{ avatar, name, enName, studentId, major, ... } */
  profile: { type: Object, required: true },
  /**
   * 详情区域是否展开。
   * 注意这里没有把它做成组件内部状态——因为父组件还要用它来计算
   * 「已展开 N 次」，属于需要共享的状态，所以由父组件持有，通过 props 传进来。
   */
  expanded: { type: Boolean, default: false },
  /** 展开次数，仅用于展示 */
  openCount: { type: Number, default: 0 }
})

/* ---------- ② emits：只报告事件，不替父组件做决定 ---------- */
const emit = defineEmits({
  /** 请求展开 / 收起详情 */
  'toggle-detail': null,
  /** 请求打开编辑弹窗 */
  edit: null
})

const { pushLog } = useActivity()
/* 收藏数来自 Pinia（原本在实验三的 App.vue 里），这里直接读，不用父组件转手 */
const { favoriteIds } = storeToRefs(useProjectStore())

/* ---------- 内置兜底头像（内联 SVG，断网也能显示） ---------- */
const FALLBACK_AVATAR =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/>' +
      '</linearGradient></defs>' +
      '<rect width="200" height="200" fill="url(#g)"/>' +
      '<circle cx="100" cy="76" r="33" fill="#ffffff" opacity="0.95"/>' +
      '<path d="M40 172c6-34 32-52 60-52s54 18 60 52z" fill="#ffffff" opacity="0.95"/>' +
      '</svg>'
  )

/* ---------- 组件内部状态：头像地址（失败时替换成兜底图） ---------- */
const avatarSrc = ref(props.profile.avatar || FALLBACK_AVATAR)

function onAvatarError() {
  if (avatarSrc.value !== FALLBACK_AVATAR) {
    avatarSrc.value = FALLBACK_AVATAR
    console.warn('[ProfileCard] 头像加载失败，已切换为内置兜底头像')
    pushLog(stamp('[ProfileCard] 头像加载失败，已切换兜底头像'))
  }
}

/* ---------- computed：由 props 派生，父组件数据变化自动更新 ---------- */
const details = computed(() => [
  { key: '学号', value: props.profile.studentId },
  { key: '专业', value: props.profile.major },
  { key: '班级', value: props.profile.className },
  { key: '方向', value: props.profile.direction },
  { key: '城市', value: props.profile.city },
  { key: '邮箱', value: props.profile.email },
  { key: '电话', value: props.profile.phone }
])

/* 兴趣标签的配色：奇数/偶数换一种 type，视觉上更有层次 */
const tagType = (index) => ['primary', 'success', 'warning'][index % 3]
</script>

<template>
  <!-- el-card：Element Plus 的卡片容器，自带头部与主体分区 -->
  <el-card class="profile-card" shadow="hover">
    <template #header>
      <div class="card-head">
        <div>
          <h2 class="card-head__title">🧑‍💻 个人基本信息</h2>
          <p class="card-head__sub">
            defineProps 接收数据 · defineEmits 上报操作 · el-card / el-avatar / el-descriptions 呈现
          </p>
        </div>
        <!-- 卡片右上角操作区 -->
        <div class="card-head__actions">
          <el-button @click="emit('toggle-detail')">
            {{ expanded ? '▲ 收起详细资料' : '▼ 展开详细资料' }}
          </el-button>
          <el-button type="primary" @click="emit('edit')">✏️ 编辑信息</el-button>
        </div>
      </div>
    </template>

    <div class="profile">
      <div class="avatar-box">
        <!-- el-avatar：头像组件，shape 支持 circle / square，:size 可传数字或尺寸名 -->
        <el-avatar
          class="avatar"
          shape="square"
          :size="112"
          :src="avatarSrc"
          :alt="profile.name + ' 的头像'"
          @error="onAvatarError"
        />
        <!-- el-badge：右下角「在线」状态角标 -->
        <el-tag class="avatar-box__badge" type="success" effect="dark" size="small" round>
          在线
        </el-tag>
      </div>

      <div class="info">
        <h1 class="info__name">
          {{ profile.name }}
          <span v-if="profile.enName" class="info__en">/ {{ profile.enName }}</span>
        </h1>
        <p class="info__sub">{{ profile.major }} · {{ profile.className }} · {{ profile.direction }}</p>

        <!-- 兴趣标签：el-tag 按 index 轮换配色，可关闭、可点击 -->
        <div class="tags">
          <el-tag
            v-for="(tag, i) in profile.interestTags"
            :key="tag"
            :type="tagType(i)"
            effect="light"
            round
          >
            {{ tag }}
          </el-tag>
          <el-tag type="info" effect="plain" round>
            ⭐ 已收藏 {{ favoriteIds.length }} 个项目
          </el-tag>
        </div>

        <el-divider content-position="left">个人简介</el-divider>
        <p class="bio">{{ profile.bio }}</p>

        <!-- ============ 详细资料：el-descriptions 描述列表 ============
             :column="2" 表示两列；border 给表格加边框；
             每一项用 el-descriptions-item 声明 label 与内容 -->
        <el-collapse-transition>
          <div v-show="expanded" class="detail-box">
            <el-descriptions title="详细信息" :column="2" border size="small">
              <el-descriptions-item
                v-for="item in details"
                :key="item.key"
                :label="item.key"
              >
                {{ item.value }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-collapse-transition>

        <p class="foot-tip">
          {{
            openCount > 0
              ? `已展开 ${openCount} 次（该计数由父组件 ProfileView 维护）`
              : '点「展开详细资料」查看完整信息'
          }}
        </p>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.profile-card {
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
.card-head__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.profile {
  display: flex;
  gap: 22px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.avatar-box {
  position: relative;
  flex: 0 0 auto;
}
.avatar {
  border-radius: 26px;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.38);
  background: var(--soft);
}
.avatar-box__badge {
  position: absolute;
  right: -6px;
  bottom: -6px;
  border: 2px solid var(--card);
}

.info {
  flex: 1 1 340px;
  min-width: 260px;
}
.info__name {
  font-size: 26px;
  line-height: 1.2;
  font-weight: 700;
  margin-bottom: 4px;
}
.info__en {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--muted);
  margin-left: 6px;
}
.info__sub {
  font-size: 13.5px;
  color: var(--muted);
  margin-bottom: 14px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.bio {
  background: var(--soft);
  border-left: 3px solid var(--brand);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13.8px;
  line-height: 1.8;
  color: var(--muted);
}

.detail-box {
  margin-top: 14px;
}

.foot-tip {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 12px;
}
</style>
