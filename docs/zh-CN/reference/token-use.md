---
read_when:
    - 解释令牌使用量、成本或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示上下文并报告令牌使用量 + 成本
title: 令牌使用量和成本
x-i18n:
    generated_at: "2026-04-21T02:12:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# 令牌使用量与成本

OpenClaw 跟踪的是 **令牌**，不是字符。令牌是特定于模型的，但大多数 OpenAI 风格的模型对英文文本的平均换算约为每个令牌 ~4 个字符。

## 系统提示是如何构建的

OpenClaw 会在每次运行时组装自己的系统提示。它包括：

- 工具列表 + 简短说明
- Skills 列表（仅包含元数据；说明会按需通过 `read` 加载）。
  紧凑的 Skills 块受 `skills.limits.maxSkillsPromptChars` 限制，
  并可在每个智能体级别通过
  `agents.list[].skillsLimits.maxSkillsPromptChars` 进行覆盖。
- 自我更新说明
- 工作区 + 引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`（新建时），以及存在时的 `MEMORY.md` 或作为小写回退的 `memory.md`）。大文件会被 `agents.defaults.bootstrapMaxChars` 截断（默认值：12000），引导注入总量则受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：60000）。`memory/*.md` 的每日文件不属于常规引导提示的一部分；在普通轮次中，它们仍通过记忆工具按需访问，但裸 `/new` 和 `/reset` 可以在首轮前附加一个一次性的启动上下文块，其中包含最近的每日记忆。该启动前导由 `agents.defaults.startupContext` 控制。
- 时间（UTC + 用户时区）
- 回复标签 + 心跳行为
- 运行时元数据（主机 / OS / 模型 / 思考）

完整拆解见[系统提示](/zh-CN/concepts/system-prompt)。

## 哪些内容会计入上下文窗口

模型接收到的所有内容都会计入上下文限制：

- 系统提示（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件 / 转录内容（图片、音频、文件）
- 压缩摘要和裁剪产物
- 提供商包装层或安全头（不可见，但仍会计入）

某些运行时负载较重的部分有各自明确的上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

每个智能体的覆盖值位于 `agents.list[].contextLimits` 下。这些调节项
用于受限的运行时摘录和由运行时注入、归运行时所有的块。它们
与引导限制、启动上下文限制以及 Skills 提示限制彼此独立。

对于图像，OpenClaw 会在调用提供商之前缩小转录 / 工具图像负载。
使用 `agents.defaults.imageMaxDimensionPx`（默认值：`1200`）进行调节：

- 较低的值通常会减少视觉令牌使用量和负载大小。
- 较高的值会保留更多视觉细节，适合 OCR / UI 内容较重的截图。

如需查看实用拆解（按注入文件、工具、Skills 和系统提示大小划分），请使用 `/context list` 或 `/context detail`。见[上下文](/zh-CN/concepts/context)。

## 如何查看当前令牌使用量

在聊天中使用以下命令：

- `/status` → **富含表情符号的状态卡片**，显示当前会话模型、上下文使用量、
  最近一次响应的输入 / 输出令牌，以及**预估成本**（仅 API 密钥）。
- `/usage off|tokens|full` → 为每条回复附加一个**按响应统计的使用情况页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - OAuth 认证**会隐藏成本**（仅显示令牌）。
- `/usage cost` → 显示来自 OpenClaw 会话日志的本地成本摘要。

其他界面：

- **TUI / Web TUI：** 支持 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 会显示
  标准化后的提供商配额窗口（`剩余 X%`，而不是按响应成本）。
  当前支持使用量窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

使用量界面在显示前会标准化常见的提供商原生字段别名。
对于 OpenAI 系列的 Responses 流量，这包括 `input_tokens` /
`output_tokens` 以及 `prompt_tokens` / `completion_tokens`，因此传输层特定的
字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI JSON 使用量也会被标准化：回复文本来自 `response`，并且
`stats.cached` 会映射到 `cacheRead`，当 CLI 未提供显式的 `stats.input` 字段时，
会使用 `stats.input_tokens - stats.cached`。
对于原生 OpenAI 系列 Responses 流量，WebSocket / SSE 使用量别名也会以同样方式标准化，
并且当 `total_tokens` 缺失或为 `0` 时，总量会回退为标准化后的输入 + 输出。
当当前会话快照信息较少时，`/status` 和 `session_status` 还可以
从最近的转录使用日志中恢复令牌 / 缓存计数器以及活动运行时模型标签。
现有的非零实时值仍优先于转录回退值，而当存储总量缺失或更小时，
更大的、偏提示侧的转录总量可以胜出。
提供商配额窗口的使用量认证在可用时来自提供商特定钩子；否则 OpenClaw 会回退为匹配
认证配置、环境变量或配置中的 OAuth / API 密钥凭证。
助手转录条目会持久化相同的标准化使用量结构，包括
当活动模型配置了定价且提供商返回了使用量元数据时的 `usage.cost`。
这为 `/usage cost` 和基于转录的会话状态提供了稳定的数据来源，即使实时运行时状态已经消失。

## 成本估算（显示时）

成本根据你的模型定价配置进行估算：

```
models.providers.<provider>.models[].cost
```

这些值表示 `input`、`output`、`cacheRead` 和
`cacheWrite` 的**每 100 万令牌的美元价格**。如果缺少定价信息，OpenClaw 只显示令牌。OAuth 令牌
永远不会显示美元成本。

## 缓存 TTL 和裁剪的影响

提供商提示缓存仅在缓存 TTL 窗口内生效。OpenClaw 可以
选择性运行**缓存 TTL 裁剪**：当缓存 TTL
过期后，它会裁剪会话，然后重置缓存窗口，这样后续请求就可以复用
刚重新缓存的上下文，而不是再次缓存完整历史记录。这能在会话闲置超过 TTL 时
降低缓存写入成本。

在[Gateway 网关配置](/zh-CN/gateway/configuration)中进行配置，并在[会话裁剪](/zh-CN/concepts/session-pruning)中查看
行为细节。

心跳可以在空闲间隔期间保持缓存**温热**。如果你的模型缓存 TTL
是 `1h`，将心跳间隔设置为略短于该值（例如 `55m`）可以避免
重新缓存完整提示，从而降低缓存写入成本。

在多智能体设置中，你可以保留一个共享模型配置，并通过
`agents.list[].params.cacheRetention` 为每个智能体单独调整缓存行为。

如需逐项参数的完整指南，见[提示缓存](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取明显比输入
令牌便宜，而缓存写入则按更高倍数计费。最新费率和 TTL 倍率
请参阅 Anthropic 的提示缓存定价：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：使用心跳保持 1h 缓存温热

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

### 示例：按智能体缓存策略处理混合流量

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
只覆盖 `cacheRetention`，并保持其他模型默认值不变。

### 示例：启用 Anthropic 1M 上下文 beta 标头

Anthropic 的 1M 上下文窗口目前受 beta 限制。OpenClaw 可以在你为支持的 Opus
或 Sonnet 模型启用 `context1m` 时，注入所需的
`anthropic-beta` 值。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

这会映射到 Anthropic 的 `context-1m-2025-08-07` beta 标头。

这仅在该模型条目上设置了 `context1m: true` 时生效。

要求：凭证必须有资格使用长上下文。如果没有，
Anthropic 会对此请求返回提供商侧限流错误。

如果你使用 OAuth / 订阅令牌（`sk-ant-oat-*`）认证 Anthropic，
OpenClaw 会跳过 `context-1m-*` beta 标头，因为 Anthropic 当前
会以 HTTP 401 拒绝这种组合。

## 减少令牌压力的提示

- 使用 `/compact` 总结长会话。
- 在你的工作流中裁剪大型工具输出。
- 对截图较多的会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 Skills 描述简短（Skills 列表会被注入到提示中）。
- 对冗长、探索性工作优先使用更小的模型。

Skills 列表开销的精确计算公式见[Skills](/zh-CN/tools/skills)。
