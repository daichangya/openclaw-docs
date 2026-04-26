---
read_when:
    - 你想将 OpenClaw 模型使用情况、消息流或会话指标发送到 OpenTelemetry 收集器
    - 你正在将追踪、指标或日志接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 后端
    - 你需要确切的指标名称、span 名称或属性结构来构建仪表板或告警
summary: 通过 diagnostics-otel 插件（OTLP/HTTP）将 OpenClaw 诊断数据导出到任意 OpenTelemetry 收集器
title: OpenTelemetry 导出
x-i18n:
    generated_at: "2026-04-26T21:16:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ad923fff12ff89766999370fe39a75c1aa5f386ce4641fde1c385b24439cc1b
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw 通过内置的 `diagnostics-otel` 插件导出诊断数据，
使用 **OTLP/HTTP（protobuf）**。任何接受 OTLP/HTTP 的收集器或后端
都可以直接使用，无需修改代码。关于本地文件日志及其读取方式，请参见
[日志记录](/zh-CN/logging)。

## 工作原理

- **诊断事件** 是由 Gateway 网关和内置插件发出的结构化进程内记录，
  用于模型运行、消息流、会话、队列和 exec。
- **`diagnostics-otel` 插件** 订阅这些事件，并通过 OTLP/HTTP 将它们导出为
  OpenTelemetry **指标**、**追踪** 和 **日志**。
- **提供商调用** 会从 OpenClaw 可信的模型调用 span 上下文中接收一个 W3C `traceparent`
  请求头，前提是提供商传输层接受自定义请求头。插件发出的追踪上下文不会被传播。
- 只有在诊断功能和插件都启用时，导出器才会附加，因此默认情况下进程内开销几乎为零。

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

## 导出的信号

| 信号 | 包含内容 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **指标** | 用于 token 使用量、成本、运行时长、消息流、队列通道、会话状态、exec 和内存压力的计数器与直方图。 |
| **追踪** | 用于模型使用、模型调用、harness 生命周期、工具执行、exec、webhook/消息处理、上下文组装和工具循环的 span。 |
| **日志** | 当启用 `diagnostics.otel.logs` 时，通过 OTLP 导出的结构化 `logging.file` 记录。 |

你可以分别切换 `traces`、`metrics` 和 `logs`。当
`diagnostics.otel.enabled` 为 true 时，这三项默认都会开启。

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
      protocol: "http/protobuf", // grpc 会被忽略
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // 根 span 采样器，范围 0.0..1.0
      flushIntervalMs: 60000, // 指标导出间隔（最小 1000ms）
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆盖 `diagnostics.otel.endpoint`。如果该值已经包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，则按原样使用。 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 当对应的 `diagnostics.otel.*Endpoint` 配置键未设置时，用作各信号专属端点覆盖。信号专属配置优先于信号专属环境变量，后者优先于共享端点。 |
| `OTEL_SERVICE_NAME`                                                                                               | 覆盖 `diagnostics.otel.serviceName`。 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆盖线协议（当前仅 `http/protobuf` 会生效）。 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 设置为 `gen_ai_latest_experimental` 时，会发出最新的实验性 GenAI span 属性（`gen_ai.provider.name`），而不是旧版的 `gen_ai.system`。无论如何，GenAI 指标始终使用有界、低基数的语义属性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 当另一个预加载器或宿主进程已经注册了全局 OpenTelemetry SDK 时，设置为 `1`。此时插件会跳过自己的 NodeSDK 生命周期，但仍会连接诊断监听器并遵循 `traces`/`metrics`/`logs`。 |

## 隐私与内容采集

默认**不会**导出原始模型/工具内容。span 携带的是有界标识符
（渠道、提供商、模型、错误类别、仅哈希的请求 ID），并且绝不会包含提示词文本、
响应文本、工具输入、工具输出或会话键。

发往外部的模型请求可能包含一个 W3C `traceparent` 请求头。该请求头仅基于
当前模型调用的 OpenClaw 自有诊断追踪上下文生成。已有的调用方提供的 `traceparent`
请求头会被替换，因此插件或自定义提供商选项无法伪造跨服务追踪祖先关系。

仅当你的收集器和保留策略已获准处理提示词、响应、工具或系统提示词文本时，
才将 `diagnostics.otel.captureContent.*` 设为 `true`。每个子键都需要单独显式启用：

- `inputMessages` —— 用户提示内容。
- `outputMessages` —— 模型响应内容。
- `toolInputs` —— 工具参数负载。
- `toolOutputs` —— 工具结果负载。
- `systemPrompt` —— 组装后的 system/developer 提示词。

当任一子键启用时，模型和工具 span 会仅针对该类内容附加有界、已脱敏的
`openclaw.content.*` 属性。

## 采样与刷新

- **追踪：** `diagnostics.otel.sampleRate`（仅根 span，`0.0` 表示全部丢弃，
  `1.0` 表示全部保留）。
- **指标：** `diagnostics.otel.flushIntervalMs`（最小值为 `1000`）。
- **日志：** OTLP 日志遵循 `logging.level`（文件日志级别）。它们使用的是
  诊断日志记录脱敏路径，而不是控制台格式化。对于高流量安装，建议优先使用
  OTLP 收集器采样/过滤，而不是本地采样。
