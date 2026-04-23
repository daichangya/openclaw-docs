---
description: Real-world OpenClaw projects from the community
read_when:
    - 寻找真实的 OpenClaw 使用示例
    - 更新社区项目精选
summary: 由 OpenClaw 驱动的社区构建项目和集成
title: 展示区
x-i18n:
    generated_at: "2026-04-23T06:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# 展示区

<div className="showcase-hero">
  <p className="showcase-kicker">构建于聊天、终端、浏览器和客厅之中</p>
  <p className="showcase-lead">
    OpenClaw 项目不是玩具演示。人们正在通过他们早已使用的渠道，交付 PR 审查循环、移动应用、家庭自动化、语音系统、开发工具和重度记忆工作流。
  </p>
  <div className="showcase-actions">
    <a href="#videos">观看演示</a>
    <a href="#fresh-from-discord">浏览项目</a>
    <a href="https://discord.gg/clawd">分享你的项目</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>聊天原生构建</strong>
      <span>Telegram、WhatsApp、Discord、Beeper、网页聊天，以及终端优先工作流。</span>
    </div>
    <div className="showcase-highlight">
      <strong>真实自动化</strong>
      <span>预订、购物、支持、报告和浏览器控制，无需等待 API。</span>
    </div>
    <div className="showcase-highlight">
      <strong>本地 + 物理世界</strong>
      <span>打印机、扫地机器人、摄像头、健康数据、家庭系统和个人知识库。</span>
    </div>
  </div>
</div>

