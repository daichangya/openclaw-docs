---
read_when:
    - 你希望通过缓存保留来降低提示 token 成本
    - 你需要在多智能体设置中实现每智能体缓存行为
    - 你正在一起调整 heartbeat 和 cache-ttl 修剪行为
summary: 提示缓存开关、合并顺序、provider 行为与调优模式
title: 提示缓存
x-i18n:
    generated_at: "2026-04-23T21:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee2af4b5075f485e8e4e49c429cadbbfae2262e060612ac3e3aa55fb0322d4e5
    source_path: reference/prompt-caching.md
    workflow: 15
---

提示缓存意味着模型 provider 可以在多轮对话中复用未变化的提示前缀（通常是系统/开发者指令和其他稳定上下文），而不是每次都重新处理它们。只要上游 API 直接暴露这些计数器，OpenClaw 就会将 provider 使用量规范化为 `cacheRead` 和 `cacheWrite`。

状态界面也可以在实时会话快照缺失这些计数器时，从最近的 transcript
使用日志中恢复缓存计数器，因此即使会话元数据发生部分丢失，`/status` 仍然可以继续显示缓存行。现有的非零实时缓存值仍然优先于 transcript 回退值。

这为什么重要：更低的 token 成本、更快的响应，以及更可预测的长会话性能。如果没有缓存，即使大部分输入没有变化，重复提示在每轮中也要付出完整提示成本。

本页涵盖所有会影响提示复用和 token 成本的缓存相关开关。

Provider 参考：

- Anthropic 提示缓存：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 提示缓存：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 请求头和请求 ID：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 请求 ID 和错误：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要开关

### `cacheRetention`（全局默认值、模型级别和每智能体）

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

每智能体覆盖：

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

配置合并顺序：

1. `agents.defaults.params`（全局默认值——适用于所有模型）
2. `agents.defaults.models["provider/model"].params`（每模型覆盖）
3. `agents.list[].params`（匹配的智能体 id；按键覆盖）

### `contextPruning.mode: "cache-ttl"`

在缓存 TTL 窗口之后修剪旧的工具结果上下文，这样空闲后的请求就不会重新缓存过大的历史内容。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为请参阅[会话修剪](/zh-CN/concepts/session-pruning)。

### Heartbeat 保温

Heartbeat 可以保持缓存窗口处于温热状态，并减少空闲间隔后重复的缓存写入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

每智能体 heartbeat 也支持通过 `agents.list[].heartbeat` 配置。

## Provider 行为

### Anthropic（直接 API）

- 支持 `cacheRetention`。
- 对于 Anthropic API 密钥 auth profiles，当 `cacheRetention` 未设置时，OpenClaw 会为 Anthropic 模型引用注入 `cacheRetention: "short"`。
- Anthropic 原生 Messages 响应会同时暴露 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以同时显示 `cacheRead` 和 `cacheWrite`。
- 对于原生 Anthropic 请求，`cacheRetention: "short"` 会映射到默认的 5 分钟临时缓存，而 `cacheRetention: "long"` 仅在直接 `api.anthropic.com` 主机上升级为 1 小时 TTL。

### OpenAI（直接 API）

- 提示缓存会在受支持的新模型上自动生效。OpenClaw 无需注入块级缓存标记。
- OpenClaw 使用 `prompt_cache_key` 来保持多轮中的缓存路由稳定，并且仅当在直接 OpenAI 主机上选择 `cacheRetention: "long"` 时，才使用 `prompt_cache_retention: "24h"`。
- OpenAI 会通过 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件中的 `input_tokens_details.cached_tokens`）暴露缓存命中提示 token。OpenClaw 会将其映射为 `cacheRead`。
- OpenAI 不会暴露单独的缓存写入 token 计数器，因此即使 provider 正在预热缓存，在 OpenAI 路径上 `cacheWrite` 仍保持为 `0`。
- OpenAI 会返回有用的追踪和限流请求头，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但缓存命中统计应来自 usage payload，而不是请求头。
- 在实践中，OpenAI 的行为通常更像初始前缀缓存，而不是 Anthropic 那种可移动的完整历史复用。当前 live probes 中，稳定的长前缀文本轮次通常会落在接近 `4864` 的缓存 token 平台，而工具密集型或 MCP 风格 transcript 即使完全重复，也通常停留在接近 `4608` 的缓存 token 平台。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）以与直接 Anthropic 相同的方式支持 `cacheRetention`。
- `cacheRetention: "long"` 会在 Vertex AI 端点上映射为真实的 1 小时 prompt-cache TTL。
- `anthropic-vertex` 的默认缓存保留行为与直接 Anthropic 一致。
- Vertex 请求会通过具备边界感知的缓存整形路径路由，因此缓存复用会与 provider 实际接收到的内容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式 `cacheRetention` 透传。
- 非 Anthropic 的 Bedrock 模型在运行时会被强制设置为 `cacheRetention: "none"`。

