<script setup>
/* ============================================================================
   LoginView —— 身份认证页（/login，别名 /auth）
   ----------------------------------------------------------------------------
   ★ 实验四（第一次）的改造点：登录状态不再写在组件里，也不靠父子传参，
     而是交给 Pinia 的 useUserStore 统一持有，于是：

       登录页调 userStore.login()  →  Store 里的 isAuthed 变成 true
                                          ↓
                    router/index.js 的 beforeEach 立刻读到新值
                                          ↓
                     跳回用户原本想去的页面（query.redirect）

     这条链路正是指导书 3.1「路由守卫与 Store 的配合」一节描述的过程。

   ── 本页演示的三个知识点 ───────────────────────────────────────────────
     ① storeToRefs：解构 state / getters 保持响应式（account、loginCount…）
     ② action 收口修改：提交表单只调 store 的 login()，本组件从不直接改 state
     ③ 守卫的 redirect 兜底：登录成功后回到「被拦下来之前想去的地方」

   ★ 实验四（第二次）：换用 Element Plus
     el-card / el-form / el-form-item / el-input（show-password 自带明文切换）
     el-alert（说明「你为什么被带到这里」）/ el-descriptions（演示账号）
     el-button / el-tag / ElMessage（登录结果轻提示）
   ========================================================================== */

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { User, Key } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/useUserStore.js'
import { useUiStore } from '../stores/useUiStore.js'

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const uiStore = useUiStore()

/* ★ 数据用 storeToRefs 解构（保持响应式）；方法继续从 userStore 上调用。 */
const { account, nickname, isAuthed, loginCount, loginTimeText, profile, demoAccount } =
  storeToRefs(userStore)

/* ------------------------------ 表单本地状态 ------------------------------ */
/* 表单里正在输入的内容属于「只影响本页面的临时状态」，所以留在组件内部，
   不放进 Store —— 这也是「状态归属」原则的又一次应用。 */
const formRef = ref(null)
const form = reactive({ username: '', password: '' })
const submitting = ref(false)

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

/** 登录成功后要回到哪儿：优先用守卫塞进来的 ?redirect=xxx */
const redirectTarget = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r ? r : ''
})

/** 顶部提示：告诉用户「你为什么被带到这一页」 */
const fromGuard = computed(() => !!redirectTarget.value)

/* ------------------------------ 事件处理 ------------------------------ */
/** 一键填入演示账号，方便老师/同学直接验收 */
function fillDemo() {
  form.username = demoAccount.value.username
  form.password = demoAccount.value.password
  formRef.value?.clearValidate()
  ElMessage({ message: '已填入演示账号，点「登录」即可', type: 'info' })
  uiStore.pushLog(uiStore.stamp('[LoginView] 一键填入演示账号'))
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    uiStore.pushLog(uiStore.stamp('[LoginView] 表单校验未通过，已阻止提交'))
    return
  }

  submitting.value = true
  /* ★ 唯一的「改状态」入口：调用 Store 的 action，而不是直接给 state 赋值 */
  const result = userStore.login(form.username, form.password)
  submitting.value = false

  if (!result.ok) {
    ElMessage({ message: result.message, type: 'error' })
    uiStore.pushLog(uiStore.stamp(`[LoginView] 登录失败：${result.message}`))
    return
  }

  ElMessage({ message: `登录成功，欢迎回来，${userStore.displayName}`, type: 'success' })
  uiStore.pushLog(
    uiStore.stamp(
      `[LoginView] 登录成功，账号「${userStore.account}」，即将跳转 ${redirectTarget.value || '/admin'}`
    )
  )

  /* 编程式导航：redirect 存在就回原地址，否则进后台 */
  router.replace(redirectTarget.value || { name: 'admin' })
}

function resetForm() {
  form.username = ''
  form.password = ''
  formRef.value?.clearValidate()
  userStore.clearLoginError()
}

