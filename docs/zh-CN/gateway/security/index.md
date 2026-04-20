---
read_when:
    - 添加会扩大访问范围或自动化程度的功能
summary: 运行具有 shell 访问权限的 AI Gateway 网关时的安全注意事项和威胁模型
title: 安全性
x-i18n:
    generated_at: "2026-04-20T18:29:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa10d97773a78c43d238aed495e00d83a3e28a50939cbe8941add05874846a86
    source_path: gateway/security/index.md
    workflow: 15
---

# 安全性

<Warning>
**个人助手信任模型：** 本指南假设每个 Gateway 网关只有一个受信任的操作员边界（单用户 / 个人助手模型）。
OpenClaw **并不** 适合作为多个对抗性用户共享同一个智能体 / Gateway 网关时的恶意多租户安全边界。
如果你需要混合信任或对抗性用户场景，请拆分信任边界（独立的 Gateway 网关 + 凭证，最好再配合独立的 OS 用户 / 主机）。
</Warning>

**本页内容：** [信任模型](#scope-first-personal-assistant-security-model) | [快速审计](#quick-check-openclaw-security-audit) | [加固基线](#hardened-baseline-in-60-seconds) | [私信访问模型](#dm-access-model-pairing-allowlist-open-disabled) | [配置加固](#configuration-hardening-examples) | [事件响应](#incident-response)

## 先明确范围：个人助手安全模型

OpenClaw 的安全指南假设你部署的是一个**个人助手**：一个受信任的操作员边界，可能包含多个智能体。

- 支持的安全姿态：每个 Gateway 网关对应一个用户 / 信任边界（最好每个边界对应一个 OS 用户 / 主机 / VPS）。
- 不支持作为安全边界的场景：多个彼此不受信任或具有对抗性的用户共享同一个 Gateway 网关 / 智能体。
- 如果需要对抗性用户隔离，请按信任边界拆分（独立的 Gateway 网关 + 凭证，最好再配合独立的 OS 用户 / 主机）。
- 如果多个不受信任的用户都可以向同一个启用工具的智能体发消息，请视为他们共享该智能体的同一组委托工具权限。

本页说明的是**在这一模型内**如何进行加固。它并不声称单个共享 Gateway 网关可以提供恶意多租户隔离。

## 快速检查：`openclaw security audit`

另请参阅：[Formal Verification（安全模型）](/zh-CN/security/formal-verification)

请定期运行它（尤其是在修改配置或暴露网络入口之后）：

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` 故意保持较窄范围：它会将常见的开放群组策略切换为 allowlist、恢复 `logging.redactSensitive: "tools"`、收紧状态 / 配置 / include 文件权限，并且在 Windows 上运行时使用 Windows ACL 重置，而不是 POSIX `chmod`。

它会标记常见的易错配置（Gateway 网关认证暴露、浏览器控制暴露、高权限 allowlist、文件系统权限、宽松的 exec 审批，以及开放渠道的工具暴露）。

OpenClaw 既是一个产品，也是一个实验：你正在把前沿模型行为接入真实的消息入口和真实工具。**不存在“绝对安全”的配置。** 目标是有意识地明确：

- 谁可以和你的机器人对话
- 机器人被允许在哪些地方执行操作
- 机器人可以接触什么内容

先从仍能满足需求的最小权限开始，随着你建立信心再逐步放宽。

### 部署与主机信任

OpenClaw 假设主机和配置边界是受信任的：

- 如果某人可以修改 Gateway 网关主机状态 / 配置（`~/.openclaw`，包括 `openclaw.json`），就应将其视为受信任的操作员。
- 用一个 Gateway 网关服务多个彼此不受信任 / 具有对抗性的操作员，**不是推荐的部署方式**。
- 对于混合信任团队，请使用独立的 Gateway 网关 拆分信任边界（或至少使用独立的 OS 用户 / 主机）。
- 推荐默认方式：每台机器 / 主机（或 VPS）对应一个用户，该用户运行一个 Gateway 网关，并在该 Gateway 网关中配置一个或多个智能体。
- 在一个 Gateway 网关实例内部，已认证的操作员访问属于受信任的控制平面角色，而不是按用户划分的租户角色。
- 会话标识符（`sessionKey`、会话 ID、标签）是路由选择器，不是授权令牌。
- 如果多个人都可以向同一个启用工具的智能体发消息，那么每个人都可以驱动这一组相同权限。按用户隔离的会话 / Memory 虽有助于隐私，但并不能把一个共享智能体变成按用户划分的主机授权边界。

### 共享 Slack 工作区：真实风险

如果“Slack 里的每个人都可以给机器人发消息”，核心风险是委托工具权限：

- 任何被允许的发送者都可以在智能体策略范围内诱导工具调用（`exec`、浏览器、网络 / 文件工具）；
- 某个发送者的提示词 / 内容注入可能导致影响共享状态、设备或输出的操作；
- 如果一个共享智能体拥有敏感凭证 / 文件，那么任何被允许的发送者都可能通过工具使用驱动数据外传。

对团队工作流，请使用具备最少工具权限的独立智能体 / Gateway 网关；涉及个人数据的智能体请保持私有。

### 公司共享智能体：可接受模式

当使用该智能体的所有人都处于同一信任边界内（例如同一个公司团队），并且该智能体严格限定在业务范围内时，这种做法是可接受的。

- 在专用机器 / VM / 容器上运行；
- 为该运行环境使用专用的 OS 用户 + 专用浏览器 / 配置文件 / 账号；
- 不要让该运行环境登录你的个人 Apple / Google 账号，也不要登录个人密码管理器 / 浏览器配置文件。

如果你在同一运行环境中混用个人身份和公司身份，就会破坏这种隔离，并增加个人数据暴露风险。

## Gateway 网关与节点的信任概念

请将 Gateway 网关和节点视为同一个操作员信任域中的不同角色：

- **Gateway 网关** 是控制平面和策略入口（`gateway.auth`、工具策略、路由）。
- **节点** 是与该 Gateway 网关配对的远程执行入口（命令、设备操作、主机本地能力）。
- 已通过 Gateway 网关认证的调用方，在 Gateway 网关范围内属于受信任实体。配对完成后，节点操作就属于该节点上的受信任操作员操作。
- `sessionKey` 是路由 / 上下文选择，不是按用户划分的认证。
- Exec 审批（allowlist + 询问）是针对操作员意图的护栏，不是恶意多租户隔离。
- 在受信任的单操作员场景中，OpenClaw 的产品默认行为是允许在 `gateway` / `node` 上执行主机 exec，而不弹出审批提示（`security="full"`、`ask="off"`，除非你主动收紧）。这是有意设计的 UX 默认值，本身并不构成漏洞。
- Exec 审批会绑定精确的请求上下文以及尽力识别的直接本地文件操作数；它并不会对每一种运行时 / 解释器加载路径做语义建模。若需要强边界，请使用沙箱隔离和主机隔离。

如果你需要对抗性用户隔离，请按 OS 用户 / 主机拆分信任边界，并运行独立的 Gateway 网关。

## 信任边界矩阵

在评估风险时，可以把它作为快速模型：

| 边界或控制项 | 含义 | 常见误解 |
| --- | --- | --- |
| `gateway.auth`（token / password / trusted-proxy / device auth） | 对 Gateway 网关 API 的调用方进行认证 | “要安全，就必须对每条消息帧都做签名” |
| `sessionKey` | 用于上下文 / 会话选择的路由键 | “会话 key 是用户认证边界” |
| 提示词 / 内容护栏 | 降低模型被滥用的风险 | “只要有提示词注入，就等于认证绕过” |
| `canvas.eval` / 浏览器 evaluate | 启用后属于操作员的有意能力 | “任何 JS `eval` 原语在这个信任模型下都自动算漏洞” |
| 本地 TUI `!` shell | 明确由操作员触发的本地执行 | “本地 shell 便捷命令等同于远程注入” |
| 节点配对与节点命令 | 在已配对设备上的操作员级远程执行 | “远程设备控制默认应视为不受信任用户访问” |

## 设计上不视为漏洞的情况

这些模式经常被报告，但通常都会被关闭且不采取措施，除非能证明存在真实的边界绕过：

- 仅靠提示词注入构成的利用链，但没有策略 / 认证 / 沙箱隔离绕过。
- 假设在单个共享主机 / 配置上存在恶意多租户运行的声明。
- 将共享 Gateway 网关环境中的普通操作员读取路径（例如 `sessions.list` / `sessions.preview` / `chat.history`）认定为 IDOR 的报告。
- 仅限 localhost 部署的发现（例如仅 loopback Gateway 网关上的 HSTS 问题）。
- 针对本仓库中并不存在的入站路径而提出的 Discord 入站 webhook 签名问题。
- 把节点配对元数据当成 `system.run` 的隐藏二次逐命令审批层，而实际执行边界仍然是 Gateway 网关的全局节点命令策略加上节点自己的 exec 审批。
- 将 `sessionKey` 视为认证令牌并据此报告“缺少按用户授权”的问题。

## 研究人员预检清单

在提交 GHSA 之前，请先确认以下各项：

1. 复现仍然适用于最新的 `main` 或最新发布版本。
2. 报告中包含精确的代码路径（`file`、函数、行范围）以及测试所用版本 / commit。
3. 影响跨越了已记录的信任边界（而不只是提示词注入）。
4. 该问题不在 [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope) 列表中。
5. 已检查现有 advisory 是否重复（适用时请复用规范的 GHSA）。
6. 部署假设已明确写明（loopback / 本地，还是已暴露；受信任操作员，还是不受信任操作员）。

## 六十秒内建立加固基线

先使用这个基线，再按受信任智能体选择性重新启用工具：

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

这样会将 Gateway 网关限制为仅本地访问、隔离私信，并默认禁用控制平面 / 运行时工具。

## 共享收件箱快速规则

如果超过一个人可以给你的机器人发私信：

- 设置 `session.dmScope: "per-channel-peer"`（对于多账号渠道则使用 `"per-account-channel-peer"`）。
- 保持 `dmPolicy: "pairing"` 或使用严格的 allowlist。
- 绝不要把共享私信与广泛的工具访问权限组合在一起。
- 这能加固协作式 / 共享收件箱，但当用户共享主机 / 配置写权限时，它并不是为敌对共租户隔离而设计的。

## 上下文可见性模型

OpenClaw 将两个概念区分开来：

- **触发授权**：谁可以触发智能体（`dmPolicy`、`groupPolicy`、allowlist、提及门控）。
- **上下文可见性**：哪些补充上下文会被注入到模型输入中（回复正文、引用文本、线程历史、转发元数据）。

Allowlists 用于控制触发和命令授权。`contextVisibility` 设置控制的是补充上下文（引用回复、线程根消息、拉取的历史记录）如何被过滤：

- `contextVisibility: "all"`（默认）会保留接收到的全部补充上下文。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅包含通过当前 allowlist 检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为与 `allowlist` 相同，但仍会保留一条显式引用的回复。

你可以按渠道或按房间 / 会话设置 `contextVisibility`。具体配置见 [群聊](/zh-CN/channels/groups#context-visibility-and-allowlists)。

Advisory 分流指导：

- 如果报告只证明“模型可以看到来自非 allowlist 发送者的引用文本或历史文本”，那属于可通过 `contextVisibility` 处理的加固发现，本身并不构成认证或沙箱隔离边界绕过。
- 要具备安全影响，报告仍需展示一个已记录信任边界的真实绕过（认证、策略、沙箱、审批，或其他已记录边界）。

## 审计会检查什么（高层概览）

- **入站访问**（私信策略、群组策略、allowlist）：陌生人是否可以触发机器人？
- **工具影响半径**（高权限工具 + 开放房间）：提示词注入是否可能演变成 shell / 文件 / 网络操作？
- **Exec 审批漂移**（`security=full`、`autoAllowSkills`、未启用 `strictInlineEval` 的解释器 allowlist）：主机 exec 护栏是否仍按你的预期工作？
  - `security="full"` 是一种宽泛姿态警告，不代表存在 bug。它是受信任个人助手场景下有意选择的默认值；只有当你的威胁模型需要审批或 allowlist 护栏时，才应收紧它。
- **网络暴露**（Gateway 网关 bind / auth、Tailscale Serve / Funnel、弱 / 短认证 token）。
- **浏览器控制暴露**（远程节点、中继端口、远程 CDP 端点）。
- **本地磁盘卫生**（权限、符号链接、配置 includes、“同步文件夹”路径）。
- **插件**（存在扩展但没有显式 allowlist）。
- **策略漂移 / 配置错误**（已配置 sandbox docker 设置但沙箱模式关闭；无效的 `gateway.nodes.denyCommands` 模式，因为匹配仅针对精确命令名进行，例如 `system.run`，不会检查 shell 文本；危险的 `gateway.nodes.allowCommands` 条目；全局 `tools.profile="minimal"` 被按智能体配置覆盖；在宽松工具策略下可访问扩展插件工具）。
- **运行时预期漂移**（例如误以为隐式 exec 仍表示 `sandbox`，而 `tools.exec.host` 现在默认是 `auto`；或者在沙箱模式关闭时显式设置 `tools.exec.host="sandbox"`）。
- **模型卫生**（当配置的模型看起来较旧时发出警告；不是硬性阻止）。

如果你运行 `--deep`，OpenClaw 还会尽力尝试进行实时 Gateway 网关探测。

## 凭证存储映射

在审计访问权限或决定备份内容时可参考此表：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 机器人 token**：配置 / 环境变量，或 `channels.telegram.tokenFile`（仅允许常规文件；拒绝符号链接）
- **Discord 机器人 token**：配置 / 环境变量，或 SecretRef（env / file / exec 提供商）
- **Slack tokens**：配置 / 环境变量（`channels.slack.*`）
- **配对 allowlist**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账号）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账号）
- **模型认证配置文件**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **基于文件的 secrets 负载（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`

## 安全审计检查清单

当审计输出发现项时，请按以下优先级处理：

1. **任何“开放” + 已启用工具**：先锁定私信 / 群组（配对 / allowlist），然后收紧工具策略 / 沙箱隔离。
2. **公共网络暴露**（LAN bind、Funnel、缺少认证）：立即修复。
3. **浏览器控制的远程暴露**：将其视为操作员访问权限（仅 tailnet、谨慎配对节点、避免公开暴露）。
4. **权限**：确保状态 / 配置 / 凭证 / 认证内容不对组用户或所有人可读。
5. **插件 / 扩展**：只加载你明确信任的内容。
6. **模型选择**：对于任何启用了工具的机器人，优先选择现代、具备更强指令加固能力的模型。

## 安全审计术语表

在真实部署中你最有可能看到的高信号 `checkId` 值如下（并非完整列表）：

| `checkId` | 严重程度 | 原因 | 主要修复键 / 路径 | 自动修复 |
| --- | --- | --- | --- | --- |
| `fs.state_dir.perms_world_writable` | critical | 其他用户 / 进程可以修改完整的 OpenClaw 状态 | `~/.openclaw` 的文件系统权限 | 是 |
| `fs.state_dir.perms_group_writable` | warn | 同组用户可以修改完整的 OpenClaw 状态 | `~/.openclaw` 的文件系统权限 | 是 |
| `fs.state_dir.perms_readable` | warn | 状态目录可被其他人读取 | `~/.openclaw` 的文件系统权限 | 是 |
| `fs.state_dir.symlink` | warn | 状态目录目标变成另一个信任边界 | 状态目录的文件系统布局 | 否 |
| `fs.config.perms_writable` | critical | 其他人可以更改认证 / 工具策略 / 配置 | `~/.openclaw/openclaw.json` 的文件系统权限 | 是 |
| `fs.config.symlink` | warn | 配置文件目标变成另一个信任边界 | 配置文件的文件系统布局 | 否 |
| `fs.config.perms_group_readable` | warn | 同组用户可以读取配置 token / 设置 | 配置文件的文件系统权限 | 是 |
| `fs.config.perms_world_readable` | critical | 配置可能暴露 token / 设置 | 配置文件的文件系统权限 | 是 |
| `fs.config_include.perms_writable` | critical | 配置 include 文件可被其他人修改 | `openclaw.json` 引用的 include 文件权限 | 是 |
| `fs.config_include.perms_group_readable` | warn | 同组用户可以读取被 include 的 secrets / 设置 | `openclaw.json` 引用的 include 文件权限 | 是 |
| `fs.config_include.perms_world_readable` | critical | 被 include 的 secrets / 设置对所有人可读 | `openclaw.json` 引用的 include 文件权限 | 是 |
| `fs.auth_profiles.perms_writable` | critical | 其他人可以注入或替换已存储的模型凭证 | `agents/<agentId>/agent/auth-profiles.json` 的权限 | 是 |
| `fs.auth_profiles.perms_readable` | warn | 其他人可以读取 API keys 和 OAuth tokens | `agents/<agentId>/agent/auth-profiles.json` 的权限 | 是 |
| `fs.credentials_dir.perms_writable` | critical | 其他人可以修改渠道配对 / 凭证状态 | `~/.openclaw/credentials` 的文件系统权限 | 是 |
| `fs.credentials_dir.perms_readable` | warn | 其他人可以读取渠道凭证状态 | `~/.openclaw/credentials` 的文件系统权限 | 是 |
| `fs.sessions_store.perms_readable` | warn | 其他人可以读取会话转录 / 元数据 | 会话存储权限 | 是 |
| `fs.log_file.perms_readable` | warn | 其他人可以读取已脱敏但仍然敏感的日志 | Gateway 网关日志文件权限 | 是 |
| `fs.synced_dir` | warn | iCloud / Dropbox / Drive 中的状态 / 配置会扩大 token / 转录暴露面 | 将配置 / 状态移出同步文件夹 | 否 |
| `gateway.bind_no_auth` | critical | 在没有共享密钥的情况下进行远程 bind | `gateway.bind`、`gateway.auth.*` | 否 |
| `gateway.loopback_no_auth` | critical | 经由反向代理的 loopback 可能变成未认证访问 | `gateway.auth.*`、代理设置 | 否 |
| `gateway.trusted_proxies_missing` | warn | 存在反向代理头，但未将代理标记为受信任 | `gateway.trustedProxies` | 否 |
| `gateway.http.no_auth` | warn/critical | `auth.mode="none"` 时 Gateway 网关 HTTP API 可被访问 | `gateway.auth.mode`、`gateway.http.endpoints.*` | 否 |
| `gateway.http.session_key_override_enabled` | info | HTTP API 调用方可以覆盖 `sessionKey` | `gateway.http.allowSessionKeyOverride` | 否 |
| `gateway.tools_invoke_http.dangerous_allow` | warn/critical | 通过 HTTP API 重新启用了危险工具 | `gateway.tools.allow` | 否 |
| `gateway.nodes.allow_commands_dangerous` | warn/critical | 启用了高影响节点命令（相机 / 屏幕 / 联系人 / 日历 / SMS） | `gateway.nodes.allowCommands` | 否 |
| `gateway.nodes.deny_commands_ineffective` | warn | 类似模式的 deny 条目不会匹配 shell 文本或命令组 | `gateway.nodes.denyCommands` | 否 |
| `gateway.tailscale_funnel` | critical | 公开暴露到互联网 | `gateway.tailscale.mode` | 否 |
| `gateway.tailscale_serve` | info | 已通过 Serve 启用 tailnet 暴露 | `gateway.tailscale.mode` | 否 |
| `gateway.control_ui.allowed_origins_required` | critical | 非 loopback 的控制 UI 未显式设置浏览器 origin allowlist | `gateway.controlUi.allowedOrigins` | 否 |
| `gateway.control_ui.allowed_origins_wildcard` | warn/critical | `allowedOrigins=["*"]` 会禁用浏览器 origin allowlist | `gateway.controlUi.allowedOrigins` | 否 |
| `gateway.control_ui.host_header_origin_fallback` | warn/critical | 启用了 Host 头 origin 回退（降低 DNS rebinding 加固强度） | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | 否 |
| `gateway.control_ui.insecure_auth` | warn | 已启用不安全认证兼容开关 | `gateway.controlUi.allowInsecureAuth` | 否 |
| `gateway.control_ui.device_auth_disabled` | critical | 禁用了设备身份检查 | `gateway.controlUi.dangerouslyDisableDeviceAuth` | 否 |
| `gateway.real_ip_fallback_enabled` | warn/critical | 信任 `X-Real-IP` 回退可能因代理配置错误导致源 IP 伪造 | `gateway.allowRealIpFallback`、`gateway.trustedProxies` | 否 |
| `gateway.token_too_short` | warn | 共享 token 太短，更容易被暴力破解 | `gateway.auth.token` | 否 |
| `gateway.auth_no_rate_limit` | warn | 暴露的认证接口若无速率限制，会增加暴力破解风险 | `gateway.auth.rateLimit` | 否 |
| `gateway.trusted_proxy_auth` | critical | 代理身份现在成为认证边界 | `gateway.auth.mode="trusted-proxy"` | 否 |
| `gateway.trusted_proxy_no_proxies` | critical | trusted-proxy 认证若没有受信任代理 IP，则不安全 | `gateway.trustedProxies` | 否 |
| `gateway.trusted_proxy_no_user_header` | critical | trusted-proxy 认证无法安全解析用户身份 | `gateway.auth.trustedProxy.userHeader` | 否 |
| `gateway.trusted_proxy_no_allowlist` | warn | trusted-proxy 认证会接受任意已通过上游认证的用户 | `gateway.auth.trustedProxy.allowUsers` | 否 |
| `checkId` | 严重程度 | 原因 | 主要修复键 / 路径 | 自动修复 |
| --- | --- | --- | --- | --- |
| `gateway.probe_auth_secretref_unavailable` | warn | 深度探测无法在此命令路径中解析认证 SecretRef | 深度探测认证来源 / SecretRef 可用性 | 否 |
| `gateway.probe_failed` | warn/critical | 实时 Gateway 网关探测失败 | Gateway 网关可达性 / 认证 | 否 |
| `discovery.mdns_full_mode` | warn/critical | mDNS 完整模式会在本地网络广播 `cliPath` / `sshPort` 元数据 | `discovery.mdns.mode`、`gateway.bind` | 否 |
| `config.insecure_or_dangerous_flags` | warn | 已启用任意不安全 / 危险的调试标志 | 多个键（见发现详情） | 否 |
| `config.secrets.gateway_password_in_config` | warn | Gateway 网关密码直接存储在配置中 | `gateway.auth.password` | 否 |
| `config.secrets.hooks_token_in_config` | warn | Hook bearer token 直接存储在配置中 | `hooks.token` | 否 |
| `hooks.token_reuse_gateway_token` | critical | Hook 入站 token 同时也可用于 Gateway 网关认证 | `hooks.token`、`gateway.auth.token` | 否 |
| `hooks.token_too_short` | warn | Hook 入站更容易被暴力破解 | `hooks.token` | 否 |
| `hooks.default_session_key_unset` | warn | Hook 智能体运行会扇出到按请求生成的会话中 | `hooks.defaultSessionKey` | 否 |
| `hooks.allowed_agent_ids_unrestricted` | warn/critical | 已认证的 Hook 调用方可以路由到任意已配置智能体 | `hooks.allowedAgentIds` | 否 |
| `hooks.request_session_key_enabled` | warn/critical | 外部调用方可以选择 `sessionKey` | `hooks.allowRequestSessionKey` | 否 |
| `hooks.request_session_key_prefixes_missing` | warn/critical | 外部会话 key 形式没有边界限制 | `hooks.allowedSessionKeyPrefixes` | 否 |
| `hooks.path_root` | critical | Hook 路径是 `/`，更容易发生入站冲突或误路由 | `hooks.path` | 否 |
| `hooks.installs_unpinned_npm_specs` | warn | Hook 安装记录未固定到不可变的 npm 规格 | Hook 安装元数据 | 否 |
| `hooks.installs_missing_integrity` | warn | Hook 安装记录缺少完整性元数据 | Hook 安装元数据 | 否 |
| `hooks.installs_version_drift` | warn | Hook 安装记录与已安装包版本漂移 | Hook 安装元数据 | 否 |
| `logging.redact_off` | warn | 敏感值会泄露到日志 / 状态中 | `logging.redactSensitive` | 是 |
| `browser.control_invalid_config` | warn | 浏览器控制配置在运行前即无效 | `browser.*` | 否 |
| `browser.control_no_auth` | critical | 浏览器控制在没有 token / password 认证时暴露 | `gateway.auth.*` | 否 |
| `browser.remote_cdp_http` | warn | 通过纯 HTTP 访问远程 CDP，缺少传输加密 | 浏览器配置文件中的 `cdpUrl` | 否 |
| `browser.remote_cdp_private_host` | warn | 远程 CDP 指向私有 / 内部主机 | 浏览器配置文件中的 `cdpUrl`、`browser.ssrfPolicy.*` | 否 |
| `sandbox.docker_config_mode_off` | warn | 已存在沙箱 Docker 配置，但当前未启用 | `agents.*.sandbox.mode` | 否 |
| `sandbox.bind_mount_non_absolute` | warn | 相对 bind mount 可能解析为不可预测路径 | `agents.*.sandbox.docker.binds[]` | 否 |
| `sandbox.dangerous_bind_mount` | critical | 沙箱 bind mount 指向被阻止的系统、凭证或 Docker socket 路径 | `agents.*.sandbox.docker.binds[]` | 否 |
| `sandbox.dangerous_network_mode` | critical | 沙箱 Docker 网络使用 `host` 或 `container:*` 这类命名空间共享模式 | `agents.*.sandbox.docker.network` | 否 |
| `sandbox.dangerous_seccomp_profile` | critical | 沙箱 seccomp 配置削弱了容器隔离 | `agents.*.sandbox.docker.securityOpt` | 否 |
| `sandbox.dangerous_apparmor_profile` | critical | 沙箱 AppArmor 配置削弱了容器隔离 | `agents.*.sandbox.docker.securityOpt` | 否 |
| `sandbox.browser_cdp_bridge_unrestricted` | warn | 沙箱浏览器桥未限制来源地址范围就对外暴露 | `sandbox.browser.cdpSourceRange` | 否 |
| `sandbox.browser_container.non_loopback_publish` | critical | 现有浏览器容器在非 loopback 接口上发布了 CDP | 浏览器沙箱容器发布配置 | 否 |
| `sandbox.browser_container.hash_label_missing` | warn | 现有浏览器容器早于当前配置哈希标签机制创建 | `openclaw sandbox recreate --browser --all` | 否 |
| `sandbox.browser_container.hash_epoch_stale` | warn | 现有浏览器容器早于当前浏览器配置 epoch 创建 | `openclaw sandbox recreate --browser --all` | 否 |
| `tools.exec.host_sandbox_no_sandbox_defaults` | warn | 当沙箱关闭时，`exec host=sandbox` 会以关闭方式失败 | `tools.exec.host`、`agents.defaults.sandbox.mode` | 否 |
| `tools.exec.host_sandbox_no_sandbox_agents` | warn | 当沙箱关闭时，按智能体设置的 `exec host=sandbox` 会以关闭方式失败 | `agents.list[].tools.exec.host`、`agents.list[].sandbox.mode` | 否 |
| `tools.exec.security_full_configured` | warn/critical | 主机 exec 正在以 `security="full"` 运行 | `tools.exec.security`、`agents.list[].tools.exec.security` | 否 |
| `tools.exec.auto_allow_skills_enabled` | warn | Exec 审批会隐式信任 skill bins | `~/.openclaw/exec-approvals.json` | 否 |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn | 解释器 allowlist 允许内联求值，但不会强制重新审批 | `tools.exec.strictInlineEval`、`agents.list[].tools.exec.strictInlineEval`、exec 审批 allowlist | 否 |
| `tools.exec.safe_bins_interpreter_unprofiled` | warn | `safeBins` 中的解释器 / 运行时 bin 没有显式 profile，会扩大 exec 风险 | `tools.exec.safeBins`、`tools.exec.safeBinProfiles`、`agents.list[].tools.exec.*` | 否 |
| `tools.exec.safe_bins_broad_behavior` | warn | `safeBins` 中的宽行为工具削弱了低风险 stdin 过滤信任模型 | `tools.exec.safeBins`、`agents.list[].tools.exec.safeBins` | 否 |
| `tools.exec.safe_bin_trusted_dirs_risky` | warn | `safeBinTrustedDirs` 包含可变或高风险目录 | `tools.exec.safeBinTrustedDirs`、`agents.list[].tools.exec.safeBinTrustedDirs` | 否 |
| `skills.workspace.symlink_escape` | warn | 工作区中的 `skills/**/SKILL.md` 解析到了工作区根目录之外（符号链接链漂移） | 工作区 `skills/**` 文件系统状态 | 否 |
| `plugins.extensions_no_allowlist` | warn | 已安装扩展但没有显式 plugin allowlist | `plugins.allowlist` | 否 |
| `plugins.installs_unpinned_npm_specs` | warn | Plugin 安装记录未固定到不可变的 npm 规格 | plugin 安装元数据 | 否 |
| `checkId` | 严重程度 | 原因 | 主要修复键 / 路径 | 自动修复 |
| --- | --- | --- | --- | --- |
| `plugins.installs_missing_integrity` | warn | Plugin 安装记录缺少完整性元数据 | plugin 安装元数据 | 否 |
| `plugins.installs_version_drift` | warn | Plugin 安装记录与已安装包版本漂移 | plugin 安装元数据 | 否 |
| `plugins.code_safety` | warn/critical | Plugin 代码扫描发现可疑或危险模式 | plugin 代码 / 安装来源 | 否 |
| `plugins.code_safety.entry_path` | warn | Plugin 入口路径指向隐藏位置或 `node_modules` 位置 | plugin manifest `entry` | 否 |
| `plugins.code_safety.entry_escape` | critical | Plugin 入口路径逃逸出了 plugin 目录 | plugin manifest `entry` | 否 |
| `plugins.code_safety.scan_failed` | warn | Plugin 代码扫描无法完成 | plugin 扩展路径 / 扫描环境 | 否 |
| `skills.code_safety` | warn/critical | Skill 安装器元数据 / 代码包含可疑或危险模式 | skill 安装来源 | 否 |
| `skills.code_safety.scan_failed` | warn | Skill 代码扫描无法完成 | skill 扫描环境 | 否 |
| `security.exposure.open_channels_with_exec` | warn/critical | 共享 / 公开房间可以访问启用了 exec 的智能体 | `channels.*.dmPolicy`、`channels.*.groupPolicy`、`tools.exec.*`、`agents.list[].tools.exec.*` | 否 |
| `security.exposure.open_groups_with_elevated` | critical | 开放群组 + 高权限工具会形成高影响提示词注入路径 | `channels.*.groupPolicy`、`tools.elevated.*` | 否 |
| `security.exposure.open_groups_with_runtime_or_fs` | critical/warn | 开放群组可以访问命令 / 文件工具，且没有沙箱隔离 / 工作区护栏 | `channels.*.groupPolicy`、`tools.profile/deny`、`tools.fs.workspaceOnly`、`agents.*.sandbox.mode` | 否 |
| `security.trust_model.multi_user_heuristic` | warn | 配置看起来像多用户使用，但 Gateway 网关信任模型是个人助手 | 拆分信任边界，或进行共享用户加固（`sandbox.mode`、工具 deny / 工作区范围限制） | 否 |
| `tools.profile_minimal_overridden` | warn | 智能体覆盖了全局 minimal profile | `agents.list[].tools.profile` | 否 |
| `plugins.tools_reachable_permissive_policy` | warn | 在宽松策略上下文中可访问扩展工具 | `tools.profile` + 工具 allow / deny | 否 |
| `models.legacy` | warn | 仍配置了旧版模型家族 | 模型选择 | 否 |
| `models.weak_tier` | warn | 已配置模型低于当前推荐等级 | 模型选择 | 否 |
| `models.small_params` | critical/info | 小参数模型 + 不安全工具入口会提高注入风险 | 模型选择 + 沙箱隔离 / 工具策略 | 否 |
| `summary.attack_surface` | info | 对认证、渠道、工具和暴露姿态的汇总摘要 | 多个键（见发现详情） | 否 |

## 通过 HTTP 使用控制 UI

控制 UI 需要一个**安全上下文**（HTTPS 或 localhost）来生成设备身份。`gateway.controlUi.allowInsecureAuth` 是一个本地兼容性开关：

- 在 localhost 上，如果页面通过非安全的 HTTP 加载，它允许控制 UI 在没有设备身份的情况下进行认证。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

优先使用 HTTPS（Tailscale Serve），或在 `127.0.0.1` 上打开 UI。

仅在紧急破窗场景下，`gateway.controlUi.dangerouslyDisableDeviceAuth` 才会完全禁用设备身份检查。这会严重降低安全性；除非你正在主动调试并且能够快速恢复，否则请保持关闭。

与这些危险开关不同，成功配置 `gateway.auth.mode: "trusted-proxy"` 后，可以允许**操作员**控制 UI 会话在没有设备身份的情况下通过认证。这是该认证模式的有意行为，不是 `allowInsecureAuth` 的捷径，而且它仍然不适用于节点角色的控制 UI 会话。

当此设置启用时，`openclaw security audit` 会发出警告。

## 不安全或危险标志摘要

当已启用已知不安全 / 危险的调试开关时，`openclaw security audit` 会包含 `config.insecure_or_dangerous_flags`。该检查当前聚合以下项：

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

在 OpenClaw 配置 schema 中定义的完整 `dangerous*` / `dangerously*` 配置键包括：

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.synology-chat.dangerouslyAllowNameMatching`（扩展渠道）
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching`（扩展渠道）
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（扩展渠道）
- `channels.zalouser.dangerouslyAllowNameMatching`（扩展渠道）
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching`（扩展渠道）
- `channels.irc.dangerouslyAllowNameMatching`（扩展渠道）
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching`（扩展渠道）
- `channels.mattermost.dangerouslyAllowNameMatching`（扩展渠道）
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching`（扩展渠道）
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## 反向代理配置

如果你在反向代理（nginx、Caddy、Traefik 等）后面运行 Gateway 网关，请配置 `gateway.trustedProxies`，以正确处理转发的客户端 IP。

当 Gateway 网关检测到来自**不在** `trustedProxies` 中地址的代理头时，它**不会**将这些连接视为本地客户端。如果 Gateway 网关认证被禁用，这些连接将被拒绝。这可以防止认证绕过：否则，经代理转发的连接可能会看起来像来自 localhost，从而自动获得信任。

`gateway.trustedProxies` 也会用于 `gateway.auth.mode: "trusted-proxy"`，但这种认证模式更严格：

- trusted-proxy 认证**会对来自 loopback 源代理的情况进行默认拒绝**
- 同主机的 loopback 反向代理仍然可以使用 `gateway.trustedProxies` 来进行本地客户端识别和转发 IP 处理
- 对于同主机的 loopback 反向代理，请使用 token / password 认证，而不要使用 `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # 反向代理 IP
  # 可选。默认 false。
  # 只有当你的代理无法提供 X-Forwarded-For 时才启用。
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

当配置了 `trustedProxies` 时，Gateway 网关会使用 `X-Forwarded-For` 来确定客户端 IP。默认会忽略 `X-Real-IP`，除非你显式设置 `gateway.allowRealIpFallback: true`。

良好的反向代理行为（覆盖传入的转发头）：

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

不良的反向代理行为（追加 / 保留不受信任的转发头）：

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS 和 origin 注意事项

- OpenClaw Gateway 网关优先面向本地 / loopback。如果你在反向代理处终止 TLS，请在那里为面向代理的 HTTPS 域设置 HSTS。
- 如果由 Gateway 网关本身终止 HTTPS，你可以设置 `gateway.http.securityHeaders.strictTransportSecurity`，让 OpenClaw 在响应中发送 HSTS 头。
- 详细部署指南见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)。
- 对于非 loopback 的控制 UI 部署，默认要求配置 `gateway.controlUi.allowedOrigins`。
- `gateway.controlUi.allowedOrigins: ["*"]` 是一个显式的允许所有浏览器 origin 的策略，不是加固后的默认值。除严格受控的本地测试外，请避免使用。
- 即使启用了通用 loopback 豁免，loopback 上的浏览器 origin 认证失败仍然会受到速率限制，但锁定 key 会按归一化后的 `Origin` 值分别计算，而不是共用一个 localhost 桶。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 头 origin 回退模式；应将其视为由操作员主动选择的危险策略。
- 请将 DNS rebinding 和代理 Host 头行为视为部署加固问题；保持 `trustedProxies` 范围严格，并避免将 Gateway 网关直接暴露到公共互联网。

