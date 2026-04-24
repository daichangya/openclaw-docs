---
read_when:
    - 设置 BlueBubbles 渠道
    - Webhook 配对故障排除
    - 在 macOS 上配置 iMessage
summary: 通过 BlueBubbles macOS 服务器接入 iMessage（REST 发送/接收、正在输入、回应、配对、高级操作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-24T18:07:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5185202d668f56e5f2e22c1858325595eea7cca754b9b3a809c886c53ae68770
    source_path: channels/bluebubbles.md
    workflow: 15
---

状态：这是一个通过 HTTP 与 BlueBubbles macOS 服务器通信的内置插件。由于其 API 更丰富，且相比旧版 `imsg` 渠道更易于设置，因此**推荐用于 iMessage 集成**。

## 内置插件

当前的 OpenClaw 版本已内置 BlueBubbles，因此常规打包构建无需单独执行 `openclaw plugins install` 步骤。

## 概述

- 通过 BlueBubbles 辅助应用在 macOS 上运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐/已测试：macOS Sequoia（15）。macOS Tahoe（26）可用；目前在 Tahoe 上编辑功能失效，群组图标更新也可能显示成功但不会同步。
- OpenClaw 通过其 REST API 与之通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 传入消息通过 webhook 到达；传出回复、正在输入指示器、已读回执和 tapback 都通过 REST 调用完成。
- 附件和贴纸会作为入站媒体被摄取（并在可能时提供给智能体）。
- 配对/允许列表的工作方式与其他渠道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配对码。
- 回应会像 Slack/Telegram 一样以系统事件形式呈现，因此智能体可以在回复前“提及”它们。
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

- 始终设置 webhook 密码。
- 始终要求进行 webhook 身份验证。无论 loopback/代理拓扑如何，除非 BlueBubbles webhook 请求包含与 `channels.bluebubbles.password` 匹配的 password/guid（例如 `?password=<password>` 或 `x-password`），否则 OpenClaw 会拒绝该请求。
- 在读取/解析完整 webhook 请求体之前，会先检查密码身份验证。

## 保持 Messages.app 处于活动状态（VM / 无头设置）

某些 macOS VM / 常开设置可能会导致 Messages.app 进入“空闲”状态（在应用被打开/切到前台之前，传入事件会停止）。一个简单的解决办法是使用 AppleScript + LaunchAgent **每 5 分钟触碰一次 Messages**。

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
- 首次运行可能会触发 macOS 的**自动化**提示（`osascript` → Messages）。请在运行该 LaunchAgent 的同一用户会话中批准它们。

加载它：

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## 新手引导

BlueBubbles 可在交互式新手引导中使用：

```bash
openclaw onboard
```

向导会提示你输入：

- **Server URL**（必填）：BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）
- **Password**（必填）：BlueBubbles Server 设置中的 API 密码
- **Webhook path**（可选）：默认为 `/bluebubbles-webhook`
- **私信策略**：pairing、allowlist、open 或 disabled
- **允许列表**：电话号码、电子邮件地址或聊天目标

你也可以通过 CLI 添加 BlueBubbles：

