---
read_when:
    - 你需要一份适合初学者的日志概览
    - 你想配置日志级别或格式
    - 你正在进行故障排除，需要快速找到日志【อ่านข้อความเต็มanalysis to=functions.read  天天大奖彩票站_input={"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-qa-testing/SKILL.md"} code
summary: 日志概览：文件日志、控制台输出、CLI 尾随和控制 UI
title: 日志概览
x-i18n:
    generated_at: "2026-04-23T20:53:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# 日志

OpenClaw 有两个主要日志界面：

- **文件日志**（JSON 行格式），由 Gateway 网关写入。
- **控制台输出**，显示在终端和 Gateway 网关调试 UI 中。

控制 UI 的 **Logs** 标签页会实时跟随 gateway 文件日志。本页说明
日志存放位置、如何读取日志，以及如何配置日志级别和格式。

## 日志存放位置

默认情况下，Gateway 网关会将滚动日志文件写入：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主机的本地时区。

你可以在 `~/.openclaw/openclaw.json` 中覆盖它：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时 tail（推荐）

使用 CLI 通过 RPC 实时 tail gateway 日志文件：

```bash
openclaw logs --follow
```

当前常用选项：

- `--local-time`：使用你的本地时区渲染时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway 网关 RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（通过共享客户端层在这里接受）

输出模式：

- **TTY 会话**：美观、带颜色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：行分隔 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你传入显式 `--url` 时，CLI 不会自动应用配置或
环境变量凭证；如果目标 Gateway 网关需要认证，请自行传入 `--token`。

在 JSON 模式下，CLI 会输出带 `type` 标记的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的原始日志行

如果本地 loopback Gateway 网关要求配对，`openclaw logs` 会自动回退到
已配置的本地日志文件。显式 `--url` 目标不会使用这个回退。

如果 Gateway 网关不可达，CLI 会打印一个简短提示，让你运行：

```bash
openclaw doctor
```

### 控制 UI（web）

控制 UI 的 **Logs** 标签页会使用 `logs.tail` 跟随同一个文件。
有关如何打开它，请参阅 [/web/control-ui](/zh-CN/web/control-ui)。

### 仅渠道日志

若要过滤渠道活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和控制 UI 会解析这些
条目，以渲染结构化输出（时间、级别、子系统、消息）。

### 控制台输出

控制台日志是**TTY 感知**的，并针对可读性进行格式化：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info/warn/error）
- 可选的 compact 或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway 网关 WebSocket 日志

`openclaw gateway` 还具有用于 RPC 流量的 WebSocket 协议日志：

- 普通模式：仅记录有意义的结果（错误、解析错误、慢调用）
- `--verbose`：记录所有请求/响应流量
- `--ws-log auto|compact|full`：选择 verbose 渲染样式
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 配置日志

所有日志配置都位于 `~/.openclaw/openclaw.json` 中的 `logging` 下。

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

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖这两项（例如 `OPENCLAW_LOG_LEVEL=debug`）。环境变量优先于配置文件，因此你可以在不编辑 `openclaw.json` 的情况下，仅为单次运行提升详细程度。你也可以传入全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会为该命令覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会更改
文件日志级别。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：适合人类阅读，带颜色和时间戳。
- `compact`：更紧凑的输出（最适合长会话）。
- `json`：每行一个 JSON（用于日志处理器）。

### 脱敏

工具摘要可在输出到控制台之前对敏感令牌进行脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：用于覆盖默认集合的正则表达式字符串列表

脱敏**仅影响控制台输出**，不会更改文件日志。

## Diagnostics + OpenTelemetry

Diagnostics 是用于模型运行**以及**
消息流遥测（webhooks、排队、会话状态）的结构化、机器可读事件。它们**不会**替代日志；它们的存在是为了馈送指标、追踪和其他导出器。

Diagnostics 事件会在进程内发出，但只有在启用 diagnostics + 对应导出器插件时，导出器才会附加。

### OpenTelemetry 与 OTLP

- **OpenTelemetry（OTel）**：用于 traces、metrics 和 logs 的数据模型 + SDK。
- **OTLP**：将 OTel 数据导出到 collector/backend 所使用的线协议。
- OpenClaw 当前通过 **OTLP/HTTP（protobuf）** 导出。

### 导出的信号

- **Metrics**：计数器 + 直方图（token 用量、消息流、排队）。
- **Traces**：模型使用 + webhook/消息处理的 spans。
- **Logs**：在启用 `diagnostics.otel.logs` 时通过 OTLP 导出。日志
  量可能很大；请留意 `logging.level` 和导出器过滤器。

### Diagnostics 事件目录

模型使用：

- `model.usage`：tokens、成本、时长、上下文、provider/model/channel、session ids。

消息流：

- `webhook.received`：每个渠道的 webhook 入口。
- `webhook.processed`：webhook 已处理 + 时长。
- `webhook.error`：webhook 处理器错误。
- `message.queued`：消息已入队等待处理。
- `message.processed`：结果 + 时长 + 可选错误。

队列 + 会话：

- `queue.lane.enqueue`：命令队列 lane 入队 + 深度。
- `queue.lane.dequeue`：命令队列 lane 出队 + 等待时间。
- `session.state`：会话状态迁移 + 原因。
- `session.stuck`：会话卡住警告 + 持续时长。
- `run.attempt`：运行重试/尝试元数据。
- `diagnostic.heartbeat`：聚合计数器（webhooks/queue/session）。

