---
read_when:
    - 在 macOS/iOS 上调试 Bonjour 发现问题
    - 更改 mDNS 服务类型、TXT 记录或发现 UX
summary: Bonjour/mDNS 发现 + 调试（Gateway 网关信标、客户端和常见故障模式）
title: Bonjour 发现
x-i18n:
    generated_at: "2026-04-26T04:59:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS 发现

OpenClaw 使用 Bonjour（mDNS / DNS‑SD）来发现活动中的 Gateway 网关（WebSocket 端点）。
多播 `local.` 浏览是**仅限局域网的便利功能**。内置的 `bonjour`
插件负责局域网广播，且默认启用。对于跨网络发现，
同一个信标也可以通过已配置的广域 DNS-SD 域发布。
发现机制仍然是尽力而为，**不能**替代 SSH 或基于 Tailnet 的连接方式。

## 通过 Tailscale 使用广域 Bonjour（单播 DNS-SD）

如果节点和网关位于不同网络，多播 mDNS 无法跨越
网络边界。你可以通过在 Tailscale 上切换到**单播 DNS‑SD**
（“广域 Bonjour”）来保留相同的发现 UX。

高级步骤：

1. 在网关主机上运行一个 DNS 服务器（可通过 Tailnet 访问）。
2. 在专用区域下为 `_openclaw-gw._tcp` 发布 DNS‑SD 记录
   （示例：`openclaw.internal.`）。
3. 配置 Tailscale **split DNS**，使你的所选域通过该
   DNS 服务器为客户端解析（包括 iOS）。

OpenClaw 支持任何发现域；`openclaw.internal.` 只是一个示例。
iOS/Android 节点会同时浏览 `local.` 和你配置的广域域。

### Gateway 网关配置（推荐）

```json5
{
  gateway: { bind: "tailnet" }, // 仅 tailnet（推荐）
  discovery: { wideArea: { enabled: true } }, // 启用广域 DNS-SD 发布
}
```

### 一次性 DNS 服务器设置（网关主机）

```bash
openclaw dns setup --apply
```

这会安装 CoreDNS 并将其配置为：

- 仅在网关的 Tailscale 接口上的 53 端口监听
- 从 `~/.openclaw/dns/<domain>.db` 为你选择的域（示例：`openclaw.internal.`）提供服务

在连接到 tailnet 的机器上验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加一个指向网关 tailnet IP 的名称服务器（UDP/TCP 53）。
- 添加 split DNS，使你的发现域使用该名称服务器。

一旦客户端接受 tailnet DNS，iOS 节点和 CLI 发现就可以在你的发现域中
浏览 `_openclaw-gw._tcp`，而无需使用多播。

### Gateway 网关监听器安全性（推荐）

Gateway 网关 WS 端口（默认 `18789`）默认绑定到 loopback。对于局域网 / tailnet
访问，请显式绑定并保持启用认证。

对于仅 tailnet 的设置：

- 在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启 Gateway 网关（或重启 macOS 菜单栏应用）。

## 广播内容

只有 Gateway 网关会广播 `_openclaw-gw._tcp`。局域网多播广播
由内置的 `bonjour` 插件提供；广域 DNS-SD 发布仍由
Gateway 网关负责。

## 服务类型

- `_openclaw-gw._tcp` — 网关传输信标（由 macOS/iOS/Android 节点使用）。

## TXT 键（非机密提示）

Gateway 网关会广播一些小型、非机密提示，以方便 UI 流程：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway 网关 WS + HTTP）
- `gatewayTls=1`（仅当启用 TLS 时）
- `gatewayTlsSha256=<sha256>`（仅当启用 TLS 且指纹可用时）
- `canvasPort=<port>`（仅当启用 canvas host 时；当前与 `gatewayPort` 相同）
- `transport=gateway`
- `tailnetDns=<magicdns>`（仅在 mDNS 完整模式下；当 Tailnet 可用时的可选提示）
- `sshPort=<port>`（仅在 mDNS 完整模式下；广域 DNS-SD 可能省略它）
- `cliPath=<path>`（仅在 mDNS 完整模式下；广域 DNS-SD 仍会将其写入为远程安装提示）

安全说明：

- Bonjour/mDNS TXT 记录是**未经身份验证的**。客户端不得将 TXT 视为权威路由信息。
- 客户端应使用已解析的服务端点（SRV + A/AAAA）进行路由。仅将 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 视为提示信息。
- SSH 自动定向同样应使用已解析的服务主机，而不是仅使用 TXT 提示。
- TLS pinning 绝不能允许已广播的 `gatewayTlsSha256` 覆盖先前已存储的 pin。
- iOS/Android 节点应将基于发现的直接连接视为**仅限 TLS**，并在信任首次出现的指纹之前要求用户明确确认。

## 在 macOS 上调试

有用的内置工具：

- 浏览实例：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析一个实例（替换 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果浏览正常但解析失败，通常说明你遇到了局域网策略或
mDNS 解析器问题。

## 在 Gateway 网关日志中调试

Gateway 网关会写入滚动日志文件（启动时会打印为
`gateway log file: ...`）。查找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 发现 `_openclaw-gw._tcp`。

要捕获日志：

- 设置 → Gateway 网关 → 高级 → **Discovery 调试日志**
- 设置 → Gateway 网关 → 高级 → **Discovery 日志** → 复现问题 → **复制**

日志包含浏览器状态转换和结果集变化。

## 何时禁用 Bonjour

