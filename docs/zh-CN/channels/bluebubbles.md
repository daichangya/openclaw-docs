---
read_when:
    - 设置 BlueBubbles 渠道
    - 故障排除 webhook 配对
    - 在 macOS 上配置 iMessage
summary: 通过 BlueBubbles macOS 服务器的 iMessage（REST 发送/接收、正在输入、回应、配对、高级操作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T04:50:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15ca98edc92fa6525167bd8ef814ae17d18bab72f445b75e5df7b361883392b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

Status：内置插件，通过 HTTP 与 BlueBubbles macOS 服务器通信。由于其 API 更丰富且设置比旧版 `imsg` 渠道更简单，因此**推荐用于 iMessage 集成**。

## 内置插件

当前的 OpenClaw 版本已内置 BlueBubbles，因此普通打包构建**不需要**单独执行 `openclaw plugins install` 步骤。

## 概览

- 通过 BlueBubbles 辅助应用在 macOS 上运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐/已测试：macOS Sequoia（15）。macOS Tahoe（26）可用；但当前在 Tahoe 上编辑功能已损坏，群组图标更新也可能显示成功但不会同步。
- OpenClaw 通过它的 REST API 与其通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 传入消息通过 webhook 到达；传出回复、输入指示器、已读回执和 tapback 都通过 REST 调用完成。
- 附件和贴纸会作为入站媒体被接收（并在可能时提供给智能体）。
- 会自动合成 MP3 或 CAF 音频的 Auto-TTS 回复，会以 iMessage 语音备忘录气泡的形式发送，而不是作为普通文件附件。
- 配对/allowlist 的工作方式与其他渠道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + pairing 代码。
- Reactions 会像 Slack/Telegram 一样作为系统事件呈现，因此智能体可以在回复前“提及”它们。
- 高级功能：编辑、撤回、回复线程、消息效果、群组管理。

## 快速开始

1. 在你的 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 上的说明操作）。
2. 在 BlueBubbles 配置中启用 web API 并设置密码。
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
- webhook 身份验证始终是必需的。无论 local loopback/代理拓扑如何，除非 BlueBubbles webhook 请求包含与 `channels.bluebubbles.password` 匹配的密码/guid（例如 `?password=<password>` 或 `x-password`），否则 OpenClaw 会拒绝这些请求。
- 在读取/解析完整 webhook 请求体之前，会先检查密码身份验证。

## 保持 Messages.app 处于活跃状态（VM / 无头设置）

某些 macOS VM / 常开设置中，Messages.app 可能会进入“空闲”状态（传入事件会停止，直到应用被打开/切到前台）。一个简单的解决方法是使用 AppleScript + LaunchAgent **每 5 分钟触碰一次 Messages**。

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

- 该任务会**每 300 秒**运行一次，并且会在**登录时**运行。
- 首次运行时可能会触发 macOS 的**自动化**提示（`osascript` → Messages）。请在运行该 LaunchAgent 的同一用户会话中批准它们。

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
- **DM policy**：pairing、allowlist、open 或 disabled
- **Allow list**：电话号码、电子邮件地址或聊天目标

你也可以通过 CLI 添加 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（私信 + 群组）

私信：

- 默认值：`channels.bluebubbles.dmPolicy = "pairing"`。
- 未知发送者会收到一个 pairing 代码；在获准之前，消息会被忽略（代码 1 小时后过期）。
- 可通过以下方式批准：
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Pairing 是默认的令牌交换方式。详情请参见：[Pairing](/zh-CN/channels/pairing)

群组：

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认值：`allowlist`）。
- 当设置为 `allowlist` 时，`channels.bluebubbles.groupAllowFrom` 用于控制谁可以在群组中触发。

### 联系人姓名增强（macOS，可选）

BlueBubbles 群组 webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文改为显示本地联系人姓名，可以在 macOS 上选择启用本地通讯录增强：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 可启用查找。默认值：`false`。
- 查找仅会在群组访问、命令授权和提及门控允许消息通过之后运行。
- 只会增强未命名的电话参与者。
- 如果未找到本地匹配项，则仍会回退为原始电话号码。

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

