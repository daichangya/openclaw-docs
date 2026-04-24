---
read_when:
    - 解释流式传输或分块处理在渠道中的工作方式
    - 更改分块流式传输或渠道分块行为
    - 调试重复或过早的分块回复，或渠道预览流式传输
summary: 流式传输 + 分块行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块处理
x-i18n:
    generated_at: "2026-04-24T22:37:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 544dba171876870ba2608e43bdd9b7a66f446628e18f1c19e72bf491c1d18f6b
    source_path: concepts/streaming.md
    workflow: 15
---

# 流式传输 + 分块处理

OpenClaw 有两个独立的流式传输层：

- **分块流式传输（渠道）：** 在助手写作时，将已完成的 **块** 发出。这些是正常的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新临时的**预览消息**。

目前，渠道消息**没有真正的 token 增量流式传输**。预览流式传输是基于消息的（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的分块发送。

```
模型输出
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker 随缓冲区增长发出块
       └─ (blockStreamingBreak=message_end)
            └─ chunker 在 message_end 时刷新
                   └─ 渠道发送（分块回复）
```

图例：

- `text_delta/events`：模型流事件（对于非流式传输模型，可能较少）。
- `chunker`：应用最小/最大边界和断点偏好的 `EmbeddedBlockChunker`。
- `channel send`：实际发出的出站消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及每账号变体），可按渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并已流式传输的块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行即段落边界拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），会拆分过高的回复以避免 UI 裁剪。

**边界语义：**

- `text_end`：一旦 chunker 发出块就立即流式传输；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲输出。

如果缓冲文本超过 `maxChars`，`message_end` 仍会使用 chunker，因此它可能在结尾发出多个分块。

## 分块算法（低/高边界）

分块处理由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区达到 `minChars` 之前不发出（除非被强制发出）。
- **高边界：** 优先在 `maxChars` 之前切分；如果必须强制切分，则在 `maxChars` 处切分。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬切分。
- **代码围栏：** 绝不在围栏内部切分；如果被迫在 `maxChars` 处切分，则会关闭并重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此你不能超过每个渠道的上限。

## 合并处理（合并已流式传输的块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块**。这样可以减少“单行刷屏”，同时仍然提供渐进式输出。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会刷新。
- `minChars` 会阻止发送过小的片段，直到积累了足够的文本（最终刷新始终会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference` 派生而来（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 使用渠道覆盖（包括每账号配置）。
- 除非被覆盖，Signal/Slack/Discord 的默认合并 `minChars` 会提高到 1500。

## 分块之间更像人类的节奏

启用分块流式传输时，你可以在分块回复之间添加**随机暂停**（首个分块之后）。这会让多气泡回复感觉更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500 ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式发送分块还是一次性全部发送”

这对应于：

- **流式发送分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发出）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **在末尾一次性流式发送全部内容：** `blockStreamingBreak: "message_end"`（刷新一次；如果内容很长，可能仍会分成多个分块）。
- **无分块流式传输：** `blockStreamingDefault: "off"`（仅发送最终回复）。

**渠道说明：** 只有在显式设置
`*.blockStreaming` 为 `true` 时，分块流式传输才会启用。渠道可以在没有分块回复的情况下流式传输实时预览
（`channels.<channel>.streaming`）。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置下。

## 预览流式传输模式

规范键名：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单个预览，用最新文本替换。
- `block`：以分块/追加的方式更新预览。
- `progress`：在生成期间显示进度/状态预览，完成时发送最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | 映射为 `partial` |
| Discord | ✅    | ✅        | ✅      | 映射为 `partial` |
| Slack | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

仅限 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 会切换 Slack 原生流式传输 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态都需要回复线程目标；顶层私信不会显示该类线程式预览。

旧版键迁移：

- Telegram：`streamMode` 和布尔值 `streaming` 会自动迁移为 `streaming` 枚举。
- Discord：`streamMode` 和布尔值 `streaming` 会自动迁移为 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移为 `streaming.mode`；布尔值 `streaming` 会自动迁移为 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移为 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中，使用 `sendMessage` + `editMessageText` 更新预览。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将推理内容写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复载荷会取消待处理的预览，而不会刷新新的草稿，然后使用正常投递。

Slack：

- `partial` 在可用时可使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后发送最终答案。
- 原生预览流式传输和草稿预览流式传输会在该轮抑制分块回复，因此 Slack 回复只会通过一条投递路径进行流式传输。
- 最终媒体/错误载荷和 progress 最终结果不会创建一次性草稿消息；只有可编辑预览的文本/块最终结果才会刷新待处理的草稿文本。

Mattermost：

- 将思考过程、工具活动和部分回复文本流式写入一个草稿预览帖子中，并在最终答案可以安全发送时原地完成该帖子。
- 如果预览帖子已被删除或在最终化时不可用，则回退为发送一个新的最终帖子。
- 最终媒体/错误载荷会在正常投递前取消待处理的预览更新，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 仅媒体、错误和回复目标不匹配的最终结果会在正常投递前取消待处理的预览更新；已经可见的陈旧预览会被撤回。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如“搜索网页”“读取文件”或“调用工具”之类的简短状态行——在工具运行期间，这些内容会显示在同一个预览消息中，并先于最终回复出现。这样可以让多步骤工具轮次在视觉上保持活跃，而不是在首次思考预览和最终答案之间沉默无响应。

支持的界面：

- **Discord**、**Slack** 和 **Telegram** 会将工具进度流式传输到实时预览编辑中。
- **Mattermost** 已经会将工具活动折叠到其单一草稿预览帖子中（见上文）。
- 当预览流式传输为 `off`，或当分块流式传输已接管该消息时，会跳过工具进度编辑。

## 相关内容

- [Messages](/zh-CN/concepts/messages) — 消息生命周期与投递
- [Retry](/zh-CN/concepts/retry) — 投递失败时的重试行为
- [Channels](/zh-CN/channels) — 各渠道的流式传输支持