## 本地会话日志存储在磁盘上

OpenClaw 会将会话转录存储在磁盘上的 `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
这对于会话连续性以及（可选的）会话 Memory 索引是必需的，但这也意味着
**任何拥有文件系统访问权限的进程 / 用户都可以读取这些日志**。请将磁盘访问视为信任
边界，并锁紧 `~/.openclaw` 的权限（见下方审计章节）。如果你需要在智能体之间实现更强隔离，请让它们运行在不同的 OS 用户或不同主机下。

## 节点执行（`system.run`）

如果已配对一个 macOS 节点，Gateway 网关就可以在该节点上调用 `system.run`。这属于 **Mac 上的远程代码执行**：

- 需要节点配对（审批 + token）。
- Gateway 网关节点配对不是逐命令审批入口。它建立的是节点身份 / 信任以及 token 签发。
- Gateway 网关通过 `gateway.nodes.allowCommands` / `denyCommands` 应用粗粒度的全局节点命令策略。
- 在 Mac 上通过 **设置 → Exec 审批** 控制（security + ask + allowlist）。
- 按节点生效的 `system.run` 策略来自该节点自己的 exec 审批文件（`exec.approvals.node.*`），它可以比 Gateway 网关的全局命令 ID 策略更严格，也可以更宽松。
- 以 `security="full"` 和 `ask="off"` 运行的节点，符合默认的受信任操作员模型。除非你的部署明确需要更严格的审批或 allowlist 姿态，否则应将其视为预期行为。
- 审批模式会绑定精确的请求上下文，并在可能时绑定一个具体的本地脚本 / 文件操作数。如果 OpenClaw 无法为某个解释器 / 运行时命令精确识别出唯一的直接本地文件，那么基于审批的执行会被拒绝，而不是虚假承诺完整的语义覆盖。
- 对于 `host=node`，基于审批的运行还会存储一个规范化的预处理 `systemRunPlan`；之后已获批准的转发会复用这个已存储计划，而 Gateway 网关验证会拒绝调用方在审批请求创建之后再修改命令 / cwd / 会话上下文。
- 如果你不希望允许远程执行，请将 security 设为 **deny**，并取消该 Mac 的节点配对。

这一区分对于分流非常重要：

- 一个已重新连接的配对节点即使声明了不同的命令列表，本身也**不**构成漏洞，只要 Gateway 网关的全局策略和节点本地 exec 审批仍然实际执行了边界控制。
- 把节点配对元数据当作第二层隐藏的逐命令审批机制的报告，通常属于策略 / UX 理解混淆，而不是安全边界绕过。

## 动态 Skills（watcher / 远程节点）

OpenClaw 可以在会话中途刷新 Skills 列表：

- **Skills watcher**：对 `SKILL.md` 的更改可以在智能体下一轮时更新 Skills 快照。
- **远程节点**：连接一个 macOS 节点后，可能使仅限 macOS 的 Skills 变为可用（基于 bin 探测）。

请将 skill 文件夹视为**受信任代码**，并限制谁可以修改它们。

## 威胁模型

你的 AI 助手可以：

- 执行任意 shell 命令
- 读写文件
- 访问网络服务
- 向任何人发送消息（如果你给了它 WhatsApp 访问权限）

给你发消息的人可以：

- 试图诱骗你的 AI 做坏事
- 通过社会工程获取你的数据访问权限
- 探测你的基础设施细节

## 核心概念：先做访问控制，再谈智能

这里的大多数失败并不是什么花哨漏洞——而是“某人给机器人发了消息，而机器人照做了”。

OpenClaw 的立场是：

- **身份优先：** 先决定谁可以和机器人对话（私信配对 / allowlist / 显式 “open”）。
- **范围其次：** 再决定机器人被允许在哪些地方执行操作（群组 allowlist + 提及门控、工具、沙箱隔离、设备权限）。
- **模型最后：** 默认模型可能会被操控；设计时要确保即使被操控，影响半径也有限。

## 命令授权模型

Slash commands 和 directives 仅对**已授权发送者**生效。授权来源于
渠道 allowlist / 配对，以及 `commands.useAccessGroups`（参见 [配置](/zh-CN/gateway/configuration)
和 [Slash commands](/zh-CN/tools/slash-commands)）。如果某个渠道 allowlist 为空或包含 `"*"`,
那么该渠道上的命令实际上就是开放的。

`/exec` 是面向已授权操作员的仅会话便捷功能。它**不会**写入配置，也**不会**
更改其他会话。

## 控制平面工具风险

两个内置工具可以进行持久性的控制平面更改：

- `gateway` 可以通过 `config.schema.lookup` / `config.get` 检查配置，也可以通过 `config.apply`、`config.patch` 和 `update.run` 进行持久更改。
- `cron` 可以创建计划任务，使其在原始聊天 / 任务结束后继续运行。

仅限 owner 的 `gateway` 运行时工具仍然拒绝重写
`tools.exec.ask` 或 `tools.exec.security`；旧版 `tools.bash.*` 别名会
在写入前被规范化到相同的受保护 exec 路径。

对于任何会处理不受信任内容的智能体 / 入口，默认都应禁用这些工具：

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` 只会阻止重启动作。它不会禁用 `gateway` 配置 / 更新操作。

