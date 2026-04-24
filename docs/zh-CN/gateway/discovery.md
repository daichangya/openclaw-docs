---
read_when:
    - 实现或更改 Bonjour 发现/广播
    - 调整远程连接模式（direct 与 SSH）
    - 为远程节点设计节点发现 + 配对机制
summary: 用于查找 Gateway 网关的节点发现与传输协议（Bonjour、Tailscale、SSH）
title: 设备发现 + 传输协议
x-i18n:
    generated_at: "2026-04-24T03:15:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# 设备发现 + 传输协议

OpenClaw 有两个表面上看起来相似、但实际上彼此独立的问题：

1. **操作员远程控制**：macOS 菜单栏应用控制运行在其他地方的 Gateway 网关。
2. **节点配对**：iOS/Android（以及未来的节点）查找 Gateway 网关并进行安全配对。

设计目标是将所有网络发现/广播都保留在 **Node Gateway**（`openclaw gateway`）中，并让客户端（mac 应用、iOS）作为消费者。

## 术语

- **Gateway 网关**：一个单独的长时间运行的 Gateway 网关进程，负责持有状态（会话、配对、节点注册表）并运行渠道。大多数部署在每台主机上使用一个；也支持隔离的多 Gateway 网关部署。
- **Gateway WS（控制平面）**：默认位于 `127.0.0.1:18789` 的 WebSocket 端点；可通过 `gateway.bind` 绑定到 LAN/tailnet。
- **Direct WS transport**：面向 LAN/tailnet 的 Gateway WS 端点（无 SSH）。
- **SSH transport（回退）**：通过 SSH 转发 `127.0.0.1:18789` 来实现远程控制。
- **Legacy TCP bridge（已移除）**：较旧的节点传输方式（参见
  [Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)）；已不再用于设备发现广播，也不再属于当前构建的一部分。

协议详情：

- [Gateway protocol](/zh-CN/gateway/protocol)
- [Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)

## 为什么我们同时保留 “direct” 和 SSH

- **Direct WS** 在同一网络和 tailnet 内拥有最佳用户体验：
  - 通过 Bonjour 在 LAN 上自动发现
  - 配对令牌 + ACL 由 Gateway 网关持有
  - 不需要 shell 访问；协议暴露面可以保持紧凑且可审计
- **SSH** 仍然是通用回退方案：
  - 只要你有 SSH 访问权限，就能在任何地方工作（即使跨越无关网络）
  - 能应对多播/mDNS 问题
  - 除 SSH 外不需要新增入站端口

## 发现输入（客户端如何得知 Gateway 网关的位置）

### 1）Bonjour / DNS-SD 发现

多播 Bonjour 是尽力而为的，并且不会跨网络工作。OpenClaw 也可以通过已配置的广域 DNS-SD 域浏览同一个 Gateway 网关信标，因此设备发现可覆盖：

- 同一 LAN 上的 `local.`
- 用于跨网络发现的已配置单播 DNS-SD 域

目标方向：

- **Gateway 网关** 通过 Bonjour 广播其 WS 端点。
- 客户端浏览并显示“选择一个 Gateway 网关”的列表，然后存储所选端点。

故障排除和信标详情： [Bonjour](/zh-CN/gateway/bonjour)。

#### 服务信标详情

- 服务类型：
  - `_openclaw-gw._tcp`（Gateway 网关传输信标）
- TXT 键（非机密）：
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（由操作员配置的显示名称）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（仅当启用 TLS 时）
  - `gatewayTlsSha256=<sha256>`（仅当启用 TLS 且指纹可用时）
  - `canvasPort=<port>`（canvas 主机端口；当前在启用 canvas 主机时与 `gatewayPort` 相同）
  - `tailnetDns=<magicdns>`（可选提示；在 Tailscale 可用时自动检测）
  - `sshPort=<port>`（仅 mDNS 完整模式；广域 DNS-SD 可能省略它，此时 SSH 默认仍为 `22`）
  - `cliPath=<path>`（仅 mDNS 完整模式；广域 DNS-SD 仍会将其写入为远程安装提示）

