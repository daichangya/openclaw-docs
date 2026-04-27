---
read_when:
    - 从 CLI 运行 Gateway 网关（开发环境或服务器）
    - 调试 Gateway 网关认证、绑定模式和连接性
    - 通过 Bonjour 发现 Gateway 网关（本地 + 广域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway 网关 CLI（`openclaw gateway`）——运行、查询并发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-04-27T04:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 795d30511ad7a98093edfcfb862869349e1454d3e01f18dec7912cc2128934de
    source_path: cli/gateway.md
    workflow: 15
---

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。本页中的子命令位于 `openclaw gateway …` 之下。

<CardGroup cols={3}>
  <Card title="Bonjour 发现" href="/zh-CN/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="设备发现概览" href="/zh-CN/gateway/discovery">
    OpenClaw 如何通告和发现 Gateway 网关。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration">
    顶层 Gateway 网关配置键。
  </Card>
</CardGroup>

## 运行 Gateway 网关

运行一个本地 Gateway 网关进程：

```bash
openclaw gateway
```

前台别名：

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="启动行为">
    - 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关会拒绝启动。对于临时 / 开发运行，请使用 `--allow-unconfigured`。
    - `openclaw onboard --mode local` 和 `openclaw setup` 预期会写入 `gateway.mode=local`。如果文件已存在但缺少 `gateway.mode`，应将其视为损坏或被覆盖的配置，并修复它，而不是隐式假定为本地模式。
    - 如果文件已存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝为你“猜测为 local”。
    - 未启用认证时，禁止绑定到 loopback 之外的地址（安全护栏）。
    - 在获得授权时，`SIGUSR1` 会触发进程内重启（`commands.restart` 默认启用；设置 `commands.restart: false` 可阻止手动重启，但 gateway 工具 / config apply / update 仍然允许）。
    - `SIGINT` / `SIGTERM` 处理程序会停止 gateway 进程，但不会恢复任何自定义终端状态。如果你使用 TUI 或 raw-mode 输入包装 CLI，请在退出前恢复终端。
  </Accordion>
</AccordionGroup>

### 选项

<ParamField path="--port <port>" type="number">
  WebSocket 端口（默认值来自 config / env；通常为 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  监听器绑定模式。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  认证模式覆盖。
</ParamField>
<ParamField path="--token <token>" type="string">
  Token 覆盖（也会为该进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
</ParamField>
<ParamField path="--password <password>" type="string">
  密码覆盖。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  从文件读取 gateway 密码。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  通过 Tailscale 暴露 Gateway 网关。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  在关闭时重置 Tailscale serve / funnel 配置。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  允许在配置中没有 `gateway.mode=local` 的情况下启动 gateway。仅绕过临时 / 开发引导的启动保护；不会写入或修复配置文件。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺失，则创建开发配置 + 工作区（跳过 `BOOTSTRAP.md`）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重置开发配置 + 凭证 + 会话 + 工作区（需要 `--dev`）。
</ParamField>
<ParamField path="--force" type="boolean">
  启动前终止所选端口上的任何现有监听器。
