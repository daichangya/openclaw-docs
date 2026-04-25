---
read_when:
    - 你想通过 Tailscale 访问 Gateway 网关。
    - 你想使用浏览器中的 Control UI 和配置编辑功能。
summary: Gateway 网关 Web 界面：Control UI、绑定模式与安全性
title: Web
x-i18n:
    generated_at: "2026-04-25T10:48:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Gateway 网关 Web 界面：Control UI、绑定模式与安全性

Gateway 网关会通过与 Gateway 网关 WebSocket 相同的端口提供一个小型的 **浏览器 Control UI**（Vite + Lit）：

- 默认：`http://<host>:18789/`
- 当 `gateway.tls.enabled: true` 时：`https://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

功能位于 [Control UI](/zh-CN/web/control-ui)。
本页重点介绍绑定模式、安全性和面向 Web 的界面。

## Webhooks

当 `hooks.enabled=true` 时，Gateway 网关还会在同一个 HTTP 服务器上公开一个小型 webhook 端点。
有关身份验证和负载，请参见 [Gateway 网关配置](/zh-CN/gateway/configuration) → `hooks`。

## 配置（默认开启）

当资源存在时（`dist/control-ui`），Control UI **默认启用**。
你可以通过配置控制它：

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale 访问

### 集成 Serve（推荐）

让 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 代理它：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

然后启动 gateway：

```bash
openclaw gateway
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

### Tailnet 绑定 + 令牌

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

然后启动 gateway（这个非 loopback 示例使用共享密钥令牌身份验证）：

```bash
openclaw gateway
```

打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

### 公网（Funnel）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 安全说明

- 默认情况下需要 Gateway 网关身份验证（token、password、trusted-proxy，或启用时使用 Tailscale Serve 身份标头）。
- 非 loopback 绑定仍然**需要** gateway 身份验证。实际上，这意味着需要 token/password 身份验证，或使用设置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 向导默认创建共享密钥身份验证，并且通常会生成一个 gateway 令牌（即使在 loopback 上也是如此）。
- 在共享密钥模式下，UI 会发送 `connect.params.auth.token` 或 `connect.params.auth.password`。
- 当 `gateway.tls.enabled: true` 时，本地 dashboard 和 status 辅助工具会渲染 `https://` dashboard URL 和 `wss://` WebSocket URL。
- 在 Tailscale Serve 或 `trusted-proxy` 这类携带身份的模式中，WebSocket 身份验证检查则会改为通过请求标头满足。
- 对于非 loopback 的 Control UI 部署，请显式设置 `gateway.controlUi.allowedOrigins`（完整来源）。如果未设置，默认会拒绝启动 gateway。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 标头来源回退模式，但这会带来危险的安全降级。
- 在 Serve 模式下，当 `gateway.auth.allowTailscale` 为 `true` 时，Tailscale 身份标头可以满足 Control UI/WebSocket 身份验证（不需要 token/password）。
  HTTP API 端点不会使用这些 Tailscale 身份标头；它们会改为遵循 gateway 的常规 HTTP 身份验证模式。设置
  `gateway.auth.allowTailscale: false` 以要求显式凭证。参见
  [Tailscale](/zh-CN/gateway/tailscale) 和 [安全性](/zh-CN/gateway/security)。这种
  无令牌流程假设 gateway 主机是可信的。
- `gateway.tailscale.mode: "funnel"` 要求 `gateway.auth.mode: "password"`（共享密码）。

## 构建 UI

Gateway 网关会从 `dist/control-ui` 提供静态文件。使用以下命令构建它们：

```bash
pnpm ui:build
```
