---
read_when:
    - 你希望通过缓存保留来降低提示词 token 成本
    - 你需要在多智能体设置中为每个智能体分别控制缓存行为
    - 你正在同时调优 heartbeat 和 cache-ttl 修剪行为
summary: 提示缓存控制项、合并顺序、提供商行为与调优模式
title: 提示缓存
x-i18n:
    generated_at: "2026-04-24T03:18:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

提示缓存意味着模型提供商可以在多轮对话之间复用未变化的提示前缀（通常是 system / developer 指令及其他稳定上下文），而不是每次都重新处理。只要上游 API 直接暴露这些计数器，OpenClaw 就会将提供商的用量统一规范为 `cacheRead` 和 `cacheWrite`。

当实时会话快照缺少缓存计数器时，状态界面还可以从最近的 transcript 用量日志中恢复这些计数器，因此 `/status` 即使在部分会话元数据丢失后，仍可继续显示缓存行。现有的非零实时缓存值仍然优先于 transcript 回退值。

这很重要的原因是：更低的 token 成本、更快的响应速度，以及更可预测的长时会话性能。没有缓存时，即使大部分输入没有变化，重复提示在每一轮仍要支付完整的提示成本。

本页涵盖所有会影响提示复用和 token 成本的缓存相关控制项。

提供商参考：

- Anthropic 提示缓存：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 提示缓存：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 标头与请求 ID：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 请求 ID 与错误：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要控制项

### `cacheRetention`（全局默认、模型级和按智能体设置）

将缓存保留设置为适用于所有模型的全局默认值：

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

按模型覆盖：

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

按智能体覆盖：

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

配置合并顺序：

1. `agents.defaults.params`（全局默认值——适用于所有模型）
2. `agents.defaults.models["provider/model"].params`（按模型覆盖）
3. `agents.list[].params`（匹配的智能体 id；按键覆盖）

### `contextPruning.mode: "cache-ttl"`

在缓存 TTL 窗口之后修剪旧的工具结果上下文，这样空闲后的请求就不会重新缓存过大的历史记录。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为请参见 [Session Pruning](/zh-CN/concepts/session-pruning)。

### Heartbeat 保温

Heartbeat 可以让缓存窗口保持“温热”，并减少空闲间隔后的重复缓存写入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

也支持在 `agents.list[].heartbeat` 上按智能体设置 heartbeat。

## 提供商行为

### Anthropic（直连 API）

- 支持 `cacheRetention`。
- 使用 Anthropic API 密钥 auth 配置文件时，如果未设置，OpenClaw 会为 Anthropic 模型引用预设 `cacheRetention: "short"`。
- 原生 Anthropic Messages 响应同时暴露 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以同时显示 `cacheRead` 和 `cacheWrite`。
- 对于原生 Anthropic 请求，`cacheRetention: "short"` 会映射到默认的 5 分钟临时缓存，而 `cacheRetention: "long"` 只会在直连 `api.anthropic.com` 主机时升级为 1 小时 TTL。

### OpenAI（直连 API）

- 在受支持的较新模型上，提示缓存是自动启用的。OpenClaw 不需要注入块级缓存标记。
- OpenClaw 使用 `prompt_cache_key` 来保持多轮之间的缓存路由稳定，并且仅在直连 OpenAI 主机上选择 `cacheRetention: "long"` 时使用 `prompt_cache_retention: "24h"`。
- OpenAI 通过 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件中的 `input_tokens_details.cached_tokens`）暴露缓存的提示 token。OpenClaw 会将其映射为 `cacheRead`。
- OpenAI 不会暴露单独的缓存写入 token 计数器，因此即使提供商正在预热缓存，OpenAI 路径上的 `cacheWrite` 也始终保持为 `0`。
- OpenAI 会返回有用的追踪与限流标头，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但缓存命中统计应来自用量负载，而不是标头。
- 在实践中，OpenAI 往往更像是初始前缀缓存，而不是 Anthropic 式的移动式完整历史复用。在当前的实时探测中，稳定的长前缀文本轮次通常会停留在接近 `4864` 缓存 token 的平台值；而工具密集型或 MCP 风格 transcript 即使完全重复，通常也会停留在接近 `4608` 缓存 token。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）支持 `cacheRetention`，行为与直连 Anthropic 相同。
- `cacheRetention: "long"` 会映射到 Vertex AI 端点上的真实 1 小时提示缓存 TTL。
- `anthropic-vertex` 的默认缓存保留策略与直连 Anthropic 默认值一致。
- Vertex 请求会通过具备边界感知的缓存整形进行路由，以便缓存复用与提供商实际接收到的内容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式透传 `cacheRetention`。
- 非 Anthropic 的 Bedrock 模型会在运行时被强制设置为 `cacheRetention: "none"`。

