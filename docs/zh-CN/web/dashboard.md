---
read_when:
    - 更改仪表板认证或暴露模式
summary: Gateway 网关仪表板（Control UI）访问与认证
title: 仪表板
x-i18n:
    generated_at: "2026-04-23T23:06:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 644d79f91d8ca1fa4c29f22dc86fd8296efc5f47662144e904a7f2f56092a36e
    source_path: web/dashboard.md
    workflow: 15
---

Gateway 网关仪表板是默认在 `/` 提供的浏览器 Control UI
（可通过 `gateway.controlUi.basePath` 覆盖）。

快速打开（本地 Gateway 网关）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

关键参考：

- [Control UI](/zh-CN/web/control-ui) 了解用法和 UI 功能。
- [Tailscale](/zh-CN/gateway/tailscale) 了解 Serve/Funnel 自动化。
- [Web 界面](/zh-CN/web) 了解绑定模式和安全说明。

认证会通过已配置的 Gateway 网关认证路径，在 WebSocket 握手阶段强制执行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用 trusted-proxy 身份头

请参阅 [Gateway 网关配置](/zh-CN/gateway/configuration) 中的 `gateway.auth`。

安全说明：Control UI 是一个**管理界面**（聊天、配置、exec 审批）。
不要将其公开暴露。UI 会将仪表板 URL token 保存在当前浏览器标签页会话和所选 Gateway 网关 URL 对应的 sessionStorage 中，并在加载后从 URL 中移除它们。
优先使用 localhost、Tailscale Serve 或 SSH 隧道。

## 快速路径（推荐）

- 完成新手引导后，CLI 会自动打开仪表板，并打印一个干净的（不带 token 的）链接。
- 随时重新打开：`openclaw dashboard`（会复制链接、在可能时打开浏览器，如果是无头环境则显示 SSH 提示）。
- 如果 UI 提示需要共享密钥认证，请将已配置的 token 或
  密码粘贴到 Control UI 设置中。

## 认证基础（本地 vs 远程）

- **Localhost**：打开 `http://127.0.0.1:18789/`。
- **共享密钥 token 来源**：`gateway.auth.token`（或
  `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可以通过 URL fragment
  以一次性 bootstrap 方式传递它，而 Control UI 会将其保存在当前浏览器标签页会话和所选 Gateway 网关 URL 对应的 sessionStorage 中，
  而不是 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard`
  会按设计打印 / 复制 / 打开一个不带 token 的 URL。这可以避免
  将外部管理的 token 暴露在 shell 日志、剪贴板历史记录或浏览器启动
  参数中。
- 如果 `gateway.auth.token` 被配置为 SecretRef，但在你当前 shell 中未能解析，
  `openclaw dashboard` 仍会打印一个不带 token 的 URL，并附带
  可执行的认证设置说明。
- **共享密钥密码**：使用已配置的 `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_PASSWORD`）。仪表板不会在页面重载之间持久保存密码。
- **携带身份的模式**：当 `gateway.auth.allowTailscale: true` 时，Tailscale Serve 可通过身份头满足 Control UI/WebSocket
  认证；而非 loopback 的身份感知反向代理则可以满足
  `gateway.auth.mode: "trusted-proxy"`。在这些模式下，仪表板
  不需要为 WebSocket 粘贴共享密钥。
- **非 localhost**：请使用 Tailscale Serve、非 loopback 的共享密钥绑定、带
  `gateway.auth.mode: "trusted-proxy"` 的非 loopback 身份感知反向代理，或
  SSH 隧道。HTTP API 仍使用共享密钥认证，除非你有意运行私有入口
  `gateway.auth.mode: "none"` 或 trusted-proxy HTTP 认证。请参阅
  [Web 界面](/zh-CN/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到 “unauthorized” / 1008

- 确认 Gateway 网关可达（本地：`openclaw status`；远程：先建立 SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`）。
- 对于 `AUTH_TOKEN_MISMATCH`，当 Gateway 网关返回重试提示时，客户端可以使用缓存的设备 token 进行一次受信重试。该缓存 token 重试会复用 token 已缓存的批准作用域；显式 `deviceToken` / 显式 `scopes` 调用方则保留其请求的作用域集。如果该次重试后认证仍失败，请手动解决 token 漂移问题。
- 除该重试路径外，连接认证优先级为：显式共享 token / 密码优先，然后是显式 `deviceToken`，然后是已存储设备 token，最后是 bootstrap token。
- 在异步 Tailscale Serve Control UI 路径中，对于相同
  `{scope, ip}` 的失败尝试，会先串行化，然后失败认证限制器才会记录它们，因此
  第二个并发错误重试可能已经显示 `retry later`。
- 关于 token 漂移修复步骤，请遵循 [Token drift recovery checklist](/zh-CN/cli/devices#token-drift-recovery-checklist)。
- 从 Gateway 网关主机获取或提供共享密钥：
  - Token：`openclaw config get gateway.auth.token`
  - 密码：解析已配置的 `gateway.auth.password` 或
    `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的 token：解析外部密钥提供商，或在当前 shell 中导出
    `OPENCLAW_GATEWAY_TOKEN`，然后重新运行 `openclaw dashboard`
  - 未配置共享密钥：`openclaw doctor --generate-gateway-token`
- 在仪表板设置中，将 token 或密码粘贴到认证字段中，
  然后连接。
- UI 语言选择器位于 **Overview -> Gateway Access -> Language**。
  它属于访问卡片的一部分，而不是外观部分。
