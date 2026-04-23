---
read_when:
    - 诊断渠道连接或 Gateway 网关运行状况
    - 了解运行状况检查 CLI 命令和选项
summary: 运行状况检查命令和 Gateway 网关运行状况监控
title: 运行状况检查
x-i18n:
    generated_at: "2026-04-23T15:24:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af5631a83fc0747a996687c5b399289815658b6bb929950a4aa915cc7d47a1a
    source_path: gateway/health.md
    workflow: 15
---

# 运行状况检查（CLI）

用于验证渠道连接的简短指南，无需靠猜测。

## 快速检查

- `openclaw status` — 本地摘要：Gateway 网关可达性/模式、更新提示、已关联渠道的凭证存续时间、会话 + 最近活动。
- `openclaw status --all` — 完整的本地诊断（只读、彩色输出，可安全复制粘贴用于调试）。
- `openclaw status --deep` — 向正在运行的 Gateway 网关请求实时运行状况探测（`health` 且 `probe:true`），在支持时还包括按账户划分的渠道探测。
- `openclaw health` — 向正在运行的 Gateway 网关请求其运行状况快照（仅限 WS；CLI 不会直接连接渠道套接字）。
- `openclaw health --verbose` — 强制执行实时运行状况探测，并打印 Gateway 网关连接详细信息。
- `openclaw health --json` — 机器可读的运行状况快照输出。
- 在 WhatsApp/WebChat 中将 `/status` 作为独立消息发送，以获取状态回复，而不调用智能体。
- 日志：跟踪 `/tmp/openclaw/openclaw-*.log`，并筛选 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

## 深度诊断

- 磁盘上的凭证：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（`mtime` 应该是最近的）。
- 会话存储：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路径可在配置中覆盖）。数量和最近的接收方会通过 `status` 显示。
- 重新关联流程：当日志中出现状态码 409–515 或 `loggedOut` 时，运行 `openclaw channels logout && openclaw channels login --verbose`。（注意：配对后，QR 登录流程会在状态 515 时自动重启一次。）
- 默认启用诊断。除非设置了 `diagnostics.enabled: false`，否则 Gateway 网关会记录运行事实。内存事件会记录 RSS/heap 字节数、阈值压力和增长压力。超大负载事件会记录被拒绝、截断或分块处理的内容，以及可用时的大小和限制。它们不会记录消息文本、附件内容、webhook 正文、原始请求或响应正文、令牌、cookie 或机密值。相同的心跳也会启动有界稳定性记录器，可通过 `openclaw gateway stability` 或 `diagnostics.stability` Gateway 网关 RPC 使用。当存在事件时，致命的 Gateway 网关退出、关闭超时以及重启启动失败会将最新的记录器快照持久化到 `~/.openclaw/logs/stability/`；可使用 `openclaw gateway stability --bundle latest` 检查最新保存的 bundle。
- 对于 bug 报告，运行 `openclaw gateway diagnostics export` 并附上生成的 zip。导出内容包含 Markdown 摘要、最新的稳定性 bundle、已脱敏的日志元数据、已脱敏的 Gateway 网关 status/health 快照以及配置结构。它设计为可共享：聊天文本、webhook 正文、工具输出、凭证、cookie、账户/消息标识符和机密值都会被省略或脱敏。参见 [诊断导出](/zh-CN/gateway/diagnostics)。

## 运行状况监控配置

- `gateway.channelHealthCheckMinutes`：Gateway 网关检查渠道运行状况的频率。默认值：`5`。设置为 `0` 可全局禁用运行状况监控重启。
- `gateway.channelStaleEventThresholdMinutes`：已连接渠道在运行状况监控将其视为过期并重启前，可保持空闲的时长。默认值：`30`。保持此值大于或等于 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账户在滚动一小时内的运行状况监控重启上限。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：为特定渠道禁用运行状况监控重启，同时保持全局监控启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账户覆盖项，优先于渠道级设置。
- 这些按渠道划分的覆盖项适用于当前暴露这些选项的内置渠道监控器：Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 当出现故障时

- `logged out` 或状态码 409–515 → 使用 `openclaw channels logout`，然后运行 `openclaw channels login` 重新关联。
- Gateway 网关不可达 → 启动它：`openclaw gateway --port 18789`（如果端口繁忙，使用 `--force`）。
- 没有入站消息 → 确认已关联的手机处于在线状态，并且允许该发送者（`channels.whatsapp.allowFrom`）；对于群聊，确保允许列表 + 提及规则匹配（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 专用的 “health” 命令

`openclaw health` 会向正在运行的 Gateway 网关请求其运行状况快照（CLI
不会直接连接渠道套接字）。默认情况下，它可以返回一个较新的已缓存 Gateway 网关快照；
随后 Gateway 网关会在后台刷新该缓存。`openclaw health --verbose` 会改为强制
执行实时探测。该命令会报告已关联凭证/凭证存续时间（如果可用）、
按渠道划分的探测摘要、会话存储摘要以及探测耗时。如果 Gateway 网关不可达，
或探测失败/超时，它会以非零状态退出。

选项：

- `--json`：机器可读的 JSON 输出
- `--timeout <ms>`：覆盖默认的 10 秒探测超时
- `--verbose`：强制执行实时探测，并打印 Gateway 网关连接详细信息
- `--debug`：`--verbose` 的别名

运行状况快照包括：`ok`（布尔值）、`ts`（时间戳）、`durationMs`（探测时间）、按渠道划分的状态、智能体可用性以及会话存储摘要。
