---
read_when:
    - 说明入站消息如何变成回复
    - 阐明会话、队列模式或流式传输行为
    - 记录推理可见性及其使用影响
summary: 消息流、会话、队列处理和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-04-22T19:07:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# 消息

本页汇总说明 OpenClaw 如何处理入站消息、会话、队列处理、流式传输以及推理可见性。

## 消息流（高级概览）

```text
入站消息
  -> 路由/绑定 -> 会话键
  -> 队列（如果某次运行仍在进行中）
  -> 智能体运行（流式传输 + 工具）
  -> 出站回复（渠道限制 + 分块）
```

关键调节项位于配置中：

- `messages.*`：用于前缀、队列处理和群组行为。
- `agents.defaults.*`：用于分块流式传输和分块默认值。
- 渠道覆盖项（`channels.whatsapp.*`、`channels.telegram.*` 等）：用于上限和流式传输开关。

完整 schema 请参阅 [配置](/zh-CN/gateway/configuration)。

## 入站去重

渠道在重新连接后可能会重新投递同一条消息。OpenClaw 会维护一个短期缓存，按渠道/账户/对端/会话/消息 id 作为键，因此重复投递不会再次触发智能体运行。

## 入站防抖

来自**同一发送者**的快速连续消息，可以通过 `messages.inbound` 合并为单次智能体轮次。防抖按每个渠道 + 会话范围生效，并使用最新一条消息来处理回复线程/ID。

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

- 防抖仅适用于**纯文本**消息；媒体/附件会立即刷新。
- 控制命令会绕过防抖，以保持其独立性——**但**如果某个渠道明确启用了同一发送者私信合并（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-CN/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），那么私信命令会在防抖窗口内等待，以便拆分发送的负载能加入同一轮智能体处理。

## 会话和设备

会话由 Gateway 网关 持有，而不是由客户端持有。

- 私聊会折叠为智能体主会话键。
- 群组/渠道会获得各自独立的会话键。
- 会话存储和转录记录保存在 Gateway 网关 主机上。

多个设备/渠道可以映射到同一个会话，但历史记录不会完全同步回每个客户端。建议：长对话使用一个主设备，以避免上下文分叉。控制 UI 和 TUI 始终显示由 Gateway 网关 支持的会话转录，因此它们才是事实来源。

详情请参阅：[会话管理](/zh-CN/concepts/session)。

## 入站正文和历史上下文

OpenClaw 会将**提示正文**与**命令正文**分开：

- `Body`：发送给智能体的提示文本。它可以包含渠道信封以及可选的历史包装内容。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧别名（为兼容性保留）。

当某个渠道提供历史记录时，会使用共享包装格式：

- `[自你上次回复以来的聊天消息 - 供参考上下文]`
- `[当前消息 - 请回复此消息]`

对于**非私聊**（群组/渠道/房间），**当前消息正文**会带有发送者标签前缀（与历史记录条目使用相同样式）。这样可以让实时消息与排队/历史消息在智能体提示中保持一致。

历史缓冲区是**仅待处理**的：它们包含那些_未_触发运行的群组消息（例如由提及门控的消息），并且**不包含**已经进入会话转录的消息。

指令剥离仅适用于**当前消息**部分，因此历史记录会保持完整。包装历史记录的渠道应将 `CommandBody`（或 `RawBody`）设为原始消息文本，并将 `Body` 保持为合并后的提示。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认值）以及每渠道覆盖项（如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`）进行配置（设为 `0` 可禁用）。

## 队列处理和后续消息

如果某次运行已经处于活动状态，入站消息可以进入队列、导入当前运行，或收集为后续轮次。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）进行配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，以及 backlog 变体。

详情请参阅：[队列处理](/zh-CN/concepts/queue)。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复。
分块会遵守渠道文本限制，并避免拆分带围栏的代码块。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲时间的批处理）
- `agents.defaults.humanDelay`（块回复之间模拟人工停顿）
- 渠道覆盖：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情请参阅：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 推理可见性和 token

OpenClaw 可以公开或隐藏模型推理：

- `/reasoning on|off|stream` 用于控制可见性。
- 如果模型产生了推理内容，这些内容仍会计入 token 使用量。
- Telegram 支持将推理流式输出到草稿气泡中。

详情请参阅：[思考 + 推理指令](/zh-CN/tools/thinking) 和 [Token 使用](/zh-CN/reference/token-use)。

## 前缀、线程和回复

出站消息格式统一由 `messages` 集中控制：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和每渠道默认值控制回复线程

详情请参阅：[配置](/zh-CN/gateway/configuration-reference#messages) 和各渠道文档。

## 静默回复

精确的静默 token `NO_REPLY` / `no_reply` 表示“不要投递用户可见的回复”。
OpenClaw 会根据会话类型解析这一行为：

- 直接会话默认不允许静默，并会将裸静默回复改写为简短的可见回退消息。
- 群组/渠道默认允许静默。
- 内部编排默认允许静默。

默认值位于 `agents.defaults.silentReply` 和
`agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 和
`surfaces.<id>.silentReplyRewrite` 可按 surface 单独覆盖。

当父会话存在一个或多个待处理的已生成子智能体运行时，裸静默回复会在所有 surface 上被直接丢弃，而不是被改写，因此父级会保持安静，直到子级完成事件投递真实回复。

## 相关内容

- [流式传输](/zh-CN/concepts/streaming) — 实时消息投递
- [重试](/zh-CN/concepts/retry) — 消息投递重试行为
- [队列](/zh-CN/concepts/queue) — 消息处理队列
- [渠道](/zh-CN/channels) — 消息平台集成
