---
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想发布或列出你自己的插件
summary: 社区维护的 OpenClaw 插件：浏览、安装并提交你自己的插件
title: 社区插件
x-i18n:
    generated_at: "2026-04-23T20:56:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

社区插件是第三方软件包，用于为 OpenClaw 扩展新的
渠道、工具、提供商或其他能力。它们由社区构建和维护，发布在 [ClawHub](/zh-CN/tools/clawhub) 或 npm 上，并且可以通过一条命令安装。

ClawHub 是社区插件的规范发现界面。不要仅仅为了让插件更容易被发现而提交只改文档的 PR；请将它发布到 ClawHub。

```bash
openclaw plugins install <package-name>
```

OpenClaw 会先检查 ClawHub，然后自动回退到 npm。

## 已列出的插件

### Apify

使用 20,000+ 个现成爬虫从任意网站抓取数据。让你的智能体只通过提问，就能从 Instagram、Facebook、TikTok、YouTube、Google Maps、Google 搜索、电商网站等提取数据。

- **npm：** `@apify/apify-openclaw-plugin`
- **repo：** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

用于 Codex App Server 对话的独立 OpenClaw bridge。可将聊天绑定到
Codex 线程，通过纯文本与其交谈，并使用聊天原生命令控制恢复、规划、审查、模型选择、压缩等。

- **npm：** `openclaw-codex-app-server`
- **repo：** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企业机器人集成。支持通过任意 DingTalk 客户端发送文本、图片和
文件消息。

- **npm：** `@largezhou/ddingtalk`
- **repo：** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

适用于 OpenClaw 的无损上下文管理插件。基于 DAG 的对话
摘要，带增量压缩 —— 在降低 token 使用量的同时保留完整上下文保真度。

- **npm：** `@martian-engineering/lossless-claw`
- **repo：** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

官方插件，可将智能体追踪导出到 Opik。可监控智能体行为、
成本、token、错误等。

- **npm：** `@opik/opik-openclaw`
- **repo：** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

为你的 OpenClaw 智能体提供一个带实时口型同步、情绪
表情和文本转语音的 Live2D 头像。包含用于 AI 资产生成的创作者工具
以及一键部署到 Prometheus Marketplace。目前处于 alpha 阶段。

- **npm：** `@prometheusavatar/openclaw-plugin`
- **repo：** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

通过 QQ Bot API 将 OpenClaw 连接到 QQ。支持私聊、群组
提及、频道消息，以及语音、图片、视频、
文件等富媒体。

- **npm：** `@tencent-connect/openclaw-qqbot`
- **repo：** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

由腾讯 WeCom 团队提供的 OpenClaw WeCom 渠道插件。基于
WeCom Bot WebSocket 长连接，支持私信与群聊、
流式回复、主动消息、图片/文件处理、Markdown
格式化、内置访问控制，以及文档/会议/消息 Skills。

- **npm：** `@wecom/wecom-openclaw-plugin`
- **repo：** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## 提交你的插件

我们欢迎那些实用、有文档且可安全运行的社区插件。

<Steps>
  <Step title="发布到 ClawHub 或 npm">
    你的插件必须能够通过 `openclaw plugins install \<package-name\>` 安装。
    请发布到 [ClawHub](/zh-CN/tools/clawhub)（推荐）或 npm。
    完整指南请参见 [Building Plugins](/zh-CN/plugins/building-plugins)。

  </Step>

  <Step title="托管在 GitHub 上">
    源代码必须位于公开仓库中，并带有设置文档和 issue
    跟踪器。

  </Step>

  <Step title="仅在需要修改源文档时使用文档 PR">
    你不需要仅为了让插件更易发现而提交文档 PR。请改为将它发布到
    ClawHub。

    只有当 OpenClaw 的源文档确实需要内容
    变更时，才提交文档 PR，例如修正安装指南，或添加属于主文档集的跨仓库
    文档。

  </Step>
</Steps>

## 质量标准

| 要求 | 原因 |
| --------------------------- | --------------------------------------------- |
| 发布在 ClawHub 或 npm 上 | 用户需要 `openclaw plugins install` 能正常工作 |
| 公开 GitHub 仓库 | 便于源码审查、issue 跟踪和透明性 |
| 设置与使用文档 | 用户需要知道如何配置 |
| 活跃维护 | 最近有更新，或能及时处理 issue |

低投入包装器、归属不明确或无人维护的软件包可能会被拒绝。

## 相关内容

- [Install and Configure Plugins](/zh-CN/tools/plugin) — 如何安装任意插件
- [Building Plugins](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [Plugin Manifest](/zh-CN/plugins/manifest) — manifest schema
