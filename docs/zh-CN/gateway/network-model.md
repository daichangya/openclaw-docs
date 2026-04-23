---
read_when:
    - 你想简要了解 Gateway 网关的网络模型
summary: Gateway 网关、节点和 canvas host 如何连接。
title: 网络模型
x-i18n:
    generated_at: "2026-04-23T20:49:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7981c002347c3761708a2c11471166e33be53fd94fc6c50c9be06a61d2d18e33
    source_path: gateway/network-model.md
    workflow: 15
---

> 此内容已合并到 [网络](/zh-CN/network#core-model)。当前指南请参见该页面。

大多数操作都通过 Gateway 网关（`openclaw gateway`）进行，这是一个单一的长时间运行进程，负责持有渠道连接和 WebSocket 控制平面。

## 核心规则

- 建议每台主机只运行一个 Gateway 网关。它是唯一允许持有 WhatsApp Web 会话的进程。对于救援机器人或严格隔离场景，可运行多个使用隔离配置文件和端口的 Gateway 网关。参见 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。
- 优先 loopback：Gateway 网关 WS 默认为 `ws://127.0.0.1:18789`。向导默认会创建共享密钥认证，并且通常即使在 loopback 场景下也会生成一个令牌。对于非 loopback 访问，请使用有效的 Gateway 网关认证路径：共享密钥令牌/密码认证，或正确配置的非 loopback `trusted-proxy` 部署。Tailnet/移动端场景通常更适合通过 Tailscale Serve 或其他 `wss://` 端点，而不是原始 tailnet `ws://`。
- 节点会根据需要通过 LAN、tailnet 或 SSH 连接到 Gateway 网关 WS。
  旧版 TCP bridge 已被移除。
- Canvas host 由 Gateway 网关 HTTP 服务器通过与 Gateway 网关**相同的端口**提供（默认 `18789`）：
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    当配置了 `gateway.auth` 且 Gateway 网关绑定到 loopback 之外时，这些路由会受 Gateway 网关认证保护。节点客户端会使用与其活动 WS 会话绑定的、按节点作用域划分的能力 URL。参见 [Gateway 网关配置](/zh-CN/gateway/configuration)（`canvasHost`、`gateway`）。
- 远程使用通常通过 SSH 隧道或 tailnet VPN。参见 [远程访问](/zh-CN/gateway/remote) 和 [设备发现](/zh-CN/gateway/discovery)。
