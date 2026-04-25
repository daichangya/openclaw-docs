---
read_when:
    - 故障排除中心已将你引导到这里，以便进行更深入的诊断
    - 你需要基于稳定症状的运行手册章节，并包含精确命令
summary: Gateway 网关、渠道、自动化、节点和浏览器的深度故障排除运行手册
title: 故障排除
x-i18n:
    generated_at: "2026-04-25T22:27:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 801ad437164d4bd5b834e5018e4d73d452a61d6e6f084093bb736b4531c428c1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway 网关故障排除

此页面是深度运行手册。
如果你想先使用快速分诊流程，请从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始。

## 命令阶梯

先运行这些命令，并按以下顺序执行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期的健康信号：

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 报告没有阻塞性的配置或服务问题。
- `openclaw channels status --probe` 显示每个账户的实时传输状态，并且在支持的情况下，显示如 `works` 或 `audit ok` 之类的探测 / 审计结果。

## Anthropic 429：长上下文需要额外用量

当日志 / 错误中包含以下内容时使用本节：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

查找以下内容：

- 所选的 Anthropic Opus / Sonnet 模型设置了 `params.context1m: true`。
- 当前的 Anthropic 凭证不具备长上下文用量资格。
- 请求仅在需要使用 1M beta 路径的长会话 / 模型运行中失败。

修复选项：

1. 对该模型禁用 `context1m`，回退到普通上下文窗口。
2. 使用具备长上下文请求资格的 Anthropic 凭证，或切换为 Anthropic API key。
3. 配置后备模型，以便在 Anthropic 长上下文请求被拒绝时，运行仍可继续。

相关内容：