- **文件日志关联：** 当日志调用携带有效的诊断追踪上下文时，JSONL 文件日志会在顶层包含
  `traceId`、`spanId`、`parentSpanId` 和 `traceFlags`，这使日志处理器能够将本地日志行与
  已导出的 span 关联起来。
- **请求关联：** Gateway 网关 HTTP 请求和 WebSocket 帧会创建一个内部请求追踪作用域。
  该作用域内的日志和诊断事件默认会继承请求追踪，而智能体运行和模型调用 span
  则作为其子级创建，因此提供商 `traceparent` 请求头会保持在同一条追踪上。

## 导出的指标

### 模型使用情况

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方图，GenAI 语义约定指标，属性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方图，单位为秒，GenAI 语义约定指标，属性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，以及可选的 `error.type`）
- `openclaw.model_call.duration_ms`（直方图，属性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`）
- `openclaw.model_call.request_bytes`（直方图，最终模型请求负载的 UTF-8 字节大小；不包含原始负载内容）
- `openclaw.model_call.response_bytes`（直方图，流式模型响应事件的 UTF-8 字节大小；不包含原始响应内容）
- `openclaw.model_call.time_to_first_byte_ms`（直方图，首个流式响应事件到达前的耗时）

### 消息流

- `openclaw.webhook.received`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（计数器，属性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.processed`（计数器，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（计数器，属性：`openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### 队列与会话

- `openclaw.queue.lane.enqueue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.depth`（直方图，属性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方图，属性：`openclaw.lane`）
- `openclaw.session.state`（计数器，属性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

### Harness 生命周期

- `openclaw.harness.duration_ms`（直方图，属性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，以及出错时的 `openclaw.harness.phase`）

### Exec

- `openclaw.exec.duration_ms`（直方图，属性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 诊断内部指标（内存与工具循环）

- `openclaw.memory.heap_used_bytes`（直方图，属性：`openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（直方图）
- `openclaw.memory.pressure`（计数器，属性：`openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（计数器，属性：`openclaw.toolName`、`openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（直方图，属性：`openclaw.toolName`、`openclaw.outcome`）

## 导出的 span

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 默认使用 `gen_ai.system`，或者在选择启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 默认使用 `gen_ai.system`，或者在选择启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上游提供商请求 ID 的有界 SHA 哈希；不会导出原始 ID）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成时：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 出错时：`openclaw.harness.phase`、`openclaw.errorCategory`，以及可选的 `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含 prompt、history、response 或 session-key 内容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含循环消息、参数或工具输出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

当显式启用内容采集时，模型和工具 span 还可以包含你所选择启用的特定内容类别对应的有界、已脱敏 `openclaw.content.*` 属性。

## 诊断事件目录

以下事件支撑上面的指标和 span。插件也可以直接订阅这些事件，而无需 OTLP 导出。

**模型使用情况**

- `model.usage` —— token、成本、时长、上下文、提供商/模型/渠道、
  会话 ID。`usage` 是提供商/轮次级别的成本与遥测统计；
  `context.used` 是当前 prompt/上下文快照，当涉及缓存输入或工具循环调用时，
  它可能小于提供商的 `usage.total`。

**消息流**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**队列与会话**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat`（聚合计数器：webhooks/queue/session）

**Harness 生命周期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  智能体 harness 的逐次运行生命周期。包括 `harnessId`、可选的
  `pluginId`、provider/model/channel，以及 run id。完成事件会新增
  `durationMs`、`outcome`、可选的 `resultClassification`、`yieldDetected`，
  以及 `itemLifecycle` 计数。错误事件会新增 `phase`
  （`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`，以及
  可选的 `cleanupFailed`。

**Exec**

- `exec.process.completed` —— 最终结果、时长、目标、模式、退出
  码和失败类型。不包含命令文本和工作目录。

## 不使用导出器

你可以在不运行 `diagnostics-otel` 的情况下，仍然让诊断事件可供插件或自定义接收端使用：

```json5
{
  diagnostics: { enabled: true },
}
```

如果你想要定向调试输出，而不提升 `logging.level`，可以使用诊断
标记。标记不区分大小写，并支持通配符（例如 `telegram.*` 或
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

标记输出会写入标准日志文件（`logging.file`），并仍然会被
`logging.redactSensitive` 脱敏。完整指南：
[诊断标记](/zh-CN/diagnostics/flags)。

## 禁用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以不把 `diagnostics-otel` 放入 `plugins.allow` 中，或者运行
`openclaw plugins disable diagnostics-otel`。

## 相关内容

- [日志记录](/zh-CN/logging) — 文件日志、控制台输出、CLI 尾随查看，以及 Control UI 的 Logs 标签页
- [Gateway 网关日志记录内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [诊断标记](/zh-CN/diagnostics/flags) — 定向调试日志标记
- [诊断导出](/zh-CN/gateway/diagnostics) — 面向运维的支持包导出工具（与 OTEL 导出分开）
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
