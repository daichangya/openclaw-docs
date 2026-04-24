---
read_when:
    - 运行或调试 Gateway 网关进程
summary: Gateway 网关服务、生命周期与运维运行手册
title: Gateway 网关运行手册
x-i18n:
    generated_at: "2026-04-24T20:10:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

将此页面用于 Gateway 网关服务的第 1 天启动和第 2 天运维操作。

<CardGroup cols={2}>
  <Card title="深度故障排除" icon="siren" href="/zh-CN/gateway/troubleshooting">
    以症状为起点的诊断，提供精确的命令阶梯和日志特征。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    面向任务的设置指南 + 完整配置参考。
  </Card>
  <Card title="密钥管理" icon="key-round" href="/zh-CN/gateway/secrets">
    SecretRef 契约、运行时快照行为，以及迁移 / 重载操作。
  </Card>
  <Card title="密钥计划契约" icon="shield-check" href="/zh-CN/gateway/secrets-plan-contract">
    精确的 `secrets apply` 目标 / 路径规则，以及仅引用 auth-profile 行为。
  </Card>
</CardGroup>

## 5 分钟本地启动

<Steps>
  <Step title="启动 Gateway 网关">

```bash
openclaw gateway --port 18789
# 调试 / 跟踪会镜像到标准输入输出
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

健康基线：`Runtime: running`、`Connectivity probe: ok`，以及与你预期一致的 `Capability: ...`。当你需要读取作用域的 RPC 证明，而不只是可达性时，请使用 `openclaw gateway status --require-rpc`。

  </Step>

  <Step title="验证渠道就绪状态">

```bash
openclaw channels status --probe
```

在 Gateway 网关可达的情况下，这会针对每个账户运行实时渠道探测和可选审计。
如果 Gateway 网关不可达，CLI 会回退为仅配置的渠道摘要，
而不是实时探测输出。

  </Step>
</Steps>

<Note>
Gateway 网关配置重载会监视当前生效的配置文件路径（从 profile / state 默认值解析，或在设置时使用 `OPENCLAW_CONFIG_PATH`）。
默认模式是 `gateway.reload.mode="hybrid"`。
首次成功加载后，运行中的进程会提供当前生效的内存中配置快照；成功重载会以原子方式替换该快照。
</Note>

## 运行时模型

- 一个始终在线的进程，用于路由、控制平面和渠道连接。
- 一个单一复用端口，用于：
  - WebSocket 控制 / RPC
  - HTTP API，兼容 OpenAI（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 控制 UI 和钩子
- 默认绑定模式：`loopback`。
- 默认要求身份验证。共享密钥设置使用
  `gateway.auth.token` / `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），非 loopback
  的反向代理设置可使用 `gateway.auth.mode: "trusted-proxy"`。

## 兼容 OpenAI 的端点

OpenClaw 当前最具杠杆效应的兼容性接口是：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

这组接口的重要性在于：

- 大多数 Open WebUI、LobeChat 和 LibreChat 集成会首先探测 `/v1/models`。
- 许多 RAG 和记忆流水线期望使用 `/v1/embeddings`。
- 原生智能体客户端越来越倾向于使用 `/v1/responses`。

规划说明：

- `/v1/models` 以智能体优先：它返回 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>`。
- `openclaw/default` 是稳定别名，始终映射到已配置的默认智能体。
- 当你想覆盖后端提供商 / 模型时，请使用 `x-openclaw-model`；否则，所选智能体的常规模型和嵌入设置会继续生效。

以上所有接口都运行在主 Gateway 网关端口上，并使用与 Gateway 网关其余 HTTP API 相同的受信任操作员身份验证边界。

### 端口和绑定优先级

| 设置 | 解析顺序 |
| ------------ | ------------------------------------------------------------- |
| Gateway 网关端口 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 绑定模式 | CLI / override → `gateway.bind` → `loopback`                    |

### 热重载模式

| `gateway.reload.mode` | 行为 |
| --------------------- | ------------------------------------------ |
| `off`                 | 不进行配置重载 |
| `hot`                 | 仅应用可安全热更新的变更 |
| `restart`             | 遇到需要重启的变更时重启 |
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

`gateway status --deep` 用于额外的服务发现（LaunchDaemons / systemd system
units / schtasks），而不是更深层的 RPC 健康探测。

## 多个 Gateway 网关（同一主机）

大多数安装应在每台机器上运行一个 Gateway 网关。单个 Gateway 网关可以托管多个
智能体和渠道。

只有在你明确需要隔离或救援机器人时，才需要多个 Gateway 网关。

有用的检查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

预期结果：

- `gateway status --deep` 可能报告 `Other gateway-like services detected (best effort)`
  并在仍存在过时的 launchd / systemd / schtasks 安装时打印清理提示。
- `gateway probe` 在有多个目标
  响应时可能会警告 `multiple reachable gateways`。
- 如果这是有意设置，请为每个 Gateway 网关隔离端口、配置 / 状态以及工作区根目录。

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

## VoiceClaw 实时 brain 端点

OpenClaw 在
`/voiceclaw/realtime` 提供兼容 VoiceClaw 的实时 WebSocket 端点。当 VoiceClaw 桌面客户端应直接与实时 OpenClaw brain 通信，而不是通过单独的中继进程时，请使用它。

该端点使用 Gemini Live 处理实时音频，并通过将 OpenClaw 工具直接暴露给 Gemini Live 来调用 OpenClaw 作为 brain。工具调用会立即返回
`working` 结果，以保持语音轮次响应迅速；随后 OpenClaw 会异步执行实际工具，并将结果注入回实时会话中。在 Gateway 网关进程环境中设置 `GEMINI_API_KEY`。如果
Gateway 网关身份验证已启用，桌面客户端会在其第一个 `session.config` 消息中发送 gateway token 或 password。

实时 brain 访问会运行经所有者授权的 OpenClaw 智能体命令。请将
`gateway.auth.mode: "none"` 限制在仅 loopback 的测试实例中。非本地实时 brain 连接需要 Gateway 网关身份验证。

对于隔离的测试 Gateway 网关，请运行一个使用独立端口、配置
和状态的单独实例：

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

然后将 VoiceClaw 配置为使用：

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## 远程访问

首选：Tailscale / VPN。
备选：SSH 隧道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

然后在本地将客户端连接到 `ws://127.0.0.1:18789`。

