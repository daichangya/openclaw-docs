---
read_when:
    - 运行或排查远程 Gateway 网关设置问题
summary: 使用 SSH 隧道（Gateway WS）和 tailnet 进行远程访问
title: 远程访问
x-i18n:
    generated_at: "2026-04-23T20:49:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68846d05fdbeb2e0041df2db02923b4b508170ce62c99b46e1c4099fed029aab
    source_path: gateway/remote.md
    workflow: 15
---

# 远程访问

使用 SSH 隧道（Gateway 网关 WS）和 tailnet 进行远程访问。

本仓库支持“通过 SSH 远程访问”，方法是在专用主机（桌面机/服务器）上运行一个单独的 Gateway 网关（主实例），并让客户端连接到它。

- 对于**操作员（你 / macOS 应用）**：SSH 隧道是通用回退方式。
- 对于**节点（iOS/Android 和未来设备）**：连接到 Gateway 网关 **WebSocket**（根据需要通过局域网/tailnet 或 SSH 隧道）。

## 核心思路

- Gateway 网关 WebSocket 会绑定到你所配置端口上的**loopback**（默认 18789）。
- 对于远程使用，你可以通过 SSH 转发这个 loopback 端口（或者使用 tailnet/VPN 并尽量减少隧道需求）。

## 常见 VPN/tailnet 设置（智能体驻留位置）

可以把 **Gateway 网关主机** 理解为“智能体所在之处”。它负责会话、认证配置档案、渠道和状态。
你的笔记本/台式机（以及节点）都会连接到这台主机。

### 1）tailnet 中始终在线的 Gateway 网关（VPS 或家庭服务器）

在一台持久化主机上运行 Gateway 网关，并通过 **Tailscale** 或 SSH 访问它。

- **最佳 UX：** 保持 `gateway.bind: "loopback"` 并为控制 UI 使用 **Tailscale Serve**。
- **回退方式：** 保持 loopback + 从任意需要访问的机器建立 SSH 隧道。
- **示例：** [exe.dev](/zh-CN/install/exe-dev)（简易 VM）或 [Hetzner](/zh-CN/install/hetzner)（生产 VPS）。

如果你的笔记本经常休眠，但你希望智能体始终在线，这种方式最理想。

### 2）家庭桌面机运行 Gateway 网关，笔记本用于远程控制

笔记本**不运行**智能体。它通过远程方式连接：

- 使用 macOS 应用的**通过 SSH 远程**模式（设置 → 通用 → “OpenClaw runs”）。
- 应用会打开并管理隧道，因此 WebChat + 健康检查都能“直接工作”。

操作手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

### 3）笔记本运行 Gateway 网关，从其他机器远程访问

保持 Gateway 网关本地运行，但安全地暴露它：

- 从其他机器 SSH 隧道到笔记本，或
- 使用 Tailscale Serve 暴露控制 UI，同时保持 Gateway 网关仅绑定 loopback。

指南：[Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/zh-CN/web)。

## 命令流（哪些运行在哪）

一个 gateway 服务负责状态 + 渠道。节点是外设。

示例流程（Telegram → 节点）：

- Telegram 消息到达**Gateway 网关**。
- Gateway 网关运行**智能体**并决定是否调用某个节点工具。
- Gateway 网关通过 Gateway 网关 WebSocket（`node.*` RPC）调用**节点**。
- 节点返回结果；Gateway 网关再将回复发回 Telegram。

说明：

- **节点不会运行 gateway 服务。** 每台主机通常只应运行一个 gateway，除非你有意运行隔离的 profile（请参阅[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)）。
- macOS 应用的“节点模式”只是一个通过 Gateway 网关 WebSocket 连接的节点客户端。

## SSH 隧道（CLI + 工具）

创建一个到远程 Gateway 网关 WS 的本地隧道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

隧道建立后：

- `openclaw health` 和 `openclaw status --deep` 就会通过 `ws://127.0.0.1:18789` 访问远程 gateway。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 以及 `openclaw gateway call` 也可以在需要时通过 `--url` 指向该转发 URL。

注意：请将 `18789` 替换为你配置的 `gateway.port`（或 `--port`/`OPENCLAW_GATEWAY_PORT`）。
注意：当你传入 `--url` 时，CLI 不会回退到配置或环境变量凭证。
请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。

## CLI 远程默认值

你可以持久化一个远程目标，以便 CLI 命令默认使用它：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

当 gateway 仅绑定 loopback 时，请保持 URL 为 `ws://127.0.0.1:18789`，并先建立 SSH 隧道。

## 凭证优先级

Gateway 网关凭证解析在 call/probe/status 路径以及 Discord exec-approval 监控中遵循同一个共享契约。node-host 使用相同的基础契约，但有一个本地模式例外（它会有意忽略 `gateway.remote.*`）：

