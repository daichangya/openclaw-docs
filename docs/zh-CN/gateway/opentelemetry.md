---
read_when:
    - 你想将 OpenClaw 模型使用情况、消息流或会话指标发送到 OpenTelemetry 收集器
    - 你正在将追踪、指标或日志接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 后端
    - 你需要确切的指标名称、span 名称或属性结构来构建仪表板或告警
summary: 通过 diagnostics-otel 插件（OTLP/HTTP）将 OpenClaw 诊断信息导出到任何 OpenTelemetry 收集器
title: OpenTelemetry 导出
x-i18n:
    generated_at: "2026-04-26T20:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c0462a19d5eebde92f87fef3d26dfe7338c3d446caf4b8c7097eb1a13a278fe
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw 通过内置的 `diagnostics-otel` 插件导出诊断信息，
使用 **OTLP/HTTP（protobuf）**。任何接受 OTLP/HTTP 的收集器或后端
都可以直接使用，无需修改代码。有关本地文件日志及其读取方式，请参阅
[日志记录](/zh-CN/logging)。

## 它如何协同工作

- **诊断事件** 是由 Gateway 网关和内置插件发出的结构化进程内记录，
  用于模型运行、消息流、会话、队列和 exec。
- **`diagnostics-otel` 插件** 订阅这些事件，并通过 OTLP/HTTP 将其导出为
  OpenTelemetry **指标**、**追踪** 和 **日志**。
- **提供商调用** 会从 OpenClaw 受信任的模型调用 span 上下文接收一个 W3C
  `traceparent` 请求头，前提是提供商传输层接受自定义请求头。插件发出的追踪上下文不会被传播。
- 只有在诊断表面和插件都启用时，导出器才会附加，因此默认情况下进程内开销几乎为零。

## 快速开始

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

你也可以通过 CLI 启用该插件：

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` 当前仅支持 `http/protobuf`。`grpc` 会被忽略。
</Note>

## 已导出的信号

| 信号 | 其中包含的内容 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **指标** | 用于 token 使用量、成本、运行时长、消息流、队列通道、会话状态、exec 和内存压力的计数器与直方图。 |
| **追踪** | 用于模型使用、模型调用、harness 生命周期、工具执行、exec、webhook/消息处理、上下文组装和工具循环的 spans。 |
| **日志** | 当启用 `diagnostics.otel.logs` 时，通过 OTLP 导出的结构化 `logging.file` 记录。 |

你可以独立切换 `traces`、`metrics` 和 `logs`。当
`diagnostics.otel.enabled` 为 true 时，这三者默认都开启。

## 配置参考

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### 环境变量

| 变量 | 用途 |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | 覆盖 `diagnostics.otel.endpoint`。如果该值已经包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，则按原样使用。 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 当对应的 `diagnostics.otel.*Endpoint` 配置键未设置时，使用按信号区分的端点覆盖。信号专用配置优先于信号专用环境变量，后者优先于共享端点。 |
| `OTEL_SERVICE_NAME` | 覆盖 `diagnostics.otel.serviceName`。 |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | 覆盖线协议（当前仅支持 `http/protobuf`）。 |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | 设置为 `gen_ai_latest_experimental` 时，会发出最新的实验性 GenAI span 属性（`gen_ai.provider.name`），而不是旧版的 `gen_ai.system`。无论如何，GenAI 指标始终使用有界、低基数的语义属性。 |
| `OPENCLAW_OTEL_PRELOADED` | 当另一个预加载项或宿主进程已经注册了全局 OpenTelemetry SDK 时，将其设置为 `1`。这样插件会跳过自身的 NodeSDK 生命周期，但仍会连接诊断监听器并遵循 `traces`/`metrics`/`logs`。 |

## 隐私与内容捕获

默认情况下，原始模型/工具内容 **不会** 被导出。Spans 仅携带有界
标识符（渠道、提供商、模型、错误类别、仅哈希的请求 id），
绝不会包含提示文本、响应文本、工具输入、工具输出或会话键。

出站模型请求可能包含 W3C `traceparent` 请求头。该请求头
仅根据 OpenClaw 自有的活动模型调用诊断追踪上下文生成。
现有调用方提供的 `traceparent` 请求头会被替换，因此插件或
自定义提供商选项无法伪造跨服务追踪祖先关系。

仅当你的收集器和保留策略已获批准，可用于提示词、响应、工具或系统提示
文本时，才将 `diagnostics.otel.captureContent.*` 设为 `true`。每个子键都需要单独选择启用：

- `inputMessages` — 用户提示内容。
- `outputMessages` — 模型响应内容。
- `toolInputs` — 工具参数负载。
- `toolOutputs` — 工具结果负载。
- `systemPrompt` — 组装后的 system/developer 提示词。

启用任意子键后，模型和工具 spans 将仅为该类别附加有界、已脱敏的
`openclaw.content.*` 属性。

## 采样与刷新

- **追踪：** `diagnostics.otel.sampleRate`（仅根 span，`0.0` 全部丢弃，
  `1.0` 全部保留）。
- **指标：** `diagnostics.otel.flushIntervalMs`（最小值 `1000`）。
- **日志：** OTLP 日志遵循 `logging.level`（文件日志级别）。它们使用
  诊断日志记录脱敏路径，而不是控制台格式化。高流量安装应优先使用
  OTLP 收集器采样/过滤，而不是本地采样。
- **文件日志关联：** 当日志调用携带有效的诊断追踪上下文时，JSONL 文件日志会包含顶层
  `traceId`、`spanId`、`parentSpanId` 和 `traceFlags`，
  这使日志处理器能够将本地日志行与导出的 spans 关联起来。

## 已导出的指标

### 模型使用情况

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方图，GenAI 语义约定指标，属性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方图，单位为秒，GenAI 语义约定指标，属性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，可选 `error.type`）
- `openclaw.model_call.duration_ms`（直方图，属性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`）
- `openclaw.model_call.request_bytes`（直方图，最终模型请求负载的 UTF-8 字节大小；不包含原始负载内容）
- `openclaw.model_call.response_bytes`（直方图，流式模型响应事件的 UTF-8 字节大小；不包含原始响应内容）
- `openclaw.model_call.time_to_first_byte_ms`（直方图，第一个流式响应事件到达前的耗时）

