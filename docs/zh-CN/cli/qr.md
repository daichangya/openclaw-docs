---
read_when:
    - 你想快速将移动节点应用与 Gateway 网关配对
    - 你需要用于远程/手动分享的设置码输出
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对二维码 + 设置码）'
title: 二维码
x-i18n:
    generated_at: "2026-04-23T20:44:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03ffe8c5ed51bec78e3c01f3e24ec1bbe195a862041b2cc0908500c1cb46c717
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

根据你当前的 Gateway 网关配置生成移动端配对二维码和设置码。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 选项

- `--remote`：优先使用 `gateway.remote.url`；如果未设置，`gateway.tailscale.mode=serve|funnel` 仍可提供远程公网 URL
- `--url <url>`：覆盖载荷中使用的 gateway URL
- `--public-url <url>`：覆盖载荷中使用的公网 URL
- `--token <token>`：覆盖 bootstrap 流程用于认证的 gateway 令牌
- `--password <password>`：覆盖 bootstrap 流程用于认证的 gateway 密码
- `--setup-code-only`：仅打印设置码
- `--no-ascii`：跳过 ASCII 二维码渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 说明

- `--token` 和 `--password` 互斥。
- 设置码本身现在携带的是不透明的短期 `bootstrapToken`，而不是共享的 gateway 令牌/密码。
- 在内置的节点/操作员 bootstrap 流程中，主节点令牌仍会以 `scopes: []` 落地。
- 如果 bootstrap 交接还签发了操作员令牌，它会继续受限于 bootstrap allowlist：`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`。
- Bootstrap 作用域检查带有角色前缀。该操作员 allowlist 仅满足操作员请求；非操作员角色仍需要自己角色前缀下的作用域。
- 对于 Tailscale/公网 `ws://` Gateway 网关 URL，移动端配对会以失败关闭。私有局域网 `ws://` 仍然受支持，但 Tailscale/公网移动路由应使用 Tailscale Serve/Funnel 或 `wss://` Gateway 网关 URL。
- 使用 `--remote` 时，OpenClaw 要求必须配置 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 时，如果实际生效的远程凭证配置为 SecretRef，且你未传入 `--token` 或 `--password`，命令会从当前活动的 Gateway 网关快照中解析它们。如果 gateway 不可用，命令会快速失败。
- 不使用 `--remote` 时，如果未传入 CLI 认证覆盖项，则会解析本地 gateway 认证 SecretRef：
  - 当令牌认证可能胜出时，解析 `gateway.auth.token`（显式 `gateway.auth.mode="token"`，或在无密码来源胜出的推断模式下）。
  - 当密码认证可能胜出时，解析 `gateway.auth.password`（显式 `gateway.auth.mode="password"`，或在认证/环境变量中无令牌胜出的推断模式下）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），且 `gateway.auth.mode` 未设置，则设置码解析会失败，直到显式设置 mode。
- Gateway 网关版本偏差说明：此命令路径要求 gateway 支持 `secrets.resolve`；较旧的 gateway 会返回 unknown-method 错误。
- 扫码后，请使用以下命令批准设备配对：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
