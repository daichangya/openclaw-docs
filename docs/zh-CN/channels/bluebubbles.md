---
read_when:
    - 设置 BlueBubbles 渠道
    - 故障排除 webhook 配对
    - 在 macOS 上配置 iMessage
summary: 通过 BlueBubbles macOS 服务器接入 iMessage（REST 发送/接收、正在输入、表情回应、配对、高级操作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T08:44:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30ce50ae8a17140b42fa410647c367e0eefdffb1646b1ff92d8e1af63f2e1155
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles（macOS REST）

状态：这是一个通过 HTTP 与 BlueBubbles macOS 服务器通信的内置插件。由于相比旧版 `imsg` 渠道拥有更丰富的 API 和更简单的设置方式，**推荐用于 iMessage 集成**。

## 内置插件

当前的 OpenClaw 发布版本已内置 BlueBubbles，因此普通的打包构建**不需要**单独执行 `openclaw plugins install` 步骤。

## 概览

- 通过 BlueBubbles 辅助应用在 macOS 上运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐/已测试：macOS Sequoia（15）。macOS Tahoe（26）可用；目前在 Tahoe 上编辑功能失效，群组图标更新也可能显示成功但不会同步。
- OpenClaw 通过其 REST API 与之通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 传入消息通过 webhook 到达；传出回复、正在输入指示、已读回执和 tapback 都通过 REST 调用完成。
- 附件和贴纸会作为入站媒体接收（并在可能时展示给智能体）。
- 配对/允许列表的工作方式与其他渠道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配对码。
- 表情回应会像 Slack/Telegram 一样作为系统事件呈现，因此智能体可以在回复前“提到”它们。
- 高级功能：编辑、撤回、回复线程、消息效果、群组管理。

## 快速开始

1. 在你的 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 上的说明操作）。
2. 在 BlueBubbles 配置中，启用 Web API 并设置密码。
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
5. 启动 Gateway 网关；它会注册 webhook 处理器并开始配对。

安全说明：

- 始终设置一个 webhook 密码。
- webhook 身份验证始终是必需的。无论 local loopback/代理拓扑如何，OpenClaw 都会拒绝 BlueBubbles webhook 请求，除非它们包含与 `channels.bluebubbles.password` 匹配的密码/guid（例如 `?password=<password>` 或 `x-password`）。
- 密码验证会在读取/解析完整 webhook 请求体之前进行。

## 保持 Messages.app 处于活跃状态（VM / 无头设置）

某些 macOS VM / 常开设置中，Messages.app 可能会进入“空闲”状态（传入事件会停止，直到应用被打开/切到前台）。一个简单的解决方法是使用 AppleScript + LaunchAgent **每 5 分钟轻触一次 Messages**。

### 1）保存 AppleScript

将以下内容保存为：

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

将以下内容保存为：

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

- 这会**每 300 秒**运行一次，并且**在登录时**运行。
- 首次运行时，可能会触发 macOS 的**自动化**提示（`osascript` → Messages）。请在运行该 LaunchAgent 的同一用户会话中批准它们。

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

向导会提示输入：

- **Server URL**（必填）：BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）
- **Password**（必填）：BlueBubbles Server 设置中的 API 密码
- **Webhook path**（可选）：默认为 `/bluebubbles-webhook`
- **私信 policy**：pairing、allowlist、open 或 disabled
- **Allow list**：电话号码、电子邮件地址或聊天目标

你也可以通过 CLI 添加 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（私信 + 群组）

私信：

- 默认：`channels.bluebubbles.dmPolicy = "pairing"`。
- 未知发件人会收到一个配对码；在获得批准前，消息会被忽略（配对码 1 小时后过期）。
- 批准方式：
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- 配对是默认的令牌交换方式。详情见：[Pairing](/zh-CN/channels/pairing)

群组：

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
- 当设置为 `allowlist` 时，`channels.bluebubbles.groupAllowFrom` 用于控制群组中谁可以触发。

### 联系人姓名增强（macOS，可选）

BlueBubbles 的群组 webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文显示本地联系人姓名而不是这些地址，可以选择在 macOS 上启用本地通讯录增强：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 启用查找。默认值：`false`。
- 只有在群组访问、命令授权和提及门控都已允许消息通过后，才会执行查找。
- 仅增强未命名的电话参与者。
- 如果找不到本地匹配项，仍会回退为原始电话号码。

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