```bash
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（私信 + 群组）

私信：

- 默认：`channels.bluebubbles.dmPolicy = "pairing"`。
- 未知发送者会收到一个配对码；在获批前，消息会被忽略（验证码 1 小时后过期）。
- 通过以下命令批准：
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- 配对是默认的令牌交换方式。详情参见：[配对](/zh-CN/channels/pairing)

群组：

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
- 当设置为 `allowlist` 时，`channels.bluebubbles.groupAllowFrom` 控制谁可以在群组中触发。

### 联系人名称增强（macOS，可选）

BlueBubbles 群组 webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文显示本地联系人姓名而不是这些地址，你可以选择在 macOS 上启用本地 Contacts 增强：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 可启用查找。默认值：`false`。
- 只有在群组访问、命令授权和提及门控都允许消息通过后，才会运行查找。
- 仅会增强未命名的电话参与者。
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

BlueBubbles 支持群聊中的提及门控，与 iMessage/WhatsApp 的行为一致：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）来检测提及。
- 当群组启用了 `requireMention` 时，智能体仅在被提及时才会响应。
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

### 按群组的系统提示词

`channels.bluebubbles.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。每次在该群组中处理消息时，这个值都会注入到智能体的系统提示词中，因此你可以在不编辑智能体提示词的情况下，为不同群组设置不同的人设或行为规则：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "将回复控制在 3 句话以内。模仿该群组的随意语气。",
        },
      },
    },
  },
}
```

该键与 BlueBubbles 为群组报告的 `chatGuid` / `chatIdentifier` / 数字 `chatId` 相匹配，而 `"*"` 通配符条目则为每个没有精确匹配的群组提供默认值（与 `requireMention` 和按群组工具策略所使用的模式相同）。精确匹配始终优先于通配符。私信会忽略该字段；请改用智能体级或账户级提示词自定义。

#### 实际示例：线程回复和 tapback 回应（Private API）

启用 BlueBubbles Private API 后，传入消息会带有短消息 ID（例如 `[[reply_to:5]]`），智能体可以调用 `action=reply` 以线程方式回复某条特定消息，或调用 `action=react` 添加一个 tapback。按群组设置 `systemPrompt` 是让智能体稳定选择正确工具的可靠方法：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "在此群组中回复时，始终使用上下文中的",
            "[[reply_to:N]] messageId 调用 action=reply，",
            "这样你的回复会在线程中挂到触发消息下面。",
            "绝不要发送一个新的、未关联的消息。",
            "",
            "对于简短确认（“ok”、“收到”、“知道了”），",
            "请使用 action=react 并选择合适的 tapback 表情",
            "（❤️、👍、😂、‼️、❓），而不是发送文本回复。",
          ].join(" "),
        },
      },
    },
  },
}
```

