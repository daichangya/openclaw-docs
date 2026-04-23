---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 添加用于批准远程节点的 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: 适用于 iOS 和其他远程节点的 Gateway 网关持有式节点配对（选项 B）
title: Gateway 网关持有式配对
x-i18n:
    generated_at: "2026-04-23T20:49:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865a8cc4005b41bc6c093c2f020db4f8108684f58a05fda9fa40770e38073782
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway 网关持有式配对（选项 B）

在 Gateway 网关持有式配对中，**Gateway 网关**是决定哪些节点
被允许加入的真实来源。UI（macOS 应用、未来的客户端）只是用于
批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。
`node.pair.*` 是一个单独的配对存储，**不会**控制 WS 握手。
只有显式调用 `node.pair.*` 的客户端才会使用这条流程。

## 概念

- **待处理请求**：某个节点请求加入；需要批准。
- **已配对节点**：已获批准并拿到认证令牌的节点。
- **传输层**：Gateway 网关 WS 端点会转发请求，但不会决定
  成员资格。（旧版 TCP bridge 支持已移除。）

## 配对如何工作

1. 节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（CLI 或 UI）。
4. 批准后，Gateway 网关会签发一个**新令牌**（重新配对时令牌会轮换）。
5. 节点使用该令牌重新连接，现在它就“已配对”了。

待处理请求会在 **5 分钟** 后自动过期。

## CLI 工作流（适合无头环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 会显示已配对/已连接节点及其能力。

## API 表面（Gateway 网关协议）

事件：

- `node.pair.requested` — 创建新的待处理请求时发出。
- `node.pair.resolved` — 请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` — 创建或复用一个待处理请求。
- `node.pair.list` — 列出待处理 + 已配对节点（`operator.pairing`）。
- `node.pair.approve` — 批准待处理请求（签发令牌）。
- `node.pair.reject` — 拒绝待处理请求。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

说明：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回同一个
  待处理请求。
- 对同一待处理节点的重复请求还会刷新已存储的节点
  元数据，以及供 operator 可见性的最新允许列表声明命令快照。
- 批准**始终**会生成一个全新的令牌；`node.pair.request` 永远不会返回令牌。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 会使用待处理请求中声明的命令来强制执行
  额外的批准作用域：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

重要：

- 节点配对是信任/身份流程 + 令牌签发。
- 它**不会**按节点固定实时节点命令表面。
- 实时节点命令来自节点在连接后声明的内容，并在应用
  Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` /
  `denyCommands`）后生效。
- 每节点的 `system.run` allow/ask 策略位于节点上的
  `exec.approvals.node.*` 中，而不是配对记录中。

## 节点命令门控（2026.3.31+）

<Warning>
**破坏性变更：** 从 `2026.3.31` 开始，在节点配对获批之前，节点命令会被禁用。仅有设备配对已不足以暴露声明的节点命令。
</Warning>

当节点首次连接时，会自动请求配对。在该配对请求获批之前，该节点的所有待处理节点命令都会被过滤，不会执行。一旦通过配对批准建立信任，节点声明的命令就会在正常命令策略约束下变为可用。

这意味着：

- 之前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 在配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：** 现在，源自节点的运行会停留在受限的可信表面内。
</Warning>

源自节点的摘要及相关会话事件会被限制在预期的可信表面内。之前依赖更广泛主机或会话工具访问的通知驱动或节点触发流程，可能需要调整。此加固措施确保节点事件不能升级为超出其信任边界所允许范围的主机级工具访问。

## 自动批准（macOS 应用）

在以下情况下，macOS 应用可以选择尝试**静默批准**：

- 请求被标记为 `silent`，并且
- 应用可以使用同一用户验证到 Gateway 网关主机的 SSH 连接。

如果静默批准失败，则会回退到常规的“批准/拒绝”提示。

## 元数据升级自动批准

当已配对设备重新连接时，如果仅包含非敏感元数据
变更（例如显示名称或客户端平台提示），OpenClaw 会将其视为
`metadata-upgrade`。静默自动批准适用范围很窄：它仅适用于
已经通过 loopback 上共享令牌或密码证明身份的受信任本地 CLI/辅助程序重连。浏览器/Control UI 客户端和远程客户端仍使用显式重新批准流程。作用域升级（从 read 到
write/admin）和公钥变更**不**符合元数据升级自动批准条件 —— 它们仍然是显式重新批准请求。

## QR 配对辅助工具

`/pair qr` 会将配对载荷渲染为结构化媒体，以便移动端和
浏览器客户端可以直接扫描。

删除设备时，还会一并清理该设备 ID 的任何陈旧待处理配对请求，因此 `nodes pending` 在撤销后不会显示孤立条目。

## 本地性与转发头

只有当原始套接字和任何上游代理证据都一致时，Gateway 网关配对才会将连接视为 loopback。如果请求到达于 loopback，
但携带指向非本地来源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 头，那么这些转发头证据会使
loopback 本地性声明失效。此时配对路径会要求显式批准，
而不会静默地将该请求视为同主机连接。关于 operator 认证中的等价规则，请参见
[Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地，私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖了 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹也会随之移动。

安全说明：

- 令牌属于秘密；请将 `paired.json` 视为敏感文件。
- 轮换令牌需要重新批准（或删除该节点条目）。

## 传输行为

- 传输层是**无状态的**；它不存储成员资格。
- 如果 Gateway 网关离线或禁用了配对，节点将无法配对。
- 如果 Gateway 网关处于远程模式，配对仍会针对远程 Gateway 网关的存储进行。
