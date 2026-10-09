# 三角洲行动 · 群星行动指南

面向国服 PC 玩家，以 S11「群星」为页面主题的单页网站。页面没有二级跳转，包含首屏、游戏介绍、干员档案、武器库、每日密码和键盘口琴。

## 已确认范围
- 官网当前展示的 17 位干员、6 款枪械。技能正文优先展示烽火地带相关说明。
- 干员立绘以指定 GitHub 仓库为主，缺少的旅人、液氮、回响使用官网素材。
- 每日密码分别读取 KKRB 和 Delta Force Codes，按地图、门类型与密码合并去重，同码合并来源，不同码保留差异。北京时间每天 02:00 同步，缺失或失败显示待更新，自动重试；跨日隐藏前日快照。
- 来源没有密码生效日期/国服标签时，不将获取时间当成生效日期。页面保留说明。
- 三音区 C3–B5，自然音键位 Q–U、A–J、Z–M。按住 Tab 升半音，支持多键；Esc、离开区域、失焦释放声音。

## 本地开发
`npm run dev` 启动预览。
`npm run build` 构建。
首次本地数据库初始化需先构建，再执行：
`node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_futuristic_klaw.sql`

正式发布通过 Sites 管理，复用 .openai/hosting.json 的项目 ID。数据库迁移位于 drizzle/。云端同步任务仅调用 /api/passwords/refresh 和读取 /api/passwords，不修改源码、不重新发布网站。

## 资料与素材
官网：https://df.qq.com/cp/a20240906main/
GitHub：https://github.com/Entropy-Increase-Team/delta-force-plugin （素材核对提交 1a00e85a8a32078b2fd1124a4776d131fb62eefb）
密码来源：
- KKRB：https://www.kkrb.net/?theme=dark&viewpage=view%2Fmap%2Fbonus_door
- Delta Force Codes：https://deltaforce.codes/zh ，公开接口 https://deltaforce.codes/api/codes

KKRB 使用该公开页面的正常匿名流程：GET 首页取得临时会话，POST /getMenu（globalData=false）取得 CSRF cookie，POST /checkUAStatus，再 POST /getBonusDoorData（空表单，同时携带临时 Cookie 和 X-CSRF-Token）。会话只保存在单次抓取的内存中，不写入数据库、源码或浏览器。两个来源并行抓取，单个失败不会清掉另一来源本次返回的记录。每五分钟最多尝试一次；现有云任务仍在北京时间02:00同步，03:00、04:00补充重试。

来源的获取时间和数据更新时间不等于密码生效时间。KKRB 逐门 updated 为无时区的14位日期时间文本。AZ3常规门与彩六联动房分开，后者是三位密码；较早更新的记录显示“需核实”，不声称今日有效。跨日缓存隐藏，已明确过期或标注其他适用日期的来源不参与可复制候选。

验证：node --experimental-strip-types tests/passwords.test.mjs（去重、来源差异、门类型、前导零、来源失败隔离及日期边界）。
口琴键位与音色参考：https://www.kkrb.net/melodica_minigame.html?t=1756715100
完整素材来源清单：data/source-manifest.json；GitHub 仓库许可声明保存于 data/GITHUB-ASSETS-LICENSE.txt。第三方游戏素材的权利归原权利人所有。

首屏背景以官网周年庆群像为参考，使用内置 ImageGen 编辑清除原图文字/标识后作为独立背景，标题和按钮由网页实现。输出：public/assets/hero-clean.png，1672×941。
原始生成文件：/Users/Apple_501/.codex/generated_images/01a12036-83d9-72f0-8a59-778bc58da431/exec-957c6736-8e31-447d-8172-69ff0427610e.png。
编辑要求：保留战术干员群像、蓝色城市背景与构图，去除文字、蓝色文字笔刷和周年庆角标，将被移除处补全为自然天空/城市背景；不新增文字，保持真实游戏宣传画风。生成模式：内置 ImageGen 单次编辑。
