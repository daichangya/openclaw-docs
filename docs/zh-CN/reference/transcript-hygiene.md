---
read_when:
    - 你正在调试与转录形状相关的提供商请求拒绝问题
    - 你正在更改转录清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 id 不匹配问题
summary: 参考：提供商特定的转录清理与修复规则
title: 转录卫生规范
x-i18n:
    generated_at: "2026-04-23T06:43:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# 转录卫生规范（提供商修正规则）

本文档描述了在一次运行之前对转录应用的**提供商特定修复**
（构建模型上下文时）。这些是用于满足严格
提供商要求的**内存中**调整。这些卫生步骤**不会**重写磁盘上存储的 JSONL 转录；
不过，在会话加载前，一个单独的会话文件修复流程可能会通过丢弃无效行来重写格式错误的 JSONL 文件。
发生修复时，原始文件会与会话文件一起进行备份。

范围包括：

- 工具调用 id 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证 / 排序
- 思维签名清理
- 图像负载清理
- 用户输入来源标记（用于跨会话路由的提示）

如果你需要了解转录存储细节，请参见：

- [/reference/session-management-compaction](/zh-CN/reference/session-management-compaction)

---

## 运行位置

所有转录卫生逻辑都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些规则。

与转录卫生分开的是，会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 由 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像负载始终会被清理，以防止因尺寸
限制而被提供商拒绝（对超大的 base64 图像进行缩放/重新压缩）。

这也有助于控制支持视觉模型时由图像驱动的 token 压力。
较低的最大尺寸通常会减少 token 使用量；较高的尺寸则能保留更多细节。

实现位置：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。

---

## 全局规则：格式错误的工具调用

缺少 `input` 和 `arguments` 的 assistant 工具调用块会在构建
模型上下文前被丢弃。这可防止提供商因部分持久化的工具调用
而拒绝请求（例如在速率限制失败之后）。

实现位置：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当一个智能体通过 `sessions_send` 向另一个会话发送提示时（包括
智能体到智能体的回复/公告步骤），OpenClaw 会将创建出的用户轮次持久化为：

- `message.provenance.kind = "inter_session"`

此元数据在追加到转录时写入，不会改变角色
（为了兼容提供商，仍保持 `role: "user"`）。转录读取器可以利用
这一点，避免将路由的内部提示视为终端用户编写的指令。

在重建上下文期间，OpenClaw 还会在内存中为这些用户轮次前置一个简短的 `[Inter-session message]`
标记，以便模型将其与
外部终端用户指令区分开来。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对于 OpenAI Responses/Codex 转录，丢弃孤立的 reasoning 签名（即后面没有跟随内容块的独立 reasoning 项）。
- 不进行工具调用 id 清理。
- 不进行工具结果配对修复。
- 不进行轮次验证或重新排序。
- 不注入合成工具结果。
- 不移除 thought 签名。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 id 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格的轮次交替）。
- Google 轮次顺序修复（如果历史记录以 assistant 开始，则前置一个很小的用户引导消息）。
- Antigravity Claude：规范化 thinking 签名；丢弃未签名的 thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续的用户轮次，以满足严格交替要求）。

**Mistral（包括基于 model id 的检测）**

- 工具调用 id 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- thought 签名清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有提供商**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 发布之前，OpenClaw 应用了多层转录卫生处理：

- 每次构建上下文时都会运行一个 **transcript-sanitize 扩展**，它可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 id（包括保留 `_`/`-` 的非严格模式）。
- 运行器也会执行提供商特定清理，这造成了重复工作。
- 在提供商策略之外还存在额外变更，包括：
  - 在持久化前从 assistant 文本中移除 `<final>` 标签。
  - 丢弃空的 assistant 错误轮次。
  - 在工具调用后裁剪 assistant 内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 的清理工作移除了该扩展，将
逻辑集中到运行器中，并让 OpenAI 除图像清理之外保持**不做额外处理**。
