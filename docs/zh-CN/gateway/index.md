---
read_when:
    - 运行或调试 gateway 进程
summary: Gateway 网关服务、生命周期和运维的操作手册
title: Gateway 网关操作手册
x-i18n:
    generated_at: "2026-04-24T03:15:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

将此页用于 Gateway 网关服务的 day-1 启动和 day-2 运维。

<CardGroup cols={2}>
  <Card title="深度故障排除" icon="siren" href="/zh-CN/gateway/troubleshooting">
    按症状优先的诊断方式，提供精确的命令阶梯和日志特征。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    面向任务的设置指南 + 完整配置参考。
  </Card>
  <Card title="密钥管理" icon="key-round" href="/zh-CN/gateway/secrets">
    SecretRef 契约、运行时快照行为以及 migrate/reload 操作。
  </Card>
  <Card title="密钥计划契约" icon="shield-check" href="/zh-CN/gateway/secrets-plan-contract">
    精确的 `secrets apply` target/path 规则以及仅 ref 的 auth-profile 行为。
  </Card>
</CardGroup>

## 5 分钟本地启动

<Steps>
  <Step title="启动 Gateway 网关">

```bash
openclaw gateway --port 18789
# 将 debug/trace 镜像输出到 stdio
openclaw gateway --port 18789 --verbose
# 强制杀掉所选端口上的监听进程，然后启动
openclaw gateway --force
```

  </Step>

  <Step title="验证服务健康状态">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

健康基线：`Runtime: running`、`Connectivity probe: ok`，以及与你预期一致的 `Capability: ...`。当你需要的是读权限范围的 RPC 证明，而不仅仅是可达性时，请使用 `openclaw gateway status --require-rpc`。

  </Step>

  <Step title="验证渠道就绪状态">

```bash
openclaw channels status --probe
```

当 Gateway 网关可达时，这会运行实时的逐账户渠道探测和可选审计。
如果 Gateway 网关不可达，CLI 会回退为仅配置的渠道摘要，而不是实时探测输出。

  </Step>
</Steps>

<Note>
Gateway 网关配置重载会监视当前活动配置文件路径（从 profile/state 默认值解析，或者在设置时使用 `OPENCLAW_CONFIG_PATH`）。
默认模式是 `gateway.reload.mode="hybrid"`。
首次成功加载之后，运行中的进程会提供当前的内存内配置快照；成功重载时会以原子方式替换该快照。
</Note>

## 运行时模型

- 一个始终在线的进程，负责路由、控制平面和渠道连接。
- 一个复用端口，用于：
  - WebSocket 控制/RPC
  - HTTP API、OpenAI 兼容接口（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 控制 UI 和 hooks
- 默认绑定模式：`loopback`。
- 默认需要认证。共享密钥方案使用
  `gateway.auth.token` / `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），而非 loopback
  的反向代理方案可使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 兼容端点

OpenClaw 当前最高杠杆的兼容性入口是：

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

- `/v1/models` 是 agent-first：它返回 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>`。
- `openclaw/default` 是稳定别名，始终映射到已配置的默认智能体。
- 当你想覆盖后端 provider/model 时，使用 `x-openclaw-model`；否则将继续由所选智能体的常规模型和嵌入设置控制。

所有这些都运行在主 Gateway 网关端口上，并使用与 Gateway 网关其余 HTTP API 相同的可信操作员认证边界。

### 端口和绑定优先级

| 设置 | 解析顺序 |
| ------------ | ------------------------------------------------------------- |
| Gateway 网关端口 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 绑定模式 | CLI/override → `gateway.bind` → `loopback` |

### 热重载模式

| `gateway.reload.mode` | 行为 |
| --------------------- | ------------------------------------------ |
| `off`                 | 不进行配置重载 |
| `hot`                 | 仅应用热安全变更 |
| `restart`             | 对需要重启的变更执行重启 |
| `hybrid`（默认）    | 安全时热应用，需要时重启 |

## 操作员命令集

```bash
openclaw gateway status
openclaw gateway status --deep   # 增加系统级服务扫描
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` 用于额外的服务发现（LaunchDaemons/systemd system
units/schtasks），而不是更深层次的 RPC 健康探测。

## 多个网关（同一主机）

大多数安装应当每台机器运行一个网关。单个 Gateway 网关可以承载多个智能体和渠道。

只有当你有意需要隔离或一个救援机器人时，才需要多个网关。

有用的检查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

