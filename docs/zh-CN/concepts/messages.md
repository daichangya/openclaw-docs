---
read_when:
    - 解释入站消息如何变成回复
    - 澄清会话、排队模式或流式传输行为
    - 记录推理可见性及其使用影响
summary: 消息流、会话、排队和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-04-25T17:09:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e085e778b10f9fbf3ccc8fb2939667b3c2b2bc88f5dc0be6c5c4fc1fc96e9d0
    source_path: concepts/messages.md
    workflow: 15
---

本页将 OpenClaw 如何处理入站消息、会话、排队、流式传输和推理可见性串联起来。

## 消息流（高层）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

关键调节项位于配置中：

- `messages.*` 用于前缀、排队和群组行为。
- `agents.defaults.*` 用于分块流式传输和分块默认值。
- 渠道覆盖项（`channels.whatsapp.*`、`channels.telegram.*` 等）用于上限和流式传输开关。

完整 schema 请参见 [配置](/zh-CN/gateway/configuration)。

## 入站去重

渠道在重连后可能会重新投递同一条消息。OpenClaw 会维护一个短期缓存，基于 channel/account/peer/session/message id 作为键，因此重复投递不会再次触发智能体运行。

## 入站去抖

来自**同一发送者**的快速连续消息，可以通过 `messages.inbound` 批量合并为单个智能体轮次。去抖按每个渠道 + 会话范围生效，并使用最新消息来处理回复线程 / ID。

配置（全局默认值 + 每个渠道的覆盖项）：

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

- 去抖仅适用于**纯文本**消息；媒体 / 附件会立即刷新。
- 控制命令会绕过去抖，以保持其独立性——**但有一个例外**：当某个渠道明确选择加入同一发送者私信合并时（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-CN/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），私信命令会在去抖窗口内等待，以便拆分发送的负载可加入同一个智能体轮次。

## 会话和设备

会话由 Gateway 网关 拥有，而不是由客户端拥有。

- 私聊会折叠到智能体主会话键。
- 群组 / 渠道会获得各自独立的会话键。
- 会话存储和转录记录保存在 Gateway 网关 主机上。

多个设备 / 渠道可以映射到同一个会话，但历史记录不会完整同步回每个客户端。建议：对于长对话，使用一个主设备，以避免上下文分叉。Control UI 和 TUI 始终显示由 Gateway 网关 支持的会话转录记录，因此它们才是事实来源。

详情请参见：[会话管理](/zh-CN/concepts/session)。

## 入站正文和历史上下文

OpenClaw 将**提示词正文**与**命令正文**分开处理：

- `Body`：发送给智能体的提示词文本。其中可能包含渠道封装和可选的历史包装。
- `CommandBody`：用于指令 / 命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧别名（为兼容性保留）。

当某个渠道提供历史记录时，会使用共享包装：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非私聊**（群组 / 渠道 / 房间），**当前消息正文**会带上发送者标签前缀（与历史条目所用样式相同）。这样可以让实时消息与排队 / 历史消息在智能体提示词中保持一致。

历史缓冲区是**仅 pending** 的：它们包含未触发运行的群组消息（例如受 mention 限制的消息），并且**不包含**已进入会话转录记录的消息。

指令剥离仅适用于**当前消息**部分，因此历史记录会保持完整。包装历史记录的渠道应将 `CommandBody`（或 `RawBody`）设置为原始消息文本，并将 `Body` 保持为组合后的提示词。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认值）以及每个渠道的覆盖项进行配置，例如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`（设为 `0` 可禁用）。

## 排队和后续消息

如果某次运行已经处于活动状态，入站消息可以排队、导向当前运行，或收集到后续轮次中。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）进行配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，以及 backlog 变体。

详情请参见：[排队](/zh-CN/concepts/queue)。

## 流式传输、分块和批处理

分块流式传输会在模型产出文本块时发送部分回复。
分块会遵守渠道文本限制，并避免拆分带围栏的代码块。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲时间的批处理）
- `agents.defaults.humanDelay`（块回复之间模拟人类的停顿）
- 渠道覆盖项：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情请参见：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 推理可见性和 token

OpenClaw 可以显示或隐藏模型推理：

- `/reasoning on|off|stream` 用于控制可见性。
- 只要模型产出了推理内容，这些内容仍会计入 token 使用量。
- Telegram 支持将推理流式输出到草稿气泡中。

详情请参见：[Thinking + reasoning directives](/zh-CN/tools/thinking) 和 [Token 使用](/zh-CN/reference/token-use)。

## 前缀、线程和回复

出站消息格式由 `messages` 统一管理：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 以及每个渠道的默认值进行回复线程控制

详情请参见：[配置](/zh-CN/gateway/config-agents#messages) 和各渠道文档。

## 静默回复

精确的静默 token `NO_REPLY` / `no_reply` 表示“不要投递用户可见的回复”。
当某个轮次同时还带有待发送的工具媒体（例如生成的 TTS 音频）时，OpenClaw 会去掉静默文本，但仍会发送媒体附件。
OpenClaw 会按会话类型解析这一行为：

- 私聊默认不允许静默，并会将纯静默回复重写为简短的可见回退内容。
- 群组 / 渠道默认允许静默。
- 内部编排默认允许静默。

默认值位于 `agents.defaults.silentReply` 和
`agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 和
`surfaces.<id>.silentReplyRewrite` 可按 surface 覆盖这些值。

当父会话存在一个或多个待处理的已生成子智能体运行时，所有 surface 上的纯静默回复都会被直接丢弃，而不是被重写，这样父级会保持静默，直到子级完成事件投递真正的回复。

## 相关内容

- [流式传输](/zh-CN/concepts/streaming) —— 实时消息投递
- [重试](/zh-CN/concepts/retry) —— 消息投递重试行为
- [队列](/zh-CN/concepts/queue) —— 消息处理队列
- [渠道](/zh-CN/channels) —— 消息平台集成
