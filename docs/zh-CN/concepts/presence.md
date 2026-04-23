---
read_when:
    - 调试实例标签页
    - 调查重复或过时的实例行
    - 更改 Gateway 网关 WS 连接或系统事件 beacon
summary: OpenClaw 的 presence 条目是如何生成、合并并显示的
title: Presence
x-i18n:
    generated_at: "2026-04-23T20:46:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52d3253a8fe288e8f74fee2f8f3ee67a2cba7e994f26aa0d77160a7933464f03
    source_path: concepts/presence.md
    workflow: 15
---

  OpenClaw 的 “presence” 是一种轻量级、尽力而为的视图，用于展示：

  - **Gateway 网关**本身，以及
  - **连接到 Gateway 网关的客户端**（mac 应用、WebChat、CLI 等）

  Presence 主要用于渲染 macOS 应用中的 **Instances** 标签页，并为操作员
  提供快速可见性。

  ## Presence 字段（会显示什么）

  Presence 条目是结构化对象，包含以下字段：

  - `instanceId`（可选，但强烈推荐）：稳定的客户端身份（通常为 `connect.client.instanceId`）
  - `host`：人类可读的主机名
  - `ip`：尽力获取的 IP 地址
  - `version`：客户端版本字符串
  - `deviceFamily` / `modelIdentifier`：硬件提示信息
  - `mode`：`ui`、`webchat`、`cli`、`backend`、`probe`、`test`、`node` 等
  - `lastInputSeconds`：“距离上次用户输入的秒数”（如果已知）
  - `reason`：`self`、`connect`、`node-connected`、`periodic` 等
  - `ts`：最近更新时间戳（自 epoch 起的毫秒数）

  ## 生产者（presence 从哪里来）

  Presence 条目由多个来源生成，并且会被**合并**。

  ### 1) Gateway 网关自身条目

  Gateway 网关在启动时总会预置一个 “self” 条目，这样 UI 即使在还没有客户端连接时，
  也能显示 Gateway 网关主机。

  ### 2) WebSocket 连接

  每个 WS 客户端都从一个 `connect` 请求开始。在握手成功后，
  Gateway 网关会为该连接 upsert 一个 presence 条目。

  #### 为什么一次性 CLI 命令不会显示出来

  CLI 通常只为短暂的一次性命令建立连接。为了避免刷屏
  Instances 列表，`client.mode === "cli"` **不会**被转换为 presence 条目。

  ### 3) `system-event` beacon

  客户端可以通过 `system-event` 方法发送更丰富的周期性 beacon。mac
  应用使用这种方式来报告主机名、IP 和 `lastInputSeconds`。

  ### 4) 节点连接（role: node）

  当节点以 `role: node` 通过 Gateway 网关 WebSocket 连接时，Gateway 网关
  会为该节点 upsert 一个 presence 条目（流程与其他 WS 客户端相同）。

  ## 合并 + 去重规则（为什么 `instanceId` 很重要）

  Presence 条目存储在一个统一的内存 map 中：

  - 条目以**presence key** 作为键。
  - 最好的键是稳定的 `instanceId`（来自 `connect.client.instanceId`），它在重启后仍能保留。
  - 键不区分大小写。

  如果客户端在没有稳定 `instanceId` 的情况下重新连接，它可能会显示为
  **重复**行。

  ## TTL 和有界大小

  Presence 有意设计为短暂存在：

  - **TTL：** 超过 5 分钟的条目会被清理
  - **最大条目数：** 200（最旧的先被移除）

  这样可以保持列表新鲜，并避免内存无限增长。

  ## 远程 / 隧道注意事项（loopback IP）

  当客户端通过 SSH 隧道 / 本地端口转发连接时，Gateway 网关可能会
  将远端地址识别为 `127.0.0.1`。为了避免覆盖客户端已报告的有效
  IP，会忽略 loopback 远端地址。

  ## 消费方

  ### macOS Instances 标签页

  macOS 应用会渲染 `system-presence` 的输出，并根据最近更新时间的年龄
  应用一个小型状态指示器（Active / Idle / Stale）。

  ## 调试提示

  - 要查看原始列表，请对 Gateway 网关调用 `system-presence`。
  - 如果你看到重复项：
  - 请确认客户端在握手中发送了稳定的 `client.instanceId`
  - 请确认周期性 beacon 使用相同的 `instanceId`
  - 检查是否连接派生条目缺少 `instanceId`（这种情况下出现重复是预期行为）