- [Anthropic](/zh-CN/providers/anthropic)
- [令牌使用与成本](/zh-CN/reference/token-use)
- [为什么我会看到来自 Anthropic 的 HTTP 429？](/zh-CN/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本地 OpenAI-compatible 后端直接探测通过，但智能体运行失败

当出现以下情况时使用本节：

- `curl ... /v1/models` 可正常工作
- 很小的直接 `/v1/chat/completions` 调用可正常工作
- OpenClaw 模型运行仅在正常智能体轮次中失败

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

查找以下内容：

- 很小的直接调用成功，但 OpenClaw 运行仅在较大提示词下失败
- 后端报错称 `messages[].content` 应为字符串
- 后端仅在较大的提示词 token 数或完整智能体运行时提示词下崩溃

常见特征：

- `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化的 Chat Completions 内容分片。修复方法：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 很小的直接请求成功，但 OpenClaw 智能体运行因后端 / 模型崩溃而失败（例如某些 `inferrs` 构建中的 Gemma）→ OpenClaw 传输层很可能已经正确；失败的是后端在处理更大的 Agent Runtimes 提示词形态时出错。
- 禁用工具后失败有所减少，但并未消失 → 工具 schema 是压力来源之一，但剩余问题仍然是上游模型 / 服务器容量限制或后端 bug。

修复选项：

1. 对仅接受字符串的 Chat Completions 后端设置 `compat.requiresStringContent: true`。
2. 对无法可靠处理 OpenClaw 工具 schema 表面的模型 / 后端设置 `compat.supportsTools: false`。
3. 在可能的情况下减轻提示词压力：更小的工作区引导、更短的会话历史、更轻量的本地模型，或使用对长上下文支持更强的后端。
4. 如果很小的直接请求持续通过，而 OpenClaw 智能体轮次仍在后端内部崩溃，则应将其视为上游服务器 / 模型限制，并向上游提交 repro，附上已被接受的负载形态。

相关内容：

- [本地模型](/zh-CN/gateway/local-models)
- [配置](/zh-CN/gateway/configuration)
- [OpenAI-compatible 端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 无回复

如果渠道已上线但没有任何响应，请在重新连接任何内容之前先检查路由和策略。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

查找以下内容：

- 私信发送者的配对仍待处理。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 渠道 / 群组 allowlist 不匹配。

常见特征：

- `drop guild message (mention required` → 群消息在被提及之前会被忽略。
- `pairing request` → 发送者需要批准。
- `blocked` / `allowlist` → 发送者 / 渠道被策略过滤。

相关内容：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)

## Dashboard 控制 UI 连接性

当 dashboard / 控制 UI 无法连接时，请验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

查找以下内容：

- 正确的探测 URL 和 dashboard URL。
- 客户端与 Gateway 网关之间的认证模式 / token 不匹配。
- 在需要设备身份时却使用了 HTTP。

常见特征：

- `device identity required` → 非安全上下文，或缺少设备认证。
- `origin not allowed` → 浏览器的 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正从非 loopback 的浏览器来源连接，但未显式加入 allowlist）。
- `device nonce required` / `device nonce mismatch` → 客户端未完成基于质询的设备认证流程（`connect.challenge` + `device.nonce`）。
- `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的负载（或使用了过期时间戳）。
- `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可以使用缓存的设备 token 执行一次可信重试。
- 该缓存 token 的重试会复用与已配对设备 token 一起存储的缓存作用域集合。显式 `deviceToken` / 显式 `scopes` 调用方则保持其请求的作用域集合不变。
- 在该重试路径之外，连接认证优先级依次为：显式共享 token / 密码、显式 `deviceToken`、已存储设备 token、bootstrap token。
- 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, ip}` 的失败尝试会在限速器记录失败之前串行化。因此，同一客户端的两次并发错误重试中，第二次可能会显示 `retry later`，而不是两个普通的不匹配错误。
- 浏览器来源的 loopback 客户端出现 `too many failed authentication attempts (retry later)` → 来自同一标准化 `Origin` 的重复失败会被临时锁定；另一个 localhost 来源使用的是单独的 bucket。
- 在该重试之后仍重复出现 `unauthorized` → 共享 token / 设备 token 漂移；如有需要，刷新 token 配置，并重新批准 / 轮换设备 token。
- `gateway connect failed:` → 主机 / 端口 / URL 目标错误。

### 认证详细代码速查表

使用失败 `connect` 响应中的 `error.details.code` 来选择下一步操作：

| 详细代码 | 含义 | 推荐操作 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING` | 客户端未发送必需的共享 token。 | 在客户端中粘贴 / 设置 token 后重试。对于 dashboard 路径：`openclaw config get gateway.auth.token`，然后将其粘贴到 Control UI 设置中。 |
| `AUTH_TOKEN_MISMATCH` | 共享 token 与 Gateway 网关认证 token 不匹配。 | 如果 `canRetryWithDeviceToken=true`，允许一次可信重试。缓存 token 的重试会复用已存储的已批准作用域；显式 `deviceToken` / `scopes` 调用方保持请求的作用域不变。如果仍失败，请运行 [token 漂移恢复清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 每设备缓存 token 已过期或被撤销。 | 使用 [devices CLI](/zh-CN/cli/devices) 轮换 / 重新批准设备 token，然后重新连接。 |
| `PAIRING_REQUIRED` | 设备身份需要批准。请检查 `error.details.reason`，其值可能为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求：`openclaw devices list`，然后运行 `openclaw devices approve <requestId>`。在你审查请求的访问权限后，作用域 / 角色升级也使用相同流程。 |

使用共享 Gateway 网关 token / 密码进行认证的直接 loopback 后端 RPC，不应依赖 CLI 已配对设备的基础作用域。如果子智能体或其他内部调用仍然因 `scope-upgrade` 失败，请验证调用方使用的是 `client.id: "gateway-client"` 和 `client.mode: "backend"`，并且没有强制显式 `deviceIdentity` 或设备 token。

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce / signature 错误，请更新发起连接的客户端，并验证它：

1. 等待 `connect.challenge`
2. 对绑定 challenge 的负载进行签名
3. 使用相同的 challenge nonce 发送 `connect.params.device.nonce`

如果 `openclaw devices rotate` / `revoke` / `remove` 被意外拒绝：

- 已配对设备 token 会话只能管理**它们自己的**设备，除非调用方还具有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求调用方会话已持有的 operator 作用域

相关内容：

- [Control UI](/zh-CN/web/control-ui)
- [配置](/zh-CN/gateway/configuration)（Gateway 网关认证模式）
- [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)
- [远程访问](/zh-CN/gateway/remote)
- [设备](/zh-CN/cli/devices)

## Gateway 网关服务未运行

当服务已安装但进程无法持续运行时，使用本节。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

查找以下内容：

- `Runtime: stopped`，并带有退出提示。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口 / 监听器冲突。
- 使用 `--deep` 时发现额外的 launchd / systemd / schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

常见特征：

- `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 未启用本地 Gateway 网关模式，或者配置文件被覆盖并丢失了 `gateway.mode`。修复方法：在你的配置中设置 `gateway.mode="local"`，或者重新运行 `openclaw onboard --mode local` / `openclaw setup`，以重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 在没有有效 Gateway 网关认证路径的情况下绑定到非 loopback 地址（token / 密码，或在已配置时使用 trusted-proxy）。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
- `Other gateway-like services detected (best effort)` → 存在过时或并行的 launchd / systemd / schtasks 单元。大多数设置应当每台机器只保留一个 Gateway 网关；如果你确实需要多个，请隔离端口 + 配置 / 状态 / 工作区。参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。

相关内容：

- [后台执行和进程工具](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关已恢复上次已知正常配置

当 Gateway 网关能够启动，但日志显示它恢复了 `openclaw.json` 时，请使用本节。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

查找以下内容：

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- 活动配置旁边带时间戳的 `openclaw.json.clobbered.*` 文件
- 以 `Config recovery warning` 开头的主智能体系统事件

发生了什么：

- 被拒绝的配置在启动期间或热重载期间未通过验证。
- OpenClaw 将被拒绝的负载保留为 `.clobbered.*`。
- 活动配置已从上次验证通过的 last-known-good 副本中恢复。
- 下一次主智能体轮次会收到警告，不要盲目重写被拒绝的配置。
- 如果所有验证问题都位于 `plugins.entries.<id>...` 之下，OpenClaw 不会恢复整个文件。插件本地失败会继续明确报出，而不相关的用户设置会保留在活动配置中。

检查并修复：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

常见特征：

- 存在 `.clobbered.*` → 外部直接编辑或启动读取的内容已被恢复。
- 存在 `.rejected.*` → OpenClaw 自身发起的配置写入在提交前未通过 schema 或 clobber 检查。
- `Config write rejected:` → 该写入尝试删除必需结构、显著缩小文件，或持久化无效配置。
- `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → 启动时将当前文件视为被覆盖，因为与 last-known-good 备份相比，它丢失了字段或大小发生了下降。
- `Config last-known-good promotion skipped` → 候选内容包含已脱敏的密钥占位符，例如 `***`。

修复选项：

1. 如果恢复后的活动配置正确，就保留它。
2. 仅从 `.clobbered.*` 或 `.rejected.*` 中复制你原本打算修改的键，然后通过 `openclaw config set` 或 `config.patch` 应用它们。
3. 重启前运行 `openclaw config validate`。
4. 如果你手动编辑，请保留完整的 JSON5 配置，而不是只保留你想更改的那部分对象。

相关内容：

- [配置：严格验证](/zh-CN/gateway/configuration#strict-validation)
- [配置：热重载](/zh-CN/gateway/configuration#config-hot-reload)
- [配置](/zh-CN/cli/config)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 能探测到某些目标，但仍打印警告块时，请使用本节。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

查找以下内容：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否与 SSH 回退、多个 Gateway 网关、缺失作用域或未解析的认证引用有关。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试了已配置的 / loopback 直接目标。
- `multiple reachable gateways detected` → 有多个目标作出了响应。这通常意味着有意的多 Gateway 网关设置，或者存在过时 / 重复的监听器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功，但详细 RPC 受作用域限制；请配对设备身份，或使用具有 `operator.read` 的凭证。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关已响应，但此客户端在获得正常 operator 访问前仍需要配对 / 批准。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 在此次命令路径中，目标所需的认证材料不可用。

相关内容：

- [Gateway 网关](/zh-CN/cli/gateway)
- [同一主机上的多个 Gateway 网关](/zh-CN/gateway#multiple-gateways-same-host)
- [远程访问](/zh-CN/gateway/remote)

## 渠道已连接但消息未流动

如果渠道状态显示已连接，但消息流已中断，请重点检查策略、权限和渠道特定的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

查找以下内容：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组 allowlist 和提及要求。
- 缺失的渠道 API 权限 / scopes。

常见特征：

- `mention required` → 消息因群组提及策略而被忽略。
- `pairing` / 待批准痕迹 → 发送者尚未获批。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 渠道认证 / 权限问题。

相关内容：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [WhatsApp](/zh-CN/channels/whatsapp)
- [Telegram](/zh-CN/channels/telegram)
- [Discord](/zh-CN/channels/discord)

## Cron 和 heartbeat 投递

如果 cron 或 heartbeat 未运行或未投递，请先验证调度器状态，再检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

查找以下内容：

- Cron 已启用，并且存在下次唤醒时间。
- 任务运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
- `cron: timer tick failed` → 调度器 tick 失败；请检查文件 / 日志 / 运行时错误。
- `heartbeat skipped` 且 `reason=quiet-hours` → 当前不在活跃时段窗口内。
- `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空行 / markdown 标题，因此 OpenClaw 会跳过模型调用。
- `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但在当前 tick 中没有任何任务到期。
- `heartbeat: unknown accountId` → heartbeat 投递目标的账户 id 无效。
- `heartbeat skipped` 且 `reason=dm-blocked` → heartbeat 目标被解析为私信式目的地，而 `agents.defaults.heartbeat.directPolicy`（或每个智能体的覆盖配置）被设置为 `block`。

相关内容：

- [定时任务：故障排除](/zh-CN/automation/cron-jobs#troubleshooting)
- [定时任务](/zh-CN/automation/cron-jobs)
- [Heartbeat](/zh-CN/gateway/heartbeat)

## 已配对节点的工具失败

如果节点已配对但工具失败，请分别确认前台状态、权限状态和批准状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

查找以下内容：

- 节点在线，并具备预期能力。
- 相机 / 麦克风 / 位置 / 屏幕的 OS 权限授予状态。
- Exec 批准和 allowlist 状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须处于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少 OS 权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 批准待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被 allowlist 阻止。

相关内容：

- [节点故障排除](/zh-CN/nodes/troubleshooting)
- [节点](/zh-CN/nodes/index)
- [Exec 批准](/zh-CN/tools/exec-approvals)

## 浏览器工具失败

当浏览器工具操作失败，但 Gateway 网关本身是健康的时，请使用本节。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

查找以下内容：

- 是否设置了 `plugins.allow`，并且其中包含 `browser`。
- 有效的浏览器可执行文件路径。
- CDP 配置文件可达性。
- `existing-session` / `user` 配置文件所需的本地 Chrome 是否可用。

常见特征：

- `unknown command "browser"` 或 `unknown command 'browser'` → 内置浏览器插件被 `plugins.allow` 排除。
- 浏览器工具缺失 / 不可用，而 `browser.enabled=true` → `plugins.allow` 排除了 `browser`，因此插件从未加载。
- `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的协议，例如 `file:` 或 `ftp:`。
- `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口无效或超出范围。
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚未成功附加到所选浏览器数据目录。打开浏览器检查页面，启用远程调试，保持浏览器开启，批准首次附加提示，然后重试。如果不需要登录状态，优先使用受管的 `openclaw` 配置文件。
- `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签页。
- `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点从 Gateway 网关主机无法访问。
- `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可访问目标，或者 HTTP 端点虽然有响应，但 CDP WebSocket 仍无法打开。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装缺少内置浏览器插件所需的 `playwright-core` 运行时依赖；运行 `openclaw doctor --fix`，然后重启 Gateway 网关。ARIA 快照和基础页面截图仍可使用，但导航、AI 快照、基于 CSS 选择器的元素截图以及 PDF 导出仍不可用。
- `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用整页捕获或快照 `--ref`，而不是 CSS `--element`。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 文件上传钩子需要使用快照引用，而不是 CSS 选择器。
- `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件中，每次调用只能上传一个文件。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件中的对话框钩子不支持超时覆盖。
- `existing-session type does not support timeoutMs overrides.` → 在 `profile="user"` / Chrome MCP existing-session 配置文件上，对 `act:type` 省略 `timeoutMs`，或者在需要自定义超时时使用受管 / CDP 浏览器配置文件。
- `existing-session evaluate does not support timeoutMs overrides.` → 在 `profile="user"` / Chrome MCP existing-session 配置文件上，对 `act:evaluate` 省略 `timeoutMs`，或者在需要自定义超时时使用受管 / CDP 浏览器配置文件。
- `response body is not supported for existing-session profiles yet.` → `responsebody` 目前仍需要受管浏览器或原始 CDP 配置文件。
- attach-only 或远程 CDP 配置文件上存在陈旧的视口 / 深色模式 / 区域设置 / 离线覆盖状态 → 运行 `openclaw browser stop --browser-profile <name>`，关闭活动控制会话并释放 Playwright / CDP 仿真状态，而无需重启整个 Gateway 网关。

相关内容：

- [浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)
- [浏览器（OpenClaw 托管）](/zh-CN/tools/browser)

## 如果你升级后突然出现故障

大多数升级后的故障都源于配置漂移，或是现在开始强制执行了更严格的默认值。

### 1) 认证和 URL 覆盖行为发生了变化

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

检查内容：

- 如果 `gateway.mode=remote`，CLI 调用可能正在访问远程目标，而你的本地服务其实是正常的。
- 显式 `--url` 调用不会回退到已存储凭证。

常见特征：

- `gateway connect failed:` → URL 目标错误。
- `unauthorized` → 端点可访问，但认证错误。

### 2) 绑定和认证保护措施变得更严格

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

检查内容：

- 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关认证路径：共享 token / 密码认证，或正确配置的非 loopback `trusted-proxy` 部署。
- 像 `gateway.token` 这样的旧键不会替代 `gateway.auth.token`。

常见特征：

- `refusing to bind gateway ... without auth` → 非 loopback 绑定缺少有效的 Gateway 网关认证路径。
- 运行时已启动但 `Connectivity probe: failed` → Gateway 网关存活，但使用当前 auth / URL 无法访问。

### 3) 配对和设备身份状态发生了变化

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

检查内容：

- dashboard / 节点存在待批准的设备请求。
- 策略或身份变更后，存在待批准的私信配对请求。

常见特征：

- `device identity required` → 设备认证未满足。
- `pairing required` → 发送者 / 设备必须先获批。

如果在检查之后，服务配置与运行时仍然不一致，请从同一个配置文件 / 状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关内容：

- [Gateway 网关管理的配对](/zh-CN/gateway/pairing)
- [认证](/zh-CN/gateway/authentication)
- [后台执行和进程工具](/zh-CN/gateway/background-process)

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Doctor](/zh-CN/gateway/doctor)
- [常见问题](/zh-CN/help/faq)
