---
read_when:
    - 你想要一份 OpenClaw 支持内容的完整列表
summary: OpenClaw 在各渠道中的能力、路由、媒体和 UX。
title: 功能
x-i18n:
    generated_at: "2026-04-23T22:56:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## 亮点

<Columns>
  <Card title="渠道" icon="message-square" href="/zh-CN/channels">
    通过单个 Gateway 网关接入 Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等更多渠道。
  </Card>
  <Card title="插件" icon="plug" href="/zh-CN/tools/plugin">
    内置插件可添加 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 等更多渠道，在当前常规版本中通常无需单独安装。
  </Card>
  <Card title="路由" icon="route" href="/zh-CN/concepts/multi-agent">
    具有隔离会话的多智能体路由。
  </Card>
  <Card title="媒体" icon="image" href="/zh-CN/nodes/images">
    支持图像、音频、视频、文档，以及图像/视频生成。
  </Card>
  <Card title="应用和 UI" icon="monitor" href="/zh-CN/web/control-ui">
    Web Control UI 和 macOS 配套应用。
  </Card>
  <Card title="移动节点" icon="smartphone" href="/zh-CN/nodes">
    支持配对、语音/聊天和丰富设备命令的 iOS 和 Android 节点。
  </Card>
</Columns>

## 完整列表

**渠道：**

- 内置渠道包括 Discord、Google Chat、iMessage（旧版）、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 内置插件渠道包括适用于 iMessage 的 BlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可选的单独安装渠道插件包括 Voice Call 和第三方软件包，例如 微信
- 第三方渠道插件还可以进一步扩展 Gateway 网关，例如 微信
- 支持基于提及激活的群聊
- 通过允许名单和配对实现私信安全

**智能体：**

- 内嵌智能体运行时，支持工具流式传输
- 多智能体路由，按工作区或发送者隔离会话
- 会话：私聊会合并到共享的 `main`；群组彼此隔离
- 针对长回复支持流式传输和分块

**凭证和提供商：**

- 35+ 模型提供商（Anthropic、OpenAI、Google 等）
- 通过 OAuth 提供订阅凭证（例如 OpenAI Codex）
- 支持自定义和自托管提供商（vLLM、SGLang、Ollama，以及任何兼容 OpenAI 或兼容 Anthropic 的端点）

**媒体：**

- 支持图像、音频、视频和文档的输入与输出
- 共享的图像生成和视频生成能力入口
- 语音消息转写
- 通过多个提供商实现文本转语音

**应用和界面：**

- WebChat 和浏览器 Control UI
- macOS 菜单栏配套应用
- iOS 节点支持配对、Canvas、相机、屏幕录制、位置和语音
- Android 节点支持配对、聊天、语音、Canvas、相机和设备命令

**工具和自动化：**

- 浏览器自动化、exec、沙箱隔离
- Web 搜索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG、Tavily）
- Cron 作业和心跳调度
- Skills、插件和工作流管道（Lobster）

## 相关内容

- [实验性功能](/zh-CN/concepts/experimental-features)
- [智能体运行时](/zh-CN/concepts/agent)
