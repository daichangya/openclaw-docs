---
read_when:
    - 解释入站消息如何变成回复
    - 说明会话、队列模式或流式传输行为
    - 记录推理可见性及其使用影响
summary: 消息流、会话、队列处理和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-04-21T04:19:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf88b91f3489bfdfb4a84f8a287a1ec0b0d71a765dfe27c666c6f43d0145022
    source_path: concepts/messages.md
    workflow: 15
---

# 消息

本页汇总介绍 OpenClaw 如何处理入站消息、会话、队列、流式传输以及推理可见性。

## 消息流（高级概览）

```text
入站消息
  -> 路由/绑定 -> 会话键
  -> 队列（如果某次运行处于活动状态）
  -> 智能体运行（流式传输 + 工具）
  -> 出站回复（渠道限制 + 分块）
```

关键调节项位于配置中：

- `messages.*` 用于前缀、队列处理和群组行为。
- `agents.defaults.*` 用于分块流式传输和分块默认值。
- 渠道覆盖项（`channels.whatsapp.*`、`channels.telegram.*` 等）用于上限和流式传输开关。

完整 schema 请参见 [Configuration](/zh-CN/gateway/configuration)。

## 入站去重

渠道在重连后可能会重复投递同一条消息。OpenClaw 会维护一个短生命周期缓存，按 channel/account/peer/session/message id 建立键，因此重复投递不会再次触发智能体运行。

## 入站防抖

来自**同一发送者**的快速连续消息，可以通过 `messages.inbound` 合并为单次智能体轮次。防抖按每个 channel + conversation 的范围生效，并使用最新消息来进行回复线程关联/ID 处理。

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

注意：

- 防抖仅适用于**纯文本**消息；媒体/附件会立即刷新。
- 控制命令会绕过防抖，以保持其独立性。

## 会话和设备

会话由 Gateway 网关拥有，而不是由客户端拥有。

- 私聊会收敛到智能体主会话键。
- 群组/渠道会拥有各自的会话键。
- 会话存储和转录记录位于 Gateway 网关主机上。

多个设备/渠道可以映射到同一会话，但历史记录不会完全同步回每个客户端。建议：长对话使用一个主设备，以避免上下文分叉。控制 UI 和 TUI 始终显示由 Gateway 网关支持的会话转录，因此它们是真实来源。

详情： [Session management](/zh-CN/concepts/session)。

## 入站正文和历史上下文

OpenClaw 将**提示正文**与**命令正文**分开：

- `Body`：发送给智能体的提示文本。它可能包含渠道信封和可选的历史包装。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧别名（为兼容性保留）。

当某个渠道提供历史记录时，它会使用共享包装：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非私聊**（群组/渠道/房间），**当前消息正文**会带上发送者标签前缀（与历史记录条目使用相同风格）。这能让实时消息与排队/历史消息在智能体提示中保持一致。

历史缓冲区是**仅待处理**的：它们包含未触发运行的群组消息（例如受提及门控的消息），并且**不包括**已经在会话转录中的消息。

指令剥离仅应用于**当前消息**部分，因此历史记录保持完整。包装历史记录的渠道应将 `CommandBody`（或 `RawBody`）设置为原始消息文本，并将 `Body` 保留为合并后的提示。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认值）以及每渠道覆盖项（如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`）进行配置（设为 `0` 可禁用）。

## 队列和后续消息

如果某次运行已经处于活动状态，入站消息可以排入队列、引导进入当前运行，或收集为后续轮次。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）进行配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，以及 backlog 变体。

详情： [Queueing](/zh-CN/concepts/queue)。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复。
分块会遵守渠道文本限制，并避免拆分围栏代码块。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲时间的批处理）
- `agents.defaults.humanDelay`（块回复之间拟人化的停顿）
- 渠道覆盖：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情： [Streaming + chunking](/zh-CN/concepts/streaming)。

## 推理可见性和 token

OpenClaw 可以显示或隐藏模型推理：

- `/reasoning on|off|stream` 用于控制可见性。
- 如果模型产生了推理内容，这些内容仍会计入 token 使用量。
- Telegram 支持将推理流式输出到草稿气泡中。

详情： [Thinking + reasoning directives](/zh-CN/tools/thinking) 和 [Token use](/zh-CN/reference/token-use)。

## 前缀、线程和回复

出站消息格式由 `messages` 统一管理：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和每渠道默认值处理回复线程

详情： [Configuration](/zh-CN/gateway/configuration-reference#messages) 和各渠道文档。

## 静默回复

精确的静默标记 `NO_REPLY` / `no_reply` 表示“不要发送用户可见的回复”。
OpenClaw 会按会话类型解析该行为：

- 私聊默认不允许静默，并会将纯静默回复重写为简短的可见回退文本。
- 群组/渠道默认允许静默。
- 内部编排默认允许静默。

默认值位于 `agents.defaults.silentReply` 和
`agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 和
`surfaces.<id>.silentReplyRewrite` 可按 surface 进行覆盖。

## 相关内容

- [Streaming](/zh-CN/concepts/streaming) — 实时消息传递
- [Retry](/zh-CN/concepts/retry) — 消息传递重试行为
- [Queue](/zh-CN/concepts/queue) — 消息处理队列
- [Channels](/zh-CN/channels) — 消息平台集成
