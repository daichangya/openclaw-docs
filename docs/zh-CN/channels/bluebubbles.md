---
read_when:
    - 设置 BlueBubbles 渠道
    - 故障排除 webhook 配对
    - 在 macOS 上配置 iMessage
summary: 通过 BlueBubbles macOS 服务器接入 iMessage（REST 发送/接收、正在输入、表情回应、配对、高级操作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-20T17:06:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d7186ba92aa63bc811f874e5a910af884c17ad7d6394b5624eec63e17adc2f6
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles（macOS REST）

状态：通过 HTTP 与 BlueBubbles macOS 服务器通信的内置插件。**推荐用于 iMessage 集成**，因为与旧版 `imsg` 渠道相比，它的 API 更丰富，设置也更简单。

## 内置插件

当前的 OpenClaw 版本内置了 BlueBubbles，因此常规打包构建**不需要**单独执行 `openclaw plugins install` 步骤。

## 概览

- 通过 BlueBubbles 辅助应用在 macOS 上运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐 / 已测试：macOS Sequoia（15）。macOS Tahoe（26）也可用；但在 Tahoe 上编辑功能当前不可用，群组图标更新也可能会报告成功但无法同步。
- OpenClaw 通过其 REST API 与它通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 传入消息通过 webhook 到达；传出回复、正在输入指示、已读回执和 tapback 都通过 REST 调用完成。
- 附件和贴纸会作为入站媒体接收（并在可能时呈现给智能体）。
- 配对 / allowlist 的工作方式与其他渠道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + pairing 代码。
- Reactions 会像 Slack / Telegram 一样作为系统事件呈现，因此智能体可以在回复前“提到”它们。
- 高级功能：编辑、撤回、回复线程、消息效果、群组管理。

## 快速开始

1. 在你的 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 上的说明操作）。
2. 在 BlueBubbles 配置中，启用 web API 并设置密码。
3. 运行 `openclaw onboard` 并选择 BlueBubbles，或手动配置：

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. 将 BlueBubbles webhook 指向你的 Gateway 网关（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. 启动 Gateway 网关；它将注册 webhook 处理器并开始配对。

安全说明：

- 始终设置 webhook 密码。
- 始终要求进行 webhook 身份验证。无论 loopback / 代理拓扑如何，OpenClaw 都会拒绝不包含与 `channels.bluebubbles.password` 匹配的 password / guid 的 BlueBubbles webhook 请求（例如 `?password=<password>` 或 `x-password`）。
- 在读取 / 解析完整 webhook body 之前，会先检查密码身份验证。

## 保持 Messages.app 活跃（VM / 无头设置）

某些 macOS VM / 常开设置可能会导致 Messages.app 进入“空闲”状态（传入事件会停止，直到应用被打开 / 置于前台）。一个简单的解决方法是使用 AppleScript + LaunchAgent **每 5 分钟触发一次 Messages**。

### 1）保存 AppleScript

将其保存为：

- `~/Scripts/poke-messages.scpt`

示例脚本（非交互式；不会抢占焦点）：

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2）安装 LaunchAgent

将其保存为：

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

说明：

- 这会**每 300 秒**运行一次，并且会在**登录时**运行。
- 第一次运行可能会触发 macOS 的**自动化**提示（`osascript` → Messages）。请在运行 LaunchAgent 的同一用户会话中批准它们。

加载它：

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## 新手引导

BlueBubbles 可在交互式新手引导中使用：

```
openclaw onboard
```

向导会提示你输入：

- **Server URL**（必填）：BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）
- **Password**（必填）：BlueBubbles Server 设置中的 API 密码
- **Webhook path**（可选）：默认为 `/bluebubbles-webhook`
- **私信 策略**：pairing、allowlist、open 或 disabled
- **允许列表**：电话号码、电子邮件或聊天目标

你也可以通过 CLI 添加 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（私信 + 群组）

私信：

- 默认值：`channels.bluebubbles.dmPolicy = "pairing"`。
- 未知发送者会收到一个 pairing 代码；在获得批准前，其消息会被忽略（代码 1 小时后过期）。
- 可通过以下方式批准：
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- 配对是默认的令牌交换方式。详情见：[Pairing](/zh-CN/channels/pairing)

群组：

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认值：`allowlist`）。
- 当设置为 `allowlist` 时，`channels.bluebubbles.groupAllowFrom` 用于控制谁可以在群组中触发。

### 联系人名称增强（macOS，可选）

