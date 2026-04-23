---
description: Real-world OpenClaw projects from the community
read_when:
    - 在寻找真实的 OpenClaw 使用示例
    - 更新社区项目亮点
summary: 由 OpenClaw 驱动的社区构建项目和集成
title: 展示区
x-i18n:
    generated_at: "2026-04-23T16:04:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95dc12399a1a263c268671ffccfc86b069ec908a5bf40adc00663153c281d7d
    source_path: start/showcase.md
    workflow: 15
---

# 展示区

OpenClaw 项目不是玩具演示。人们正在通过自己已经在使用的渠道，交付 PR 审查闭环、移动应用、家庭自动化、语音系统、开发工具以及重度记忆工作流——基于 Telegram、WhatsApp、Discord 和终端的聊天原生构建；无需等待 API 的真实自动化，可用于预订、购物和支持；以及与打印机、扫地机器人、摄像头和家庭系统的现实世界集成。

<Info>
**想被收录展示？** 请在 [Discord 的 #self-promotion 频道](https://discord.gg/clawd) 分享你的项目，或在 [X 上标记 @openclaw](https://x.com/openclaw)。
</Info>

## 视频

如果你想用最短路径从“这是什么？”到“好，我懂了”，请从这里开始。

<CardGroup cols={3}>

<Card title="完整设置演练" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark，28 分钟。从安装、新手引导到获得第一个可用的助手，完整走通全流程。
</Card>

<Card title="社区展示精选" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  更快速地浏览围绕 OpenClaw 构建的真实项目、界面和工作流。
</Card>

<Card title="真实世界中的项目" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  来自社区的示例，从聊天原生编码闭环到硬件与个人自动化。
</Card>

</CardGroup>

## Discord 最新精选

近期在编码、开发工具、移动端和聊天原生产品构建方面的亮眼项目。

<CardGroup cols={2}>

<Card title="从 PR 审查到 Telegram 反馈" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成更改并创建 PR，OpenClaw 审查 diff，然后在 Telegram 中回复建议以及明确的合并结论。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="在 Telegram 中交付的 OpenClaw PR 审查反馈" />
</Card>

<Card title="几分钟内构建酒窖 Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

让 “Robby” (@openclaw) 为本地酒窖构建一个 Skill。它会请求示例 CSV 导出文件和存储路径，然后构建并测试该 Skill（示例中有 962 瓶酒）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw 从 CSV 构建本地酒窖 Skill" />
</Card>

<Card title="Tesco 购物自动驾驶" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每周膳食计划、常购商品、预订配送时段、确认订单。无需 API，只靠浏览器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="通过聊天进行 Tesco 购物自动化" />
</Card>

<Card title="SNAG 截图转 Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

通过热键选取屏幕区域，借助 Gemini vision，立即将 Markdown 放入剪贴板。

  <img src="/assets/showcase/snag.png" alt="SNAG 截图转 Markdown 工具" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

桌面应用，用于在 Agents、Claude、Codex 和 OpenClaw 之间管理 Skills 和命令。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 应用" />
</Card>

<Card title="Telegram 语音消息（papla.media）" icon="microphone" href="https://papla.media/docs">
  **社区** • `voice` `tts` `telegram`

封装 papla.media TTS，并将结果作为 Telegram 语音消息发送（不会有烦人的自动播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="来自 TTS 的 Telegram 语音消息输出" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

通过 Homebrew 安装的辅助工具，用于列出、检查和监视本地 OpenAI Codex 会话（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上的 CodexMonitor" />
</Card>

<Card title="Bambu 3D 打印机控制" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制并排查 BambuLab 打印机问题：状态、任务、摄像头、AMS、校准等。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上的 Bambu CLI Skill" />
</Card>

<Card title="维也纳交通（Wiener Linien）" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

提供维也纳公共交通的实时发车信息、中断情况、电梯状态和路线规划。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien Skill" />
</Card>

<Card title="ParentPay 学校餐食" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

通过 ParentPay 自动预订英国学校餐食。使用鼠标坐标来可靠点击表格单元格。
</Card>

<Card title="R2 上传（Send Me My Files）" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上传到 Cloudflare R2/S3，并生成安全的预签名下载链接。对远程 OpenClaw 实例很有用。
</Card>

<Card title="通过 Telegram 构建 iOS 应用" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

完全通过 Telegram 聊天构建了一个带地图和语音录制功能的完整 iOS 应用，并部署到 TestFlight。

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight 上的 iOS 应用" />
</Card>

<Card title="Oura Ring 健康助手" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

个人 AI 健康助手，将 Oura ring 数据与日历、预约和健身安排整合起来。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring 健康助手" />
</Card>

<Card title="Kev 的 Dream Team（14+ 个智能体）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

在同一个 Gateway 网关下运行 14+ 个智能体，由一个 Opus 4.5 编排器分派任务给 Codex 工作智能体。可查看[技术说明](https://github.com/adam91holt/orchestrated-ai-articles)以及用于智能体沙箱隔离的 [Clawdspace](https://github.com/adam91holt/clawdspace)。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

适用于 Linear 的 CLI，可与智能体工作流（Claude Code、OpenClaw）集成。在终端中管理 issue、项目和工作流。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

通过 Beeper Desktop 读取、发送和归档消息。使用 Beeper 本地 MCP API，因此智能体可以在一个地方管理你的所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 自动化与工作流

日程安排、浏览器控制、支持闭环，以及产品中“直接替我把任务做完”的那一面。

<CardGroup cols={2}>

<Card title="Winix 空气净化器控制" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 发现并确认了净化器控制方式，随后由 OpenClaw 接手管理房间空气质量。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="通过 OpenClaw 控制 Winix 空气净化器" />
</Card>

<Card title="漂亮天空相机抓拍" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

由屋顶摄像头触发：每当天空看起来很美时，请求 OpenClaw 拍下一张天空照片。它设计了一个 Skill 并完成了拍摄。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="由 OpenClaw 捕捉的屋顶摄像头天空快照" />
</Card>

<Card title="可视化晨间简报场景" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

一个定时提示每天早晨通过 OpenClaw persona 生成一张场景图像（天气、任务、日期、喜欢的帖子或语录）。
</Card>

<Card title="Padel 球场预订" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 空闲时段检查器加预订 CLI。再也不会错过空场地。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 截图" />
</Card>

<Card title="会计资料收集" icon="file-invoice-dollar">
  **社区** • `automation` `email` `pdf`

从电子邮件收集 PDF，并为税务顾问准备文档。每月会计工作进入自动驾驶。
</Card>

<Card title="沙发土豆开发模式" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

一边看 Netflix，一边通过 Telegram 重建整个个人网站——从 Notion 到 Astro，迁移了 18 篇文章，DNS 迁移到 Cloudflare。全程没打开过笔记本电脑。
</Card>

<Card title="求职智能体" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜索职位列表，与简历关键词匹配，并返回相关机会及链接。使用 JSearch API 在 30 分钟内构建完成。
</Card>

<Card title="Jira Skill 构建器" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw 连接到 Jira，然后即时生成了一个新的 Skill（那时它甚至还未出现在 ClawHub 上）。
</Card>

<Card title="通过 Telegram 使用 Todoist Skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

实现 Todoist 任务自动化，并让 OpenClaw 直接在 Telegram 聊天中生成该 Skill。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

通过浏览器自动化登录 TradingView，截取图表，并按需进行技术分析。无需 API——只要浏览器控制即可。
</Card>

<Card title="Slack 自动支持" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

监视公司的 Slack 渠道，提供有帮助的回复，并将通知转发到 Telegram。曾在无人要求的情况下，自主修复了已部署应用中的一个生产 bug。
</Card>

</CardGroup>

## 知识与记忆

用于索引、搜索、记忆和推理个人或团队知识的系统。

<CardGroup cols={2}>

<Card title="xuezh 中文学习" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

通过 OpenClaw 提供带发音反馈和学习流程的中文学习引擎。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 发音反馈" />
</Card>

<Card title="WhatsApp 记忆金库" icon="vault">
  **社区** • `memory` `transcription` `indexing`

导入完整的 WhatsApp 导出内容，转录 1000+ 条语音消息，与 git 日志交叉核对，并输出带链接的 markdown 报告。
</Card>

<Card title="Karakeep 语义搜索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

使用 Qdrant 加 OpenAI 或 Ollama embeddings，为 Karakeep 书签添加向量搜索。
</Card>

<Card title="Inside-Out-2 记忆" icon="brain">
  **社区** • `memory` `beliefs` `self-model`

独立的记忆管理器，可将会话文件转化为记忆，再转化为信念，最终形成不断演化的自我模型。
</Card>

</CardGroup>

## 语音与电话

语音优先的入口、电话桥接，以及以转录为核心的工作流。

<CardGroup cols={2}>

<Card title="Clawdia 电话桥接" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

从 Vapi 语音助手到 OpenClaw HTTP 的桥接。让你与智能体进行接近实时的电话通话。
</Card>

<Card title="OpenRouter 转录" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

通过 OpenRouter 进行多语言音频转录（Gemini 等）。可在 ClawHub 上获取。
</Card>

</CardGroup>

## 基础设施与部署

让 OpenClaw 更易于运行和扩展的打包、部署与集成。

<CardGroup cols={2}>

<Card title="Home Assistant 插件" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

运行在 Home Assistant OS 上的 OpenClaw gateway，支持 SSH 隧道和持久化状态。
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

通过自然语言控制和自动化 Home Assistant 设备。
</Card>

<Card title="Nix 打包" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

开箱即用的 nix 化 OpenClaw 配置，用于可复现部署。
</Card>

<Card title="CalDAV 日历" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

使用 khal 和 vdirsyncer 的日历 Skill。自托管日历集成。
</Card>

</CardGroup>

## 家居与硬件

OpenClaw 面向现实世界的一面：家庭、传感器、摄像头、扫地机器人以及其他设备。

<CardGroup cols={2}>

<Card title="GoHome 自动化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

以 OpenClaw 作为交互界面的 Nix 原生家庭自动化，并配有 Grafana 仪表板。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 仪表板" />
</Card>

<Card title="Roborock 扫地机器人" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

通过自然对话控制你的 Roborock 机器人吸尘器。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 状态" />
</Card>

</CardGroup>

## 社区项目

那些已经超越单一工作流，成长为更广泛产品或生态系统的项目。

<CardGroup cols={2}>

<Card title="StarSwap 市场" icon="star" href="https://star-swap.com/">
  **社区** • `marketplace` `astronomy` `webapp`

完整的天文设备交易市场。基于 OpenClaw 生态并围绕其构建。
</Card>

</CardGroup>

## 提交你的项目

<Steps>
  <Step title="分享你的项目">
    在 [Discord 的 #self-promotion 频道](https://discord.gg/clawd) 发帖，或 [在 X 上发推并提及 @openclaw](https://x.com/openclaw)。
  </Step>
  <Step title="包含详细信息">
    告诉我们它的功能，附上仓库或演示链接，如果有截图也请一并分享。
  </Step>
  <Step title="获得展示">
    我们会将亮眼的项目添加到此页面。
  </Step>
</Steps>