BlueBubbles 支持群聊提及门控，与 iMessage/WhatsApp 行为一致：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）来检测提及。
- 当某个群组启用了 `requireMention` 时，智能体仅在被提及时才会响应。
- 来自已授权发送者的控制命令会绕过提及门控。

按群组配置：

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // 所有群组的默认值
        "iMessage;-;chat123": { requireMention: false }, // 对特定群组的覆盖
      },
    },
  },
}
```

### 命令门控

- 控制命令（例如 `/config`、`/model`）需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 来确定命令授权。
- 已授权发送者即使在群组中未提及，也可以运行控制命令。

### 按群组设置 system prompt

`channels.bluebubbles.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。对于该群组中的每一轮消息处理，这个值都会注入到智能体的 system prompt 中，因此你可以为不同群组设置不同的人设或行为规则，而无需编辑智能体提示词：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "将回复控制在 3 句话以内。模仿这个群组的随意语气。",
        },
      },
    },
  },
}
```

该键会匹配 BlueBubbles 上报的群组 `chatGuid` / `chatIdentifier` / 数字 `chatId`，而 `"*"` 通配符条目会为每个没有精确匹配的群组提供默认值（与 `requireMention` 和按群组工具策略使用相同的模式）。精确匹配始终优先于通配符。私信会忽略此字段；请改用智能体级别或账户级别的提示词自定义。

#### 示例：线程回复与 tapback 表情回应（Private API）

启用 BlueBubbles Private API 后，入站消息会带有短消息 ID（例如 `[[reply_to:5]]`），智能体可以调用 `action=reply` 将回复串到特定消息下，或者调用 `action=react` 添加一个 tapback。按群组设置 `systemPrompt` 是让智能体始终选择正确工具的可靠方式：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "在这个群组中回复时，始终使用上下文中的",
            "[[reply_to:N]] messageId 调用 action=reply，",
            "这样你的回复会串在线程中并位于触发消息下方。",
            "绝不要发送一条新的未关联消息。",
            "",
            "对于简短确认（“好的”“收到”“在处理了”），请使用",
            "action=react 并配合合适的 tapback emoji（❤️、👍、😂、‼️、❓），",
            "而不是发送文本回复。",
          ].join(" "),
        },
      },
    },
  },
}
```

tapback 表情回应和线程回复都需要 BlueBubbles Private API；底层机制请参见 [Advanced actions](#advanced-actions) 和 [Message IDs](#message-ids-short-vs-full)。

## ACP 会话绑定

BlueBubbles 聊天可以转为持久化的 ACP 工作区，而无需更改传输层。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 同一个 BlueBubbles 会话中的后续消息会路由到所创建的 ACP 会话。
- `/new` 和 `/reset` 会就地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

也支持通过顶层 `bindings[]` 条目配置持久绑定，使用 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何受支持的 BlueBubbles 目标形式：

- 标准化的私信句柄，例如 `+15555550123` 或 `user@example.com`
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

共享的 ACP 绑定行为请参见 [ACP Agents](/zh-CN/tools/acp-agents)。

## 正在输入 + 已读回执

- **正在输入指示**：会在生成回复之前和生成过程中自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认：`true`）。
- **正在输入指示**：OpenClaw 会发送开始输入事件；BlueBubbles 会在发送消息后或超时后自动清除输入状态（通过 DELETE 手动停止并不可靠）。

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
        edit: true, // 编辑已发送消息（macOS 13+，在 macOS 26 Tahoe 上失效）
        unsend: true, // 撤回消息（macOS 13+）
        reply: true, // 按消息 GUID 进行线程回复
        sendWithEffect: true, // 消息效果（slam、loud 等）
        renameGroup: true, // 重命名群聊
        setGroupIcon: true, // 设置群聊图标/照片（在 macOS 26 Tahoe 上不稳定）
        addParticipant: true, // 向群组添加参与者
        removeParticipant: true, // 从群组移除参与者
        leaveGroup: true, // 退出群聊
        sendAttachment: true, // 发送附件/媒体
      },
    },
  },
}
```

可用操作：

- **react**：添加/移除 tapback 表情回应（`messageId`、`emoji`、`remove`）
- **edit**：编辑已发送消息（`messageId`、`text`）
- **unsend**：撤回消息（`messageId`）
- **reply**：回复指定消息（`messageId`、`text`、`to`）
- **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`）
- **renameGroup**：重命名群聊（`chatGuid`、`displayName`）
- **setGroupIcon**：设置群聊图标/照片（`chatGuid`、`media`）—— 在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标不会同步）。
- **addParticipant**：向群组添加成员（`chatGuid`、`address`）
- **removeParticipant**：从群组移除成员（`chatGuid`、`address`）
- **leaveGroup**：退出群聊（`chatGuid`）
- **upload-file**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）
  - 语音备忘录：将 **MP3** 或 **CAF** 音频与 `asVoice: true` 一起使用，即可作为 iMessage 语音消息发送。BlueBubbles 在发送语音备忘录时会将 MP3 转换为 CAF。