### OpenRouter Anthropic 模型

对于 `openrouter/anthropic/*` 模型引用，仅当请求仍指向已验证的 OpenRouter 路由时（默认端点上的 `openrouter`，或任何会解析到 `openrouter.ai` 的提供商 / base URL），OpenClaw 才会在 system / developer 提示块上注入 Anthropic `cache_control`，以提升提示缓存复用率。

如果你将模型改指向任意 OpenAI 兼容代理 URL，OpenClaw 就会停止注入这些 OpenRouter 专用的 Anthropic 缓存标记。

### 其他提供商

如果提供商不支持此缓存模式，`cacheRetention` 就不会生效。

### Google Gemini 直连 API

- 直连 Gemini 传输（`api: "google-generative-ai"`）通过上游的 `cachedContentTokenCount` 报告缓存命中；OpenClaw 会将其映射为 `cacheRead`。
- 当在直连 Gemini 模型上设置了 `cacheRetention` 时，OpenClaw 会在 Google AI Studio 运行中自动为 system prompts 创建、复用并刷新 `cachedContents` 资源。这意味着你不再需要手动预创建 cached-content handle。
- 你仍然可以通过已配置模型上的 `params.cachedContent`（或旧版 `params.cached_content`）传入一个预先存在的 Gemini cached-content handle。
- 这与 Anthropic / OpenAI 的提示前缀缓存是分开的。对于 Gemini，OpenClaw 管理的是提供商原生的 `cachedContents` 资源，而不是在请求中注入缓存标记。

### Gemini CLI JSON 用量

- Gemini CLI JSON 输出也可以通过 `stats.cached` 显示缓存命中；OpenClaw 会将其映射为 `cacheRead`。
- 如果 CLI 省略了直接的 `stats.input` 值，OpenClaw 会从 `stats.input_tokens - stats.cached` 推导输入 token。
- 这只是用量规范化。并不意味着 OpenClaw 正在为 Gemini CLI 创建 Anthropic / OpenAI 风格的提示缓存标记。

## system prompt 缓存边界

OpenClaw 会将 system prompt 拆分为**稳定前缀**和**易变后缀**，二者之间由一个内部缓存前缀边界分隔。边界上方的内容（工具定义、Skills 元数据、工作区文件和其他相对静态的上下文）会按顺序排列，以保持多轮之间字节级完全一致。边界下方的内容（例如 `HEARTBEAT.md`、运行时时间戳和其他逐轮变化的元数据）则允许变化，而不会使缓存前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件会排在 `HEARTBEAT.md` 之前，因此 heartbeat 变化不会破坏稳定前缀。
- 该边界会应用于 Anthropic 系列、OpenAI 系列、Google 和 CLI 传输整形，因此所有受支持的提供商都能从相同的前缀稳定性中受益。
- Codex Responses 和 Anthropic Vertex 请求会通过具备边界感知的缓存整形进行路由，以便缓存复用与提供商实际接收到的内容保持一致。
- system prompt 指纹会进行规范化（空白、行尾、hook 添加的上下文、运行时能力排序），这样语义未变化的提示就能在多轮之间共享 KV / 缓存。

如果你在配置或工作区更改后看到异常的 `cacheWrite` 峰值，请检查该变化是落在缓存边界上方还是下方。将易变内容移到边界下方（或让其稳定下来）通常可以解决问题。

## OpenClaw 缓存稳定性保护

在请求到达提供商之前，OpenClaw 还会保持若干对缓存敏感的负载结构具备确定性：

- bundle MCP 工具目录会在工具注册前按确定性顺序排序，因此 `listTools()` 顺序变化不会扰动工具块，也不会破坏提示缓存前缀。
- 带有持久化图片块的旧版会话会保留**最近 3 个已完成轮次**不变；更早且已经处理过的图片块可能会被替换为标记，从而避免图像密集型后续请求反复重新发送大量陈旧负载。

## 调优模式

### 混合流量（推荐默认）

为主智能体保留长期缓存基线，并对突发型通知智能体禁用缓存：

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### 成本优先基线

- 将基线设置为 `cacheRetention: "short"`。
- 启用 `contextPruning.mode: "cache-ttl"`。
- 仅对那些确实能从温热缓存中受益的智能体，将 heartbeat 保持在 TTL 以下。

## 缓存诊断

OpenClaw 为嵌入式智能体运行暴露了专用的缓存追踪诊断。

对于面向普通用户的诊断，当实时会话条目中没有 `cacheRead` / `cacheWrite` 计数器时，`/status` 和其他用量摘要可使用最近的 transcript 用量条目作为回退来源。