- 显式凭证（`--token`、`--password` 或工具中的 `gatewayToken`）在接受显式认证的调用路径上始终优先。
- URL 覆盖安全性：
  - CLI URL 覆盖（`--url`）绝不会复用隐式配置/环境变量凭证。
  - 环境变量 URL 覆盖（`OPENCLAW_GATEWAY_URL`）只能使用环境变量凭证（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- 本地模式默认值：
  - token：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（仅当本地认证 token 输入未设置时，才会应用远程回退）
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（仅当本地认证 password 输入未设置时，才会应用远程回退）
- 远程模式默认值：
  - token：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- node-host 本地模式例外：会忽略 `gateway.remote.token` / `gateway.remote.password`。
- 远程 probe/status 的 token 检查默认是严格的：当目标是远程模式时，它们只使用 `gateway.remote.token`（不会回退到本地 token）。
- Gateway 网关环境变量覆盖仅使用 `OPENCLAW_GATEWAY_*`。

## 通过 SSH 使用聊天 UI

WebChat 不再使用独立的 HTTP 端口。SwiftUI 聊天 UI 会直接连接到 Gateway 网关 WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后将客户端连接到 `ws://127.0.0.1:18789`。
- 在 macOS 上，优先使用应用的“通过 SSH 远程”模式，它会自动管理隧道。

## macOS 应用“通过 SSH 远程”

macOS 菜单栏应用可以端到端驱动同一套设置（远程状态检查、WebChat 和 Voice Wake 转发）。

操作手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

## 安全规则（远程/VPN）

简短版：**除非你明确知道自己需要非 loopback 绑定，否则请保持 Gateway 网关只绑定 loopback。**

- **Loopback + SSH/Tailscale Serve** 是最安全的默认值（无公网暴露）。
- 明文 `ws://` 默认仅限 loopback。对于可信私有网络，
  可在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作为紧急放行。
- **非 loopback 绑定**（`lan`/`tailnet`/`custom`，或在 loopback 不可用时的 `auto`）必须使用 gateway 认证：token、password，或使用 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。
- `gateway.remote.token` / `.password` 是客户端凭证来源。它们本身**不会**配置服务器认证。
- 只有在 `gateway.auth.*` 未设置时，本地调用路径才会将 `gateway.remote.*` 用作回退。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但未解析，解析会以失败关闭（不会使用远程回退来掩盖）。
- 使用 `wss://` 时，`gateway.remote.tlsFingerprint` 会 pin 远程 TLS 证书。
- **Tailscale Serve** 可在 `gateway.auth.allowTailscale: true` 时通过身份标头认证控制 UI/WebSocket 流量；HTTP API 端点不会使用这种 Tailscale 标头认证，而是遵循 gateway 的常规 HTTP 认证模式。这种无 token 流程假定 gateway 主机是可信的。如果你希望所有地方都使用共享密钥认证，请将其设为 `false`。
- **Trusted-proxy** 认证仅适用于非 loopback 的身份感知型代理设置。
  同主机上的 loopback 反向代理不满足 `gateway.auth.mode: "trusted-proxy"`。
- 请将浏览器控制视为操作员访问：仅限 tailnet + 有意的节点配对。

深入说明：[安全](/zh-CN/gateway/security)。

### macOS：通过 LaunchAgent 持久化 SSH 隧道

对于连接到远程 gateway 的 macOS 客户端，最简单的持久化设置方式是：添加一个 SSH `LocalForward` 配置项，并使用 LaunchAgent 在重启和崩溃后保持隧道存活。

#### 第 1 步：添加 SSH 配置

编辑 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

请将 `<REMOTE_IP>` 和 `<REMOTE_USER>` 替换为你的实际值。

#### 第 2 步：复制 SSH 密钥（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 第 3 步：配置 gateway 令牌

将令牌保存到配置中，以便重启后仍然保留：

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 第 4 步：创建 LaunchAgent

将以下内容保存为 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### 第 5 步：加载 LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

该隧道会在登录时自动启动、崩溃后自动重启，并保持转发端口持续可用。

注意：如果你有一个来自旧设置的遗留 `com.openclaw.ssh-tunnel` LaunchAgent，请先卸载并删除它。

#### 故障排除

检查隧道是否正在运行：

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

重启隧道：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

停止隧道：

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 配置项 | 作用 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 将本地端口 18789 转发到远程端口 18789 |
| `ssh -N` | 不执行远程命令的 SSH（仅进行端口转发） |
| `KeepAlive` | 如果隧道崩溃则自动重启 |
| `RunAtLoad` | 在登录时 LaunchAgent 加载后启动隧道 |
