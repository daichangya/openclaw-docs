---
read_when:
    - 你正在调试与转录形状相关的提供商请求拒绝问题
    - 你正在修改转录清理或工具调用修复逻辑
    - 你正在调查不同提供商之间的工具调用 ID 不匹配问题
summary: 参考：提供商特定的转录清理与修复规则
title: 转录清理规范
x-i18n:
    generated_at: "2026-04-27T06:06:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e8da725fd493ecaa0a1114085684c22ed35144ff65408c963f9868fc976fc17
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

OpenClaw 会在运行前（构建模型上下文时）对转录应用**提供商特定修复**。这些修复大多是用于满足严格 provider 要求的**内存中**调整。另有一个独立的会话文件修复过程，也可能在加载会话前重写已存储的 JSONL：要么丢弃格式错误的 JSONL 行，要么修复那些语法上有效、但已知在
provider 重放期间会被拒绝的持久化轮次。发生修复时，原始文件会在
会话文件旁边生成备份。

范围包括：

- 仅运行时的提示上下文，不进入用户可见的转录轮次
- 工具调用 ID 清理
- 工具调用输入校验
- 工具结果配对修复
- 轮次校验 / 排序
- thought signature 清理
- thinking signature 清理
- 图像负载清理
- 用户输入来源标记（用于跨会话路由的提示）
- 用于 Bedrock Converse 重放的空 assistant 错误轮次修复

如果你需要了解转录存储细节，请参见：

- [会话管理深入解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录

运行时 / 系统上下文可以被添加到某一轮的模型提示中，但它不是
最终用户编写的内容。OpenClaw 会为 Gateway 网关回复、排队的后续消息、ACP、CLI 和嵌入式 Pi 运行保留一个独立的、面向转录的
提示正文。存储的可见用户轮次会使用该
转录正文，而不是带有运行时增强的提示。

对于已经持久化了运行时包装的旧会话，
Gateway 网关历史界面会在将消息返回给 WebChat、
TUI、REST 或 SSE 客户端之前应用显示投影。

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

图像负载始终会被清理，以防止因大小
限制而导致 provider 侧拒绝（对过大的 base64 图像进行缩放 / 重压缩）。

这也有助于控制支持视觉的模型中的图像驱动 token 压力。
较小的最大尺寸通常会减少 token 使用量；较大的尺寸则能保留更多细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认：`1200`）。

---

## 全局规则：格式错误的工具调用

缺少 `input` 和 `arguments` 两者的 assistant 工具调用块
会在构建模型上下文前被丢弃。这样可以防止 provider 因部分持久化的工具调用而拒绝请求（例如在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当一个智能体通过 `sessions_send` 将提示发送到另一个会话时（包括
智能体对智能体的 reply / announce 步骤），OpenClaw 会将创建的用户轮次持久化，并附带：

- `message.provenance.kind = "inter_session"`

该元数据会在追加转录时写入，不会改变角色
（出于 provider 兼容性考虑，仍保持 `role: "user"`）。转录读取器可以利用这一点，
避免将被路由的内部提示视为最终用户编写的指令。

在重建上下文期间，OpenClaw 还会在内存中为这些用户轮次加上一个简短的 `[Inter-session message]`
标记前缀，这样模型就能将它们与
外部最终用户指令区分开来。

---

## provider 矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对于 OpenAI Responses / Codex 转录，丢弃孤立的推理签名（后面没有内容块的独立推理项），并在模型路由切换后丢弃可重放的 OpenAI 推理。
- 不进行工具调用 ID 清理。
- 工具结果配对修复可能会移动真实匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次校验或重排序。
- 缺失的 OpenAI Responses 系列工具输出会被合成为 `aborted`，以匹配 Codex 重放规范化。
- 不剥离 thought signature。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次校验（Gemini 风格的轮次交替）。
- Google 轮次顺序修复（如果历史记录以 assistant 开头，则前置一个极小的用户引导消息）。
- Antigravity Claude：规范化 thinking signatures；丢弃未签名的 thinking 块。

**Anthropic / MiniMax（兼容 Anthropic）**

- 工具结果配对修复和合成工具结果。
- 轮次校验（合并连续的 user 轮次，以满足严格的交替要求）。
- 缺少、为空或仅为空白重放签名的 thinking 块会在
  provider 转换前被剥离。如果这会导致 assistant 轮次为空，OpenClaw 会保留
  轮次形状，并填入非空的 omitted-reasoning 文本。
- 必须被剥离的较旧的仅 thinking assistant 轮次会被替换为
  非空的 omitted-reasoning 文本，这样 provider 适配器就不会丢弃该重放轮次。

**Amazon Bedrock Mantle（Converse API）**

- 空的 assistant 流错误轮次会在重放前修复为非空的回退文本块。Bedrock Converse 会拒绝 `content: []` 的 assistant 消息，因此
  带有 `stopReason: "error"` 且内容为空的持久化 assistant 轮次也会在加载前于磁盘上修复。
- 缺少、为空或仅为空白重放签名的 Claude thinking 块
  会在 Converse 重放前被剥离。如果这会导致 assistant 轮次为空，OpenClaw 会保留
  轮次形状，并填入非空的 omitted-reasoning 文本。
- 必须被剥离的较旧的仅 thinking assistant 轮次会被替换为
  非空的 omitted-reasoning 文本，这样 Converse 重放就能保持严格的轮次形状。
- 重放会过滤 OpenClaw 发送镜像和 Gateway 网关注入的 assistant 轮次。
- 图像清理通过全局规则生效。

**Mistral（包括基于 model-id 的检测）**

- 工具调用 ID 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- thought signature 清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 会应用多层转录清理：

- 一个 **transcript-sanitize extension** 会在每次构建上下文时运行，并且可以：
  - 修复工具使用 / 结果配对。
  - 清理工具调用 ID（包括一种保留 `_` / `-` 的非严格模式）。
- 运行器也会执行 provider 特定清理，这造成了重复工作。
- provider 策略之外还会发生其他变更，包括：
  - 在持久化前从 assistant 文本中剥离 `<final>` 标签。
  - 丢弃空的 assistant 错误轮次。
  - 在工具调用后裁剪 assistant 内容。

这种复杂性导致了跨 provider 回归（尤其是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 的清理工作移除了该扩展，将
逻辑集中到运行器中，并让 OpenAI 除图像清理之外保持**不触碰**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)
