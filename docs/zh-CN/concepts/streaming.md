---
read_when:
    - 解释流式传输或分块在渠道上的工作方式
    - 更改分块流式传输或渠道分块行为
    - 调试重复/过早的块回复或渠道预览流式传输
summary: 流式传输 + 分块行为（块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块
x-i18n:
    generated_at: "2026-04-23T20:47:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# 流式传输 + 分块

OpenClaw 有两个彼此独立的流式传输层：

- **分块流式传输（渠道）**：在助手写出完整**块**时立即发出。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）**：在生成期间更新一条临时**预览消息**。

当前不会向渠道消息提供**真正的 token 增量流式传输**。预览流式传输是基于消息的（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的块发送。

```
模型输出
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker 随着缓冲增长发出块
       └─ (blockStreamingBreak=message_end)
            └─ chunker 在 message_end 时刷新
                   └─ 渠道发送（块回复）
```

图例：

- `text_delta/events`：模型流事件（对于非流式模型可能较稀疏）。
- `chunker`：应用最小/最大边界 + 断点偏好的 `EmbeddedBlockChunker`。
- `channel send`：实际的出站消息（块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及按账户变体），可为每个渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行即段落边界拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17）会拆分过高回复，以避免 UI 截断。

**边界语义：**

- `text_end`：只要 chunker 发出块就立即流出；并在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成，然后再刷新缓冲输出。

当缓冲文本超过 `maxChars` 时，`message_end` 仍会使用 chunker，因此它可以在结尾发出多个块。

## 分块算法（低/高边界）

分块流式传输由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区达到 `minChars` 之前不发出（除非被强制）。
- **高边界：** 优先在 `maxChars` 之前拆分；若必须强制拆分，则在 `maxChars` 处分割。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬断点。
- **代码围栏：** 绝不在围栏内部拆分；如果必须在 `maxChars` 处强制拆分，则会先闭合再重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制在渠道的 `textChunkLimit` 之内，因此不会超过每个渠道的上限。

## 聚合（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的块分片**。这样可以减少“单行刷屏”，同时仍保留渐进式输出。

- 聚合会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会立即刷新。
- `minChars` 可防止在文本积累足够之前发送很小的碎片（最终刷新总会发送剩余文本）。
- 连接符派生自 `blockStreamingChunk.breakPreference`
  （`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 渠道覆盖可通过 `*.blockStreamingCoalesce` 使用（包括按账户配置）。
- 除非另有覆盖，Signal/Slack/Discord 的默认聚合 `minChars` 会提升到 1500。

## 块之间的类人节奏

启用分块流式传输时，你可以在块回复之间添加**随机暂停**（第一块之后）。这会让多气泡回复显得更自然。

- 配置：`agents.defaults.humanDelay`（也可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**块回复**，不适用于最终回复或工具摘要。

## “流式输出分块”还是“最后一次性输出”

这对应于：

- **流式输出分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发出）。非 Telegram 渠道还需要设置 `*.blockStreaming: true`。
- **最后一次性流式输出：** `blockStreamingBreak: "message_end"`（最后统一刷新；如果内容很长，可能仍分成多个块）。
- **不使用分块流式传输：** `blockStreamingDefault: "off"`（仅发送最终回复）。

**渠道说明：** 只有在显式设置
`*.blockStreaming: true` 时，分块流式传输才会启用。渠道可以在没有块回复的情况下流式显示实时预览（`channels.<channel>.streaming`）。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单条预览消息，用最新文本替换。
- `block`：以分块/追加方式更新预览。
- `progress`：在生成期间显示进度/状态预览，完成后给出最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅ | ✅ | ✅ | 映射到 `partial` |
| Discord | ✅ | ✅ | ✅ | 映射到 `partial` |
| Slack | ✅ | ✅ | ✅ | ✅ |
| Mattermost | ✅ | ✅ | ✅ | ✅ |

仅限 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 会切换 Slack 原生流式 API 调用（默认：`true`）。
- Slack 原生流式传输以及 Slack 助手线程状态都需要一个回复线程目标；顶层私信不会显示这种线程式预览。

旧键迁移：

- Telegram：`streamMode` + 布尔 `streaming` 会自动迁移为枚举 `streaming`。
- Discord：`streamMode` + 布尔 `streaming` 会自动迁移为枚举 `streaming`。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔 `streaming` 会自动迁移到 `streaming.mode` + `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中使用 `sendMessage` + `editMessageText` 更新预览。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将 reasoning 写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复载荷会取消待处理预览，而不会刷新出新的草稿，然后使用正常投递。

Slack：

- 当可用时，`partial` 可使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后给出最终答案。
- 最终媒体/错误载荷和 progress 最终结果不会创建一次性的草稿消息；只有能够编辑预览的文本/块最终结果才会刷新待处理草稿文本。

Mattermost：

- 将 thinking、工具活动和部分回复文本流式写入单条草稿预览帖子，并在最终答案可安全发送时原地完成。
- 如果预览帖子已被删除或在完成时不可用，则会回退为发送一条新的最终帖子。
- 最终媒体/错误载荷会在正常投递前取消待处理预览更新，而不是刷新一条临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 仅媒体、错误以及回复目标不匹配的最终结果，会在正常投递前取消待处理预览更新；若已有一个可见的陈旧预览，则会将其撤回。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如 “searching the web”、“reading file” 或 “calling tool” 这样的简短状态行——它们会在工具运行期间出现在同一条预览消息中，早于最终回复。这让多步骤工具轮次在视觉上保持活跃，而不是在最初的 thinking 预览和最终答案之间保持沉默。

支持的界面：

- **Discord**、**Slack** 和 **Telegram** 会将工具进度流式写入实时预览编辑中。
- **Mattermost** 已经将工具活动折叠到其单条草稿预览帖子中（见上文）。
- 工具进度编辑会遵循当前启用的预览流式传输模式；当预览流式传输为 `off`，或分块流式传输已接管该消息时，会跳过这些更新。

## 相关内容

- [消息](/zh-CN/concepts/messages) — 消息生命周期与投递
- [重试](/zh-CN/concepts/retry) — 投递失败时的重试行为
- [渠道](/zh-CN/channels) — 各渠道的流式传输支持
