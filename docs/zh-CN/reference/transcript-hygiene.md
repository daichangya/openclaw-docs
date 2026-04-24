---
read_when:
    - 你正在调试与转录结构相关的提供商请求拒绝问题
    - 你正在更改转录净化或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 id 不匹配问题
summary: 参考：特定于提供商的转录净化和修复规则
title: 转录清理规范
x-i18n:
    generated_at: "2026-04-24T18:11:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6970504736b6a6bf09c6066ecb76e98900d8d0c4181573557ca2d2b8eb526493
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

本文档描述了在一次运行前（构建模型上下文时）应用到转录内容的**特定于提供商的修复**。这些是用于满足严格提供商要求的**内存中**调整。这些清理步骤**不会**重写磁盘上存储的 JSONL 转录；但是，单独的会话文件修复流程可能会在加载会话之前，通过丢弃无效行来重写格式错误的 JSONL 文件。发生修复时，原始文件会在会话文件旁边备份。

范围包括：

- 工具调用 id 净化
- 工具调用输入验证
- 工具结果配对修复
- 回合验证 / 排序
- thought signature 清理
- 图像负载净化
- 用户输入来源标记（用于跨会话路由的提示词）

如果你需要了解转录存储细节，请参见：

- [/reference/session-management-compaction](/zh-CN/reference/session-management-compaction)

---

## 运行位置

所有转录清理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 净化 / 修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些规则。

与转录清理分开，会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 由嵌入式运行器中的 `run/attempt.ts` 和 `compact.ts` 调用

---

## 全局规则：图像净化

图像负载始终会被净化，以防止因大小限制而被提供商拒绝
（对过大的 base64 图像进行缩放 / 重新压缩）。

这也有助于控制支持视觉模型的图像驱动 token 压力。
较低的最大尺寸通常会减少 token 使用量；较高的尺寸则能保留更多细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 图像最大边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。

---

## 全局规则：格式错误的工具调用

如果 assistant 工具调用块同时缺少 `input` 和 `arguments`，则会在构建模型上下文前被丢弃。
这样可以防止提供商因部分持久化的工具调用而拒绝请求（例如在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当一个智能体通过 `sessions_send` 向另一个会话发送提示词时（包括
智能体对智能体的 reply/announce 步骤），OpenClaw 会将创建出的用户回合持久化，并附带：

- `message.provenance.kind = "inter_session"`

该元数据会在转录追加时写入，不会改变角色
（为保证提供商兼容性，`role: "user"` 保持不变）。转录读取器可以利用它来避免将路由的内部提示词视为终端用户编写的指令。

在上下文重建期间，OpenClaw 还会在内存中为这些用户回合加上一个简短的 `[Inter-session message]`
标记，以便模型将它们与外部终端用户指令区分开来。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像净化。
- 对于 OpenAI Responses/Codex 转录，丢弃孤立的 reasoning signature（即后面没有内容块的独立 reasoning 项）。
- 不执行工具调用 id 净化。
- 不执行工具结果配对修复。
- 不执行回合验证或重排。
- 不生成合成工具结果。
- 不移除 thought signature。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 id 净化：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 回合验证（Gemini 风格的回合交替）。
- Google 回合顺序修复（如果历史记录以 assistant 开头，则前置一个很小的用户 bootstrap）。
- Antigravity Claude：规范化 thinking signature；丢弃未签名的 thinking 块。

**Anthropic / Minimax（兼容 Anthropic）**

- 工具结果配对修复和合成工具结果。
- 回合验证（合并连续的用户回合，以满足严格交替要求）。

**Mistral（包括基于 model-id 的检测）**

- 工具调用 id 净化：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- thought signature 清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅图像净化。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 会应用多层转录清理：

- 一个 **transcript-sanitize 扩展** 会在每次构建上下文时运行，并且可以：
  - 修复工具使用 / 结果配对。
  - 净化工具调用 id（包括保留 `_`/`-` 的非严格模式）。
- 运行器还会执行特定于提供商的净化，这造成了重复工作。
- 在提供商策略之外还会发生其他变更，包括：
  - 在持久化前从 assistant 文本中移除 `<final>` 标签。
  - 丢弃空的 assistant 错误回合。
  - 在工具调用之后裁剪 assistant 内容。

这种复杂性导致了跨提供商回归问题（尤其是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 的清理移除了该扩展，将
逻辑集中到运行器中，并使 OpenAI 在图像净化之外保持**不触碰**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)
