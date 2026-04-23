---
read_when:
    - 你正在调试与 transcript 结构相关的提供商请求拒绝问题
    - 你正在修改 transcript 清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 id 不匹配问题
summary: 参考：提供商专用的 transcript 清理与修复规则
title: Transcript 清理规则
x-i18n:
    generated_at: "2026-04-23T21:04:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a23a96374a9a8f6613c61b0dceda2e31959357262a147991e16d8025d951f822
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transcript 清理规则（提供商修复）

本文档描述在运行前（构建模型上下文时）应用到 transcript 的**提供商专用修复**。这些都是用于满足严格提供商要求的**内存中**调整。这些清理步骤**不会**重写磁盘上已存储的 JSONL transcript；不过，另有一个独立的会话文件修复过程，可能会在加载会话前通过丢弃无效行来重写格式错误的 JSONL 文件。发生修复时，原始文件会在会话文件旁边保留备份。

范围包括：

- 工具调用 id 清理
- 工具调用输入校验
- 工具结果配对修复
- 轮次校验 / 排序
- 思维签名清理
- 图像负载清理
- 用户输入来源标记（用于跨会话路由提示）

如果你需要 transcript 存储细节，请参见：

- [/reference/session-management-compaction](/zh-CN/reference/session-management-compaction)

---

## 运行位置

所有 transcript 清理逻辑都集中在内嵌运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

策略会根据 `provider`、`modelApi` 和 `modelId` 来决定应用哪些规则。

与 transcript 清理分开的另一件事是：在加载前，如有需要，会先修复会话文件：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从内嵌运行器中的 `run/attempt.ts` 和 `compact.ts` 调用

---

## 全局规则：图像清理

图像负载总是会被清理，以防止因大小
限制导致提供商拒绝请求（对过大的 base64 图像进行缩放/重新压缩）。

这也有助于控制视觉能力模型中的图像驱动 token 压力。
较低的最大尺寸通常能减少 token 使用量；较高的尺寸则能保留更多细节。

实现位置：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认：`1200`）。

---

## 全局规则：格式错误的工具调用

如果 assistant 工具调用块同时缺少 `input` 和 `arguments`，则会在构建
模型上下文前将其丢弃。这可防止提供商因部分持久化的工具调用
而拒绝请求（例如在限流失败之后）。

实现位置：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当某个智能体通过 `sessions_send` 将提示发送到另一个会话时（包括
智能体到智能体的 reply/announce 步骤），OpenClaw 会在 transcript 追加时，将创建的用户轮次持久化为：

- `message.provenance.kind = "inter_session"`

该元数据会在 transcript 追加时写入，并不会改变角色
（为了兼容提供商，仍保持 `role: "user"`）。Transcript 读取器可用
它来避免把内部路由提示当作终端用户编写的指令。

在重建上下文时，OpenClaw 还会在内存中为这些用户轮次预置一个简短的
`[Inter-session message]` 标记，以便模型将其与
外部终端用户指令区分开来。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅进行图像清理。
- 对于 OpenAI Responses/Codex transcript，丢弃孤立的 reasoning 签名（即后面没有跟随内容块的独立 reasoning 条目）。
- 不进行工具调用 id 清理。
- 不进行工具结果配对修复。
- 不进行轮次校验或重排序。
- 不生成合成工具结果。
- 不移除 thought signature。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 id 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次校验（Gemini 风格轮次交替）。
- Google 轮次排序修复（若历史以 assistant 开头，则预置一个极小的用户 bootstrap）。
- Antigravity Claude：规范化 thinking 签名；丢弃未签名的 thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次校验（合并连续的用户轮次，以满足严格交替要求）。

**Mistral（包括基于 model-id 的检测）**

- 工具调用 id 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- Thought signature 清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅进行图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 会应用多层 transcript 清理逻辑：

- 每次构建上下文时都会运行一个 **transcript-sanitize extension**，它可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 id（包括一种会保留下划线/连字符的非严格模式）。
- 运行器本身也会执行提供商专用清理，导致重复工作。
- 在提供商策略之外还会发生其他变更，包括：
  - 在持久化前从 assistant 文本中移除 `<final>` 标签。
  - 丢弃空的 assistant 错误轮次。
  - 在工具调用后裁剪 assistant 内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses`
中的 `call_id|fc_id` 配对问题）。2026.1.22 的清理工作移除了该 extension，将
逻辑集中到运行器中，并使 OpenAI 除图像清理外保持**不触碰**。
