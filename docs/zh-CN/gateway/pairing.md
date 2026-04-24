---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 为批准远程节点添加 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: 用于 iOS 和其他远程节点的 Gateway 网关持有节点配对（方案 B）
title: Gateway 网关持有的配对
x-i18n:
    generated_at: "2026-04-24T18:08:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: cab16e08e670f883fcaac9d1496ede02c5816a12a848f4f8032620092aff4ca4
    source_path: gateway/pairing.md
    workflow: 15
---

在 Gateway 网关持有的配对中，**Gateway 网关** 是决定哪些节点
可以加入的事实来源。UI（macOS 应用、未来的客户端）只是用于
批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用 **设备配对**（角色为 `node`）。
`node.pair.*` 是一个独立的配对存储，**不会**控制 WS 握手。
只有显式调用 `node.pair.*` 的客户端才会使用这条流程。

## 概念

- **待处理请求**：某个节点请求加入；需要批准。
- **已配对节点**：已获批准并已签发 auth token 的节点。
- **传输层**：Gateway 网关 WS 端点会转发请求，但不决定
  成员资格。（旧版 TCP bridge 支持已移除。）

## 配对如何工作

1. 一个节点连接到 Gateway 网关 WS，并请求配对。
2. Gateway 网关存储一个**待处理请求**，并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（通过 CLI 或 UI）。
4. 批准后，Gateway 网关会签发一个**新 token**（重新配对时 token 会轮换）。
5. 节点使用该 token 重新连接，此时即为“已配对”。

待处理请求会在 **5 分钟** 后自动过期。

## CLI 工作流程（适合无界面环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 会显示已配对 / 已连接的节点及其能力。

## API 界面（Gateway 网关协议）

事件：

- `node.pair.requested` — 当创建新的待处理请求时发出。
- `node.pair.resolved` — 当请求被批准 / 拒绝 / 过期时发出。

方法：

- `node.pair.request` — 创建或复用一个待处理请求。
- `node.pair.list` — 列出待处理 + 已配对节点（`operator.pairing`）。
- `node.pair.approve` — 批准一个待处理请求（签发 token）。
- `node.pair.reject` — 拒绝一个待处理请求。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

说明：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回相同的
  待处理请求。
- 对同一待处理节点的重复请求还会刷新已存储的节点
  元数据，以及最新的 allowlist 声明命令快照，以便操作员查看。
- 批准时**总是**生成一个全新的 token；绝不会从
  `node.pair.request` 返回 token。
- 请求可包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 会使用待处理请求中声明的命令来强制执行
  额外的批准范围：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

重要：

- 节点配对是一个信任 / 身份流程，加上 token 签发。
- 它**不会**按节点固定实时节点命令界面。
- 实时节点命令来自节点在连接后声明的内容，并在应用
  Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` /
  `denyCommands`）后生效。
- 每节点的 `system.run` allow/ask 策略位于节点上的
  `exec.approvals.node.*` 中，而不在配对记录里。

## 节点命令门控（2026.3.31+）

<Warning>
**破坏性变更：** 从 `2026.3.31` 开始，在节点配对获得批准之前，节点命令将被禁用。仅靠设备配对已不足以暴露已声明的节点命令。
</Warning>

当一个节点首次连接时，会自动请求配对。在该配对请求被批准之前，来自该节点的所有待处理节点命令都会被过滤，不会执行。一旦通过配对批准建立了信任关系，该节点声明的命令就会在正常命令策略约束下变为可用。

这意味着：

- 之前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 在配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：** 由节点发起的运行现在会保留在一个收缩后的受信任界面内。
</Warning>

由节点发起的摘要及相关会话事件会被限制在预期的受信任界面内。此前依赖更广泛宿主机或会话工具访问权限的通知驱动或节点触发流程，可能需要调整。此项加固确保节点事件无法升级为超出节点信任边界所允许范围的宿主机级工具访问。

## 自动批准（macOS 应用）

macOS 应用可选择尝试执行一次**静默批准**，前提是：

- 请求被标记为 `silent`，并且
- 应用能够使用同一用户验证与 Gateway 网关宿主机的 SSH 连接。

如果静默批准失败，则会回退到正常的“批准 / 拒绝”提示。

## 元数据升级自动批准

当一个已经配对的设备重新连接，并且只有非敏感元数据发生变化
（例如显示名称或客户端平台提示）时，OpenClaw 会将其视为
`metadata-upgrade`。静默自动批准的范围很窄：它仅适用于
那些已经通过 loopback 上共享 token 或密码证明持有权的
受信任本地 CLI / 辅助工具重新连接。浏览器 / Control UI 客户端以及远程
客户端仍然使用显式重新批准流程。范围升级（从 read 到
write/admin）和公钥变更**不**符合元数据升级自动批准条件——它们仍然需要显式重新批准请求。

## QR 配对辅助

`/pair qr` 会将配对负载渲染为结构化媒体，以便移动端和
浏览器客户端可以直接扫描。

删除设备时，还会一并清理该设备 id 的所有陈旧待处理配对请求，因此在撤销后，`nodes pending` 不会显示孤立条目。

## 本地性与转发头

只有当原始套接字
和任何上游代理证据都一致时，Gateway 网关配对才会将一个连接视为 loopback。
如果某个请求到达 loopback，但携带了指向非本地来源的
`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 头，
那么这些转发头证据会使 loopback 本地性声明失效。
此时，配对路径需要显式批准，而不会静默地将该请求视为同主机连接。关于
operator auth 上的等效规则，参见
[受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地、私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖了 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹也会随之移动。

安全说明：

- Token 属于密钥；请将 `paired.json` 视为敏感文件。
- 轮换 token 需要重新批准（或删除节点条目）。

## 传输层行为

- 传输层是**无状态**的；它不存储成员资格。
- 如果 Gateway 网关离线或配对被禁用，节点将无法配对。
- 如果 Gateway 网关处于远程模式，配对仍然会针对远程 Gateway 网关的存储进行。

## 相关内容

- [渠道配对](/zh-CN/channels/pairing)
- [节点](/zh-CN/nodes)
- [设备 CLI](/zh-CN/cli/devices)
