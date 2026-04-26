---
read_when:
    - 设置或调试远程 Mac 控制
summary: 通过 SSH 控制远程 OpenClaw Gateway 网关的 macOS 应用流程
title: 远程控制
x-i18n:
    generated_at: "2026-04-26T04:29:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# 远程 OpenClaw（macOS ⇄ 远程主机）

此流程让 macOS 应用作为运行在另一台主机（桌面机/服务器）上的 OpenClaw Gateway 网关的完整远程控制端。这是应用中的**通过 SSH 远程连接**（远程运行）功能。所有功能——运行状况检查、Voice Wake 转发以及 Web Chat——都会复用 _设置 → 通用_ 中相同的远程 SSH 配置。

## 模式

- **本地（这台 Mac）**：所有内容都在这台笔记本上运行。不涉及 SSH。
- **通过 SSH 远程连接（默认）**：OpenClaw 命令会在远程主机上执行。Mac 应用会使用 `-o BatchMode`、你选择的身份/密钥以及本地端口转发来建立 SSH 连接。
- **远程直连（ws/wss）**：不使用 SSH 隧道。Mac 应用直接连接到 Gateway 网关 URL（例如，通过 Tailscale Serve 或公共 HTTPS 反向代理）。

## 远程传输方式

远程模式支持两种传输方式：

- **SSH 隧道**（默认）：使用 `ssh -N -L ...` 将 Gateway 网关端口转发到 localhost。由于该隧道使用 loopback，Gateway 网关看到的节点 IP 会是 `127.0.0.1`。
- **直连（ws/wss）**：直接连接到 Gateway 网关 URL。Gateway 网关会看到真实的客户端 IP。

在 SSH 隧道模式下，发现的局域网 / tailnet 主机名会保存为
`gateway.remote.sshTarget`。应用会将 `gateway.remote.url` 保持为本地
隧道端点，例如 `ws://127.0.0.1:18789`，这样 CLI、Web Chat 和
本地节点宿主服务都会使用相同且安全的 loopback 传输。

远程模式下的浏览器自动化由 CLI 节点宿主管理，而不是由原生 macOS 应用节点管理。应用会在可能时启动已安装的节点宿主服务；如果你需要从那台 Mac 控制浏览器，请使用 `openclaw node install ...` 和 `openclaw node start` 安装/启动它（或在前台运行
`openclaw node run ...`），然后将目标指向那个具备浏览器能力的节点。

## 远程主机上的前置条件

1. 安装 Node 和 pnpm，并构建/安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保 `openclaw` 对非交互式 shell 可用并位于 PATH 中（如有需要，可创建到 `/usr/local/bin` 或 `/opt/homebrew/bin` 的符号链接）。
3. 开启 SSH 并使用密钥认证。我们建议使用 **Tailscale** IP，以便在非局域网环境下也能稳定连接。

## macOS 应用设置

1. 打开 _设置 → 通用_。
2. 在 **OpenClaw 运行位置** 下，选择 **通过 SSH 远程连接**，并设置：
   - **传输方式**：**SSH 隧道** 或 **直连（ws/wss）**。
   - **SSH 目标**：`user@host`（可选 `:port`）。
     - 如果 Gateway 网关位于同一局域网并通过 Bonjour 广播，可以从发现列表中选择它来自动填充此字段。
   - **Gateway 网关 URL**（仅直连）：`wss://gateway.example.ts.net`（本地/局域网可使用 `ws://...`）。
   - **身份文件**（高级）：你的密钥路径。
   - **项目根目录**（高级）：用于执行命令的远程检出路径。
   - **CLI 路径**（高级）：可选，指向可运行的 `openclaw` 入口点/二进制文件路径（如已广播会自动填充）。
3. 点击 **测试远程连接**。成功表示远程 `openclaw status --json` 能正常运行。失败通常意味着 PATH/CLI 问题；退出码 127 表示在远程端找不到 CLI。
4. 运行状况检查和 Web Chat 现在都会自动通过这个 SSH 隧道运行。

## Web Chat

- **SSH 隧道**：Web Chat 通过转发后的 WebSocket 控制端口（默认 18789）连接到 Gateway 网关。
- **直连（ws/wss）**：Web Chat 直接连接到配置的 Gateway 网关 URL。
- 现在不再有单独的 WebChat HTTP 服务器。

## 权限

- 远程主机需要与本地相同的 TCC 授权（自动化、辅助功能、屏幕录制、麦克风、语音识别、通知）。请在那台机器上运行新手引导，一次性授予这些权限。
- 节点会通过 `node.list` / `node.describe` 广播其权限状态，以便智能体了解哪些能力可用。

## 安全说明

- 优先在远程主机上绑定到 loopback 地址，并通过 SSH 或 Tailscale 连接。
- SSH 隧道使用严格的主机密钥检查；请先信任该主机密钥，使其存在于 `~/.ssh/known_hosts` 中。
- 如果你将 Gateway 网关绑定到非 loopback 接口，请务必启用有效的 Gateway 网关认证：token、密码，或启用了 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 参见 [安全](/zh-CN/gateway/security) 和 [Tailscale](/zh-CN/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- 在**远程主机上**运行 `openclaw channels login --verbose`。然后使用你手机上的 WhatsApp 扫描二维码。
- 如果认证过期，请在该主机上重新运行登录。运行状况检查会提示链接问题。

## 故障排除

- **exit 127 / not found**：`openclaw` 不在非登录 shell 的 PATH 中。请将其添加到 `/etc/paths`、你的 shell rc 中，或创建到 `/usr/local/bin`/`/opt/homebrew/bin` 的符号链接。
- **运行状况探测失败**：检查 SSH 连通性、PATH，以及 Baileys 是否已登录（`openclaw status --json`）。
- **Web Chat 卡住**：确认 Gateway 网关正在远程主机上运行，并且转发端口与 Gateway 网关 WS 端口一致；UI 需要健康的 WS 连接。
- **节点 IP 显示为 127.0.0.1**：这是 SSH 隧道下的预期行为。如果你希望 Gateway 网关看到真实客户端 IP，请将**传输方式**切换为 **直连（ws/wss）**。
- **Voice Wake**：在远程模式下，触发短语会自动转发；不需要单独的转发器。

## 通知声音

你可以通过脚本中的 `openclaw` 和 `node.invoke` 为每条通知单独选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中已不再提供全局“默认声音”开关；调用方需要为每个请求单独选择声音（或不选择）。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [远程访问](/zh-CN/gateway/remote)