BlueBubbles 支持群聊提及门控，与 iMessage/WhatsApp 的行为一致：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）检测提及。
- 当群组启用了 `requireMention` 时，智能体仅会在被提及时响应。
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
        "iMessage;-;chat123": { requireMention: false }, // 针对特定群组的覆盖
      },
    },
  },
}
```

### 命令门控

- 控制命令（例如 `/config`、`/model`）需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 来确定命令授权。
- 已授权发送者即使在群组中没有提及，也可以运行控制命令。

### 按群组设置 systemPrompt

`channels.bluebubbles.groups.*` 下的每个条目都接受一个可选的 `systemPrompt` 字符串。该值会在该群组中处理消息的每一轮时注入到智能体的系统提示词中，因此你可以在不编辑智能体提示词的情况下，为每个群组设置人格或行为规则：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "将回复控制在 3 句以内。模仿该群组的随意语气。",
        },
      },
    },
  },
}
```

该键与 BlueBubbles 报告的群组 `chatGuid` / `chatIdentifier` / 数字 `chatId` 相匹配，而 `"*"` 通配符条目则为所有没有精确匹配的群组提供默认值（与 `requireMention` 和按群组工具策略使用相同的模式）。精确匹配始终优先于通配符。私信会忽略此字段；请改用智能体级别或账户级别的提示词定制。

#### 示例：线程回复与 tapback reactions（Private API）

启用 BlueBubbles Private API 后，入站消息会带有简短消息 ID（例如 `[[reply_to:5]]`），智能体可以调用 `action=reply` 将回复串到特定消息下，或调用 `action=react` 添加一个 tapback。按群组设置 `systemPrompt` 是让智能体稳定选择正确工具的一种可靠方式：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "在此群组中回复时，始终使用上下文中的",
            "[[reply_to:N]] messageId 调用 action=reply，",
            "这样你的回复会串在触发消息下方。",
            "绝不要发送一条新的、未关联的消息。",
            "",
            "对于简短确认（‘ok’、‘got it’、‘on it’），",
            "请使用 action=react 搭配合适的 tapback emoji（❤️、👍、😂、‼️、❓），",
            "而不是发送文字回复。",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback reactions 和线程回复都需要 BlueBubbles Private API；底层机制请参见[高级操作](#advanced-actions)和[消息 ID](#message-ids-short-vs-full)。

## ACP 会话绑定

BlueBubbles 聊天可以转换为持久的 ACP 工作区，而无需更改传输层。

快速操作流程：

- 在私信或允许的群聊中运行 `/acp spawn codex --bind here`。
- 之后，该 BlueBubbles 会话中的消息会路由到已生成的 ACP 会话。
- `/new` 和 `/reset` 会在原地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

也支持通过顶层 `bindings[]` 条目配置持久绑定，其中 `type: "acp"` 且 `match.channel: "bluebubbles"`。

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

共享的 ACP 绑定行为请参见 [ACP Agents](/zh-CN/tools/acp-agents)。

## 正在输入 + 已读回执

- **输入指示器**：会在生成回复之前和期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认值：`true`）。
- **输入指示器**：OpenClaw 会发送输入开始事件；BlueBubbles 会在发送消息或超时后自动清除输入状态（通过 DELETE 手动停止并不可靠）。

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

BlueBubbles 在配置中启用后支持高级消息操作：

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback（默认：true）
        edit: true, // 编辑已发送消息（macOS 13+，在 macOS 26 Tahoe 上已损坏）
        unsend: true, // 撤回消息（macOS 13+）
        reply: true, // 按消息 GUID 进行线程回复
        sendWithEffect: true, // 消息效果（slam、loud 等）
        renameGroup: true, // 重命名群聊
        setGroupIcon: true, // 设置群聊图标/照片（在 macOS 26 Tahoe 上不稳定）
        addParticipant: true, // 向群组添加参与者
        removeParticipant: true, // 从群组移除参与者
        leaveGroup: true, // 离开群聊
        sendAttachment: true, // 发送附件/媒体
      },
    },
  },
}
```

可用操作：

- **react**：添加/移除 tapback reactions（`messageId`、`emoji`、`remove`）。iMessage 原生的 tapback 集合为 `love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`。当智能体选择了该集合之外的 emoji（例如 `👀`）时，reaction 工具会回退到 `love`，这样 tapback 仍能显示，而不会导致整个请求失败。已配置的确认 reactions 仍会严格校验，并在值未知时报错。
- **edit**：编辑已发送消息（`messageId`、`text`）
- **unsend**：撤回消息（`messageId`）
- **reply**：回复特定消息（`messageId`、`text`、`to`）
- **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`）
- **renameGroup**：重命名群聊（`chatGuid`、`displayName`）
- **setGroupIcon**：设置群聊图标/照片（`chatGuid`、`media`）—— 在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标不会同步）。
- **addParticipant**：向群组添加成员（`chatGuid`、`address`）
- **removeParticipant**：从群组移除成员（`chatGuid`、`address`）
- **leaveGroup**：离开群聊（`chatGuid`）
- **upload-file**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）
  - 语音备忘录：设置 `asVoice: true`，并使用 **MP3** 或 **CAF** 音频，以 iMessage 语音消息形式发送。BlueBubbles 在发送语音备忘录时会将 MP3 转换为 CAF。
