---
read_when:
    - 实现或更改 Bonjour 发现/广播功能
    - 调整远程连接模式（直连与 SSH）
    - 为远程节点设计设备发现 + 配对机制
summary: 用于发现 Gateway 网关的节点发现与传输方式（Bonjour、Tailscale、SSH）
title: 设备发现 + 传输协议
x-i18n:
    generated_at: "2026-04-23T20:48:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6147df94d5801cdfe3f518b2523de7d1175261c579990afa4857bd6c0e0bfbb6
    source_path: gateway/discovery.md
    workflow: 15
---

# 设备发现 + 传输协议

OpenClaw 有两个表面上看起来相似、但本质不同的问题：

1. **操作员远程控制**：macOS 菜单栏应用控制运行在其他地方的 gateway。
2. **节点配对**：iOS/Android（以及未来的节点）发现 gateway 并安全配对。

设计目标是将所有网络发现/广播都保留在**Node Gateway 网关**（`openclaw gateway`）中，并让客户端（mac 应用、iOS）作为消费者。

## 术语

- **Gateway 网关**：单个长期运行的 gateway 进程，负责状态（会话、配对、节点注册表）并运行渠道。大多数设置每台主机只运行一个；也支持隔离的多 gateway 设置。
- **Gateway WS（控制平面）**：默认位于 `127.0.0.1:18789` 的 WebSocket 端点；可通过 `gateway.bind` 绑定到局域网/tailnet。
- **直连 WS 传输**：面向局域网/tailnet 的 Gateway 网关 WS 端点（不使用 SSH）。
- **SSH 传输（回退）**：通过 SSH 转发 `127.0.0.1:18789` 进行远程控制。
- **旧版 TCP bridge（已移除）**：较早的节点传输方式（见
  [Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)）；它不再用于设备发现广播，也不再包含在当前构建中。

协议详情：

- [Gateway 协议](/zh-CN/gateway/protocol)
- [Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)

## 为什么同时保留“直连”和 SSH

- **直连 WS** 在同一网络以及 tailnet 内有最佳 UX：
  - 通过 Bonjour 在局域网中自动发现
  - 配对令牌 + ACL 由 gateway 负责
  - 不需要 shell 访问；协议界面可保持紧凑并易于审计
- **SSH** 仍然是通用回退方式：
  - 只要你有 SSH 访问权限，就几乎可在任何地方工作（即使跨越无关网络）
  - 可避开多播/mDNS 问题
  - 除了 SSH 之外不需要新增任何入站端口

## 发现输入（客户端如何知道 gateway 在哪里）

### 1）Bonjour / DNS-SD 发现

多播 Bonjour 是尽力而为的，并且不会跨网络。OpenClaw 也可以通过已配置的广域 DNS-SD 域浏览同一个 gateway 信标，因此设备发现可覆盖：

- 同一局域网中的 `local.`
- 用于跨网络发现的已配置单播 DNS-SD 域

目标方向：

- **gateway** 通过 Bonjour 广播其 WS 端点。
- 客户端负责浏览并显示“选择一个 gateway”列表，然后存储所选端点。

故障排除和信标详情请参阅：[Bonjour](/zh-CN/gateway/bonjour)。

#### 服务信标详情

- 服务类型：
  - `_openclaw-gw._tcp`（gateway 传输信标）
- TXT 键（非敏感）：
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（操作员配置的显示名称）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway 网关 WS + HTTP）
  - `gatewayTls=1`（仅在启用 TLS 时）
  - `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
  - `canvasPort=<port>`（canvas 主机端口；当前在启用 canvas 主机时与 `gatewayPort` 相同）
  - `tailnetDns=<magicdns>`（可选提示；当 Tailscale 可用时自动检测）
  - `sshPort=<port>`（仅 mDNS 完整模式；广域 DNS-SD 可能省略它，此时 SSH 默认端口仍为 `22`）
  - `cliPath=<path>`（仅 mDNS 完整模式；广域 DNS-SD 仍会将其作为远程安装提示写出）

安全说明：

- Bonjour/mDNS TXT 记录**未经认证**。客户端必须仅将 TXT 值视为 UX 提示。
- 路由（host/port）应优先使用**已解析的服务端点**（SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS pinning 绝不能允许广播的 `gatewayTlsSha256` 覆盖先前已存储的 pin。
- iOS/Android 节点在所选路由为安全/TLS 路由时，应在存储首次 pin 之前要求用户进行显式“信任此指纹”确认（带外验证）。

禁用/覆盖：

- `OPENCLAW_DISABLE_BONJOUR=1` 会禁用广播。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 会在发出 `sshPort` 时覆盖所广播的 SSH 端口。
- `OPENCLAW_TAILNET_DNS` 会发布一个 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 会覆盖所广播的 CLI 路径。

### 2）Tailnet（跨网络）

对于 London/Vienna 风格的设置，Bonjour 无法提供帮助。推荐的“直连”目标是：

- Tailscale MagicDNS 名称（优先）或稳定的 tailnet IP。

如果 gateway 能检测到自己运行在 Tailscale 下，它就会发布 `tailnetDns` 作为客户端的可选提示（包括广域信标）。

macOS 应用现在在 gateway 发现中优先使用 MagicDNS 名称，而不是原始 Tailscale IP。这样在 tailnet IP 变化时（例如节点重启后或 CGNAT 重新分配后）可靠性更高，因为 MagicDNS 名称会自动解析到当前 IP。

对于移动节点配对，发现提示不会放宽 tailnet/公网路由上的传输安全要求：

- iOS/Android 仍要求首次 tailnet/公网连接路径必须安全（`wss://` 或 Tailscale Serve/Funnel）。
- 被发现的原始 tailnet IP 只是路由提示，并不等于允许使用明文远程 `ws://`。
- 私有局域网直连 `ws://` 仍然受支持。
- 如果你想为移动节点提供最简单的 Tailscale 路径，请使用 Tailscale Serve，这样设备发现和设置码都会解析到同一个安全的 MagicDNS 端点。

### 3）手动 / SSH 目标

当没有直连路径（或直连被禁用）时，客户端始终可以通过 SSH 转发 loopback gateway 端口来连接。

请参阅[远程访问](/zh-CN/gateway/remote)。

## 传输选择（客户端策略）

推荐的客户端行为：

1. 如果已配置并且可达的配对直连端点存在，则使用它。
2. 否则，如果设备发现找到位于 `local.` 或已配置广域域名下的 gateway，则提供一键“使用此 gateway”的选项，并将其保存为直连端点。
3. 否则，如果已配置 tailnet DNS/IP，则尝试直连。
   对于位于 tailnet/公网路由上的移动节点，直连意味着安全端点，而不是明文远程 `ws://`。
4. 否则，回退到 SSH。

## 配对 + 认证（直连传输）

gateway 是节点/客户端准入的事实来源。

- 配对请求由 gateway 创建/批准/拒绝（请参阅 [Gateway 配对](/zh-CN/gateway/pairing)）。
- gateway 负责强制：
  - 认证（token / keypair）
  - scopes/ACL（gateway 不是对每个方法的原始代理）
  - 速率限制

## 各组件职责

- **Gateway 网关**：广播发现信标，负责配对决策，并托管 WS 端点。
- **macOS 应用**：帮助你选择一个 gateway，显示配对提示，并仅在必要时使用 SSH 作为回退。
- **iOS/Android 节点**：将 Bonjour 浏览作为一种便利手段，并连接到已配对的 Gateway 网关 WS。
