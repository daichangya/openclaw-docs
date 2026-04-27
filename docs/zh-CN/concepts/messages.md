---
read_when:
    - 解释入站消息如何变成回复
    - 说明会话、队列模式或流式传输行为
    - 记录推理可见性及其使用影响
summary: 消息流、会话、队列处理和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-04-27T06:03:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fcfadebb41a96e8e50a818081adf63487234541cf7805f502dae914a39983c0
    source_path: concepts/messages.md
    workflow: 15
---

OpenClaw 通过一条由会话解析、队列处理、流式传输、工具执行和推理可见性组成的流水线来处理入站消息。此页面说明了从入站消息到回复的路径。

## 消息流（高级概览）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

关键控制项位于配置中：

- `messages.*` 用于前缀、队列处理和群组行为。
- `agents.defaults.*` 用于分块流式传输和分块默认值。
- 渠道覆盖项（`channels.whatsapp.*`、`channels.telegram.*` 等）用于容量上限和流式传输开关。

完整 schema 请参见[配置](/zh-CN/gateway/configuration)。

## 入站去重

渠道在重连后可能会重新投递同一条消息。OpenClaw 会维护一个短生命周期缓存，按 channel / account / peer / session / message id 作为键，这样重复投递就不会再次触发智能体运行。

## 入站防抖

来自**同一发送者**的快速连续消息，可以通过 `messages.inbound` 合并成一个智能体轮次。防抖按每个渠道 + 会话范围生效，并使用最新的一条消息来处理回复线程 / ID。

配置（全局默认值 + 每渠道覆盖）：

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

说明：

- 防抖仅适用于**纯文本**消息；媒体 / 附件会立即刷新。
- 控制命令会绕过防抖，以保持独立 —— **但有一个例外**：当某个渠道显式选择加入同发送者私信合并时（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-CN/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），私信命令会在防抖窗口内等待，以便拆开发送的负载可以并入同一个智能体轮次。

## 会话和设备

会话归 Gateway 网关所有，而不归客户端所有。

- 直接聊天会折叠到智能体主会话键。
- 群组 / 渠道拥有各自独立的会话键。
- 会话存储和转录保存在 Gateway 网关主机上。

多个设备 / 渠道可以映射到同一个会话，但历史记录不会完全同步回每个客户端。建议：长对话中使用一个主要设备，以避免上下文分叉。Control UI 和 TUI 始终显示由 Gateway 网关支持的会话转录，因此它们是事实来源。

详情请参见：[会话管理](/zh-CN/concepts/session)。

## 工具结果元数据

工具结果中的 `content` 是模型可见的结果。工具结果中的 `details` 是用于 UI 渲染、诊断、媒体发送和插件的运行时元数据。

OpenClaw 明确保持这一边界：

- `toolResult.details` 会在提供商重放和压缩输入前被剥离。
- 持久化的会话转录仅保留有界的 `details`；过大的元数据会被替换为紧凑摘要，并标记 `persistedDetailsTruncated: true`。
- 插件和工具应将模型必须读取的文本放在 `content` 中，而不是只放在 `details` 中。

## 入站正文和历史上下文

OpenClaw 将**提示正文**与**命令正文**分开：

- `Body`：发送给智能体的提示文本。其中可能包含渠道封装和可选的历史包装。
- `CommandBody`：用于指令 / 命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧版别名（为兼容性保留）。

当某个渠道提供历史记录时，会使用共享包装：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非直接聊天**（群组 / 渠道 / 房间），**当前消息正文**会加上发送者标签前缀（与历史条目使用相同风格）。这样可以让实时消息和队列 / 历史消息在智能体提示中保持一致。

历史缓冲区是**仅待处理**的：它们包含那些_未_触发运行的群组消息（例如受提及门控的消息），并且**排除**已经在会话转录中的消息。

指令剥离仅适用于**当前消息**部分，因此历史记录保持完整。包装历史的渠道应将 `CommandBody`（或 `RawBody`）设为原始消息文本，并将 `Body` 保持为合并后的提示。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认值）以及每渠道覆盖项（如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`）配置（设为 `0` 可禁用）。

## 队列处理和后续消息

如果某个运行已经处于活动状态，入站消息可以进入队列、导向当前运行，或收集到后续轮次中。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，以及 backlog 变体。

详情请参见：[队列处理](/zh-CN/concepts/queue)。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复。
分块会遵守渠道文本限制，并避免拆分带围栏的代码块。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲时间的批处理）
- `agents.defaults.humanDelay`（块回复之间模拟人类的停顿）
- 渠道覆盖：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情请参见：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 推理可见性和 token

OpenClaw 可以显示或隐藏模型推理：

- `/reasoning on|off|stream` 控制可见性。
- 一旦模型生成了推理内容，它仍会计入 token 使用量。
- Telegram 支持将推理流式传输到草稿气泡中。

详情请参见：[Thinking + 推理指令](/zh-CN/tools/thinking) 和 [Token 使用](/zh-CN/reference/token-use)。

## 前缀、线程和回复

出站消息格式由 `messages` 统一控制：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和每渠道默认值进行回复线程控制

详情请参见：[配置](/zh-CN/gateway/config-agents#messages) 和各渠道文档。

## 静默回复

精确的静默标记 `NO_REPLY` / `no_reply` 表示“不要发送用户可见回复”。
当某一轮同时带有待发送的工具媒体（例如生成的 TTS 音频）时，OpenClaw
会剥离静默文本，但仍发送媒体附件。
OpenClaw 会按会话类型解析该行为：

- 直接会话默认不允许静默，并会将纯静默回复重写为简短的可见回退文本。
- 群组 / 渠道默认允许静默。
- 内部编排默认允许静默。

对于发生在任何助手回复之前的非直接聊天内部运行器失败，OpenClaw 也会使用静默回复，因此群组 / 渠道不会看到 Gateway 网关错误样板文本。直接聊天默认显示紧凑的失败说明；只有当 `/verbose` 为 `on` 或 `full` 时，才会显示原始运行器详情。

默认值位于 `agents.defaults.silentReply` 和
`agents.defaults.silentReplyRewrite`；`surfaces.<id>.silentReply` 和
`surfaces.<id>.silentReplyRewrite` 可按界面进行覆盖。

当父会话存在一个或多个待处理的已生成子智能体运行时，所有界面上的纯静默回复都会被丢弃，而不是被重写，这样父级会保持静默，直到子级完成事件发送真实回复。

## 相关内容

- [Streaming](/zh-CN/concepts/streaming) — 实时消息发送
- [Retry](/zh-CN/concepts/retry) — 消息发送重试行为
- [Queue](/zh-CN/concepts/queue) — 消息处理队列
- [Channels](/zh-CN/channels) — 消息平台集成
