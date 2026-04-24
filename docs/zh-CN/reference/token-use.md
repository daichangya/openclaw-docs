---
read_when:
    - 解释 token 使用量、成本或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示词上下文并报告 token 使用量与成本
title: Token 使用量和成本
x-i18n:
    generated_at: "2026-04-24T03:19:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Token 使用量和成本

OpenClaw 跟踪的是 **token**，而不是字符。token 因模型而异，但大多数
OpenAI 风格模型对英文文本平均约为每个 token 4 个字符。

## 系统提示词如何构建

OpenClaw 会在每次运行时组装自己的系统提示词。它包括：

- 工具列表 + 简短描述
- Skills 列表（仅元数据；说明会按需通过 `read` 加载）。
  紧凑的 Skills 块受 `skills.limits.maxSkillsPromptChars` 限制，
  并可在每个智能体上通过
  `agents.list[].skillsLimits.maxSkillsPromptChars` 进行覆盖。
- 自更新说明
- 工作区 + bootstrap 文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、新建时的 `BOOTSTRAP.md`，以及存在时的 `MEMORY.md`）。根目录下的小写 `memory.md` 不会被注入；它是 `openclaw doctor --fix` 在与 `MEMORY.md` 配对时使用的旧版修复输入。大文件会被 `agents.defaults.bootstrapMaxChars` 截断（默认值：12000），而 bootstrap 注入总量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：60000）。`memory/*.md` 每日文件不是常规 bootstrap 提示词的一部分；在普通回合中它们仍通过 memory 工具按需使用，但纯 `/new` 和 `/reset` 可以在该首回合前置一个一次性的启动上下文块，其中包含最近的每日 memory。该启动前导由 `agents.defaults.startupContext` 控制。
- 时间（UTC + 用户时区）
- 回复标签 + heartbeat 行为
- 运行时元数据（主机/操作系统/模型/thinking）

完整分解请参见 [系统提示词](/zh-CN/concepts/system-prompt)。

## 什么会计入上下文窗口

模型接收到的所有内容都会计入上下文限制：

- 系统提示词（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/转录（图片、音频、文件）
- 压缩摘要和裁剪产物
- 提供商包装层或安全头（不可见，但仍会计入）

某些运行时较重的表面还有各自的显式上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

每个智能体的覆盖项位于 `agents.list[].contextLimits` 下。这些旋钮
用于有界的运行时摘录和由运行时注入的自有块。它们
与 bootstrap 限制、启动上下文限制和 Skills 提示词
限制是分开的。

对于图片，OpenClaw 会在调用提供商前，对转录/工具图片负载进行缩放。
使用 `agents.defaults.imageMaxDimensionPx`（默认值：`1200`）来调整此项：

- 较低的值通常会减少视觉 token 使用量和负载大小。
- 较高的值会为 OCR/UI 密集型截图保留更多视觉细节。

如需查看实际分解（按注入文件、工具、Skills 和系统提示词大小），请使用 `/context list` 或 `/context detail`。参见 [上下文](/zh-CN/concepts/context)。

## 如何查看当前 token 使用量

在聊天中使用这些命令：

- `/status` → **富含 emoji 的状态卡片**，显示会话模型、上下文使用量、
  上次响应的输入/输出 token，以及**预估成本**（仅 API 密钥）。
- `/usage off|tokens|full` → 在每条回复后追加一个**按响应计的使用量页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - OAuth 认证**隐藏成本**（仅显示 token）。
- `/usage cost` → 显示 OpenClaw 会话日志中的本地成本摘要。

其他表面：

- **TUI/Web TUI：** 支持 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 会显示
  标准化后的提供商配额窗口（`X% left`，而不是按响应计的成本）。
  当前支持使用窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

