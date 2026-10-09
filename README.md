# 三角洲行动 · 群星行动指南

面向国服 PC 玩家，以 S11「群星」为页面主题的单页网站。页面没有二级跳转，包含首屏、游戏介绍、干员档案、武器库、每日密码和键盘口琴。

## 已确认范围
- 官网当前展示的 17 位干员、6 款枪械。技能正文优先展示烽火地带相关说明。
- 干员立绘以指定 GitHub 仓库为主，缺少的旅人、液氮、回响使用官网素材。
- 每日密码分别读取 KKRB 和 Delta Force Codes，按地图、门类型与密码合并去重，同码合并来源，不同码保留差异。北京时间每天 02:00 同步，缺失或失败显示待更新，自动重试；跨日隐藏前日快照。
- 来源没有密码生效日期/国服标签时，不将获取时间当成生效日期。页面保留说明。
- 三音区 C3–B5，自然音键位 Q–U、A–J、Z–M。按住 Tab 升半音，支持多键；Esc、离开区域、失焦释放声音。
- 首屏先显示用户提供的开场视频，滚动或拖动进度条推进约 15 秒的画面；继续下滑衔接原有群像缩放。上滑可回看，支持跳过开场，减少动态效果时直接显示静态首屏。
- 游戏介绍左侧为用户提供的完整 6 分 27 秒视频窗口，点击后播放并保留声音；窗口离屏或被下一板块覆盖时暂停，保留进度。右侧按官网烽火地带的兵种搭配、曼德尔砖、安全撤离整理。

## 本地开发
`npm run dev` 启动预览。
`npm run build` 构建。
首次本地数据库初始化需先构建，再执行：
`node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_futuristic_klaw.sql`

正式发布通过 Sites 管理，复用 .openai/hosting.json 的项目 ID。数据库迁移位于 drizzle/。云端同步任务仅调用 /api/passwords/refresh 和读取 /api/passwords，不修改源码、不重新发布网站。

## GitHub Pages 发布

GitHub Pages 使用独立的 Vite React 入口 `github-pages/main.tsx`，复用现有页面、样式、交互和素材，输出到 `dist-pages/`。原有 Sites 构建和数据库接口继续使用上述命令。Pages 上的密码来自静态文件 `data/passwords.json`，由 GitHub Actions 在发布前生成。

本地构建与预览：

```sh
npm run update:pages-passwords
npm run build:pages
npm run preview:pages
```

项目站点的子路径由 `GITHUB_REPOSITORY=用户名/仓库名` 自动推导；`用户名.github.io` 仓库使用根路径。也可以用 `PAGES_BASE_PATH=/仓库名/` 指定本地验证路径。Actions 使用 GitHub Pages 返回的实际 `base_path`，同时支持项目子路径和自定义域名。

在仓库 Settings → Pages 中选择 GitHub Actions 作为发布来源。`.github/workflows/pages.yml` 在 `main` 推送、手动运行，以及北京时间每天 02:00、03:00、04:00 时执行；后两次补充同步可重试尚未更新或暂不可用的来源。定时任务按 UTC 配置，GitHub 负载高时可能延迟。

抓取脚本直接复用 `lib/password-sources.ts` 和 `lib/password-model.ts`：两来源并行获取，按地图、门类型与密码去重，保留来源差异、前导零和较早记录提示。至少一来源返回可用密码才写入静态汇总；双方均无可用记录时，任务失败并停止上传和部署，线上保留上次成功版本。浏览器仍在跨日后隐藏旧快照，每五分钟及页面重新获得焦点时读取已发布的 JSON；“刷新密码”重新读取文件，实际来源抓取由 Actions 负责。

每次成功采集后，Actions 只提交有变化的 `public/data/passwords.json`，将真实密码快照纳入版本记录。提交使用 `github-actions[bot]` 和工作流的 `GITHUB_TOKEN`，不会递归触发新的推送工作流。未来页面修改推送到 `main` 后会自动重新构建并发布。

## 资料与素材
官网：https://df.qq.com/cp/a20240906main/
烽火地带玩法介绍：https://df.qq.com/cp/a20240906main/#part3
视频来自用户附件，网页版本位于 `public/videos/hero-intro.mp4` 和 `public/videos/firefight-introduction.mp4`。开场使用密集关键帧 H.264 编码方便滚动定位，静音且不自动播放；介绍视频保留完整内容和 AAC 音轨，压缩到约 41 MB，仅在点击播放后加载。两个文件均启用 MP4 faststart，预览封面从各自视频的第 2 秒提取。
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
