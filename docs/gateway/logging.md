---
read_when:
    - 更改日志输出或格式
    - 调试 CLI 或 Gateway 网关输出
summary: 日志展示界面、文件日志、WS 日志样式，以及控制台格式化
title: Gateway 网关日志记录
x-i18n:
    generated_at: "2026-04-26T19:16:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b3904ee693bdabc74b56e6dd924f12215ce741496a03eafc15f74258ad036e
    source_path: gateway/logging.md
    workflow: 15
---

# 日志记录

如需面向用户的概览（CLI + Control UI + 配置），请参见 [/logging](/zh-CN/logging)。

OpenClaw 有两个日志“展示界面”：

- **控制台输出**（你在终端 / 调试 UI 中看到的内容）。
- **文件日志**（JSON 行格式），由 Gateway 网关日志记录器写入。

## 基于文件的日志记录器

- 默认的滚动日志文件位于 `/tmp/openclaw/` 下（每天一个文件）：`openclaw-YYYY-MM-DD.log`
  - 日期使用 Gateway 网关主机的本地时区。
- 活动日志文件会在达到 `logging.maxFileBytes` 时轮转（默认：100 MB），最多保留五个带编号的归档文件，并继续写入一个新的活动文件。
- 可以通过 `~/.openclaw/openclaw.json` 配置日志文件路径和级别：
  - `logging.file`
  - `logging.level`

文件格式为每行一个 JSON 对象。

Control UI 的 Logs 选项卡会通过 Gateway 网关（`logs.tail`）持续跟踪这个文件。
CLI 也可以执行相同操作：

```bash
openclaw logs --follow
```

**详细输出与日志级别**

- **文件日志**仅由 `logging.level` 控制。
- `--verbose` 只影响**控制台详细程度**（以及 WS 日志样式）；它**不会**提高文件日志级别。
- 若要在文件日志中捕获仅详细模式下可见的细节，请将 `logging.level` 设置为 `debug` 或 `trace`。

## 控制台捕获

CLI 会捕获 `console.log/info/warn/error/debug/trace`，并将其写入文件日志，同时仍然输出到 stdout/stderr。

你可以通过以下配置独立调整控制台详细程度：

- `logging.consoleLevel`（默认 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 脱敏

OpenClaw 可以在日志或转录输出离开进程之前屏蔽敏感令牌。同一套脱敏策略会应用到控制台、文件日志、OTLP 日志记录以及会话转录文本输出端，因此匹配到的敏感值会在 JSONL 行或消息写入磁盘之前被屏蔽。

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：正则表达式字符串数组（覆盖默认值）
  - 使用原始正则字符串（自动附加 `gi`），如果你需要自定义标志，可使用 `/pattern/flags`。
  - 匹配项会保留前 6 个字符和后 4 个字符进行遮罩（长度 >= 18），否则显示为 `***`。
  - 默认规则涵盖常见的密钥赋值、CLI 标志、JSON 字段、bearer 标头、PEM 块以及常见令牌前缀。

## Gateway 网关 WebSocket 日志

Gateway 网关会以两种模式打印 WebSocket 协议日志：

- **普通模式（不使用 `--verbose`）**：仅打印“值得关注”的 RPC 结果：
  - 错误（`ok=false`）
  - 慢调用（默认阈值：`>= 50ms`）
  - 解析错误
- **详细模式（`--verbose`）**：打印所有 WS 请求/响应流量。

### WS 日志样式

`openclaw gateway` 支持按 Gateway 网关切换样式：

- `--ws-log auto`（默认）：普通模式下会进行优化；详细模式下使用紧凑输出
- `--ws-log compact`：详细模式下使用紧凑输出（配对的请求/响应）
- `--ws-log full`：详细模式下使用完整的逐帧输出
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
# 优化模式（仅错误/慢调用）
openclaw gateway

# 显示所有 WS 流量（配对）
openclaw gateway --verbose --ws-log compact

# 显示所有 WS 流量（完整元数据）
openclaw gateway --verbose --ws-log full
```

## 控制台格式化（子系统日志记录）

控制台格式化器会**感知 TTY**，并输出一致且带前缀的行。
子系统日志记录器会让输出保持分组并便于快速扫描。

行为：

- 每行都有**子系统前缀**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系统颜色**（每个子系统颜色稳定）以及级别颜色
- **当输出为 TTY 或环境看起来像是富终端时启用颜色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），并遵循 `NO_COLOR`
- **缩短的子系统前缀**：去掉前导 `gateway/` 和 `channels/`，保留最后 2 个段（例如 `whatsapp/outbound`）
- **按子系统划分的子日志记录器**（自动加前缀 + 结构化字段 `{ subsystem }`）
- 用于 QR/UX 输出的 **`logRaw()`**（无前缀、无格式化）
- **控制台样式**（例如 `pretty | compact | json`）
- **控制台日志级别**与文件日志级别分离（当 `logging.level` 设置为 `debug`/`trace` 时，文件仍保留完整细节）
- **WhatsApp 消息正文**会以 `debug` 级别记录（使用 `--verbose` 才能看到）

这样既能保持现有文件日志稳定，又能让交互式输出更便于扫描。

## 相关内容

- [日志记录](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)
- [诊断导出](/zh-CN/gateway/diagnostics)