使用量表面会在显示前标准化常见的提供商原生字段别名。
对于 OpenAI 家族的 Responses 流量，这包括 `input_tokens` /
`output_tokens` 以及 `prompt_tokens` / `completion_tokens`，因此特定传输的
字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI JSON 使用量也会被标准化：回复文本来自 `response`，并且
`stats.cached` 会映射为 `cacheRead`；当 CLI 未提供显式 `stats.input` 字段时，
会使用 `stats.input_tokens - stats.cached`。
对于原生 OpenAI 家族 Responses 流量，WebSocket/SSE 使用量别名也会以相同方式标准化，并且当
`total_tokens` 缺失或为 `0` 时，总量会回退为标准化后的输入 + 输出。
当当前会话快照较为稀疏时，`/status` 和 `session_status` 还可以
从最近的转录使用日志中恢复 token/cache 计数器和当前活动运行时模型标签。现有的非零实时值仍优先于转录回退值，并且当存储总量缺失或更小时，较大的、偏向提示词的
转录总量可以胜出。
提供商配额窗口的使用量认证在可用时来自提供商特定 Hook；
否则，OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配 OAuth/API 密钥
凭证。
助手转录条目会持久化相同的标准化使用量形状，包括
当活动模型已配置定价且提供商返回使用量元数据时的 `usage.cost`。这为 `/usage cost` 和基于转录的会话
状态提供了一个稳定来源，即使实时运行时状态已经消失。

## 成本估算（显示时）

成本根据你的模型定价配置估算：

```text
models.providers.<provider>.models[].cost
```

这些值是 `input`、`output`、`cacheRead` 和
`cacheWrite` 的**每 100 万 token 的美元价格**。如果缺少定价，OpenClaw 仅显示 token。OAuth token
永不显示美元成本。

## 缓存 TTL 和裁剪影响

提供商提示词缓存仅在缓存 TTL 窗口内适用。OpenClaw 可以
选择性运行**cache-ttl 裁剪**：一旦缓存 TTL
过期，它会裁剪会话，然后重置缓存窗口，以便后续请求可以重用新近缓存的上下文，而不是重新缓存完整历史。这样可以在会话空闲超过 TTL 时降低缓存写入成本。

请在 [Gateway 网关配置](/zh-CN/gateway/configuration) 中进行配置，并在
[会话裁剪](/zh-CN/concepts/session-pruning) 中查看行为细节。

heartbeat 可以在空闲间隔之间保持缓存**温热**。如果你的模型缓存 TTL
为 `1h`，将 heartbeat 间隔设置为略低于该值（例如 `55m`）可以避免
重新缓存完整提示词，从而减少缓存写入成本。

在多智能体设置中，你可以保留一个共享模型配置，并通过 `agents.list[].params.cacheRetention` 为每个智能体单独调整缓存行为。

如需完整的逐项参数指南，请参见 [提示词缓存](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取比输入
token 便宜得多，而缓存写入则按更高倍数计费。最新价格和 TTL 倍数请参见 Anthropic 的
提示词缓存定价：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：使用 heartbeat 保持 1h 缓存温热

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### 示例：带按智能体缓存策略的混合流量

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` 会在所选模型的 `params` 之上合并，因此你可以
仅覆盖 `cacheRetention`，并保持其他模型默认值不变。

### 示例：启用 Anthropic 1M 上下文 beta 请求头

Anthropic 的 1M 上下文窗口目前仍受 beta 门控。OpenClaw 可以在你于受支持的 Opus
或 Sonnet 模型上启用 `context1m` 时，注入所需的
`anthropic-beta` 值。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

这会映射到 Anthropic 的 `context-1m-2025-08-07` beta 请求头。

这仅在该模型条目上设置了 `context1m: true` 时适用。

要求：该凭证必须有资格使用长上下文。如果没有，
Anthropic 会对此请求返回提供商侧的速率限制错误。

如果你使用 OAuth/订阅 token（`sk-ant-oat-*`）认证 Anthropic，
OpenClaw 会跳过 `context-1m-*` beta 请求头，因为 Anthropic 目前
会以 HTTP 401 拒绝这种组合。

## 减少 token 压力的技巧

- 使用 `/compact` 来总结长会话。
- 在你的工作流中裁剪大型工具输出。
- 对截图较多的会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 skill 描述简短（skill 列表会注入到提示词中）。
- 对冗长的探索性工作，优先使用较小的模型。

关于精确的 skill 列表开销公式，请参见 [Skills](/zh-CN/tools/skills)。

## 相关

- [API 使用量和成本](/zh-CN/reference/api-usage-costs)
- [提示词缓存](/zh-CN/reference/prompt-caching)
- [使用量跟踪](/zh-CN/concepts/usage-tracking)
