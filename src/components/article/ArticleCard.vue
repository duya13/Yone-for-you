<script setup>
/* ============================================================================
   ArticleCard —— 文章卡片（列表页与后台共用）
   ----------------------------------------------------------------------------
   设计思路沿用实验二的 ProjectCard：
     · 数据用 props 传（article 对象）
     · 「点了要干什么」用事件往上抛，卡片自己不做导航、不改数据 ——
       这样同一张卡片既能放在公开列表页（点击进详情），
       也能放在后台管理页（点击去编辑）。
     · 需要差异化的地方留具名插槽 #actions / #footer

   ★ 与 ProjectCard 的差别：文章多了一个「发布状态」，
     草稿只有登录后（后台）才看得到，所以 isDraft 决定卡片是否灰化。
   ========================================================================== */

const props = defineProps({
  /** 文章对象 */
  article: { type: Object, required: true },
  /** 是否显示「已置顶」角标 */
  showFeatured: { type: Boolean, default: true }
})

defineEmits({
  /** 打开详情 / 编辑：由父组件决定是「跳详情页」还是「填进编辑表单」 */
  open: null,
  /** 删除 */
  remove: null,
  /** 发布 / 撤回 */
  togglePublish: null
})
</script>

<template>
  <article class="card" :class="{ 'is-draft': article.status === '草稿' }">
    <!-- 顶部色块：用文章自己的 accent 做渐变，列表里一眼能区分 -->
    <div class="card__cover" :style="{ background: `linear-gradient(135deg, ${article.accent}, transparent)` }">
      <span class="card__emoji">{{ article.cover }}</span>
      <span v-if="showFeatured && article.featured" class="card__pin">📌 置顶</span>
    </div>

    <div class="card__body">
      <h3 class="card__title">{{ article.title }}</h3>

      <div class="card__meta">
        <span class="meta-item">🏷️ {{ article.category }}</span>
        <span class="meta-item">📅 {{ article.publishedAt || '未发布' }}</span>
        <span class="meta-item">⏱️ {{ article.readMinutes }} 分钟</span>
        <span class="meta-item">👀 {{ article.views }}</span>
      </div>

      <p class="card__summary">{{ article.summary }}</p>

      <div class="card__tags">
        <span v-for="t in article.tags" :key="t" class="tag">{{ t }}</span>
      </div>
    </div>

    <footer class="card__foot">
      <!-- 默认操作：进详情 -->
      <button class="btn sm" type="button" @click="$emit('open', article)">
        {{ article.status === '草稿' ? '打开（草稿）' : '阅读全文 →' }}
      </button>
      <!-- 具名插槽：后台用它塞「编辑 / 删除 / 发布」等额外按钮 -->
      <slot name="actions" :article="article" />
    </footer>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-sm);
  border-color: var(--brand);
}
/* 草稿：整体降饱和 + 虚线边框，和已发布的卡片区分开 */
.card.is-draft {
  opacity: 0.78;
  border-style: dashed;
}

.card__cover {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  min-height: 58px;
}
.card__emoji {
  font-size: 26px;
  line-height: 1;
}
.card__pin {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--warn);
  background: rgba(245, 158, 11, 0.18);
  border-radius: 999px;
  padding: 3px 9px;
}

.card__body {
  flex: 1;
  padding: 14px 16px 6px;
}
.card__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
}
.card__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 8px 0;
}
.meta-item {
  font-size: 12px;
  color: var(--muted);
}
.card__summary {
  font-size: 13px;
  line-height: 1.75;
  color: var(--muted);
}
.card__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.tag {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--muted);
  border: 1px dashed var(--line);
  border-radius: 999px;
  padding: 2px 9px;
}

.card__foot {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px 16px 14px;
  border-top: 1px dashed var(--line);
  margin-top: 10px;
}
</style>
