---
read_when:
    - 故障排除中心已将你引导到这里，以进行更深入的诊断
    - 你需要基于稳定症状的操作手册章节，并提供精确命令
summary: Gateway 网关、渠道、自动化、节点和浏览器的深度故障排除操作手册
title: 故障排除
x-i18n:
    generated_at: "2026-04-21T07:13:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: add7625785e3b78897c750b4785b7fe84a3d91c23c4175de750c4834272967f9
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway 网关故障排除

本页是深度操作手册。
如果你想先走快速分诊流程，请从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始。

## 命令阶梯

先按以下顺序运行这些命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期的健康信号：

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok` 和一行 `Capability: ...`。
- `openclaw doctor` 报告没有阻塞性的配置或服务问题。
- `openclaw channels status --probe` 显示每个账户的实时传输状态，以及在支持时显示探测/审计结果，例如 `works` 或 `audit ok`。

## Anthropic 429：长上下文需要额外使用额度

当日志/错误中包含以下内容时使用本节：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

检查以下内容：

- 所选的 Anthropic Opus/Sonnet 模型启用了 `params.context1m: true`。
- 当前的 Anthropic 凭证不具备长上下文使用资格。
- 请求仅在需要走 1M beta 路径的长会话/模型运行中失败。

修复选项：

1. 为该模型禁用 `context1m`，回退到常规上下文窗口。
2. 使用具备长上下文请求资格的 Anthropic 凭证，或切换到 Anthropic API key。
3. 配置回退模型，以便在 Anthropic 长上下文请求被拒绝时仍可继续运行。

相关内容：

- [/providers/anthropic](/zh-CN/providers/anthropic)
- [/reference/token-use](/zh-CN/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/zh-CN/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本地 OpenAI 兼容后端直接探测通过，但智能体运行失败

出现以下情况时使用本节：

- `curl ... /v1/models` 可用
- 很小的直接 `/v1/chat/completions` 调用可用
- OpenClaw 模型运行仅在正常智能体轮次中失败

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

检查以下内容：

- 很小的直接调用成功，但 OpenClaw 运行只在较大提示词时失败
- 后端报错 `messages[].content` 期望是字符串
- 后端仅在较大的提示词 token 数或完整智能体运行时提示词下崩溃

常见特征：

- `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化的 Chat Completions 内容片段。修复方法：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 很小的直接请求成功，但 OpenClaw 智能体运行因后端/模型崩溃而失败（例如某些 `inferrs` 构建中的 Gemma）→ OpenClaw 传输层很可能已经正确；失败的是后端在处理更大的智能体运行时提示词形状。
- 禁用工具后失败有所减少但未消失 → 工具 schema 是压力来源之一，但剩余问题仍然是上游模型/服务器容量限制或后端 bug。

修复选项：

1. 为仅支持字符串的 Chat Completions 后端设置 `compat.requiresStringContent: true`。
2. 为无法可靠处理 OpenClaw 工具 schema 表面的模型/后端设置 `compat.supportsTools: false`。
3. 在可能的情况下降低提示词压力：更小的工作区引导、更短的会话历史、更轻量的本地模型，或使用对长上下文支持更强的后端。
4. 如果很小的直接请求持续通过，而 OpenClaw 智能体轮次仍在后端内部崩溃，请将其视为上游服务器/模型限制，并在那里提交一个包含已接受载荷形状的复现。

相关内容：