</ParamField>
<ParamField path="--verbose" type="boolean">
  详细日志。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  仅在控制台中显示 CLI 后端日志（并启用 stdout / stderr）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket 日志样式。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` 的别名。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  将原始模型流事件记录到 jsonl。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  原始流 jsonl 路径。
</ParamField>

<Warning>
内联 `--password` 可能会暴露在本地进程列表中。优先使用 `--password-file`、环境变量，或由 SecretRef 支持的 `gateway.auth.password`。
</Warning>

### 启动性能分析

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`，以在 Gateway 网关启动期间记录各阶段耗时。
- 运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 以对 Gateway 网关启动进行基准测试。该基准测试会记录首次进程输出、`/healthz`、`/readyz` 和启动跟踪耗时。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="输出模式">
    - 默认：人类可读（在 TTY 中带颜色）。
    - `--json`：机器可读的 JSON（无样式 / 无 spinner）。
    - `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI，同时保留人类可读布局。
  </Tab>
  <Tab title="共享选项">
    - `--url <url>`：Gateway 网关 WebSocket URL。
    - `--token <token>`：Gateway 网关 token。
    - `--password <password>`：Gateway 网关密码。
    - `--timeout <ms>`：超时 / 预算（因命令而异）。
    - `--expect-final`：等待“final”响应（智能体调用）。
  </Tab>
</Tabs>

<Note>
当你设置 `--url` 时，CLI 不会回退到配置或环境凭证。请显式传递 `--token` 或 `--password`。缺少显式凭证会报错。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端点是存活探针：一旦服务器可以响应 HTTP，它就会返回。HTTP `/readyz` 端点更严格，在启动 sidecar、渠道或已配置钩子仍在稳定之前会一直保持红色状态。

### `gateway usage-cost`

从会话日志中获取 usage-cost 摘要。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  要包含的天数。
</ParamField>

### `gateway stability`

从正在运行的 Gateway 网关获取最近的诊断稳定性记录器数据。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要包含的最近事件最大数量（最大为 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  按诊断事件类型筛选，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  仅包含某个诊断序列号之后的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  读取持久化的稳定性 bundle，而不是调用正在运行的 Gateway 网关。对状态目录下最新的 bundle 使用 `--bundle latest`（或直接 `--bundle`），或者直接传入 bundle JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写出一个可共享的支持诊断 zip，而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="隐私和 bundle 行为">
    - 记录会保留运维元数据：事件名称、计数、字节大小、内存读数、队列 / 会话状态、渠道 / 插件名称，以及已脱敏的会话摘要。它们不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、token、cookie、secret 值、主机名或原始会话 id。设置 `diagnostics.enabled: false` 可完全禁用记录器。
    - 在 Gateway 网关发生致命退出、关闭超时和重启启动失败时，如果记录器中有事件，OpenClaw 会将相同的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 检查最新 bundle；`--limit`、`--type` 和 `--since-seq` 也适用于 bundle 输出。
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写出一个本地诊断 zip，专门用于附加到 bug 报告。有关隐私模型和 bundle 内容，请参阅 [Diagnostics Export](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 zip 路径。默认是在状态目录下生成一个支持导出文件。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的最大已脱敏日志行数。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  要检查的最大日志字节数。
</ParamField>
<ParamField path="--url <url>" type="string">
  用于健康快照的 Gateway 网关 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  用于健康快照的 Gateway 网关 token。
</ParamField>
<ParamField path="--password <password>" type="string">
  用于健康快照的 Gateway 网关密码。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Status / health 快照超时。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  跳过持久化稳定性 bundle 查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 格式打印写入路径、大小和清单。
</ParamField>

导出内容包括清单、Markdown 摘要、配置形状、已脱敏的配置详情、已脱敏的日志摘要、已脱敏的 Gateway 网关 status / health 快照，以及存在时的最新稳定性 bundle。

它旨在用于共享。它会保留有助于调试的运维细节，例如安全的 OpenClaw 日志字段、子系统名称、状态码、持续时间、已配置模式、端口、插件 id、提供商 id、非 secret 功能设置，以及已脱敏的运维日志消息。它会省略或脱敏聊天文本、webhook 正文、工具输出、凭证、cookie、账户 / 消息标识符、提示 / 指令文本、主机名和 secret 值。当类似 LogTape 风格的消息看起来像用户 / 聊天 / 工具负载文本时，导出仅保留“某条消息已省略”及其字节数。

### `gateway status`

`gateway status` 显示 Gateway 网关服务（launchd / systemd / schtasks）以及可选的连接性 / 认证能力探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  添加一个显式探测目标。仍会探测已配置的远程目标和 localhost。
</ParamField>
<ParamField path="--token <token>" type="string">
  用于探测的 token 认证。
</ParamField>
<ParamField path="--password <password>" type="string">
  用于探测的密码认证。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探测超时。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  跳过连接性探测（仅服务视图）。
</ParamField>
<ParamField path="--deep" type="boolean">
  也扫描系统级服务。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  将默认连接性探测升级为读取探测，并在该读取探测失败时以非零状态退出。不能与 `--no-probe` 组合使用。
</ParamField>

<AccordionGroup>
  <Accordion title="Status 语义">
    - 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
    - 默认的 `gateway status` 可证明服务状态、WebSocket 连接，以及握手时可见的认证能力。它不能证明读 / 写 / 管理操作。
    - 对于首次设备认证，诊断探针不会产生变更：如果已有缓存的设备 token，它会复用；但不会仅为了检查状态而创建新的 CLI 设备身份或只读设备配对记录。
    - `gateway status` 会在可能的情况下解析已配置的认证 SecretRef 以用于探测认证。
    - 如果在此命令路径中某个必需的认证 SecretRef 无法解析，当探测连接 / 认证失败时，`gateway status --json` 会报告 `rpc.authWarning`；请显式传递 `--token` / `--password`，或先解析 secret 来源。
    - 如果探测成功，则会抑制未解析的 auth-ref 警告，以避免误报。
    - 当监听中的服务本身还不够、你还需要读范围 RPC 调用也保持健康时，请在脚本和自动化中使用 `--require-rpc`。
    - `--deep` 会尽力扫描额外的 launchd / systemd / schtasks 安装。当检测到多个类似 gateway 的服务时，人类可读输出会打印清理提示，并警告大多数部署应当每台机器只运行一个 gateway。
    - 人类可读输出包含已解析的文件日志路径，以及 CLI 与服务的配置路径 / 有效性快照，以帮助诊断 profile 或状态目录漂移。
  </Accordion>
  <Accordion title="Linux systemd 认证漂移检查">
    - 在 Linux systemd 安装中，服务认证漂移检查会同时读取 unit 中的 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号的路径、多个文件和可选的 `-` 文件）。
    - 漂移检查会使用合并后的运行时环境变量解析 `gateway.auth.token` SecretRef（优先使用服务命令环境变量，然后回退到进程环境变量）。
    - 如果 token 认证实际上未激活（显式 `gateway.auth.mode` 为 `password` / `none` / `trusted-proxy`，或 mode 未设置且 password 可能优先、并且没有任何 token 候选能胜出），则 token 漂移检查会跳过配置 token 解析。
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是“调试一切”的命令。它始终会探测：

- 你已配置的远程 gateway（如果已设置），以及
- localhost（local loopback），**即使已配置远程地址也是如此**。

如果你传递 `--url`，则会在这两者之前添加该显式目标。人类可读输出会将目标标记为：

- `URL（显式）`
- `Remote（已配置）` 或 `Remote（已配置，未激活）`
- `Local loopback`

<Note>
如果有多个 gateway 可达，它会全部打印出来。当你使用隔离的 profile / 端口（例如 rescue bot）时支持多个 gateway，但大多数安装仍然只运行单个 gateway。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="结果解读">
    - `Reachable: yes` 表示至少有一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 表示探针能够证明的认证能力。它与可达性是分开的。
    - `Read probe: ok` 表示读范围详情 RPC 调用（`health` / `status` / `system-presence` / `config.get`）也成功了。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功，但读范围 RPC 受限。这会被报告为**降级**可达性，而不是完全失败。
    - 与 `gateway status` 一样，probe 会复用现有缓存的设备认证，但不会创建首次设备身份或配对状态。
    - 只有在所有被探测目标都不可达时，退出码才为非零。
  </Accordion>
  <Accordion title="JSON 输出">
    顶层：

    - `ok`：至少有一个目标可达。
    - `degraded`：至少有一个目标的详情 RPC 受到范围限制。
    - `capability`：在所有可达目标中观察到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：按以下顺序作为活动优胜者处理的最佳目标：显式 URL、SSH 隧道、已配置远程目标，然后是本地 loopback。
    - `warnings[]`：尽力而为的警告记录，包含 `code`、`message` 和可选的 `targetIds`。
    - `network`：从当前配置和主机网络派生出的本地 loopback / tailnet URL 提示。
    - `discovery.timeoutMs` 和 `discovery.count`：本次探测实际使用的设备发现预算 / 结果计数。

    每个目标（`targets[].connect`）：

    - `ok`：在连接以及降级分类之后的可达性。
    - `rpcOk`：完整详情 RPC 成功。
    - `scopeLimited`：由于缺少 operator 范围，详情 RPC 失败。

    每个目标（`targets[].auth`）：

    - `role`：可用时，在 `hello-ok` 中报告的认证角色。
    - `scopes`：可用时，在 `hello-ok` 中报告的已授予范围。
    - `capability`：为该目标呈现的认证能力分类。

  </Accordion>
  <Accordion title="常见警告代码">
    - `ssh_tunnel_failed`：SSH 隧道设置失败；命令已回退为直接探测。
    - `multiple_gateways`：有多个目标可达；除非你有意运行隔离的 profile（例如 rescue bot），否则这并不常见。
    - `auth_secretref_unresolved`：某个已配置的认证 SecretRef 无法为失败目标解析。
    - `probe_scope_limited`：WebSocket 连接成功，但读取探针因缺少 `operator.read` 而受限。
  </Accordion>
</AccordionGroup>

#### 通过 SSH 连接远程目标（与 Mac 应用一致）

macOS 应用中的“Remote over SSH”模式使用本地端口转发，使远程 gateway（它可能仅绑定到 loopback）可以通过 `ws://127.0.0.1:<port>` 访问。

