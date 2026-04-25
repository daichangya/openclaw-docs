---
read_when:
    - 解释流式传输或分块处理在渠道中的工作方式
    - 更改分块流式传输或渠道分块处理行为
    - 调试重复或过早的分块回复，或渠道预览流式传输
summary: 流式传输 + 分块处理行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块处理
x-i18n:
    generated_at: "2026-04-25T02:35:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304583beac6f052573e10a633f835db2527d4e83de19dc4a38207fb8c52ee973
    source_path: concepts/streaming.md
    workflow: 15
---

# 流式传输 + 分块处理

OpenClaw 有两个彼此独立的流式传输层：

- **分块流式传输（渠道）：** 在助手写出完整的 **块** 时立即发送。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新一条临时的 **预览消息**。

目前，渠道消息**不支持真正的 token 增量流式传输**。预览流式传输是基于消息的（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的块发送内容。

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

图例：

- `text_delta/events`：模型流事件（对于非流式模型，这些事件可能很少）。
- `chunker`：`EmbeddedBlockChunker`，应用最小/最大边界以及断点偏好。
- `channel send`：实际发出的消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及按账号划分的变体），用于在每个渠道上强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`；`newline` 会先按空行，即段落边界拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），用于拆分过高的回复以避免 UI 裁剪。

**边界语义：**

- `text_end`：只要 chunker 产生块，就立即流式发送；并在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲输出。

即使使用 `message_end`，如果缓冲文本超过 `maxChars`，仍然会使用 chunker，因此可能会在末尾发送多个分块。

## 分块算法（低/高边界）

分块处理由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区达到 `minChars` 之前不发送（除非被强制发送）。
- **高边界：** 优先在 `maxChars` 之前拆分；如果必须强制拆分，则在 `maxChars` 处拆分。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬拆分。
- **代码围栏：** 绝不在围栏内部拆分；如果必须在 `maxChars` 处强制拆分，会先闭合再重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此不能超过每个渠道的上限。

## 聚合（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块**。
这样既能提供渐进式输出，又能减少“单行刷屏”。

- 聚合会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超出时会立即刷新。
- `minChars` 可防止过小的片段过早发送，直到累积足够文本（最终刷新总会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference` 决定（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 进行渠道级覆盖（包括按账号配置）。
- 对于 Signal/Slack/Discord，默认的聚合 `minChars` 会提升到 1500，除非已显式覆盖。

## 块之间更像人类的节奏延迟

启用分块流式传输后，你可以在分块回复之间加入**随机暂停**（第一个块之后）。
这样，多气泡回复会显得更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅作用于**分块回复**，不作用于最终回复或工具摘要。

## “流式发送分块”还是“一次性发送全部”

这对应于：

- **流式发送分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发送）。非 Telegram 渠道还需要设置 `*.blockStreaming: true`。
- **在末尾一次性流式发送全部：** `blockStreamingBreak: "message_end"`（只在结束时刷新一次；如果内容很长，可能仍会拆成多个分块）。
- **不使用分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 分块流式传输默认**关闭，除非**
显式将 `*.blockStreaming` 设为 `true`。渠道仍然可以通过 `channels.<channel>.streaming` 发送实时预览，而不发送分块回复。

配置位置提醒：`blockStreaming*` 默认项位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键名：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单条预览消息，用最新文本替换其内容。
- `block`：以分块/追加的方式更新预览。
- `progress`：在生成期间显示进度/状态预览，完成后发送最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 映射为 `partial` |
| Discord    | ✅    | ✅        | ✅      | 映射为 `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

仅适用于 Slack：

- `channels.slack.streaming.nativeTransport` 在 `channels.slack.streaming.mode="partial"` 时切换是否使用 Slack 原生流式 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态都需要一个回复线程目标；顶层私信不会显示这种线程式预览。

旧键迁移：

- Telegram：`streamMode` 和布尔值 `streaming` 会自动迁移为 `streaming` 枚举。
- Discord：`streamMode` 和布尔值 `streaming` 会自动迁移为 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移为 `streaming.mode`；布尔值 `streaming` 会自动迁移为 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移为 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信、群组和话题中，使用 `sendMessage` + `editMessageText` 更新预览。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将推理内容写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，会跳过预览流式传输。
- 最终媒体、错误以及显式回复载荷会取消待处理的预览，而不会刷新出新的草稿，然后再使用正常投递。

Slack：

- `partial` 在可用时可以使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后发送最终答案。
- 原生预览流式传输和草稿预览流式传输会在该轮中抑制分块回复，因此 Slack 回复只会通过一种投递路径进行流式传输。
- 最终媒体/错误载荷和 `progress` 最终结果不会创建一次性的草稿消息；只有可编辑预览的文本/块最终结果，才会刷新待处理的草稿文本。

Mattermost：

- 将思考、工具活动和部分回复文本流式写入同一个草稿预览帖子，并在最终答案可以安全发送时原地完成。
- 如果预览帖子已被删除或在最终完成时不可用，则回退为发送一条新的最终帖子。
- 最终媒体/错误载荷会在正常投递前取消待处理的预览更新，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 仅媒体、错误以及回复目标不匹配的最终结果会在正常投递前取消待处理的预览更新；如果已有可见的陈旧预览，则会将其隐藏。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如“正在搜索网页”“正在读取文件”或“正在调用工具”之类的简短状态行——在工具运行期间，这些内容会显示在同一条预览消息中，先于最终回复出现。这样可以让多步骤工具轮次在视觉上保持活跃，而不是在首次思考预览与最终答案之间一片沉默。

支持的界面：

- **Discord** 和 **Slack** 默认会将工具进度流式写入实时预览编辑。
- **Telegram** 仅在显式启用 `streaming.preview.toolProgress` 时，才会将工具进度流式写入实时预览编辑。
- **Mattermost** 已经将工具活动合并进其单一草稿预览帖子中（见上文）。
- 工具进度编辑遵循当前启用的预览流式传输模式；当预览流式传输为 `off`，或消息已由分块流式传输接管时，这些更新会被跳过。

## 相关内容

- [Messages](/zh-CN/concepts/messages) —— 消息生命周期与投递
- [Retry](/zh-CN/concepts/retry) —— 投递失败时的重试行为
- [Channels](/zh-CN/channels) —— 各渠道的流式传输支持
