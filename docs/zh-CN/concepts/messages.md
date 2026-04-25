---
read_when:
    - 解释入站消息如何变成回复
    - 澄清会话、排队模式或流式传输行为
    - 记录推理可见性及其使用影响
summary: 消息流、会话、排队和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-04-25T18:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d030910bdb175377f3ed09f8ac9e76b288de03245c7a583343062b76c2e65bd
    source_path: concepts/messages.md
    workflow: 15
---

本页将 OpenClaw 如何处理入站消息、会话、排队、流式传输以及推理可见性串联起来。

## 消息流（高级概览）

```text
入站消息
  -> 路由/绑定 -> 会话键
  -> 队列（如果某次运行处于活动状态）
  -> 智能体运行（流式传输 + 工具）
  -> 出站回复（渠道限制 + 分块）
```

关键调节点位于配置中：

- `messages.*` 用于前缀、排队和群组行为。
- `agents.defaults.*` 用于分块流式传输和分块默认值。
- 渠道覆盖项（`channels.whatsapp.*`、`channels.telegram.*` 等）用于上限和流式传输开关。

完整 schema 请参见 [配置](/zh-CN/gateway/configuration)。

## 入站去重

渠道在重连后可能会重新投递同一条消息。OpenClaw 会维护一个短期缓存，按 渠道/账户/对端/会话/消息 id 建立键，因此重复投递不会再次触发智能体运行。

## 入站防抖

来自**同一发送者**的快速连续消息可以通过 `messages.inbound` 被合并到同一个智能体轮次中。防抖按每个渠道 + 会话范围生效，并使用最近的一条消息来处理回复线程/ID。

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
- 控制命令会绕过防抖，以保持其独立性——**但有一个例外**：当某个渠道显式启用同一发送者私信合并时（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-CN/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），私信命令会在防抖窗口内等待，以便拆分发送的负载能够加入同一个智能体轮次。

## 会话和设备

会话归 Gateway 网关 所有，而不归客户端所有。

- 直接聊天会折叠到智能体主会话键中。
- 群组/渠道会获得各自独立的会话键。
- 会话存储和转录记录位于 Gateway 网关 主机上。

多个设备/渠道可以映射到同一个会话，但历史记录不会完整同步回每个客户端。建议：长对话使用一个主设备，以避免上下文分叉。Control UI 和 TUI 始终显示由 Gateway 网关 支持的会话转录，因此它们是事实来源。

详情请参见：[会话管理](/zh-CN/concepts/session)。

## 工具结果元数据

工具结果中的 `content` 是模型可见的结果。工具结果中的 `details` 是用于 UI 渲染、诊断、媒体投递和插件的运行时元数据。

OpenClaw 明确保持这条边界：

- `toolResult.details` 会在提供商重放和压缩输入前被移除。
- 持久化的会话转录只保留有界的 `details`；超大的元数据会被替换为紧凑摘要，并标记为 `persistedDetailsTruncated: true`。
- 插件和工具应将模型必须读取的文本放在 `content` 中，而不应只放在 `details` 中。

## 入站消息体和历史上下文

OpenClaw 将**提示词正文**与**命令正文**分开：

- `Body`：发送给智能体的提示词文本。这可能包含渠道信封和可选的历史包装器。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧别名（为兼容性保留）。

当某个渠道提供历史记录时，它会使用共享包装器：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非直接聊天**（群组/渠道/房间），**当前消息正文**会加上发送者标签前缀（与历史条目使用相同的样式）。这使实时消息与排队/历史消息在智能体提示词中保持一致。

历史缓冲区是**仅待处理**的：它们包含未触发运行的群组消息（例如，受提及门控的消息），并且**不包含**已经存在于会话转录中的消息。

指令剥离仅应用于**当前消息**部分，因此历史记录会保持完整。包装历史记录的渠道应将 `CommandBody`（或 `RawBody`）设置为原始消息文本，并将 `Body` 保持为合并后的提示词。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认值）以及按渠道覆盖项（例如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`）进行配置（设置为 `0` 可禁用）。

## 排队和后续轮次

如果某次运行已经处于活动状态，入站消息可以排队、导入当前运行，或收集到后续轮次中。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）进行配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，以及 backlog 变体。

详情请参见：[排队](/zh-CN/concepts/queue)。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复。
分块会遵守渠道文本限制，并避免拆分围栏代码块。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲时间的批处理）
- `agents.defaults.humanDelay`（块回复之间类似人类的停顿）
- 渠道覆盖项：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情请参见：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 推理可见性和 token

OpenClaw 可以显示或隐藏模型推理：

- `/reasoning on|off|stream` 用于控制可见性。
- 当模型生成推理内容时，这些内容仍会计入 token 用量。
- Telegram 支持将推理流式传输到草稿气泡中。

详情请参见：[Thinking + 推理指令](/zh-CN/tools/thinking) 和 [Token 使用](/zh-CN/reference/token-use)。

## 前缀、线程和回复

出站消息格式由 `messages` 统一集中管理：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和按渠道默认值处理回复线程

详情请参见：[配置](/zh-CN/gateway/config-agents#messages) 和各渠道文档。

## 静默回复

精确的静默 token `NO_REPLY` / `no_reply` 表示“不要投递用户可见的回复”。
当某个轮次同时还有待发送的工具媒体，例如生成的 TTS 音频时，OpenClaw 会去除静默文本，但仍然投递媒体附件。
OpenClaw 会按会话类型解析这种行为：

- 直接会话默认不允许静默，并会将纯静默回复重写为简短的可见回退文本。
- 群组/渠道默认允许静默。
- 内部编排默认允许静默。

默认值位于 `agents.defaults.silentReply` 和
`agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 和
`surfaces.<id>.silentReplyRewrite` 可以按 surface 覆盖它们。

当父会话中有一个或多个待处理的已生成子智能体运行时，所有 surface 上的纯静默回复都会被丢弃，而不是被重写，这样父级会保持静默，直到子级完成事件投递真实回复。

## 相关内容

- [流式传输](/zh-CN/concepts/streaming) —— 实时消息投递
- [重试](/zh-CN/concepts/retry) —— 消息投递重试行为
- [队列](/zh-CN/concepts/queue) —— 消息处理队列
- [渠道](/zh-CN/channels) —— 消息平台集成
