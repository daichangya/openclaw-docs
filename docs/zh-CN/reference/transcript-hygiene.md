---
read_when:
    - 你正在调试与转录结构相关的提供商请求拒绝问题
    - 你正在更改转录清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 ID 不匹配问题
summary: 参考：提供商特定的转录清理和修复规则
title: 转录清理规范
x-i18n:
    generated_at: "2026-04-24T21:20:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb9b8ea55b34810609d65433fa3be1558dd7c59bf4b33e66dfab3fdbd5a211ef
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

本文档描述了在一次运行前（构建模型上下文时）应用于转录的**提供商特定修复**。这些是用于满足严格提供商要求的**内存中**调整。这些清理步骤**不会**重写磁盘上存储的 JSONL 转录；不过，单独的会话文件修复流程可能会在加载会话前通过丢弃无效行来重写格式错误的 JSONL 文件。发生修复时，原始文件会与会话文件一起备份。

范围包括：

- 仅运行时的提示词上下文，不进入用户可见的转录轮次
- 工具调用 ID 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证 / 排序
- 思考签名清理
- 图像载荷清理
- 用户输入来源标记（用于跨会话路由的提示词）

如果你需要了解转录存储细节，请参阅：

- [/reference/session-management-compaction](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录

运行时 / 系统上下文可以被添加到某一轮的模型提示词中，但它不是终端用户撰写的内容。OpenClaw 会为 Gateway 网关回复、排队的后续操作、ACP、CLI 以及嵌入式 Pi 运行保留一个独立的面向转录的提示词正文。存储的可见用户轮次使用该转录正文，而不是经过运行时增强的提示词。

对于已经持久化了运行时包装内容的旧版会话，Gateway 网关历史记录界面会在将消息返回给 WebChat、TUI、REST 或 SSE 客户端之前应用显示投影。

---

## 运行位置

所有转录清理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理 / 修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些规则。

与转录清理分开的是，会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像载荷始终会被清理，以防止因大小限制导致提供商侧拒绝请求（对过大的 base64 图像进行缩放 / 重新压缩）。

这也有助于控制支持视觉能力的模型因图像导致的 token 压力。较低的最大尺寸通常会减少 token 使用量；较高的尺寸则会保留更多细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。

---

## 全局规则：格式错误的工具调用

缺少 `input` 和 `arguments` 的助手工具调用块会在构建模型上下文之前被丢弃。这样可以防止提供商因部分已持久化的工具调用而拒绝请求（例如，在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当一个智能体通过 `sessions_send` 将提示词发送到另一个会话时（包括智能体到智能体的回复 / 通知步骤），OpenClaw 会在创建的用户轮次中持久化以下字段：

- `message.provenance.kind = "inter_session"`

此元数据会在追加到转录时写入，不会更改角色
（为保证提供商兼容性，仍保持 `role: "user"`）。转录读取器可以利用这一点，避免将路由的内部提示词视为终端用户撰写的指令。

在重建上下文期间，OpenClaw 还会在内存中为这些用户轮次添加一个简短的 `[Inter-session message]` 标记作为前缀，以便模型能够将它们与外部终端用户指令区分开来。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅进行图像清理。
- 对于 OpenAI Responses / Codex 转录，丢弃孤立的推理签名（后面没有内容块的独立推理项）。
- 不进行工具调用 ID 清理。
- 不进行工具结果配对修复。
- 不进行轮次验证或重排序。
- 不生成合成工具结果。
- 不剥离思考签名。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格的轮次交替）。
- Google 轮次顺序修复（如果历史记录以助手开头，则预置一个极小的用户引导消息）。
- Antigravity Claude：规范化思考签名；丢弃未签名的思考块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续的用户轮次以满足严格交替要求）。

**Mistral（包括基于模型 ID 的检测）**

- 工具调用 ID 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- 思考签名清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅进行图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层转录清理：

- 一个 **transcript-sanitize extension** 会在每次构建上下文时运行，并且可以：
  - 修复工具使用 / 结果配对。
  - 清理工具调用 ID（包括保留 `_` / `-` 的非严格模式）。
- 运行器也会执行提供商特定清理，这造成了重复工作。
- 提供商策略之外还会发生其他变更，包括：
  - 在持久化之前从助手文本中剥离 `<final>` 标签。
  - 丢弃空的助手错误轮次。
  - 在工具调用之后裁剪助手内容。

这种复杂性导致了跨提供商回归问题（特别是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 的清理工作移除了该扩展，将逻辑集中到运行器中，并让 OpenAI 除图像清理之外保持**不触碰**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
