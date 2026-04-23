---
read_when:
    - 解释 token 使用量、成本或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示上下文，以及如何报告 token 使用量 + 成本
title: Token 使用量和成本
x-i18n:
    generated_at: "2026-04-23T15:44:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2fa145e161d69a61612690a951675cfff8fd9e6e159cb3bc931b1846654a8b
    source_path: reference/token-use.md
    workflow: 15
---

# Token 使用量与成本

OpenClaw 跟踪的是 **token**，而不是字符。Token 因模型而异，但大多数 OpenAI 风格模型对英文文本的平均值约为每个 token 对应 4 个字符。

## 系统提示如何构建

OpenClaw 会在每次运行时组装自己的系统提示。它包括：

- 工具列表 + 简短描述
- Skills 列表（仅元数据；说明会按需通过 `read` 加载）。
  紧凑的 Skills 区块受 `skills.limits.maxSkillsPromptChars` 限制，
  并可通过
  `agents.list[].skillsLimits.maxSkillsPromptChars`
  为每个智能体单独覆盖。
- 自我更新说明
- 工作区 + 启动文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、新的 `BOOTSTRAP.md`，以及存在时的 `MEMORY.md`）。根目录小写的 `memory.md` 不会被注入；它是 `openclaw doctor --fix` 在与 `MEMORY.md` 配对时使用的旧版修复输入。大文件会被 `agents.defaults.bootstrapMaxChars` 截断（默认值：12000），而启动文件总注入量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：60000）。`memory/*.md` 每日文件不属于常规启动提示的一部分；在普通轮次中，它们仍通过 memory 工具按需使用，但纯 `/new` 和 `/reset` 可以在首轮前附加一个一次性的启动上下文区块，其中包含最近的每日 memory。该启动前导内容由 `agents.defaults.startupContext` 控制。
- 时间（UTC + 用户时区）
- 回复标签 + heartbeat 行为
- 运行时元数据（主机 / OS / 模型 / thinking）

完整拆解请参见 [System Prompt](/zh-CN/concepts/system-prompt)。

## 什么会计入上下文窗口

模型接收到的所有内容都会计入上下文限制：

- 系统提示（上面列出的所有部分）
- 对话历史（用户消息 + 助手消息）
- 工具调用和工具结果
- 附件 / 转录内容（图片、音频、文件）
- 压缩摘要和裁剪产物
- 提供商包装层或安全头（不可见，但仍会计入）

某些运行时负载较重的部分有各自明确的上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

每个智能体的覆盖项位于 `agents.list[].contextLimits` 下。这些旋钮用于限制有界运行时摘录和由运行时注入的区块。它们与启动文件限制、启动上下文限制以及 Skills 提示限制是分开的。

对于图像，OpenClaw 会在调用提供商之前对转录内容 / 工具图像负载进行缩放。
使用 `agents.defaults.imageMaxDimensionPx`（默认值：`1200`）可对此进行调整：

- 较低的值通常会减少视觉 token 使用量和负载大小。
- 较高的值会保留更多视觉细节，适合 OCR / UI 密集型截图。

如需查看实际拆解（按注入文件、工具、Skills 和系统提示大小），请使用 `/context list` 或 `/context detail`。参见 [Context](/zh-CN/concepts/context)。

## 如何查看当前 token 使用量

在聊天中使用以下命令：

- `/status` → **富含 emoji 的状态卡片**，显示会话模型、上下文使用情况、
  上次回复的输入 / 输出 token，以及**预估成本**（仅 API key）。
- `/usage off|tokens|full` → 在每条回复后附加**逐回复使用量页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - OAuth 认证**隐藏成本**（仅显示 token）。
- `/usage cost` → 根据 OpenClaw 会话日志显示本地成本摘要。

其他界面：

- **TUI / Web TUI：** 支持 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 会显示
  标准化后的提供商配额窗口（`剩余 X%`，而不是逐回复成本）。
  当前支持使用量窗口的提供商包括：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