安全说明：

- Bonjour/mDNS TXT 记录**未经认证**。客户端必须仅将 TXT 值视为用户体验提示。
- 路由（主机/端口）应优先使用**解析后的服务端点**（SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS pinning 绝不能允许已广播的 `gatewayTlsSha256` 覆盖先前存储的 pin。
- iOS/Android 节点在所选路由为安全/TLS 路由时，首次存储 pin 前应要求明确的“信任此指纹”确认（带外验证）。

禁用/覆盖：

- `OPENCLAW_DISABLE_BONJOUR=1` 会禁用广播。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 会覆盖发出 `sshPort` 时广播的 SSH 端口。
- `OPENCLAW_TAILNET_DNS` 会发布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 会覆盖广播的 CLI 路径。

### 2）Tailnet（跨网络）

对于 London/Vienna 这类部署，Bonjour 不会有帮助。推荐的 “direct” 目标是：

- Tailscale MagicDNS 名称（首选）或稳定的 tailnet IP。

如果 Gateway 网关能够检测到自己运行在 Tailscale 下，它会发布 `tailnetDns` 作为客户端的可选提示（包括广域信标）。

macOS 应用现在在 Gateway 网关发现中优先使用 MagicDNS 名称，而不是原始 Tailscale IP。这会在 tailnet IP 发生变化时提升可靠性（例如节点重启后或 CGNAT 重新分配后），因为 MagicDNS 名称会自动解析到当前 IP。

对于移动节点配对，发现提示不会放宽 tailnet/公共路由上的传输安全要求：

- iOS/Android 仍然要求安全的首次 tailnet/公共连接路径（`wss://` 或 Tailscale Serve/Funnel）。
- 发现到的原始 tailnet IP 只是路由提示，并不代表允许使用明文远程 `ws://`。
- 私有 LAN 直连 `ws://` 仍然受支持。
- 如果你希望为移动节点使用最简单的 Tailscale 路径，请使用 Tailscale Serve，这样设备发现和设置代码都会解析到同一个安全的 MagicDNS 端点。

### 3）手动 / SSH 目标

当没有 direct 路径（或 direct 已禁用）时，客户端始终可以通过 SSH 转发 loopback Gateway 网关端口来连接。

参见 [Remote access](/zh-CN/gateway/remote)。

## 传输选择（客户端策略）

推荐的客户端行为：

1. 如果已配置并且可访问某个已配对的 direct 端点，就使用它。
2. 否则，如果设备发现能在 `local.` 或已配置的广域域名中找到 Gateway 网关，则提供一个一键“Use this gateway”选项，并将其保存为 direct 端点。
3. 否则，如果配置了 tailnet DNS/IP，则尝试 direct。
   对于位于 tailnet/公共路由上的移动节点，direct 指的是安全端点，而不是明文远程 `ws://`。
4. 否则，回退到 SSH。

## 配对 + 凭证（direct transport）

Gateway 网关是节点/客户端接入的事实来源。

- 配对请求会在 Gateway 网关中创建/批准/拒绝（参见 [Gateway pairing](/zh-CN/gateway/pairing)）。
- Gateway 网关会强制执行：
  - 凭证（token / keypair）
  - scopes/ACL（Gateway 网关不是通往所有方法的原始代理）
  - 速率限制

## 各组件职责

- **Gateway 网关**：广播发现信标、负责配对决策，并托管 WS 端点。
- **macOS 应用**：帮助你选择一个 Gateway 网关、显示配对提示，并且仅在回退时使用 SSH。
- **iOS/Android 节点**：将 Bonjour 浏览作为便利功能，并连接到已配对的 Gateway WS。

## 相关内容

- [Remote access](/zh-CN/gateway/remote)
- [Tailscale](/zh-CN/gateway/tailscale)
- [Bonjour discovery](/zh-CN/gateway/bonjour)
