---
read_when:
    - 调试 “Instances” 选项卡
    - 调查重复或过期的实例行
    - 更改 Gateway 网关 WS 连接或系统事件信标
summary: OpenClaw 在线状态条目的生成、合并和显示方式
title: 在线状态
x-i18n:
    generated_at: "2026-04-23T22:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

OpenClaw “在线状态” 是一种轻量级、尽力而为的视图，用于展示：

- **Gateway 网关** 本身，以及
- **连接到 Gateway 网关的客户端**（mac 应用、WebChat、CLI 等）

在线状态主要用于渲染 macOS 应用的 **Instances** 选项卡，并为操作人员提供快速可见性。

## 在线状态字段（会显示什么）

在线状态条目是结构化对象，包含如下字段：

- `instanceId`（可选，但强烈建议提供）：稳定的客户端身份标识（通常为 `connect.client.instanceId`）
- `host`：易读的主机名
- `ip`：尽力获取的 IP 地址
- `version`：客户端版本字符串
- `deviceFamily` / `modelIdentifier`：硬件提示信息
- `mode`：`ui`、`webchat`、`cli`、`backend`、`probe`、`test`、`node`，等等
- `lastInputSeconds`： “距上次用户输入的秒数”（如果已知）
- `reason`：`self`、`connect`、`node-connected`、`periodic`，等等
- `ts`：最后更新时间戳（自纪元以来的毫秒数）

## 生成方（在线状态来自哪里）

在线状态条目由多个来源生成，并且会被**合并**。

### 1) Gateway 网关自身条目

Gateway 网关会在启动时始终写入一个 “self” 条目，因此 UI 即使在尚无客户端连接时也能显示 Gateway 网关主机。

### 2) WebSocket 连接

每个 WS 客户端都会以一个 `connect` 请求开始。握手成功后，Gateway 网关会为该连接 upsert 一条在线状态记录。

#### 为什么一次性 CLI 命令不会显示出来

CLI 往往会为了短暂的一次性命令而连接。为避免刷屏
Instances 列表，`client.mode === "cli"` **不会** 被转换为在线状态条目。

### 3) `system-event` 信标

客户端可以通过 `system-event` 方法发送更丰富的周期性信标。mac
应用使用该方式上报主机名、IP 和 `lastInputSeconds`。

### 4) 节点连接（role: node）

当一个节点以 `role: node` 通过 Gateway 网关 WebSocket 连接时，Gateway 网关会为该节点 upsert 一条在线状态记录（流程与其他 WS 客户端相同）。

## 合并 + 去重规则（为什么 `instanceId` 很重要）

在线状态条目存储在单个内存 map 中：

- 条目以 **presence key** 作为键。
- 最佳键是稳定的 `instanceId`（来自 `connect.client.instanceId`），它能在重启后保持不变。
- 键不区分大小写。

如果客户端在重连时没有提供稳定的 `instanceId`，它就可能显示为一条**重复**记录。

## TTL 和有界大小

在线状态本身就是有意设计为临时性的：

- **TTL：** 超过 5 分钟的条目会被清理
- **最大条目数：** 200（最旧的优先丢弃）

这样可以保持列表新鲜，并避免内存无限增长。

## 远程 / 隧道注意事项（回环 IP）

当客户端通过 SSH 隧道 / 本地端口转发连接时，Gateway 网关可能会将远端地址识别为 `127.0.0.1`。为避免覆盖客户端已上报的有效 IP，回环远端地址会被忽略。

## 使用方

### macOS Instances 选项卡

macOS 应用会渲染 `system-presence` 的输出，并基于最近更新时间的年龄应用一个简短的状态指示器（Active / Idle / Stale）。

## 调试提示

- 如需查看原始列表，可对 Gateway 网关调用 `system-presence`。
- 如果你看到了重复项：
  - 确认客户端在握手时发送了稳定的 `client.instanceId`
  - 确认周期性信标使用的是相同的 `instanceId`
  - 检查由连接派生的条目是否缺少 `instanceId`（这种情况下出现重复是预期行为）

## 相关内容

- [输入中指示器](/zh-CN/concepts/typing-indicators)
- [流式传输与分块](/zh-CN/concepts/streaming)
