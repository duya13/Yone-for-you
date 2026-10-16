/* ============================================================================
   main.js —— 应用入口
   ----------------------------------------------------------------------------
   只做六件事，业务代码一律不写在这里：
     ① 引入 UI 库样式（Element Plus）与本站主题样式
     ② 创建 Pinia 实例，并注册「localStorage 持久化」插件
     ③ 创建 Vue 应用
     ④ 全局注册 Element Plus（含中文语言包与图标）
     ⑤ 注册 Pinia 与 router
     ⑥ 挂载到 index.html 里的 <div id="app">

   ★ 实验四（第二次）新增的第 ①④ 步：
     · Element Plus 采用**全局注册**（指导书 3.2「安装 Element Plus 并全局注册」）：
       一次引入全部组件，写模板时不用逐个 import，实验阶段最省事；
       代价是打包体积变大 —— 生产项目可以换成 unplugin-vue-components
       的按需引入（就是指导书 3.1 提到的另一种方式）。
     · 样式引入顺序很关键：先 element-plus，再我们的 main.css，
       这样 theme.css 里覆盖的 --el-* 变量才能生效（同优先级时后写的胜出）。

   ★ 实验四（第一次）已经就位的第 ②⑤ 步：
     · 少了 app.use(pinia)，任何组件里的 useXxxStore() 都会报
       "getActivePinia() was called but there was no active Pinia"
     · 顺序不能颠倒：router 注册时会立刻执行一次初始导航，
       而守卫里要读 useUserStore()，所以 Pinia 必须已经装好
   ========================================================================== */

/* ---------- ① 样式：UI 库在前，本站主题在后 ---------- */
import 'element-plus/dist/index.css'
/* Element Plus 的暗色变量挂在 html.dark 上，正好和 useUiStore 切主题的方式一致 */
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

/* ---------- ④ Element Plus 及其图标 ---------- */
import ElementPlus from 'element-plus'
/* 组件库默认是英文文案（分页、确认框的按钮等），换成中文包 */
import zhCn from 'element-plus/es/locale/lang/zh-cn'
/* 图标按需具名引入：只把常用图标注册成全局组件。
   注意这里用「具名 import + 静态对象」而不是 `import * as`，
   后者会让打包工具无法做 tree-shaking，把上千个图标全部打进包里。 */
import {
  Search,
  Star,
  Lock,
  SwitchButton,
  Setting,
  House,
  Document,
  Folder,
  Notebook,
  EditPen,
  Delete,
  Plus,
  Refresh,
  Upload,
  Download,
  User,
  Moon,
  Sunny,
  ArrowUp,
  ArrowDown,
  InfoFilled,
  WarningFilled,
  CircleCheck,
  Clock,
  DataLine,
  MagicStick,
  Promotion
} from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router/index.js'
import { persistPlugin } from './stores/persist.js'

/* ---------- ② 创建 Pinia 并挂载持久化插件 ---------- */
const pinia = createPinia()
pinia.use(persistPlugin)

const app = createApp(App)

/* 全局错误处理：组件里抛出的异常会走到这里，
   比在浏览器控制台里刨堆栈更容易定位是哪个组件出的问题。 */
app.config.errorHandler = (err, instance, info) => {
  console.error('[全局错误]', err, '→ 位置：', info, '→ 组件：', instance)
}

/* ---------- ④ 注册 Element Plus 与图标 ----------
   图标包里的常用图标注册成全局组件（如 <el-icon><House /></el-icon>），
   这样在任意页面里都能直接用，不必逐个 import。
   需要「作为属性传递」的图标（如 el-button 的 :icon="Search"）
   仍然在各自的组件里 import —— 属性传的是组件对象，走不了全局注册。 */
const globalIcons = {
  Search,
  Star,
  Lock,
  SwitchButton,
  Setting,
  House,
  Document,
  Folder,
  Notebook,
  EditPen,
  Delete,
  Plus,
  Refresh,
  Upload,
  Download,
  User,
  Moon,
  Sunny,
  ArrowUp,
  ArrowDown,
  InfoFilled,
  WarningFilled,
  CircleCheck,
  Clock,
  DataLine,
  MagicStick,
  Promotion
}
for (const [name, component] of Object.entries(globalIcons)) {
  app.component(name, component)
}
app.use(ElementPlus, { locale: zhCn })

/* ---------- ⑤ 先装 Pinia，再装路由 ---------- */
app.use(pinia)
app.use(router)

/* ---------- ⑥ 挂载 ---------- */
app.mount('#app')
