---
read_when:
    - 在 macOS/iOS 上调试 Bonjour 发现问题
    - 更改 mDNS 服务类型、TXT 记录或发现 UX
summary: Bonjour/mDNS 发现 + 调试（Gateway 网关信标、客户端以及常见故障模式）
title: Bonjour 发现
x-i18n:
    generated_at: "2026-04-24T06:33:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS 发现

OpenClaw 使用 Bonjour（mDNS / DNS‑SD）来发现活动中的 Gateway 网关（WebSocket 端点）。
多播 `local.` 浏览是一种**仅限局域网的便利机制**。内置的 `bonjour`
插件负责局域网广播，且默认启用。对于跨网络发现，
同一个信标也可以通过已配置的广域 DNS-SD 域发布。
发现机制仍然是尽力而为，**不能**替代 SSH 或基于 Tailnet 的连接方式。

## 通过 Tailscale 使用广域 Bonjour（单播 DNS-SD）

如果节点和 Gateway 网关位于不同网络，多播 mDNS 不会跨越该
边界。你可以切换到**单播 DNS‑SD**
（“广域 Bonjour”）并通过 Tailscale 使用它，从而保留相同的发现 UX。

高级步骤如下：

1. 在 Gateway 网关主机上运行 DNS 服务器（可通过 Tailnet 访问）。
2. 在专用区域下为 `_openclaw-gw._tcp` 发布 DNS‑SD 记录
   （示例：`openclaw.internal.`）。
3. 配置 Tailscale **split DNS**，使你的选定域通过该
   DNS 服务器为客户端（包括 iOS）解析。

OpenClaw 支持任意发现域；`openclaw.internal.` 只是一个示例。
iOS/Android 节点会同时浏览 `local.` 和你配置的广域域名。

### Gateway 网关配置（推荐）

```json5
{
  gateway: { bind: "tailnet" }, // 仅 tailnet（推荐）
  discovery: { wideArea: { enabled: true } }, // 启用广域 DNS-SD 发布
}
```

### 一次性 DNS 服务器设置（Gateway 网关主机）

```bash
openclaw dns setup --apply
```

这会安装 CoreDNS 并将其配置为：

- 仅在 Gateway 网关的 Tailscale 接口上的 53 端口监听
- 从 `~/.openclaw/dns/<domain>.db` 为你选择的域（示例：`openclaw.internal.`）提供服务

在已连接 tailnet 的机器上验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加一个指向 Gateway 网关 tailnet IP 的 nameserver（UDP/TCP 53）。
- 添加 split DNS，使你的发现域使用该 nameserver。

一旦客户端接受 tailnet DNS，iOS 节点和 CLI 发现就可以在你的发现域中浏览
`_openclaw-gw._tcp`，而无需多播。

### Gateway 网关监听器安全性（推荐）

Gateway 网关 WS 端口（默认 `18789`）默认绑定到 loopback。对于局域网/tailnet
访问，请显式绑定并保持身份验证启用。

对于仅 tailnet 的设置：

- 在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启 Gateway 网关（或重启 macOS 菜单栏应用）。

## 广播内容

只有 Gateway 网关会广播 `_openclaw-gw._tcp`。局域网多播广播由
内置的 `bonjour` 插件提供；广域 DNS-SD 发布仍由
Gateway 网关负责。

## 服务类型

- `_openclaw-gw._tcp` — Gateway 网关传输信标（由 macOS/iOS/Android 节点使用）。

## TXT 键（非敏感提示）

Gateway 网关会广播少量非敏感提示，以便让 UI 流程更方便：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway 网关 WS + HTTP）
- `gatewayTls=1`（仅在启用 TLS 时）
- `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
- `canvasPort=<port>`（仅在启用 canvas host 时；当前与 `gatewayPort` 相同）
- `transport=gateway`
- `tailnetDns=<magicdns>`（仅限 mDNS 完整模式；当 Tailnet 可用时的可选提示）
- `sshPort=<port>`（仅限 mDNS 完整模式；广域 DNS-SD 可能省略它）
- `cliPath=<path>`（仅限 mDNS 完整模式；广域 DNS-SD 仍会将其写入，作为远程安装提示）

安全说明：

- Bonjour/mDNS TXT 记录是**未经身份验证的**。客户端不得将 TXT 视为权威路由信息。
- 客户端应使用解析后的服务端点（SRV + A/AAAA）进行路由。仅将 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 视为提示。
- SSH 自动定向同样应使用解析后的服务主机，而不是仅依赖 TXT 提示。
- TLS pinning 绝不能允许已广播的 `gatewayTlsSha256` 覆盖先前存储的 pin。
- iOS/Android 节点应将基于发现的直连视为**仅限 TLS**，并在信任首次出现的指纹前要求用户明确确认。

## 在 macOS 上调试

有用的内置工具：

- 浏览实例：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析单个实例（将 `<instance>` 替换为实际值）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果浏览正常但解析失败，通常意味着你遇到了局域网策略或
mDNS 解析器问题。

## 在 Gateway 网关日志中调试

Gateway 网关会写入滚动日志文件（启动时会打印为
`gateway log file: ...`）。请查找 `bonjour:` 日志行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 发现 `_openclaw-gw._tcp`。

要捕获日志：

- 设置 → Gateway 网关 → 高级 → **发现调试日志**
- 设置 → Gateway 网关 → 高级 → **发现日志** → 复现问题 → **复制**

日志包含浏览器状态转换和结果集变化。

## 常见故障模式

- **Bonjour 无法跨网络工作**：请使用 Tailnet 或 SSH。
- **多播被阻止**：某些 Wi‑Fi 网络会禁用 mDNS。
- **睡眠 / 接口频繁变化**：macOS 可能会暂时丢失 mDNS 结果；请重试。
- **浏览正常但解析失败**：请保持机器名简单（避免使用表情符号或
  标点符号），然后重启 Gateway 网关。服务实例名称派生自
  主机名，因此过于复杂的名称可能会让某些解析器混淆。

## 转义的实例名称（`\032`）

Bonjour/DNS‑SD 通常会将服务实例名称中的字节转义为十进制 `\DDD`
序列（例如，空格会变成 `\032`）。

- 这在协议层面是正常现象。
- UI 应为显示进行解码（iOS 使用 `BonjourEscapes.decode`）。

## 禁用 / 配置

- `openclaw plugins disable bonjour` 会通过禁用内置插件来禁用局域网多播广播。
- `openclaw plugins enable bonjour` 会恢复默认的局域网发现插件。
- `OPENCLAW_DISABLE_BONJOUR=1` 会在不更改插件配置的情况下禁用局域网多播广播；接受的真值包括 `1`、`true`、`yes` 和 `on`（旧版：`OPENCLAW_DISABLE_BONJOUR`）。
- `gateway.bind`（位于 `~/.openclaw/openclaw.json`）控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 会在广播 `sshPort` 时覆盖 SSH 端口（旧版：`OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` 会在启用 mDNS 完整模式时在 TXT 中发布 MagicDNS 提示（旧版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 会覆盖已广播的 CLI 路径（旧版：`OPENCLAW_CLI_PATH`）。

## 相关文档

- 设备发现策略和传输选择：[Discovery](/zh-CN/gateway/discovery)
- 节点配对 + 批准：[Gateway pairing](/zh-CN/gateway/pairing)