仅当局域网多播广播不可用或有害时，才禁用 Bonjour。
常见情况是 Gateway 网关运行在 Docker bridge 网络、WSL 后面，或处于
会丢弃 mDNS 多播的网络策略中。在这些环境中，Gateway 网关
仍可通过其已发布的 URL、SSH、Tailnet 或广域 DNS-SD 访问，
但局域网自动发现并不可靠。

如果问题仅限于部署范围，优先使用现有的环境变量覆盖：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

这会禁用局域网多播广播，而不会更改插件配置。
它适用于 Docker 镜像、服务文件、启动脚本和一次性
调试，因为环境变量移除后该设置也会消失。

仅当你有意要为该 OpenClaw 配置关闭
内置局域网发现插件时，才使用插件配置：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事项

内置 Docker Compose 默认会为 Gateway 网关服务设置 `OPENCLAW_DISABLE_BONJOUR=1`。
Docker bridge 网络通常不会在容器与局域网之间转发 mDNS 多播
（`224.0.0.251:5353`），因此保持 Bonjour 启用可能会
产生反复的 ciao `probing` 或 `announcing` 失败，而不会让发现真正生效。

重要注意事项：

- 禁用 Bonjour 不会停止 Gateway 网关。它只会停止局域网多播
  广播。
- 禁用 Bonjour 不会更改 `gateway.bind`；Docker 仍默认使用
  `OPENCLAW_GATEWAY_BIND=lan`，以便已发布的主机端口能够工作。
- 禁用 Bonjour 不会禁用广域 DNS-SD。当 Gateway 网关和节点不在同一局域网时，
  请使用广域发现或 Tailnet。
- 在 Docker 外重用相同的 `OPENCLAW_CONFIG_DIR` 不会继承
  Compose 默认值，除非环境中仍设置了 `OPENCLAW_DISABLE_BONJOUR`。
- 仅当已知 mDNS 多播可通过 host networking、macvlan 或其他
  网络时，才设置 `OPENCLAW_DISABLE_BONJOUR=0`。

## 已禁用 Bonjour 的故障排除

如果在 Docker 设置后节点不再自动发现 Gateway 网关：

1. 确认 Gateway 网关是否有意抑制局域网广播：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 确认 Gateway 网关本身可通过已发布端口访问：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 在 Bonjour 被禁用时使用直接目标：
   - Control UI 或本地工具：`http://127.0.0.1:18789`
   - 局域网客户端：`http://<gateway-host>:18789`
   - 跨网络客户端：Tailnet MagicDNS、Tailnet IP、SSH 隧道或
     广域 DNS-SD

4. 如果你有意在 Docker 中通过
   `OPENCLAW_DISABLE_BONJOUR=0` 启用了 Bonjour，请从主机测试多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果浏览结果为空，或 Gateway 网关日志显示反复出现 ciao watchdog
   取消，请恢复 `OPENCLAW_DISABLE_BONJOUR=1` 并使用直接或
   Tailnet 路径。

## 常见故障模式

- **Bonjour 无法跨网络工作**：请使用 Tailnet 或 SSH。
- **多播被阻止**：某些 Wi‑Fi 网络会禁用 mDNS。
- **广播器卡在 probing/announcing**：多播被阻止的主机、
  容器桥接网络、WSL 或接口频繁变化，可能会让 ciao 广播器处于
  未广播状态。OpenClaw 会重试几次，然后为当前 Gateway 网关进程禁用 Bonjour，
  而不是无限重启广播器。
- **Docker bridge 网络**：内置 Docker Compose 默认通过
  `OPENCLAW_DISABLE_BONJOUR=1` 禁用 Bonjour。仅对 host、
  macvlan 或其他支持 mDNS 的网络将其设置为 `0`。
- **休眠 / 接口频繁变化**：macOS 可能会暂时丢失 mDNS 结果；请重试。
- **浏览正常但解析失败**：保持机器名简洁（避免使用表情符号或
  标点符号），然后重启 Gateway 网关。服务实例名派生自
  主机名，因此过于复杂的名称可能会让某些解析器混淆。

## 转义的实例名称（`\032`）

Bonjour/DNS‑SD 通常会将服务实例名称中的字节转义为十进制 `\DDD`
序列（例如空格会变成 `\032`）。

- 这在协议层面是正常的。
- UI 应为显示目的进行解码（iOS 使用 `BonjourEscapes.decode`）。

## 禁用 / 配置

- `openclaw plugins disable bonjour` 通过禁用内置插件来禁用局域网多播广播。
- `openclaw plugins enable bonjour` 恢复默认的局域网发现插件。
- `OPENCLAW_DISABLE_BONJOUR=1` 在不更改插件配置的情况下禁用局域网多播广播；接受的真值包括 `1`、`true`、`yes` 和 `on`（旧版：`OPENCLAW_DISABLE_BONJOUR`）。
- Docker Compose 默认会为 bridge 网络设置 `OPENCLAW_DISABLE_BONJOUR=1`；仅在 mDNS 多播可用时，才用 `OPENCLAW_DISABLE_BONJOUR=0` 覆盖。
- `gateway.bind` 在 `~/.openclaw/openclaw.json` 中控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 会在广播 `sshPort` 时覆盖 SSH 端口（旧版：`OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` 会在启用 mDNS 完整模式时于 TXT 中发布 MagicDNS 提示（旧版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 会覆盖广播的 CLI 路径（旧版：`OPENCLAW_CLI_PATH`）。

## 相关文档

- 设备发现策略和传输选择：[设备发现](/zh-CN/gateway/discovery)
- 节点配对 + 批准：[Gateway pairing](/zh-CN/gateway/pairing)
