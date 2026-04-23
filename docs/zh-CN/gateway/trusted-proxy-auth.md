---
read_when:
    - 在身份感知代理后运行 OpenClaw
    - 在 OpenClaw 前设置带 OAuth 的 Pomerium、Caddy 或 nginx
    - 修复反向代理设置中的 WebSocket 1008 unauthorized 错误
    - 决定在哪里设置 HSTS 和其他 HTTP 加固头部
summary: 将 Gateway 网关认证委托给受信任的反向代理（Pomerium、Caddy、nginx + OAuth）
title: 受信任的代理认证
x-i18n:
    generated_at: "2026-04-23T07:05:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# 受信任的代理认证

> ⚠️ **安全敏感功能。** 此模式会将认证完全委托给你的反向代理。配置错误可能会使你的 Gateway 网关暴露给未授权访问。启用前请仔细阅读本页。

## 何时使用

在以下情况下，使用 `trusted-proxy` 认证模式：

- 你在 **身份感知代理**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）后运行 OpenClaw
- 你的代理负责所有认证，并通过请求头传递用户身份
- 你处于 Kubernetes 或容器环境中，而代理是访问 Gateway 网关的唯一入口
- 你遇到了 WebSocket `1008 unauthorized` 错误，因为浏览器无法在 WS 负载中传递 token

## 何时不要使用

- 如果你的代理不对用户进行认证（只是 TLS 终止器或负载均衡器）
- 如果存在绕过代理直达 Gateway 网关的路径（防火墙漏洞、内部网络访问）
- 如果你不确定代理是否会正确剥离/覆盖转发头
- 如果你只需要个人单用户访问（可考虑使用 Tailscale Serve + loopback，配置更简单）

## 工作原理

1. 你的反向代理对用户进行认证（OAuth、OIDC、SAML 等）
2. 代理添加一个包含已认证用户身份的请求头（例如 `x-forwarded-user: nick@example.com`）
3. OpenClaw 检查该请求是否来自 **受信任的代理 IP**（在 `gateway.trustedProxies` 中配置）
4. OpenClaw 从已配置的请求头中提取用户身份
5. 如果所有检查都通过，则授权该请求

## 控制 Control UI 配对行为

当 `gateway.auth.mode = "trusted-proxy"` 处于启用状态，并且请求通过了
受信任代理检查时，Control UI WebSocket 会话可以在没有设备
配对身份的情况下连接。

影响：

- 在此模式下，配对不再是 Control UI 访问的主要门槛。
- 你的反向代理认证策略和 `allowUsers` 将成为实际的访问控制。
- 保持 Gateway 网关入口仅对受信任代理 IP 开放（`gateway.trustedProxies` + 防火墙）。

## 配置

```json5
{
  gateway: {
    // 受信任代理认证要求请求来自非 loopback 的受信任代理来源
    bind: "lan",

    // 关键：这里只添加你的代理 IP
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 包含已认证用户身份的请求头（必需）
        userHeader: "x-forwarded-user",

        // 可选：必须存在的请求头（代理校验）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 可选：限制为特定用户（空 = 允许全部）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

重要的运行时规则：

- 受信任代理认证会拒绝来自 loopback 来源的请求（`127.0.0.1`、`::1`、loopback CIDR）。
- 同主机 loopback 反向代理 **不满足** 受信任代理认证要求。
- 对于同主机 loopback 代理设置，请改用 token/password 认证，或者通过 OpenClaw 可验证的非 loopback 受信任代理地址进行路由。
- 非 loopback 的 Control UI 部署仍需要显式设置 `gateway.controlUi.allowedOrigins`。
- **转发头证据会覆盖 loopback 本地性。** 如果请求到达于 loopback，但携带了指向非本地来源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 头，则这些证据会使 loopback 本地性声明无效。该请求会被视为远程请求，用于配对、受信任代理认证以及 Control UI 设备身份门控。这可以防止同主机 loopback 代理通过转发头身份“洗白”成受信任代理认证。

### 配置参考

| 字段                                       | 必需 | 说明 |
| ------------------------------------------ | ---- | ---- |
| `gateway.trustedProxies`                   | 是   | 要信任的代理 IP 地址数组。来自其他 IP 的请求会被拒绝。 |
| `gateway.auth.mode`                        | 是   | 必须为 `"trusted-proxy"` |
| `gateway.auth.trustedProxy.userHeader`     | 是   | 包含已认证用户身份的请求头名称 |
| `gateway.auth.trustedProxy.requiredHeaders`| 否   | 使请求被信任所必须存在的其他请求头 |
| `gateway.auth.trustedProxy.allowUsers`     | 否   | 用户身份 allowlist。为空表示允许所有已认证用户。 |

## TLS 终止和 HSTS

使用单一 TLS 终止点，并在那里应用 HSTS。

### 推荐模式：代理 TLS 终止

当你的反向代理为 `https://control.example.com` 处理 HTTPS 时，
请在该代理上为该域设置
`Strict-Transport-Security`。

