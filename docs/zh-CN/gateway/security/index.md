---
read_when:
    - 添加会扩大访问范围或自动化能力的功能
summary: 运行具有 shell 访问权限的 AI Gateway 网关的安全注意事项和威胁模型
title: 安全性
x-i18n:
    generated_at: "2026-04-21T19:31:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b455ffc197119aaa92306eab03d0762a6778e2779b13de8a5d4affd0690f297
    source_path: gateway/security/index.md
    workflow: 15
---

# 安全性

<Warning>
**个人助手信任模型：** 本指南假设每个 Gateway 网关对应一个受信任的操作员边界（单用户 / 个人助手模型）。
OpenClaw **并不是** 为多个对抗性用户共享同一个智能体 / Gateway 网关而设计的敌对多租户安全边界。
如果你需要混合信任或对抗性用户运行，请拆分信任边界（单独的 Gateway 网关 + 凭证，最好再配合单独的操作系统用户 / 主机）。
</Warning>

**本页内容：** [信任模型](#scope-first-personal-assistant-security-model) | [快速审计](#quick-check-openclaw-security-audit) | [强化基线](#hardened-baseline-in-60-seconds) | [私信访问模型](#dm-access-model-pairing-allowlist-open-disabled) | [配置加固](#configuration-hardening-examples) | [事件响应](#incident-response)

## 先明确范围：个人助手安全模型

OpenClaw 的安全指南假设采用的是**个人助手**部署：一个受信任的操作员边界，可能包含多个智能体。

- 支持的安全姿态：每个 Gateway 网关对应一个用户 / 信任边界（最好每个边界对应一个操作系统用户 / 主机 / VPS）。
- 不受支持的安全边界：由彼此不受信任或具有对抗关系的用户共享同一个 Gateway 网关 / 智能体。
- 如果需要对抗性用户隔离，请按信任边界拆分（单独的 Gateway 网关 + 凭证，最好再配合单独的操作系统用户 / 主机）。
- 如果多个不受信任的用户都可以向同一个启用了工具的智能体发送消息，请视为他们共享了该智能体相同的委派工具权限。

本页说明的是**在这一模型内**如何加固。它并不声称在一个共享 Gateway 网关上提供敌对多租户隔离能力。

## 快速检查：`openclaw security audit`

另见：[Formal Verification（Security Models）](/zh-CN/security/formal-verification)

请定期运行它（尤其是在修改配置或暴露网络接口之后）：

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` 的修复范围有意保持较窄：它会将常见的开放群组策略切换为 allowlist，恢复 `logging.redactSensitive: "tools"`，收紧状态 / 配置 / include 文件权限，并且在 Windows 上运行时使用 Windows ACL 重置，而不是 POSIX `chmod`。

它会标记常见的危险配置（Gateway 网关认证暴露、浏览器控制暴露、高权限 allowlist、文件系统权限、过于宽松的 exec 批准，以及开放渠道中的工具暴露）。

OpenClaw 既是一个产品，也是一个实验：你正在把前沿模型行为接入真实的消息渠道和真实工具。**不存在“绝对安全”的配置。** 目标是有意识地明确：

- 谁可以和你的机器人对话
- 机器人被允许在哪里执行操作
- 机器人可以接触什么内容

先从仍然可用的最小权限开始，随着信心增加再逐步放宽。

### 部署与主机信任

OpenClaw 假设主机和配置边界是受信任的：

- 如果某人可以修改 Gateway 网关主机状态 / 配置（`~/.openclaw`，包括 `openclaw.json`），就应将其视为受信任的操作员。
- 让多个彼此不受信任 / 具有对抗关系的操作员共用一个 Gateway 网关**不是推荐配置**。
- 对于混合信任团队，请使用单独的 Gateway 网关 来拆分信任边界（或至少使用单独的操作系统用户 / 主机）。
- 推荐默认方式：每台机器 / 主机（或 VPS）一个用户，该用户一个 Gateway 网关，并在该 Gateway 网关中运行一个或多个智能体。
- 在一个 Gateway 网关实例内部，已认证的操作员访问属于受信任的控制平面角色，而不是按用户划分的租户角色。
- 会话标识符（`sessionKey`、会话 ID、标签）是路由选择器，不是授权令牌。
- 如果多个人都可以向同一个启用了工具的智能体发送消息，那么他们每个人都可以驱动同一组权限。按用户进行会话 / 记忆隔离有助于隐私，但并不能把一个共享智能体变成按用户划分的主机授权边界。

### 共享 Slack 工作区：真实风险

如果“Slack 里的所有人都可以给机器人发消息”，核心风险是委派工具权限：

- 任何被允许的发送者都可以在该智能体的策略范围内诱导工具调用（`exec`、浏览器、网络 / 文件工具）；
- 来自某个发送者的提示 / 内容注入，可能导致影响共享状态、设备或输出的操作；
- 如果某个共享智能体拥有敏感凭证 / 文件，任何被允许的发送者都可能通过工具使用来驱动数据外泄。

对于团队工作流，请使用最小工具集的独立智能体 / Gateway 网关；涉及个人数据的智能体请保持私有。

### 公司共享智能体：可接受模式

当使用该智能体的所有人都处于同一个信任边界内（例如同一个公司团队），并且该智能体严格限定在业务范围内时，这是可以接受的。

- 在专用机器 / VM / 容器上运行；
- 为该运行时使用专用的操作系统用户 + 专用浏览器 / 配置文件 / 账号；
- 不要让该运行时登录个人 Apple / Google 账号，也不要使用个人密码管理器 / 浏览器配置文件。

如果你在同一个运行时里混用个人身份和公司身份，就会打破隔离，并增加个人数据暴露风险。

## Gateway 网关与节点的信任概念

请把 Gateway 网关和节点视为同一个操作员信任域中的不同角色：

- **Gateway 网关** 是控制平面和策略界面（`gateway.auth`、工具策略、路由）。
- **节点** 是与该 Gateway 网关配对的远程执行界面（命令、设备操作、主机本地能力）。
- 通过 Gateway 网关认证的调用方，在 Gateway 网关范围内被视为受信任。完成配对后，节点操作被视为该节点上的受信任操作员操作。
- `sessionKey` 是路由 / 上下文选择键，不是按用户划分的认证机制。
- Exec 批准（allowlist + 询问）是保护操作员意图的护栏，不是敌对多租户隔离机制。
- OpenClaw 针对受信任单操作员场景的产品默认行为，是允许在 `gateway` / `node` 上直接执行主机 exec，而不弹出批准提示（`security="full"`，`ask="off"`，除非你自行收紧）。这个默认值是有意的用户体验设计，本身并不构成漏洞。
- Exec 批准会绑定精确的请求上下文以及尽力识别的直接本地文件操作数；它不会对每一种运行时 / 解释器加载路径进行语义建模。若需要强边界，请使用沙箱隔离和主机隔离。

如果你需要敌对用户隔离，请按操作系统用户 / 主机拆分信任边界，并运行单独的 Gateway 网关。

## 信任边界矩阵

在进行风险分级时，可将其作为快速判断模型：

| 边界或控制项                                        | 它的含义                         | 常见误解                                                                    |
| --------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `gateway.auth`（token / password / trusted-proxy / device auth） | 对 Gateway 网关 API 的调用方进行认证 | “要想安全，就必须对每一帧消息都做逐条签名”                                  |
| `sessionKey`                                        | 用于上下文 / 会话选择的路由键    | “会话键就是用户认证边界”                                                    |
| 提示 / 内容护栏                                     | 降低模型被滥用的风险             | “只要有 prompt injection 就证明发生了认证绕过”                              |
| `canvas.eval` / 浏览器 evaluate                     | 启用后提供给操作员的有意能力     | “任何 JS eval 原语在这个信任模型里都自动算漏洞”                             |
| 本地 TUI `!` shell                                  | 由操作员显式触发的本地执行       | “本地 shell 便捷命令就是远程注入”                                           |
| 节点配对和节点命令                                  | 对已配对设备的操作员级远程执行   | “默认就应该把远程设备控制视为不受信任用户访问”                              |

## 按设计不算漏洞的情况

以下模式经常被报告，但通常会作为无需处理而关闭，除非能够证明存在真实边界绕过：

- 仅依赖 prompt injection 的利用链，而没有策略 / 认证 / 沙箱绕过。
- 假设在同一个共享主机 / 配置上运行敌对多租户的报告。
- 将正常的操作员读路径访问（例如 `sessions.list` / `sessions.preview` / `chat.history`）在共享 Gateway 网关部署中认定为 IDOR 的说法。
- 仅限 localhost 的部署发现（例如仅 loopback Gateway 网关上的 HSTS 问题）。
- 针对本仓库中并不存在的入站路径所提出的 Discord 入站 webhook 签名问题。
- 将节点配对元数据当作 `system.run` 的隐藏“第二层逐命令审批”机制的报告，而实际上真正的执行边界仍然是 Gateway 网关的全局节点命令策略加上节点自身的 exec 批准。
- 将 `sessionKey` 当作认证令牌来认定“缺少按用户授权”的问题。

## 安全研究者预检清单

在提交 GHSA 之前，请验证以下所有内容：

1. 复现仍然能在最新 `main` 或最新发布版本上成功。
2. 报告包含精确的代码路径（`file`、函数、行范围）以及测试所用版本 / commit。
3. 影响必须跨越一个已记录的信任边界（而不只是 prompt injection）。
4. 该问题不在 [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope) 列表中。
5. 已检查现有安全公告是否重复（适用时请复用规范的 GHSA）。
6. 已明确说明部署假设（loopback / 本地 还是对外暴露，受信任操作员还是不受信任操作员）。

## 在 60 秒内完成强化基线配置

先使用这个基线，然后再按受信任智能体有选择地重新启用工具：

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

这会将 Gateway 网关限制为仅本地访问、隔离私信，并默认禁用控制平面 / 运行时工具。

## 共享收件箱快速规则

如果有多个人可以给你的机器人发私信：

- 设置 `session.dmScope: "per-channel-peer"`（对于多账号渠道，则使用 `"per-account-channel-peer"`）。
- 保持 `dmPolicy: "pairing"` 或使用严格的 allowlist。
- 绝不要把共享私信和广泛的工具访问权限组合在一起。
- 这能加固协作式 / 共享收件箱，但当用户共享主机 / 配置写权限时，它并不是为敌对协同租户隔离而设计的。

## 上下文可见性模型

OpenClaw 区分两个概念：

- **触发授权**：谁可以触发该智能体（`dmPolicy`、`groupPolicy`、allowlist、提及门槛）。
- **上下文可见性**：哪些补充上下文会被注入模型输入（回复正文、引用文本、线程历史、转发元数据）。

Allowlists 用于限制触发和命令授权。`contextVisibility` 设置用于控制如何过滤补充上下文（引用回复、线程根消息、已抓取历史）：

- `contextVisibility: "all"`（默认）保留接收到的全部补充上下文。
- `contextVisibility: "allowlist"` 会把补充上下文过滤为仅保留通过当前 allowlist 检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一条显式引用的回复。

你可以按渠道或按房间 / 对话设置 `contextVisibility`。具体配置方式请参见 [群聊](/zh-CN/channels/groups#context-visibility-and-allowlists)。

安全公告分级指南：

- 如果报告只表明“模型可以看到来自未列入 allowlist 的发送者的引用文本或历史文本”，这属于可通过 `contextVisibility` 解决的加固问题，本身不构成认证或沙箱边界绕过。
- 要构成真正的安全影响，报告仍需证明存在信任边界绕过（认证、策略、沙箱、批准机制，或其他已记录边界）。

## 审计会检查什么（高层级）

- **入站访问**（私信策略、群组策略、allowlist）：陌生人能否触发机器人？
- **工具影响半径**（高权限工具 + 开放房间）：prompt injection 是否可能演变为 shell / 文件 / 网络操作？
- **Exec 批准漂移**（`security=full`、`autoAllowSkills`、未启用 `strictInlineEval` 的解释器 allowlist）：主机 exec 护栏是否仍然按你的预期工作？
  - `security="full"` 是一种宽泛姿态警告，并不等于证明存在 bug。它是受信任个人助手场景下的默认选择；只有当你的威胁模型确实需要审批或 allowlist 护栏时，才应收紧它。
- **网络暴露**（Gateway 网关 bind / auth、Tailscale Serve / Funnel、弱 / 短认证 token）。
- **浏览器控制暴露**（远程节点、中继端口、远程 CDP 端点）。
- **本地磁盘卫生**（权限、符号链接、配置 include、“同步文件夹”路径）。
- **插件**（存在扩展，但没有显式 allowlist）。
- **策略漂移 / 配置错误**（已配置沙箱 Docker 设置但沙箱模式关闭；无效的 `gateway.nodes.denyCommands` 模式，因为匹配仅针对精确命令名，例如 `system.run`，不会检查 shell 文本；危险的 `gateway.nodes.allowCommands` 条目；全局 `tools.profile="minimal"` 被按智能体配置覆盖；扩展插件工具在宽松工具策略下可被访问）。
- **运行时预期漂移**（例如以为隐式 exec 仍然意味着 `sandbox`，但现在 `tools.exec.host` 默认是 `auto`；或者显式设置 `tools.exec.host="sandbox"`，但沙箱模式实际上已关闭）。
- **模型卫生**（当配置的模型看起来较旧时给出警告；这不是硬性阻止项）。

如果你运行 `--deep`，OpenClaw 还会尽力尝试对 Gateway 网关进行一次实时探测。

## 凭证存储映射

在审计访问权限或决定哪些内容需要备份时，可使用此清单：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 机器人 token**：配置 / 环境变量，或 `channels.telegram.tokenFile`（仅允许普通文件；拒绝符号链接）
- **Discord 机器人 token**：配置 / 环境变量，或 SecretRef（env / file / exec 提供商）
- **Slack tokens**：配置 / 环境变量（`channels.slack.*`）
- **配对 allowlist**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账号）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账号）
- **模型认证配置文件**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **基于文件的 secrets 负载（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`

## 安全审计清单

当审计输出发现项时，请按以下优先级处理：

1. **任何“开放” + 已启用工具**：先锁定私信 / 群组（配对 / allowlist），再收紧工具策略 / 沙箱隔离。
2. **公共网络暴露**（LAN bind、Funnel、缺少认证）：立即修复。
3. **浏览器控制远程暴露**：应将其视为操作员级访问（仅 tailnet、谨慎配对节点、避免公开暴露）。
4. **权限**：确保状态 / 配置 / 凭证 / 认证信息对组用户或所有用户都不可读。
5. **插件 / 扩展**：只加载你明确信任的内容。
6. **模型选择**：对任何启用了工具的机器人，优先使用现代、具备更强指令稳健性的模型。

## 安全审计术语表

在真实部署中你最可能看到的高信号 `checkId` 值如下（并非完整列表）：

| `checkId` | 严重级别 | 重要原因 | 主要修复键 / 路径 | 自动修复 |
| --- | --- | --- | --- | --- |
| `fs.state_dir.perms_world_writable` | 严重 | 其他用户 / 进程可以修改完整的 OpenClaw 状态 | `~/.openclaw` 的文件系统权限 | 是 |
| `fs.state_dir.perms_group_writable` | 警告 | 同组用户可以修改完整的 OpenClaw 状态 | `~/.openclaw` 的文件系统权限 | 是 |
| `fs.state_dir.perms_readable` | 警告 | 状态目录可被其他人读取 | `~/.openclaw` 的文件系统权限 | 是 |
| `fs.state_dir.symlink` | 警告 | 状态目录目标变成了另一个信任边界 | 状态目录的文件系统布局 | 否 |
| `fs.config.perms_writable` | 严重 | 其他人可以更改认证 / 工具策略 / 配置 | `~/.openclaw/openclaw.json` 的文件系统权限 | 是 |
| `fs.config.symlink` | 警告 | 配置目标变成了另一个信任边界 | 配置文件的文件系统布局 | 否 |
| `fs.config.perms_group_readable` | 警告 | 同组用户可以读取配置 token / 设置 | 配置文件的文件系统权限 | 是 |
| `fs.config.perms_world_readable` | 严重 | 配置可能泄露 token / 设置 | 配置文件的文件系统权限 | 是 |
| `fs.config_include.perms_writable` | 严重 | 配置 include 文件可被其他人修改 | `openclaw.json` 引用的 include 文件权限 | 是 |
| `fs.config_include.perms_group_readable` | 警告 | 同组用户可以读取包含的 secrets / 设置 | `openclaw.json` 引用的 include 文件权限 | 是 |
| `fs.config_include.perms_world_readable` | 严重 | 包含的 secrets / 设置对所有用户可读 | `openclaw.json` 引用的 include 文件权限 | 是 |
| `fs.auth_profiles.perms_writable` | 严重 | 其他人可以注入或替换已存储的模型凭证 | `agents/<agentId>/agent/auth-profiles.json` 权限 | 是 |
| `fs.auth_profiles.perms_readable` | 警告 | 其他人可以读取 API keys 和 OAuth token | `agents/<agentId>/agent/auth-profiles.json` 权限 | 是 |
| `fs.credentials_dir.perms_writable` | 严重 | 其他人可以修改渠道配对 / 凭证状态 | `~/.openclaw/credentials` 的文件系统权限 | 是 |
| `fs.credentials_dir.perms_readable` | 警告 | 其他人可以读取渠道凭证状态 | `~/.openclaw/credentials` 的文件系统权限 | 是 |
| `fs.sessions_store.perms_readable` | 警告 | 其他人可以读取会话记录 / 元数据 | 会话存储权限 | 是 |
| `fs.log_file.perms_readable` | 警告 | 其他人可以读取已脱敏但仍可能敏感的日志 | Gateway 网关日志文件权限 | 是 |
| `fs.synced_dir` | 警告 | 将状态 / 配置放在 iCloud / Dropbox / Drive 中会扩大 token / 记录暴露面 | 将配置 / 状态移出同步文件夹 | 否 |
| `gateway.bind_no_auth` | 严重 | 在没有共享密钥的情况下进行远程绑定 | `gateway.bind`、`gateway.auth.*` | 否 |
| `gateway.loopback_no_auth` | 严重 | 经反向代理的 loopback 可能变成未认证访问 | `gateway.auth.*`、代理设置 | 否 |
| `gateway.trusted_proxies_missing` | 警告 | 存在反向代理头，但未将代理标记为受信任 | `gateway.trustedProxies` | 否 |
| `gateway.http.no_auth` | 警告 / 严重 | 在 `auth.mode="none"` 下 Gateway 网关 HTTP API 可被访问 | `gateway.auth.mode`、`gateway.http.endpoints.*` | 否 |
| `gateway.http.session_key_override_enabled` | 信息 | HTTP API 调用方可以覆盖 `sessionKey` | `gateway.http.allowSessionKeyOverride` | 否 |
| `gateway.tools_invoke_http.dangerous_allow` | 警告 / 严重 | 通过 HTTP API 重新启用了危险工具 | `gateway.tools.allow` | 否 |
| `gateway.nodes.allow_commands_dangerous` | 警告 / 严重 | 启用了高影响节点命令（摄像头 / 屏幕 / 联系人 / 日历 / 短信） | `gateway.nodes.allowCommands` | 否 |
| `gateway.nodes.deny_commands_ineffective` | 警告 | 类似模式的 deny 条目不会匹配 shell 文本或命令组 | `gateway.nodes.denyCommands` | 否 |
| `gateway.tailscale_funnel` | 严重 | 暴露到公共互联网 | `gateway.tailscale.mode` | 否 |
| `gateway.tailscale_serve` | 信息 | 通过 Serve 启用了 tailnet 暴露 | `gateway.tailscale.mode` | 否 |
| `gateway.control_ui.allowed_origins_required` | 严重 | 非 loopback 的 Control UI 未设置显式浏览器源 allowlist | `gateway.controlUi.allowedOrigins` | 否 |
| `gateway.control_ui.allowed_origins_wildcard` | 警告 / 严重 | `allowedOrigins=["*"]` 会禁用浏览器源 allowlist | `gateway.controlUi.allowedOrigins` | 否 |
| `gateway.control_ui.host_header_origin_fallback` | 警告 / 严重 | 启用了基于 Host 头的源回退（降低 DNS rebinding 加固强度） | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | 否 |
| `gateway.control_ui.insecure_auth` | 警告 | 启用了不安全认证兼容开关 | `gateway.controlUi.allowInsecureAuth` | 否 |
| `gateway.control_ui.device_auth_disabled` | 严重 | 禁用了设备身份校验 | `gateway.controlUi.dangerouslyDisableDeviceAuth` | 否 |
| `gateway.real_ip_fallback_enabled` | 警告 / 严重 | 信任 `X-Real-IP` 回退可能因代理配置错误导致源 IP 欺骗 | `gateway.allowRealIpFallback`、`gateway.trustedProxies` | 否 |
| `gateway.token_too_short` | 警告 | 过短的共享 token 更容易被暴力破解 | `gateway.auth.token` | 否 |
| `gateway.auth_no_rate_limit` | 警告 | 暴露的认证接口若无速率限制，会增加暴力破解风险 | `gateway.auth.rateLimit` | 否 |
| `gateway.trusted_proxy_auth` | 严重 | 代理身份现在成为认证边界 | `gateway.auth.mode="trusted-proxy"` | 否 |
| `gateway.trusted_proxy_no_proxies` | 严重 | 在没有受信任代理 IP 的情况下启用 trusted-proxy 认证是不安全的 | `gateway.trustedProxies` | 否 |
| `gateway.trusted_proxy_no_user_header` | 严重 | trusted-proxy 认证无法安全解析用户身份 | `gateway.auth.trustedProxy.userHeader` | 否 |
| `gateway.trusted_proxy_no_allowlist` | 警告 | trusted-proxy 认证会接受任何已认证的上游用户 | `gateway.auth.trustedProxy.allowUsers` | 否 |
| `gateway.probe_auth_secretref_unavailable` | 警告 | 深度探测在当前命令路径下无法解析认证 SecretRef | 深度探测认证来源 / SecretRef 可用性 | 否 |
| `gateway.probe_failed` | 警告 / 严重 | 实时 Gateway 网关探测失败 | Gateway 网关可达性 / 认证 | 否 |
| `discovery.mdns_full_mode` | 警告 / 严重 | mDNS 完整模式会在本地网络上广播 `cliPath` / `sshPort` 元数据 | `discovery.mdns.mode`、`gateway.bind` | 否 |
| `config.insecure_or_dangerous_flags` | 警告 | 启用了不安全 / 危险的调试标志 | 多个键（见发现详情） | 否 |
| `config.secrets.gateway_password_in_config` | 警告 | Gateway 网关密码直接存储在配置中 | `gateway.auth.password` | 否 |
| `config.secrets.hooks_token_in_config` | 警告 | Hook bearer token 直接存储在配置中 | `hooks.token` | 否 |
| `hooks.token_reuse_gateway_token` | 严重 | Hook 入站 token 同时也可用于 Gateway 网关认证 | `hooks.token`、`gateway.auth.token` | 否 |
| `hooks.token_too_short` | 警告 | Hook 入站更容易被暴力破解 | `hooks.token` | 否 |
| `hooks.default_session_key_unset` | 警告 | Hook 智能体运行会分散到自动生成的按请求会话中 | `hooks.defaultSessionKey` | 否 |
| `hooks.allowed_agent_ids_unrestricted` | 警告 / 严重 | 已认证的 Hook 调用方可以路由到任意已配置智能体 | `hooks.allowedAgentIds` | 否 |
| `hooks.request_session_key_enabled` | 警告 / 严重 | 外部调用方可以选择 `sessionKey` | `hooks.allowRequestSessionKey` | 否 |
| `hooks.request_session_key_prefixes_missing` | 警告 / 严重 | 外部会话键格式没有边界限制 | `hooks.allowedSessionKeyPrefixes` | 否 |
| `hooks.path_root` | 严重 | Hook 路径为 `/`，使入站请求更容易发生冲突或误路由 | `hooks.path` | 否 |
| `hooks.installs_unpinned_npm_specs` | 警告 | Hook 安装记录未固定到不可变的 npm 规格 | Hook 安装元数据 | 否 |
| `hooks.installs_missing_integrity` | 警告 | Hook 安装记录缺少完整性元数据 | Hook 安装元数据 | 否 |
| `hooks.installs_version_drift` | 警告 | Hook 安装记录与已安装包发生版本漂移 | Hook 安装元数据 | 否 |
| `logging.redact_off` | 警告 | 敏感值会泄露到日志 / 状态输出中 | `logging.redactSensitive` | 是 |
| `browser.control_invalid_config` | 警告 | 浏览器控制配置在运行前就已无效 | `browser.*` | 否 |
| `browser.control_no_auth` | 严重 | 浏览器控制在没有 token / password 认证的情况下暴露 | `gateway.auth.*` | 否 |
| `browser.remote_cdp_http` | 警告 | 通过纯 HTTP 使用远程 CDP 缺少传输加密 | 浏览器配置文件 `cdpUrl` | 否 |
| `browser.remote_cdp_private_host` | 警告 | 远程 CDP 指向私有 / 内部主机 | 浏览器配置文件 `cdpUrl`、`browser.ssrfPolicy.*` | 否 |
| `sandbox.docker_config_mode_off` | 警告 | 已存在沙箱 Docker 配置，但未启用 | `agents.*.sandbox.mode` | 否 |
| `sandbox.bind_mount_non_absolute` | 警告 | 相对 bind mount 可能解析为不可预测的位置 | `agents.*.sandbox.docker.binds[]` | 否 |
| `sandbox.dangerous_bind_mount` | 严重 | 沙箱 bind mount 指向被阻止的系统、凭证或 Docker socket 路径 | `agents.*.sandbox.docker.binds[]` | 否 |
| `sandbox.dangerous_network_mode` | 严重 | 沙箱 Docker 网络使用 `host` 或 `container:*` 命名空间加入模式 | `agents.*.sandbox.docker.network` | 否 |
| `sandbox.dangerous_seccomp_profile` | 严重 | 沙箱 seccomp 配置削弱了容器隔离 | `agents.*.sandbox.docker.securityOpt` | 否 |
| `sandbox.dangerous_apparmor_profile` | 严重 | 沙箱 AppArmor 配置削弱了容器隔离 | `agents.*.sandbox.docker.securityOpt` | 否 |
| `sandbox.browser_cdp_bridge_unrestricted` | 警告 | 沙箱浏览器桥未限制来源地址范围即对外暴露 | `sandbox.browser.cdpSourceRange` | 否 |
| `sandbox.browser_container.non_loopback_publish` | 严重 | 现有浏览器容器在非 loopback 接口上发布 CDP | 浏览器沙箱容器发布配置 | 否 |
| `sandbox.browser_container.hash_label_missing` | 警告 | 现有浏览器容器早于当前配置哈希标签机制创建 | `openclaw sandbox recreate --browser --all` | 否 |
| `sandbox.browser_container.hash_epoch_stale` | 警告 | 现有浏览器容器早于当前浏览器配置 epoch 创建 | `openclaw sandbox recreate --browser --all` | 否 |
| `tools.exec.host_sandbox_no_sandbox_defaults` | 警告 | 当沙箱关闭时，`exec host=sandbox` 会以失败关闭方式运行 | `tools.exec.host`、`agents.defaults.sandbox.mode` | 否 |
| `tools.exec.host_sandbox_no_sandbox_agents` | 警告 | 当沙箱关闭时，按智能体配置的 `exec host=sandbox` 会以失败关闭方式运行 | `agents.list[].tools.exec.host`、`agents.list[].sandbox.mode` | 否 |
| `tools.exec.security_full_configured` | 警告 / 严重 | 主机 exec 正在以 `security="full"` 运行 | `tools.exec.security`、`agents.list[].tools.exec.security` | 否 |
| `tools.exec.auto_allow_skills_enabled` | 警告 | Exec 批准会隐式信任 Skills 可执行文件 | `~/.openclaw/exec-approvals.json` | 否 |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | 警告 | 解释器 allowlist 允许 inline eval，且不会强制重新批准 | `tools.exec.strictInlineEval`、`agents.list[].tools.exec.strictInlineEval`、exec 批准 allowlist | 否 |
| `tools.exec.safe_bins_interpreter_unprofiled` | 警告 | `safeBins` 中的解释器 / 运行时二进制没有显式 profile，会扩大 exec 风险 | `tools.exec.safeBins`、`tools.exec.safeBinProfiles`、`agents.list[].tools.exec.*` | 否 |
| `tools.exec.safe_bins_broad_behavior` | 警告 | `safeBins` 中的广泛行为工具削弱了低风险 stdin 过滤信任模型 | `tools.exec.safeBins`、`agents.list[].tools.exec.safeBins` | 否 |
| `tools.exec.safe_bin_trusted_dirs_risky` | 警告 | `safeBinTrustedDirs` 包含可变或高风险目录 | `tools.exec.safeBinTrustedDirs`、`agents.list[].tools.exec.safeBinTrustedDirs` | 否 |
| `skills.workspace.symlink_escape` | 警告 | 工作区 `skills/**/SKILL.md` 解析到了工作区根目录之外（符号链接链漂移） | 工作区 `skills/**` 文件系统状态 | 否 |
| `plugins.extensions_no_allowlist` | 警告 | 已安装扩展，但没有显式的插件 allowlist | `plugins.allowlist` | 否 |
| `plugins.installs_unpinned_npm_specs` | 警告 | 插件安装记录未固定到不可变的 npm 规格 | 插件安装元数据 | 否 |
| `plugins.installs_missing_integrity` | 警告 | 插件安装记录缺少完整性元数据 | 插件安装元数据 | 否 |
| `plugins.installs_version_drift` | 警告 | 插件安装记录与已安装包发生版本漂移 | 插件安装元数据 | 否 |
| `plugins.code_safety` | 警告 / 严重 | 插件代码扫描发现可疑或危险模式 | 插件代码 / 安装来源 | 否 |
| `plugins.code_safety.entry_path` | 警告 | 插件入口路径指向隐藏目录或 `node_modules` 位置 | 插件清单中的 `entry` | 否 |
| `plugins.code_safety.entry_escape` | 严重 | 插件入口逃逸出了插件目录 | 插件清单中的 `entry` | 否 |
| `plugins.code_safety.scan_failed` | 警告 | 插件代码扫描无法完成 | 插件扩展路径 / 扫描环境 | 否 |
| `skills.code_safety` | 警告 / 严重 | Skill 安装器元数据 / 代码包含可疑或危险模式 | Skill 安装来源 | 否 |
| `skills.code_safety.scan_failed` | 警告 | Skill 代码扫描无法完成 | Skill 扫描环境 | 否 |
| `security.exposure.open_channels_with_exec` | 警告 / 严重 | 共享 / 公开房间可以访问启用了 exec 的智能体 | `channels.*.dmPolicy`、`channels.*.groupPolicy`、`tools.exec.*`、`agents.list[].tools.exec.*` | 否 |
| `security.exposure.open_groups_with_elevated` | 严重 | 开放群组 + 高权限工具会形成高影响的 prompt injection 路径 | `channels.*.groupPolicy`、`tools.elevated.*` | 否 |
| `security.exposure.open_groups_with_runtime_or_fs` | 严重 / 警告 | 开放群组可以在没有沙箱 / 工作区防护的情况下访问命令 / 文件工具 | `channels.*.groupPolicy`、`tools.profile/deny`、`tools.fs.workspaceOnly`、`agents.*.sandbox.mode` | 否 |
| `security.trust_model.multi_user_heuristic` | 警告 | 配置看起来像多用户使用，但 Gateway 网关信任模型是个人助手 | 拆分信任边界，或进行共享用户加固（`sandbox.mode`、工具 deny / 工作区范围限定） | 否 |
| `tools.profile_minimal_overridden` | 警告 | 智能体覆盖配置绕过了全局最小 profile | `agents.list[].tools.profile` | 否 |
| `plugins.tools_reachable_permissive_policy` | 警告 | 扩展工具在宽松策略上下文中可被访问 | `tools.profile` + 工具 allow / deny | 否 |
| `models.legacy` | 警告 | 仍配置了旧版模型系列 | 模型选择 | 否 |
| `models.weak_tier` | 警告 | 已配置模型低于当前推荐层级 | 模型选择 | 否 |
| `models.small_params` | 严重 / 信息 | 小参数模型 + 不安全工具界面会提高注入风险 | 模型选择 + 沙箱 / 工具策略 | 否 |
| `summary.attack_surface` | 信息 | 对认证、渠道、工具和暴露姿态的汇总摘要 | 多个键（见发现详情） | 否 |

## 通过 HTTP 访问 Control UI

Control UI 需要一个**安全上下文**（HTTPS 或 localhost）来生成设备身份。`gateway.controlUi.allowInsecureAuth` 是一个本地兼容性开关：

- 在 localhost 上，当页面通过非安全 HTTP 加载时，它允许 Control UI 在没有设备身份的情况下进行认证。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

优先使用 HTTPS（Tailscale Serve），或在 `127.0.0.1` 上打开 UI。

仅用于紧急破窗场景时，`gateway.controlUi.dangerouslyDisableDeviceAuth` 会完全禁用设备身份检查。这会严重降低安全性；除非你正在主动调试且能够快速恢复，否则请保持关闭。

与这些危险标志分开的是，成功的 `gateway.auth.mode: "trusted-proxy"` 可以在没有设备身份的情况下允许 **operator** Control UI 会话。这是有意设计的认证模式行为，不是 `allowInsecureAuth` 的捷径，而且它仍然不适用于 node 角色的 Control UI 会话。

启用该设置时，`openclaw security audit` 会发出警告。

## 不安全或危险标志摘要

当已知的不安全 / 危险调试开关被启用时，`openclaw security audit` 会包含 `config.insecure_or_dangerous_flags`。该检查当前聚合以下项目：

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

在 OpenClaw 配置 schema 中定义的完整 `dangerous*` / `dangerously*` 配置键：

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

如果你在反向代理（nginx、Caddy、Traefik 等）后面运行 Gateway 网关，请配置 `gateway.trustedProxies`，以便正确处理转发的客户端 IP。

当 Gateway 网关检测到来自**不在** `trustedProxies` 中地址的代理头时，它**不会**将连接视为本地客户端。如果 Gateway 网关认证被禁用，这些连接会被拒绝。这可以防止认证绕过，否则经代理的连接可能会看起来像来自 localhost，并自动获得信任。

`gateway.trustedProxies` 也用于 `gateway.auth.mode: "trusted-proxy"`，但该认证模式更严格：

- trusted-proxy 认证对来自 loopback 源的代理**以失败关闭方式处理**
- 同一主机上的 loopback 反向代理仍可使用 `gateway.trustedProxies` 进行本地客户端检测和转发 IP 处理
- 对于同一主机上的 loopback 反向代理，请使用 token / password 认证，而不要使用 `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

配置了 `trustedProxies` 后，Gateway 网关会使用 `X-Forwarded-For` 来确定客户端 IP。默认情况下会忽略 `X-Real-IP`，除非显式设置 `gateway.allowRealIpFallback: true`。

良好的反向代理行为（覆盖传入的转发头）：

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

不良的反向代理行为（追加 / 保留不受信任的转发头）：

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS 和来源说明

- OpenClaw Gateway 网关优先面向本地 / loopback。如果你在反向代理处终止 TLS，请在代理面向外部的 HTTPS 域名上设置 HSTS。
- 如果由 Gateway 网关自身终止 HTTPS，你可以设置 `gateway.http.securityHeaders.strictTransportSecurity`，让 OpenClaw 响应发出 HSTS 头。
- 详细部署指南见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)。
- 对于非 loopback 的 Control UI 部署，默认要求设置 `gateway.controlUi.allowedOrigins`。
- `gateway.controlUi.allowedOrigins: ["*"]` 是显式允许所有浏览器来源的策略，不是强化后的默认值。除非在严格受控的本地测试中，否则应避免使用。
- 即使启用了通用 loopback 豁免，loopback 上的浏览器来源认证失败仍然会受到速率限制，但锁定键会按标准化后的 `Origin` 值划分，而不是共享一个 localhost 桶。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 头来源回退模式；请将其视为由操作员主动选择的危险策略。
- 请将 DNS rebinding 和代理 Host 头行为视为部署加固问题；保持 `trustedProxies` 范围严格，避免将 Gateway 网关直接暴露到公共互联网。

## 本地会话日志会存储在磁盘上

OpenClaw 会将会话记录存储在磁盘上的 `~/.openclaw/agents/<agentId>/sessions/*.jsonl` 中。
这对于保持会话连续性以及（可选的）会话记忆索引是必需的，但这也意味着
**任何拥有文件系统访问权限的进程 / 用户都可以读取这些日志**。请将磁盘访问视为信任
边界，并锁定 `~/.openclaw` 的权限（见下方审计部分）。如果你需要在智能体之间实现更强的隔离，请让它们运行在单独的操作系统用户下或单独的主机上。

## 节点执行（system.run）

如果已配对一个 macOS 节点，Gateway 网关就可以在该节点上调用 `system.run`。这属于 **Mac 上的远程代码执行**：

- 需要节点配对（批准 + token）。
- Gateway 网关节点配对不是逐命令审批界面。它建立的是节点身份 / 信任以及 token 签发。
- Gateway 网关通过 `gateway.nodes.allowCommands` / `denyCommands` 应用粗粒度的全局节点命令策略。
- 在 Mac 上通过 **设置 → Exec 批准** 进行控制（security + ask + allowlist）。
- 每个节点的 `system.run` 策略由节点自己的 exec 批准文件（`exec.approvals.node.*`）控制，它可以比 Gateway 网关的全局命令 ID 策略更严格，也可以更宽松。
- 若节点运行时使用 `security="full"` 且 `ask="off"`，则它遵循的是默认的受信任操作员模型。除非你的部署明确要求更严格的审批或 allowlist 策略，否则应将其视为预期行为。
- 批准模式会绑定精确的请求上下文，并在可能时绑定一个具体的本地脚本 / 文件操作数。如果 OpenClaw 无法为解释器 / 运行时命令准确识别出恰好一个直接本地文件，那么基于批准的执行将被拒绝，而不是承诺完整的语义覆盖。
- 对于 `host=node`，基于批准的运行还会存储规范化的预处理 `systemRunPlan`；之后已批准的转发会复用这个已存储的计划，而 Gateway 网关验证会拒绝调用方在批准请求创建后对命令 / cwd / 会话上下文所做的修改。
- 如果你不希望有远程执行，请将 security 设为 **deny**，并移除该 Mac 的节点配对。

这一区别对于分级判断很重要：

- 一个重新连接的已配对节点即使广播了不同的命令列表，如果 Gateway 网关全局策略和节点本地 exec 批准仍然共同实施真实执行边界，这本身并不构成漏洞。
- 将节点配对元数据当作第二层隐藏逐命令审批界面的报告，通常属于策略 / UX 理解混淆，而不是安全边界绕过。

## 动态 Skills（watcher / 远程节点）

OpenClaw 可以在会话中途刷新 Skills 列表：

- **Skills watcher**：对 `SKILL.md` 的更改会在下一次智能体轮次更新 Skills 快照。
- **远程节点**：连接 macOS 节点后，可能会使仅限 macOS 的 Skills 变为可用（基于 bin 探测）。

请将 Skill 文件夹视为**受信任代码**，并限制谁可以修改它们。

## 威胁模型

你的 AI 助手可以：

- 执行任意 shell 命令
- 读 / 写文件
- 访问网络服务
- 给任何人发送消息（如果你给了它 WhatsApp 访问权限）

给你发消息的人可以：

- 试图诱导你的 AI 做坏事
- 通过社工方式获取你的数据访问权限
- 探测基础设施细节

## 核心概念：先做访问控制，再谈智能

这里的大多数失败案例都不是什么高级利用——而是“有人给机器人发了消息，而机器人照做了”。

OpenClaw 的立场是：

- **先看身份：** 决定谁可以和机器人对话（私信配对 / allowlist / 显式 `open`）。
- **再看范围：** 决定机器人被允许在哪里执行操作（群组 allowlist + 提及门槛、工具、沙箱隔离、设备权限）。
- **最后看模型：** 假设模型可以被操纵；设计时应让这种操纵的影响半径受到限制。

## 命令授权模型

斜杠命令和指令只会对**已授权发送者**生效。授权来源于
渠道 allowlist / 配对，以及 `commands.useAccessGroups`（参见 [配置](/zh-CN/gateway/configuration)
和 [斜杠命令](/zh-CN/tools/slash-commands)）。如果渠道 allowlist 为空或包含 `"*"`,
那么该渠道中的命令实际上就是开放的。

`/exec` 是仅供已授权操作员使用的会话内便捷功能。它**不会**写入配置，也**不会**
更改其他会话。

## 控制平面工具风险

有两个内置工具可以进行持久化的控制平面更改：

- `gateway` 可以通过 `config.schema.lookup` / `config.get` 检查配置，也可以通过 `config.apply`、`config.patch` 和 `update.run` 进行持久化更改。
- `cron` 可以创建计划任务，这些任务会在原始聊天 / 任务结束后继续运行。

仅限 owner 的 `gateway` 运行时工具仍然拒绝重写
`tools.exec.ask` 或 `tools.exec.security`；旧版 `tools.bash.*` 别名会
在写入前被规范化到同样受保护的 exec 路径。

对于任何会处理不受信任内容的智能体 / 界面，默认都应禁用这些工具：

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` 只会阻止重启动作。它不会禁用 `gateway` 配置 / 更新操作。

## 插件 / 扩展

插件会**在 Gateway 网关进程内**运行。请将它们视为受信任代码：

- 只从你信任的来源安装插件。
- 优先使用显式的 `plugins.allow` allowlist。
- 启用前检查插件配置。
- 修改插件后重启 Gateway 网关。
- 如果你安装或更新插件（`openclaw plugins install <package>`、`openclaw plugins update <id>`），请将其视为运行不受信任代码：
  - 安装路径是当前插件安装根目录下对应插件的目录。
  - OpenClaw 会在安装 / 更新前运行内置危险代码扫描。`critical` 发现默认会阻止继续。
  - OpenClaw 会先执行 `npm pack`，然后在该目录中运行 `npm install --omit=dev`（npm 生命周期脚本可能会在安装期间执行代码）。
  - 优先使用固定且精确的版本（`@scope/pkg@1.2.3`），并在启用前检查磁盘上解包后的代码。
  - `--dangerously-force-unsafe-install` 仅用于紧急破窗场景，处理插件安装 / 更新流程中内置扫描的误报。它不会绕过插件 `before_install` hook 的策略阻止，也不会绕过扫描失败。
  - 由 Gateway 网关支持的 Skill 依赖安装遵循相同的危险 / 可疑划分：内置 `critical` 发现默认会阻止继续，除非调用方显式设置 `dangerouslyForceUnsafeInstall`；而可疑发现仍然只会发出警告。`openclaw skills install` 仍然是单独的 ClawHub Skill 下载 / 安装流程。

详情见：[插件](/zh-CN/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## 私信访问模型（pairing / allowlist / open / disabled）

所有当前支持私信的渠道都支持一种私信策略（`dmPolicy` 或 `*.dm.policy`），会在处理消息**之前**限制入站私信：

- `pairing`（默认）：未知发送者会收到一个简短的配对码，机器人会忽略他们的消息，直到获得批准。配对码 1 小时后过期；重复发送私信不会重复发送配对码，除非创建了新的请求。默认情况下，每个渠道最多保留 **3 个待处理请求**。
- `allowlist`：未知发送者会被阻止（没有配对握手）。
- `open`：允许任何人发送私信（公开）。**要求** 该渠道的 allowlist 包含 `"*"`（显式选择加入）。
- `disabled`：完全忽略入站私信。

通过 CLI 批准：

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

详情和磁盘文件位置： [配对](/zh-CN/channels/pairing)

## 私信会话隔离（多用户模式）

默认情况下，OpenClaw 会将**所有私信都路由到主会话**，这样你的助手可以在不同设备和渠道之间保持连续性。如果**有多个人**可以给机器人发私信（开放私信或多人 allowlist），请考虑隔离私信会话：

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

这样可以防止跨用户上下文泄露，同时保持群聊彼此隔离。

这是一个消息上下文边界，不是主机管理员边界。如果用户彼此具有对抗关系并共享同一个 Gateway 网关主机 / 配置，请按信任边界运行单独的 Gateway 网关。

### 安全私信模式（推荐）

请将上面的片段视为**安全私信模式**：

- 默认：`session.dmScope: "main"`（所有私信共享一个会话，以保持连续性）。
- 本地 CLI 新手引导默认：在未设置时写入 `session.dmScope: "per-channel-peer"`（保留已有的显式值）。
- 安全私信模式：`session.dmScope: "per-channel-peer"`（每个渠道 + 发送者组合获得一个隔离的私信上下文）。
- 跨渠道联系人隔离：`session.dmScope: "per-peer"`（同一类型的所有渠道中，每个发送者共用一个会话）。

如果你在同一个渠道上运行多个账号，请改用 `per-account-channel-peer`。如果同一个人通过多个渠道联系你，请使用 `session.identityLinks` 将这些私信会话合并为一个规范身份。参见 [会话管理](/zh-CN/concepts/session) 和 [配置](/zh-CN/gateway/configuration)。

## Allowlists（私信 + 群组）- 术语说明

OpenClaw 有两层独立的“谁可以触发我？”机制：

- **私信 allowlist**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`；旧版：`channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）：谁被允许在私信中和机器人对话。
  - 当 `dmPolicy="pairing"` 时，批准结果会写入 `~/.openclaw/credentials/` 下按账号范围划分的配对 allowlist 存储（默认账号使用 `<channel>-allowFrom.json`，非默认账号使用 `<channel>-<accountId>-allowFrom.json`），并与配置中的 allowlist 合并。
- **群组 allowlist**（按渠道定义）：机器人总体上会接受哪些群组 / 渠道 / guild 的消息。
  - 常见模式：
    - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`：每个群组的默认值，如 `requireMention`；设置后它也会充当群组 allowlist（如需保持允许所有群组的行为，请包含 `"*"`）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`：限制在群组会话**内部**哪些人可以触发机器人（WhatsApp / Telegram / Signal / iMessage / Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`：按界面定义的 allowlist + 提及默认值。
  - 群组检查顺序如下：先执行 `groupPolicy` / 群组 allowlists，再执行提及 / 回复激活。
  - 回复机器人消息（隐式提及）**不会**绕过像 `groupAllowFrom` 这样的发送者 allowlist。
  - **安全说明：** 请将 `dmPolicy="open"` 和 `groupPolicy="open"` 视为最后手段。应尽量少用；除非你完全信任房间中的每个成员，否则优先使用 pairing + allowlists。

详情见：[配置](/zh-CN/gateway/configuration) 和 [群组](/zh-CN/channels/groups)

## Prompt injection（它是什么，为什么重要）

Prompt injection 指攻击者精心构造一条消息，操纵模型去执行不安全的操作（“忽略你的指令”“导出你的文件系统”“访问这个链接并执行命令”等）。

即使系统提示很强，**prompt injection 也没有被解决**。系统提示护栏只属于软性指导；真正的硬性约束来自工具策略、exec 批准、沙箱隔离和渠道 allowlists（而且操作员可以按设计关闭这些机制）。实践中有效的做法包括：

- 保持入站私信锁定（pairing / allowlists）。
- 在群组中优先使用提及门槛；避免在公开房间中部署“始终在线”的机器人。
- 默认将链接、附件和粘贴进来的指令视为敌对内容。
- 在沙箱中运行敏感工具执行；不要让 secrets 出现在智能体可访问的文件系统中。
- 注意：沙箱隔离是选择加入的。如果沙箱模式关闭，隐式 `host=auto` 会解析为 Gateway 网关主机。显式 `host=sandbox` 仍会以失败关闭方式处理，因为没有可用的沙箱运行时。如果你希望在配置中明确表达这种行为，请设置 `host=gateway`。
- 将高风险工具（`exec`、`browser`、`web_fetch`、`web_search`）限制给受信任智能体或显式 allowlists。
- 如果你对解释器使用 allowlist（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`），请启用 `tools.exec.strictInlineEval`，这样 inline eval 形式仍然需要显式批准。
- **模型选择很重要：** 较旧 / 较小 / 旧版模型在抵抗 prompt injection 和工具滥用方面明显更脆弱。对于启用了工具的智能体，请使用当前可用的最强、最新一代、经过指令加固的模型。

以下危险信号应视为不受信任内容：

- “读取这个文件 / URL，并完全照着里面说的做。”
- “忽略你的系统提示或安全规则。”
- “泄露你的隐藏指令或工具输出。”
- “把 `~/.openclaw` 或你的日志完整内容贴出来。”

## 不安全外部内容绕过标志

OpenClaw 包含一些显式绕过标志，会禁用外部内容安全包装：

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron 负载字段 `allowUnsafeExternalContent`

指导建议：

- 在生产环境中保持这些值未设置 / 为 false。
- 只在严格限定的调试场景中临时启用。
- 如果启用，请隔离该智能体（沙箱隔离 + 最小工具集 + 专用会话命名空间）。

Hooks 风险说明：

- Hook 负载属于不受信任内容，即使它来自你可控的系统（邮件 / 文档 / 网页内容都可能携带 prompt injection）。
- 较弱的模型层级会放大这种风险。对于基于 Hook 的自动化，请优先使用强大的现代模型层级，并保持严格的工具策略（`tools.profile: "messaging"` 或更严格），并在可能时启用沙箱隔离。

### Prompt injection 并不需要公开私信

即使**只有你自己**可以给机器人发消息，prompt injection 仍然可能通过
机器人读取的任何**不受信任内容**发生（web 搜索 / 抓取结果、浏览器页面、
电子邮件、文档、附件、粘贴的日志 / 代码）。换句话说：发送者并不是
唯一的威胁面；**内容本身**也可能携带对抗性指令。

启用工具后，典型风险是外泄上下文或触发工具调用。你可以通过以下方式降低影响半径：

- 使用只读或禁用工具的**读取型智能体**来总结不受信任内容，
  然后再把摘要传给你的主智能体。
- 对启用了工具的智能体，除非确有需要，否则关闭 `web_search` / `web_fetch` / `browser`。
- 对于 OpenResponses URL 输入（`input_file` / `input_image`），请严格设置
  `gateway.http.endpoints.responses.files.urlAllowlist` 和
  `gateway.http.endpoints.responses.images.urlAllowlist`，并保持 `maxUrlParts` 较低。
  空 allowlist 会被视为未设置；如果你想完全禁用 URL 抓取，请使用 `files.allowUrl: false` / `images.allowUrl: false`。
- 对于 OpenResponses 文件输入，解码后的 `input_file` 文本仍会作为
  **不受信任的外部内容**注入。不要因为 Gateway 网关是在本地解码文件文本，就把它视为受信任内容。注入块仍然会带有显式的
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 边界标记以及 `Source: External`
  元数据，尽管这一路径不会附加更长的 `SECURITY NOTICE:` 横幅。
- 当媒体理解在将附加文档的文本追加到媒体提示之前提取文本时，也会应用同样基于标记的包装。
- 对任何会接触不受信任输入的智能体启用沙箱隔离和严格的工具 allowlists。
- 不要把 secrets 放进提示词中；而应通过 Gateway 网关主机上的环境变量 / 配置传递。

### 自托管 LLM 后端

像 vLLM、SGLang、TGI、LM Studio
或自定义 Hugging Face tokenizer 栈这样的 OpenAI 兼容自托管后端，
在处理 chat-template 特殊 token 的方式上，可能与托管提供商不同。如果某个后端会把
`<|im_start|>`、`<|start_header_id|>` 或 `<start_of_turn>` 之类的字面字符串
在用户内容中分词为结构性的 chat-template token，那么不受信任文本就可能试图
在 tokenizer 层伪造角色边界。

OpenClaw 在将包装后的外部内容发送给模型之前，会移除常见模型家族的特殊 token 字面量。请保持外部内容包装启用，并在后端支持时优先使用能够拆分或转义用户提供内容中特殊 token 的设置。像 OpenAI
和 Anthropic 这样的托管提供商已经在请求侧应用了自己的净化处理。

### 模型强度（安全说明）

不同模型层级对 prompt injection 的抵抗能力**并不一致**。更小 / 更便宜的模型通常更容易受到工具滥用和指令劫持的影响，尤其是在对抗性提示下。

<Warning>
对于启用了工具的智能体，或会读取不受信任内容的智能体，较旧 / 较小模型带来的 prompt injection 风险通常过高。不要在弱模型层级上运行这些工作负载。
</Warning>

建议：

- 对任何可以运行工具或接触文件 / 网络的机器人，**使用最新一代、最佳层级的模型**。
- 对启用了工具的智能体或不受信任收件箱，**不要使用较旧 / 较弱 / 较小的层级**；prompt injection 风险太高。
- 如果你必须使用较小模型，**请缩小影响半径**（只读工具、强沙箱隔离、最小文件系统访问、严格 allowlists）。
- 运行小模型时，**为所有会话启用沙箱隔离**，并且**禁用 web_search / web_fetch / browser**，除非输入已被严格控制。
- 对于仅聊天、输入受信任且没有工具的个人助手，较小模型通常是可以接受的。

<a id="reasoning-verbose-output-in-groups"></a>

## 群组中的推理与详细输出

`/reasoning`、`/verbose` 和 `/trace` 可能会暴露内部推理、工具
输出或插件诊断信息，而这些内容
本来并不适合出现在公开渠道中。在群组场景里，请将它们视为**仅用于调试**
的功能，除非你明确需要，否则保持关闭。

指导建议：

- 在公开房间中保持 `/reasoning`、`/verbose` 和 `/trace` 关闭。
- 如果要启用，只在受信任的私信或严格受控的房间中启用。
- 请记住：verbose 和 trace 输出可能包含工具参数、URL、插件诊断信息，以及模型看到的数据。

## 配置加固（示例）

### 0) 文件权限

在 Gateway 网关主机上保持配置和状态私有：

- `~/.openclaw/openclaw.json`：`600`（仅用户可读 / 写）
- `~/.openclaw`：`700`（仅用户可访问）

`openclaw doctor` 可以发出警告，并提示你收紧这些权限。

### 0.4) 网络暴露（bind + 端口 + 防火墙）

Gateway 网关会在同一个端口上复用 **WebSocket + HTTP**：

- 默认值：`18789`
- 配置 / 标志 / 环境变量：`gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`

这个 HTTP 暴露面包括 Control UI 和 canvas host：

- Control UI（SPA 静态资源）（默认基础路径 `/`）
- canvas host：`/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`（任意 HTML / JS；请将其视为不受信任内容）

如果你在普通浏览器中加载 canvas 内容，请像对待其他不受信任网页一样对待它：

- 不要将 canvas host 暴露给不受信任的网络 / 用户。
- 除非你完全理解其中影响，否则不要让 canvas 内容与高权限 Web 界面共享同一个来源。

bind 模式控制 Gateway 网关监听的位置：

- `gateway.bind: "loopback"`（默认）：只有本地客户端可以连接。
- 非 loopback bind（`"lan"`、`"tailnet"`、`"custom"`）会扩大攻击面。只有在启用 Gateway 网关认证（共享 token / password，或配置正确的非 loopback trusted proxy）并配合真实防火墙时才应使用。

经验规则：

- 优先使用 Tailscale Serve，而不是 LAN bind（Serve 会让 Gateway 网关保持在 loopback 上，由 Tailscale 负责访问控制）。
- 如果你必须绑定到 LAN，请通过防火墙将端口限制为严格的源 IP allowlist；不要广泛地进行端口转发。
- 绝不要在 `0.0.0.0` 上以未认证方式暴露 Gateway 网关。

### 0.4.1) Docker 端口发布 + UFW（`DOCKER-USER`）

如果你在 VPS 上通过 Docker 运行 OpenClaw，请记住，已发布的容器端口
（`-p HOST:CONTAINER` 或 Compose `ports:`）会通过 Docker 的转发链路进行路由，
而不是只经过主机的 `INPUT` 规则。

为了让 Docker 流量与你的防火墙策略保持一致，请在
`DOCKER-USER` 中强制执行规则（该链会在 Docker 自己的接受规则之前进行评估）。
在许多现代发行版上，`iptables` / `ip6tables` 使用的是 `iptables-nft` 前端，
但这些规则仍会应用到 nftables 后端。

最小 allowlist 示例（IPv4）：

```bash
# /etc/ufw/after.rules (append as its own *filter section)
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
添加匹配的策略。

避免在文档片段中硬编码像 `eth0` 这样的接口名。不同 VPS 镜像上的接口名
可能不同（`ens3`、`enp*` 等），不匹配可能会意外导致
拒绝规则被跳过。

重新加载后的快速验证：

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

预期的外部开放端口应只包括你有意暴露的端口（对大多数
配置来说：SSH + 你的反向代理端口）。

### 0.4.2) mDNS / Bonjour 发现（信息泄露）

Gateway 网关会通过 mDNS（5353 端口上的 `_openclaw-gw._tcp`）广播自身存在，以便进行本地设备发现。在完整模式下，这包括可能泄露运行细节的 TXT 记录：

- `cliPath`：CLI 二进制文件的完整文件系统路径（会暴露用户名和安装位置）
- `sshPort`：广播主机上 SSH 可用
- `displayName`、`lanHost`：主机名信息

**运维安全注意事项：** 广播基础设施细节会让局域网上的任何人更容易进行侦察。即使看似“无害”的信息，如文件系统路径和 SSH 可用性，也能帮助攻击者绘制你的环境。

**建议：**

1. **最小模式**（默认，推荐用于对外暴露的 Gateway 网关）：从 mDNS 广播中省略敏感字段：

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. 如果你不需要本地设备发现，**完全禁用**：

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **完整模式**（显式选择加入）：在 TXT 记录中包含 `cliPath` + `sshPort`：

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **环境变量**（替代方式）：设置 `OPENCLAW_DISABLE_BONJOUR=1`，无需修改配置即可禁用 mDNS。

在最小模式下，Gateway 网关仍会广播足够用于设备发现的信息（`role`、`gatewayPort`、`transport`），但会省略 `cliPath` 和 `sshPort`。需要 CLI 路径信息的应用可以改为通过已认证的 WebSocket 连接获取。

### 0.5) 锁定 Gateway 网关 WebSocket（本地认证）

默认情况下**必须启用** Gateway 网关认证。如果没有配置有效的 Gateway 网关认证路径，
Gateway 网关会拒绝 WebSocket 连接（以失败关闭方式处理）。

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

注意：`gateway.remote.token` / `.password` 是客户端凭证来源。它们
本身**不会**保护本地 WS 访问。
只有当 `gateway.auth.*` 未设置时，本地调用路径才可以将 `gateway.remote.*` 用作回退。
如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但无法解析，
则解析会以失败关闭方式处理（不会由远程回退掩盖）。
可选：使用 `wss://` 时，可通过 `gateway.remote.tlsFingerprint` 固定远程 TLS。
默认情况下，明文 `ws://` 仅限 loopback。对于受信任的私有网络
路径，可在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作为紧急破窗手段。

本地设备配对：

- 对于直接的本地 loopback 连接，设备配对会自动批准，以保持
  同主机客户端的顺畅体验。
- OpenClaw 还支持一种狭窄的后端 / 容器本地自连接路径，用于
  受信任的共享密钥辅助流程。
- tailnet 和 LAN 连接，包括同主机的 tailnet bind，都会被视为
  远程连接，仍然需要批准。

认证模式：

- `gateway.auth.mode: "token"`：共享 bearer token（大多数场景推荐）。
- `gateway.auth.mode: "password"`：password 认证（建议通过环境变量设置：`OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`：信任具备身份感知能力的反向代理来认证用户，并通过头部传递身份（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。

轮换检查清单（token / password）：

1. 生成 / 设置新的 secret（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_PASSWORD`）。
2. 重启 Gateway 网关（如果 macOS 应用负责监管 Gateway 网关，则重启该应用）。
3. 更新所有远程客户端（调用 Gateway 网关的机器上对应的 `gateway.remote.token` / `.password`）。
4. 验证旧凭证已无法再连接。

### 0.6) Tailscale Serve 身份头

当 `gateway.auth.allowTailscale` 为 `true` 时（Serve 的默认值），OpenClaw
会接受 Tailscale Serve 身份头（`tailscale-user-login`）用于 Control
UI / WebSocket 认证。OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）
解析 `x-forwarded-for` 地址，并将其与该头部匹配以验证身份。这只会在请求命中 loopback
并且包含由 Tailscale 注入的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host`
时触发。
对于这一路径中的异步身份检查，同一 `{scope, ip}` 的失败尝试
会在限流器记录失败前被串行化处理。因此，来自同一个 Serve 客户端的并发错误重试
可能会让第二次尝试被立即锁定，而不是像两个普通不匹配请求那样并行通过。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）
**不会**使用 Tailscale 身份头认证。它们仍然遵循 Gateway 网关
已配置的 HTTP 认证模式。

重要边界说明：

- Gateway 网关 HTTP bearer 认证实际上等同于全有或全无的操作员访问。
- 请将能够调用 `/v1/chat/completions`、`/v1/responses` 或 `/api/channels/*` 的凭证视为该 Gateway 网关的完全访问操作员 secrets。
- 在 OpenAI 兼容 HTTP 界面上，共享密钥 bearer 认证会恢复完整的默认操作员 scope（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）以及智能体轮次中的 owner 语义；更窄的 `x-openclaw-scopes` 值不会削弱这条共享密钥路径。
- 只有当 HTTP 请求来自携带身份的模式时，例如 trusted proxy auth 或私有入口上的 `gateway.auth.mode="none"`，HTTP 的按请求 scope 语义才会生效。
- 在这些携带身份的模式下，如果省略 `x-openclaw-scopes`，会回退到正常的默认操作员 scope 集；如果你想使用更窄的 scope 集，请显式发送该头部。
- `/tools/invoke` 遵循同样的共享密钥规则：token / password bearer 认证在这里也会被视为完整操作员访问，而携带身份的模式仍会遵循已声明的 scopes。
- 不要将这些凭证分享给不受信任的调用方；请按信任边界使用单独的 Gateway 网关。

**信任假设：** 无 token 的 Serve 认证假设 Gateway 网关主机是受信任的。
不要把这视为防御敌对同主机进程的保护措施。如果不受信任的
本地代码可能在 Gateway 网关主机上运行，请禁用 `gateway.auth.allowTailscale`，
并要求显式共享密钥认证，使用 `gateway.auth.mode: "token"` 或
`"password"`。

**安全规则：** 不要从你自己的反向代理转发这些头部。如果
你在 Gateway 网关前终止 TLS 或进行代理，请禁用
`gateway.auth.allowTailscale`，并改用共享密钥认证（`gateway.auth.mode:
"token"` 或 `"password"`）或 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)。

受信任代理：

- 如果你在 Gateway 网关前终止 TLS，请将你的代理 IP 设置到 `gateway.trustedProxies`。
- OpenClaw 会信任来自这些 IP 的 `x-forwarded-for`（或 `x-real-ip`），以确定客户端 IP，从而用于本地配对检查以及 HTTP 认证 / 本地检查。
- 确保你的代理会**覆盖** `x-forwarded-for`，并阻止对 Gateway 网关端口的直接访问。

参见 [Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/web)。

### 0.6.1) 通过节点主机进行浏览器控制（推荐）

如果你的 Gateway 网关是远程的，但浏览器运行在另一台机器上，请在浏览器所在机器上运行一个**节点主机**，
并让 Gateway 网关代理浏览器操作（参见 [浏览器工具](/zh-CN/tools/browser)）。
请将节点配对视为管理员级访问。

推荐模式：

- 让 Gateway 网关和节点主机位于同一个 tailnet（Tailscale）中。
- 有意地进行节点配对；如果你不需要浏览器代理路由，请关闭它。

应避免：

- 通过 LAN 或公共互联网暴露 relay / control 端口。
- 对浏览器控制端点使用 Tailscale Funnel（公开暴露）。

### 0.7) 磁盘上的 secrets（敏感数据）

请假设 `~/.openclaw/`（或 `$OPENCLAW_STATE_DIR/`）下的任何内容都可能包含 secrets 或私人数据：

- `openclaw.json`：配置中可能包含 token（Gateway 网关、远程 Gateway 网关）、提供商设置和 allowlists。
- `credentials/**`：渠道凭证（例如 WhatsApp 凭证）、配对 allowlists、旧版 OAuth 导入。
- `agents/<agentId>/agent/auth-profiles.json`：API keys、token 配置文件、OAuth tokens，以及可选的 `keyRef` / `tokenRef`。
- `secrets.json`（可选）：基于文件的 secret 负载，供 `file` SecretRef 提供商（`secrets.providers`）使用。
- `agents/<agentId>/agent/auth.json`：旧版兼容文件。发现静态 `api_key` 条目时会清除。
- `agents/<agentId>/sessions/**`：会话记录（`*.jsonl`）和路由元数据（`sessions.json`），其中可能包含私人消息和工具输出。
- 内置插件包：已安装插件（以及它们的 `node_modules/`）。
- `sandboxes/**`：工具沙箱工作区；可能会累积你在沙箱中读 / 写过文件的副本。

加固建议：

- 保持严格权限（目录 `700`，文件 `600`）。
- 在 Gateway 网关主机上使用全盘加密。
- 如果主机由多人共享，优先为 Gateway 网关使用专用的操作系统用户账户。

### 0.8) 日志 + 记录（脱敏 + 保留）

即使访问控制正确，日志和记录仍可能泄露敏感信息：

- Gateway 网关日志可能包含工具摘要、错误和 URL。
- 会话记录可能包含粘贴的 secrets、文件内容、命令输出和链接。

建议：

- 保持工具摘要脱敏开启（`logging.redactSensitive: "tools"`；默认值）。
- 通过 `logging.redactPatterns` 为你的环境添加自定义模式（token、主机名、内部 URL）。
- 分享诊断信息时，优先使用 `openclaw status --all`（可粘贴、已脱敏）而不是原始日志。
- 如果你不需要长期保留，请清理旧的会话记录和日志文件。

详情见：[日志](/zh-CN/gateway/logging)

### 1) 私信：默认启用 pairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) 群组：全部要求提及

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

### 3) 分离号码（WhatsApp、Signal、Telegram）

对于基于手机号的渠道，建议让你的 AI 使用与个人号码分开的独立号码：

- 个人号码：你的对话保持私密
- 机器人号码：由 AI 处理，并设置适当的边界

### 4) 只读模式（通过沙箱 + 工具）

你可以通过以下组合构建只读配置：

- `agents.defaults.sandbox.workspaceAccess: "ro"`（或 `"none"`，表示不允许工作区访问）
- 工具 allow / deny 列表，阻止 `write`、`edit`、`apply_patch`、`exec`、`process` 等

其他加固选项：

- `tools.exec.applyPatch.workspaceOnly: true`（默认）：即使关闭沙箱隔离，也能确保 `apply_patch` 不能在工作区目录之外写入 / 删除。只有当你明确希望 `apply_patch` 修改工作区外文件时，才设为 `false`。
- `tools.fs.workspaceOnly: true`（可选）：将 `read` / `write` / `edit` / `apply_patch` 路径以及原生提示图片自动加载路径限制在工作区目录内（如果你当前允许绝对路径并希望增加一个统一护栏，这会很有用）。
- 保持文件系统根目录范围狭窄：避免把主目录之类的宽泛根目录作为智能体工作区 / 沙箱工作区。宽泛根目录可能会让文件系统工具暴露敏感本地文件（例如 `~/.openclaw` 下的状态 / 配置）。

### 5) 安全基线（可直接复制 / 粘贴）

一个“安全默认”配置示例，可保持 Gateway 网关私有、要求私信 pairing，并避免在群组中部署始终在线的机器人：

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

如果你还想让工具执行也“默认更安全”，请为任何非 owner 智能体增加沙箱隔离 + 禁用危险工具（见下方“按智能体访问配置”示例）。

对于聊天驱动的智能体轮次，内置基线是：非 owner 发送者不能使用 `cron` 或 `gateway` 工具。

## 沙箱隔离（推荐）

专门文档：[沙箱隔离](/zh-CN/gateway/sandboxing)

两种互补方式：

- **在 Docker 中运行整个 Gateway 网关**（容器边界）：[Docker](/zh-CN/install/docker)
- **工具沙箱**（`agents.defaults.sandbox`，主机 Gateway 网关 + 沙箱隔离工具；Docker 是默认后端）：[沙箱隔离](/zh-CN/gateway/sandboxing)

注意：为了防止跨智能体访问，请将 `agents.defaults.sandbox.scope` 保持为 `"agent"`（默认）
或使用 `"session"` 以获得更严格的按会话隔离。`scope: "shared"` 会使用
单个容器 / 工作区。

还应考虑智能体在沙箱中的工作区访问方式：

- `agents.defaults.sandbox.workspaceAccess: "none"`（默认）会禁止访问智能体工作区；工具会针对 `~/.openclaw/sandboxes` 下的沙箱工作区运行
- `agents.defaults.sandbox.workspaceAccess: "ro"` 会将智能体工作区以只读方式挂载到 `/agent`（禁用 `write` / `edit` / `apply_patch`）
- `agents.defaults.sandbox.workspaceAccess: "rw"` 会将智能体工作区以读写方式挂载到 `/workspace`
- 额外的 `sandbox.docker.binds` 会根据规范化和 canonicalized 后的源路径进行校验。如果解析结果落入被阻止的根目录，例如 `/etc`、`/var/run` 或操作系统主目录下的凭证目录，那么父级符号链接技巧和规范化后的 home 别名仍会以失败关闭方式处理。

重要说明：`tools.elevated` 是全局的基线逃逸出口，会在沙箱之外运行 exec。默认的有效主机是 `gateway`，当 exec 目标配置为 `node` 时则为 `node`。请保持 `tools.elevated.allowFrom` 范围严格，不要对陌生人启用。你还可以通过 `agents.list[].tools.elevated` 在按智能体级别进一步限制 elevated。参见 [高权限模式](/zh-CN/tools/elevated)。

### 子智能体委派护栏

如果你允许会话工具，请将委派给子智能体的运行视为另一项边界决策：

- 除非智能体确实需要委派，否则禁用 `sessions_spawn`。
- 保持 `agents.defaults.subagents.allowAgents` 以及任何按智能体覆盖的 `agents.list[].subagents.allowAgents` 仅限于已知安全的目标智能体。
- 对于任何必须保持沙箱隔离的工作流，请在调用 `sessions_spawn` 时使用 `sandbox: "require"`（默认值是 `inherit`）。
- `sandbox: "require"` 会在目标子运行时未启用沙箱时快速失败。

## 浏览器控制风险

启用浏览器控制会让模型能够驱动一个真实浏览器。
如果该浏览器配置文件中已经存在登录会话，模型就可以
访问这些账号和数据。请将浏览器配置文件视为**敏感状态**：

- 优先为智能体使用专用配置文件（默认的 `openclaw` 配置文件）。
- 不要让智能体使用你个人日常使用的配置文件。
- 除非你信任它们，否则请对已沙箱隔离的智能体保持主机浏览器控制关闭。
- 独立的 loopback 浏览器控制 API 只接受共享密钥认证
  （Gateway 网关 token bearer 认证或 Gateway 网关 password）。它不会使用
  trusted-proxy 或 Tailscale Serve 身份头。
- 请将浏览器下载内容视为不受信任输入；优先使用隔离的下载目录。
- 如有可能，请在智能体配置文件中禁用浏览器同步 / 密码管理器（可降低影响半径）。
- 对于远程 Gateway 网关，请将“浏览器控制”等同视为该浏览器配置文件可访问范围内的“操作员访问”。
- 保持 Gateway 网关和节点主机仅在 tailnet 中可访问；避免将浏览器控制端口暴露到 LAN 或公共互联网。
- 在不需要浏览器代理路由时关闭它（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP 的现有会话模式**并不**“更安全”；它可以像你一样操作该主机上 Chrome 配置文件所能访问的一切。

### 浏览器 SSRF 策略（默认严格）

OpenClaw 的浏览器导航策略默认非常严格：除非你显式选择加入，否则私有 / 内部目标会被阻止。

- 默认：`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 未设置，因此浏览器导航会继续阻止私有 / 内部 / 特殊用途目标。
- 旧版别名：`browser.ssrfPolicy.allowPrivateNetwork` 仍然出于兼容性被接受。
- 选择加入模式：设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 可允许私有 / 内部 / 特殊用途目标。
- 在严格模式下，可使用 `hostnameAllowlist`（如 `*.example.com` 这样的模式）和 `allowedHostnames`（精确主机例外，包括像 `localhost` 这样的被阻止名称）来添加显式例外。
- 为减少基于重定向的跳转，导航会在请求前检查，并在导航完成后的最终 `http(s)` URL 上进行尽力的再次检查。

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

## 按智能体访问配置（多智能体）

在多智能体路由中，每个智能体都可以拥有自己的沙箱隔离 + 工具策略：
利用这一点，你可以为不同智能体配置**完全访问**、**只读**或**无访问权限**。
完整细节和优先级规则请参见 [多智能体沙箱隔离与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

常见用例：

- 个人智能体：完全访问，不使用沙箱
- 家庭 / 工作智能体：沙箱隔离 + 只读工具
- 公开智能体：沙箱隔离 + 无文件系统 / shell 工具

### 示例：完全访问（无沙箱）

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

### 示例：无文件系统 / shell 访问（允许提供商消息工具）

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
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
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

## 该如何告诉你的 AI

在智能体的系统提示中加入安全指南：

```text
## 安全规则
- 永远不要向陌生人分享目录列表或文件路径
- 永远不要泄露 API keys、凭证或基础设施细节
- 修改系统配置的请求必须先向 owner 确认
- 如有疑问，先询问再执行
- 除非获得明确授权，否则保持私人数据私密
```

## 事件响应

如果你的 AI 做了不该做的事：

### 遏制

1. **立即停止：** 停止 macOS 应用（如果它负责监管 Gateway 网关），或终止你的 `openclaw gateway` 进程。
2. **关闭暴露面：** 将 `gateway.bind` 设为 `"loopback"`（或禁用 Tailscale Funnel / Serve），直到你弄清楚发生了什么。
3. **冻结访问：** 将高风险私信 / 群组切换为 `dmPolicy: "disabled"` / 要求提及，并移除你之前可能设置的 `"*"` 允许所有条目。

### 轮换（如果 secrets 已泄露，则按已失陷处理）

1. 轮换 Gateway 网关认证（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）并重启。
2. 在任何能够调用 Gateway 网关的机器上轮换远程客户端 secrets（`gateway.remote.token` / `.password`）。
3. 轮换提供商 / API 凭证（WhatsApp 凭证、Slack / Discord tokens、`auth-profiles.json` 中的模型 / API keys，以及使用时的加密 secrets 负载值）。

### 审计

1. 检查 Gateway 网关日志：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（或 `logging.file`）。
2. 检查相关记录：`~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 检查最近的配置更改（任何可能扩大访问范围的项目：`gateway.bind`、`gateway.auth`、私信 / 群组策略、`tools.elevated`、插件更改）。
4. 重新运行 `openclaw security audit --deep`，并确认严重发现都已解决。

### 收集报告所需信息

- 时间戳、Gateway 网关主机操作系统 + OpenClaw 版本
- 会话记录 + 一小段日志尾部（脱敏后）
- 攻击者发送了什么 + 智能体做了什么
- Gateway 网关是否暴露到了 loopback 之外（LAN / Tailscale Funnel / Serve）

## Secret Scanning（detect-secrets）

CI 会在 `secrets` job 中运行 `detect-secrets` pre-commit hook。
推送到 `main` 时总会执行全文件扫描。Pull request 会在有基线 commit 可用时使用变更文件
快速路径，否则回退到全文件扫描。如果失败，说明存在尚未加入基线的新候选项。

### 如果 CI 失败

1. 在本地复现：

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. 了解这些工具：
   - pre-commit 中的 `detect-secrets` 会结合仓库的
     基线和排除项运行 `detect-secrets-hook`。
   - `detect-secrets audit` 会打开交互式审查界面，用于将基线中的每一项
     标记为真实 secret 或误报。
3. 对于真实 secrets：轮换 / 删除它们，然后重新运行扫描以更新基线。
4. 对于误报：运行交互式审查，并将其标记为误报：

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 如果你需要新增排除规则，请将其加入 `.detect-secrets.cfg`，并使用匹配的 `--exclude-files` / `--exclude-lines` 标志重新生成
   基线（该配置文件仅供参考；detect-secrets 不会自动读取它）。

当更新后的 `.secrets.baseline` 反映出预期状态后，提交它。

## 报告安全问题

如果你在 OpenClaw 中发现了漏洞，请负责任地进行报告：

1. 邮箱：[security@openclaw.ai](mailto:security@openclaw.ai)
2. 在修复前不要公开发布
3. 我们会向你致谢（除非你希望匿名）