<Info>
**想被推荐展示？** 请在 [Discord 的 #self-promotion](https://discord.gg/clawd) 中分享你的项目，或在 [X 上标记 @openclaw](https://x.com/openclaw)。
</Info>

<div className="showcase-jump-links">
  <a href="#videos">视频</a>
  <a href="#fresh-from-discord">Discord 最新精选</a>
  <a href="#automation-workflows">自动化</a>
  <a href="#knowledge-memory">记忆</a>
  <a href="#voice-phone">语音与电话</a>
  <a href="#infrastructure-deployment">基础设施</a>
  <a href="#home-hardware">家庭与硬件</a>
  <a href="#community-projects">社区</a>
  <a href="#submit-your-project">提交项目</a>
</div>

## 视频

<p className="showcase-section-intro">
  如果你想用最短路径从“这是什么？”走到“好，我懂了”，就从这里开始。
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw：本应由 Siri 提供的自托管 AI（完整安装）"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>完整安装演练</h3>
    <p>VelvetShark，28 分钟。从安装、新手引导到端到端获得第一个可用助手。</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">在 YouTube 上观看</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw 展示视频"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>社区展示集锦</h3>
    <p>快速浏览围绕 OpenClaw 构建的真实项目、界面和工作流。</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">在 YouTube 上观看</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw 社区展示"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>真实世界中的项目</h3>
    <p>来自社区的示例，从聊天原生编码循环到硬件和个人自动化。</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">在 YouTube 上观看</a>
  </div>
</div>

## Discord 最新精选

<p className="showcase-section-intro">
  近期在编码、开发工具、移动端和聊天原生产品构建方面的亮点项目。
</p>

<CardGroup cols={2}>

<Card title="PR 审查 → Telegram 反馈" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成更改 → 打开 PR → OpenClaw 审查 diff，并在 Telegram 中回复“细微建议”以及明确的合并结论（包括需要优先修复的关键问题）。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw 在 Telegram 中交付 PR 审查反馈" />
</Card>

<Card title="几分钟内构建酒窖 Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

向 “Robby”（@openclaw）请求一个本地酒窖 Skill。它会索取示例 CSV 导出和存储位置，然后快速构建/测试该 Skill（示例中为 962 瓶）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw 根据 CSV 构建本地酒窖 Skill" />
</Card>

<Card title="Tesco 购物自动驾驶" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每周餐单 → 常购商品 → 预订配送时段 → 确认订单。无需 API，只用浏览器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="通过聊天实现 Tesco 购物自动化" />
</Card>

<Card title="SNAG 截图转 Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

热键选择屏幕区域 → Gemini 视觉 → Markdown 即刻进入你的剪贴板。

  <img src="/assets/showcase/snag.png" alt="SNAG 截图转 Markdown 工具" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用于在 Agents、Claude、Codex 和 OpenClaw 之间管理技能/命令的桌面应用。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 应用" />
</Card>

<Card title="Telegram 语音便笺（papla.media）" icon="microphone" href="https://papla.media/docs">
  **社区** • `voice` `tts` `telegram`

封装 papla.media TTS，并将结果作为 Telegram 语音便笺发送（不会有烦人的自动播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="来自 TTS 的 Telegram 语音便笺输出" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

通过 Homebrew 安装的辅助工具，用于列出/检查/监视本地 OpenAI Codex 会话（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上的 CodexMonitor" />
</Card>

<Card title="Bambu 3D 打印机控制" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制并排查 BambuLab 打印机问题：状态、任务、摄像头、AMS、校准等。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上的 Bambu CLI Skill" />
</Card>

<Card title="维也纳交通（Wiener Linien）" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

提供维也纳公共交通的实时发车、故障、电梯状态和路线规划。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien Skill" />
</Card>

<Card title="ParentPay 学校餐食" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

通过 ParentPay 自动预订英国学校餐食。使用鼠标坐标可靠点击表格单元格。
</Card>

<Card title="R2 上传（把我的文件发给我）" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上传到 Cloudflare R2/S3，并生成安全的预签名下载链接。非常适合远程 OpenClaw 实例。
</Card>

<Card title="通过 Telegram 构建 iOS 应用" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

完全通过 Telegram 聊天构建了一个带地图和语音录制功能的完整 iOS 应用，并部署到 TestFlight。

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight 上的 iOS 应用" />
</Card>

<Card title="Oura Ring 健康助手" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

个人 AI 健康助手，将 Oura ring 数据与日历、预约和健身安排集成。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring 健康助手" />
</Card>
<Card title="Kev 的梦之队（14+ 智能体）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

一个 Gateway 网关 下运行 14+ 个智能体，由 Opus 4.5 编排器委派给 Codex 工作智能体。完整的[技术说明](https://github.com/adam91holt/orchestrated-ai-articles)涵盖 Dream Team 阵容、模型选择、沙箱隔离、webhooks、心跳和委派流程。[Clawdspace](https://github.com/adam91holt/clawdspace) 用于智能体沙箱隔离。[博客文章](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/)。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

适用于 Linear 的 CLI，可与智能体式工作流（Claude Code、OpenClaw）集成。在终端中管理 issue、项目和工作流。首个外部 PR 已合并！
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

通过 Beeper Desktop 读取、发送和归档消息。使用 Beeper 本地 MCP API，因此智能体可以在一个地方管理你的所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## 自动化与工作流

<p className="showcase-section-intro">
  涵盖排程、浏览器控制、支持循环，以及“直接替我把这件事做了”的产品能力。
</p>

<CardGroup cols={2}>

<Card title="Winix 空气净化器控制" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 发现并确认了净化器控制方式，然后由 OpenClaw 接手管理房间空气质量。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="通过 OpenClaw 控制 Winix 空气净化器" />
</Card>

<Card title="漂亮天空相机抓拍" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

由屋顶摄像头触发：每当天空看起来很美时，就让 OpenClaw 拍一张天空照片 —— 它设计了一个 Skill 并完成了拍摄。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="由 OpenClaw 捕获的屋顶摄像头天空快照" />
</Card>

<Card title="可视化晨间简报场景" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

一个定时提示词每天早晨生成一张“场景”图像（天气、任务、日期、喜欢的帖子/语录），由一个 OpenClaw 人设驱动。
</Card>

<Card title="Padel 球场预订" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic 空位检查 + 预订 CLI。再也不会错过空闲球场。
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 截图" />
</Card>

<Card title="会计资料收集" icon="file-invoice-dollar">
  **社区** • `automation` `email` `pdf`
  
  从电子邮件中收集 PDF，并为税务顾问整理文档。每月会计工作进入自动驾驶。
</Card>

<Card title="沙发土豆开发模式" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

通过 Telegram 重建了整个个人网站，同时还在看 Netflix —— Notion → Astro，迁移了 18 篇文章，DNS 切换到 Cloudflare。全程没打开过笔记本电脑。
</Card>

<Card title="求职智能体" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜索职位列表，根据简历关键词进行匹配，并返回带链接的相关机会。使用 JSearch API 在 30 分钟内构建完成。
</Card>

<Card title="Jira Skill 构建器" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw 连接到 Jira，然后即时生成了一个新 Skill（当时它甚至还不存在于 ClawHub 上）。
</Card>

<Card title="通过 Telegram 使用 Todoist Skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

自动化 Todoist 任务，并让 OpenClaw 直接在 Telegram 聊天中生成该 Skill。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

通过浏览器自动化登录 TradingView，截取图表，并按需执行技术分析。无需 API——只需浏览器控制。
</Card>

<Card title="Slack 自动支持" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

监控公司 Slack 渠道，提供有帮助的回复，并将通知转发到 Telegram。甚至在没有被要求的情况下，自主修复了一个已部署应用中的生产 bug。
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## 知识与记忆

<p className="showcase-section-intro">
  用于索引、搜索、记忆以及基于个人或团队知识进行推理的系统。
</p>

<CardGroup cols={2}>

<Card title="xuezh 中文学习" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  通过 OpenClaw 提供发音反馈和学习流程的中文学习引擎。
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 发音反馈" />
</Card>

<Card title="WhatsApp 记忆金库" icon="vault">
  **社区** • `memory` `transcription` `indexing`
  
  导入完整的 WhatsApp 导出内容，转录 1000+ 条语音便笺，与 git 日志交叉核对，并输出带链接的 markdown 报告。
</Card>

<Card title="Karakeep 语义搜索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  使用 Qdrant + OpenAI/Ollama embeddings，为 Karakeep 书签添加向量搜索。
</Card>

<Card title="头脑特工队 2 记忆系统" icon="brain">
  **社区** • `memory` `beliefs` `self-model`
  
  一个独立的记忆管理器，将会话文件转化为记忆 → 信念 → 持续演化的自我模型。
</Card>

</CardGroup>

<a id="voice-phone"></a>

## 语音与电话

<p className="showcase-section-intro">
  以语音为优先的入口、电话桥接和重度依赖转录的工作流。
</p>

<CardGroup cols={2}>

<Card title="Clawdia 电话桥" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi 语音助手 ↔ OpenClaw HTTP 桥。与你的智能体进行接近实时的电话通话。
</Card>

<Card title="OpenRouter 转录" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

通过 OpenRouter（Gemini 等）进行多语言音频转录。可在 ClawHub 上获取。
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## 基础设施与部署

<p className="showcase-section-intro">
  让 OpenClaw 更易于运行和扩展的打包、部署和集成。
</p>

<CardGroup cols={2}>

<Card title="Home Assistant 附加组件" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  运行在 Home Assistant OS 上的 OpenClaw Gateway 网关，支持 SSH 隧道和持久化状态。
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  通过自然语言控制并自动化 Home Assistant 设备。
</Card>

<Card title="Nix 打包" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  开箱即用的 Nix 化 OpenClaw 配置，用于可复现部署。
</Card>

<Card title="CalDAV 日历" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  使用 khal/vdirsyncer 的日历 Skill。自托管日历集成。
</Card>

</CardGroup>

<a id="home-hardware"></a>

## 家庭与硬件

<p className="showcase-section-intro">
  OpenClaw 的物理世界一面：家庭、传感器、摄像头、扫地机器人和其他设备。
</p>

<CardGroup cols={2}>

<Card title="GoHome 自动化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  以 Nix 为原生的家庭自动化，使用 OpenClaw 作为交互界面，并配有精美的 Grafana 仪表板。
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 仪表板" />
</Card>

<Card title="Roborock 扫地机器人" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  通过自然对话控制你的 Roborock 机器人吸尘器。
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 状态" />
</Card>

</CardGroup>

## 社区项目

<p className="showcase-section-intro">
  那些已经超越单一工作流，发展为更广泛产品或生态系统的项目。
</p>

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **社区** • `marketplace` `astronomy` `webapp`
  
  完整的天文设备交易市场。基于/围绕 OpenClaw 生态系统构建。
</Card>

</CardGroup>

---

## 提交你的项目

<p className="showcase-section-intro">
  如果你正在用 OpenClaw 构建有趣的东西，欢迎发给我们。清晰的截图和具体成果会更有帮助。
</p>

有内容想分享？我们很乐意展示它！

<Steps>
  <Step title="分享它">
    在 [Discord 的 #self-promotion](https://discord.gg/clawd) 中发帖，或 [在 X 上 @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="附上细节">
    告诉我们它的功能，附上仓库/演示链接，如果有截图也请一并分享
  </Step>
  <Step title="获得展示">
    我们会将优秀项目添加到此页面
  </Step>
</Steps>
