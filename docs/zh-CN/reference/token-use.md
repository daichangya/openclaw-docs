---
read_when:
    - 解释 token 使用量、成本或上下文窗口
    - 调试上下文增长或压缩总结行为
summary: OpenClaw 如何构建提示词上下文并报告 token 使用量与成本
title: Token 使用量与成本
x-i18n:
    generated_at: "2026-04-23T21:04:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb107da9a479da2c0da057221d296e2bfb76d075a35ae2f677be006b4e266659
    source_path: reference/token-use.md
    workflow: 15
---

# Token 使用量与成本

OpenClaw 跟踪的是 **tokens**，而不是字符。不同模型的 token 划分方式不同，但大多数
OpenAI 风格模型对英文文本的平均值约为每个 token 4 个字符。

## 系统提示词是如何构建的

OpenClaw 会在每次运行时组装自己的系统提示词。它包括：

- 工具列表 + 简短描述
- Skills 列表（仅元数据；说明会在需要时通过 `read` 按需加载）。
  紧凑 Skills 区块受 `skills.limits.maxSkillsPromptChars`
  限制，并支持在每个智能体上通过
  `agents.list[].skillsLimits.maxSkillsPromptChars` 进行覆盖。
- 自更新说明
- 工作区 + bootstrap 文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、在新建时包含的 `BOOTSTRAP.md`，以及存在时的 `MEMORY.md`）。小写根目录 `memory.md` 不会被注入；它仅作为 `openclaw doctor --fix` 的旧版修复输入，并且会与 `MEMORY.md` 配对使用。大文件会按 `agents.defaults.bootstrapMaxChars`（默认：12000）进行截断，而 bootstrap 总注入量受 `agents.defaults.bootstrapTotalMaxChars`（默认：60000）限制。`memory/*.md` 每日文件不是常规 bootstrap 提示词的一部分；在普通轮次中，它们仍通过 memory 工具按需访问，但裸 `/new` 和 `/reset` 可以为第一轮预先附加一个一次性的启动上下文区块，其中包含最近的每日 memory。该启动前导由 `agents.defaults.startupContext` 控制。
- 时间（UTC + 用户时区）
- 回复标签 + heartbeat 行为
- 运行时元数据（主机/操作系统/模型/thinking）

完整拆分请参见 [系统提示词](/zh-CN/concepts/system-prompt)。

## 哪些内容会计入上下文窗口

模型接收到的所有内容都会计入上下文限制：

- 系统提示词（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/转录（图像、音频、文件）
- 压缩总结摘要和裁剪产物
- 提供商包装层或安全 headers（不可见，但仍会计数）

某些运行时较重的表面还有各自的显式限制：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

每个智能体的覆盖项位于 `agents.list[].contextLimits` 下。这些开关
用于受限的运行时摘录和由运行时注入的区块。它们与 bootstrap 限制、启动上下文限制以及 Skills 提示词限制相互独立。

对于图像，OpenClaw 会在调用提供商之前先对转录/工具图像载荷进行下采样。
使用 `agents.defaults.imageMaxDimensionPx`（默认：`1200`）来调整：

- 较低的值通常会减少 vision-token 使用量和载荷大小。
- 较高的值可为 OCR/UI 密集型截图保留更多视觉细节。

如需查看实际拆分（按每个注入文件、工具、Skills 和系统提示词大小），请使用 `/context list` 或 `/context detail`。参见 [上下文](/zh-CN/concepts/context)。

## 如何查看当前 token 使用量

可在聊天中使用以下命令：

- `/status` → **带丰富 emoji 的状态卡片**，显示会话模型、上下文使用量、
  上一次响应的输入/输出 tokens，以及**估算成本**（仅 API 密钥）。
- `/usage off|tokens|full` → 在每次回复后追加**按响应统计的使用量页脚**。
  - 会按会话持久化（存储为 `responseUsage`）。
  - OAuth 认证**会隐藏成本**（只显示 tokens）。
- `/usage cost` → 显示来自 OpenClaw 会话日志的本地成本摘要。

其他表面：

- **TUI/Web TUI：** 支持 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 会显示
  规范化后的提供商配额窗口（`X% left`，而不是按响应成本）。
  当前支持使用窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

