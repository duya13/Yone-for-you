# -*- coding: utf-8 -*-
"""写入「实验结果及分析」单元格内容：任务清单 + 运行截图 + 分析。"""
import sys
sys.path.insert(0, r"D:/vue/vue-project/_report_shots_exp3_final")
from drive import para, image, SHOTS

idx = 1984

def head(t):
    global idx
    idx = para(idx, t, bold=True, size=12)

def body(t):
    global idx
    idx = para(idx, t, size=10.5)

head("一、分条实验任务")
body("1. 安装并注册 Vue Router：新建 src/router/index.js 创建路由实例，在 main.js 中 app.use(router) 完成注册，配置首页、项目、关于及 404 页面。")
body("2. 完成页面导航：用 <RouterLink> 替换按钮切换，使用命名路由，并通过 router-link-active、router-link-exact-active 实现导航高亮。")
body("3. 配置动态路由：新增项目详情页 /projects/:id，在组件中用 useRoute().params.id 或 props:true 获取项目编号。")
body("4. 配置嵌套路由：把项目列表、项目详情挂在父路由 ProjectsLayout 下的 <RouterView> 中。")
body("5. 编程式导航：在详情页用 router.push()、router.replace()、router.go(-1) 完成跳转、返回与无效地址处理。")
body("6. 新增身份认证页与后台管理页：后台管理用 meta.requiresAuth 标记，由全局前置守卫 beforeEach 拦截未登录访问。")
body("7. 路由元信息与守卫：用 meta.title 配合 beforeEach 让浏览器标题随页面变化，并完成登录访问控制。")
body("8. 其他：配置 Hash/History 两种模式切换、scrollBehavior 滚动行为与 404 通配符路由。")

head("二、运行结果截图与说明")

items = [
    ("1. 根路径重定向到首页（/ → /home）", "首页-身份信息与home导航高亮", "访问根路径 / 由 redirect 自动跳到 /home，显示个人信息，顶部「个人主页」导航高亮。"),
    ("2. 展开详细资料（显示姓名与学号）", "展开详细资料-显示姓名与学号", "首页个人资料展开后显示姓名「殷康竣」、学号「249980641」等可标识个人身份的内容。"),
    ("3. 项目列表页（嵌套路由 /projects）", "项目列表-projects-嵌套路由", "父路由 ProjectsLayout 提供公共头部与面包屑，子路由 ProjectListView 渲染在子出口中。"),
    ("4. 嵌套路由下顶部导航父级保持高亮", "嵌套路由下顶部导航父级保持高亮", "在 /projects 子路由时顶部「项目展示」因前缀匹配仍高亮，体现 router-link-active。"),
    ("5. 项目详情页（动态路由 /projects/:id）", "项目详情-动态路由-projects-p0", "URL 中的 p0 成为动态参数，同一个 ProjectDetailView 根据 id 显示不同项目。"),
    ("6. 编程式导航按钮组（push / replace / go）", "编程式导航按钮组-push-replace-go", "详情页提供返回上一页(go(-1))、返回列表(push)、无效地址(replace)等按钮演示编程式导航。"),
    ("7. 无效动态参数兜底提示", "无效动态参数兜底提示", "访问 /projects/不存在编号 时页面提示该编号不存在并给出恢复导航，而不是直接 404。"),
    ("8. 关于本站页（路由表速查）", "关于本站-路由表速查", "/about 页面汇总展示当前项目的路由表结构。"),
    ("9. 未登录访问后台被守卫拦截到登录页", "未登录访问admin被守卫拦截到login", "直接访问 /admin 时全局守卫检查到未登录，改跳到 /login?redirect=/admin。"),
    ("10. 身份认证页（/login）", "身份认证页-login", "展示登录表单，并说明登录成功后会 replace 回原本想访问的地址。"),
    ("11. 一键填入演示账号", "一键填入演示账号", "点击「填入演示账号」自动填好用户名密码，便于验收。"),
    ("12. 登录成功进入后台管理", "登录成功进入后台管理", "登录成功后用 router.replace 跳回 /admin，显示后台管理内容。"),
    ("13. 后台管理 · 项目管理", "后台管理-项目管理", "后台可新增/编辑/删除项目，修改写入共享 store，回到公开展示页即时生效。"),
    ("14. 退出登录后再访问后台仍被拦截", "退出登录后再访问后台仍被拦截", "退出登录后再次访问 /admin 仍被拦截到登录页，说明访问控制有效。"),
    ("15. 暗色主题下的关于页", "暗色主题下的关于页", "主题状态跨路由共享，切换暗色后跳转到「关于本站」页面主题保持一致。"),
    ("16. 404 通配符路由", "404通配符路由", "访问不存在的地址（如 /home123）时命中通配符路由 /:pathMatch(.*)*，显示友好的 404 页面。"),
]

for title, filekey, desc in items:
    head(title)
    body(desc)
    p = f"{SHOTS}/result/{filekey}.png"
    idx = image(idx, p, w=420)

head("三、结果分析")
body("1. 所有页面都能通过独立 URL 访问，刷新、分享、前进后退均正常，说明路由匹配与 History 模式配置正确。")
body("2. 导航高亮、动态参数、嵌套路由渲染均符合预期，说明 RouterLink、params 与父子路由出口工作正常。")
body("3. 未登录访问 /admin 被拦截、登录后自动跳回原目标，说明 meta.requiresAuth 与全局前置守卫配合正确。")
body("4. 浏览器标题随 meta.title 变化，说明守卫在每次跳转前统一更新了标题。")
body("5. 通过本次实验，掌握了基础路由、动态路由、嵌套路由、编程式导航、重定向、路由元信息与路由守卫的配置方法。")
body("6. 体会到 SPA 中 URL 与页面组件的对应关系，以及把状态抽到 store 后跨路由共享数据的好处。")

print("DONE, final idx =", idx)
