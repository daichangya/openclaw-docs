---
read_when:
    - 运行或调试 Gateway 网关进程
summary: Gateway 网关服务、生命周期与运维的操作手册
title: Gateway 网关操作手册
x-i18n:
    generated_at: "2026-04-20T06:30:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# Gateway 网关操作手册

将此页面用于 Gateway 网关服务的第 1 天启动和第 2 天运维操作。

<CardGroup cols={2}>
  <Card title="深度故障排除" icon="siren" href="/zh-CN/gateway/troubleshooting">
    按症状优先的诊断，提供精确的命令步骤和日志特征。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    面向任务的设置指南 + 完整配置参考。
  </Card>
  <Card title="密钥管理" icon="key-round" href="/zh-CN/gateway/secrets">
    `SecretRef` 合约、运行时快照行为，以及迁移/重新加载操作。
  </Card>
  <Card title="密钥计划合约" icon="shield-check" href="/zh-CN/gateway/secrets-plan-contract">
    精确的 `secrets apply` 目标/路径规则，以及仅引用的 auth-profile 行为。
  </Card>
</CardGroup>

## 5 分钟本地启动

<Steps>
  <Step title="启动 Gateway 网关">

```bash
openclaw gateway --port 18789
# debug/trace 镜像输出到 stdio
openclaw gateway --port 18789 --verbose
# 强制终止所选端口上的监听器，然后启动
openclaw gateway --force
```

  </Step>

  <Step title="验证服务健康状态">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

健康基线：`Runtime: running`、`Connectivity probe: ok`，以及与你预期匹配的 `Capability: ...`。当你需要读取范围的 RPC 证明，而不仅仅是可达性时，请使用 `openclaw gateway status --require-rpc`。

  </Step>

  <Step title="验证渠道就绪状态">

```bash
openclaw channels status --probe
```

当 Gateway 网关可达时，这会按账户运行实时的渠道探测和可选审计。
如果 Gateway 网关不可达，CLI 会回退到仅基于配置的渠道摘要，
而不是实时探测输出。

  </Step>
</Steps>

<Note>
Gateway 网关配置重载会监视当前激活的配置文件路径（从 profile/state 默认值解析，或在设置时使用 `OPENCLAW_CONFIG_PATH`）。
默认模式为 `gateway.reload.mode="hybrid"`。
首次成功加载后，运行中的进程会提供当前激活的内存配置快照；成功重载后会原子性地替换该快照。
</Note>

## 运行时模型

- 一个始终运行的进程，用于路由、控制平面和渠道连接。
- 一个用于以下内容的单一复用端口：
  - WebSocket 控制/RPC
  - HTTP API、OpenAI 兼容接口（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - Control UI 和 hooks
- 默认绑定模式：`loopback`。
- 默认需要认证。共享密钥设置使用
  `gateway.auth.token` / `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），而非 `loopback`
  的反向代理设置可以使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 兼容端点

OpenClaw 现在最有价值的兼容性接口为：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

为什么这一组很重要：

- 大多数 Open WebUI、LobeChat 和 LibreChat 集成会先探测 `/v1/models`。
- 许多 RAG 和 memory 流水线依赖 `/v1/embeddings`。
- 原生面向智能体的客户端越来越倾向于使用 `/v1/responses`。

规划说明：

- `/v1/models` 以智能体优先：它会返回 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>`。
- `openclaw/default` 是稳定别名，始终映射到已配置的默认智能体。
- 如果你想覆盖后端 provider/model，请使用 `x-openclaw-model`；否则将继续由所选智能体的常规模型和 embedding 设置进行控制。

所有这些都运行在 Gateway 网关主端口上，并使用与 Gateway 网关其余 HTTP API 相同的可信操作员认证边界。

### 端口和绑定优先级

| 设置 | 解析顺序 |
| ------------ | ------------------------------------------------------------- |
| Gateway 网关端口 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 绑定模式 | CLI/override → `gateway.bind` → `loopback` |

### 热重载模式

| `gateway.reload.mode` | 行为 |
| --------------------- | ------------------------------------------ |
| `off`                 | 不进行配置重载 |
| `hot`                 | 仅应用热更新安全的变更 |
| `restart`             | 遇到需要重启的变更时重启 |
| `hybrid` （默认）    | 安全时热应用，需要时重启 |

## 操作员命令集

```bash
openclaw gateway status
openclaw gateway status --deep   # 添加系统级服务扫描
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` 用于额外的服务发现（LaunchDaemons/systemd 系统
units/schtasks），而不是更深入的 RPC 健康探测。

## 多个 Gateway 网关（同一主机）

大多数安装应在每台机器上运行一个 Gateway 网关。单个 Gateway 网关可以承载多个
智能体和渠道。

只有当你明确需要隔离或一个救援 bot 时，才需要多个 Gateway 网关。

有用的检查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

预期表现：

- `gateway status --deep` 可能会报告 `Other gateway-like services detected (best effort)`
  并在仍存在陈旧的 launchd/systemd/schtasks 安装时打印清理提示。