- 旧别名：`sendAttachment` 仍然可用，但 `upload-file` 是规范的操作名称。

### 消息 ID（短 ID 与完整 ID）

OpenClaw 可能会显示_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商的完整 ID。
- 短 ID 存储于内存中；在重启或缓存逐出后可能失效。
- 操作接受短或完整 `messageId`，但如果短 ID 已不可用，将会报错。

对于持久自动化和存储，请使用完整 ID：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站负载中的 `MessageSidFull` / `ReplyToIdFull`

模板变量请参见[配置](/zh-CN/gateway/configuration)。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合并拆分发送的私信（单次输入中的命令 + URL）

当用户在 iMessage 中将命令和 URL 一起输入时——例如 `Dump https://example.com/article`——Apple 会将这次发送拆成**两次独立的 webhook 投递**：

1. 一条文本消息（`"Dump"`）。
2. 一个 URL 预览气泡（`"https://..."`），并带有 OG 预览图片作为附件。

在大多数设置中，这两个 webhook 会相隔约 0.8-2.0 秒到达 OpenClaw。如果不进行合并，智能体会在第 1 轮只收到命令，于是作出回复（通常是“把 URL 发给我”），直到第 2 轮才看到 URL——这时命令上下文已经丢失。

`channels.bluebubbles.coalesceSameSenderDms` 可让私信将来自同一发送者的连续 webhook 合并为单个智能体轮次。群聊则继续按每条消息分别处理，以保留多用户轮次结构。

### 何时启用

在以下情况下启用：

- 你提供的 Skills 期望在一条消息中接收 `命令 + 负载`（dump、paste、save、queue 等）。
- 你的用户会将 URL、图片或长内容与命令一起粘贴发送。
- 你可以接受增加的私信轮次延迟（见下文）。

在以下情况下保持禁用：

- 你需要单词私信触发命令的最低延迟。
- 你的所有流程都是不带后续负载的一次性命令。

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

启用该标志后，如果未显式设置 `messages.inbound.byChannel.bluebubbles`，防抖窗口会扩展到 **2500 ms**（非合并模式的默认值为 500 ms）。需要更宽的窗口——Apple 的拆分发送节奏为 0.8-2.0 秒，无法落入更紧的默认窗口。

如需自行调整窗口：

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms 适用于大多数设置；如果你的 Mac 较慢
        // 或处于内存压力下（观察到间隔可能会超过 2 秒），可提高到 4000 ms。
        bluebubbles: 2500,
      },
    },
  },
}
```

### 权衡

- **私信控制命令的延迟增加。** 启用该标志后，私信控制命令消息（如 `Dump`、`Save` 等）现在会在分发前最多等待一个防抖窗口，以防后续还有负载 webhook 到来。群聊命令仍保持即时分发。
- **合并输出是有界的**——合并文本上限为 4000 个字符，并带有显式的 `…[truncated]` 标记；附件上限为 20；源条目上限为 10（超过后保留首条和最新条）。每个源 `messageId` 仍会进入入站去重，因此之后若 MessagePoller 重放任意单个事件，仍会被识别为重复项。
- **按渠道选择启用。** 其他渠道（Telegram、WhatsApp、Slack、……）不受影响。

### 场景以及智能体看到的内容

| 用户输入内容 | Apple 投递方式 | 标志关闭（默认） | 标志开启 + 2500 ms 窗口 |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送） | 2 个 webhook，相隔约 1 秒 | 两个智能体轮次：仅有 “Dump”，然后是 URL | 一个轮次：合并文本 `Dump https://example.com` |
| `Save this 📎image.jpg caption`（附件 + 文本） | 2 个 webhook | 两个轮次 | 一个轮次：文本 + 图片 |
| `/status`（独立命令） | 1 个 webhook | 即时分发 | **最多等待整个窗口后再分发** |
| 单独粘贴的 URL | 1 个 webhook | 即时分发 | 即时分发（桶中只有一个条目） |
| 文本 + URL 故意分成两条消息发送，相隔数分钟 | 2 个 webhook，超出窗口 | 两个轮次 | 两个轮次（窗口已在它们之间过期） |
| 快速洪泛（窗口内超过 10 条小型私信） | N 个 webhook | N 个轮次 | 一个轮次，有界输出（应用首条 + 最新条保留、文本/附件上限） |

