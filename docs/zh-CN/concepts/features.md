---
read_when:
    - 你想要一份 OpenClaw 支持内容的完整列表
summary: OpenClaw 在渠道、路由、媒体和用户体验方面的能力。
title: 功能
x-i18n:
    generated_at: "2026-04-23T20:46:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5122dbfeff9de7dfa7c900d461c80cba7cc399c87018665180b2294f4783a064
    source_path: concepts/features.md
    workflow: 15
---

## 亮点

<Columns>
  <Card title="渠道" icon="message-square" href="/zh-CN/channels">
    通过单个 Gateway 网关支持 Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等。
  </Card>
  <Card title="插件" icon="plug" href="/zh-CN/tools/plugin">
    内置插件可添加 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等，在当前常规版本中无需单独安装。
  </Card>
  <Card title="路由" icon="route" href="/zh-CN/concepts/multi-agent">
    具备隔离会话的多智能体路由。
  </Card>
  <Card title="媒体" icon="image" href="/zh-CN/nodes/images">
    支持图片、音频、视频、文档，以及图片/视频生成。
  </Card>
  <Card title="应用和 UI" icon="monitor" href="/zh-CN/web/control-ui">
    Web 控制 UI 和 macOS 配套应用。
  </Card>
  <Card title="移动节点" icon="smartphone" href="/zh-CN/nodes">
    iOS 和 Android 节点，支持配对、语音/聊天和丰富的设备命令。
  </Card>
</Columns>

## 完整列表

**渠道：**

- 内置渠道包括 Discord、Google Chat、iMessage（旧版）、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 内置插件渠道包括适用于 iMessage 的 BlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可选的单独安装渠道插件包括 Voice Call，以及诸如微信之类的第三方包
- 第三方渠道插件可进一步扩展 Gateway 网关，例如微信
- 支持通过提及激活的群聊
- 通过 allowlist 和配对实现私信安全

**智能体：**

- 内嵌式智能体运行时，支持工具流式传输
- 多智能体路由，按工作区或发送者隔离会话
- 会话：私聊会合并到共享的 `main`；群组则相互隔离
- 对长回复支持流式传输和分块

**身份验证和提供商：**

- 35+ 模型提供商（Anthropic、OpenAI、Google 等）
- 通过 OAuth 进行订阅身份验证（例如 OpenAI Codex）
- 支持自定义和自托管提供商（vLLM、SGLang、Ollama，以及任何兼容 OpenAI 或兼容 Anthropic 的端点）

**媒体：**

- 输入和输出均支持图片、音频、视频和文档
- 共享的图片生成和视频生成功能表面
- 语音便笺转录
- 通过多个提供商实现文本转语音

**应用和界面：**

- WebChat 和浏览器控制 UI
- macOS 菜单栏配套应用
- iOS 节点，支持配对、Canvas、相机、屏幕录制、定位和语音
- Android 节点，支持配对、聊天、语音、Canvas、相机和设备命令

**工具和自动化：**

- 浏览器自动化、exec、沙箱隔离
- Web 搜索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG、Tavily）
- Cron 作业和 heartbeat 调度
- Skills、插件和工作流流水线（Lobster）