BlueBubbles 群组 webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文改为显示本地联系人姓名，可以在 macOS 上选择启用本地通讯录增强：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 启用查找。默认值：`false`。
- 只有在群组访问、命令授权和提及门控都允许消息通过后，才会执行查找。
- 仅增强未命名的电话参与者。
- 如果未找到本地匹配项，原始电话号码仍会作为回退值保留。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### 提及门控（群组）

BlueBubbles 支持群聊的提及门控，与 iMessage / WhatsApp 行为一致：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）检测提及。
- 当某个群组启用了 `requireMention` 时，智能体只有在被提及时才会响应。
- 来自已授权发送者的控制命令会绕过提及门控。

每个群组的配置：

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // 所有群组的默认值
        "iMessage;-;chat123": { requireMention: false }, // 覆盖特定群组
      },
    },
  },
}
```

### 命令门控

- 控制命令（例如 `/config`、`/model`）需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 来确定命令授权。
- 已授权发送者即使在群组中未提及，也可以运行控制命令。

## ACP 会话绑定

BlueBubbles 聊天可以转换为持久化 ACP 工作区，而无需更改传输层。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 之后，同一个 BlueBubbles 会话中的消息将路由到生成的 ACP 会话。
- `/new` 和 `/reset` 会就地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

也支持通过顶层 `bindings[]` 条目配置持久绑定，设置 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何受支持的 BlueBubbles 目标格式：

- 规范化的私信 handle，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。

示例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

有关共享 ACP 绑定行为，请参阅 [ACP Agents](/zh-CN/tools/acp-agents)。

## 正在输入 + 已读回执

- **正在输入指示**：会在响应生成之前和期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认值：`true`）。
- **正在输入指示**：OpenClaw 会发送输入开始事件；BlueBubbles 会在发送完成或超时后自动清除输入状态（通过 DELETE 手动停止并不可靠）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 禁用已读回执
    },
  },
}
```

## 高级操作

当在配置中启用时，BlueBubbles 支持高级消息操作：

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback（默认：true）
        edit: true, // 编辑已发送消息（macOS 13+，在 macOS 26 Tahoe 上不可用）
        unsend: true, // 撤回消息（macOS 13+）
        reply: true, // 按消息 GUID 回复线程
        sendWithEffect: true, // 消息效果（slam、loud 等）
        renameGroup: true, // 重命名群聊
        setGroupIcon: true, // 设置群聊图标 / 照片（在 macOS 26 Tahoe 上不稳定）
        addParticipant: true, // 向群组添加参与者
        removeParticipant: true, // 从群组移除参与者
        leaveGroup: true, // 离开群聊
        sendAttachment: true, // 发送附件 / 媒体
      },
    },
  },
}
```

可用操作：

- **react**：添加 / 移除 tapback reaction（`messageId`、`emoji`、`remove`）
- **edit**：编辑已发送消息（`messageId`、`text`）
- **unsend**：撤回消息（`messageId`）
- **reply**：回复指定消息（`messageId`、`text`、`to`）
- **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`）
- **renameGroup**：重命名群聊（`chatGuid`、`displayName`）
- **setGroupIcon**：设置群聊图标 / 照片（`chatGuid`、`media`）——在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标不会同步）。
- **addParticipant**：向群组添加某人（`chatGuid`、`address`）
- **removeParticipant**：从群组移除某人（`chatGuid`、`address`）
- **leaveGroup**：离开群组聊天（`chatGuid`）
- **upload-file**：发送媒体 / 文件（`to`、`buffer`、`filename`、`asVoice`）
  - 语音备忘录：将 `asVoice: true` 与 **MP3** 或 **CAF** 音频一起设置，以 iMessage 语音消息形式发送。BlueBubbles 在发送语音备忘录时会将 MP3 转换为 CAF。
- 旧别名：`sendAttachment` 仍然可用，但 `upload-file` 是规范操作名称。

### 消息 ID（短 ID 与完整 ID）

OpenClaw 可能会显示_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商完整 ID。
- 短 ID 存储在内存中；它们可能会在重启或缓存逐出后失效。
- 操作接受短或完整 `messageId`，但如果短 ID 不再可用，就会报错。

对于持久化自动化和存储，请使用完整 ID：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站 payload 中的 `MessageSidFull` / `ReplyToIdFull`

模板变量请参阅 [Configuration](/zh-CN/gateway/configuration)。

## 分块流式传输

