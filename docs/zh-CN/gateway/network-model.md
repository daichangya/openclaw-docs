---
read_when:
    - 你想简要了解 Gateway 网关的网络模型
summary: Gateway 网关、节点和 canvas host 的连接方式。
title: 网络模型
x-i18n:
    generated_at: "2026-04-24T03:16:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> 此内容已合并到 [网络](/zh-CN/network#core-model)。当前指南请参见该页面。

大多数操作都通过 Gateway 网关（`openclaw gateway`）进行，它是一个长期运行的单一进程，负责渠道连接和 WebSocket 控制平面。

## 核心规则

- 建议每台主机只运行一个 Gateway 网关。它是唯一允许持有 WhatsApp Web 会话的进程。对于救援机器人或严格隔离场景，可运行多个具有隔离配置文件和端口的 Gateway 网关。参见 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。
- 优先使用回环：Gateway 网关 WS 默认是 `ws://127.0.0.1:18789`。向导默认会创建共享密钥认证，并通常会生成一个 token，即使是在回环场景下也是如此。对于非回环访问，请使用有效的 Gateway 网关认证路径：共享密钥 token/password 认证，或正确配置的非回环 `trusted-proxy` 部署。tailnet / 移动端设置通常通过 Tailscale Serve 或其他 `wss://` 端点效果最佳，而不是直接使用原始 tailnet `ws://`。
- 节点会按需通过 LAN、tailnet 或 SSH 连接到 Gateway 网关 WS。
  旧版 TCP bridge 已被移除。
- canvas host 由 Gateway 网关 HTTP 服务器在与 Gateway 网关**相同的端口**上提供服务（默认 `18789`）：
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    当配置了 `gateway.auth` 且 Gateway 网关 绑定到回环之外时，这些路由会受到 Gateway 网关认证保护。节点客户端使用与其活动 WS 会话绑定的节点作用域 capability URL。参见 [Gateway 网关配置](/zh-CN/gateway/configuration)（`canvasHost`、`gateway`）。
- 远程使用通常通过 SSH 隧道或 tailnet VPN。参见 [远程访问](/zh-CN/gateway/remote) 和 [设备发现](/zh-CN/gateway/discovery)。

## 相关内容

- [远程访问](/zh-CN/gateway/remote)
- [Trusted proxy auth](/zh-CN/gateway/trusted-proxy-auth)
- [Gateway 网关协议](/zh-CN/gateway/protocol)