tapback 回应和线程回复都需要 BlueBubbles Private API；有关底层机制，请参见[高级操作](#advanced-actions)和[消息 ID](#message-ids-short-vs-full)。

## ACP 会话绑定

BlueBubbles 聊天可以转换为持久化的 ACP 工作区，而无需更改传输层。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 之后，同一 BlueBubbles 会话中的未来消息都会路由到已生成的 ACP 会话。
- `/new` 和 `/reset` 会在原地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除该绑定。

也支持通过顶层 `bindings[]` 条目配置持久化绑定，使用 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何受支持的 BlueBubbles 目标形式：

- 规范化的私信句柄，例如 `+15555550123` 或 `user@example.com`
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

有关通用 ACP 绑定行为，请参见 [ACP Agents](/zh-CN/tools/acp-agents)。

## 正在输入 + 已读回执

- **正在输入指示器**：会在生成回复之前和期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认：`true`）。
- **正在输入指示器**：OpenClaw 会发送“开始输入”事件；BlueBubbles 会在发送消息或超时后自动清除输入状态（通过 DELETE 手动停止并不可靠）。

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
        reactions: true, // tapback 回应（默认：true）
        edit: true, // 编辑已发送消息（macOS 13+，在 macOS 26 Tahoe 上已失效）
        unsend: true, // 撤回消息（macOS 13+）
        reply: true, // 通过消息 GUID 进行线程回复
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

- **react**：添加/移除 tapback 回应（`messageId`、`emoji`、`remove`）。iMessage 的原生 tapback 集合为 `love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`。当智能体选择了该集合之外的表情符号（例如 `👀`）时，回应工具会回退到 `love`，这样 tapback 仍能显示，而不会导致整个请求失败。已配置的确认回应仍会严格校验，未知值会报错。
- **edit**：编辑已发送消息（`messageId`、`text`）
- **unsend**：撤回消息（`messageId`）
- **reply**：回复指定消息（`messageId`、`text`、`to`）
- **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`）
- **renameGroup**：重命名群聊（`chatGuid`、`displayName`）
- **setGroupIcon**：设置群聊图标/照片（`chatGuid`、`media`）—— 在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标不会同步）。
- **addParticipant**：向群组添加某人（`chatGuid`、`address`）
- **removeParticipant**：从群组移除某人（`chatGuid`、`address`）
- **leaveGroup**：退出群聊（`chatGuid`）
- **upload-file**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）
  - 语音备忘录：将 **MP3** 或 **CAF** 音频与 `asVoice: true` 一起设置，即可作为 iMessage 语音消息发送。BlueBubbles 在发送语音备忘录时会将 MP3 转换为 CAF。
- 旧别名：`sendAttachment` 仍可使用，但 `upload-file` 是规范的操作名称。

### 消息 ID（短 ID 与完整 ID）

OpenClaw 可能会显示_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商的完整 ID。
- 短 ID 存储在内存中；在重启或缓存清除后可能会失效。
- 操作接受短 `messageId` 或完整 `messageId`，但如果短 ID 已不可用，就会报错。

对于持久化自动化和存储，请使用完整 ID：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站载荷中的 `MessageSidFull` / `ReplyToIdFull`

模板变量请参见[配置](/zh-CN/gateway/configuration)。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合并拆分发送的私信（同一条输入中的命令 + URL）

当用户在 iMessage 中同时输入命令和 URL 时——例如 `Dump https://example.com/article`——Apple 会将这次发送拆分为**两个独立的 webhook 投递**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），并带有 OG 预览图片作为附件。

在大多数设置中，这两个 webhook 会相隔大约 0.8-2.0 秒到达 OpenClaw。如果不进行合并，智能体会在第 1 轮只收到命令本身，然后回复（通常是“把 URL 发给我”），直到第 2 轮才看到 URL——而此时命令上下文已经丢失。

`channels.bluebubbles.coalesceSameSenderDms` 允许将某个私信中的、来自同一发送者的连续 webhook 合并为一个智能体轮次。群聊仍然按每条消息分别处理，因此能保留多用户轮次结构。

### 何时启用

在以下情况启用：

- 你提供的 Skills 需要在一条消息中接收 `命令 + 载荷`（dump、paste、save、queue 等）。
- 你的用户会把 URL、图片或长内容与命令一起粘贴发送。
- 你可以接受增加的私信轮次延迟（见下文）。

在以下情况保持禁用：

- 你需要尽可能低的私信单词命令延迟。
- 你的所有流程都是不带后续载荷的一次性命令。

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

启用该标志后，如果没有显式设置 `messages.inbound.byChannel.bluebubbles`，防抖窗口会扩大到 **2500 ms**（不合并时的默认值为 500 ms）。必须使用更宽的窗口——Apple 的拆分发送节奏为 0.8-2.0 秒，无法适配更紧的默认值。

如需自行调整窗口：

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms 适用于大多数设置；如果你的 Mac 较慢
        // 或处于内存压力下（观察到的间隔可能会超过 2 秒），则提高到 4000 ms。
        bluebubbles: 2500,
      },
    },
  },
}
```

### 权衡

- **私信控制命令会增加延迟。** 启用该标志后，私信控制命令消息（如 `Dump`、`Save` 等）现在会在派发前最多等待整个防抖窗口，以防随后还有载荷 webhook 到来。群聊命令仍会立即派发。
- **合并后的输出有上限** —— 合并文本上限为 4000 个字符，并带有明确的 `…[truncated]` 标记；附件上限为 20 个；源条目上限为 10 个（超过时保留首条和最新条目）。每个源 `messageId` 仍会进入入站去重，因此后续 MessagePoller 重新播放任意单个事件时，仍会被识别为重复。
- **按渠道选择启用。** 其他渠道（Telegram、WhatsApp、Slack、……）不受影响。

### 场景以及智能体会看到什么

| 用户输入内容                                                     | Apple 的投递方式         | 标志关闭（默认）                 | 标志开启 + 2500 ms 窗口                                      |
| ---------------------------------------------------------------- | ------------------------ | -------------------------------- | ------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                           | 2 个 webhook，相隔约 1 秒 | 两个智能体轮次：先只有 “Dump”，再是 URL | 一个轮次：合并文本 `Dump https://example.com`                 |
| `Save this 📎image.jpg caption`（附件 + 文本）                   | 2 个 webhook             | 两个轮次                         | 一个轮次：文本 + 图片                                         |
| `/status`（独立命令）                                            | 1 个 webhook             | 立即派发                         | **最多等待整个窗口后再派发**                                  |
| 单独粘贴一个 URL                                                 | 1 个 webhook             | 立即派发                         | 立即派发（桶中只有一个条目）                                  |
| 文本 + URL 作为两条有意分开的消息发送，相隔数分钟               | 2 个 webhook，超出窗口   | 两个轮次                         | 两个轮次（窗口期间已过期）                                    |
| 快速洪泛（窗口内 >10 条小型私信）                               | N 个 webhook             | N 个轮次                         | 一个轮次，受上限约束的输出（保留首条 + 最新条，应用文本/附件上限） |