- 适合面向互联网的部署。
- 将证书和 HTTP 加固策略集中在同一位置。
- OpenClaw 可以在代理后保持为 loopback HTTP。

请求头值示例：

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway 网关 TLS 终止

如果 OpenClaw 自身直接提供 HTTPS 服务（没有执行 TLS 终止的代理），请设置：

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` 接受一个字符串类型的请求头值，也可显式设为 `false` 以禁用。

### 推出指导

- 先使用较短的 max age（例如 `max-age=300`）来验证流量。
- 只有在有足够把握后，才增加到长期值（例如 `max-age=31536000`）。
- 仅当所有子域都已准备好使用 HTTPS 时，才添加 `includeSubDomains`。
- 只有在你明确满足整套域名的 preload 要求时，才使用 preload。
- 仅 loopback 的本地开发无法从 HSTS 中受益。

## 代理设置示例

### Pomerium

Pomerium 在 `x-pomerium-claim-email`（或其他 claim 头）中传递身份，并在 `x-pomerium-jwt-assertion` 中传递 JWT。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium 的 IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Pomerium 配置片段：

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### 带 OAuth 的 Caddy

带有 `caddy-security` 插件的 Caddy 可以认证用户并传递身份头。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Caddy/sidecar 代理 IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfile 配置片段：

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy 对用户进行认证，并在 `x-auth-request-email` 中传递身份。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginx 配置片段：

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 带 Forward Auth 的 Traefik

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik 容器 IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## 混合 token 配置

当 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）与 `trusted-proxy` 模式同时启用时，OpenClaw 会拒绝这种有歧义的配置。混合 token 配置可能导致 loopback 请求在错误的认证路径上被静默认证。

如果你在启动时看到 `mixed_trusted_proxy_token` 错误：

- 在使用 trusted-proxy 模式时移除共享 token，或
- 如果你打算使用基于 token 的认证，请将 `gateway.auth.mode` 切换为 `"token"`。

Loopback trusted-proxy 认证也会以失败关闭的方式处理：同主机调用方必须通过受信任代理提供已配置的身份头，而不是被静默认证。

## operator scope 请求头

受信任代理认证是一种 **承载身份的** HTTP 模式，因此调用方
可以选择通过 `x-openclaw-scopes` 声明 operator scope。

示例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行为：

- 当该请求头存在时，OpenClaw 会遵循声明的 scope 集合。
- 当该请求头存在但为空时，该请求声明 **不包含** 任何 operator scope。
- 当该请求头不存在时，普通承载身份的 HTTP API 会回退到标准 operator 默认 scope 集合。
- Gateway-auth **插件 HTTP 路由** 默认更窄：当 `x-openclaw-scopes` 不存在时，它们的运行时 scope 会回退到 `operator.write`。
- 浏览器来源的 HTTP 请求即使在 trusted-proxy 认证成功后，仍必须通过 `gateway.controlUi.allowedOrigins`（或有意启用的 Host 请求头回退模式）。

实践规则：

- 当你希望 trusted-proxy 请求
  比默认值更窄，或者 gateway-auth 插件路由需要
  比 write scope 更强的权限时，请显式发送 `x-openclaw-scopes`。

## 安全检查清单

启用受信任代理认证前，请确认：

- [ ] **代理是唯一入口**：Gateway 网关端口已通过防火墙屏蔽除你的代理之外的所有访问
- [ ] **trustedProxies 最小化**：仅包含你的实际代理 IP，而不是整个子网
- [ ] **无 loopback 代理来源**：受信任代理认证会对 loopback 来源请求以失败关闭方式处理
- [ ] **代理会剥离头部**：你的代理会覆盖（而不是追加）来自客户端的 `x-forwarded-*` 头
- [ ] **TLS 终止**：你的代理负责 TLS；用户通过 HTTPS 连接
- [ ] **allowedOrigins 显式设置**：非 loopback 的 Control UI 使用显式 `gateway.controlUi.allowedOrigins`
- [ ] **已设置 allowUsers**（推荐）：限制为已知用户，而不是允许任意已认证用户
- [ ] **没有混合 token 配置**：不要同时设置 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`

