---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对批准
    - 为批准远程节点添加 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: 用于 iOS 和其他远程节点的 Gateway 网关自主管理节点配对（选项 B）
title: Gateway 网关自主管理配对
x-i18n:
    generated_at: "2026-04-24T03:16:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway 网关自主管理配对（选项 B）

在 Gateway 网关自主管理配对中，**Gateway 网关**是决定哪些节点被允许加入的唯一事实来源。UI（macOS 应用、未来的客户端）只是用于批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。`node.pair.*` 是单独的配对存储，**不会**控制 WS 握手。
只有显式调用 `node.pair.*` 的客户端才会使用此流程。

## 概念

- **待处理请求**：某个节点请求加入；需要批准。
- **已配对节点**：已获批准并已签发 auth token 的节点。
- **传输层**：Gateway 网关 WS 端点会转发请求，但不决定成员资格。（旧版 TCP bridge 支持已移除。）

## 配对如何工作

1. 节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（CLI 或 UI）。
4. 批准后，Gateway 网关会签发一个**新 token**（重新配对时 token 会轮换）。
5. 节点使用该 token 重新连接，此时即成为“已配对”。

待处理请求会在 **5 分钟**后自动过期。

## CLI 工作流（适合无头环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 会显示已配对 / 已连接的节点及其能力。

## API 表面（Gateway 网关协议）

事件：

- `node.pair.requested` — 创建新的待处理请求时发出。
- `node.pair.resolved` — 请求被批准 / 拒绝 / 过期时发出。

方法：

- `node.pair.request` — 创建或复用一个待处理请求。
- `node.pair.list` — 列出待处理节点和已配对节点（`operator.pairing`）。
- `node.pair.approve` — 批准待处理请求（签发 token）。
- `node.pair.reject` — 拒绝待处理请求。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

说明：

- `node.pair.request` 对每个节点都是幂等的：重复调用会返回相同的待处理请求。
- 对同一个待处理节点重复发起请求时，也会刷新已存储的节点元数据，以及最新的 allowlist 声明命令快照，以便运维人员查看。
- 批准时**总是**会生成一个新的 token；`node.pair.request` **绝不会**返回 token。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 会使用待处理请求声明的命令来强制执行额外的批准范围：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

重要说明：

- 节点配对是一个信任 / 身份流程，并包含 token 签发。
- 它**不会**按节点固定实时节点命令表面。
- 实时节点命令来自节点在连接后声明的内容，并且会先应用 Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` /
  `denyCommands`）。
- 每个节点的 `system.run` allow / ask 策略位于节点本身的
  `exec.approvals.node.*`，而不在配对记录中。

## 节点命令控制（2026.3.31+）

<Warning>
**破坏性变更：** 从 `2026.3.31` 开始，在节点配对获得批准之前，节点命令会被禁用。仅靠设备配对已不足以暴露已声明的节点命令。
</Warning>

当节点首次连接时，会自动请求配对。在配对请求获得批准之前，来自该节点的所有待处理节点命令都会被过滤，不会执行。一旦通过配对批准建立信任，该节点声明的命令就会在正常命令策略约束下变为可用。

这意味着：

- 之前依赖仅通过设备配对来暴露命令的节点，现在必须完成节点配对。
- 在配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：** 现在由节点发起的运行会保留在一个缩减后的受信任表面内。
</Warning>

由节点发起的摘要和相关会话事件会被限制在预期的受信任表面内。此前依赖更广泛主机或会话工具访问权限的通知驱动或节点触发流程，可能需要进行调整。此加固措施确保节点事件无法越过节点信任边界，提升为主机级工具访问。

## 自动批准（macOS 应用）

macOS 应用在以下情况下可以选择尝试**静默批准**：

- 请求被标记为 `silent`，并且
- 应用可以验证与 Gateway 网关主机的 SSH 连接，且使用同一用户。

如果静默批准失败，则会回退到正常的“批准 / 拒绝”提示。

## 元数据升级自动批准

当一个已配对设备仅携带非敏感元数据变更重新连接时（例如显示名称或客户端平台提示），OpenClaw 会将其视为 `metadata-upgrade`。静默自动批准的适用范围很窄：它仅适用于受信任的本地 CLI / helper 重新连接，并且这些连接已经通过 local loopback 证明了其持有共享 token 或密码。Browser / Control UI 客户端和远程客户端仍然使用显式重新批准流程。范围升级（从 read 到 write / admin）和公钥变更**不**符合元数据升级自动批准条件——它们仍然需要显式重新批准请求。

## QR 配对辅助功能

`/pair qr` 会将配对载荷渲染为结构化媒体，以便移动端和浏览器客户端直接扫描。

删除设备时，也会一并清理该设备 id 对应的任何陈旧待处理配对请求，因此在撤销后，`nodes pending` 不会显示孤立条目。

## 本地性和转发头

只有当原始 socket 和任何上游代理证据都一致时，Gateway 网关配对才会将连接视为 loopback。如果请求到达于 loopback，但携带了指向非本地来源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 头，则这些转发头证据会取消 loopback 本地性声明。在这种情况下，配对路径将要求显式批准，而不会静默地将该请求视为同主机连接。关于运维 auth 中的等效规则，请参见[Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地、私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖了 `OPENCLAW_STATE_DIR`，则 `nodes/` 文件夹也会随之移动。

安全说明：

- token 是秘密；请将 `paired.json` 视为敏感文件。
- 轮换 token 需要重新批准（或删除该节点条目）。

## 传输行为

- 传输层是**无状态**的；它不存储成员资格。
- 如果 Gateway 网关离线或配对被禁用，节点将无法配对。
- 如果 Gateway 网关处于 remote 模式，配对仍会针对远程 Gateway 网关的存储进行。

## 相关

- [渠道配对](/zh-CN/channels/pairing)
- [Nodes](/zh-CN/nodes)
- [Devices CLI](/zh-CN/cli/devices)