### 拆分发送合并故障排除

如果该标志已启用，但拆分发送仍以两个轮次到达，请逐层检查：

1. **配置确实已加载。**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   然后执行 `openclaw gateway restart` —— 该标志会在 debouncer-registry 创建时读取。

2. **防抖窗口对你的环境来说足够宽。** 查看 BlueBubbles 服务器日志 `~/Library/Logs/bluebubbles-server/main.log`：

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   测量 `"Dump"` 这类文本投递与随后 `"https://..."`; `Attachments:` 投递之间的间隔。把 `messages.inbound.byChannel.bluebubbles` 提高到能够充分覆盖该间隔的值。

3. **会话 JSONL 时间戳 ≠ webhook 到达时间。** 会话事件时间戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 网关将消息交给智能体的时间，**而不是** webhook 到达的时间。若第二条消息被标记为 `[Queued messages while agent was busy]`，说明第二个 webhook 到达时第一轮仍在运行——此时合并桶已经刷出。请根据 BB 服务器日志调整窗口，而不是根据会话日志。

4. **内存压力导致回复派发变慢。** 在配置较低的机器（8 GB）上，智能体轮次可能耗时过长，导致合并桶在回复完成前就已刷出，而 URL 则作为排队的第二轮到达。检查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 网关的 RSS 超过约 500 MB，且压缩器处于活动状态，请关闭其他占用较重的进程，或升级到更大的主机。

5. **回复引用发送走的是另一条路径。** 如果用户把 `Dump` 作为对现有 URL 气泡的**回复**发送（iMessage 会在 Dump 气泡上显示 “1 Reply” 标记），那么 URL 位于 `replyToBody` 中，而不是第二个 webhook 中。此时合并机制不适用——这是 Skills/提示词问题，而不是 debouncer 问题。

## 分块流式传输

控制响应是作为单条消息发送，还是以分块形式流式发送：

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
- 通过 `channels.bluebubbles.mediaMaxMb` 控制入站和出站媒体的大小上限（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 个字符）。

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

提供商选项：

