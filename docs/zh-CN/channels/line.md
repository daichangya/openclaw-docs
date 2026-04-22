---
read_when:
    - 你想将 OpenClaw 连接到 LINE
    - 你需要设置 LINE webhook 和凭证
    - 你想使用 LINE 专属消息选项
summary: LINE Messaging API 插件设置、配置和用法
title: LINE
x-i18n:
    generated_at: "2026-04-22T00:50:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE 通过 LINE Messaging API 连接到 OpenClaw。该插件作为 Gateway 网关上的 webhook 接收器运行，并使用你的频道访问令牌和频道密钥进行身份验证。

状态：内置插件。支持私信、群聊、媒体、位置、Flex 消息、模板消息和快捷回复。不支持表情回应和线程。

## 内置插件

LINE 在当前的 OpenClaw 版本中作为内置插件提供，因此普通的打包构建无需单独安装。

如果你使用的是较旧版本，或是排除了 LINE 的自定义安装，请手动安装：

```bash
openclaw plugins install @openclaw/line
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 设置

1. 创建一个 LINE Developers 账号并打开 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 创建（或选择）一个 Provider，并添加一个 **Messaging API** 渠道。
3. 从渠道设置中复制 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 设置中启用 **Use webhook**。
5. 将 webhook URL 设置为你的 Gateway 网关端点（必须使用 HTTPS）：

```
https://gateway-host/line/webhook
```

Gateway 网关会响应 LINE 的 webhook 验证（GET）和入站事件（POST）。
如果你需要自定义路径，请设置 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，并相应更新 URL。

安全说明：

- LINE 签名验证依赖请求体内容（对原始请求体执行 HMAC），因此 OpenClaw 会在验证前应用严格的预认证请求体大小限制和超时设置。
- OpenClaw 会基于已验证的原始请求字节处理 webhook 事件。出于签名完整性安全考虑，上游中间件转换后的 `req.body` 值会被忽略。

## 配置

最小配置：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

环境变量（仅默认账号）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

令牌/密钥文件：

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` 和 `secretFile` 必须指向常规文件。不接受符号链接。

多个账号：

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 访问控制

私信默认使用配对。未知发送者会收到一个配对码，在获得批准前，他们的消息会被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允许列表和策略：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：用于私信的已允许 LINE 用户 ID
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：用于群组的已允许 LINE 用户 ID
- 单个群组覆盖：`channels.line.groups.<groupId>.allowFrom`
- 运行时说明：如果完全缺少 `channels.line`，运行时会在群组检查中回退为 `groupPolicy="allowlist"`（即使设置了 `channels.defaults.groupPolicy` 也是如此）。

LINE ID 区分大小写。有效 ID 格式如下：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 聊天室：`R` + 32 个十六进制字符

## 消息行为

- 文本会按 5000 个字符分块。
- Markdown 格式会被去除；代码块和表格会在可能时转换为 Flex 卡片。
- 流式响应会被缓冲；在智能体工作期间，LINE 会收到带有加载动画的完整分块。
- 媒体下载受 `channels.line.mediaMaxMb` 限制（默认值为 10）。

## 渠道数据（富消息）

使用 `channelData.line` 发送快捷回复、位置、Flex 卡片或模板消息。

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE 插件还附带一个用于 Flex 消息预设的 `/card` 命令：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支持

LINE 支持 ACP（智能体通信协议）会话绑定：

- `/acp spawn <agent> --bind here` 会将当前 LINE 聊天绑定到一个 ACP 会话，而不会创建子线程。
- 已配置的 ACP 绑定和当前处于激活状态、绑定到会话的 ACP 会话，在 LINE 上的工作方式与其他会话型渠道相同。

详见 [ACP agents](/zh-CN/tools/acp-agents)。

## 出站媒体

LINE 插件支持通过智能体消息工具发送图片、视频和音频文件。媒体会通过 LINE 专用传递路径发送，并进行适当的预览和跟踪处理：

- **图片**：作为 LINE 图片消息发送，并自动生成预览。
- **视频**：发送时会显式处理预览和内容类型。
- **音频**：作为 LINE 音频消息发送。

出站媒体 URL 必须是公开的 HTTPS URL。OpenClaw 会在将 URL 交给 LINE 之前验证目标主机名，并拒绝 loopback、链路本地和私有网络目标。

当 LINE 专用路径不可用时，通用媒体发送会回退到现有的仅图片路由。

## 故障排除

- **Webhook 验证失败：** 请确保 webhook URL 使用 HTTPS，且 `channelSecret` 与 LINE Console 中的一致。
- **没有入站事件：** 确认 webhook 路径与 `channels.line.webhookPath` 匹配，并且 LINE 可以访问 Gateway 网关。
- **媒体下载错误：** 如果媒体超过默认限制，请提高 `channels.line.mediaMaxMb`。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与安全加固
