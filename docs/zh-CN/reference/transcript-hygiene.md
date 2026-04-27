---
read_when:
    - 你正在调试与转录结构相关的提供商请求拒绝问题
    - 你正在更改转录清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 ID 不匹配问题
summary: 参考：提供商特定的转录清理与修复规则
title: 转录清理规范
x-i18n:
    generated_at: "2026-04-27T07:30:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2836499f6860b0d21a954355850b5a1b89abfc6887df0343a64c12a6be251d29
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

OpenClaw 会在运行前（构建模型上下文时）对转录应用**提供商特定的修复**。其中大多数是**仅在内存中**进行的调整，用于满足严格的提供商要求。单独的会话文件修复流程也可能在加载会话之前重写已存储的 JSONL：要么丢弃格式错误的 JSONL 行，要么修复那些语法有效但已知会在提供商重放期间被拒绝的持久化轮次。发生修复时，原始文件会在会话文件旁边备份。

范围包括：

- 仅运行时的提示上下文，不进入用户可见的转录轮次
- 工具调用 ID 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证 / 排序
- 思考签名清理
- Thinking 签名清理
- 图像负载清理
- 用户输入来源标记（用于跨会话路由的提示）
- Bedrock Converse 重放时的空 assistant 错误轮次修复

如果你需要转录存储细节，请参阅：

- [会话管理深度解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录

运行时 / system 上下文可以被添加到某一轮的模型提示中，但它不是最终用户编写的内容。OpenClaw 会为 Gateway 网关回复、排队的后续操作、ACP、CLI 和嵌入式 Pi 运行保留一个面向转录的独立提示正文。已存储的可见用户轮次使用该转录正文，而不是运行时增强后的提示。

对于已经持久化了运行时包装器的旧会话，Gateway 网关历史记录界面会在将消息返回给 WebChat、TUI、REST 或 SSE 客户端之前应用显示投影。

---

## 运行位置

所有转录清理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理 / 修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些规则。

与转录清理分开的是：会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像负载始终会被清理，以防止因大小限制而被提供商侧拒绝（对过大的 base64 图像进行缩放 / 重新压缩）。

这也有助于控制由图像驱动的 token 压力，适用于支持视觉能力的模型。较小的最大尺寸通常会减少 token 使用；较大的尺寸则能保留更多细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。

---

## 全局规则：格式错误的工具调用

缺少 `input` 和 `arguments` 两者的 assistant 工具调用块会在构建模型上下文之前被丢弃。这可以防止提供商因部分持久化的工具调用而拒绝请求（例如在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当一个智能体通过 `sessions_send` 将提示发送到另一个会话时（包括智能体到智能体的回复 / 通知步骤），OpenClaw 会在持久化创建的用户轮次时写入：

- `message.provenance.kind = "inter_session"`

此元数据在追加到转录时写入，不会改变角色
（为保持提供商兼容性，仍然是 `role: "user"`）。转录读取器可以利用这一点，避免将路由过来的内部提示当作最终用户编写的指令处理。

在上下文重建期间，OpenClaw 还会在内存中为这些用户轮次添加一个简短的 `[Inter-session message]` 标记作为前缀，以便模型能够将它们与外部最终用户指令区分开来。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅进行图像清理。
- 对于 OpenAI Responses / Codex 转录，丢弃孤立的 reasoning 签名（后面没有内容块的独立 reasoning 项）；在模型路由切换后丢弃可重放的 OpenAI reasoning。
- 不进行工具调用 ID 清理。
- 工具结果配对修复可能会移动真实匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次验证或重排序。
- 会为缺失的 OpenAI Responses 系列工具输出合成 `aborted`，以匹配 Codex 重放规范化。
- 不移除 thought 签名。

**OpenAI-compatible Gemma 4**

- 在重放前移除历史 assistant thinking / reasoning 块，这样本地 OpenAI-compatible Gemma 4 服务器就不会接收到前几轮的 reasoning 内容。
- 当前同轮次的工具调用续接会保留附着在工具调用上的 assistant reasoning 块，直到工具结果被重放完毕。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格轮次交替）。
- Google 轮次顺序修复（如果历史以 assistant 开始，则预置一个极小的 user 引导消息）。
- Antigravity Claude：规范化 thinking 签名；丢弃未签名的 thinking 块。

**Anthropic / Minimax（Anthropic-compatible）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续的 user 轮次，以满足严格交替要求）。
- 在转换为提供商格式之前，会移除缺失、为空或仅为空白的重放签名的 thinking 块。如果这会导致 assistant 轮次为空，OpenClaw 会使用非空的省略推理文本来保持轮次结构。
- 必须移除的旧式仅 thinking 的 assistant 轮次，会被替换为非空的省略推理文本，以避免提供商适配器丢弃该重放轮次。

**Amazon Bedrock（Converse API）**

- 在重放前，将空的 assistant 流错误轮次修复为非空的后备文本块。Bedrock Converse 会拒绝 `content: []` 的 assistant 消息，因此带有 `stopReason: "error"` 且内容为空的持久化 assistant 轮次，也会在加载前于磁盘上修复。
- 在 Converse 重放前，会移除缺失、为空或仅为空白的重放签名的 Claude thinking 块。如果这会导致 assistant 轮次为空，OpenClaw 会使用非空的省略推理文本来保持轮次结构。
- 必须移除的旧式仅 thinking 的 assistant 轮次，会被替换为非空的省略推理文本，以便 Converse 重放保持严格的轮次结构。
- 重放会过滤掉 OpenClaw 投递镜像和 Gateway 网关注入的 assistant 轮次。
- 图像清理通过全局规则应用。

**Mistral（包括基于 model-id 的检测）**

- 工具调用 ID 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- Thought 签名清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅进行图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层转录清理：

- 一个 **transcript-sanitize extension** 会在每次构建上下文时运行，并且可以：
  - 修复工具使用 / 结果配对。
  - 清理工具调用 ID（包括会保留 `_` / `-` 的非严格模式）。
- 运行器也会执行提供商特定的清理，导致工作重复。
- 提供商策略之外还存在额外变更，包括：
  - 在持久化前从 assistant 文本中移除 `<final>` 标签。
  - 丢弃空的 assistant 错误轮次。
  - 在工具调用后裁剪 assistant 内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 的清理工作移除了该扩展，将逻辑集中到运行器中，并使 OpenAI 除图像清理外变为**不触碰**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)
