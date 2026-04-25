---
read_when:
    - 更改仪表板身份验证或暴露模式
summary: Gateway 网关仪表板（Control UI）访问与身份验证
title: 仪表板
x-i18n:
    generated_at: "2026-04-25T10:48:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

Gateway 网关仪表板是默认在 `/` 提供服务的浏览器 Control UI
（可通过 `gateway.controlUi.basePath` 覆盖）。

快速打开（本地 Gateway 网关）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 当设置 `gateway.tls.enabled: true` 时，请对 WebSocket 端点使用 `https://127.0.0.1:18789/`
  和 `wss://127.0.0.1:18789`。

关键参考：

- [Control UI](/zh-CN/web/control-ui)：了解用法和 UI 功能。
- [Tailscale](/zh-CN/gateway/tailscale)：了解 Serve/Funnel 自动化。
- [Web surfaces](/zh-CN/web)：了解绑定模式和安全说明。

身份验证会通过已配置的 Gateway 网关身份验证路径在 WebSocket 握手阶段强制执行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份标头

请参阅 [Gateway configuration](/zh-CN/gateway/configuration) 中的 `gateway.auth`。

安全说明：Control UI 是一个**管理界面**（聊天、配置、exec 批准）。
不要将其公开暴露。UI 会在当前浏览器标签页会话和所选 Gateway 网关 URL 的 `sessionStorage`
中保存仪表板 URL token，并在加载后将其从 URL 中移除。
优先使用 localhost、Tailscale Serve 或 SSH 隧道。

## 快速路径（推荐）

- 完成新手引导后，CLI 会自动打开仪表板并打印一个干净的（不含 token）链接。
- 随时重新打开：`openclaw dashboard`（会复制链接、尽可能打开浏览器，并在无头环境下显示 SSH 提示）。
- 如果 UI 提示需要共享密钥身份验证，请将已配置的 token 或
  password 粘贴到 Control UI 设置中。

## 身份验证基础（本地与远程）

- **localhost**：打开 `http://127.0.0.1:18789/`。
- **Gateway TLS**：当 `gateway.tls.enabled: true` 时，仪表板/状态链接使用
  `https://`，Control UI WebSocket 链接使用 `wss://`。
- **共享密钥 token 来源**：`gateway.auth.token`（或
  `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可以通过 URL fragment
  传递它以进行一次性引导，而 Control UI 会将它保存在当前浏览器标签页会话和所选 Gateway 网关 URL 的 `sessionStorage` 中，
  而不是 `localStorage`。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard`
  会按设计打印/复制/打开一个不含 token 的 URL。这样可避免将外部管理的 token 暴露在 shell 日志、剪贴板历史记录或浏览器启动参数中。
- 如果 `gateway.auth.token` 被配置为 SecretRef，且在你当前的 shell 中无法解析，
  `openclaw dashboard` 仍会打印一个不含 token 的 URL，并提供可操作的身份验证设置指导。
- **共享密钥 password**：使用已配置的 `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_PASSWORD`）。仪表板不会在重新加载后持久保存 password。
- **携带身份的模式**：当 `gateway.auth.allowTailscale: true` 时，Tailscale Serve 可通过身份标头满足 Control UI/WebSocket
  身份验证；而非 loopback、具备身份感知能力的反向代理则可通过
  `gateway.auth.mode: "trusted-proxy"` 满足该要求。在这些模式下，仪表板不需要为 WebSocket
  粘贴共享密钥。
- **非 localhost**：使用 Tailscale Serve、非 loopback 的共享密钥绑定、设置了
  `gateway.auth.mode: "trusted-proxy"` 的非 loopback 身份感知反向代理，或 SSH 隧道。HTTP API 仍然使用共享密钥身份验证，除非你明确运行私有入口
  `gateway.auth.mode: "none"` 或 trusted-proxy HTTP 身份验证。请参阅
  [Web surfaces](/zh-CN/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到 “unauthorized” / 1008

- 确保 Gateway 网关可访问（本地：`openclaw status`；远程：使用 SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`）。
- 对于 `AUTH_TOKEN_MISMATCH`，当 Gateway 网关返回重试提示时，客户端可使用缓存的设备 token 进行一次受信任重试。该缓存 token 重试会复用该 token 已缓存的批准作用域；显式 `deviceToken` / 显式 `scopes` 调用方则保留其请求的作用域集合。如果该次重试后身份验证仍失败，请手动解决 token 漂移问题。
- 在该重试路径之外，连接身份验证优先级依次为：显式共享 token/password、显式 `deviceToken`、已存储设备 token、引导 token。
- 在异步 Tailscale Serve Control UI 路径上，同一
  `{scope, ip}` 的失败尝试会在失败身份验证限流器记录它们之前被串行化，因此第二个并发的错误重试可能已经显示 `retry later`。
- 关于 token 漂移修复步骤，请按照 [Token drift recovery checklist](/zh-CN/cli/devices#token-drift-recovery-checklist) 操作。
- 从 Gateway 网关主机检索或提供共享密钥：
  - Token：`openclaw config get gateway.auth.token`
  - Password：解析已配置的 `gateway.auth.password` 或
    `OPENCLAW_GATEWAY_PASSWORD`
  - 由 SecretRef 管理的 token：解析外部密钥提供商，或在当前 shell 中导出
    `OPENCLAW_GATEWAY_TOKEN`，然后重新运行 `openclaw dashboard`
  - 未配置共享密钥：`openclaw doctor --generate-gateway-token`
- 在仪表板设置中，将 token 或 password 粘贴到身份验证字段中，
  然后连接。
- UI 语言选择器位于 **Overview -> Gateway Access -> Language**。
  它属于访问卡片，而不是外观部分。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [WebChat](/zh-CN/web/webchat)
