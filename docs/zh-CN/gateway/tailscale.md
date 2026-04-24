---
read_when:
    - 将 Gateway 控制 UI 暴露到 localhost 之外
    - 自动化 tailnet 或公共仪表板访问
summary: 为 Gateway 仪表板集成 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T03:16:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale（Gateway 仪表板）

OpenClaw 可以为
Gateway 仪表板和 WebSocket 端口自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公共）。
这样可以让 Gateway 保持绑定到 loopback，同时由
Tailscale 提供 HTTPS、路由，以及（对于 Serve）身份标头。

## 模式

- `serve`：通过 `tailscale serve` 提供仅限 tailnet 的 Serve。Gateway 保持在 `127.0.0.1`。
- `funnel`：通过 `tailscale funnel` 提供公共 HTTPS。OpenClaw 要求设置共享密码。
- `off`：默认值（不启用 Tailscale 自动化）。

## 凭证

设置 `gateway.auth.mode` 以控制握手方式：

- `none`（仅私有入口）
- `token`（设置了 `OPENCLAW_GATEWAY_TOKEN` 时的默认值）
- `password`（通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置提供的共享密钥）
- `trusted-proxy`（具备身份感知能力的反向代理；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）

当 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，
Control UI / WebSocket 凭证可以使用 Tailscale 身份标头
（`tailscale-user-login`），而无需提供 token / password。OpenClaw 会通过本地 Tailscale
守护进程（`tailscale whois`）解析 `x-forwarded-for` 地址，并在接受前将其与标头进行匹配，
以验证该身份。OpenClaw 仅在请求来自 loopback 且带有
Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host`
标头时，才会将其视为 Serve 请求。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）
**不会**使用 Tailscale 身份标头凭证。它们仍遵循 Gateway 的
常规 HTTP 凭证模式：默认使用共享密钥凭证，或者使用有意配置的
trusted-proxy / 私有入口 `none` 设置。
这种无 token 流程假设 Gateway 主机是可信的。如果同一主机上
可能运行不受信任的本地代码，请禁用 `gateway.auth.allowTailscale`，改为要求
token / password 凭证。
若要强制要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`
并使用 `gateway.auth.mode: "token"` 或 `"password"`。

## 配置示例

### 仅 tailnet（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

打开：`https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

### 仅 tailnet（绑定到 Tailnet IP）

当你希望 Gateway 直接监听 Tailnet IP 时使用此模式（不使用 Serve / Funnel）。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

从另一台 Tailnet 设备连接：

- Control UI：`http://<tailscale-ip>:18789/`
- WebSocket：`ws://<tailscale-ip>:18789`

注意：在此模式下，loopback（`http://127.0.0.1:18789`）**不能**使用。

### 公共互联网（Funnel + 共享密码）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

优先使用 `OPENCLAW_GATEWAY_PASSWORD`，不要将密码提交到磁盘。

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 说明

- Tailscale Serve / Funnel 要求已安装并登录 `tailscale` CLI。
- `tailscale.mode: "funnel"` 会在凭证模式不是 `password` 时拒绝启动，以避免公共暴露。
- 如果你希望 OpenClaw 在关闭时撤销 `tailscale serve`
  或 `tailscale funnel` 配置，请设置 `gateway.tailscale.resetOnExit`。
- `gateway.bind: "tailnet"` 是直接绑定到 Tailnet（无 HTTPS，无 Serve / Funnel）。
- `gateway.bind: "auto"` 会优先使用 loopback；如果你想使用仅限 Tailnet 的模式，请使用 `tailnet`。
- Serve / Funnel 仅暴露 **Gateway 控制 UI + WS**。节点通过
  同一个 Gateway WS 端点连接，因此 Serve 也可用于节点访问。

## 浏览器控制（远程 Gateway + 本地浏览器）

如果你在一台机器上运行 Gateway，但想在另一台机器上驱动浏览器，
请在浏览器所在机器上运行一个 **node host**，并让两者保持在同一个 tailnet 中。
Gateway 会将浏览器操作代理到该节点；不需要单独的控制服务器或 Serve URL。

避免将 Funnel 用于浏览器控制；请像对待操作员访问一样对待节点配对。

## Tailscale 前置条件 + 限制

- Serve 要求为你的 tailnet 启用 HTTPS；如果缺失，CLI 会提示。
- Serve 会注入 Tailscale 身份标头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、已启用 HTTPS，以及 funnel 节点属性。
- Funnel 仅支持通过 TLS 使用端口 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 需要使用开源版本的 Tailscale 应用。

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相关内容

- [Remote access](/zh-CN/gateway/remote)
- [Discovery](/zh-CN/gateway/discovery)
- [Authentication](/zh-CN/gateway/authentication)
