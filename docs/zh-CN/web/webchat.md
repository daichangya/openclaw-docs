---
read_when:
    - 调试或配置 WebChat 访问
summary: 用于聊天 UI 的 local loopback WebChat 静态主机和 Gateway 网关 WS 用法
title: WebChat
x-i18n:
    generated_at: "2026-04-23T23:06:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bfd1d81f19854aa05be90230cb849c68c045f416b576c34fd453606f5f1c285
    source_path: web/webchat.md
    workflow: 15
---

状态：macOS / iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- 一个面向 Gateway 网关的原生聊天 UI（不嵌入浏览器，也不使用本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回到 WebChat。

## 快速开始

1. 启动 Gateway 网关。
2. 打开 WebChat UI（macOS / iOS 应用）或 Control UI 聊天标签页。
3. 确保已配置有效的 Gateway 网关 auth 路径（默认是共享密钥，
   即使在 loopback 上也是如此）。

## 工作原理（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 为了稳定性是有界的：Gateway 网关可能会截断长文本字段、省略较重的元数据，并将超大条目替换为 `[chat.history omitted: message too large]`。
- `chat.history` 还会进行显示规范化：内联投递指令标签
  如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、纯文本工具调用 XML
  负载（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>` 以及被截断的工具调用块），还有
  泄漏的 ASCII / 全角模型控制 token，都会从可见文本中移除；
  而那些可见文本完整内容仅为精确静默
  token `NO_REPLY` / `no_reply` 的 assistant 条目也会被省略。
- `chat.inject` 会将 assistant 备注直接附加到 transcript 中，并广播给 UI（不会触发智能体运行）。
- 已中止的运行可能会在 UI 中保留部分 assistant 输出可见。
- 当存在缓冲输出时，Gateway 网关会将已中止的部分 assistant 文本持久化到 transcript 历史中，并为这些条目标记中止元数据。
- 历史始终从 Gateway 网关获取（不监视本地文件）。
- 如果 Gateway 网关不可达，WebChat 为只读模式。

## Control UI 智能体工具面板

- Control UI 的 `/agents` 工具面板有两个独立视图：
  - **当前可用** 使用 `tools.effective(sessionKey=...)`，显示当前
    会话在运行时实际可用的内容，包括核心、插件和渠道自有工具。
  - **工具配置** 使用 `tools.catalog`，并持续聚焦于配置文件、覆盖项和
    目录语义。
- 运行时可用性是按会话范围决定的。在同一智能体上切换会话可能会改变
  **当前可用** 列表。
- 配置编辑器并不意味着运行时可用；实际访问权限仍遵循策略
  优先级（`allow` / `deny`、按智能体以及提供商 / 渠道覆盖项）。

## 远程使用

- 远程模式会通过 SSH / Tailscale 隧道传输 Gateway 网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当某个 transcript 条目超过此限制时，Gateway 网关会截断长文本字段，并可能用占位符替换超大消息。客户端也可以发送按请求生效的 `maxChars`，以便仅对单次 `chat.history` 调用覆盖此默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机 / 端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密钥 WebSocket auth。
- `gateway.auth.allowTailscale`：启用时，
  浏览器中的 Control UI 聊天标签页可使用 Tailscale
  Serve 身份请求头。
- `gateway.auth.mode: "trusted-proxy"`：用于浏览器客户端的反向代理 auth，适用于位于具备身份感知的**非 loopback** 代理源之后的场景（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。