### 拆分发送合并的故障排除

如果标志已开启，但拆分发送仍然作为两个轮次到达，请检查每一层：

1. **配置是否确实已加载。**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   然后执行 `openclaw gateway restart` —— 该标志会在 debouncer-registry 创建时读取。

2. **你的设置是否有足够宽的防抖窗口。** 查看 `~/Library/Logs/bluebubbles-server/main.log` 下的 BlueBubbles 服务器日志：

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   测量 `"Dump"` 这类文本投递与其后 `"https://..."`; Attachments:` 投递之间的间隔。将 `messages.inbound.byChannel.bluebubbles` 调高到能够从容覆盖该间隔。

3. **会话 JSONL 时间戳 ≠ webhook 到达时间。** 会话事件时间戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 网关何时将消息交给智能体，**而不是** webhook 何时到达。如果排队中的第二条消息带有 `[Queued messages while agent was busy]` 标签，说明第二个 webhook 到达时，第一轮仍在运行——合并桶已经刷新。请根据 BB 服务器日志而不是会话日志来调整窗口。

4. **内存压力导致回复分发变慢。** 在较小的机器（8 GB）上，智能体轮次可能耗时较长，导致在回复完成前合并桶就已刷新，URL 于是作为排队的第二轮消息到达。检查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 网关 RSS 超过约 500 MB 且压缩器处于活跃状态，请关闭其他高负载进程或升级到更大的主机。

5. **回复引用发送是另一条路径。** 如果用户将 `Dump` 作为对现有 URL 气泡的**回复**发送（iMessage 会在 Dump 气泡上显示 “1 Reply” 标记），那么 URL 位于 `replyToBody` 中，而不是第二个 webhook。此时合并机制不适用——这是 Skills/提示词问题，而不是防抖器问题。

## 分块流式传输

控制响应是作为单条消息发送，还是按块流式发送：
__OC_I18N_900017__
## 媒体 + 限制

- 入站附件会被下载并存储到媒体缓存中。
- 入站和出站媒体都通过 `channels.bluebubbles.mediaMaxMb` 限制媒体大小（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 个字符）。

## 配置参考

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.bluebubbles.enabled`：启用/禁用该渠道。
- `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
- `channels.bluebubbles.password`：API 密码。
- `channels.bluebubbles.webhookPath`：webhook 端点路径（默认：`/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
- `channels.bluebubbles.allowFrom`：私信 allowlist（句柄、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
- `channels.bluebubbles.groupAllowFrom`：群组发送者 allowlist。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，可在门控通过后选择性地从本地通讯录增强未命名的群组参与者。默认：`false`。
- `channels.bluebubbles.groups`：按群组配置（`requireMention` 等）。
- `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
- `channels.bluebubbles.blockStreaming`：启用分块流式传输（默认：`false`；流式回复需要启用）。
- `channels.bluebubbles.textChunkLimit`：出站分块大小，单位为字符（默认：4000）。
- `channels.bluebubbles.sendTimeoutMs`：通过 `/api/v1/message/text` 发送出站文本时，每个请求的超时时间（毫秒，默认：30000）。在 macOS 26 设置中，如果 Private API iMessage 发送可能在 iMessage 框架内部停滞 60+ 秒，请调高此值；例如 `45000` 或 `60000`。探测、聊天查询、reactions、编辑和健康检查目前仍保持较短的 10 秒默认值；后续计划扩展到 reactions 和编辑。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时分割；`newline` 会先按空行（段落边界）分割，然后再按长度分块。
- `channels.bluebubbles.mediaMaxMb`：入站/出站媒体大小上限，单位为 MB（默认：8）。
- `channels.bluebubbles.mediaLocalRoots`：允许用于出站本地媒体路径的绝对本地目录显式 allowlist。默认情况下，除非配置此项，否则会拒绝本地路径发送。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.coalesceSameSenderDms`：将同一发送者的连续私信 webhook 合并为一个智能体轮次，以便 Apple 的“文本 + URL”拆分发送作为一条消息到达（默认：`false`）。有关场景、窗口调优和权衡，请参见[合并拆分发送的私信](#coalescing-split-send-dms-command--url-in-one-composition)。如果启用且未显式设置 `messages.inbound.byChannel.bluebubbles`，默认入站防抖窗口会从 500 ms 扩大到 2500 ms。
- `channels.bluebubbles.historyLimit`：用于上下文的群组消息最大数量（0 表示禁用）。
- `channels.bluebubbles.dmHistoryLimit`：私信历史记录上限。
- `channels.bluebubbles.actions`：启用/禁用特定操作。
- `channels.bluebubbles.accounts`：多账户配置。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 寻址 / 投递目标

优先使用 `chat_guid` 以获得稳定路由：

- `chat_guid:iMessage;-;+15555550123`（群组首选）
- `chat_id:123`
- `chat_identifier:...`
- 直接句柄：`+15555550123`、`user@example.com`
  - 如果直接句柄没有现有私信聊天，OpenClaw 会通过 `POST /api/v1/chat/new` 创建一个。这要求启用 BlueBubbles Private API。

### iMessage 与 SMS 路由

当同一句柄在 Mac 上同时存在 iMessage 聊天和 SMS 聊天时（例如某个电话号码已注册 iMessage，但也曾收到过绿色气泡回退消息），OpenClaw 会优先选择 iMessage 聊天，绝不会静默降级到 SMS。如需强制使用 SMS 聊天，请使用显式的 `sms:` 目标前缀（例如 `sms:+15555550123`）。对于没有匹配 iMessage 聊天的句柄，仍会通过 BlueBubbles 报告的聊天进行发送。

## 安全

- webhook 请求通过将查询参数或请求头中的 `guid`/`password` 与 `channels.bluebubbles.password` 比较来完成身份验证。
- 请对 API 密码和 webhook 端点保密（将其视为凭证）。
- BlueBubbles webhook 身份验证没有 localhost 绕过。如果你代理 webhook 流量，请在整个请求链路中保留 BlueBubbles 密码。这里的 `gateway.trustedProxies` 不能替代 `channels.bluebubbles.password`。参见[Gateway 网关安全](/gateway/security#reverse-proxy-configuration)。
- 如果要将 BlueBubbles 服务器暴露到你的 LAN 之外，请启用 HTTPS + 防火墙规则。

## 故障排除

- 如果输入/已读事件停止工作，请检查 BlueBubbles webhook 日志，并确认 Gateway 网关路径与 `channels.bluebubbles.webhookPath` 匹配。
- Pairing 代码一小时后过期；请使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- Reactions 需要 BlueBubbles Private API（`POST /api/v1/message/react`）；请确保服务器版本已提供该接口。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 Private API 变更，编辑当前已损坏。
- 群组图标更新在 macOS 26（Tahoe）上可能不稳定：API 可能返回成功，但新图标不会同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知损坏的操作。如果在 macOS 26（Tahoe）上仍显示编辑功能，请使用 `channels.bluebubbles.actions.edit=false` 手动禁用它。
- 已启用 `coalesceSameSenderDms`，但拆分发送（例如 `Dump` + URL）仍作为两个轮次到达：请参见[拆分发送合并的故障排除](#split-send-coalescing-troubleshooting)检查清单——常见原因包括防抖窗口过窄、误将会话日志时间戳当作 webhook 到达时间，或回复引用发送（其使用的是 `replyToBody`，而不是第二个 webhook）。
- 如需查看 Status/健康信息：`openclaw status --all` 或 `openclaw status --deep`。

有关一般渠道工作流参考，请参见[Channels](/zh-CN/channels)和 [Plugins](/zh-CN/tools/plugin) 指南。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信身份验证与配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为与提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与加固