使用量界面在显示前会标准化常见的提供商原生字段别名。
对于 OpenAI 系列的 Responses 流量，这包括 `input_tokens` /
`output_tokens` 以及 `prompt_tokens` / `completion_tokens`，因此传输层特定
字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI 的 JSON 使用量也会被标准化：回复文本来自 `response`，而
`stats.cached` 会映射到 `cacheRead`；当 CLI 未显式提供 `stats.input` 字段时，
会使用 `stats.input_tokens - stats.cached`。
对于原生 OpenAI 系列 Responses 流量，WebSocket / SSE 的使用量别名也会以相同方式标准化，并且当
`total_tokens` 缺失或为 `0` 时，总量会回退到标准化后的输入 + 输出。
当当前会话快照信息较少时，`/status` 和 `session_status` 还可以
从最近的转录内容使用量日志中恢复 token / cache 计数器以及当前运行时模型标签。
现有的非零实时值仍优先于转录内容回退值，而当存储的总量缺失或更小时，
较大的、以提示为导向的转录内容总量可以胜出。
提供商配额窗口的使用量认证优先来自提供商特定钩子；如果不可用，OpenClaw 会回退为从认证配置、环境变量或配置中匹配 OAuth / API-key 凭证。
助手转录条目会持久化相同的标准化使用量结构，包括当活动模型已配置定价且提供商返回使用量元数据时的
`usage.cost`。这为 `/usage cost` 和基于转录内容的会话状态提供了稳定的数据来源，即使实时运行时状态已不存在。

## 成本估算（显示时）

成本是根据你的模型定价配置估算的：

```text
models.providers.<provider>.models[].cost
```

这些值表示 `input`、`output`、`cacheRead` 和
`cacheWrite` 的**每 100 万 token 的美元价格**。如果缺少定价，OpenClaw 只显示 token。OAuth token
永远不会显示美元成本。

## Cache TTL 与裁剪的影响

提供商提示缓存仅在缓存 TTL 窗口内生效。OpenClaw 可以
选择运行**cache-ttl pruning**：当缓存 TTL
到期后，它会裁剪会话，然后重置缓存窗口，这样后续请求可以复用新缓存的上下文，而不是重新缓存完整历史。这可以在会话空闲超过 TTL 后降低缓存写入成本。

可在 [Gateway 配置](/zh-CN/gateway/configuration) 中进行配置，行为细节请参见 [Session pruning](/zh-CN/concepts/session-pruning)。

Heartbeat 可以在空闲间隔期间保持缓存**温热**。如果你的模型缓存 TTL
为 `1h`，将 heartbeat 间隔设置为略低于该值（例如 `55m`）可以避免重新缓存完整提示，从而降低缓存写入成本。

在多智能体设置中，你可以保留一个共享的模型配置，并通过
`agents.list[].params.cacheRetention`
为每个智能体单独调整缓存行为。

如需逐项旋钮的完整指南，请参见 [Prompt Caching](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取明显比输入
token 更便宜，而缓存写入则按更高倍数计费。最新费率和 TTL 倍率请参见 Anthropic 的提示缓存定价：
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

### 示例：混合流量与按智能体区分的缓存策略

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 大多数智能体的默认基线
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 为深度会话保持长缓存温热
    - id: "alerts"
      params:
        cacheRetention: "none" # 对突发通知避免缓存写入
```

`agents.list[].params` 会合并到所选模型的 `params` 之上，因此你可以
只覆盖 `cacheRetention`，而其他模型默认值保持不变。

### 示例：启用 Anthropic 1M 上下文 beta header

Anthropic 的 1M 上下文窗口当前仍受 beta 限制。OpenClaw 可以在你于受支持的 Opus
或 Sonnet 模型上启用 `context1m` 时注入所需的
`anthropic-beta` 值。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

这会映射到 Anthropic 的 `context-1m-2025-08-07` beta header。

这仅在该模型条目上设置 `context1m: true` 时适用。

要求：该凭证必须具备长上下文使用资格。否则，
Anthropic 会对此请求返回提供商侧的速率限制错误。

如果你使用 OAuth / 订阅 token（`sk-ant-oat-*`）对 Anthropic 进行认证，
OpenClaw 会跳过 `context-1m-*` beta header，因为 Anthropic 目前
会以 HTTP 401 拒绝这种组合。

## 减少 token 压力的建议

- 使用 `/compact` 来总结长会话。
- 在工作流中裁剪大型工具输出。
- 对截图密集型会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 skill 描述简短（skill 列表会被注入提示）。
- 对冗长、探索性工作优先使用较小模型。

关于精确的 skill 列表开销公式，请参见 [Skills](/zh-CN/tools/skills)。
