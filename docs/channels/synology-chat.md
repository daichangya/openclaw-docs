---
read_when:
    - 设置 Synology Chat 与 OpenClaw 的集成
    - 调试 Synology Chat webhook 路由
summary: Synology Chat webhook 设置和 OpenClaw 配置
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T20:42:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

状态：内置插件的私信渠道，使用 Synology Chat webhooks。  
该插件接收来自 Synology Chat 出站 webhook 的入站消息，并通过 Synology Chat 入站 webhook 发送回复。

## 内置插件

在当前 OpenClaw 版本中，Synology Chat 作为内置插件提供，因此常规打包构建不需要单独安装。

如果你使用的是较旧的构建版本，或是不包含 Synology Chat 的自定义安装，请手动安装：

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

详情参见：[Plugins](/zh-CN/tools/plugin)

## 快速设置

1. 确保 Synology Chat 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧/自定义安装可通过上面的命令，从源码检出中手动添加。
   - `openclaw onboard` 现在会在与 `openclaw channels add` 相同的渠道设置列表中显示 Synology Chat。
   - 非交互式设置：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. 在 Synology Chat 集成中：
   - 创建一个入站 webhook 并复制其 URL。
   - 创建一个带有你的 secret token 的出站 webhook。
3. 将出站 webhook URL 指向你的 OpenClaw Gateway 网关：
   - 默认是 `https://gateway-host/webhook/synology`。
   - 或者使用你自定义的 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成设置。
   - 引导式：`openclaw onboard`
   - 直接设置：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重启 Gateway 网关，并向 Synology Chat bot 发送一条私信。

Webhook 身份验证详情：

- OpenClaw 按顺序从 `body.token`、然后 `?token=...`、再然后 headers 中接受出站 webhook token。
- 接受的 header 形式：
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空 token 或缺失 token 会以失败关闭方式处理。

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

`SYNOLOGY_CHAT_INCOMING_URL` 不能通过工作区 `.env` 设置；参见 [工作区 `.env` 文件](/zh-CN/gateway/security)。

## 私信策略与访问控制

- 推荐默认使用 `dmPolicy: "allowlist"`。
- `allowedUserIds` 接受 Synology 用户 ID 列表（或逗号分隔字符串）。
- 在 `allowlist` 模式下，空的 `allowedUserIds` 列表会被视为配置错误，webhook 路由不会启动（如需允许所有人，请使用 `dmPolicy: "open"`）。
- `dmPolicy: "open"` 允许任意发送者。
- `dmPolicy: "disabled"` 阻止私信。
- 回复接收方绑定默认保持基于稳定的数字 `user_id`。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是紧急兼容模式，会重新启用基于可变用户名/昵称查找的回复投递。
- 配对批准可配合以下命令使用：
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 出站投递

请使用数字 Synology Chat 用户 ID 作为目标。

示例：

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

支持通过基于 URL 的文件投递发送媒体。  
出站文件 URL 必须使用 `http` 或 `https`，私有网络或其他被阻止的网络目标会在 OpenClaw 将 URL 转发给 NAS webhook 之前被拒绝。

## 多账户

支持在 `channels.synology-chat.accounts` 下配置多个 Synology Chat 账户。  
每个账户都可以覆盖 token、入站 URL、webhook 路径、私信策略和限制。  
私信会话会按账户和用户隔离，因此两个不同 Synology 账户上的同一个数字 `user_id` 不会共享转录状态。  
请为每个已启用账户提供不同的 `webhookPath`。OpenClaw 现在会拒绝重复的精确路径，并在多账户设置中拒绝启动那些仅继承共享 webhook 路径的具名账户。  
如果你确实需要为具名账户保留旧版继承行为，请在该账户或 `channels.synology-chat` 上设置 `dangerouslyAllowInheritedWebhookPath: true`，但重复的精确路径仍会以失败关闭方式被拒绝。推荐为每个账户显式配置路径。

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

- 请妥善保管 `token`，如有泄露请轮换。
- 除非你明确信任使用自签名本地 NAS 证书，否则请保持 `allowInsecureSsl: false`。
- 入站 webhook 请求会进行 token 验证，并按发送者进行速率限制。
- 无效 token 检查使用常量时间 secret 比较，并以失败关闭方式处理。
- 在生产环境中，优先使用 `dmPolicy: "allowlist"`。
- 除非你明确需要旧版基于用户名的回复投递，否则请保持 `dangerouslyAllowNameMatching` 关闭。
- 除非你明确接受多账户设置中共享路径路由的风险，否则请保持 `dangerouslyAllowInheritedWebhookPath` 关闭。

## 故障排除

- `Missing required fields (token, user_id, text)`：
  - 出站 webhook 负载缺少所需字段之一
  - 如果 Synology 通过 headers 发送 token，请确保 Gateway 网关/代理保留这些 headers
- `Invalid token`：
  - 出站 webhook secret 与 `channels.synology-chat.token` 不匹配
  - 请求命中了错误的账户/webhook 路径
  - 反向代理在请求到达 OpenClaw 前剥离了 token header
- `Rate limit exceeded`：
  - 来自同一来源的过多无效 token 尝试，可能会暂时将该来源锁定
  - 已认证发送者也会受到单独的按用户消息速率限制
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`：
  - 已启用 `dmPolicy="allowlist"`，但未配置任何用户
- `User not authorized`：
  - 发送者的数字 `user_id` 不在 `allowedUserIds` 中

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证与配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为与提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型与安全加固
