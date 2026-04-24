---
read_when:
    - 调试或配置 WebChat 访问
summary: 用于聊天 UI 的 Loopback WebChat 静态主机和 Gateway 网关 WS 用法
title: WebChat
x-i18n:
    generated_at: "2026-04-24T21:20:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

状态：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- 一个面向 gateway 的原生聊天 UI（不嵌入浏览器，也不使用本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终会返回到 WebChat。

## 快速开始

1. 启动 gateway。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天标签页。
3. 确保已配置有效的 gateway 身份验证路径（默认使用 shared-secret，即使在 loopback 上也是如此）。

## 它的工作方式（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 为了稳定性进行了边界限制：Gateway 网关可能会截断长文本字段、省略较重的元数据，并将超大条目替换为 `[chat.history omitted: message too large]`。
- `chat.history` 还会进行显示规范化：仅运行时存在的 OpenClaw 上下文、入站信封包装器、内联投递指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄漏的 ASCII/全角模型控制令牌，都会从可见文本中移除；而且当 assistant 条目的全部可见文本仅为精确的静默令牌 `NO_REPLY` / `no_reply` 时，该条目会被省略。
- `chat.inject` 会将一条 assistant 注释直接追加到转录中，并广播给 UI（不会运行智能体）。
- 已中止的运行可能会让部分 assistant 输出继续在 UI 中可见。
- 当存在已缓冲输出时，Gateway 网关会将已中止的部分 assistant 文本持久化到转录历史中，并为这些条目标记中止元数据。
- 历史记录始终从 gateway 获取（不会监视本地文件）。
- 如果 gateway 不可达，WebChat 为只读。

## Control UI 智能体工具面板

- Control UI 的 `/agents` Tools 面板有两个独立视图：
  - **当前可用** 使用 `tools.effective(sessionKey=...)`，显示当前会话在运行时实际可以使用的内容，包括核心、插件和渠道拥有的工具。
  - **工具配置** 使用 `tools.catalog`，并继续聚焦于配置文件、覆盖项和目录语义。
- 运行时可用性是会话范围的。在同一智能体上切换会话可能会改变 **当前可用** 列表。
- 配置编辑器并不意味着运行时可用；实际访问仍遵循策略优先级（`allow`/`deny`、每个智能体以及提供商/渠道覆盖）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输 gateway WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当某个转录条目超过此限制时，Gateway 网关会截断长文本字段，并可能用占位符替换超大消息。客户端还可以发送每次请求的 `maxChars`，以便仅对单次 `chat.history` 调用覆盖此默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：shared-secret WebSocket 身份验证。
- `gateway.auth.allowTailscale`：启用后，浏览器中的 Control UI 聊天标签页可以使用 Tailscale Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：为位于身份感知型 **非 loopback** 代理源之后的浏览器客户端提供反向代理身份验证（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 gateway 目标。
- `session.*`：会话存储和主键默认值。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
