<script setup>
/* ============================================================================
   ProfileEditDialog —— 编辑个人信息弹窗（实验四第二次：改用 el-dialog + el-form）
   ----------------------------------------------------------------------------
   ★ 本组件演示 defineModel 的第二个典型场景：编辑值。

   两个 model（实验二的成果，继续保留）：
     v-model:visible  控制弹窗显隐（父组件点「编辑信息」打开，子组件点取消/关闭）
     v-model:form     表单草稿对象（子组件里每改一个字，父组件的草稿对象同步变化）

   为什么要两个 model 而不是两个 props + 两个 emit？
     因为这两份数据都是「双向」的：显隐会被父子双方改变，表单值也会被子组件改写，
     用 defineModel 各写一行就够，父组件写 v-model 也最直观。

   ★ 换用 Element Plus 后：
     · el-dialog：自带遮罩、层级、Esc 关闭、出现在 body 下的 Teleport（不用再手写 Teleport + mask）
     · el-form + el-form-item + rules：把「哪个字段不合法、提示什么文案」
       交给组件库管理，不再自己算 errors 数组
     · el-input / el-alert / el-button：输入框、错误提示、按钮统一样式

   注意一个配合细节：el-dialog 的 v-model 绑定的就是我们的 visible model，
   所以「点右上角关闭」和「点取消」都会把 visible 写回 false，行为天然一致。
   ========================================================================== */

import { ref } from 'vue'

/* ---------- 两个 defineModel ---------- */
const visible = defineModel('visible', { type: Boolean, default: false })
const form = defineModel('form', { type: Object, required: true })

const emit = defineEmits({
  /** 校验通过，请求父组件把草稿写回 profile */
  save: null,
  /** 取消编辑 */
  cancel: null
})

/* el-form 实例：调 validate() / resetFields() 都要用它 */
const formRef = ref(null)

/** 表单字段配置：用数组描述，避免在模板里重复写 10 遍同样的结构 */
const fields = [
  { key: 'name', label: '姓名', placeholder: '请输入姓名', required: true },
  { key: 'enName', label: '英文名', placeholder: '如 Yin Kangjun' },
  { key: 'studentId', label: '学号', placeholder: '请输入学号', required: true },
  { key: 'major', label: '专业', placeholder: '请输入专业' },
  { key: 'className', label: '班级', placeholder: '请输入班级' },
  { key: 'direction', label: '方向', placeholder: '如 Web 前端开发' },
  { key: 'city', label: '城市', placeholder: '如 江苏 · 南京' },
  {
    key: 'email',
    label: '邮箱',
    placeholder: 'name@example.com',
    rules: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
  },
  { key: 'phone', label: '电话', placeholder: '138 0000 0000' },
  { key: 'bio', label: '个人简介', placeholder: '介绍一下自己', type: 'textarea', full: true }
]

/**
 * 校验规则：由字段配置派生。
 * 有 required 的字段生成一条「必填」规则；rules 里已有的（如邮箱格式）追加在后面。
 */
const rules = fields.reduce((acc, f) => {
  const list = []
  if (f.required) list.push({ required: true, message: `请输入${f.label}`, trigger: 'blur' })
  if (f.rules) list.push(...f.rules)
  if (list.length) acc[f.key] = list
  return acc
}, {})

const submitting = ref(false)

function onCancel() {
  visible.value = false
  emit('cancel')
}

/** 提交：先让 el-form 校验，通过后才把 save 事件抛给父组件 */
async function onSubmit() {
  if (!formRef.value) return
  submitting.value = true
  try {
    await formRef.value.validate()
    emit('save')
  } catch (e) {
    // validate() 校验失败会 reject，这里不需要额外处理：字段下方已经显示错误提示
    console.warn('[ProfileEditDialog] 表单校验未通过')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- el-dialog 默认就渲染到 body 下并带遮罩，不用再手写 Teleport + mask -->
  <el-dialog
    v-model="visible"
    title="✏️ 编辑个人信息"
    width="640px"
    top="8vh"
    :close-on-click-modal="false"
    class="edit-dialog"
  >
    <template #header>
      <div class="dlg-head">
        <h3>✏️ 编辑个人信息</h3>
        <p class="dlg-head__sub">
          表单用 <code>v-model:form</code> 双向绑定草稿对象，校验通过后点「保存」才写回父组件的
          profile
        </p>
      </div>
    </template>

    <!-- el-form：:model 绑定数据对象，:rules 绑定校验规则，label-width 统一标签宽度 -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="76px"
      label-position="left"
      status-icon
    >
      <el-row :gutter="16">
        <el-col v-for="field in fields" :key="field.key" :span="field.full ? 24 : 12">
          <el-form-item :label="field.label" :prop="field.key">
            <!-- 所有字段都通过 defineModel 提供的 form 双向绑定 -->
            <el-input
              v-model="form[field.key]"
              :type="field.type === 'textarea' ? 'textarea' : 'text'"
              :rows="4"
              :placeholder="field.placeholder"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="提交后写入 useUserStore，首页与后台资料页会立即同步"
      class="dlg-tip"
    />

    <template #footer>
      <el-button @click="onCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dlg-head h3 {
  font-size: 17px;
  margin-bottom: 4px;
}
.dlg-head__sub {
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.7;
}
.dlg-tip {
  margin-top: 4px;
}
</style>
