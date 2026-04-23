---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 添加用于批准远程节点的 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: 适用于 iOS 和其他远程节点的 Gateway 网关持有节点配对（选项 B）
title: Gateway 网关持有的配对
x-i18n:
    generated_at: "2026-04-23T07:05:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: adba3c833b57b1df117c57d3451598e3c84cd78dcc6e9811547cdbb101afda0b
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway 网关持有的配对（选项 B）

在 Gateway 网关持有的配对中，**Gateway 网关** 是决定哪些节点被允许加入的事实来源。
UI（macOS 应用、未来的客户端）只是用于批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。
`node.pair.*` 是一个独立的配对存储，不**会**控制 WS 握手。
只有显式调用 `node.pair.*` 的客户端才会使用这条流程。

## 概念

- **待处理请求**：某个节点请求加入；需要批准。
- **已配对节点**：已获批准并已签发认证 token 的节点。
- **传输协议**：Gateway 网关 WS 端点会转发请求，但不决定成员资格。（旧版 TCP bridge 支持已移除。）

## 配对如何工作

1. 节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**，并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（CLI 或 UI）。
4. 批准后，Gateway 网关会签发一个**新 token**（重新配对时 token 会轮换）。
5. 节点使用该 token 重新连接，此时即为“已配对”。

待处理请求会在 **5 分钟** 后自动过期。

## CLI 工作流（适合无头环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 会显示已配对/已连接的节点及其能力。

## API 接口（Gateway 网关协议）

事件：

- `node.pair.requested` — 当创建新的待处理请求时发出。
- `node.pair.resolved` — 当请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` — 创建或复用一个待处理请求。
- `node.pair.list` — 列出待处理节点和已配对节点（`operator.pairing`）。
- `node.pair.approve` — 批准待处理请求（签发 token）。
- `node.pair.reject` — 拒绝待处理请求。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

说明：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回同一个
  待处理请求。
- 对同一待处理节点的重复请求也会刷新已存储的节点
  元数据，以及最新的 allowlist 声明命令快照，以便操作员查看。
- 批准**总是**会生成新的 token；`node.pair.request` 绝不会返回
  token。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 会使用待处理请求声明的命令来强制执行
  额外的审批作用域：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

重要说明：

- 节点配对是一个信任/身份验证流程，外加 token 签发。
- 它**不会**按节点固定当前在线的节点命令面。
- 当前在线的节点命令来自节点在连接后声明的内容，并在应用
  Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` /
  `denyCommands`）后生效。
- 每个节点的 `system.run` allow/ask 策略位于节点上的
  `exec.approvals.node.*` 中，而不在配对记录里。

## 节点命令门控（`2026.3.31+`）

<Warning>
**破坏性变更：** 从 `2026.3.31` 开始，在节点配对获批之前，节点命令将被禁用。仅有设备配对已不足以暴露声明的节点命令。
</Warning>

当节点首次连接时，会自动请求配对。在该配对请求获批之前，该节点的所有待处理节点命令都会被过滤，不会执行。一旦通过配对批准建立信任，节点声明的命令就会在正常命令策略约束下可用。

这意味着：

- 以前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 在配对获批前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（`2026.3.31+`）

<Warning>
**破坏性变更：** 节点发起的运行现在会保留在收缩后的受信任面内。
</Warning>

节点发起的摘要及相关会话事件将被限制在预期的受信任范围内。此前依赖更广泛主机或会话工具访问的通知驱动或节点触发流程，可能需要调整。此加固可确保节点事件无法升级为超出该节点信任边界所允许范围的主机级工具访问。

## 自动批准（macOS 应用）

在以下情况下，macOS 应用可以选择尝试**静默批准**：

- 该请求被标记为 `silent`，并且
- 应用能够使用同一用户验证到 gateway 主机的 SSH 连接。

如果静默批准失败，则会回退到常规的“批准/拒绝”提示。

## 元数据升级自动批准

当已配对设备重新连接，且仅包含非敏感元数据变更
（例如显示名称或客户端平台提示）时，OpenClaw 会将其视为
`metadata-upgrade`。静默自动批准的范围很窄：它仅适用于
已通过 loopback 上的共享 token 或密码证明身份的
受信任本地 CLI/辅助程序重连。浏览器/Control UI 客户端以及远程
客户端仍使用显式重新批准流程。作用域升级（从 read 到
write/admin）以及公钥变更**不**符合元数据升级自动批准条件——
它们仍然作为显式重新批准请求处理。

## QR 配对辅助功能

`/pair qr` 会将配对负载渲染为结构化媒体，以便移动端和
浏览器客户端直接扫描。现在，设备删除也会一并清理相同设备 ID 的
陈旧待处理配对请求，因此在撤销后，`nodes pending` 不再显示
孤立条目。

## 本地性和转发头

Gateway 网关配对仅在原始 socket
和任何上游代理证据都一致的情况下，才会将连接视为 loopback。
如果请求到达于 loopback，但携带了 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 头，
且这些头指向非本地来源，那么这些转发头证据会使
loopback 本地性声明失效。此时配对路径将要求显式批准，
而不是静默地将该请求视为同主机连接。参见
[Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth) 了解
operator auth 上的等效规则。

## 存储（本地、私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖了 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹也会随之移动。

安全说明：

- Token 是密钥；请将 `paired.json` 视为敏感文件。
- 轮换 token 需要重新批准（或删除该节点条目）。

## 传输协议行为

- 传输协议是**无状态**的；它不存储成员资格。
- 如果 Gateway 网关离线或配对被禁用，节点将无法配对。
- 如果 Gateway 网关处于远程模式，配对仍会针对远程 Gateway 网关的存储进行。
