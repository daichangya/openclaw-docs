---
read_when:
    - 向新用户介绍 OpenClaw
summary: OpenClaw 是一个适用于 AI 智能体的多渠道 Gateway 网关，可在任何操作系统上运行。
title: OpenClaw
x-i18n:
    generated_at: "2026-04-22T01:38:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 923d34fa604051d502e4bc902802d6921a4b89a9447f76123aa8d2ff085f0b99
    source_path: index.md
    workflow: 15
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _“蜕皮！蜕皮！”_ — 大概是一只太空龙虾

<p align="center">
  <strong>适用于 AI 智能体的任意操作系统 Gateway 网关，覆盖 Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等渠道。</strong><br />
  发一条消息，就能随时随地收到智能体回复。通过一个 Gateway 网关即可运行内置渠道、内置渠道插件、WebChat 和移动节点。
</p>

<Columns>
  <Card title="入门指南" href="/zh-CN/start/getting-started" icon="rocket">
    安装 OpenClaw，几分钟内启动 Gateway 网关。
  </Card>
  <Card title="运行新手引导" href="/zh-CN/start/wizard" icon="sparkles">
    使用 `openclaw onboard` 和配对流程进行引导式设置。
  </Card>
  <Card title="打开控制 UI" href="/web/control-ui" icon="layout-dashboard">
    启动浏览器仪表板，用于聊天、配置和会话。
  </Card>
</Columns>

## OpenClaw 是什么？

OpenClaw 是一个**自托管 Gateway 网关**，可将你常用的聊天应用和渠道界面——包括内置渠道，以及 Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等内置或外部渠道插件——连接到像 Pi 这样的 AI 编码智能体。你只需在自己的机器上（或服务器上）运行一个 Gateway 网关进程，它就会成为你的消息应用与一个始终在线的 AI 助手之间的桥梁。

**它适合谁？** 适合开发者和高级用户，他们希望拥有一个可随时随地发送消息的个人 AI 助手——同时不放弃对自己数据的控制，也不依赖托管服务。

**它有什么不同？**

- **自托管**：运行在你的硬件上，按你的规则工作
- **多渠道**：一个 Gateway 网关可同时服务内置渠道以及内置或外部渠道插件
- **智能体原生**：专为编码智能体打造，支持工具使用、会话、记忆和多智能体路由
- **开源**：采用 MIT 许可证，由社区驱动

**你需要什么？** Node 24（推荐），或兼容用的 Node 22 LTS（`22.14+`），你所选提供商的 API 密钥，以及 5 分钟时间。为了获得最佳质量与安全性，请使用当前可用的最新一代最强模型。

## 工作原理

```mermaid
flowchart LR
  A["聊天应用 + 插件"] --> B["Gateway 网关"]
  B --> C["Pi 智能体"]
  B --> D["CLI"]
  B --> E["Web 控制 UI"]
  B --> F["macOS 应用"]
  B --> G["iOS 和 Android 节点"]
```

Gateway 网关是会话、路由和渠道连接的唯一事实来源。

## 关键能力

<Columns>
  <Card title="多渠道 Gateway 网关" icon="network" href="/zh-CN/channels">
    通过单个 Gateway 网关进程接入 Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 等更多渠道。
  </Card>
  <Card title="插件渠道" icon="plug" href="/zh-CN/tools/plugin">
    内置插件可在当前正式版本中添加 Matrix、Nostr、Twitch、Zalo 等更多渠道。
  </Card>
  <Card title="多智能体路由" icon="route" href="/zh-CN/concepts/multi-agent">
    针对每个智能体、工作区或发送者提供隔离的会话。
  </Card>
  <Card title="媒体支持" icon="image" href="/zh-CN/nodes/images">
    发送和接收图片、音频与文档。
  </Card>
  <Card title="Web 控制 UI" icon="monitor" href="/web/control-ui">
    用于聊天、配置、会话和节点的浏览器仪表板。
  </Card>
  <Card title="移动节点" icon="smartphone" href="/zh-CN/nodes">
    配对 iOS 和 Android 节点，用于 Canvas、相机和支持语音的工作流。
  </Card>
</Columns>

## 快速开始

<Steps>
  <Step title="安装 OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="执行新手引导并安装服务">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="开始聊天">
    在浏览器中打开控制 UI 并发送一条消息：

    ```bash
    openclaw dashboard
    ```

    或连接一个渠道（[Telegram](/zh-CN/channels/telegram) 最快），然后直接用手机聊天。

  </Step>
</Steps>

需要完整的安装和开发设置？请参阅[入门指南](/zh-CN/start/getting-started)。

## 仪表板

Gateway 网关启动后，在浏览器中打开控制 UI。

- 本地默认地址：[http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- 远程访问：[Web 界面](/web) 和 [Tailscale](/zh-CN/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 配置（可选）

配置文件位于 `~/.openclaw/openclaw.json`。

- 如果你**什么都不做**，OpenClaw 会使用内置的 Pi 二进制并以 RPC 模式运行，同时为每个发送者创建独立会话。
- 如果你想进一步收紧权限，建议从 `channels.whatsapp.allowFrom` 和（针对群组的）提及规则开始。

示例：

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## 从这里开始

<Columns>
  <Card title="文档中心" href="/zh-CN/start/hubs" icon="book-open">
    按使用场景组织的所有文档和指南。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="settings">
    核心 Gateway 网关设置、令牌和提供商配置。
  </Card>
  <Card title="远程访问" href="/zh-CN/gateway/remote" icon="globe">
    SSH 和 tailnet 访问模式。
  </Card>
  <Card title="渠道" href="/zh-CN/channels/telegram" icon="message-square">
    针对 Feishu、Microsoft Teams、WhatsApp、Telegram、Discord 等渠道的专属设置说明。
  </Card>
  <Card title="节点" href="/zh-CN/nodes" icon="smartphone">
    iOS 和 Android 节点，支持配对、Canvas、相机和设备操作。
  </Card>
  <Card title="帮助" href="/zh-CN/help" icon="life-buoy">
    常见修复方法和故障排除入口。
  </Card>
</Columns>

## 了解更多

<Columns>
  <Card title="完整功能列表" href="/zh-CN/concepts/features" icon="list">
    完整的渠道、路由和媒体能力说明。
  </Card>
  <Card title="多智能体路由" href="/zh-CN/concepts/multi-agent" icon="route">
    工作区隔离和按智能体划分的会话。
  </Card>
  <Card title="安全" href="/zh-CN/gateway/security" icon="shield">
    令牌、允许列表和安全控制。
  </Card>
  <Card title="故障排除" href="/zh-CN/gateway/troubleshooting" icon="wrench">
    Gateway 网关诊断和常见错误。
  </Card>
  <Card title="关于与致谢" href="/zh-CN/reference/credits" icon="info">
    项目起源、贡献者和许可证。
  </Card>
</Columns>
