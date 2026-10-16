import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    /* ★ 实验四（部署）新增：base 基准路径
       GitHub Pages 的项目站点地址形如
         https://<username>.github.io/<repo-name>/
       也就是说页面挂在一个「子路径」下。如果构建产物里还写着 /assets/xxx.js，
       浏览器会去域名根目录找，结果资源全部 404、页面白屏。
       这里生产构建用相对基准 './'：
         · 不用关心仓库叫什么名字，换仓库 / 改仓库名都不用动配置
         · 本地开发仍是 '/'，避免相对路径影响 HMR 与绝对路径引用
       如果一定要写死仓库名，把 isProd ? './' : '/' 换成 '/你的仓库名/' 即可。 */
    base: isProd ? './' : '/',

    plugins: [
      vue(),
      /* Vue DevTools 是开发期插件，生产构建不注入 */
      ...(isProd ? [] : [vueDevTools()])
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
