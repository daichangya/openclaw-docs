---
read_when:
    - 你想为 OpenClaw 选择一个聊天渠道
    - 你需要一个受支持消息平台的快速概览
summary: OpenClaw 可连接的消息平台
title: 聊天渠道
x-i18n:
    generated_at: "2026-04-23T20:41:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw 可以通过你已经在使用的任何聊天应用与你交流。每个渠道都通过 Gateway 网关连接。
所有渠道都支持文本；媒体和表情回应支持会因渠道而异。

## 支持的渠道

- [BlueBubbles](/zh-CN/channels/bluebubbles) — **iMessage 的推荐方案**；使用 BlueBubbles macOS 服务器 REST API，提供完整功能支持（内置插件；编辑、撤回、效果、表情回应、群组管理——编辑功能目前在 macOS 26 Tahoe 上不可用）。
- [Discord](/zh-CN/channels/discord) — Discord Bot API + Gateway 网关；支持服务器、频道和私信。
- [Feishu](/zh-CN/channels/feishu) — 通过 WebSocket 的 Feishu/Lark 机器人（内置插件）。
- [Google Chat](/zh-CN/channels/googlechat) — 通过 HTTP webhook 的 Google Chat API 应用。
- [iMessage (legacy)](/zh-CN/channels/imessage) — 基于 imsg CLI 的传统 macOS 集成（已弃用，新部署请使用 BlueBubbles）。
- [IRC](/zh-CN/channels/irc) — 经典 IRC 服务器；支持频道和私信，并带有配对/允许列表控制。
- [LINE](/zh-CN/channels/line) — LINE Messaging API 机器人（内置插件）。
- [Matrix](/zh-CN/channels/matrix) — Matrix 协议（内置插件）。
- [Mattermost](/zh-CN/channels/mattermost) — Bot API + WebSocket；支持频道、群组、私信（内置插件）。
- [Microsoft Teams](/zh-CN/channels/msteams) — Bot Framework；支持企业场景（内置插件）。
- [Nextcloud Talk](/zh-CN/channels/nextcloud-talk) — 通过 Nextcloud Talk 提供的自托管聊天（内置插件）。
- [Nostr](/zh-CN/channels/nostr) — 通过 NIP-04 的去中心化私信（内置插件）。
- [QQ Bot](/zh-CN/channels/qqbot) — QQ Bot API；支持私聊、群聊和富媒体（内置插件）。
- [Signal](/zh-CN/channels/signal) — `signal-cli`；注重隐私。
- [Slack](/zh-CN/channels/slack) — Bolt SDK；工作区应用。
- [Synology Chat](/zh-CN/channels/synology-chat) — 通过出站 + 入站 webhook 的 Synology NAS Chat（内置插件）。
- [Telegram](/zh-CN/channels/telegram) — 通过 grammY 的 Bot API；支持群组。
- [Tlon](/zh-CN/channels/tlon) — 基于 Urbit 的消息工具（内置插件）。
- [Twitch](/zh-CN/channels/twitch) — 通过 IRC 连接接入 Twitch 聊天（内置插件）。
- [Voice Call](/zh-CN/plugins/voice-call) — 通过 Plivo 或 Twilio 提供电话功能（插件，需单独安装）。
- [WebChat](/zh-CN/web/webchat) — 通过 WebSocket 的 Gateway 网关 WebChat UI。
- [WeChat](/zh-CN/channels/wechat) — 通过扫码登录的腾讯 iLink Bot 插件；仅支持私聊（外部插件）。
- [WhatsApp](/zh-CN/channels/whatsapp) — 最常用；使用 Baileys，并需要扫码配对。
- [Zalo](/zh-CN/channels/zalo) — Zalo Bot API；越南流行的消息应用（内置插件）。
- [Zalo Personal](/zh-CN/channels/zalouser) — 通过扫码登录的 Zalo 个人账户（内置插件）。

## 注意事项

- 渠道可以同时运行；配置多个渠道后，OpenClaw 会按聊天进行路由。
- 通常最快的设置方式是 **Telegram**（只需简单的机器人令牌）。WhatsApp 需要扫码配对，
  并会在磁盘上存储更多状态。
- 群组行为因渠道而异；参见 [Groups](/zh-CN/channels/groups)。
- 出于安全考虑，会强制执行私信配对和允许列表；参见 [Security](/zh-CN/gateway/security)。
- 故障排除：[渠道故障排除](/zh-CN/channels/troubleshooting)。
- 模型提供商文档单独提供；参见 [模型提供商](/zh-CN/providers/models)。
