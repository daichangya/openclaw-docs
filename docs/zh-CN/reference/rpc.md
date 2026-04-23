---
read_when:
    - 添加或更改外部 CLI 集成
    - 调试 RPC 适配器（signal-cli、imsg）
summary: 面向外部 CLI（signal-cli、旧版 imsg）的 RPC 适配器与 Gateway 网关模式
title: RPC 适配器
x-i18n:
    generated_at: "2026-04-23T21:03:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a415f5ea7283de361dfe677518c79107e6c16700e821e345a8a10c30d1ffeb
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw 通过 JSON-RPC 集成外部 CLI。目前使用两种模式。

## 模式 A：HTTP 守护进程（signal-cli）

- `signal-cli` 作为守护进程运行，并通过 HTTP 提供 JSON-RPC。
- 事件流使用 SSE（`/api/v1/events`）。
- 健康探测端点：`/api/v1/check`。
- 当 `channels.signal.autoStart=true` 时，OpenClaw 持有其生命周期。

设置和端点请参阅 [Signal](/zh-CN/channels/signal)。

## 模式 B：stdio 子进程（旧版：imsg）

> **注意：** 对于新的 iMessage 设置，请改用 [BlueBubbles](/zh-CN/channels/bluebubbles)。

- OpenClaw 会生成一个 `imsg rpc` 子进程（旧版 iMessage 集成）。
- JSON-RPC 通过 stdin / stdout 进行逐行分隔传输（每行一个 JSON 对象）。
- 无需 TCP 端口，也不需要守护进程。

使用的核心方法：

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（探测 / 诊断）

旧版设置和寻址（优先使用 `chat_id`）请参阅 [iMessage](/zh-CN/channels/imessage)。

## 适配器指南

- 由 Gateway 网关持有进程（启动 / 停止与提供商生命周期绑定）。
- 保持 RPC 客户端具备韧性：超时、进程退出后重启。
- 优先使用稳定 ID（例如 `chat_id`），不要依赖显示字符串。
