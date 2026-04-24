---
read_when:
    - 你需要一个面向初学者的日志概览
    - 你想要配置日志级别或格式
    - 你正在进行故障排除，需要快速找到日志
summary: 日志概览：文件日志、控制台输出、CLI 日志跟随，以及 Control UI
title: 日志概览
x-i18n:
    generated_at: "2026-04-24T23:44:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e179c883d98caa7fd8d3ece8962d0b628562d35568ebf452c34bededba22e2c
    source_path: logging.md
    workflow: 15
---

# 日志

OpenClaw 有两个主要的日志入口：

- 由 Gateway 网关 写入的**文件日志**（JSON 行格式）。
- 在终端和 Gateway 网关调试 UI 中显示的**控制台输出**。

Control UI 的 **Logs** 选项卡会跟随 gateway 文件日志。本页说明日志位于哪里、如何读取日志，以及如何配置日志级别和格式。

## 日志存放位置

默认情况下，Gateway 网关会在以下路径写入滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主机的本地时区。

你可以在 `~/.openclaw/openclaw.json` 中覆盖这个设置：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时跟随（推荐）

使用 CLI 通过 RPC 跟随 gateway 日志文件：

```bash
openclaw logs --follow
```

当前有用的选项：

- `--local-time`：以你的本地时区渲染时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway 网关 RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（这里通过共享客户端层接受）

输出模式：

- **TTY 会话**：美观、带颜色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：行分隔 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你传入显式的 `--url` 时，CLI 不会自动应用配置或环境变量凭证；如果目标 Gateway 网关需要鉴权，请自行包含 `--token`。

在 JSON 模式下，CLI 会输出带有 `type` 标签的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的原始日志行

如果本地 local loopback Gateway 网关要求配对，`openclaw logs` 会自动回退到已配置的本地日志文件。显式的 `--url` 目标不会使用此回退机制。

如果 Gateway 网关无法访问，CLI 会打印一条简短提示，建议运行：

```bash
openclaw doctor
```

### Control UI（网页）

Control UI 的 **Logs** 选项卡会使用 `logs.tail` 跟随同一个文件。有关如何打开它，请参见 [/web/control-ui](/zh-CN/web/control-ui)。

### 仅渠道日志

要过滤渠道活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目，以渲染结构化输出（时间、级别、子系统、消息）。

### 控制台输出

控制台日志会**感知 TTY**，并针对可读性进行格式化：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info/warn/error）
- 可选的紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway WebSocket 日志

`openclaw gateway` 还提供用于 RPC 流量的 WebSocket 协议日志：

- 普通模式：仅显示值得关注的结果（错误、解析错误、慢调用）
- `--verbose`：显示所有请求/响应流量
- `--ws-log auto|compact|full`：选择详细渲染样式
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 配置日志

所有日志配置都位于 `~/.openclaw/openclaw.json` 的 `logging` 下。

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 日志级别

- `logging.level`：**文件日志**（JSONL）级别。
- `logging.consoleLevel`：**控制台**详细程度级别。

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖这两者（例如 `OPENCLAW_LOG_LEVEL=debug`）。该环境变量优先于配置文件，因此你可以在不编辑 `openclaw.json` 的情况下，仅针对单次运行提高详细程度。你也可以传递全局 CLI 选项 **`--log-level <level>`**（例如，`openclaw --log-level debug gateway run`），它会在该命令中覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会更改文件日志级别。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：适合人工阅读，带颜色和时间戳。
- `compact`：输出更紧凑（最适合长时间会话）。
- `json`：每行一个 JSON（适用于日志处理器）。

### 脱敏

工具摘要可以在输出到控制台之前对敏感令牌进行脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：用于覆盖默认集合的正则表达式字符串列表

脱敏**只影响控制台输出**，不会修改文件日志。

## 诊断 + OpenTelemetry

诊断是面向模型运行**以及**消息流遥测（webhook、排队、会话状态）的结构化、机器可读事件。它们**不会**替代日志；它们的存在是为了提供给指标、追踪和其他导出器。

诊断事件会在进程内发出，但只有在启用 diagnostics 和导出器插件后，导出器才会附加。

### OpenTelemetry 与 OTLP 的区别

- **OpenTelemetry（OTel）**：用于追踪、指标和日志的数据模型 + SDK。
- **OTLP**：用于将 OTel 数据导出到采集器 / 后端的线协议。
- OpenClaw 当前通过 **OTLP/HTTP（protobuf）** 导出。

### 导出的信号

- **指标**：计数器 + 直方图（令牌使用量、消息流、排队）。
- **追踪**：模型使用和 webhook / 消息处理的 span。
- **日志**：当启用 `diagnostics.otel.logs` 时通过 OTLP 导出。日志量可能很高；请注意 `logging.level` 和导出器过滤器。

### 诊断事件目录

模型使用：