### 启用 diagnostics（无导出器）

如果你希望 diagnostics 事件可供插件或自定义 sink 使用，请使用：

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Diagnostics 标志（定向日志）

使用标志可开启额外的、定向的调试日志，而无需提高 `logging.level`。
标志不区分大小写，并支持通配符（例如 `telegram.*` 或 `*`）。

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

- 标志日志会写入标准日志文件（与 `logging.file` 相同）。
- 输出仍会根据 `logging.redactSensitive` 进行脱敏。
- 完整指南：[/diagnostics/flags](/zh-CN/diagnostics/flags)。

### 导出到 OpenTelemetry

Diagnostics 可通过 `diagnostics-otel` 插件（OTLP/HTTP）导出。它
适用于任何接受 OTLP/HTTP 的 OpenTelemetry collector/backend。

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
      "flushIntervalMs": 60000
    }
  }
}
```

说明：

- 你也可以使用 `openclaw plugins enable diagnostics-otel` 启用该插件。
- `protocol` 当前仅支持 `http/protobuf`。`grpc` 会被忽略。
- Metrics 包括 token 用量、成本、上下文大小、运行时长，以及消息流
  计数器/直方图（webhooks、排队、会话状态、队列深度/等待时间）。
- Traces/metrics 可通过 `traces` / `metrics` 开关控制（默认：开启）。Traces
  在启用时包括模型使用 spans，以及 webhook/消息处理 spans。
- 当你的 collector 需要认证时，请设置 `headers`。
- 支持的环境变量：`OTEL_EXPORTER_OTLP_ENDPOINT`、
  `OTEL_SERVICE_NAME`、`OTEL_EXPORTER_OTLP_PROTOCOL`。

### 已导出的 metrics（名称 + 类型）

模型使用：

- `openclaw.tokens`（counter，attrs：`openclaw.token`、`openclaw.channel`、
  `openclaw.provider`、`openclaw.model`）
- `openclaw.cost.usd`（counter，attrs：`openclaw.channel`、`openclaw.provider`、
  `openclaw.model`）
- `openclaw.run.duration_ms`（histogram，attrs：`openclaw.channel`、
  `openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（histogram，attrs：`openclaw.context`、
  `openclaw.channel`、`openclaw.provider`、`openclaw.model`）

消息流：

- `openclaw.webhook.received`（counter，attrs：`openclaw.channel`、
  `openclaw.webhook`）
- `openclaw.webhook.error`（counter，attrs：`openclaw.channel`、
  `openclaw.webhook`）
- `openclaw.webhook.duration_ms`（histogram，attrs：`openclaw.channel`、
  `openclaw.webhook`）
- `openclaw.message.queued`（counter，attrs：`openclaw.channel`、
  `openclaw.source`）
- `openclaw.message.processed`（counter，attrs：`openclaw.channel`、
  `openclaw.outcome`）
- `openclaw.message.duration_ms`（histogram，attrs：`openclaw.channel`、
  `openclaw.outcome`）

队列 + 会话：

- `openclaw.queue.lane.enqueue`（counter，attrs：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（counter，attrs：`openclaw.lane`）
- `openclaw.queue.depth`（histogram，attrs：`openclaw.lane` 或
  `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（histogram，attrs：`openclaw.lane`）
- `openclaw.session.state`（counter，attrs：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（counter，attrs：`openclaw.state`）
- `openclaw.session.stuck_age_ms`（histogram，attrs：`openclaw.state`）
- `openclaw.run.attempt`（counter，attrs：`openclaw.attempt`）

### 已导出的 spans（名称 + 关键属性）

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.sessionKey`、`openclaw.sessionId`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`、
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.chatId`、
    `openclaw.messageId`、`openclaw.sessionKey`、`openclaw.sessionId`、
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`、
    `openclaw.sessionKey`、`openclaw.sessionId`

### 采样 + 刷新

- Trace 采样：`diagnostics.otel.sampleRate`（0.0–1.0，仅根 spans）。
- Metric 导出间隔：`diagnostics.otel.flushIntervalMs`（最小 1000ms）。

### 协议说明

- OTLP/HTTP 端点可通过 `diagnostics.otel.endpoint` 或
  `OTEL_EXPORTER_OTLP_ENDPOINT` 设置。
- 如果端点已包含 `/v1/traces` 或 `/v1/metrics`，则按原样使用。
- 如果端点已包含 `/v1/logs`，则日志也按原样使用它。
- `diagnostics.otel.logs` 会为主日志记录器输出启用 OTLP 日志导出。

### 日志导出行为

- OTLP 日志使用与写入 `logging.file` 相同的结构化记录。
- 遵循 `logging.level`（文件日志级别）。控制台脱敏**不会**应用于 OTLP 日志。
- 高日志量部署应优先使用 OTLP collector 侧的采样/过滤。

## 故障排除提示

- **Gateway 网关不可达？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，并且是否写入到
  `logging.file` 中指定的文件路径。
- **需要更多细节？** 将 `logging.level` 设为 `debug` 或 `trace` 后重试。

## 相关内容

- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [Diagnostics](/zh-CN/gateway/configuration-reference#diagnostics) — OpenTelemetry 导出和缓存追踪配置
