---
read_when:
    - 构建或调试节点客户端（iOS/Android/macOS 节点模式）
    - 排查配对或 Bridge 认证失败
    - 审查 Gateway 网关暴露的节点接口
summary: 历史 Bridge protocol（旧版节点）：TCP JSONL、配对、作用域 RPC
title: Bridge 协议
x-i18n:
    generated_at: "2026-04-24T18:08:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
TCP Bridge 已被**移除**。当前 OpenClaw 构建不再提供 bridge 监听器，`bridge.*` 配置键也已不再包含在 schema 中。此页面仅保留作历史参考。所有节点/运维客户端请使用 [Gateway Protocol](/zh-CN/gateway/protocol)。
</Warning>

## 为什么它曾存在

- **安全边界**：bridge 暴露的是一个小型允许列表，而不是完整的 Gateway 网关 API 接口。
- **配对 + 节点身份**：节点接入由 Gateway 网关管理，并绑定到每节点令牌。
- **设备发现体验**：节点可以通过局域网中的 Bonjour 发现 Gateway 网关，或通过 tailnet 直接连接。
- **回环 WS**：完整的 WS 控制平面保持本地，除非通过 SSH 建立隧道。

## 传输

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（当 `bridge.tls.enabled` 为 true 时）。
- 历史上的默认监听端口为 `18790`（当前构建不会启动 TCP bridge）。

启用 TLS 时，设备发现 TXT 记录会包含 `bridgeTls=1`，以及作为非机密提示的 `bridgeTlsSha256`。请注意，Bonjour/mDNS TXT 记录未经认证；除非用户明确同意或有其他带外验证方式，否则客户端不得将通告的指纹视为权威 pin。

## 握手 + 配对

1. 客户端发送 `hello`，包含节点元数据和令牌（如果已完成配对）。
2. 如果尚未配对，Gateway 网关会回复 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 客户端发送 `pair-request`。
4. Gateway 网关等待批准，然后发送 `pair-ok` 和 `hello-ok`。

历史上，`hello-ok` 会返回 `serverName`，并且可能包含 `canvasHostUrl`。

## 帧

客户端 → Gateway 网关：

- `req` / `res`：有作用域的 Gateway 网关 RPC（chat、sessions、config、health、voicewake、skills.bins）
- `event`：节点信号（语音转写、智能体请求、聊天订阅、exec 生命周期）

Gateway 网关 → 客户端：

- `invoke` / `invoke-res`：节点命令（`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`）
- `event`：已订阅会话的聊天更新
- `ping` / `pong`：保活

旧版允许列表强制逻辑位于 `src/gateway/server-bridge.ts` 中（现已移除）。

## Exec 生命周期事件

节点可以发出 `exec.finished` 或 `exec.denied` 事件，以暴露 system.run 活动。
这些事件会映射为 Gateway 网关中的系统事件。（旧版节点可能仍会发出 `exec.started`。）

载荷字段（除非另有说明，均为可选）：

- `sessionKey`（必填）：接收系统事件的智能体会话。
- `runId`：用于分组的唯一 exec ID。
- `command`：原始或格式化后的命令字符串。
- `exitCode`、`timedOut`、`success`、`output`：完成详情（仅适用于 finished）。
- `reason`：拒绝原因（仅适用于 denied）。

## 历史上的 tailnet 用法

- 将 bridge 绑定到 tailnet IP：在 `~/.openclaw/openclaw.json` 中设置 `bridge.bind: "tailnet"`（仅历史参考；`bridge.*` 已不再有效）。
- 客户端通过 MagicDNS 名称或 tailnet IP 连接。
- Bonjour **不会**跨网络工作；有需要时请使用手动 host/port 或广域 DNS‑SD。

## 版本控制

bridge 曾是**隐式 v1**（没有最小/最大协商）。本节仅作历史参考；当前节点/运维客户端使用 WebSocket [Gateway Protocol](/zh-CN/gateway/protocol)。

## 相关

- [Gateway protocol](/zh-CN/gateway/protocol)
- [节点](/zh-CN/nodes)