预期行为：

- `gateway status --deep` 可能报告 `Other gateway-like services detected (best effort)`
  ，并在仍存在过时的 launchd/systemd/schtasks 安装时打印清理提示。
- 当有多个目标作出响应时，`gateway probe` 可能警告 `multiple reachable gateways`。
- 如果这是有意为之，请为每个网关隔离端口、config/state 和工作区根目录。

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

详细设置：[/gateway/multiple-gateways](/zh-CN/gateway/multiple-gateways)。

## 远程访问

首选：Tailscale/VPN。
备选：SSH 隧道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

然后让客户端在本地连接到 `ws://127.0.0.1:18789`。

<Warning>
SSH 隧道不会绕过 gateway 认证。对于共享密钥认证，客户端即使通过隧道连接，
仍必须发送 `token`/`password`。对于携带身份的模式，请求仍然必须满足该认证路径。
</Warning>

参见：[Remote Gateway](/zh-CN/gateway/remote)、[Authentication](/zh-CN/gateway/authentication)、[Tailscale](/zh-CN/gateway/tailscale)。

## 监督和服务生命周期

对于接近生产环境的可靠性，请使用受监督运行。

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

  <Tab title="Linux（systemd user）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

如需在登出后仍保持持久运行，请启用 lingering：

```bash
sudo loginctl enable-linger <user>
```

当你需要自定义安装路径时，可使用如下手动 user-unit 示例：

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
的计划任务（命名 profile 则为 `OpenClaw Gateway (<profile>)`）。如果计划任务
创建被拒绝，OpenClaw 会回退到每用户 Startup-folder 启动器，该启动器指向状态目录中的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux（system service）">

对于多用户/始终在线的主机，请使用系统级 unit。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用与 user unit 相同的服务主体，但将其安装到
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，并在你的 `openclaw` 二进制位于其他位置时调整
`ExecStart=`。

  </Tab>
</Tabs>

## 开发 profile 快速路径

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

默认值包括隔离的 state/config，以及基础 Gateway 网关端口 `19001`。

## 协议快速参考（操作员视角）

- 客户端发送的第一帧必须是 `connect`。
- Gateway 网关返回 `hello-ok` 快照（`presence`、`health`、`stateVersion`、`uptimeMs`、limits/policy）。
- `hello-ok.features.methods` / `events` 是保守的发现列表，而不是每个可调用辅助路由的自动生成转储。
- 请求：`req(method, params)` → `res(ok/payload|error)`。
- 常见事件包括 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、配对/审批生命周期事件，以及 `shutdown`。

智能体运行分为两个阶段：

1. 立即接受确认（`status:"accepted"`）
2. 最终完成响应（`status:"ok"|"error"`），期间会穿插流式 `agent` 事件。

完整协议文档请参见：[Gateway Protocol](/zh-CN/gateway/protocol)。

## 运维检查

### 存活性

- 打开 WS 并发送 `connect`。
- 预期收到带快照的 `hello-ok` 响应。

### 就绪性

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 缺口恢复

事件不会被重放。发生序列缺口时，先刷新状态（`health`、`system-presence`）再继续。

## 常见故障特征

| 特征 | 可能问题 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 非 loopback 绑定但没有有效的 gateway 认证路径 |
| `another gateway instance is already listening` / `EADDRINUSE` | 端口冲突 |
| `Gateway start blocked: set gateway.mode=local`                | 配置设置为 remote mode，或受损配置中缺少 local-mode 标记 |
| `unauthorized` during connect                                  | 客户端与 Gateway 网关之间的认证不匹配 |

完整诊断阶梯请使用 [Gateway 故障排除](/zh-CN/gateway/troubleshooting)。

## 安全保证

- 当 Gateway 网关不可用时，Gateway 协议客户端会快速失败（不会隐式回退到 direct-channel）。
- 无效的首帧或非 connect 首帧会被拒绝并关闭连接。
- 优雅关闭会在 socket 关闭前发出 `shutdown` 事件。

---

相关内容：

- [故障排除](/zh-CN/gateway/troubleshooting)
- [后台进程](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [健康状态](/zh-CN/gateway/health)
- [Doctor](/zh-CN/gateway/doctor)
- [认证](/zh-CN/gateway/authentication)

## 相关内容

- [配置](/zh-CN/gateway/configuration)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
- [远程访问](/zh-CN/gateway/remote)
- [密钥管理](/zh-CN/gateway/secrets)