## Plugins / 扩展

Plugins 会**在 Gateway 网关进程内**运行。请将它们视为受信任代码：

- 只从你信任的来源安装 plugin。
- 优先使用显式的 `plugins.allow` allowlist。
- 启用前先审查 plugin 配置。
- 修改 plugin 后重启 Gateway 网关。
- 如果你安装或更新 plugin（`openclaw plugins install <package>`、`openclaw plugins update <id>`），请将其视为运行不受信任代码：
  - 安装路径是当前 plugin 安装根目录下对应 plugin 的目录。
  - OpenClaw 会在安装 / 更新前运行内置危险代码扫描。`critical` 发现默认会阻止安装。
  - OpenClaw 会先执行 `npm pack`，然后在该目录中运行 `npm install --omit=dev`（npm 生命周期脚本可能会在安装期间执行代码）。
  - 优先使用固定的精确版本（`@scope/pkg@1.2.3`），并在启用前检查磁盘上解包后的代码。
  - `--dangerously-force-unsafe-install` 仅用于 plugin 安装 / 更新流程中内置扫描出现误报时的紧急破窗场景。它不会绕过 plugin `before_install` hook 策略阻止，也不会绕过扫描失败。
  - 由 Gateway 网关驱动的 skill 依赖安装遵循相同的危险 / 可疑分级：内置扫描中的 `critical` 发现会默认阻止，除非调用方显式设置 `dangerouslyForceUnsafeInstall`；而可疑发现仍然只会发出警告。`openclaw skills install` 仍然是独立的 ClawHub skill 下载 / 安装流程。

