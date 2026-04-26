---
read_when:
    - 你需要一份面向初学者的 OpenClaw 日志概览
    - 你想要配置日志级别、格式或脱敏处理
    - 你正在进行故障排除，需要快速找到日志
summary: 文件日志、控制台输出、CLI 尾部跟踪，以及 Control UI 日志标签页
title: 日志
x-i18n:
    generated_at: "2026-04-26T19:16:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d4629a1d886d38061a9bb89c4b4e7720189de7647eee2174821070a12b600
    source_path: logging.md
    workflow: 15
---

OpenClaw 有两个主要的日志展示面：

- 由 Gateway 网关写入的**文件日志**（JSON 行）。
- 在终端和 Gateway 网关调试 UI 中显示的**控制台输出**。

Control UI 的**日志**标签页会尾随 Gateway 网关文件日志。本页说明日志位于何处、如何读取，以及如何配置日志级别和格式。

## 日志位置

默认情况下，Gateway 网关会在以下位置写入滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 Gateway 网关宿主机的本地时区。

每个文件在达到 `logging.maxFileBytes` 时轮转（默认值：100 MB）。
OpenClaw 会在当前活动文件旁边最多保留五个带编号的归档文件，例如
`openclaw-YYYY-MM-DD.1.log`，并继续写入新的活动日志文件，而不是抑制诊断信息。

你可以在 `~/.openclaw/openclaw.json` 中覆盖此设置：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时尾随（推荐）

使用 CLI 通过 RPC 尾随 Gateway 网关日志文件：

```bash
openclaw logs --follow
```

当前有用的选项：

- `--local-time`：使用你的本地时区渲染时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway 网关 RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（这里通过共享客户端层接受）

输出模式：

- **TTY 会话**：美观、带颜色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：行分隔 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你显式传入 `--url` 时，CLI 不会自动应用配置或环境变量中的凭证；如果目标 Gateway 网关需要认证，请自行包含 `--token`。

在 JSON 模式下，CLI 会输出带有 `type` 标签的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的原始日志行

如果本地 local loopback Gateway 网关请求配对，`openclaw logs` 会自动回退到已配置的本地日志文件。显式指定的 `--url` 目标不会使用此回退。

如果 Gateway 网关无法访问，CLI 会输出一条简短提示，建议运行：

```bash
openclaw doctor
```

### Control UI（网页）

Control UI 的**日志**标签页会使用 `logs.tail` 尾随同一个文件。
有关如何打开它，请参见 [/web/control-ui](/zh-CN/web/control-ui)。

### 仅渠道日志

要筛选渠道活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目，以渲染结构化输出（时间、级别、子系统、消息）。

### 控制台输出

控制台日志是**TTY 感知的**，并经过格式化以提高可读性：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info/warn/error）
- 可选紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway 网关 WebSocket 日志

`openclaw gateway` 还提供用于 RPC 流量的 WebSocket 协议日志：

- 普通模式：仅显示重要结果（错误、解析错误、慢调用）
- `--verbose`：显示全部请求/响应流量
- `--ws-log auto|compact|full`：选择详细日志的渲染样式
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

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖这两者（例如 `OPENCLAW_LOG_LEVEL=debug`）。该环境变量优先于配置文件，因此你可以在不编辑 `openclaw.json` 的情况下，仅为单次运行提高详细程度。你还可以传递全局 CLI 选项 **`--log-level <level>`**（例如，`openclaw --log-level debug gateway run`），它会为该命令覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会更改文件日志级别。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：适合人类阅读，带颜色和时间戳。
- `compact`：更紧凑的输出（最适合长时间会话）。
- `json`：每行一个 JSON（用于日志处理器）。

### 脱敏处理

OpenClaw 可以在敏感令牌进入控制台输出、文件日志、OTLP 日志记录或持久化会话转录文本之前对其进行脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认值：`tools`）
- `logging.redactPatterns`：正则表达式字符串列表，用于覆盖默认集合

文件日志和会话转录仍然保持为 JSONL，但在写入磁盘前，匹配到的秘密值会先在行或消息中被屏蔽。脱敏处理是尽力而为的：它会应用于承载文本的消息内容和日志字符串，但不会覆盖每个标识符或二进制负载字段。

## Diagnostics 和 OpenTelemetry

Diagnostics 是用于模型运行和消息流遥测（webhook、排队、会话状态）的结构化、机器可读事件。它们**不会**替代日志——它们用于驱动指标、追踪和导出器。无论你是否导出它们，事件都会在进程内发出。

两个相邻的展示面：

- **OpenTelemetry 导出**——通过 OTLP/HTTP 将指标、追踪和日志发送到任何兼容 OpenTelemetry 的收集器或后端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、指标 / span 名称、环境变量和隐私模型位于专门页面：
  [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- **Diagnostics 标志**——有针对性的调试日志标志，可将额外日志路由到
  `logging.file`，而无需提高 `logging.level`。这些标志不区分大小写，并支持通配符（`telegram.*`、`*`）。可在 `diagnostics.flags`
  下配置，或通过 `OPENCLAW_DIAGNOSTICS=...` 环境变量覆盖。完整指南：
  [Diagnostics 标志](/zh-CN/diagnostics/flags)。

要为插件或自定义接收端启用 Diagnostics 事件，而不使用 OTLP 导出：

```json5
{
  diagnostics: { enabled: true },
}
```

如需将 OTLP 导出到收集器，请参见 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 故障排除提示

- **Gateway 网关无法访问？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，以及是否正在写入 `logging.file` 中的文件路径。
- **需要更多细节？** 将 `logging.level` 设置为 `debug` 或 `trace` 后重试。

## 相关内容

- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — OTLP/HTTP 导出、指标 / span 目录、隐私模型
- [Diagnostics 标志](/zh-CN/diagnostics/flags) — 有针对性的调试日志标志
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
