---
read_when:
    - 将 Gateway 网关控制 UI 暴露到 localhost 之外
    - 自动化 tailnet 或公共仪表板访问
summary: 为 Gateway 网关仪表板集成 Tailscale Serve / Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-27T06:04:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw 可以为 Gateway 网关仪表板自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公网），并暴露
Gateway 网关仪表板和 WebSocket 端口。这样可以让 Gateway 网关继续绑定到 loopback，同时由
Tailscale 提供 HTTPS、路由，以及（对于 Serve）身份标头。

## 模式

- `serve`：通过 `tailscale serve` 提供仅限 tailnet 的 Serve。gateway 保持绑定在 `127.0.0.1`。
- `funnel`：通过 `tailscale funnel` 提供公网 HTTPS。OpenClaw 要求使用共享密码。
- `off`：默认值（不启用 Tailscale 自动化）。

状态和审计输出在这种 OpenClaw Serve / Funnel
模式中使用 **Tailscale 暴露**。`off` 表示 OpenClaw 不管理 Serve 或 Funnel；并不表示
本地 Tailscale 守护进程已停止或已登出。

## 认证

设置 `gateway.auth.mode` 以控制握手方式：

- `none`（仅私有入口）
- `token`（当设置了 `OPENCLAW_GATEWAY_TOKEN` 时为默认值）
- `password`（通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置提供共享密钥）
- `trusted-proxy`（支持身份感知反向代理；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）

当 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，
Control UI / WebSocket 认证可以使用 Tailscale 身份标头
（`tailscale-user-login`），无需提供令牌 / 密码。OpenClaw 会通过本地 Tailscale
守护进程解析 `x-forwarded-for` 地址（`tailscale whois`），并在接受该身份前将其与标头进行匹配，从而验证身份。
只有当请求从 loopback 到达，并携带
Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host`
标头时，OpenClaw 才会将其视为 Serve 请求。
对于包含浏览器设备身份的 Control UI 操作员会话，这条
经过验证的 Serve 路径也会跳过设备配对的往返过程。它不会绕过
浏览器设备身份：无设备的客户端仍会被拒绝，而节点角色
或非 Control UI WebSocket 连接仍会遵循正常的配对和
认证检查。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）
**不会**使用 Tailscale 身份标头认证。它们仍遵循 gateway 的
常规 HTTP 认证模式：默认使用共享密钥认证，或者使用有意配置的
trusted-proxy / 私有入口 `none` 设置。
这种无令牌流程假设 gateway 主机是受信任的。如果同一主机上可能运行不受信任的本地代码，
请禁用 `gateway.auth.allowTailscale`，并改为要求令牌 / 密码认证。
如需强制使用显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`
并使用 `gateway.auth.mode: "token"` 或 `"password"`。

## 配置示例

### 仅限 tailnet（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

打开：`https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

### 仅限 tailnet（绑定到 Tailnet IP）

当你希望 Gateway 网关直接监听 Tailnet IP 时使用此模式（不使用 Serve / Funnel）。

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

<Note>
在此模式下，loopback（`http://127.0.0.1:18789`）**不会**生效。
</Note>

### 公网（Funnel + 共享密码）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

优先使用 `OPENCLAW_GATEWAY_PASSWORD`，避免将密码提交到磁盘。

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 说明

- Tailscale Serve / Funnel 要求已安装并登录 `tailscale` CLI。
- `tailscale.mode: "funnel"` 在认证模式不是 `password` 时会拒绝启动，以避免公开暴露。
- 如果你希望 OpenClaw 在关闭时撤销 `tailscale serve`
  或 `tailscale funnel` 配置，请设置 `gateway.tailscale.resetOnExit`。
- `gateway.bind: "tailnet"` 表示直接绑定 Tailnet（无 HTTPS，也无 Serve / Funnel）。
- `gateway.bind: "auto"` 会优先选择 loopback；如果你想要仅限 Tailnet，请使用 `tailnet`。
- Serve / Funnel 只暴露 **Gateway 网关控制 UI + WS**。节点通过
  同一个 Gateway 网关 WS 端点连接，因此 Serve 也可用于节点访问。

## 浏览器控制（远程 Gateway 网关 + 本地浏览器）

如果你在一台机器上运行 Gateway 网关，但想在另一台机器上驱动浏览器，
请在浏览器所在机器上运行一个**节点主机**，并让两者保持在同一个 tailnet 中。
Gateway 网关会将浏览器操作代理到该节点；无需单独的控制服务器或 Serve URL。

不要将 Funnel 用于浏览器控制；应将节点配对视为与操作员访问同等敏感。

## Tailscale 前置条件 + 限制

- Serve 要求为你的 tailnet 启用 HTTPS；如果缺失，CLI 会提示。
- Serve 会注入 Tailscale 身份标头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、已启用 HTTPS，以及 funnel 节点属性。
- Funnel 仅支持通过 TLS 使用端口 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 需要开源版本的 Tailscale 应用。

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相关内容

- [Remote access](/zh-CN/gateway/remote)
- [Discovery](/zh-CN/gateway/discovery)
- [Authentication](/zh-CN/gateway/authentication)