等效的 CLI：

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 或 `user@host:port`（端口默认为 `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  身份文件。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  从已解析的设备发现端点中选择第一个发现的 gateway 主机作为 SSH 目标（`local.` 加上已配置的广域域名（如果有））。仅 TXT 的提示会被忽略。
</ParamField>

配置（可选，用作默认值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

底层 RPC 辅助命令。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  用于 params 的 JSON 对象字符串。
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway 网关 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway 网关 token。
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway 网关密码。
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  超时预算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用于智能体风格的 RPC，这类 RPC 会在最终负载之前流式传输中间事件。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的 JSON 输出。
</ParamField>

<Note>
`--params` 必须是有效的 JSON。
</Note>

## 管理 Gateway 网关服务

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### 使用 wrapper 安装

当托管服务必须通过另一个可执行文件启动时，请使用 `--wrapper`，例如
secret 管理器 shim 或 run-as 辅助程序。wrapper 会接收正常的 Gateway 网关参数，并
负责最终使用这些参数执行 `openclaw` 或 Node。

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

你也可以通过环境变量设置 wrapper。`gateway install` 会验证该路径是
一个可执行文件，将 wrapper 写入服务 `ProgramArguments`，并在服务环境中持久化
`OPENCLAW_WRAPPER`，供后续强制重新安装、更新和 Doctor
修复使用。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

要移除已持久化的 wrapper，请在重新安装时清空 `OPENCLAW_WRAPPER`：

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="命令选项">
    - `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`：`--port`、`--runtime <node|bun>`、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway uninstall|start|stop|restart`：`--json`
  </Accordion>
  <Accordion title="生命周期行为">
    - 使用 `gateway restart` 重启托管服务。不要将 `gateway stop` 和 `gateway start` 串联起来替代重启；在 macOS 上，`gateway stop` 会在停止之前有意禁用 LaunchAgent。
    - 生命周期命令接受 `--json` 以供脚本使用。
  </Accordion>
  <Accordion title="安装时的认证和 SecretRef">
    - 当 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证 SecretRef 可解析，但不会将解析后的 token 持久化到服务环境元数据中。
    - 如果 token 认证需要 token，而已配置的 token SecretRef 无法解析，则安装会以封闭失败的方式终止，而不是持久化回退明文。
    - 对于 `gateway run` 的密码认证，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`，而不是内联 `--password`。
    - 在推断认证模式下，仅 shell 中的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装的 token 要求；安装托管服务时，请使用持久配置（`gateway.auth.password` 或 config `env`）。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，而 `gateway.auth.mode` 未设置，则在显式设置 mode 之前会阻止安装。
  </Accordion>
</AccordionGroup>

## 发现 gateway（Bonjour）

`gateway discover` 会扫描 Gateway 网关 beacon（`_openclaw-gw._tcp`）。

- Multicast DNS-SD：`local.`
- Unicast DNS-SD（广域 Bonjour）：选择一个域名（例如：`openclaw.internal.`），并设置 split DNS + DNS 服务器；参见 [Bonjour](/zh-CN/gateway/bonjour)。

只有启用了 Bonjour 设备发现（默认启用）的 gateway 才会通告该 beacon。

广域发现记录包括（TXT）：

- `role`（gateway 角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（可选；缺失时，客户端默认 SSH 目标端口为 `22`）
- `tailnetDns`（可用时的 MagicDNS 主机名）
- `gatewayTls` / `gatewayTlsSha256`（TLS 是否启用 + 证书指纹）
- `cliPath`（写入广域区域的远程安装提示）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每条命令的超时时间（browse / resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出（也会禁用样式 / spinner）。
</ParamField>

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI 会扫描 `local.` 以及已配置的广域域名（如果已启用）。
- JSON 输出中的 `wsUrl` 派生自已解析的服务端点，而不是 `lanHost` 或 `tailnetDns` 之类仅 TXT 的提示。
- 在 `local.` mDNS 上，只有当 `discovery.mdns.mode` 为 `full` 时，才会广播 `sshPort` 和 `cliPath`。广域 DNS-SD 仍会写入 `cliPath`；`sshPort` 在那里同样保持可选。
</Note>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)