- 当多个目标都有响应时，`gateway probe` 可能会警告 `multiple reachable gateways`。
- 如果这是有意为之，请为每个 Gateway 网关隔离端口、配置/state 和 workspace 根目录。

详细设置：[/gateway/multiple-gateways](/zh-CN/gateway/multiple-gateways)。

## 远程访问

首选：Tailscale/VPN。
备选：SSH 隧道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

然后让客户端在本地连接到 `ws://127.0.0.1:18789`。

<Warning>
SSH 隧道不会绕过 Gateway 网关认证。对于共享密钥认证，即使通过隧道，客户端
仍然必须发送 `token`/`password`。对于带身份的模式，
请求仍然必须满足该认证路径。
</Warning>

参见：[远程 Gateway 网关](/zh-CN/gateway/remote)、[认证](/zh-CN/gateway/authentication)、[Tailscale](/zh-CN/gateway/tailscale)。

## 监管和服务生命周期

为了获得接近生产环境的可靠性，请使用受监管的运行方式。

<Tabs>
  <Tab title="macOS（launchd）">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent 标签为 `ai.openclaw.gateway`（默认）或 `ai.openclaw.<profile>`（命名 profile）。`openclaw doctor` 会审计并修复服务配置漂移。

  </Tab>

  <Tab title="Linux（systemd 用户服务）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

要在登出后保持持久运行，请启用 lingering：

```bash
sudo loginctl enable-linger <user>
```

当你需要自定义安装路径时，可使用手动用户 unit 示例：

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows（原生）">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

原生 Windows 托管启动使用名为 `OpenClaw Gateway`
的计划任务（对于命名 profile，则为 `OpenClaw Gateway (<profile>)`）。如果计划任务
创建被拒绝，OpenClaw 会回退到每用户 Startup 文件夹启动器，
其指向 state 目录中的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux（系统服务）">

对多用户/始终在线主机，请使用系统 unit。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用与用户 unit 相同的服务主体，但将其安装到
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，并在你的
`openclaw` 二进制文件位于其他位置时调整 `ExecStart=`。

  </Tab>
</Tabs>

## 一台主机上的多个 Gateway 网关

大多数设置应只运行**一个** Gateway 网关。
只有在需要严格隔离/冗余时才使用多个（例如救援 profile）。

每个实例的检查清单：

- 唯一的 `gateway.port`
- 唯一的 `OPENCLAW_CONFIG_PATH`
- 唯一的 `OPENCLAW_STATE_DIR`
- 唯一的 `agents.defaults.workspace`

示例：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

参见：[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

### 开发 profile 快速路径

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

默认值包括隔离的 state/config，以及基础 Gateway 网关端口 `19001`。

## 协议快速参考（操作员视角）

- 第一个客户端帧必须是 `connect`。
- Gateway 网关返回 `hello-ok` 快照（`presence`、`health`、`stateVersion`、`uptimeMs`、limits/policy）。
- `hello-ok.features.methods` / `events` 是保守的发现列表，而不是
  每个可调用辅助路由的自动生成清单。
- 请求：`req(method, params)` → `res(ok/payload|error)`。
- 常见事件包括 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、pairing/approval 生命周期事件以及 `shutdown`。

智能体运行分为两个阶段：

1. 立即接受确认（`status:"accepted"`）
2. 最终完成响应（`status:"ok"|"error"`），其间会流式发送 `agent` 事件。

查看完整协议文档：[Gateway 协议](/zh-CN/gateway/protocol)。

## 运维检查

### 存活性

- 打开 WS 并发送 `connect`。
- 预期收到带快照的 `hello-ok` 响应。

### 就绪状态

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 缺口恢复

事件不会重放。出现序列缺口时，在继续之前刷新状态（`health`、`system-presence`）。

## 常见故障特征

| 特征 | 可能问题 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 非 `loopback` 绑定，但没有有效的 Gateway 网关认证路径 |
| `another gateway instance is already listening` / `EADDRINUSE` | 端口冲突 |
| `Gateway start blocked: set gateway.mode=local`                | 配置被设为远程模式，或损坏配置中缺少本地模式标记 |
| `unauthorized` during connect                                  | 客户端与 Gateway 网关之间的认证不匹配 |

如需完整的诊断步骤，请使用 [Gateway 故障排除](/zh-CN/gateway/troubleshooting)。

## 安全保证

- 当 Gateway 网关不可用时，Gateway 协议客户端会快速失败（不会隐式回退到直接渠道）。
- 无效的/非 `connect` 的首帧会被拒绝并关闭连接。
- 优雅关闭会在 socket 关闭前发出 `shutdown` 事件。

---

相关内容：

- [故障排除](/zh-CN/gateway/troubleshooting)
- [后台进程](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [健康](/zh-CN/gateway/health)
- [Doctor](/zh-CN/gateway/doctor)
- [认证](/zh-CN/gateway/authentication)