### OpenRouter Anthropic 模型

对于 `openrouter/anthropic/*` 模型引用，OpenClaw 会在系统/开发者提示块中注入 Anthropic
`cache_control`，以便仅在请求仍然指向已验证的 OpenRouter 路由时
（即默认端点上的 `openrouter`，或任何解析到 `openrouter.ai` 的 provider/base URL）
提高 prompt-cache
复用效果。

如果你把模型改指向任意兼容 OpenAI 的代理 URL，OpenClaw
就会停止注入这些 OpenRouter 专用的 Anthropic 缓存标记。

### 其他 providers

如果 provider 不支持这种缓存模式，`cacheRetention` 就不会产生效果。

### Google Gemini 直接 API

- 直接 Gemini 传输（`api: "google-generative-ai"`）会通过上游 `cachedContentTokenCount` 报告缓存命中；
  OpenClaw 会将其映射为 `cacheRead`。
- 当在直接 Gemini 模型上设置了 `cacheRetention` 时，OpenClaw 会自动
  在 Google AI Studio 运行中为系统提示创建、复用并刷新 `cachedContents` 资源。这意味着你不再需要手动预先创建
  cached-content handle。
- 你仍然可以将已有的 Gemini cached-content handle
  通过配置模型中的 `params.cachedContent`（或旧版 `params.cached_content`）传入。
- 这与 Anthropic/OpenAI 的提示前缀缓存不同。对于 Gemini，
  OpenClaw 管理的是 provider 原生的 `cachedContents` 资源，而不是
  在请求中注入缓存标记。

### Gemini CLI JSON 使用量

- Gemini CLI JSON 输出也可以通过 `stats.cached` 暴露缓存命中；
  OpenClaw 会将其映射为 `cacheRead`。
- 如果 CLI 省略了直接的 `stats.input` 值，OpenClaw 会从
  `stats.input_tokens - stats.cached` 推导输入 token。
- 这只是使用量规范化。它并不意味着 OpenClaw 正在为 Gemini CLI 创建
  Anthropic/OpenAI 风格的 prompt-cache 标记。

## 系统提示缓存边界

OpenClaw 会将系统提示拆分为**稳定前缀**和**易变后缀**，
两者之间由一个内部 cache-prefix 边界分隔。边界之上的内容
（工具定义、Skills 元数据、工作区文件以及其他
相对静态的上下文）会按顺序排列，使其在多轮中保持字节级一致。
边界之下的内容（例如 `HEARTBEAT.md`、运行时时间戳以及
其他每轮元数据）则允许变化，而不会使缓存前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件会排在 `HEARTBEAT.md` 之前，
  因此 heartbeat 抖动不会破坏稳定前缀。
- 该边界会应用到 Anthropic 家族、OpenAI 家族、Google 以及
  CLI 传输整形上，因此所有受支持的 providers 都能从相同的前缀
  稳定性中受益。
- Codex Responses 和 Anthropic Vertex 请求会通过
  具备边界感知的缓存整形路径路由，因此缓存复用会与 providers 实际接收到的内容保持一致。
- 系统提示指纹会被规范化（空白、换行、
  hook 添加的上下文、运行时能力排序），这样在语义未变化时，
  多轮之间就可以共享相同的 KV/缓存。

如果你在配置或工作区变更后看到意外的 `cacheWrite` 峰值，
请检查该变化是落在缓存边界之上还是之下。将
易变内容移到边界之下（或让它保持稳定）通常可以解决
问题。

## OpenClaw 缓存稳定性保护措施

在请求到达 provider 之前，OpenClaw 还会让若干对缓存敏感的 payload 形态保持确定性：

- Bundle MCP 工具目录在工具
  注册前会按确定性顺序排序，因此 `listTools()` 顺序变化不会扰动工具块并
  破坏 prompt-cache 前缀。
- 带有持久化图像块的旧版会话会保留**最近 3 个已完成轮次**
  完整不变；更早的已处理图像块
  可能会被替换为一个标记，这样在后续图像密集型交互中就不会反复重新发送大量过期 payload。

## 调优模式

### 混合流量（推荐默认值）

