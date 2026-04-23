---
read_when:
    - 诊断渠道连接性或 Gateway 网关健康状况
    - 了解健康检查 CLI 命令和选项
summary: 健康检查命令与 Gateway 网关健康监控
title: 健康检查
x-i18n:
    generated_at: "2026-04-23T20:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c018be2b8166849d47ca848f96b57d952cc552e86b74ed8cef3ffa72d65a184
    source_path: gateway/health.md
    workflow: 15
---

# 健康检查（CLI）

用于在不靠猜测的情况下验证渠道连接性的简短指南。

## 快速检查

- `openclaw status` — 本地摘要：Gateway 网关可达性/模式、更新提示、已链接渠道认证时长、会话 + 最近活动。
- `openclaw status --all` — 完整的本地诊断（只读、有颜色，可安全粘贴用于调试）。
- `openclaw status --deep` — 向正在运行的 Gateway 网关请求实时健康探测（`health` 且 `probe:true`），包括在支持时的按账户渠道探测。
- `openclaw health` — 向正在运行的 Gateway 网关请求其健康快照（仅 WS；CLI 不会直接连接渠道套接字）。
- `openclaw health --verbose` — 强制执行实时健康探测，并打印 Gateway 网关连接详情。
- `openclaw health --json` — 机器可读的健康快照输出。
- 在 WhatsApp/WebChat 中发送独立消息 `/status`，可在不调用智能体的情况下获取状态回复。
- 日志：tail `/tmp/openclaw/openclaw-*.log`，并筛选 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

## 深度诊断

- 磁盘上的凭证：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 应该较新）。
- 会话存储：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路径可在配置中覆盖）。数量和最近接收方会通过 `status` 显示。
- 重新链接流程：当日志中出现状态码 409–515 或 `loggedOut` 时，运行 `openclaw channels logout && openclaw channels login --verbose`。（注意：扫码登录流程会在配对后针对状态 515 自动重启一次。）
- 诊断默认启用。除非设置了 `diagnostics.enabled: false`，否则 Gateway 网关会记录运行事实。memory 事件会记录 RSS/heap 字节计数、阈值压力和增长压力。超大载荷事件会记录哪些内容被拒绝、截断或分块，以及可用时的大小和限制。它们不会记录消息文本、附件内容、webhook 正文、原始请求或响应正文、令牌、cookie 或秘密值。相同的 heartbeat 还会启动有界稳定性记录器，可通过 `openclaw gateway stability` 或 `diagnostics.stability` Gateway 网关 RPC 获取。当存在事件时，致命的 Gateway 网关退出、关闭超时和重启启动失败会将最新记录器快照持久化到 `~/.openclaw/logs/stability/`；使用 `openclaw gateway stability --bundle latest` 检查最新保存的 bundle。
- 对于 bug 报告，请运行 `openclaw gateway diagnostics export` 并附上生成的 zip。导出内容会合并 Markdown 摘要、最新稳定性 bundle、已脱敏的日志元数据、已脱敏的 Gateway 网关 status/health 快照以及配置形状。它是为共享而设计的：聊天文本、webhook 正文、工具输出、凭证、cookie、账户/消息标识符和秘密值都会被省略或脱敏。参见 [Diagnostics Export](/zh-CN/gateway/diagnostics)。

## 健康监控器配置

- `gateway.channelHealthCheckMinutes`：Gateway 网关检查渠道健康状态的频率。默认值：`5`。设为 `0` 可全局禁用健康监控器重启。
- `gateway.channelStaleEventThresholdMinutes`：已连接的渠道在被健康监控器视为陈旧并重启之前允许空闲的最长时间。默认值：`30`。请保持该值大于或等于 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：健康监控器对每个渠道/账户在滚动一小时内的重启次数上限。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保持全局监控启用的同时，为特定渠道禁用健康监控器重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账户覆盖项，优先级高于渠道级设置。
- 这些按渠道划分的覆盖项适用于当前暴露这些能力的内置渠道监控器：Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 当出现故障时

- `logged out` 或状态码 409–515 → 使用 `openclaw channels logout` 然后 `openclaw channels login` 重新链接。
- Gateway 网关不可达 → 启动它：`openclaw gateway --port 18789`（如果端口被占用，使用 `--force`）。
- 没有入站消息 → 确认已链接手机在线，并且发送者已被允许（`channels.whatsapp.allowFrom`）；对于群聊，请确保允许列表和提及规则匹配（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 专用的 “health” 命令

`openclaw health` 会向正在运行的 Gateway 网关请求其健康快照（CLI 不会直接连接渠道
套接字）。默认情况下，它可以返回一个最新的缓存 Gateway 网关快照；随后
Gateway 网关会在后台刷新该缓存。`openclaw health --verbose` 则会强制
执行实时探测。该命令会在可用时报告已链接凭证/认证时长、
按渠道划分的探测摘要、会话存储摘要以及探测耗时。如果
Gateway 网关不可达，或探测失败/超时，它会以非零状态退出。

选项：

- `--json`：机器可读 JSON 输出
- `--timeout <ms>`：覆盖默认的 10 秒探测超时
- `--verbose`：强制实时探测，并打印 Gateway 网关连接详情
- `--debug`：`--verbose` 的别名

健康快照包括：`ok`（布尔值）、`ts`（时间戳）、`durationMs`（探测耗时）、按渠道划分的状态、智能体可用性以及会话存储摘要。