- 旧别名：`sendAttachment` 仍然可用，但 `upload-file` 是规范操作名。

### 消息 ID（短 ID 与完整 ID）

OpenClaw 可能会显示_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商的完整 ID。
- 短 ID 存储在内存中；在重启或缓存清除后可能失效。
- 操作可以接受短或完整的 `messageId`，但如果短 ID 已不可用，将会报错。

对于持久化自动化和存储，请使用完整 ID：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站负载中的 `MessageSidFull` / `ReplyToIdFull`

模板变量请参见 [Configuration](/zh-CN/gateway/configuration)。

## 合并拆分发送的私信（一次输入中的命令 + URL）

当用户在 iMessage 中将命令和 URL 一起输入时——例如 `Dump https://example.com/article`——Apple 会将这次发送拆成**两次独立的 webhook 投递**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），并附带 OG 预览图片作为附件。

在大多数设置中，这两个 webhook 会相隔约 0.8–2.0 秒到达 OpenClaw。如果不进行合并，智能体在第 1 轮只会收到命令本身并回复（通常是“把 URL 发给我”），直到第 2 轮才看到 URL——而此时命令上下文已经丢失。

`channels.bluebubbles.coalesceSameSenderDms` 会让私信启用同一发送者连续 webhook 的合并，从而在一轮智能体处理内统一处理。群聊仍然按单条消息分组，以保留多用户会话结构。

### 何时启用

在以下情况下启用：

- 你提供的 Skills 期望在一条消息中收到 `命令 + 负载`（dump、paste、save、queue 等）。
- 你的用户会把 URL、图片或长内容与命令一起粘贴发送。
- 你可以接受私信轮次的额外延迟（见下文）。

在以下情况下保持禁用：

- 你需要最小化单词私信命令触发的延迟。
- 你的所有流程都是无需后续负载的一次性命令。

### 启用方式

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // 选择启用（默认：false）
    },
  },
}
```

启用此标志后，如果没有显式设置 `messages.inbound.byChannel.bluebubbles`，防抖窗口会扩大到 **2500 ms**（不进行合并时默认是 500 ms）。之所以需要更宽的窗口，是因为 Apple 的拆分发送节奏为 0.8–2.0 秒，无法适配更紧的默认值。

若要自行调整窗口：

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms 对大多数设置都适用；如果你的 Mac 较慢
        // 或存在内存压力（观察到的间隔可能会超过 2 秒），可提高到 4000 ms。
        bluebubbles: 2500,
      },
    },
  },
}
```

### 权衡

- **私信控制命令会增加延迟。** 启用此标志后，私信控制命令消息（如 `Dump`、`Save` 等）现在会在分发前最多等待一个防抖窗口，以防后续还有负载 webhook 到来。群聊命令仍然是即时分发。
- **合并输出有边界限制**——合并后的文本上限为 4000 个字符，并会明确添加 `…[truncated]` 标记；附件上限为 20 个；来源条目上限为 10 个（超过后保留第一条和最新条目）。每个来源 `messageId` 仍会进入入站去重逻辑，因此稍后如果 MessagePoller 重放其中任意单个事件，也会被识别为重复。
- **按渠道选择启用。** 其他渠道（Telegram、WhatsApp、Slack、…）不受影响。

### 场景与智能体实际看到的内容