/* ------------------------------ 生命周期 ------------------------------ */
onMounted(() => {
  console.log('%c[实验四] 身份认证页（LoginView）挂载完成', 'color:#4f46e5;font-weight:bold;')
  console.log('[LoginView][mounted] 演示账号：', demoAccount.value)
  console.log('[LoginView][mounted] route.query =', route.query)
  console.log('[LoginView][mounted] 登录态来自 Pinia Store useUserStore，isAuthed =', isAuthed.value)
  console.log('[LoginView][mounted] Element Plus：el-form / el-input / el-alert / el-descriptions')

  uiStore.pushLog(
    uiStore.stamp(
      `[LoginView] mounted · ${fromGuard.value ? `被守卫拦截，原目标 ${redirectTarget.value}` : '主动进入登录页'}`
    )
  )
})
</script>

<template>
  <div class="view">
    <!-- ============ 登录卡片 ============ -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div class="block-head">
          <div>
            <h2 class="block-head__title">🔐 身份认证</h2>
            <p class="block-head__sub">
              后台管理页与文章管理页都标记了 meta.requiresAuth，未登录访问会被 beforeEach 拦到这一页
            </p>
          </div>
          <el-tag :type="isAuthed ? 'success' : 'info'" effect="light" round>
            {{ isAuthed ? `已登录：${nickname || account}` : '未登录' }}
          </el-tag>
        </div>
      </template>

      <!-- el-alert：把「为什么被带到这里」讲清楚 -->
      <el-alert
        v-if="fromGuard"
        class="guard-tip"
        type="warning"
        :closable="false"
        show-icon
        title="你是被路由守卫送到这里来的"
        :description="`刚才想访问 ${redirectTarget}，该地址需要登录。登录成功后会把你送回去。`"
      />
      <el-alert
        v-else
        class="guard-tip"
        type="info"
        :closable="false"
        show-icon
        title="直接进入的登录页"
        description="你也可以先试着访问 /admin 或 /articles/manage，体验一下被守卫拦截的流程。"
      />

      <!-- ============ 表单 ============ -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="70px"
        label-position="left"
        class="login-form"
        @keyup.enter="submit"
      >
        <el-form-item label="账号" prop="username">
          <el-input
            v-model="form.username"
            :prefix-icon="User"
            placeholder="admin"
            clearable
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <!-- show-password：Element Plus 自带的「明文/密文」切换，不必自己写眼睛按钮 -->
          <el-input
            v-model="form.password"
            :prefix-icon="Key"
            type="password"
            placeholder="123456"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">🔓 登录</el-button>
          <el-button @click="fillDemo">🧪 填入演示账号</el-button>
          <el-button @click="resetForm">清空</el-button>
          <el-button @click="router.push({ name: 'home' })">🏠 返回首页</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ============ 演示账号 + Store 状态观察 ============ -->
    <el-card class="block" shadow="hover">
      <template #header>
        <div>
          <h2 class="block-head__title">🧪 演示账号与 Store 状态</h2>
          <p class="block-head__sub">本项目前端模拟校验；真实项目应由后端签发凭证</p>
        </div>
      </template>

      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="账号">{{ demoAccount.username }}</el-descriptions-item>
        <el-descriptions-item label="密码">{{ demoAccount.password }}</el-descriptions-item>
        <el-descriptions-item label="历史登录次数">{{ loginCount }} 次</el-descriptions-item>
        <el-descriptions-item label="最近登录时间">{{ loginTimeText }}</el-descriptions-item>
        <el-descriptions-item label="资料里的昵称">{{ profile.name }}</el-descriptions-item>
        <el-descriptions-item label="当前登录态">
          <el-tag :type="isAuthed ? 'success' : 'info'" size="small" effect="light">
            {{ isAuthed ? '已登录' : '未登录' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-alert
        class="store-tip"
        type="success"
        :closable="false"
        show-icon
        title="上面这些值全部来自 useUserStore"
        description="账号、次数、时间来自 state；展示名来自 getters；登录动作来自 actions —— 组件里没有出现一处 state.xxx = ..."
      />
    </el-card>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
}

.block {
  border-radius: 20px;
  margin-bottom: 16px;
}
.block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.block-head__title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
}
.block-head__sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}

.guard-tip {
  margin-bottom: 16px;
}

.login-form {
  max-width: 520px;
}
.login-form :deep(.el-form-item:last-child .el-form-item__content) {
  gap: 8px;
  flex-wrap: wrap;
}

.store-tip {
  margin-top: 14px;
}

/* 让图标（User / Key）在输入框里也跟随主题色 */
.view :deep(.el-input__prefix) {
  color: var(--brand);
}
</style>
