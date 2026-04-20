---
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想发布或列出你自己的插件
summary: 社区维护的 OpenClaw 插件：浏览、安装并提交你自己的插件
title: 社区插件
x-i18n:
    generated_at: "2026-04-20T19:24:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcf529e86df78d89afee29e50e5be9892a06d9317036cc98152843fa70415460
    source_path: plugins/community.md
    workflow: 15
---

# 社区插件

社区插件是用于扩展 OpenClaw 的第三方软件包，可添加新的渠道、工具、提供商或其他能力。它们由社区构建和维护，发布在 [ClawHub](/zh-CN/tools/clawhub) 或 npm 上，并且可通过一条命令安装。

ClawHub 是社区插件的权威发现入口。不要仅为了提升可发现性而提交只改文档的 PR 来把你的插件加到这里；请改为将其发布到 ClawHub。

```bash
openclaw plugins install <package-name>
```

OpenClaw 会先检查 ClawHub，并在需要时自动回退到 npm。

## 已列出的插件

### Apify

使用 20,000 多个现成爬虫从任何网站抓取数据。让你的智能体只需通过提问，就能从 Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、电商网站等提取数据。

- **npm：** `@apify/apify-openclaw-plugin`
- **repo：** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

面向 Codex App Server 会话的独立 OpenClaw bridge。将聊天绑定到一个 Codex 线程，用纯文本与其对话，并通过聊天原生命令控制恢复、规划、审查、模型选择、压缩等功能。

- **npm：** `openclaw-codex-app-server`
- **repo：** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企业机器人集成。支持通过任意 DingTalk 客户端发送文本、图片和文件消息。

- **npm：** `@largezhou/ddingtalk`
- **repo：** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

适用于 OpenClaw 的无损上下文管理插件。基于 DAG 的会话摘要与增量压缩，在减少 token 使用量的同时保留完整的上下文保真度。

- **npm：** `@martian-engineering/lossless-claw`
- **repo：** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

将智能体追踪导出到 Opik 的官方插件。可监控智能体行为、成本、token、错误等信息。

- **npm：** `@opik/opik-openclaw`
- **repo：** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

通过 QQ Bot API 将 OpenClaw 连接到 QQ。支持私聊、群提及、频道消息，以及语音、图片、视频、文件等富媒体内容。

- **npm：** `@tencent-connect/openclaw-qqbot`
- **repo：** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

由腾讯企业微信团队开发的 OpenClaw WeCom 渠道插件。基于 WeCom Bot WebSocket 长连接，支持私信和群聊、流式回复、主动消息发送、图片/文件处理、Markdown 格式化、内置访问控制，以及文档/会议/消息 Skills。

- **npm：** `@wecom/wecom-openclaw-plugin`
- **repo：** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## 提交你的插件

我们欢迎有用、有文档支持且可安全运行的社区插件。

<Steps>
  <Step title="发布到 ClawHub 或 npm">
    你的插件必须可以通过 `openclaw plugins install \<package-name\>` 安装。
    请发布到 [ClawHub](/zh-CN/tools/clawhub)（推荐）或 npm。
    完整指南请参阅 [Building Plugins](/zh-CN/plugins/building-plugins)。

  </Step>

  <Step title="托管在 GitHub 上">
    源代码必须位于带有设置文档和 issue 跟踪器的公开仓库中。

  </Step>

  <Step title="仅在源文档需要变更时使用文档 PR">
    你不需要为了让插件可被发现而提交文档 PR。请改为将其发布到 ClawHub。

    只有当 OpenClaw 的源文档确实需要内容变更时，才提交文档 PR，例如更正安装指引，或添加应属于主文档集的跨仓库文档。

  </Step>
</Steps>

## 质量门槛

| 要求 | 原因 |
| --------------------------- | --------------------------------------------- |
| 发布在 ClawHub 或 npm 上 | 用户需要 `openclaw plugins install` 能正常工作 |
| 公开的 GitHub 仓库 | 便于源码审查、问题跟踪和透明度 |
| 设置和使用文档 | 用户需要知道如何配置它 |
| 持续维护 | 有近期更新或能及时响应 issue 处理 |

低质量封装、归属不清或无人维护的软件包可能会被拒绝。

## 相关内容

- [Install and Configure Plugins](/zh-CN/tools/plugin) — 如何安装任何插件
- [Building Plugins](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [Plugin Manifest](/zh-CN/plugins/manifest) — 清单 schema