详情见：[Plugins](/zh-CN/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## 私信访问模型（pairing / allowlist / open / disabled）

当前所有支持私信的渠道都支持私信策略（`dmPolicy` 或 `*.dm.policy`），用于在处理消息**之前**拦截入站私信：

- `pairing`（默认）：未知发送者会收到一个短配对码，在你批准之前机器人会忽略其消息。配对码 1 小时后过期；重复发送私信不会重复发送配对码，直到创建新的请求。默认每个渠道最多保留 **3 个待处理请求**。
- `allowlist`：未知发送者会被拦截（没有配对握手）。
- `open`：允许任何人发送私信（公开）。**要求**该渠道的 allowlist 包含 `"*"`（显式选择启用）。
- `disabled`：完全忽略入站私信。

通过 CLI 批准：

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

详情及磁盘文件位置见：[Pairing](/zh-CN/channels/pairing)

## 私信会话隔离（多用户模式）

默认情况下，OpenClaw 会将**所有私信都路由到主会话**，这样你的助手就能在不同设备和渠道之间保持连续性。如果**多个人**都可以给机器人发私信（开放私信或多人 allowlist），请考虑隔离私信会话：

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

这样可以防止跨用户上下文泄露，同时保持群聊之间彼此隔离。

这是消息上下文边界，不是主机管理边界。如果用户彼此具有对抗性并共享同一个 Gateway 网关主机 / 配置，请按信任边界运行独立的 Gateway 网关。

### 安全私信模式（推荐）

请将上面的配置片段视为**安全私信模式**：

- 默认：`session.dmScope: "main"`（所有私信共享一个会话，以保持连续性）。
- 本地 CLI 新手引导默认：在未设置时写入 `session.dmScope: "per-channel-peer"`（保留已有的显式值）。
- 安全私信模式：`session.dmScope: "per-channel-peer"`（每个渠道 + 发送者组合拥有独立的私信上下文）。
- 跨渠道联系人隔离：`session.dmScope: "per-peer"`（同一类型的所有渠道中，每个发送者共享一个会话）。

如果你在同一渠道上运行多个账号，请改用 `per-account-channel-peer`。如果同一个人会通过多个渠道联系你，请使用 `session.identityLinks` 将这些私信会话合并为一个规范身份。参见[会话管理](/zh-CN/concepts/session)和[配置](/zh-CN/gateway/configuration)。

## Allowlists（私信 + 群组）——术语说明

OpenClaw 对“谁可以触发我？”有两层独立控制：

- **私信 allowlist**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`；旧版：`channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）：谁被允许在私信中与机器人对话。
  - 当 `dmPolicy="pairing"` 时，批准结果会写入 `~/.openclaw/credentials/` 下按账号划分的配对 allowlist 存储中（默认账号使用 `<channel>-allowFrom.json`，非默认账号使用 `<channel>-<accountId>-allowFrom.json`），并与配置中的 allowlist 合并。
- **群组 allowlist**（按渠道定义）：机器人总体上会接受哪些群组 / 渠道 / guild 的消息。
  - 常见模式：
    - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`：按群组设置默认值（如 `requireMention`）；设置后它也会充当群组 allowlist（包含 `"*"` 可保持允许所有的行为）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`：限制在群组会话**内部**谁可以触发机器人（WhatsApp / Telegram / Signal / iMessage / Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`：按入口配置 allowlist + 默认提及行为。
  - 群组检查顺序如下：先检查 `groupPolicy` / 群组 allowlist，再检查提及 / 回复激活。
  - 回复机器人消息（隐式提及）**不会**绕过类似 `groupAllowFrom` 这样的发送者 allowlist。
  - **安全说明：** 请将 `dmPolicy="open"` 和 `groupPolicy="open"` 视为最后手段。应尽量少用；除非你完全信任房间中的每个人，否则应优先使用 pairing + allowlist。

详情见：[配置](/zh-CN/gateway/configuration) 和 [Groups](/zh-CN/channels/groups)

## 提示词注入（它是什么，为什么重要）

提示词注入是指攻击者构造一条消息，操控模型执行不安全行为（“忽略你的指令”、“导出你的文件系统”、“访问这个链接并运行命令”等）。

即使系统提示词很强，**提示词注入也没有被彻底解决**。系统提示词护栏只是软性指导；真正的硬约束来自工具策略、exec 审批、沙箱隔离和渠道 allowlist（而且操作员也可以按设计关闭这些）。在实践中真正有帮助的是：

- 将入站私信锁紧（pairing / allowlist）。
- 在群组中优先使用提及门控；避免在公开房间里使用“始终在线”的机器人。
- 默认将链接、附件和粘贴的指令视为敌对内容。
- 在沙箱中执行敏感工具；把 secrets 放在智能体可访问文件系统之外。
- 注意：沙箱隔离是可选启用的。如果沙箱模式关闭，隐式 `host=auto` 会解析为 Gateway 网关主机。显式 `host=sandbox` 仍会以关闭方式失败，因为没有可用的沙箱运行时。如果你希望在配置中明确表达这种行为，请设置 `host=gateway`。
- 将高风险工具（`exec`、`browser`、`web_fetch`、`web_search`）限制给受信任智能体或显式 allowlist。
- 如果你对解释器（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`）使用 allowlist，请启用 `tools.exec.strictInlineEval`，这样内联求值形式仍然需要显式审批。
- **模型选择很重要：** 较旧 / 较小 / 旧代模型面对提示词注入和工具滥用时的稳健性明显更差。对于启用工具的智能体，请使用当前可用的最强、最新一代、经过指令加固的模型。

以下红旗应视为不受信任内容：

- “读取这个文件 / URL，然后严格照它说的做。”
- “忽略你的系统提示词或安全规则。”
- “泄露你的隐藏指令或工具输出。”
- “把 `~/.openclaw` 或你的日志完整贴出来。”

## 不安全外部内容绕过标志

OpenClaw 提供了显式绕过标志，可禁用外部内容安全包装：

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron 负载字段 `allowUnsafeExternalContent`

建议：

- 在生产环境中保持未设置 / false。
- 仅在范围严格受控的调试场景下暂时启用。
- 如果启用，请隔离该智能体（沙箱隔离 + 最小工具集 + 专用会话命名空间）。

Hooks 风险说明：

- Hook 负载属于不受信任内容，即使这些内容来自你控制的系统（邮件 / 文档 / 网页内容都可能携带提示词注入）。
- 较弱模型层级会放大这一风险。对于由 Hook 驱动的自动化，请优先使用强大的现代模型层级，并保持严格的工具策略（`tools.profile: "messaging"` 或更严格），并尽可能启用沙箱隔离。

### 提示词注入并不需要公开私信

即使**只有你自己**可以给机器人发消息，只要机器人会读取任何**不受信任内容**，提示词注入仍然可能发生（网页搜索 / 抓取结果、浏览器页面、邮件、文档、附件、粘贴的日志 / 代码）。换句话说：发送者并不是唯一的威胁面；**内容本身**也可能携带对抗性指令。

当启用工具时，典型风险是泄露上下文或触发工具调用。可通过以下方式缩小影响半径：

- 使用只读或禁用工具的**阅读智能体**来总结不受信任内容，然后再把摘要交给你的主智能体。
- 对启用工具的智能体，在不需要时关闭 `web_search` / `web_fetch` / `browser`。
- 对于 OpenResponses URL 输入（`input_file` / `input_image`），应严格设置
  `gateway.http.endpoints.responses.files.urlAllowlist` 和
  `gateway.http.endpoints.responses.images.urlAllowlist`，并将 `maxUrlParts` 保持较低。
  空 allowlist 会被视为未设置；如果你想彻底禁用 URL 抓取，请使用 `files.allowUrl: false` / `images.allowUrl: false`。
- 对于 OpenResponses 文件输入，解码后的 `input_file` 文本仍会被注入为
  **不受信任的外部内容**。不要因为 Gateway 网关是在本地解码文件文本，就认为其内容可信。该注入块仍然带有明确的
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 边界标记，以及 `Source: External`
  元数据，尽管这一路径省略了较长的 `SECURITY NOTICE:` 横幅。
- 当媒体理解从附加文档中提取文本并将其附加到媒体提示词时，也会应用同样基于标记的包装。
- 对任何会接触不受信任输入的智能体启用沙箱隔离和严格工具 allowlist。
- 不要把 secrets 放进提示词中；应通过 Gateway 网关主机上的环境变量 / 配置传递它们。

### 模型强度（安全说明）

不同模型层级在提示词注入防护上的表现**并不一致**。更小 / 更便宜的模型通常更容易被诱导滥用工具和劫持指令，尤其是在对抗性提示词下。

<Warning>
对于启用工具的智能体，或会读取不受信任内容的智能体，较旧 / 较小模型带来的提示词注入风险通常过高。不要在弱模型层级上运行这些工作负载。
</Warning>

建议：

- 对于任何可以运行工具或接触文件 / 网络的机器人，**使用最新一代、最高等级的模型**。
- **不要将较旧 / 较弱 / 较小的层级** 用于启用工具的智能体或不受信任收件箱；提示词注入风险过高。
- 如果你必须使用较小模型，**就缩小影响半径**（只读工具、强沙箱隔离、最小文件系统访问、严格 allowlist）。
- 运行小模型时，**为所有会话启用沙箱隔离**，并且**禁用 web_search / web_fetch / browser**，除非输入受到严格控制。
- 对于只聊天、输入可信且没有工具的个人助手，较小模型通常是可以接受的。

<a id="reasoning-verbose-output-in-groups"></a>

## 群组中的 reasoning 与详细输出

`/reasoning`、`/verbose` 和 `/trace` 可能会暴露内部推理、工具
输出，或本不应出现在公共渠道中的 plugin 诊断信息。
在群组场景中，请将它们视为**仅调试用途**，除非你明确需要，否则保持关闭。

建议：

- 在公共房间中关闭 `/reasoning`、`/verbose` 和 `/trace`。
- 如果你要启用它们，只应在受信任私信或严格受控的房间中启用。
- 请记住：verbose 和 trace 输出可能包含工具参数、URL、plugin 诊断信息，以及模型看到的数据。

## 配置加固（示例）

### 0）文件权限

在 Gateway 网关主机上保持配置和状态私有：

- `~/.openclaw/openclaw.json`：`600`（仅用户可读写）
- `~/.openclaw`：`700`（仅用户可访问）

`openclaw doctor` 可以发出警告，并提供收紧这些权限的选项。

### 0.4）网络暴露（bind + port + firewall）

Gateway 网关在单个端口上复用 **WebSocket + HTTP**：

- 默认值：`18789`
- 配置 / 标志 / 环境变量：`gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`

这个 HTTP 入口包括控制 UI 和 canvas host：

- 控制 UI（SPA 资源）（默认基础路径 `/`）
- canvas host：`/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`（任意 HTML / JS；应将其视为不受信任内容）

如果你在普通浏览器中加载 canvas 内容，请像对待任何其他不受信任网页一样对待它：

- 不要将 canvas host 暴露给不受信任的网络 / 用户。
- 除非你完全理解其影响，否则不要让 canvas 内容与高权限 Web 入口共享同一 origin。

bind 模式决定了 Gateway 网关监听的位置：

- `gateway.bind: "loopback"`（默认）：只有本地客户端可以连接。
- 非 loopback bind（`"lan"`、`"tailnet"`、`"custom"`）会扩大攻击面。只有在启用了 Gateway 网关认证（共享 token / password，或正确配置的非 loopback trusted proxy）并配有真实防火墙时才应使用。

经验规则：

- 优先使用 Tailscale Serve，而不是 LAN bind（Serve 会让 Gateway 网关保持在 loopback 上，由 Tailscale 负责访问控制）。
- 如果你必须 bind 到 LAN，请使用防火墙将该端口限制为严格的源 IP allowlist；不要广泛地做端口转发。
- 绝不要把未认证的 Gateway 网关暴露在 `0.0.0.0` 上。

### 0.4.1）Docker 端口发布 + UFW（`DOCKER-USER`）

如果你在 VPS 上使用 Docker 运行 OpenClaw，请记住，已发布的容器端口
（`-p HOST:CONTAINER` 或 Compose 中的 `ports:`）会通过 Docker 的转发链路由，
而不仅仅是主机的 `INPUT` 规则。

为了让 Docker 流量与防火墙策略保持一致，请在
`DOCKER-USER` 中强制执行规则（该链会在 Docker 自己的 accept 规则之前被评估）。
在许多现代发行版中，`iptables` / `ip6tables` 使用的是 `iptables-nft` 前端，
但这些规则仍然会应用到底层的 nftables 后端。

最小 allowlist 示例（IPv4）：

```bash
# /etc/ufw/after.rules（作为独立的 *filter 段追加）
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 使用独立的表。如果启用了 Docker IPv6，请在 `/etc/ufw/after6.rules` 中
添加对应策略。

避免在文档示例中硬编码像 `eth0` 这样的接口名。不同 VPS 镜像中的接口名
可能不同（`ens3`、`enp*` 等），不匹配可能会意外跳过你的拒绝规则。

重新加载后的快速验证：

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

预期的外部开放端口应只包括你有意暴露的端口（对大多数
配置来说：SSH + 你的反向代理端口）。

### 0.4.2）mDNS / Bonjour 设备发现（信息泄露）

Gateway 网关会通过 mDNS（端口 5353 上的 `_openclaw-gw._tcp`）广播其存在，以便本地设备发现。在完整模式下，这会包含可能泄露操作细节的 TXT 记录：

- `cliPath`：CLI 二进制文件的完整文件系统路径（会暴露用户名和安装位置）
- `sshPort`：广播主机上的 SSH 可用性
- `displayName`、`lanHost`：主机名信息

**运维安全注意事项：** 广播基础设施细节会让本地网络中的任何人更容易进行侦察。即便是文件系统路径和 SSH 可用性这样的“看似无害”的信息，也有助于攻击者绘制你的环境。

**建议：**

1. **最小模式**（默认，推荐用于已暴露的 Gateway 网关）：在 mDNS 广播中省略敏感字段：

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **完全禁用**：如果你不需要本地设备发现：

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **完整模式**（显式启用）：在 TXT 记录中包含 `cliPath` + `sshPort`：

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **环境变量**（另一种方式）：设置 `OPENCLAW_DISABLE_BONJOUR=1`，无需修改配置即可禁用 mDNS。

在最小模式下，Gateway 网关仍会广播足够用于设备发现的信息（`role`、`gatewayPort`、`transport`），但会省略 `cliPath` 和 `sshPort`。需要 CLI 路径信息的应用可以通过已认证的 WebSocket 连接来获取。

### 0.5）锁定 Gateway 网关 WebSocket（本地认证）

默认情况下，Gateway 网关认证是**必需的**。如果没有配置有效的 Gateway 网关认证路径，
Gateway 网关会拒绝 WebSocket 连接（默认拒绝）。

新手引导默认会生成一个 token（即使是 loopback），因此
本地客户端也必须进行认证。

设置一个 token，这样**所有** WS 客户端都必须认证：

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor 可以为你生成一个：`openclaw doctor --generate-gateway-token`。

注意：`gateway.remote.token` / `.password` 是客户端凭证来源。
它们**本身不会**保护本地 WS 访问。
只有当 `gateway.auth.*` 未设置时，本地调用路径才会把 `gateway.remote.*` 用作回退。
如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password`，但无法解析，
则会默认拒绝解析结果（不会用远程回退来掩盖这一问题）。
可选：使用 `wss://` 时可通过 `gateway.remote.tlsFingerprint` 固定远程 TLS。
纯文本 `ws://` 默认仅限 loopback。对于受信任的私有网络
路径，可在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作为紧急破窗措施。

本地设备配对：

- 对于直接的本地 loopback 连接，设备配对会自动批准，以保持
  同主机客户端使用顺畅。
- OpenClaw 也有一个狭窄的后端 / 容器本地自连接路径，用于
  受信任共享密钥辅助流程。
- tailnet 和 LAN 连接，包括同主机 tailnet bind，都被视为
  远程连接，因此仍需要审批配对。

认证模式：

- `gateway.auth.mode: "token"`：共享 bearer token（大多数场景推荐）。
- `gateway.auth.mode: "password"`：密码认证（优先通过环境变量设置：`OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`：信任具备身份感知能力的反向代理来认证用户，并通过头部传递身份（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。

轮换检查清单（token / password）：

1. 生成 / 设置一个新的 secret（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_PASSWORD`）。
2. 重启 Gateway 网关（如果由 macOS app 监管 Gateway 网关，则重启该 app）。
3. 更新所有远程客户端（调用 Gateway 网关的机器上的 `gateway.remote.token` / `.password`）。
4. 验证旧凭证已无法再连接。

### 0.6）Tailscale Serve 身份头

当 `gateway.auth.allowTailscale` 为 `true`（Serve 的默认值）时，OpenClaw
会接受 Tailscale Serve 身份头（`tailscale-user-login`）用于控制
UI / WebSocket 认证。OpenClaw 会通过本地 Tailscale 守护进程
（`tailscale whois`）解析 `x-forwarded-for` 地址，并将其与头部匹配，以验证身份。此逻辑仅会对命中 loopback 且包含 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 的请求触发，这些头由 Tailscale 注入。
对于这种异步身份检查路径，同一 `{scope, ip}`
的失败尝试会在限流器记录失败之前被串行处理。因此，来自同一个 Serve 客户端的并发错误重试
可能会立即锁死第二次尝试，而不是像两个普通不匹配那样并发通过。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）
**不会**使用 Tailscale 身份头认证。它们仍然遵循 Gateway 网关
配置的 HTTP 认证模式。

重要边界说明：

- Gateway 网关 HTTP bearer 认证实际上等同于全有或全无的操作员访问权限。
- 请将能够调用 `/v1/chat/completions`、`/v1/responses` 或 `/api/channels/*` 的凭证视为该 Gateway 网关的全访问操作员 secret。
- 在 OpenAI 兼容 HTTP 入口上，共享密钥 bearer 认证会恢复完整的默认操作员作用域（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）以及智能体轮次的 owner 语义；更窄的 `x-openclaw-scopes` 值不会缩减该共享密钥路径。
- HTTP 上的按请求作用域语义，仅适用于来自带身份模式的请求，例如 trusted proxy auth，或私有入口上的 `gateway.auth.mode="none"`。
- 在这些带身份模式下，如果省略 `x-openclaw-scopes`，会回退到普通操作员默认作用域集合；如果你希望使用更窄的作用域集合，请显式发送该头。
- `/tools/invoke` 遵循同样的共享密钥规则：token / password bearer 认证在这里同样被视为完整操作员访问，而带身份模式仍会遵守声明的作用域。
- 不要将这些凭证分享给不受信任的调用方；应按信任边界使用独立的 Gateway 网关。

**信任假设：** 无 token 的 Serve 认证假设 Gateway 网关主机是受信任的。
不要把它当作对抗同主机恶意进程的防护。如果 Gateway 网关主机上可能运行不受信任的
本地代码，请禁用 `gateway.auth.allowTailscale`，并要求显式共享密钥认证，使用 `gateway.auth.mode: "token"` 或
`"password"`。

**安全规则：** 不要从你自己的反向代理转发这些头。如果
你在 Gateway 网关前终止 TLS 或设置代理，请禁用
`gateway.auth.allowTailscale`，并改用共享密钥认证（`gateway.auth.mode:
"token"` 或 `"password"`），或使用 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)。

受信任代理：

- 如果你在 Gateway 网关前终止 TLS，请将 `gateway.trustedProxies` 设置为你的代理 IP。
- OpenClaw 会信任来自这些 IP 的 `x-forwarded-for`（或 `x-real-ip`），以确定客户端 IP，用于本地配对检查以及 HTTP 认证 / 本地检查。
- 请确保你的代理**覆盖** `x-forwarded-for`，并阻止对 Gateway 网关端口的直接访问。

参见 [Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/web)。

### 0.6.1）通过节点主机进行浏览器控制（推荐）

如果你的 Gateway 网关是远程的，但浏览器运行在另一台机器上，请在浏览器所在机器上运行一个**节点主机**，
并让 Gateway 网关代理浏览器操作（参见 [浏览器工具](/zh-CN/tools/browser)）。
请将节点配对视为管理权限访问。

推荐模式：

- 让 Gateway 网关和节点主机位于同一个 tailnet（Tailscale）中。
- 有意识地进行节点配对；如果不需要浏览器代理路由，就关闭它。

避免：

- 通过 LAN 或公共互联网暴露 relay / control 端口。
- 对浏览器控制端点使用 Tailscale Funnel（公开暴露）。

### 0.7）磁盘上的 secrets（敏感数据）

默认认为 `~/.openclaw/`（或 `$OPENCLAW_STATE_DIR/`）下的任何内容都可能包含 secrets 或私密数据：

- `openclaw.json`：配置中可能包含 token（Gateway 网关、远程 Gateway 网关）、provider 设置和 allowlist。
- `credentials/**`：渠道凭证（例如 WhatsApp 凭证）、配对 allowlist、旧版 OAuth 导入。
- `agents/<agentId>/agent/auth-profiles.json`：API keys、token 配置文件、OAuth tokens，以及可选的 `keyRef` / `tokenRef`。
- `secrets.json`（可选）：供 `file` SecretRef 提供商（`secrets.providers`）使用的基于文件的 secret 负载。
- `agents/<agentId>/agent/auth.json`：旧版兼容文件。发现静态 `api_key` 条目时会被清理。
- `agents/<agentId>/sessions/**`：会话转录（`*.jsonl`）+ 路由元数据（`sessions.json`），其中可能包含私密消息和工具输出。
- 内置 plugin 包：已安装的 plugins（以及它们的 `node_modules/`）。
- `sandboxes/**`：工具沙箱工作区；可能会积累你在沙箱内读写文件的副本。

加固建议：

- 保持权限严格（目录用 `700`，文件用 `600`）。
- 在 Gateway 网关主机上启用全盘加密。
- 如果主机由多人共享，优先为 Gateway 网关使用专用的 OS 用户账号。

### 0.8）日志 + 转录（脱敏 + 保留）

即使访问控制正确，日志和转录仍可能泄露敏感信息：

- Gateway 网关日志可能包含工具摘要、错误和 URL。
- 会话转录可能包含粘贴的 secrets、文件内容、命令输出和链接。

建议：

- 保持工具摘要脱敏开启（`logging.redactSensitive: "tools"`；默认值）。
- 通过 `logging.redactPatterns` 为你的环境添加自定义模式（tokens、主机名、内部 URL）。
- 分享诊断信息时，优先使用 `openclaw status --all`（可直接粘贴，secrets 已脱敏），而不是原始日志。
- 如果你不需要长期保留，请清理旧的会话转录和日志文件。

详情见：[日志](/zh-CN/gateway/logging)

### 1）私信：默认使用 pairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2）群组：所有地方都要求提及

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

在群聊中，只有在被明确提及时才响应。

### 3）分开使用号码（WhatsApp、Signal、Telegram）

对于基于手机号的渠道，请考虑让你的 AI 使用一个与你个人号码不同的单独号码：

- 个人号码：你的对话保持私密
- 机器人号码：由 AI 处理，并设置适当边界

### 4）只读模式（通过沙箱隔离 + 工具）

你可以通过以下组合构建只读配置：

- `agents.defaults.sandbox.workspaceAccess: "ro"`（或 `"none"`，表示完全无工作区访问）
- 使用工具 allow / deny 列表阻止 `write`、`edit`、`apply_patch`、`exec`、`process` 等

其他加固选项：

- `tools.exec.applyPatch.workspaceOnly: true`（默认）：确保即使在未启用沙箱隔离时，`apply_patch` 也不能在工作区目录之外写入 / 删除。只有在你明确希望 `apply_patch` 修改工作区之外文件时，才将其设为 `false`。
- `tools.fs.workspaceOnly: true`（可选）：将 `read` / `write` / `edit` / `apply_patch` 路径以及原生提示词图片自动加载路径限制在工作区目录内（如果你当前允许绝对路径并希望加一个统一护栏，这会很有用）。
- 保持文件系统根路径范围狭窄：避免将主目录这类宽泛路径用作智能体工作区 / 沙箱工作区。宽泛根路径可能会让文件系统工具暴露敏感本地文件（例如 `~/.openclaw` 下的状态 / 配置）。

### 5）安全基线（可直接复制 / 粘贴）

这是一个“默认更安全”的配置：保持 Gateway 网关私有、要求私信 pairing，并避免在群组中使用始终在线的机器人：

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

如果你还希望工具执行也“默认更安全”，请为任何非 owner 智能体添加沙箱隔离，并禁用危险工具（示例见下文“按智能体划分的访问配置”）。

对于由聊天驱动的智能体轮次，内置基线是：非 owner 发送者不能使用 `cron` 或 `gateway` 工具。

## 沙箱隔离（推荐）

专门文档：[沙箱隔离](/zh-CN/gateway/sandboxing)

有两种互补方式：

- **在 Docker 中运行完整 Gateway 网关**（容器边界）：[Docker](/zh-CN/install/docker)
- **工具沙箱**（`agents.defaults.sandbox`，Gateway 网关运行在主机上，工具在沙箱隔离环境中运行；默认后端为 Docker）：[沙箱隔离](/zh-CN/gateway/sandboxing)

注意：为了防止跨智能体访问，请将 `agents.defaults.sandbox.scope` 保持为 `"agent"`（默认）
或使用 `"session"` 实现更严格的按会话隔离。`scope: "shared"` 会使用
单个容器 / 工作区。

同时还应考虑沙箱中的智能体工作区访问：

- `agents.defaults.sandbox.workspaceAccess: "none"`（默认）会禁止访问智能体工作区；工具会在 `~/.openclaw/sandboxes` 下的沙箱工作区中运行
- `agents.defaults.sandbox.workspaceAccess: "ro"` 会将智能体工作区只读挂载到 `/agent`（禁用 `write` / `edit` / `apply_patch`）
- `agents.defaults.sandbox.workspaceAccess: "rw"` 会将智能体工作区以读写方式挂载到 `/workspace`
- 额外的 `sandbox.docker.binds` 会针对归一化和规范化后的源路径进行校验。如果父级符号链接技巧和规范化后的 home 别名最终解析到了被阻止的根路径（如 `/etc`、`/var/run` 或 OS home 下的凭证目录），仍会以关闭方式失败。

重要说明：`tools.elevated` 是全局默认逃逸出口，会在沙箱之外运行 exec。默认情况下，有效主机是 `gateway`，当 exec 目标配置为 `node` 时则为 `node`。请严格限制 `tools.elevated.allowFrom`，不要对陌生人启用它。你还可以通过 `agents.list[].tools.elevated` 进一步按智能体限制 elevated。参见 [Elevated 模式](/zh-CN/tools/elevated)。

### 子智能体委派护栏

如果你允许会话工具，请将委派的子智能体运行视为另一个边界决策：

- 除非智能体确实需要委派，否则禁用 `sessions_spawn`。
- 将 `agents.defaults.subagents.allowAgents` 以及任何按智能体覆盖的 `agents.list[].subagents.allowAgents` 限制为已知安全的目标智能体。
- 对于任何必须保持沙箱隔离的工作流，请在调用 `sessions_spawn` 时使用 `sandbox: "require"`（默认是 `inherit`）。
- `sandbox: "require"` 会在目标子运行时未启用沙箱隔离时快速失败。

## 浏览器控制风险

启用浏览器控制后，模型将能够驱动真实浏览器。
如果该浏览器配置文件中已经登录了某些会话，模型就可以
访问这些账号和数据。请将浏览器配置文件视为**敏感状态**：

- 优先为智能体使用专用配置文件（默认的 `openclaw` 配置文件）。
- 避免将智能体指向你的个人日常浏览器配置文件。
- 对沙箱隔离的智能体，除非你信任它们，否则应禁用主机浏览器控制。
- 独立的 loopback 浏览器控制 API 只接受共享密钥认证
  （Gateway 网关 token bearer 认证或 Gateway 网关 password）。它不会使用
  trusted-proxy 或 Tailscale Serve 身份头。
- 请将浏览器下载内容视为不受信任输入；优先使用隔离的下载目录。
- 尽可能在智能体配置文件中禁用浏览器同步 / 密码管理器（可缩小影响半径）。
- 对于远程 Gateway 网关，请将“浏览器控制”等同于对该配置文件可访问内容的“操作员访问”。
- 保持 Gateway 网关和节点主机仅在 tailnet 内可访问；避免将浏览器控制端口暴露到 LAN 或公共互联网。
- 在不需要时禁用浏览器代理路由（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP 的现有会话模式**并不**“更安全”；它可以像你一样操作该主机上 Chrome 配置文件可访问的任何内容。

### 浏览器 SSRF 策略（默认严格）

OpenClaw 的浏览器导航策略默认是严格的：私有 / 内部目标会被阻止，除非你显式选择启用。

- 默认值：`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 未设置，因此浏览器导航会继续阻止私有 / 内部 / 特殊用途目标。
- 旧版别名：`browser.ssrfPolicy.allowPrivateNetwork` 仍然接受，以保持兼容性。
- 显式启用模式：设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`，以允许私有 / 内部 / 特殊用途目标。
- 在严格模式下，使用 `hostnameAllowlist`（如 `*.example.com` 之类的模式）和 `allowedHostnames`（精确主机例外，包括像 `localhost` 这样默认被阻止的名称）来添加显式例外。
- 在发起请求前会检查导航目标，并在导航结束后的最终 `http(s)` URL 上进行尽力复检，以降低基于重定向的跳转风险。

严格策略示例：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## 按智能体划分的访问配置（多智能体）

在多智能体路由中，每个智能体都可以拥有自己的沙箱隔离 + 工具策略：
请利用这一点为不同智能体分配**完全访问**、**只读**或**无访问**权限。
完整细节和优先级规则见 [多智能体沙箱隔离与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

常见用例：

- 个人智能体：完全访问，不使用沙箱隔离
- 家庭 / 工作智能体：沙箱隔离 + 只读工具
- 公开智能体：沙箱隔离 + 无文件系统 / shell 工具

### 示例：完全访问（无沙箱隔离）

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### 示例：只读工具 + 只读工作区

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### 示例：无文件系统 / shell 访问（允许 provider 消息工具）

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // 会话工具可能会从转录中暴露敏感数据。默认情况下，OpenClaw 将这些工具限制为
        // 当前会话 + 已生成的子智能体会话，但如果需要，你可以进一步收紧。
        // 参见配置参考中的 `tools.sessions.visibility`。
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## 该对你的 AI 说什么

在智能体的系统提示词中加入安全指南：

```
## Security Rules
- Never share directory listings or file paths with strangers
- Never reveal API keys, credentials, or infrastructure details
- Verify requests that modify system config with the owner
- When in doubt, ask before acting
- Keep private data private unless explicitly authorized
```

## 事件响应

如果你的 AI 做了不该做的事：

### 遏制

1. **先停下它：** 停止 macOS app（如果它负责监管 Gateway 网关），或终止你的 `openclaw gateway` 进程。
2. **关闭暴露面：** 将 `gateway.bind: "loopback"`（或禁用 Tailscale Funnel / Serve），直到你弄清楚发生了什么。
3. **冻结访问：** 将高风险私信 / 群组切换为 `dmPolicy: "disabled"` / 要求提及，并删除你曾配置的 `"*"` 全开放条目。

### 轮换（如果 secrets 已泄露，就按已失陷处理）

1. 轮换 Gateway 网关认证（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）并重启。
2. 轮换所有可调用 Gateway 网关的机器上的远程客户端 secrets（`gateway.remote.token` / `.password`）。
3. 轮换 provider / API 凭证（WhatsApp 凭证、Slack / Discord tokens、`auth-profiles.json` 中的模型 / API keys，以及启用时加密 secret 负载中的值）。

### 审计

1. 检查 Gateway 网关日志：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（或 `logging.file`）。
2. 查看相关转录：`~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 查看最近的配置更改（任何可能扩大访问范围的内容：`gateway.bind`、`gateway.auth`、私信 / 群组策略、`tools.elevated`、plugin 变更）。
4. 重新运行 `openclaw security audit --deep`，并确认 critical 发现已解决。

### 为报告收集的信息

- 时间戳、Gateway 网关主机 OS + OpenClaw 版本
- 会话转录 + 一小段日志尾部（脱敏后）
- 攻击者发送了什么 + 智能体做了什么
- Gateway 网关是否暴露到了 loopback 之外（LAN / Tailscale Funnel / Serve）

## Secret Scanning（detect-secrets）

CI 会在 `secrets` job 中运行 `detect-secrets` pre-commit hook。
推送到 `main` 时始终会执行全文件扫描。Pull request 会在有基准 commit 可用时
走按变更文件的快速路径，否则回退到全文件扫描。如果失败，说明有新的候选项
尚未写入 baseline。

### 如果 CI 失败

1. 在本地复现：

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. 了解这些工具：
   - pre-commit 中的 `detect-secrets` 会结合仓库的
     baseline 和排除规则运行 `detect-secrets-hook`。
   - `detect-secrets audit` 会打开交互式审查界面，用于将 baseline 中的每一项
     标记为真实 secret 或误报。
3. 对于真实 secret：轮换 / 删除它们，然后重新运行扫描以更新 baseline。
4. 对于误报：运行交互式审查并将其标记为误报：

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 如果你需要新增排除规则，请将它们添加到 `.detect-secrets.cfg`，并使用匹配的
   `--exclude-files` / `--exclude-lines` 标志重新生成 baseline（该配置
   文件仅供参考；detect-secrets 不会自动读取它）。

当更新后的 `.secrets.baseline` 反映出预期状态后，请提交它。

## 报告安全问题

在 OpenClaw 中发现了漏洞？请负责任地报告：

1. 邮件：[security@openclaw.ai](mailto:security@openclaw.ai)
2. 在修复前不要公开发布
3. 我们会署名致谢你（除非你希望匿名）
