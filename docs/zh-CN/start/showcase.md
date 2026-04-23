---
description: Real-world OpenClaw projects from the community
read_when:
    - 寻找真实的 OpenClaw 使用示例 to=final code omitted
    - 更新社区项目精选 to=final code omitted
summary: 由 OpenClaw 驱动的社区项目与集成_北京赛车pkanalysis to=final code omitted
title: Showcase
x-i18n:
    generated_at: "2026-04-23T21:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe06bada76a47f3bb70572179eab5fd1e39041657359fba5dc737cfed3a9df2
    source_path: start/showcase.md
    workflow: 15
---

OpenClaw 项目不是玩具演示。人们正在交付 PR 审查闭环、移动应用、家庭自动化、语音系统、开发工具，以及基于他们已经在使用的渠道构建的重 memory 工作流 —— 在 Telegram、WhatsApp、Discord 和终端上进行原生聊天式构建；无需等待 API，就能完成预订、购物和支持等真实自动化；以及与打印机、扫地机器人、摄像头和家庭系统的现实世界集成。

<Info>
**想被收录展示？** 请在 [Discord 的 #self-promotion 频道](https://discord.gg/clawd) 分享你的项目，或在 [X 上提及 @openclaw](https://x.com/openclaw)。
</Info>

## 视频

如果你想用最短路径从“这是什么？”走到“好，我懂了”，请从这里开始。

<CardGroup cols={3}>

<Card title="完整设置演练" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark，28 分钟。安装、新手引导，以及端到端完成第一个可用助理。
</Card>

<Card title="社区 Showcase 合集" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  更快地浏览围绕 OpenClaw 构建的真实项目、表面和工作流。
</Card>

<Card title="真实世界中的项目" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  来自社区的案例，从原生聊天式编码闭环到硬件和个人自动化。
</Card>

</CardGroup>

## Discord 新鲜动态

最近在编码、开发工具、移动端和原生聊天式产品构建方面的亮眼项目。

<CardGroup cols={2}>

<Card title="PR 审查到 Telegram 反馈" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成更改并创建 PR，OpenClaw 审查 diff，然后在 Telegram 中回复建议和明确的合并结论。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="通过 Telegram 发送的 OpenClaw PR 审查反馈" />
</Card>

<Card title="几分钟做出酒窖 Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

向 “Robby”（@openclaw）请求一个本地酒窖 skill。它会要求提供 CSV 导出样本和存储路径，然后构建并测试该 skill（示例中为 962 瓶）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw 从 CSV 构建本地酒窖 skill" />
</Card>

<Card title="Tesco 购物自动驾驶" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每周餐食计划、常购商品、预订配送时段、确认订单。无需 API，只用浏览器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="通过聊天进行 Tesco 购物自动化" />
</Card>

<Card title="SNAG 截图转 Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

用快捷键选取屏幕区域，Gemini 视觉识别，Markdown 即刻进入剪贴板。

  <img src="/assets/showcase/snag.png" alt="SNAG 截图转 Markdown 工具" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用于在 Agents、Claude、Codex 和 OpenClaw 之间管理 Skills 与命令的桌面应用。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 应用" />
</Card>

<Card title="Telegram 语音消息（papla.media）" icon="microphone" href="https://papla.media/docs">
  **社区** • `voice` `tts` `telegram`

封装 papla.media TTS，并将结果作为 Telegram 语音消息发送（没有烦人的自动播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS 生成的 Telegram 语音消息输出" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

可通过 Homebrew 安装的辅助工具，用于列出、检查和监看本地 OpenAI Codex 会话（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上的 CodexMonitor" />
</Card>

<Card title="Bambu 3D 打印机控制" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制并排查 BambuLab 打印机：状态、任务、摄像头、AMS、校准等。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上的 Bambu CLI skill" />
</Card>

<Card title="维也纳交通（Wiener Linien）" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

提供维也纳公共交通的实时出发信息、故障、电梯状态和路线规划。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill" />
</Card>

<Card title="ParentPay 学校餐食" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

通过 ParentPay 自动预订英国学校餐食。使用鼠标坐标实现可靠的表格单元格点击。
</Card>

<Card title="R2 上传（Send Me My Files）" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上传到 Cloudflare R2/S3，并生成安全的预签名下载链接。适用于远程 OpenClaw 实例。
</Card>

<Card title="通过 Telegram 构建 iOS 应用" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

完全通过 Telegram 聊天构建了一个带地图和语音录制功能的完整 iOS 应用，并部署到 TestFlight。

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight 上的 iOS 应用" />
</Card>

<Card title="Oura Ring 健康助理" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

个人 AI 健康助理，将 Oura Ring 数据与日历、预约和健身计划整合在一起。

  <img src="/assets/showcase/oura-health.png" alt="Oura Ring 健康助理" />
</Card>

<Card title="Kev 的梦之队（14+ 智能体）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

一个 Gateway 网关下运行 14+ 智能体，由 Opus 4.5 编排器委派给 Codex worker。参见[技术说明](https://github.com/adam91holt/orchestrated-ai-articles)和 [Clawdspace](https://github.com/adam91holt/clawdspace)，了解智能体沙箱隔离。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

面向 Linear 的 CLI，可与智能体工作流（Claude Code、OpenClaw）集成。通过终端管理 issue、项目和工作流。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

通过 Beeper Desktop 读取、发送和归档消息。使用 Beeper 本地 MCP API，让智能体可以在一个地方管理你的所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 自动化与工作流

计划调度、浏览器控制、支持闭环，以及“直接替我做完任务”的产品一面。

<CardGroup cols={2}>

<Card title="Winix 空气净化器控制" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 发现并确认了净化器控制方式，随后由 OpenClaw 接管房间空气质量管理。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="通过 OpenClaw 控制 Winix 空气净化器" />
</Card>

<Card title="漂亮天空相机抓拍" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

由屋顶摄像头触发：每当天空看起来很漂亮时，让 OpenClaw 拍一张天空照片。它设计了一个 skill 并完成了拍摄。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="由 OpenClaw 拍摄的屋顶摄像头天空快照" />
</Card>

<Card title="可视化晨间简报场景" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

通过计划任务，每天早晨生成一张场景图（天气、任务、日期、最喜欢的帖子或引语），由 OpenClaw persona 完成。
</Card>

<Card title="Padel 球场预订" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 可用性检查器加预订 CLI。再也不错过空闲球场。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 截图" />
</Card>

<Card title="会计资料收集" icon="file-invoice-dollar">
  **社区** • `automation` `email` `pdf`

从邮件中收集 PDF，并为税务顾问准备文件。每月会计流程自动化。
</Card>

<Card title="沙发土豆开发模式" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

一边看 Netflix，一边通过 Telegram 重建整个个人网站 —— 从 Notion 到 Astro，迁移 18 篇文章，DNS 切换到 Cloudflare。全程没打开笔记本电脑。
</Card>

<Card title="求职智能体" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜索职位列表，按简历关键词匹配，并返回相关机会与链接。使用 JSearch API 在 30 分钟内构建完成。
</Card>

<Card title="Jira skill 构建器" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw 连接到 Jira，然后即时生成了一个新 skill（在它出现在 ClawHub 之前）。
</Card>

<Card title="通过 Telegram 使用 Todoist skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

自动化 Todoist 任务，并让 OpenClaw 直接在 Telegram 聊天中生成该 skill。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

通过浏览器自动化登录 TradingView、截图图表，并按需执行技术分析。无需 API —— 只靠浏览器控制。
</Card>

<Card title="Slack 自动支持" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

监控公司 Slack 频道，提供有帮助的回复，并将通知转发到 Telegram。曾在无人要求的情况下，自主修复了已部署应用中的一个生产缺陷。
</Card>

</CardGroup>

## 知识与 memory

用于索引、搜索、记忆和推理个人或团队知识的系统。

<CardGroup cols={2}>

<Card title="xuezh 中文学习" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

通过 OpenClaw 实现的中文学习引擎，提供发音反馈和学习流程。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 发音反馈" />
</Card>

<Card title="WhatsApp memory 金库" icon="vault">
  **社区** • `memory` `transcription` `indexing`

导入完整 WhatsApp 导出，转录 1000+ 条语音消息，与 git 日志交叉核对，并输出带链接的 Markdown 报告。
</Card>

<Card title="Karakeep 语义搜索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

使用 Qdrant 加 OpenAI 或 Ollama 嵌入，为 Karakeep 书签添加向量搜索。
</Card>

<Card title="头脑特工队 2 memory" icon="brain">
  **社区** • `memory` `beliefs` `self-model`

一个独立的 memory 管理器，可将会话文件转化为 memories，再转化为 beliefs，最终形成不断演化的自我模型。
</Card>

</CardGroup>

## 语音与电话

以语音为先的入口、电话桥接，以及重度依赖转录的工作流。

<CardGroup cols={2}>

<Card title="Clawdia 电话桥接" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

将 Vapi 语音助理桥接到 OpenClaw HTTP。几乎实时地通过电话与你的智能体通话。
</Card>

<Card title="OpenRouter 转录" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

多语言音频转录，基于 OpenRouter（Gemini 等）。可在 ClawHub 获取。
</Card>

</CardGroup>

## 基础设施与部署

用于让 OpenClaw 更易运行和扩展的打包、部署与集成。

<CardGroup cols={2}>

<Card title="Home Assistant 插件" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

运行在 Home Assistant OS 上的 OpenClaw Gateway 网关，支持 SSH 隧道和持久化状态。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

通过自然语言控制和自动化 Home Assistant 设备。
</Card>

<Card title="Nix 打包" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

内置电池的 nix 化 OpenClaw 配置，用于可复现部署。
</Card>

<Card title="CalDAV 日历" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

使用 khal 和 vdirsyncer 的日历 skill。自托管日历集成。
</Card>

</CardGroup>

## 家庭与硬件

OpenClaw 面向现实世界的一面：家庭、传感器、摄像头、扫地机器人和其他设备。

<CardGroup cols={2}>

<Card title="GoHome 自动化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

原生 Nix 的家庭自动化，以 OpenClaw 作为交互界面，并带有 Grafana 仪表盘。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 仪表盘" />
</Card>

<Card title="Roborock 扫地机器人" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

通过自然对话控制你的 Roborock 扫地机器人。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 状态" />
</Card>

</CardGroup>

## 社区项目

那些已经超越单一工作流，发展为更广泛产品或生态的项目。

<CardGroup cols={2}>

<Card title="StarSwap 市场" icon="star" href="https://star-swap.com/">
  **社区** • `marketplace` `astronomy` `webapp`

完整的天文设备交易市场。基于 OpenClaw 生态构建，并围绕其发展。
</Card>

</CardGroup>

## 提交你的项目

<Steps>
  <Step title="分享它">
    请发到 [Discord 的 #self-promotion 频道](https://discord.gg/clawd)，或 [在 X 上 @openclaw](https://x.com/openclaw)。
  </Step>
  <Step title="附上细节">
    告诉我们它是做什么的，附上仓库或演示链接，如果有截图也请一起分享。
  </Step>
  <Step title="获得展示">
    我们会将优秀项目添加到本页面。
  </Step>
</Steps>