| 用户输入内容 | Apple 投递内容 | 标志关闭（默认） | 标志开启 + 2500 ms 窗口 |
| --- | --- | --- | --- |
| `Dump https://example.com`（一次发送） | 2 个 webhook，相隔约 1 秒 | 两轮智能体处理：“Dump” 单独一轮，然后 URL 一轮 | 一轮处理：合并后的文本 `Dump https://example.com` |
| `Save this 📎image.jpg caption`（附件 + 文本） | 2 个 webhook | 两轮处理 | 一轮处理：文本 + 图片 |
| `/status`（独立命令） | 1 个 webhook | 即时分发 | **最多等待一个窗口后再分发** |
| 单独粘贴 URL | 1 个 webhook | 即时分发 | 即时分发（桶中只有一个条目） |
| 文本 + URL 作为两条刻意分开的消息发送，间隔数分钟 | 2 个 webhook，超出窗口 | 两轮处理 | 两轮处理（窗口已过期） |
| 快速刷屏（窗口内 >10 条小私信） | N 个 webhook | N 轮处理 | 一轮处理，输出有边界限制（保留首条 + 最新条，应用文本/附件上限） |

### 拆分发送合并的故障排除

如果该标志已开启，但拆分发送仍然表现为两轮处理，请逐层检查：

1. **确认配置已实际加载。**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   然后执行 `openclaw gateway restart`——该标志会在防抖器注册表创建时读取。

2. **确认你的设置有足够宽的防抖窗口。** 查看位于 `~/Library/Logs/bluebubbles-server/main.log` 的 BlueBubbles 服务器日志：

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   测量 `"Dump"` 这类文本分发与后续 `"https://..."; Attachments:` 分发之间的时间间隔。将 `messages.inbound.byChannel.bluebubbles` 提高到足以覆盖这个间隔。

3. **会话 JSONL 时间戳 ≠ webhook 到达时间。** 会话事件时间戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 网关将消息交给智能体的时间，**不是** webhook 到达时间。带有 `[Queued messages while agent was busy]` 标签的排队第二条消息，意味着第二个 webhook 到达时第一轮仍在运行——此时合并桶已经刷新。应根据 BB 服务器日志来调整窗口，而不是根据会话日志。

4. **内存压力拖慢了回复分发。** 在较小的机器（8 GB）上，智能体轮次可能耗时很长，以至于在回复完成前合并桶就已刷新，URL 因而作为排队的第二轮到达。检查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 网关的 RSS 超过约 500 MB 且压缩器处于活动状态，请关闭其他高负载进程，或升级到更大的主机。

5. **回复引用发送走的是另一条路径。** 如果用户是将 `Dump` 作为对现有 URL 气泡的**回复**发送的（iMessage 会在 `Dump` 气泡上显示 “1 Reply” 徽标），那么 URL 位于 `replyToBody` 中，而不是位于第二个 webhook 中。此时合并逻辑不适用——这是 Skills/提示词层面的问题，不是防抖器的问题。

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
- 入站和出站媒体都可通过 `channels.bluebubbles.mediaMaxMb` 设置媒体上限（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 个字符）。

## 配置参考

完整配置： [Configuration](/zh-CN/gateway/configuration)

提供商选项：

