---
read_when:
    - 在 OpenClaw.app 中托管 PeekabooBridge
    - 通过 Swift Package Manager 集成 Peekaboo
    - 更改 PeekabooBridge 协议/路径
summary: 用于 macOS UI 自动化的 PeekabooBridge 集成
title: Peekaboo bridge
x-i18n:
    generated_at: "2026-04-23T22:59:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 638f7a0e8d85d0cfcade259a934108e9ec7a1ccc894c9db0d1bd3cf1de99441d
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw 可以将 **PeekabooBridge** 托管为本地、具备权限感知能力的 UI 自动化代理。这让 `peekaboo` CLI 可以驱动 UI 自动化，同时复用 macOS 应用的 TCC 权限。

## 这是什么（以及不是什么）

- **Host**：OpenClaw.app 可以作为 PeekabooBridge host。
- **Client**：使用 `peekaboo` CLI（没有单独的 `openclaw ui ...` 界面）。
- **UI**：可视化叠加层仍保留在 Peekaboo.app 中；OpenClaw 只是一个轻量 broker host。

## 启用 bridge

在 macOS 应用中：

- 设置 → **Enable Peekaboo Bridge**

启用后，OpenClaw 会启动一个本地 UNIX socket 服务器。禁用后，host 会停止，`peekaboo` 将回退到其他可用 host。

## Client 发现顺序

Peekaboo client 通常按以下顺序尝试 host：

1. Peekaboo.app（完整 UX）
2. Claude.app（如果已安装）
3. OpenClaw.app（轻量 broker）

使用 `peekaboo bridge status --verbose` 可查看当前活动的 host 以及正在使用的 socket 路径。你也可以通过以下方式覆盖：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全与权限

- bridge 会验证**调用方代码签名**；会强制执行 TeamID 允许列表（Peekaboo host TeamID + OpenClaw 应用 TeamID）。
- 请求会在大约 10 秒后超时。
- 如果缺少所需权限，bridge 会返回清晰的错误消息，而不是启动系统设置。

## 快照行为（自动化）

快照会存储在内存中，并在短时间后自动过期。
如果你需要更长的保留时间，请从 client 重新捕获。

## 故障排除

- 如果 `peekaboo` 报告“bridge client is not authorized”，请确认 client 已正确签名；或者仅在**调试**模式下，以 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 运行 host。
- 如果未找到任何 host，请打开某个 host 应用（Peekaboo.app 或 OpenClaw.app），并确认权限已授予。