使用量表面会在显示前规范化常见的提供商原生字段别名。
对于 OpenAI 家族的 Responses 流量，这包括 `input_tokens` /
`output_tokens` 以及 `prompt_tokens` / `completion_tokens`，因此不同传输的字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI 的 JSON 使用量也会被规范化：回复文本来自 `response`，并且
`stats.cached` 会映射到 `cacheRead`；当 CLI 未显式提供 `stats.input` 字段时，会使用 `stats.input_tokens - stats.cached`。
对于原生 OpenAI 家族 Responses 流量，WebSocket/SSE 的使用量别名也会以相同方式规范化，并且当 `total_tokens` 缺失或为 `0` 时，总量会回退到规范化后的输入 + 输出。
当当前会话快照信息稀疏时，`/status` 和 `session_status` 还可以
从最近的转录使用日志中恢复 token/cache 计数和当前运行时模型标签。现有的非零实时值仍优先于转录回退值，而在已存储总量缺失或更小时，更大的、面向提示词的转录总量可以胜出。
提供商配额窗口的使用量认证在可用时来自提供商特定 hooks；
否则，OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配 OAuth/API 密钥凭证。
助手转录条目会持久化相同的规范化使用量形状，包括
当活动模型已配置价格且提供商返回使用量元数据时的 `usage.cost`。这使得 `/usage cost` 和基于转录的会话
状态即使在实时运行状态消失后，仍有稳定的数据来源。

## 成本估算（在显示时）

成本是根据你的模型价格配置估算的：

```
models.providers.<provider>.models[].cost
```

这些值表示 **每 1M tokens 的美元价格**，分别对应 `input`、`output`、`cacheRead` 和
`cacheWrite`。如果缺少价格配置，OpenClaw 只显示 tokens。OAuth 令牌
永远不会显示美元成本。

## 缓存 TTL 与裁剪影响

提供商提示词缓存仅在缓存 TTL 窗口内生效。OpenClaw 可以
选择运行 **cache-ttl pruning**：一旦缓存 TTL
过期，它会裁剪会话，然后重置缓存窗口，使后续请求能够复用刚刚缓存的新上下文，而不是重新缓存完整历史。这可以在会话空闲超过 TTL 后，降低 cache
write 成本。

请在 [Gateway 网关配置](/zh-CN/gateway/configuration) 中进行配置，并在
[会话裁剪](/zh-CN/concepts/session-pruning) 中查看详细行为说明。

Heartbeat 可以让缓存在空闲间隔期间**保持热状态**。如果你的模型缓存 TTL
是 `1h`，将 heartbeat 间隔设置为略低于该值（例如 `55m`）即可避免
重新缓存完整提示词，从而降低 cache write 成本。

在多智能体设置中，你可以保留一个共享模型配置，并通过 `agents.list[].params.cacheRetention` 为每个智能体单独调整缓存行为。

完整的逐项参数指南请参见 [提示词缓存](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，cache read 比输入
tokens 便宜得多，而 cache write 则按更高倍数计费。最新费率和 TTL 倍数请参见 Anthropic 的
提示词缓存定价文档：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：使用 heartbeat 保持 1h 缓存热状态

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

### 示例：混合流量与按智能体的缓存策略

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
        every: "55m" # 让深度会话的长缓存保持热状态
    - id: "alerts"
      params:
        cacheRetention: "none" # 对突发通知避免 cache write
```

`agents.list[].params` 会叠加合并到所选模型的 `params` 之上，因此你可以
只覆盖 `cacheRetention`，而让其他模型默认值保持不变。

### 示例：启用 Anthropic 1M 上下文 beta header

Anthropic 的 1M 上下文窗口当前仍受 beta 门控。OpenClaw 可以在支持的 Opus
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

这会映射为 Anthropic 的 `context-1m-2025-08-07` beta header。

仅当该模型条目设置了 `context1m: true` 时才会生效。

要求：该凭证必须具备长上下文使用资格。否则，
Anthropic 会对该请求返回提供商侧的速率限制错误。

如果你使用 OAuth/订阅令牌（`sk-ant-oat-*`）认证 Anthropic，
OpenClaw 会跳过 `context-1m-*` beta header，因为 Anthropic 当前
会以 HTTP 401 拒绝这种组合。

## 降低 token 压力的技巧

- 使用 `/compact` 对长会话进行压缩总结。
- 在你的工作流中裁剪大型工具输出。
- 对截图较多的会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 skill 描述简短（skill 列表会被注入到提示词中）。
- 对冗长、探索型工作优先使用较小模型。

关于精确的 skill 列表开销公式，请参见 [Skills](/zh-CN/tools/skills)。