- `model.usage`：令牌、成本、时长、上下文、provider / model / channel、会话 ID。

消息流：

- `webhook.received`：每个渠道的 webhook 入口。
- `webhook.processed`：webhook 已处理 + 时长。
- `webhook.error`：webhook 处理器错误。
- `message.queued`：消息已排队等待处理。
- `message.processed`：结果 + 时长 + 可选错误。

队列 + 会话：

- `queue.lane.enqueue`：命令队列 lane 入队 + 深度。
- `queue.lane.dequeue`：命令队列 lane 出队 + 等待时间。
- `session.state`：会话状态转换 + 原因。
- `session.stuck`：会话卡住警告 + 已持续时长。
- `run.attempt`：运行重试 / 尝试元数据。
- `diagnostic.heartbeat`：聚合计数器（webhook / 队列 / 会话）。

### 启用诊断（不使用导出器）

如果你希望诊断事件可供插件或自定义接收端使用，请使用此配置：

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### diagnostics 标志（定向日志）

使用标志可启用额外的、定向的调试日志，而无需提高 `logging.level`。标志不区分大小写，并支持通配符（例如 `telegram.*` 或 `*`）。

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

环境变量覆盖（一次性）：

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

说明：

- 标志日志会进入标准日志文件（与 `logging.file` 相同）。
- 输出仍会根据 `logging.redactSensitive` 进行脱敏。
- 完整指南：[/diagnostics/flags](/zh-CN/diagnostics/flags)。

### 导出到 OpenTelemetry

诊断可以通过 `diagnostics-otel` 插件（OTLP/HTTP）导出。这适用于任何接受 OTLP/HTTP 的 OpenTelemetry 采集器 / 后端。

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

说明：

- 你也可以使用 `openclaw plugins enable diagnostics-otel` 启用该插件。
- `protocol` 当前仅支持 `http/protobuf`。`grpc` 会被忽略。
- 指标包括令牌使用量、成本、上下文大小、运行时长，以及消息流计数器 / 直方图（webhook、排队、会话状态、队列深度 / 等待时间）。
- 可通过 `traces` / `metrics` 切换追踪 / 指标（默认：开启）。启用后，追踪包含模型使用 span，以及 webhook / 消息处理 span。
- 默认不会导出原始模型 / 工具内容。只有在你的采集器和保留策略已获批准可处理提示词、响应、工具或系统提示文本时，才使用 `diagnostics.otel.captureContent`。
- 当你的采集器需要鉴权时，请设置 `headers`。
- 支持的环境变量：`OTEL_EXPORTER_OTLP_ENDPOINT`、`OTEL_SERVICE_NAME`、`OTEL_EXPORTER_OTLP_PROTOCOL`。

### 导出的指标（名称 + 类型）

模型使用：

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）

消息流：

- `openclaw.webhook.received`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（计数器，属性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.processed`（计数器，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.outcome`）

队列 + 会话：

- `openclaw.queue.lane.enqueue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.depth`（直方图，属性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方图，属性：`openclaw.lane`）
- `openclaw.session.state`（计数器，属性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

### 导出的 span（名称 + 关键属性）

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input / output / cache_read / cache_write / total）
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`、`gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.errorCategory`、`openclaw.tool.params.*`
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`、`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.chatId`、`openclaw.messageId`、`openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`

当显式启用内容捕获时，模型 / 工具 span 还可以包含有界、已脱敏的 `openclaw.content.*` 属性，适用于你选择启用的特定内容类别。

### 采样 + 刷新

- 追踪采样：`diagnostics.otel.sampleRate`（0.0–1.0，仅根 span）。
- 指标导出间隔：`diagnostics.otel.flushIntervalMs`（最小 1000 ms）。

### 协议说明

- 可通过 `diagnostics.otel.endpoint` 或 `OTEL_EXPORTER_OTLP_ENDPOINT` 设置 OTLP/HTTP 端点。
- 如果端点已包含 `/v1/traces` 或 `/v1/metrics`，则会按原样使用。
- 如果端点已包含 `/v1/logs`，则会按原样用于日志。
- `diagnostics.otel.logs` 会为主日志记录器输出启用 OTLP 日志导出。

### 日志导出行为

- OTLP 日志使用与写入 `logging.file` 的相同结构化记录。
- 遵循 `logging.level`（文件日志级别）。控制台脱敏**不会**应用到 OTLP 日志。
- 高流量安装应优先使用 OTLP 采集器的采样 / 过滤功能。

## 故障排除提示

- **Gateway 网关无法访问？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，并且是否正在向 `logging.file` 中的文件路径写入。
- **需要更多细节？** 将 `logging.level` 设置为 `debug` 或 `trace` 后重试。

## 相关内容

- [Gateway Logging Internals](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [Diagnostics](/zh-CN/gateway/configuration-reference#diagnostics) — OpenTelemetry 导出和缓存追踪配置