控制响应是作为单条消息发送，还是按块流式发送：

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // 启用分块流式传输（默认关闭）
    },
  },
}
```

## 媒体 + 限制

- 入站附件会被下载并存储到媒体缓存中。
- 通过 `channels.bluebubbles.mediaMaxMb` 限制入站和出站媒体大小（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 个字符）。

## 配置参考

完整配置：[Configuration](/zh-CN/gateway/configuration)

提供商选项：

- `channels.bluebubbles.enabled`：启用 / 禁用该渠道。
- `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
- `channels.bluebubbles.password`：API 密码。
- `channels.bluebubbles.webhookPath`：Webhook 端点路径（默认：`/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
- `channels.bluebubbles.allowFrom`：私信 allowlist（handles、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
- `channels.bluebubbles.groupAllowFrom`：群组发送者 allowlist。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，可在门控通过后选择性地从本地通讯录增强未命名群组参与者。默认：`false`。
- `channels.bluebubbles.groups`：每个群组的配置（`requireMention` 等）。
- `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
- `channels.bluebubbles.blockStreaming`：启用分块流式传输（默认：`false`；流式回复所必需）。
- `channels.bluebubbles.textChunkLimit`：出站分块大小（按字符数计，默认：4000）。
- `channels.bluebubbles.sendTimeoutMs`：通过 `/api/v1/message/text` 发送出站文本时每个请求的超时时间（毫秒，默认：30000）。在 macOS 26 环境中，如果 Private API 的 iMessage 发送会在 iMessage 框架内部停滞 60 多秒，请调高此值；例如 `45000` 或 `60000`。探测、聊天查找、reactions、编辑和健康检查当前仍保持较短的 10 秒默认超时；后续计划将覆盖范围扩展到 reactions 和编辑。每账户覆盖：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时拆分；`newline` 会先按空行（段落边界）拆分，再按长度分块。
- `channels.bluebubbles.mediaMaxMb`：入站 / 出站媒体大小上限（MB，默认：8）。
- `channels.bluebubbles.mediaLocalRoots`：显式 allowlist，列出允许用于出站本地媒体路径的本地绝对目录。默认会拒绝发送本地路径，除非配置了此项。每账户覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.historyLimit`：用于上下文的最大群组消息数（0 表示禁用）。
- `channels.bluebubbles.dmHistoryLimit`：私信历史记录上限。
- `channels.bluebubbles.actions`：启用 / 禁用特定操作。
- `channels.bluebubbles.accounts`：多账户配置。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 寻址 / 投递目标

稳定路由优先使用 `chat_guid`：

- `chat_guid:iMessage;-;+15555550123`（群组优先推荐）
- `chat_id:123`
- `chat_identifier:...`
- 直接 handle：`+15555550123`、`user@example.com`
  - 如果某个直接 handle 没有现有私信聊天，OpenClaw 会通过 `POST /api/v1/chat/new` 创建一个。这要求启用 BlueBubbles Private API。

## 安全

- Webhook 请求通过将查询参数或请求头中的 `guid` / `password` 与 `channels.bluebubbles.password` 进行比较来认证。
- 请妥善保管 API 密码和 webhook 端点（将它们视为凭证）。
- BlueBubbles webhook 认证没有 localhost 绕过。如果你代理 webhook 流量，请在请求的端到端路径中保留 BlueBubbles 密码。此处 `gateway.trustedProxies` 不能替代 `channels.bluebubbles.password`。参见 [Gateway 安全](/zh-CN/gateway/security#reverse-proxy-configuration)。
- 如果要将 BlueBubbles 服务器暴露到你的局域网之外，请启用 HTTPS + 防火墙规则。

## 故障排除

- 如果正在输入 / 已读事件停止工作，请检查 BlueBubbles webhook 日志，并确认 Gateway 网关路径与 `channels.bluebubbles.webhookPath` 匹配。
- 配对代码会在一小时后过期；使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- Reactions 需要 BlueBubbles private API（`POST /api/v1/message/react`）；请确认服务器版本提供了该接口。
- 编辑 / 撤回需要 macOS 13+ 以及兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 private API 变更，编辑功能当前不可用。
- 在 macOS 26（Tahoe）上，群组图标更新可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知不可用的操作。如果在 macOS 26（Tahoe）上仍显示 edit，请使用 `channels.bluebubbles.actions.edit=false` 手动禁用。
- 查看状态 / 健康信息：`openclaw status --all` 或 `openclaw status --deep`。

有关通用渠道工作流参考，请参阅 [Channels](/zh-CN/channels) 和 [Plugins](/zh-CN/tools/plugin) 指南。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信 身份验证与配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为与提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与加固
