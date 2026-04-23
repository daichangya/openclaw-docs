---
read_when:
    - 解释入站消息如何变成回复时
    - 澄清会话、排队模式或流式传输行为时
    - 记录推理可见性和使用影响时
summary: 消息流、会话、排队与推理可见性
title: 消息
x-i18n:
    generated_at: "2026-04-23T20:46:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b1122b75f56083fee383095aa4838a0d62e5a83ae19eb52441859a2c1774ea8
    source_path: concepts/messages.md
    workflow: 15
---

本页将 OpenClaw 如何处理入站消息、会话、排队、
流式传输以及推理可见性串联起来说明。

## 消息流（高级概览）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

关键控制项位于配置中：

- `messages.*` 用于前缀、排队和群组行为。
- `agents.defaults.*` 用于分块流式传输和分块默认值。
- 渠道覆盖（`channels.whatsapp.*`、`channels.telegram.*` 等）用于上限和流式传输开关。

完整 schema 请参见 [Configuration](/zh-CN/gateway/configuration)。

## 入站去重

渠道在重连后可能会重新投递相同消息。OpenClaw 会维护一个短生命周期缓存，按渠道/账户/对端/会话/消息 id 建立键，因此重复投递不会再次触发智能体运行。

## 入站防抖

来自**同一发送者**的快速连续消息可以通过 `messages.inbound` 合并为单个
智能体轮次。防抖按每个渠道 + 会话范围生效，并使用最新消息来处理回复线程/ID。

配置（全局默认值 + 按渠道覆盖）：

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

- 防抖仅适用于**纯文本**消息；媒体/附件会立即刷新。
- 控制命令会绕过防抖，以保持独立 —— **但**当某个渠道显式选择启用同一发送者私信合并时除外（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-CN/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），此时私信命令会在防抖窗口内等待，以便拆分发送的载荷可并入同一个智能体轮次。

## 会话与设备

会话归 gateway 所有，而不是归客户端所有。

- 私聊会折叠到智能体主会话键。
- 群组/渠道会拥有各自的会话键。
- 会话存储和转录记录位于 gateway 主机上。

多个设备/渠道可以映射到同一个会话，但历史记录不会完全同步回每个客户端。建议：长对话使用一个主设备，以避免上下文分叉。Control UI 和终端 UI 始终显示由 gateway 支持的会话转录，因此它们是事实来源。

详情请参见：[Session management](/zh-CN/concepts/session)。

## 入站正文与历史上下文

OpenClaw 将**提示正文**与**命令正文**分开：

- `Body`：发送给智能体的提示文本。它可能包含渠道封装以及
  可选的历史包装器。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧别名（为兼容性保留）。

当某个渠道提供历史记录时，会使用共享包装器：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非私聊**（群组/渠道/房间），**当前消息正文**会加上
发送者标签前缀（样式与历史条目相同）。这可以让实时消息和排队/历史
消息在智能体提示中保持一致。

历史缓冲区是**仅待处理**的：它们包含那些_未_
触发运行的群组消息（例如受提及门控控制的消息），并且**排除**
已经存在于会话转录中的消息。

指令剥离只适用于**当前消息**部分，因此历史记录保持完整。包装历史的渠道应将 `CommandBody`（或
`RawBody`）设置为原始消息文本，并将 `Body` 保持为合并后的提示。
历史缓冲区可通过 `messages.groupChat.historyLimit`（全局
默认值）以及按渠道覆盖（例如 `channels.slack.historyLimit` 或
`channels.telegram.accounts.<id>.historyLimit`）进行配置（设置 `0` 可禁用）。

## 排队与后续消息

如果某次运行已处于活动状态，入站消息可以进入队列、被引导到
当前运行中，或被收集到后续轮次。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，以及 backlog 变体。

详情请参见：[Queueing](/zh-CN/concepts/queue)。

## 流式传输、分块与批处理

分块流式传输会在模型生成文本块时发送部分回复。
分块会遵守渠道文本限制，并避免拆分带围栏的代码块。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲的批处理）
- `agents.defaults.humanDelay`（块回复之间的拟人停顿）
- 渠道覆盖：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情请参见：[Streaming + chunking](/zh-CN/concepts/streaming)。

## 推理可见性与 token

OpenClaw 可以显示或隐藏模型推理：

- `/reasoning on|off|stream` 控制可见性。
- 当模型产出推理内容时，这些内容仍会计入 token 使用量。
- Telegram 支持将推理流式显示到草稿气泡中。

详情请参见：[Thinking + reasoning directives](/zh-CN/tools/thinking) 和 [Token use](/zh-CN/reference/token-use)。

## 前缀、线程与回复

出站消息格式统一集中在 `messages` 中：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和按渠道默认值控制回复线程

详情请参见 [Configuration](/zh-CN/gateway/configuration-reference#messages) 和各渠道文档。

## 静默回复

精确的静默令牌 `NO_REPLY` / `no_reply` 表示“不要投递用户可见回复”。
OpenClaw 会根据会话类型解析此行为：

- 私聊默认不允许静默，并会将裸静默
  回复重写为简短的可见回退。
- 群组/渠道默认允许静默。
- 内部编排默认允许静默。

默认值位于 `agents.defaults.silentReply` 和
`agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 和
`surfaces.<id>.silentReplyRewrite` 可按界面覆盖。

当父会话存在一个或多个待处理的已生成子智能体运行时，所有界面上的裸静默
回复都会被丢弃，而不是被重写，这样父会话会保持安静，直到子任务完成事件投递真正的回复。

## 相关内容

- [Streaming](/zh-CN/concepts/streaming) — 实时消息投递
- [Retry](/zh-CN/concepts/retry) — 消息投递重试行为
- [Queue](/zh-CN/concepts/queue) — 消息处理队列
- [Channels](/zh-CN/channels) — 消息平台集成