## 安全审计

`openclaw security audit` 会将受信任代理认证标记为 **critical** 严重级别发现。这是有意为之 —— 用于提醒你正在将安全委托给代理设置。

审计会检查：

- 基础 `gateway.trusted_proxy_auth` 警告/critical 提醒
- 缺少 `trustedProxies` 配置
- 缺少 `userHeader` 配置
- `allowUsers` 为空（允许任意已认证用户）
- 在暴露的 Control UI 界面上使用通配符或缺失的浏览器来源策略

## 故障排除

### “trusted_proxy_untrusted_source”

该请求并非来自 `gateway.trustedProxies` 中的 IP。请检查：

- 代理 IP 是否正确？（Docker 容器 IP 可能会变化）
- 你的代理前面是否还有负载均衡器？
- 使用 `docker inspect` 或 `kubectl get pods -o wide` 查找实际 IP

### “trusted_proxy_loopback_source”

OpenClaw 拒绝了来自 loopback 来源的受信任代理请求。

请检查：

- 代理是否从 `127.0.0.1` / `::1` 连接？
- 你是否正在尝试将 trusted-proxy 认证与同主机 loopback 反向代理一起使用？

修复：

- 对于同主机 loopback 代理设置，使用 token/password 认证，或
- 通过非 loopback 的受信任代理地址进行路由，并将该 IP 保留在 `gateway.trustedProxies` 中。

### “trusted_proxy_user_missing”

用户请求头为空或缺失。请检查：

- 你的代理是否已配置为传递身份请求头？
- 请求头名称是否正确？（大小写不敏感，但拼写必须正确）
- 用户是否确实已在代理处完成认证？

### “trusted*proxy_missing_header*\*”

某个必需请求头不存在。请检查：

- 你的代理中这些特定请求头的配置
- 请求头是否在链路中的某处被剥离

### “trusted_proxy_user_not_allowed”

用户已通过认证，但不在 `allowUsers` 中。请将其加入，或移除 allowlist。

### “trusted_proxy_origin_not_allowed”

trusted-proxy 认证已成功，但浏览器的 `Origin` 请求头未通过 Control UI 的来源检查。

请检查：

- `gateway.controlUi.allowedOrigins` 包含了准确的浏览器来源
- 除非你明确希望允许全部来源，否则不要依赖通配符来源
- 如果你有意使用 Host 请求头回退模式，请确认已明确设置 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`

### WebSocket 仍然失败

确保你的代理：

- 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）
- 在 WebSocket 升级请求中传递身份请求头（而不仅仅是普通 HTTP）
- 没有为 WebSocket 连接使用单独的认证路径

## 从 token 认证迁移

如果你要从 token 认证迁移到 trusted-proxy：

1. 配置你的代理，使其能够认证用户并传递请求头
2. 独立测试代理设置（使用带请求头的 `curl`）
3. 在 OpenClaw 配置中更新为 trusted-proxy 认证
4. 重启 Gateway 网关
5. 从 Control UI 测试 WebSocket 连接
6. 运行 `openclaw security audit` 并审查结果

## 相关内容

- [Security](/zh-CN/gateway/security) — 完整安全指南
- [Configuration](/zh-CN/gateway/configuration) — 配置参考
- [Remote Access](/zh-CN/gateway/remote) — 其他远程访问模式
- [Tailscale](/zh-CN/gateway/tailscale) — 仅 tailnet 访问时更简单的替代方案
