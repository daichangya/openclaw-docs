---
read_when:
    - 在 OpenClaw.app 中托管 PeekabooBridge
    - 通过 Swift Package Manager 集成 Peekaboo
    - 更改 PeekabooBridge 协议/路径
summary: 用于 macOS UI 自动化的 PeekabooBridge 集成
title: Peekaboo bridge
x-i18n:
    generated_at: "2026-04-23T20:55:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebd4efbf2a1c45e59795fca8b746b859a8bfd7370ec24aa94da84a94e1f6544c
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge（macOS UI 自动化）

OpenClaw 可以将 **PeekabooBridge** 作为本地、具备权限感知能力的 UI 自动化
代理主机。这使得 `peekaboo` CLI 能够驱动 UI 自动化，同时复用
macOS 应用的 TCC 权限。

## 这是什么（以及不是什么）

- **主机**：OpenClaw.app 可以充当 PeekabooBridge 主机。
- **客户端**：使用 `peekaboo` CLI（没有单独的 `openclaw ui ...` 命令面）。
- **UI**：可视化覆盖层仍然由 Peekaboo.app 提供；OpenClaw 只是一个轻量代理主机。

## 启用 bridge

在 macOS 应用中：

- 设置 → **Enable Peekaboo Bridge**

启用后，OpenClaw 会启动一个本地 UNIX socket 服务器。禁用后，主机会
停止，`peekaboo` 将回退到其他可用主机。

## 客户端发现顺序

Peekaboo 客户端通常按以下顺序尝试主机：

1. Peekaboo.app（完整 UX）
2. Claude.app（如果已安装）
3. OpenClaw.app（轻量代理）

使用 `peekaboo bridge status --verbose` 查看当前活动主机以及
正在使用的 socket 路径。你也可以通过以下方式覆盖：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全性与权限

- bridge 会校验**调用方代码签名**；会强制执行一个 TeamID allowlist
  （Peekaboo 主机 TeamID + OpenClaw 应用 TeamID）。
- 请求约在 10 秒后超时。
- 如果缺少所需权限，bridge 会返回清晰的错误消息，
  而不是启动系统设置。

## 快照行为（自动化）

快照会存储在内存中，并在短时间窗口后自动过期。
如果你需要更长保留时间，请从客户端重新捕获。

## 故障排除

- 如果 `peekaboo` 报告 “bridge client is not authorized”，请确认客户端
  已正确签名，或者仅在**调试**模式下使用 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  运行主机。
- 如果未找到任何主机，请打开其中一个主机应用（Peekaboo.app 或 OpenClaw.app），
  并确认相关权限已授予。
