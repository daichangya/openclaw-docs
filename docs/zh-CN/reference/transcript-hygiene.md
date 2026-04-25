---
read_when:
    - 你正在调试与转录结构相关的提供商请求拒绝问题
    - 你正在更改转录清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 id 不匹配问题
summary: 参考：提供商特定的转录清理与修复规则
title: 转录清理规范
x-i18n:
    generated_at: "2026-04-25T02:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b4ce42332ec62a75bb1ad60574c462ef81297471add4588cf9286543e1ce104
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

本文档说明在运行前（构建模型上下文时）对转录应用的**提供商特定修复**。这些是用于满足严格提供商要求的**内存中**调整。这些清理步骤**不会**重写磁盘上存储的 JSONL 转录；不过，单独的会话文件修复流程可能会在加载会话前通过丢弃无效行来重写格式错误的 JSONL 文件。发生修复时，原始文件会在会话文件旁边备份。

范围包括：

- 仅运行时的提示上下文，不进入用户可见的转录轮次
- 工具调用 id 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证 / 排序
- thought signature 清理
- 图像负载清理
- 用户输入来源标记（用于跨会话路由的提示）

如果你需要了解转录存储细节，请参见：

- [/reference/session-management-compaction](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录

运行时/系统上下文可以添加到某一轮的模型提示中，但它不是最终用户编写的内容。OpenClaw 会为 Gateway 网关回复、排队后续步骤、ACP、CLI 以及嵌入式 Pi 运行保留一个独立的、面向转录的提示正文。存储的可见用户轮次会使用该转录正文，而不是经过运行时增强的提示。

对于已经持久化了运行时包装器的旧会话，Gateway 网关历史记录界面会在将消息返回给 WebChat、TUI、REST 或 SSE 客户端之前应用显示投影。

---

## 运行位置

所有转录清理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些规则。

与转录清理分开的是，会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像负载始终会被清理，以防止因大小限制而导致提供商侧拒绝
（对过大的 base64 图像进行缩放/重新压缩）。

这也有助于控制支持视觉的模型中由图像驱动的 token 压力。
较低的最大尺寸通常会减少 token 使用量；较高的尺寸则能保留更多细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。

---

## 全局规则：格式错误的工具调用

缺少 `input` 和 `arguments` 的 assistant 工具调用块会在构建模型上下文前被丢弃。

这可以防止提供商因部分持久化的工具调用而拒绝请求（例如在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当一个智能体通过 `sessions_send` 将提示发送到另一个会话时（包括
智能体到智能体的回复/公告步骤），OpenClaw 会将创建的用户轮次持久化并附带：

- `message.provenance.kind = "inter_session"`

此元数据会在追加到转录时写入，并且不会改变角色
（出于提供商兼容性，仍保持 `role: "user"`）。转录读取器可以使用它来避免将内部路由提示视为最终用户编写的指令。

在重建上下文期间，OpenClaw 还会在内存中为这些用户轮次前置一个简短的 `[Inter-session message]`
标记，以便模型将其与外部最终用户指令区分开来。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅进行图像清理。
- 对于 OpenAI Responses/Codex 转录，丢弃孤立的 reasoning signature（即后面没有内容块的独立 reasoning 项），并在模型路由切换后丢弃可重放的 OpenAI reasoning。
- 不进行工具调用 id 清理。
- 不进行工具结果配对修复。
- 不进行轮次验证或重排。
- 不生成合成工具结果。
- 不移除 thought signature。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 id 清理：严格字母数字格式。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格的轮次交替）。
- Google 轮次排序修复（如果历史记录以 assistant 开始，则前置一个极小的用户 bootstrap）。
- Antigravity Claude：归一化 thinking signature；丢弃未签名的 thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续的 user 轮次，以满足严格交替要求）。

**Mistral（包括基于模型 id 的检测）**

- 工具调用 id 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- thought signature 清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有提供商**

- 仅进行图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层转录清理：

- 每次构建上下文时都会运行一个 **transcript-sanitize 扩展**，它可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 id（包括一种会保留 `_`/`-` 的非严格模式）。
- 运行器还会执行提供商特定清理，造成重复处理。
- 在提供商策略之外还会发生额外变更，包括：
  - 在持久化前从 assistant 文本中移除 `<final>` 标签。
  - 丢弃空的 assistant 错误轮次。
  - 在工具调用后裁剪 assistant 内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses`
`call_id|fc_id` 配对问题）。2026.1.22 的清理工作移除了该扩展，将逻辑集中到运行器中，并让 OpenAI 除图像清理外保持**不做处理**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)