- [/gateway/local-models](/zh-CN/gateway/local-models)
- [/gateway/configuration](/zh-CN/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 没有回复

如果渠道已启动，但没有任何响应，请先检查路由和策略，再决定是否重新连接任何组件。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

检查以下内容：

- 私信发送者的配对是否处于待处理状态。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 渠道/群组 allowlist 是否不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息在被提及之前会被忽略。
- `pairing request` → 发送者需要获批。
- `blocked` / `allowlist` → 发送者/渠道被策略过滤。

相关内容：

- [/channels/troubleshooting](/zh-CN/channels/troubleshooting)
- [/channels/pairing](/zh-CN/channels/pairing)
- [/channels/groups](/zh-CN/channels/groups)

## Dashboard 控制 UI 连接问题

当 dashboard/control UI 无法连接时，请验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

检查以下内容：

- 探测 URL 和 dashboard URL 是否正确。
- 客户端与 Gateway 网关之间的认证模式/token 是否不匹配。
- 在需要设备身份时是否错误地使用了 HTTP。

常见特征：

- `device identity required` → 非安全上下文，或缺少设备认证。
- `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正从非 loopback 的浏览器 origin 连接，但没有显式 allowlist）。
- `device nonce required` / `device nonce mismatch` → 客户端没有完成基于 challenge 的设备认证流程（`connect.challenge` + `device.nonce`）。
- `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的载荷（或使用了过期时间戳）。
- `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可使用缓存的设备 token 进行一次可信重试。
- 该缓存 token 重试会复用与已配对设备 token 一起存储的缓存作用域集合。显式 `deviceToken` / 显式 `scopes` 调用方则会保留其请求的作用域集合。
- 在该重试路径之外，连接认证优先级依次为：显式共享 token/password 优先，然后是显式 `deviceToken`，再然后是已存储的设备 token，最后是引导 token。
- 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, ip}` 的失败尝试会在限流器记录失败之前被串行化。因此，同一客户端的两个并发错误重试中，第二次可能显示 `retry later`，而不是两个普通的不匹配。
- 来自浏览器 origin loopback 客户端的 `too many failed authentication attempts (retry later)` → 来自同一规范化 `Origin` 的重复失败会被临时锁定；另一个 localhost origin 会使用单独的计数桶。
- 在该重试后仍反复出现 `unauthorized` → 共享 token/设备 token 已漂移；如有需要，请刷新 token 配置并重新批准/轮换设备 token。
- `gateway connect failed:` → 主机/端口/url 目标错误。

### 认证详细代码速查表

使用失败 `connect` 响应中的 `error.details.code` 来决定下一步操作：

| 详细代码 | 含义 | 建议操作 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING` | 客户端未发送所需的共享 token。 | 在客户端中粘贴/设置 token 后重试。对于 dashboard 路径：`openclaw config get gateway.auth.token`，然后将其粘贴到 Control UI 设置中。 |
| `AUTH_TOKEN_MISMATCH` | 共享 token 与 Gateway 网关认证 token 不匹配。 | 如果 `canRetryWithDeviceToken=true`，允许进行一次可信重试。缓存 token 重试会复用已存储的已批准作用域；显式 `deviceToken` / `scopes` 调用方则保留请求的作用域。如果仍然失败，请运行[ token 漂移恢复检查清单 ](/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备 token 已过期或被撤销。 | 使用 [devices CLI](/cli/devices) 轮换/重新批准设备 token，然后重新连接。 |
| `PAIRING_REQUIRED` | 设备身份需要批准。检查 `error.details.reason` 是否为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求：`openclaw devices list`，然后 `openclaw devices approve <requestId>`。作用域/角色升级在你审核所请求访问权限后使用相同流程。 |

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/signature 错误，请更新正在连接的客户端并验证它：

1. 等待 `connect.challenge`
2. 对绑定 challenge 的载荷进行签名
3. 使用相同的 challenge nonce 发送 `connect.params.device.nonce`

如果 `openclaw devices rotate` / `revoke` / `remove` 被意外拒绝：

- 已配对设备 token 会话只能管理**它们自己的**设备，除非调用方还具有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求调用方会话已经持有的 operator 作用域

相关内容：

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/zh-CN/gateway/configuration)（Gateway 网关认证模式）
- [/gateway/trusted-proxy-auth](/zh-CN/gateway/trusted-proxy-auth)
- [/gateway/remote](/zh-CN/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 网关服务未运行

当服务已安装，但进程无法保持运行时使用本节。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 还会扫描系统级服务
```

检查以下内容：

- `Runtime: stopped` 以及退出提示。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听器冲突。
- 使用 `--deep` 时发现额外的 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

常见特征：

- `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 未启用本地 Gateway 网关模式，或者配置文件被覆盖导致丢失了 `gateway.mode`。修复：在你的配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 以重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 在没有有效 Gateway 网关认证路径的情况下绑定到非 loopback 地址（token/password，或已配置时的 trusted-proxy）。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
- `Other gateway-like services detected (best effort)` → 存在陈旧或并行的 launchd/systemd/schtasks 单元。大多数部署应每台机器只保留一个 Gateway 网关；如果你确实需要多个，请隔离端口 + 配置/状态/工作区。参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。

相关内容：

- [/gateway/background-process](/zh-CN/gateway/background-process)
- [/gateway/configuration](/zh-CN/gateway/configuration)
- [/gateway/doctor](/zh-CN/gateway/doctor)

## Gateway 网关已恢复最近一次已知良好配置

当 Gateway 网关能够启动，但日志显示它恢复了 `openclaw.json` 时，请使用本节。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

检查以下内容：

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- 活动配置旁边是否有带时间戳的 `openclaw.json.clobbered.*` 文件
- 是否存在以 `Config recovery warning` 开头的主智能体系统事件

发生了什么：

- 被拒绝的配置在启动或热重载期间未通过校验。
- OpenClaw 将被拒绝的载荷保留为 `.clobbered.*`。
- 当前活动配置从最近一次通过校验的 last-known-good 副本中恢复。
- 下一次主智能体轮次会收到警告，不要盲目重写该被拒绝配置。

检查并修复：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

常见特征：

- 存在 `.clobbered.*` → 外部直接编辑或启动读取已被恢复。
- 存在 `.rejected.*` → OpenClaw 自有的配置写入在提交前因 schema 或 clobber 检查失败。
- `Config write rejected:` → 该写入尝试删除必需结构、大幅缩小文件，或持久化无效配置。
- `Config last-known-good promotion skipped` → 候选配置包含已脱敏的 secret 占位符，例如 `***`。

修复选项：

1. 如果恢复后的活动配置是正确的，就保留它。
2. 只从 `.clobbered.*` 或 `.rejected.*` 复制你真正想要的键，然后使用 `openclaw config set` 或 `config.patch` 应用。
3. 重启前运行 `openclaw config validate`。
4. 如果你手动编辑，请保留完整的 JSON5 配置，而不是只保留你想改动的那部分对象。

相关内容：

- [/gateway/configuration#strict-validation](/zh-CN/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/zh-CN/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 能探测到目标，但仍打印警告块时，请使用本节。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

检查以下内容：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否与 SSH 回退、多个 Gateway 网关、缺少作用域，或未解析的认证引用有关。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试直接探测已配置/loopback 目标。
- `multiple reachable gateways detected` → 有多个目标响应。通常这表示有意的多 Gateway 网关部署，或存在陈旧/重复的监听器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功了，但详细 RPC 受作用域限制；请配对设备身份，或使用带有 `operator.read` 的凭证。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关已响应，但该客户端仍需要完成配对/批准后才能获得正常 operator 访问。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 在此命令路径中，失败目标所需的认证材料不可用。

相关内容：

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)
- [/gateway/remote](/zh-CN/gateway/remote)

## 渠道已连接但消息不流动

如果渠道状态显示已连接，但消息流已中断，请重点检查策略、权限和渠道特有的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

检查以下内容：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组 allowlist 和提及要求。
- 缺失的渠道 API 权限/作用域。

常见特征：

- `mention required` → 消息因群组提及策略而被忽略。
- `pairing` / 待批准轨迹 → 发送者尚未获批。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 渠道认证/权限问题。

相关内容：

- [/channels/troubleshooting](/zh-CN/channels/troubleshooting)
- [/channels/whatsapp](/zh-CN/channels/whatsapp)
- [/channels/telegram](/zh-CN/channels/telegram)
- [/channels/discord](/zh-CN/channels/discord)

## Cron 和 heartbeat 投递

如果 cron 或 heartbeat 未运行或未投递，请先验证调度器状态，再检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

检查以下内容：

- Cron 是否已启用，以及是否存在下次唤醒时间。
- 任务运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
- `cron: timer tick failed` → 调度器 tick 失败；请检查文件/日志/运行时错误。
- `heartbeat skipped` 且 `reason=quiet-hours` → 当前处于活跃时段窗口之外。
- `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空行 / markdown 标题，因此 OpenClaw 会跳过模型调用。
- `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但本次 tick 没有任何任务到期。
- `heartbeat: unknown accountId` → heartbeat 投递目标使用了无效账户 id。
- `heartbeat skipped` 且 `reason=dm-blocked` → heartbeat 目标被解析为私信式目的地，而 `agents.defaults.heartbeat.directPolicy`（或按智能体覆盖值）被设为 `block`。

相关内容：

- [/automation/cron-jobs#troubleshooting](/zh-CN/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/zh-CN/automation/cron-jobs)
- [/gateway/heartbeat](/zh-CN/gateway/heartbeat)

## 已配对节点工具失败

如果节点已配对，但工具失败，请分别排查前台状态、权限和批准状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

检查以下内容：

- 节点是否在线，并具有预期能力。
- 相机/麦克风/位置/屏幕的操作系统权限是否已授予。
- exec 批准和 allowlist 状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须位于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少操作系统权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 批准待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被 allowlist 阻止。

相关内容：

- [/nodes/troubleshooting](/zh-CN/nodes/troubleshooting)
- [/nodes/index](/zh-CN/nodes/index)
- [/tools/exec-approvals](/zh-CN/tools/exec-approvals)

## 浏览器工具失败

当浏览器工具操作失败，但 Gateway 网关本身健康时，请使用本节。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

检查以下内容：

- 是否设置了 `plugins.allow`，且其中包含 `browser`。
- 浏览器可执行文件路径是否有效。
- CDP 配置文件是否可达。
- 对于 `existing-session` / `user` 配置文件，本地 Chrome 是否可用。

常见特征：

- `unknown command "browser"` 或 `unknown command 'browser'` → 内置 browser 插件被 `plugins.allow` 排除了。
- 当 `browser.enabled=true` 时 browser 工具缺失 / 不可用 → `plugins.allow` 排除了 `browser`，因此插件从未加载。
- `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的协议，例如 `file:` 或 `ftp:`。
- `browser.cdpUrl has invalid port` → 配置的 CDP URL 使用了错误或超范围的端口。
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚无法附加到所选浏览器数据目录。请打开浏览器检查页面、启用远程调试、保持浏览器开启、批准首次附加提示，然后重试。如果不需要已登录状态，优先使用托管的 `openclaw` 配置文件。
- `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签页。
- `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点从 Gateway 网关主机不可达。
- `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可达目标，或者 HTTP 端点虽有响应，但 CDP WebSocket 仍无法打开。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装不包含完整的 Playwright 包；ARIA 快照和基础页面截图仍可用，但导航、AI 快照、基于 CSS 选择器的元素截图以及 PDF 导出仍不可用。
- `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，不能使用 CSS `--element`。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要快照引用，不能使用 CSS 选择器。
- `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件中，每次调用只能发送一个上传文件。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件上的对话框钩子不支持超时覆盖。
- `response body is not supported for existing-session profiles yet.` → `responsebody` 目前仍需要托管浏览器或原始 CDP 配置文件。
- attach-only 或远程 CDP 配置文件上的陈旧 viewport / 暗色模式 / locale / offline 覆盖状态 → 运行 `openclaw browser stop --browser-profile <name>` 关闭当前活动控制会话，并释放 Playwright/CDP 仿真状态，而无需重启整个 Gateway 网关。

相关内容：

- [/tools/browser-linux-troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
- [/tools/browser](/zh-CN/tools/browser)

## 如果你升级后突然出现故障

大多数升级后的问题都源于配置漂移，或现在开始强制执行更严格的默认值。

### 1）认证和 URL 覆盖行为已变更

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

检查内容：

- 如果 `gateway.mode=remote`，CLI 调用可能正指向远程端，而你的本地服务其实是正常的。
- 显式 `--url` 调用不会回退到已存储的凭证。

常见特征：

- `gateway connect failed:` → URL 目标错误。
- `unauthorized` → 端点可达，但认证错误。

### 2）绑定和认证护栏更严格了

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

检查内容：

- 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关认证路径：共享 token/password 认证，或正确配置的非 loopback `trusted-proxy` 部署。
- 像 `gateway.token` 这样的旧键不会替代 `gateway.auth.token`。

常见特征：

- `refusing to bind gateway ... without auth` → 在没有有效 Gateway 网关认证路径的情况下绑定到非 loopback 地址。
- `Connectivity probe: failed` 且运行时仍在运行 → Gateway 网关存活，但使用当前认证/url 无法访问。

### 3）配对和设备身份状态已变更

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

检查内容：

- dashboard/节点是否有待批准的设备请求。
- 在策略或身份变更后，私信配对是否有待批准请求。

常见特征：

- `device identity required` → 设备认证未满足。
- `pairing required` → 发送者/设备必须获批。

如果检查后服务配置与运行时仍然不一致，请从同一 profile/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关内容：

- [/gateway/pairing](/zh-CN/gateway/pairing)
- [/gateway/authentication](/zh-CN/gateway/authentication)
- [/gateway/background-process](/zh-CN/gateway/background-process)