## 实时回归测试

OpenClaw 维护了一组组合式实时缓存回归门，用于覆盖重复前缀、工具轮次、图像轮次、MCP 风格工具 transcript，以及一个 Anthropic 无缓存对照项。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令运行精简的实时门：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

baseline 文件存储最近观察到的实时数值，以及测试所使用的按提供商划分的回归下限。
运行器还会使用每次运行全新的会话 ID 和提示命名空间，以避免之前的缓存状态污染当前回归样本。

这些测试有意不在不同提供商之间使用完全相同的成功标准。

### Anthropic 实时期望

- 预期通过 `cacheWrite` 看到显式的预热写入。
- 预期在重复轮次中出现接近完整历史的复用，因为 Anthropic 缓存控制会沿着对话推进缓存断点。
- 当前实时断言仍对稳定、工具和图像路径使用较高的命中率阈值。

### OpenAI 实时期望

- 只预期 `cacheRead`。`cacheWrite` 始终为 `0`。
- 将重复轮次的缓存复用视为提供商特有的平台值，而不是 Anthropic 式的移动式完整历史复用。
- 当前实时断言使用从 `gpt-5.4-mini` 真实观测行为得出的保守下限检查：
  - 稳定前缀：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具 transcript：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 图像 transcript：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 风格 transcript：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的最新组合实时验证结果如下：

- 稳定前缀：`cacheRead=4864`，命中率 `0.966`
- 工具 transcript：`cacheRead=4608`，命中率 `0.896`
- 图像 transcript：`cacheRead=4864`，命中率 `0.954`
- MCP 风格 transcript：`cacheRead=4608`，命中率 `0.891`

该组合门最近一次本地墙钟时间约为 `88s`。

断言之所以不同，是因为：

- Anthropic 暴露了显式缓存断点以及移动式会话历史复用。
- OpenAI 提示缓存仍然对精确前缀敏感，但在实际的 Responses 流量中，可有效复用的前缀可能会比完整提示更早达到平台值。
- 因此，若用单一的跨提供商百分比阈值来比较 Anthropic 和 OpenAI，就会产生误报式回归。

### `diagnostics.cacheTrace` 配置

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # 可选
    includeMessages: false # 默认 true
    includePrompt: false # 默认 true
    includeSystem: false # 默认 true
```

默认值：

- `filePath`：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`：`true`
- `includePrompt`：`true`
- `includeSystem`：`true`

### 环境变量开关（一次性调试）

- `OPENCLAW_CACHE_TRACE=1` 启用缓存追踪。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` 覆盖输出路径。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` 切换是否捕获完整消息负载。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 切换是否捕获提示文本。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 切换是否捕获 system prompt。

### 应检查什么

- 缓存追踪事件为 JSONL，包含诸如 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 等阶段性快照。
- 每轮缓存 token 的影响可通过常规用量界面中的 `cacheRead` 和 `cacheWrite` 查看（例如 `/usage full` 和会话用量摘要）。
- 对于 Anthropic，启用缓存时应同时看到 `cacheRead` 和 `cacheWrite`。
- 对于 OpenAI，缓存命中时应看到 `cacheRead`，而 `cacheWrite` 应保持为 `0`；OpenAI 不会公开单独的缓存写入 token 字段。
- 如果你需要请求追踪，请将请求 ID 和限流标头与缓存指标分开记录。OpenClaw 当前的缓存追踪输出侧重于提示 / 会话结构和规范化后的 token 用量，而不是原始提供商响应标头。

## 快速故障排除

- 大多数轮次 `cacheWrite` 很高：检查是否存在易变的 system prompt 输入，并确认模型 / 提供商支持你的缓存设置。
- Anthropic 上 `cacheWrite` 很高：通常意味着缓存断点落在每次请求都会变化的内容上。
- OpenAI 的 `cacheRead` 很低：确认稳定前缀位于最前面、重复前缀至少有 1024 个 token，并且对于应该共享缓存的轮次复用了相同的 `prompt_cache_key`。
- `cacheRetention` 没有效果：确认模型键与 `agents.defaults.models["provider/model"]` 匹配。
- 带有缓存设置的 Bedrock Nova / Mistral 请求：运行时被强制设为 `none` 属于预期行为。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 用量与成本](/zh-CN/reference/token-use)
- [Session Pruning](/zh-CN/concepts/session-pruning)
- [Gateway 配置参考](/zh-CN/gateway/configuration-reference)

## 相关内容

- [Token 用量与成本](/zh-CN/reference/token-use)
- [API 用量与成本](/zh-CN/reference/api-usage-costs)