- `channels.bluebubbles.enabled`：启用/禁用该渠道。
- `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
- `channels.bluebubbles.password`：API 密码。
- `channels.bluebubbles.webhookPath`：webhook 端点路径（默认：`/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
- `channels.bluebubbles.allowFrom`：私信允许列表（handles、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
- `channels.bluebubbles.groupAllowFrom`：群组发送者允许列表。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，可在门控通过后选择从本地 Contacts 增强未命名的群组参与者。默认：`false`。
- `channels.bluebubbles.groups`：按群组配置（`requireMention` 等）。
- `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
- `channels.bluebubbles.blockStreaming`：启用分块流式传输（默认：`false`；流式回复需要启用）。
- `channels.bluebubbles.textChunkLimit`：出站分块大小（按字符计，默认：4000）。
- `channels.bluebubbles.sendTimeoutMs`：通过 `/api/v1/message/text` 发送出站文本时，每个请求的超时时间（毫秒，默认：30000）。在 macOS 26 环境中，如果 Private API iMessage 发送会在 iMessage 框架内部卡住 60 秒以上，可提高该值，例如设为 `45000` 或 `60000`。探测、聊天查找、回应、编辑和健康检查目前仍保持较短的 10 秒默认值；后续计划将更长超时扩展到回应和编辑。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时拆分；`newline` 会先按空行（段落边界）拆分，再按长度分块。
- `channels.bluebubbles.mediaMaxMb`：入站/出站媒体大小上限（MB，默认：8）。
- `channels.bluebubbles.mediaLocalRoots`：允许用于出站本地媒体路径的绝对本地目录显式允许列表。默认情况下，除非配置了此项，否则会拒绝发送本地路径。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.coalesceSameSenderDms`：将同一发送者连续的私信 webhook 合并为一个智能体轮次，以便 Apple 的“文本 + URL”拆分发送能作为单条消息到达（默认：`false`）。有关场景、窗口调优和权衡，请参见[合并拆分发送的私信](#coalescing-split-send-dms-command--url-in-one-composition)。启用该项且未显式设置 `messages.inbound.byChannel.bluebubbles` 时，默认入站防抖窗口会从 500 ms 扩大到 2500 ms。
- `channels.bluebubbles.historyLimit`：用于上下文的群组消息最大数量（设为 0 则禁用）。
- `channels.bluebubbles.dmHistoryLimit`：私信历史记录上限。
- `channels.bluebubbles.actions`：启用/禁用特定操作。
- `channels.bluebubbles.accounts`：多账户配置。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 寻址 / 传递目标

优先使用 `chat_guid` 以获得稳定路由：

- `chat_guid:iMessage;-;+15555550123`（群组首选）
- `chat_id:123`
- `chat_identifier:...`
- 直接 handles：`+15555550123`、`user@example.com`
  - 如果某个直接 handle 没有现有私信聊天，OpenClaw 会通过 `POST /api/v1/chat/new` 创建一个。这要求启用 BlueBubbles Private API。

### iMessage 与 SMS 路由

当同一个 handle 在 Mac 上同时存在 iMessage 聊天和 SMS 聊天时（例如某个电话号码已注册 iMessage，但也曾收到绿色气泡的回退消息），OpenClaw 会优先选择 iMessage 聊天，并且绝不会静默降级到 SMS。若要强制使用 SMS 聊天，请使用显式 `sms:` 目标前缀（例如 `sms:+15555550123`）。如果某个 handle 没有匹配的 iMessage 聊天，仍会通过 BlueBubbles 报告的相应聊天发送。

## 安全

- webhook 请求通过将查询参数或请求头中的 `guid`/`password` 与 `channels.bluebubbles.password` 进行比较来完成身份验证。
- 请对 API 密码和 webhook 端点保密（应将它们视为凭证）。
- BlueBubbles webhook 身份验证不存在 localhost 绕过。如果你代理 webhook 流量，请在整个请求链路中保留 BlueBubbles 密码。这里的 `gateway.trustedProxies` 不能替代 `channels.bluebubbles.password`。参见 [Gateway 网关安全](/zh-CN/gateway/security#reverse-proxy-configuration)。
- 如果要将 BlueBubbles 服务器暴露到局域网外部，请启用 HTTPS 和防火墙规则。

## 故障排除

- 如果正在输入/已读事件停止工作，请检查 BlueBubbles webhook 日志，并确认 Gateway 网关路径与 `channels.bluebubbles.webhookPath` 匹配。
- 配对码会在一小时后过期；请使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 回应需要 BlueBubbles private API（`POST /api/v1/message/react`）；请确认服务器版本已提供该接口。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 private API 发生变化，编辑目前已失效。
- 在 macOS 26（Tahoe）上，群组图标更新可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知失效的操作。如果在 macOS 26（Tahoe）上仍然显示编辑功能，请通过 `channels.bluebubbles.actions.edit=false` 手动禁用。
- 已启用 `coalesceSameSenderDms`，但拆分发送（例如 `Dump` + URL）仍以两个轮次到达：请参见[拆分发送合并故障排除](#split-send-coalescing-troubleshooting)检查清单——常见原因包括防抖窗口过窄、将会话日志时间戳误读为 webhook 到达时间，或属于回复引用发送（它使用 `replyToBody`，而不是第二个 webhook）。
- 若要查看状态/健康信息：`openclaw status --all` 或 `openclaw status --deep`。

有关通用渠道工作流参考，请参见[渠道](/zh-CN/channels)和[插件](/zh-CN/tools/plugin)指南。

## 相关内容

- [渠道概览](/zh-CN/channels) —— 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) —— 私信身份验证与配对流程
- [群组](/zh-CN/channels/groups) —— 群聊行为与提及门控
- [渠道路由](/zh-CN/channels/channel-routing) —— 消息的会话路由
- [安全](/zh-CN/gateway/security) —— 访问模型与加固