- `channels.bluebubbles.enabled`：启用/禁用该渠道。
- `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
- `channels.bluebubbles.password`：API 密码。
- `channels.bluebubbles.webhookPath`：webhook 端点路径（默认：`/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
- `channels.bluebubbles.allowFrom`：私信允许列表（handles、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
- `channels.bluebubbles.groupAllowFrom`：群组发送者允许列表。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，在门控通过后，可选择从本地“通讯录”中增强未命名的群组参与者。默认：`false`。
- `channels.bluebubbles.groups`：按群组配置（`requireMention` 等）。
- `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
- `channels.bluebubbles.blockStreaming`：启用分块流式传输（默认：`false`；流式回复必需）。
- `channels.bluebubbles.textChunkLimit`：出站分块的字符数上限（默认：4000）。
- `channels.bluebubbles.sendTimeoutMs`：通过 `/api/v1/message/text` 发送出站文本时每个请求的超时时间（毫秒，默认：30000）。在 macOS 26 环境中，如果 Private API 的 iMessage 发送会在 iMessage 框架内部卡住 60 多秒，可提高该值；例如设为 `45000` 或 `60000`。探测、聊天查询、表情回应、编辑和健康检查目前仍保持较短的 10 秒默认值；后续计划将更宽的超时覆盖到表情回应和编辑。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时拆分；`newline` 会先按空行（段落边界）拆分，再按长度分块。
- `channels.bluebubbles.mediaMaxMb`：入站/出站媒体大小上限（MB，默认：8）。
- `channels.bluebubbles.mediaLocalRoots`：显式允许的绝对本地目录列表，这些目录中的本地媒体路径可用于出站发送。默认情况下，本地路径发送会被拒绝，除非已配置此项。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.coalesceSameSenderDms`：将同一发送者连续的私信 webhook 合并为一轮智能体处理，使 Apple 的“文本 + URL”拆分发送能作为单条消息到达（默认：`false`）。场景、窗口调优和权衡请参见[合并拆分发送的私信](#coalescing-split-send-dms-command--url-in-one-composition)。启用后，如果未显式设置 `messages.inbound.byChannel.bluebubbles`，默认入站防抖窗口会从 500 ms 扩大到 2500 ms。
- `channels.bluebubbles.historyLimit`：用于上下文的群组消息最大数量（设为 0 则禁用）。
- `channels.bluebubbles.dmHistoryLimit`：私信历史记录上限。
- `channels.bluebubbles.actions`：启用/禁用特定操作。
- `channels.bluebubbles.accounts`：多账户配置。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 寻址 / 投递目标

为了获得稳定路由，优先使用 `chat_guid`：

- `chat_guid:iMessage;-;+15555550123`（群组推荐）
- `chat_id:123`
- `chat_identifier:...`
- 直接句柄：`+15555550123`、`user@example.com`
  - 如果某个直接句柄没有现有私信聊天，OpenClaw 会通过 `POST /api/v1/chat/new` 创建一个。这要求启用 BlueBubbles Private API。

## 安全

- webhook 请求通过比较查询参数或请求头中的 `guid`/`password` 与 `channels.bluebubbles.password` 来进行身份验证。
- 请妥善保管 API 密码和 webhook 端点（将其视为凭证）。
- BlueBubbles webhook 身份验证没有 localhost 旁路。如果你代理 webhook 流量，请在整个请求链路中保留 BlueBubbles 密码。这里的 `gateway.trustedProxies` 不能替代 `channels.bluebubbles.password`。参见 [Gateway 网关安全](/zh-CN/gateway/security#reverse-proxy-configuration)。
- 如果要将 BlueBubbles 服务器暴露到你的局域网之外，请启用 HTTPS + 防火墙规则。

## 故障排除

- 如果正在输入/已读事件停止工作，请检查 BlueBubbles webhook 日志，并确认 Gateway 网关路径与 `channels.bluebubbles.webhookPath` 匹配。
- 配对码会在一小时后过期；使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 表情回应需要 BlueBubbles private API（`POST /api/v1/message/react`）；请确认服务器版本已提供该接口。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 private API 变更，编辑功能目前失效。
- 群组图标更新在 macOS 26（Tahoe）上可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知失效的操作。如果在 macOS 26（Tahoe）上仍然显示 edit，请手动通过 `channels.bluebubbles.actions.edit=false` 禁用它。
- 已启用 `coalesceSameSenderDms`，但拆分发送（例如 `Dump` + URL）仍然作为两轮到达：请查看[拆分发送合并的故障排除](#split-send-coalescing-troubleshooting)清单——常见原因包括防抖窗口过窄、误将会话日志时间戳当作 webhook 到达时间，或使用了回复引用发送（其使用 `replyToBody`，而不是第二个 webhook）。
- 查看状态/健康信息：`openclaw status --all` 或 `openclaw status --deep`。

有关渠道工作流的一般参考，请参见 [Channels](/zh-CN/channels) 和 [Plugins](/zh-CN/tools/plugin) 指南。

## 相关内容

- [Channels 概览](/zh-CN/channels) —— 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) —— 私信身份验证与配对流程
- [Groups](/zh-CN/channels/groups) —— 群聊行为与提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) —— 消息的会话路由
- [Security](/zh-CN/gateway/security) —— 访问模型与加固措施
