---
read_when:
    - 设置 Synology Chat 以配合 OpenClaw 使用
    - 调试 Synology Chat webhook 路由
summary: Synology Chat webhook 设置和 OpenClaw 配置
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T18:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

状态：内置插件私信渠道，使用 Synology Chat webhook。
该插件接收来自 Synology Chat 出站 webhook 的入站消息，并通过 Synology Chat 入站 webhook 发送回复。

## 内置插件

Synology Chat 在当前的 OpenClaw 版本中作为内置插件提供，因此普通的打包构建不需要单独安装。

如果你使用的是较旧的构建版本，或是不包含 Synology Chat 的自定义安装，
请手动安装：

从本地检出目录安装：

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

详情：[Plugins](/zh-CN/tools/plugin)

## 快速开始

1. 确保 Synology Chat 插件可用。
   - 当前打包的 OpenClaw 版本已内置它。
   - 较旧版本或自定义安装可以使用上面的命令从源码检出目录手动添加。
   - `openclaw onboard` 现在会在与 `openclaw channels add` 相同的渠道设置列表中显示 Synology Chat。
   - 非交互式设置：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. 在 Synology Chat 集成中：
   - 创建一个入站 webhook 并复制其 URL。
   - 创建一个带有你的密钥令牌的出站 webhook。
3. 将出站 webhook URL 指向你的 OpenClaw Gateway 网关：
   - 默认是 `https://gateway-host/webhook/synology`。
   - 或使用你自定义的 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成设置。
   - 引导式：`openclaw onboard`
   - 直接设置：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重启 Gateway 网关，并向 Synology Chat 机器人发送一条私信。

Webhook 认证详情：

- OpenClaw 按以下顺序接受出站 webhook 令牌：`body.token`，然后是
  `?token=...`，再然后是请求头。
- 接受的请求头形式：
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空令牌或缺失令牌会以失败关闭的方式处理。

最小配置：

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 环境变量

对于默认账户，你可以使用环境变量：

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（逗号分隔）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

配置值会覆盖环境变量。

## 私信策略和访问控制

- `dmPolicy: "allowlist"` 是推荐的默认值。
- `allowedUserIds` 接受 Synology 用户 ID 列表（或逗号分隔的字符串）。
- 在 `allowlist` 模式下，空的 `allowedUserIds` 列表会被视为配置错误，webhook 路由将不会启动（如需允许所有人，请使用 `dmPolicy: "open"`）。
- `dmPolicy: "open"` 允许任何发送者。
- `dmPolicy: "disabled"` 会阻止私信。
- 回复接收者绑定默认保持在稳定的数字 `user_id` 上。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是应急兼容模式，会重新启用可变用户名/昵称查找以进行回复投递。
- 配对批准可配合以下命令使用：
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 出站投递

使用数字 Synology Chat 用户 ID 作为目标。

示例：

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

支持通过基于 URL 的文件投递发送媒体。
出站文件 URL 必须使用 `http` 或 `https`，私有网络目标或其他被阻止的网络目标会在 OpenClaw 将该 URL 转发到 NAS webhook 之前被拒绝。

## 多账户

在 `channels.synology-chat.accounts` 下支持多个 Synology Chat 账户。
每个账户都可以覆盖 token、入站 URL、webhook 路径、私信策略和限制。
私信会话会按账户和用户彼此隔离，因此两个不同 Synology 账户上的相同数字 `user_id`
不会共享对话记录状态。
请为每个已启用账户提供不同的 `webhookPath`。OpenClaw 现在会拒绝重复的完全相同路径，
并拒绝启动那些在多账户设置中仅继承共享 webhook 路径的已命名账户。
如果你确实需要为已命名账户保留旧版继承行为，请在该账户上或在 `channels.synology-chat`
上设置 `dangerouslyAllowInheritedWebhookPath: true`，
但重复的完全相同路径仍会以失败关闭的方式被拒绝。建议为每个账户显式设置路径。

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## 安全说明

- 妥善保管 `token`，如果泄露请轮换。
- 保持 `allowInsecureSsl: false`，除非你明确信任自签名的本地 NAS 证书。
- 入站 webhook 请求会按发送者进行令牌验证和速率限制。
- 无效令牌检查使用恒定时间密钥比较，并以失败关闭的方式处理。
- 生产环境推荐使用 `dmPolicy: "allowlist"`。
- 除非你明确需要基于旧版用户名的回复投递，否则请保持 `dangerouslyAllowNameMatching` 关闭。
- 除非你明确接受多账户设置中共享路径路由的风险，否则请保持 `dangerouslyAllowInheritedWebhookPath` 关闭。

## 故障排除

- `Missing required fields (token, user_id, text)`：
  - 出站 webhook 负载缺少必需字段之一
  - 如果 Synology 通过请求头发送 token，请确保 Gateway 网关/代理保留这些请求头
- `Invalid token`：
  - 出站 webhook 密钥与 `channels.synology-chat.token` 不匹配
  - 请求命中了错误的账户/webhook 路径
  - 反向代理在请求到达 OpenClaw 之前去除了 token 请求头
- `Rate limit exceeded`：
  - 来自同一来源的过多无效 token 尝试可能会暂时锁定该来源
  - 已认证的发送者也有单独的按用户计算的消息速率限制
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`：
  - 已启用 `dmPolicy="allowlist"`，但未配置任何用户
- `User not authorized`：
  - 发送者的数字 `user_id` 不在 `allowedUserIds` 中

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信认证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型和加固
