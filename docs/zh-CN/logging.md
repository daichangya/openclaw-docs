---
read_when:
    - 你需要一份面向初学者的 OpenClaw 日志概览
    - 你想要配置日志级别、格式或敏感信息脱敏处理
    - 你正在进行故障排除，需要快速找到日志
summary: 文件日志、控制台输出、CLI 尾部输出，以及 Control UI 的日志标签页
title: 日志
x-i18n:
    generated_at: "2026-04-26T06:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw 有两个主要的日志显示面：

- 由 Gateway 网关写入的**文件日志**（JSON 行）。
- 在终端和 Gateway 网关调试 UI 中显示的**控制台输出**。

Control UI 的**日志**标签页会对 gateway 文件日志执行尾部跟踪。本页说明日志位于哪里、如何读取日志，以及如何配置日志级别和格式。

## 日志位于哪里

默认情况下，Gateway 网关会在以下位置写入滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主机的本地时区。

每个文件在达到 `logging.maxFileBytes`（默认值：100 MB）时会轮转。OpenClaw 会在活动文件旁边最多保留五个带编号的归档文件，例如 `openclaw-YYYY-MM-DD.1.log`，并继续写入一个新的活动日志文件，而不是抑制诊断信息。

你可以在 `~/.openclaw/openclaw.json` 中覆盖此设置：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时尾部跟踪（推荐）

使用 CLI 通过 RPC 对 gateway 日志文件执行尾部跟踪：

```bash
openclaw logs --follow
```

当前实用选项：

- `--local-time`：以你的本地时区渲染时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（通过共享客户端层在此处接受）

输出模式：

- **TTY 会话**：美观、带颜色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：按行分隔的 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你传入显式的 `--url` 时，CLI 不会自动应用配置或环境变量凭证；如果目标 Gateway 网关需要身份验证，请自行附带 `--token`。

在 JSON 模式下，CLI 会输出带有 `type` 标签的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的日志行

如果 local loopback Gateway 网关请求配对，`openclaw logs` 会自动回退到已配置的本地日志文件。显式的 `--url` 目标不会使用此回退机制。

如果 Gateway 网关无法访问，CLI 会打印一条简短提示，建议运行：

```bash
openclaw doctor
```

### Control UI（网页）

Control UI 的**日志**标签页使用 `logs.tail` 对同一个文件执行尾部跟踪。如何打开它，请参阅 [/web/control-ui](/zh-CN/web/control-ui)。

### 仅渠道日志

如需筛选渠道活动（WhatsApp / Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目，以渲染结构化输出（时间、级别、子系统、消息）。

### 控制台输出

控制台日志是**TTY 感知**的，并针对可读性进行了格式化：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info / warn / error）
- 可选的紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway WebSocket 日志

`openclaw gateway` 还提供用于 RPC 流量的 WebSocket 协议日志：

- 普通模式：仅显示重要结果（错误、解析错误、慢调用）
- `--verbose`：显示所有请求 / 响应流量
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

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖这两者（例如 `OPENCLAW_LOG_LEVEL=debug`）。该环境变量优先于配置文件，因此你可以在不编辑 `openclaw.json` 的情况下，仅为单次运行提高详细程度。你也可以传递全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会为该命令覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会更改文件日志级别。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：适合人工阅读，带颜色和时间戳。
- `compact`：更紧凑的输出（最适合长时间会话）。
- `json`：每行一个 JSON（适用于日志处理器）。

### 脱敏处理

工具摘要可以在输出到控制台之前，对敏感令牌进行脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认值：`tools`）
- `logging.redactPatterns`：用于覆盖默认集合的正则表达式字符串列表

脱敏处理会在日志输出端应用于**控制台输出**、**路由到 stderr 的控制台诊断信息**以及**文件日志**。文件日志仍保持为 JSONL，但在将行写入磁盘之前，匹配的秘密值会被屏蔽。

## 诊断与 OpenTelemetry

诊断是结构化、机器可读的事件，用于模型运行和消息流遥测（webhook、排队、会话状态）。它们**不会**取代日志——它们为指标、追踪和导出器提供输入。无论你是否导出它们，事件都会在进程内发出。

两个相邻的显示面：

- **OpenTelemetry 导出** —— 通过 OTLP / HTTP 将指标、追踪和日志发送到任何兼容 OpenTelemetry 的收集器或后端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、指标 / span 名称、环境变量和隐私模型位于专门页面：[OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- **诊断标志** —— 定向调试日志标志，可在不提高 `logging.level` 的情况下，将额外日志路由到 `logging.file`。标志不区分大小写，并支持通配符（`telegram.*`、`*`）。可在 `diagnostics.flags` 下配置，或通过 `OPENCLAW_DIAGNOSTICS=...` 环境变量覆盖。完整指南请参阅：[诊断标志](/zh-CN/diagnostics/flags)。

如果你想为插件或自定义输出端启用诊断事件，而不使用 OTLP 导出：

```json5
{
  diagnostics: { enabled: true },
}
```

如需将 OTLP 导出到收集器，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 故障排除提示

- **Gateway 网关无法访问？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，以及是否正在向 `logging.file` 中的文件路径写入。
- **需要更多细节？** 将 `logging.level` 设置为 `debug` 或 `trace` 后重试。

## 相关内容

- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — OTLP / HTTP 导出、指标 / span 目录、隐私模型
- [诊断标志](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