### 消息流

- `openclaw.webhook.received`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（计数器，属性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.processed`（计数器，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（计数器，属性：`openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### 队列和会话

- `openclaw.queue.lane.enqueue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.depth`（直方图，属性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方图，属性：`openclaw.lane`）
- `openclaw.session.state`（计数器，属性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

### Harness 生命周期

- `openclaw.harness.duration_ms`（直方图，属性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，错误时包含 `openclaw.harness.phase`）

### Exec

- `openclaw.exec.duration_ms`（直方图，属性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 诊断内部机制（内存和工具循环）

- `openclaw.memory.heap_used_bytes`（直方图，属性：`openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（直方图）
- `openclaw.memory.pressure`（计数器，属性：`openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（计数器，属性：`openclaw.toolName`、`openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（直方图，属性：`openclaw.toolName`、`openclaw.outcome`）

## 已导出的 spans

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 默认使用 `gen_ai.system`，或者在选择启用最新的 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 默认使用 `gen_ai.system`，或者在选择启用最新的 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上游提供商请求 id 的有界、基于 SHA 的哈希；不会导出原始 id）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成时：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 出错时：`openclaw.harness.phase`、`openclaw.errorCategory`、可选的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.errorCategory`、`openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`、`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.chatId`、`openclaw.messageId`、`openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`、`openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含提示词、历史记录、响应或会话键内容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含循环消息、参数或工具输出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

当明确启用内容捕获时，模型和工具 spans 还可以为你选择启用的特定
内容类别包含有界、已脱敏的 `openclaw.content.*` 属性。

## 诊断事件目录

以下事件为上述指标和 spans 提供基础。插件也可以直接订阅
这些事件，而无需 OTLP 导出。

**模型使用情况**

- `model.usage` — token、成本、时长、上下文、提供商/模型/渠道、
  会话 id。`usage` 是提供商/轮次维度的成本和遥测统计；
  `context.used` 是当前提示词/上下文快照，在涉及缓存输入或工具循环调用时，
  其值可能低于提供商 `usage.total`。

**消息流**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**队列和会话**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat`（聚合计数器：webhooks/queue/session）

**Harness 生命周期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  智能体 harness 的单次运行生命周期。包括 `harnessId`、可选的
  `pluginId`、提供商/模型/渠道以及运行 id。完成事件会附加
  `durationMs`、`outcome`、可选的 `resultClassification`、`yieldDetected`
  和 `itemLifecycle` 计数。错误事件会附加 `phase`
  （`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory` 以及
  可选的 `cleanupFailed`。

**Exec**

- `exec.process.completed` — 最终结果、时长、目标、模式、退出
  码和失败类型。不包含命令文本和工作目录。

## 不使用导出器

你可以在不运行 `diagnostics-otel` 的情况下，仍让诊断事件可供插件或自定义接收器使用：

```json5
{
  diagnostics: { enabled: true },
}
```

若想在不提高 `logging.level` 的情况下获得定向调试输出，请使用诊断
标志。标志不区分大小写，并支持通配符（例如 `telegram.*` 或
`*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或者作为一次性的环境变量覆盖：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

标志输出会进入标准日志文件（`logging.file`），并且仍会受到
`logging.redactSensitive` 的脱敏处理。完整指南：
[诊断标志](/zh-CN/diagnostics/flags)。

## 禁用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以不将 `diagnostics-otel` 加入 `plugins.allow`，或者运行
`openclaw plugins disable diagnostics-otel`。

## 相关内容

- [日志记录](/zh-CN/logging) — 文件日志、控制台输出、CLI tail 和 Control UI 日志标签页
- [Gateway 网关日志记录内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [诊断标志](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [诊断导出](/zh-CN/gateway/diagnostics) — 面向运维人员的支持包工具（与 OTEL 导出分开）
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