为主智能体保持长期基线，而对突发型通知智能体禁用缓存：

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
- 仅对能从温热缓存中受益的智能体，将 heartbeat 保持在 TTL 之下。

## 缓存诊断

OpenClaw 为嵌入式智能体运行暴露了专用的缓存跟踪诊断能力。

对于普通面向用户的诊断，当实时会话条目没有 `cacheRead` /
`cacheWrite` 计数器时，`/status` 和其他使用量摘要可以使用最新的 transcript 使用量条目作为回退来源。

## 实时回归测试

OpenClaw 保留了一个组合式实时缓存回归门，用于测试重复前缀、工具轮次、图像轮次、MCP 风格工具 transcript 以及 Anthropic 无缓存控制。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

运行狭窄的实时门：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件存储最近一次观察到的实时数字，以及测试所用的 provider 专用回归下限。
运行器还会使用新的每次运行会话 ID 和提示命名空间，因此先前的缓存状态不会污染当前回归样本。

这些测试有意不在不同 providers 之间使用相同的成功判定标准。

### Anthropic 实时预期

- 预期会通过 `cacheWrite` 看到显式预热写入。
- 预期在重复轮次中实现接近完整历史复用，因为 Anthropic 的缓存控制会在对话过程中推进缓存断点。
- 当前实时断言仍然对稳定、工具和图像路径使用较高命中率阈值。

### OpenAI 实时预期

- 仅预期 `cacheRead`。`cacheWrite` 保持为 `0`。
- 将重复轮次缓存复用视为 provider 专用平台，而不是 Anthropic 式的可移动完整历史复用。
- 当前实时断言使用基于 `gpt-5.4-mini` 实际观察行为得出的保守下限检查：
  - 稳定前缀：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具 transcript：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 图像 transcript：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 风格 transcript：`cacheRead >= 4096`，命中率 `>= 0.85`

在 2026-04-04 的最新组合实时验证结果为：

- 稳定前缀：`cacheRead=4864`，命中率 `0.966`
- 工具 transcript：`cacheRead=4608`，命中率 `0.896`
- 图像 transcript：`cacheRead=4864`，命中率 `0.954`
- MCP 风格 transcript：`cacheRead=4608`，命中率 `0.891`

该组合门最近一次本地墙钟时间大约为 `88s`。

为什么断言会不同：

- Anthropic 暴露了显式缓存断点和可移动的会话历史复用。
- OpenAI 提示缓存仍然对精确前缀敏感，但在实时 Responses 流量中，可有效复用的前缀可能会比完整提示更早达到平台。
- 因此，用单一跨 provider 百分比阈值来比较 Anthropic 和 OpenAI 会产生错误回归。

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

- `OPENCLAW_CACHE_TRACE=1` 启用缓存跟踪。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` 覆盖输出路径。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` 切换是否捕获完整消息 payload。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 切换是否捕获提示文本。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 切换是否捕获系统提示。

### 需要检查什么

- 缓存跟踪事件是 JSONL，包含诸如 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 这样的阶段性快照。
- 每轮缓存 token 影响可通过常规使用量界面中的 `cacheRead` 和 `cacheWrite` 查看（例如 `/usage full` 和会话使用量摘要）。
- 对于 Anthropic，当缓存处于激活状态时，应同时看到 `cacheRead` 和 `cacheWrite`。
- 对于 OpenAI，在缓存命中时应看到 `cacheRead`，而 `cacheWrite` 应保持为 `0`；OpenAI 不会发布单独的缓存写入 token 字段。
- 如果你需要请求跟踪，请将请求 ID 和限流请求头与缓存指标分开记录。OpenClaw 当前的缓存跟踪输出聚焦于提示/会话形态和规范化 token 使用量，而不是原始 provider 响应头。

## 快速故障排除

- 大多数轮次都有较高 `cacheWrite`：检查是否存在易变的系统提示输入，并确认模型/provider 支持你的缓存设置。
- Anthropic 上 `cacheWrite` 很高：通常意味着缓存断点落在了每次请求都会变化的内容上。
- OpenAI 上 `cacheRead` 很低：确认稳定前缀位于最前面、重复前缀至少有 1024 个 token，并且在应共享缓存的轮次之间复用了同一个 `prompt_cache_key`。
- `cacheRetention` 没有效果：确认模型键与 `agents.defaults.models["provider/model"]` 匹配。
- 带有缓存设置的 Bedrock Nova/Mistral 请求：运行时强制为 `none` 属于预期行为。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用与成本](/zh-CN/reference/token-use)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [Gateway 网关配置参考](/zh-CN/gateway/configuration-reference)
