---
read_when:
    - 解释渠道上的流式传输或分块处理如何工作
    - 更改分块流式传输或渠道分块处理行为
    - 调试重复或过早的分块回复，或渠道预览流式传输
summary: 流式传输 + 分块处理行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块处理
x-i18n:
    generated_at: "2026-04-26T22:47:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7143421c98e8f4523e0f63653965ab0f63364d83f1073a6752385712551ec818
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw 有两个独立的流式传输层：

- **分块流式传输（渠道）：** 在助手写入时发送已完成的**块**。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新一条临时的**预览消息**。

目前**没有真正的 token 增量流式传输**到渠道消息。预览流式传输是基于消息的（发送 + 编辑/追加）。

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

- `text_delta/events`：模型流事件（对于非流式传输模型，可能较少）。
- `chunker`：`EmbeddedBlockChunker`，应用最小/最大边界 + 断点偏好。
- `channel send`：实际发送出去的消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及按账户区分的变体），用于按渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并流式传输的块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行〈段落边界〉切分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），用于拆分过高的回复以避免 UI 裁切。

**边界语义：**

- `text_end`：只要 chunker 产生块就立即流式发送；每次 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲的输出。

如果缓冲文本超过 `maxChars`，`message_end` 仍然会使用 chunker，因此它可能在结束时发出多个块。

### 分块流式传输中的媒体发送

`MEDIA:` 指令是普通的发送元数据。当分块流式传输提前发送一个媒体块时，OpenClaw 会为该轮对话记住这次发送。如果最终的助手负载重复了相同的媒体 URL，最终发送会去掉重复的媒体，而不是再次发送附件。

完全重复的最终负载会被抑制。如果最终负载在已流式发送过的媒体周围新增了不同文本，OpenClaw 仍会发送这些新文本，同时保持媒体只发送一次。这可以防止在 Telegram 等渠道上出现重复的语音笔记或文件；例如当智能体在流式传输期间输出 `MEDIA:`，而提供商也在完成回复中包含它时。

## 分块算法（低/高边界）

分块处理由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区达到 `minChars` 之前不发送（除非被强制发送）。
- **高边界：** 尽量在 `maxChars` 之前切分；如果被强制切分，则在 `maxChars` 处切分。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬切分。
- **代码围栏：** 绝不在围栏内部切分；当必须在 `maxChars` 处强制切分时，会关闭并重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制为渠道的 `textChunkLimit`，因此不能超过每个渠道的上限。

## 合并（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块**。这样可以减少“单行刷屏”，同时仍然提供渐进式输出。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超出时会刷新。
- `minChars` 会阻止过小的片段被发送，直到积累足够文本（最终刷新总会发送剩余文本）。
- 连接符取决于 `blockStreamingChunk.breakPreference`
  （`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 提供渠道覆盖（包括按账户配置）。
- 对于 Signal/Slack/Discord，默认的合并 `minChars` 会提升到 1500，除非另有覆盖。

## 块之间更像人类的节奏

启用分块流式传输时，你可以在分块回复之间加入**随机暂停**（首个块之后）。这会让多气泡回复看起来更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500 毫秒）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式分块”还是“最后一次性发出全部”

这对应到：

- **流式分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发送）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **最后一次性流式发出全部：** `blockStreamingBreak: "message_end"`（只在最后刷新一次；如果内容很长，可能仍分成多个块）。
- **不使用分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 只有在显式设置
`*.blockStreaming` 为 `true` 时，分块流式传输才会开启。渠道可以在没有分块回复的情况下，仍然流式显示实时预览
（`channels.<channel>.streaming`）。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键名：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单个预览，用最新文本替换。
- `block`：预览以分块/追加的方式更新。
- `progress`：生成期间显示进度/状态预览，完成时发送最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 映射为 `partial` |
| Discord    | ✅    | ✅        | ✅      | 映射为 `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

仅 Slack：

- `channels.slack.streaming.nativeTransport` 在 `channels.slack.streaming.mode="partial"` 时切换 Slack 原生流式 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态都需要一个回复线程目标；顶层私信不会显示这种线程式预览。

旧键迁移：

- Telegram：会通过 doctor/配置兼容路径检测并迁移旧版 `streamMode` 和标量/布尔型 `streaming` 值到 `streaming.mode`。
- Discord：`streamMode` + 布尔型 `streaming` 会自动迁移到 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔型 `streaming` 会自动迁移到 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中使用 `sendMessage` + `editMessageText` 更新预览。
- 当预览已显示约一分钟时，会发送一条新的最终消息，而不是原地编辑，然后清理预览，以便 Telegram 的时间戳能反映回复完成时间。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将推理内容写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复负载会取消待处理的预览，而不会刷新新的草稿，然后使用正常发送。

Slack：

- `partial` 可在可用时使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后发送最终答案。
- 原生和草稿预览流式传输会抑制该轮对话的分块回复，因此一条 Slack 回复只会通过一种发送路径流式传输。
- 最终媒体/错误负载和进度模式的最终结果不会创建临时草稿消息；只有能够编辑预览的文本/块最终结果才会刷新待处理的草稿文本。

Mattermost：

- 将思考、工具活动和部分回复文本流式写入单个草稿预览帖子，并在最终答案可以安全发送时原地完成。
- 如果预览帖子已被删除或在完成时不可用，则回退为发送一条新的最终帖子。
- 最终媒体/错误负载会先取消待处理的预览更新，再进行正常发送，而不是刷新一条临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 仅媒体、错误以及回复目标不匹配的最终结果会在正常发送前取消待处理的预览更新；如果已有可见的陈旧预览，则会将其隐藏。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如“正在搜索网页”“正在读取文件”或“正在调用工具”之类的简短状态行——这些内容会在工具运行期间显示在同一条预览消息中，先于最终回复出现。这样可以让多步骤工具回合在视觉上保持活跃，而不是在首次思考预览和最终答案之间沉默。

支持的界面：

- **Discord**、**Slack** 和 **Telegram** 在预览流式传输处于活动状态时，默认会把工具进度流式写入实时预览编辑中。
- Telegram 自 `v2026.4.22` 起已启用工具进度预览更新；保持启用可维持该已发布行为。
- **Mattermost** 已经将工具活动合并进其单一草稿预览帖子中（见上文）。
- 工具进度编辑遵循当前的预览流式传输模式；当预览流式传输为 `off`，或消息已由分块流式传输接管时，会跳过这些编辑。
- 若要保留预览流式传输但隐藏工具进度行，请将该渠道的 `streaming.preview.toolProgress` 设为 `false`。若要完全禁用预览编辑，请将 `streaming.mode` 设为 `off`。

示例：

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## 相关内容

- [消息](/zh-CN/concepts/messages) —— 消息生命周期与发送
- [重试](/zh-CN/concepts/retry) —— 发送失败时的重试行为
- [渠道](/zh-CN/channels) —— 各渠道的流式传输支持