<Warning>
SSH 隧道不会绕过 Gateway 网关身份验证。对于共享密钥身份验证，客户端即使通过隧道
仍必须发送 `token` / `password`。对于带身份标识的模式，
请求仍然必须满足该身份验证路径。
</Warning>

参见：[Remote Gateway](/zh-CN/gateway/remote)、[Authentication](/zh-CN/gateway/authentication)、[Tailscale](/zh-CN/gateway/tailscale)。

## 监管和服务生命周期

对于接近生产环境的可靠性，请使用受监管的运行方式。

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

若要在注销后保持持久运行，请启用 lingering：

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

Windows 原生托管启动使用名为 `OpenClaw Gateway`
的计划任务（命名 profile 时为 `OpenClaw Gateway (<profile>)`）。如果计划任务
创建被拒绝，OpenClaw 会回退到每用户 Startup 文件夹启动器，
该启动器指向状态目录中的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux（系统服务）">

对于多用户 / 始终在线主机，请使用系统 unit。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用与 user unit 相同的服务主体，但将其安装到
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，并在你的 `openclaw` 二进制文件位于其他位置时调整
`ExecStart=`。

  </Tab>
</Tabs>

## 开发 profile 快速路径

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

默认包括隔离的状态 / 配置，以及基础 Gateway 网关端口 `19001`。

## 协议快速参考（操作员视角）

- 第一个客户端帧必须是 `connect`。
- Gateway 网关返回 `hello-ok` 快照（`presence`、`health`、`stateVersion`、`uptimeMs`、limits / policy）。
- `hello-ok.features.methods` / `events` 是保守的发现列表，而不是
  每个可调用辅助路由的自动生成转储。
- 请求：`req(method, params)` → `res(ok/payload|error)`。
- 常见事件包括 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、pairing / approval 生命周期事件，以及 `shutdown`。

智能体运行分为两个阶段：

1. 立即接受确认（`status:"accepted"`）
2. 最终完成响应（`status:"ok"|"error"`），中间会流式发送 `agent` 事件。

完整协议文档参见：[Gateway Protocol](/zh-CN/gateway/protocol)。

## 运维检查

### 存活性

- 打开 WS 并发送 `connect`。
- 期望收到带快照的 `hello-ok` 响应。

### 就绪性

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 缺口恢复

事件不会重放。出现序列缺口时，请先刷新状态（`health`、`system-presence`），再继续。

## 常见故障特征

| 特征 | 可能问题 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 非 loopback 绑定，且没有有效的 Gateway 网关身份验证路径 |
| `another gateway instance is already listening` / `EADDRINUSE` | 端口冲突 |
| `Gateway start blocked: set gateway.mode=local`                | 配置设置为远程模式，或损坏配置中缺少本地模式标记 |
| `unauthorized` during connect                                  | 客户端与 Gateway 网关之间的身份验证不匹配 |

如需完整诊断阶梯，请参见 [Gateway 故障排除](/zh-CN/gateway/troubleshooting)。

## 安全保证

- 当 Gateway 网关不可用时，Gateway 网关协议客户端会快速失败（不会隐式回退到直连渠道）。
- 无效的 / 非 `connect` 首帧会被拒绝并关闭连接。
- 优雅关闭会在 socket 关闭前发出 `shutdown` 事件。

---

相关内容：

- [故障排除](/zh-CN/gateway/troubleshooting)
- [后台进程](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [健康状态](/zh-CN/gateway/health)
- [Doctor](/zh-CN/gateway/doctor)
- [身份验证](/zh-CN/gateway/authentication)

## 相关

- [配置](/zh-CN/gateway/configuration)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
- [远程访问](/zh-CN/gateway/remote)
- [密钥管理](/zh-CN/gateway/secrets)
