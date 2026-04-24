---
read_when:
    - 添加会扩大访问范围或自动化能力的功能
summary: 运行具备 shell 访问权限的 AI Gateway 网关时的安全注意事项与威胁模型
title: 安全
x-i18n:
    generated_at: "2026-04-24T18:08:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b5825973aadca0ac818465c47055585f3d2503b54961e3ddad02ae2517d47cc
    source_path: gateway/security/index.md
    workflow: 15
---

<Warning>
  **个人助理信任模型。** 本指南假设每个 Gateway 网关对应一个受信任的操作员边界（单用户、个人助理模型）。
  OpenClaw **不是** 供多个敌对用户共享同一个智能体或 Gateway 网关时使用的敌对多租户安全边界。
  如果你需要混合信任或敌对用户运行，请拆分信任边界（单独的 Gateway 网关 + 凭证，最好再分配单独的 OS 用户或主机）。
</Warning>

## 先明确范围：个人助理安全模型

OpenClaw 的安全指南基于**个人助理**部署：一个受信任的操作员边界，可能包含多个智能体。

- 支持的安全姿态：每个 Gateway 网关 对应一个用户 / 信任边界（最好每个边界使用一个 OS 用户 / 主机 / VPS）。
- 不受支持的安全边界：一个共享的 Gateway 网关 / 智能体，供彼此不受信任或具有对抗关系的用户共同使用。
- 如果需要敌对用户隔离，请按信任边界拆分（单独的 Gateway 网关 + 凭证，理想情况下还应使用单独的 OS 用户 / 主机）。
- 如果多个不受信任的用户都可以向同一个启用了工具的智能体发送消息，应视为他们共享该智能体所委派的同一组工具权限。

本页说明的是**在该模型之内**如何加固。它并不声称单个共享 Gateway 网关 可以实现敌对多租户隔离。

## 快速检查：`openclaw security audit`

另请参见：[Formal Verification（安全模型）](/zh-CN/security/formal-verification)

请定期运行此命令（尤其是在修改配置或暴露网络接口之后）：

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` 的范围被刻意保持得较窄：它会将常见的开放组策略切换为允许列表，恢复 `logging.redactSensitive: "tools"`，收紧状态 / 配置 / include 文件的权限，并且在 Windows 上运行时使用 Windows ACL 重置，而不是 POSIX `chmod`。

它会标记常见的易踩坑项（Gateway 网关认证暴露、浏览器控制暴露、高权限允许列表、文件系统权限、宽松的 exec 审批，以及开放渠道中的工具暴露）。

OpenClaw 同时是一个产品和一个实验：你正在把前沿模型的行为接入真实的消息界面和真实工具。**不存在“绝对安全”的配置。** 目标是有意识地明确以下事项：

- 谁可以和你的机器人交互
- 机器人被允许在什么地方执行操作
- 机器人可以接触什么内容

从仍然可用的最小权限开始，然后随着信心增加再逐步放宽。

### 部署与主机信任

OpenClaw 假定主机和配置边界是受信任的：

- 如果某人可以修改 Gateway 网关主机状态 / 配置（`~/.openclaw`，包括 `openclaw.json`），就应将其视为受信任的操作员。
- 为多个彼此不受信任 / 具有对抗关系的操作员运行同一个 Gateway 网关，**不是推荐的设置**。
- 对于混合信任团队，请用单独的 Gateway 网关 拆分信任边界（至少也要使用单独的 OS 用户 / 主机）。
- 推荐默认方式：每台机器 / 主机（或 VPS）一个用户、该用户一个 Gateway 网关、该 Gateway 网关 中一个或多个智能体。
- 在同一个 Gateway 网关实例中，经过认证的操作员访问属于受信任的控制平面角色，而不是按用户划分的租户角色。
- 会话标识符（`sessionKey`、session ID、label）是路由选择器，不是授权令牌。
- 如果多人都可以向同一个启用了工具的智能体发送消息，那么他们每个人都可以驱动同一组权限。按用户隔离会话 / 记忆有助于隐私，但并不会把一个共享智能体变成按用户划分的主机授权边界。

### 共享 Slack 工作区：真实风险

如果“Slack 中的所有人都可以给机器人发消息”，核心风险是委派工具权限：

- 任何被允许的发送者都可以在该智能体策略允许的范围内诱导工具调用（`exec`、浏览器、网络 / 文件工具）；
- 来自某个发送者的提示 / 内容注入可能导致影响共享状态、设备或输出的操作；
- 如果某个共享智能体持有敏感凭证 / 文件，那么任何被允许的发送者都可能通过工具使用驱动数据外泄。

对于团队工作流，请使用工具最少的独立智能体 / Gateway 网关；个人数据智能体应保持私有。

### 公司共享智能体：可接受模式

当使用该智能体的所有人都处于同一个信任边界内（例如同一个公司团队），并且该智能体的范围被严格限制在业务用途时，这是可接受的。

- 在专用机器 / VM / 容器上运行它；
- 为该运行时使用专用的 OS 用户 + 专用浏览器 / 配置文件 / 账户；
- 不要让该运行时登录个人 Apple / Google 账户，也不要使用个人密码管理器 / 浏览器配置文件。

如果你在同一个运行时中混用个人身份和公司身份，就会破坏隔离，并增加个人数据暴露风险。

## Gateway 网关与节点信任概念

应将 Gateway 网关 和节点视为同一个操作员信任域中的不同角色：

- **Gateway 网关** 是控制平面和策略界面（`gateway.auth`、工具策略、路由）。
- **节点** 是与该 Gateway 网关 配对的远程执行界面（命令、设备操作、主机本地能力）。
- 通过 Gateway 网关 认证的调用方，在 Gateway 网关 范围内是受信任的。配对之后，节点操作属于该节点上的受信任操作员操作。
- `sessionKey` 是路由 / 上下文选择机制，不是按用户划分的认证。
- Exec 审批（允许列表 + 询问）是针对操作员意图的护栏，不是敌对多租户隔离。
- 对于受信任的单操作员设置，OpenClaw 的产品默认值是：在 `gateway` / `node` 上的主机 exec 无需审批提示即可允许（`security="full"`、`ask="off"`，除非你主动收紧）。这是有意设计的 UX 默认值，本身并不是漏洞。
- Exec 审批会绑定精确的请求上下文以及尽力识别的直接本地文件操作数；它不会对每一种运行时 / 解释器加载路径进行语义建模。若要实现强边界，请使用沙箱隔离和主机隔离。

如果你需要敌对用户隔离，请按 OS 用户 / 主机拆分信任边界，并运行单独的 Gateway 网关。

## 信任边界矩阵

在进行风险分级时，可将其作为快速模型：

| 边界或控制项 | 含义 | 常见误解 |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth`（token / password / trusted-proxy / device auth） | 对 Gateway 网关 API 的调用方进行认证 | “要安全，就必须对每一帧消息都做逐条签名” |
| `sessionKey` | 用于上下文 / 会话选择的路由键 | “Session key 是用户认证边界” |
| 提示 / 内容护栏 | 降低模型被滥用的风险 | “只要有提示注入就证明发生了认证绕过” |
| `canvas.eval` / 浏览器 evaluate | 启用时属于有意提供给操作员的能力 | “在这种信任模型下，任何 JS eval 原语都会自动构成漏洞” |
| 本地 TUI `!` shell | 由操作员显式触发的本地执行 | “本地 shell 便捷命令就是远程注入” |
| 节点配对与节点命令 | 对已配对设备进行操作员级别的远程执行 | “远程设备控制默认应视为不受信任用户访问” |

## 按设计不属于漏洞的情况

<Accordion title="通常超出范围的常见发现">

这些模式经常被报告；除非能证明存在真实的边界绕过，否则通常会被关闭且不采取行动：

- 仅有提示注入链条，但没有策略、认证或沙箱隔离绕过。
- 基于“单个共享主机或配置上存在敌对多租户运行”这一假设提出的主张。
- 在共享 Gateway 网关 设置中，将正常的操作员读取路径访问（例如
  `sessions.list` / `sessions.preview` / `chat.history`）归类为 IDOR 的主张。
- 仅限 localhost 部署的发现（例如仅 loopback Gateway 网关 上的 HSTS）。
- 针对本仓库中并不存在的入站路径而提出的 Discord 入站 webhook 签名问题。
- 将节点配对元数据视为 `system.run` 的隐藏第二层逐命令审批机制的报告，而实际执行边界仍然是 Gateway 网关 的全局节点命令策略加上节点自己的 exec 审批。
- 将 `sessionKey` 当作认证令牌来认定“缺少按用户授权”的发现。

</Accordion>

## 60 秒内建立加固基线

先使用此基线，然后再按受信任智能体有选择地重新启用工具：

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

这会将 Gateway 网关 保持为仅本地访问，隔离私信，并默认禁用控制平面 / 运行时工具。

## 共享收件箱快速规则

如果不止一个人可以给你的机器人发送私信：

- 设置 `session.dmScope: "per-channel-peer"`（对于多账户渠道，可用 `"per-account-channel-peer"`）。
- 保持 `dmPolicy: "pairing"` 或严格的允许列表。
- 绝不要将共享私信与广泛的工具访问结合使用。
- 这能加固协作式 / 共享收件箱，但并不是为用户共享主机 / 配置写权限时的敌对共租户隔离而设计的。

## 上下文可见性模型

OpenClaw 区分两个概念：

- **触发授权**：谁可以触发智能体（`dmPolicy`、`groupPolicy`、允许列表、提及门槛）。
- **上下文可见性**：哪些补充上下文会注入到模型输入中（回复正文、引用文本、线程历史、转发元数据）。

允许列表控制触发和命令授权。`contextVisibility` 设置控制补充上下文（引用回复、线程根消息、已抓取历史）如何被过滤：

- `contextVisibility: "all"`（默认）会保留接收到的全部补充上下文。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅包含通过活动允许列表检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为与 `allowlist` 类似，但仍会保留一条显式引用的回复。

可按渠道或按房间 / 会话设置 `contextVisibility`。配置详情请参见 [群聊](/zh-CN/channels/groups#context-visibility-and-allowlists)。

安全通告分级指导：

- 仅展示“模型可以看到来自未在允许列表中的发送者的引用文本或历史文本”的主张，属于可通过 `contextVisibility` 处理的加固发现，本身并不构成认证或沙箱隔离边界绕过。
- 若要具有真正的安全影响，报告仍需要证明存在信任边界绕过（认证、策略、沙箱隔离、审批，或其他已记录的边界）。

## 审计会检查什么（高层级）

- **入站访问**（私信策略、群组策略、允许列表）：陌生人能否触发机器人？
- **工具影响半径**（高权限工具 + 开放房间）：提示注入是否可能演变为 shell / 文件 / 网络操作？
- **Exec 审批漂移**（`security=full`、`autoAllowSkills`、未启用 `strictInlineEval` 的解释器允许列表）：主机 exec 护栏是否仍然按照你的预期工作？
  - `security="full"` 是一种广泛姿态警告，并不证明存在 bug。它是受信任个人助理设置下的默认选择；只有当你的威胁模型需要审批或允许列表护栏时，才应收紧它。
- **网络暴露**（Gateway 网关 bind / auth、Tailscale Serve / Funnel、弱或过短的认证令牌）。
- **浏览器控制暴露**（远程节点、中继端口、远程 CDP 端点）。
- **本地磁盘卫生**（权限、符号链接、配置 include、`synced folder` 路径）。
- **插件**（插件在没有显式允许列表的情况下加载）。
- **策略漂移 / 配置错误**（配置了 sandbox docker 设置但未开启沙箱模式；由于匹配仅基于精确命令名而不检查 shell 文本，导致 `gateway.nodes.denyCommands` 模式无效，例如 `system.run`；危险的 `gateway.nodes.allowCommands` 条目；全局 `tools.profile="minimal"` 被按智能体配置覆盖；插件拥有的工具可通过宽松工具策略访问）。
- **运行时预期漂移**（例如假设隐式 exec 仍表示 `sandbox`，而 `tools.exec.host` 现在默认是 `auto`；或在沙箱模式关闭时显式设置 `tools.exec.host="sandbox"`）。
- **模型卫生**（当已配置模型看起来属于旧版时发出警告；不是硬性阻止）。

如果你运行 `--deep`，OpenClaw 还会尽力尝试执行实时 Gateway 网关探测。

## 凭证存储映射

在审计访问权限或决定备份内容时，可参考此列表：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：config / env 或 `channels.telegram.tokenFile`（仅常规文件；拒绝符号链接）
- **Discord bot token**：config / env 或 SecretRef（`env` / `file` / `exec` 提供商）
- **Slack 令牌**：config / env（`channels.slack.*`）
- **配对允许列表**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账户）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账户）
- **模型认证配置文件**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **基于文件的 secrets 负载（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`

## 安全审计检查清单

当审计输出发现项时，请按以下优先级处理：

1. **任何“开放” + 已启用工具**：先锁定私信 / 群组（配对 / 允许列表），然后收紧工具策略 / 沙箱隔离。
2. **公共网络暴露**（LAN bind、Funnel、缺少认证）：立即修复。
3. **浏览器控制远程暴露**：将其视为操作员访问（仅 tailnet、谨慎配对节点、避免公开暴露）。
4. **权限**：确保状态 / 配置 / 凭证 / 认证内容不对组用户 / 所有人可读。
5. **插件**：仅加载你明确信任的插件。
6. **模型选择**：对于任何带工具的机器人，优先选择现代、对指令注入更稳健的模型。

## 安全审计术语表

每个审计发现项都由结构化的 `checkId` 标识（例如
`gateway.bind_no_auth` 或 `tools.exec.security_full_configured`）。常见的严重等级类别包括：

- `fs.*` — 状态、配置、凭证、认证配置文件的文件系统权限。
- `gateway.*` — bind 模式、认证、Tailscale、Control UI、trusted-proxy 设置。
- `hooks.*`、`browser.*`、`sandbox.*`、`tools.exec.*` — 各个界面的加固检查。
- `plugins.*`、`skills.*` — plugin / skill 供应链和扫描发现项。
- `security.exposure.*` — 访问策略与工具影响半径相交的跨领域检查。

完整目录（包括严重性级别、修复键和自动修复支持）请参见
[安全审计检查项](/zh-CN/gateway/security/audit-checks)。

## 通过 HTTP 使用 Control UI

Control UI 需要**安全上下文**（HTTPS 或 localhost）才能生成设备身份。
`gateway.controlUi.allowInsecureAuth` 是一个本地兼容性开关：

- 在 localhost 上，它允许页面通过非安全 HTTP 加载时，Control UI 在没有设备身份的情况下进行认证。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

优先使用 HTTPS（Tailscale Serve），或在 `127.0.0.1` 上打开 UI。

仅在紧急破窗场景下，`gateway.controlUi.dangerouslyDisableDeviceAuth`
会完全禁用设备身份检查。这是一次严重的安全降级；除非你正在积极调试并且能够迅速恢复，否则不要开启。

与这些危险标志分开的是，成功的 `gateway.auth.mode: "trusted-proxy"`
可以允许**操作员** Control UI 会话在没有设备身份的情况下接入。这是认证模式的有意行为，不是 `allowInsecureAuth` 的快捷方式，而且它仍然不适用于节点角色的 Control UI 会话。

启用该设置时，`openclaw security audit` 会发出警告。

## 不安全或危险标志摘要

当已知不安全 / 危险的调试开关被启用时，
`openclaw security audit` 会触发 `config.insecure_or_dangerous_flags`。在生产环境中请保持这些值未设置。

<AccordionGroup>
  <Accordion title="当前由审计跟踪的标志">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`
  </Accordion>

  <Accordion title="配置 schema 中所有 `dangerous*` / `dangerously*` 键">
    Control UI 和浏览器：

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    渠道名称匹配（内置和插件渠道；在适用情况下，每个
    `accounts.<accountId>` 下也可用）：

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching`（插件渠道）
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（插件渠道）
    - `channels.zalouser.dangerouslyAllowNameMatching`（插件渠道）
    - `channels.irc.dangerouslyAllowNameMatching`（插件渠道）
    - `channels.mattermost.dangerouslyAllowNameMatching`（插件渠道）

    网络暴露：

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork`（每个账户下也可设置）

    沙箱 Docker（默认值 + 按智能体）：

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## 反向代理配置

如果你在反向代理（nginx、Caddy、Traefik 等）后运行 Gateway 网关，请配置
`gateway.trustedProxies`，以正确处理转发的客户端 IP。

当 Gateway 网关 检测到来自**不在** `trustedProxies` 中的地址的代理头时，它**不会**将连接视为本地客户端。如果 Gateway 网关 认证被禁用，这些连接会被拒绝。这样可以防止认证绕过：否则，被代理的连接可能看起来像是来自 localhost，从而自动获得信任。

`gateway.trustedProxies` 也会用于 `gateway.auth.mode: "trusted-proxy"`，但该认证模式更严格：

- trusted-proxy auth **对来自 loopback 源的代理采用失败即关闭**
- 同主机 loopback 反向代理仍可使用 `gateway.trustedProxies` 进行本地客户端检测和转发 IP 处理
- 对于同主机 loopback 反向代理，应使用 token / password 认证，而不是 `gateway.auth.mode: "trusted-proxy"`

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

配置了 `trustedProxies` 后，Gateway 网关 会使用 `X-Forwarded-For` 来确定客户端 IP。默认情况下会忽略 `X-Real-IP`，除非显式设置 `gateway.allowRealIpFallback: true`。

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

- OpenClaw Gateway 网关 优先用于本地 / loopback。若你在反向代理处终止 TLS，请在该代理所面对的 HTTPS 域名上设置 HSTS。
- 如果由 Gateway 网关 自身终止 HTTPS，你可以设置 `gateway.http.securityHeaders.strictTransportSecurity`，让 OpenClaw 在响应中发出 HSTS 头。
- 详细部署指南请参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)。
- 对于非 loopback 的 Control UI 部署，默认要求设置 `gateway.controlUi.allowedOrigins`。
- `gateway.controlUi.allowedOrigins: ["*"]` 是一个显式的“允许所有”浏览器来源策略，不是加固后的默认值。除严格受控的本地测试外，应避免使用。
- 即使启用了一般性的 loopback 豁免，loopback 上的浏览器来源认证失败仍会受到限速，但锁定键会按规范化后的 `Origin` 值划分，而不是共享一个 localhost 桶。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用基于 Host 头的来源回退模式；应将其视为由操作员主动选择的危险策略。
- 应将 DNS 重绑定和代理 Host 头行为视为部署加固问题；保持 `trustedProxies` 严格，并避免将 Gateway 网关 直接暴露到公共互联网。

## 本地会话日志保存在磁盘上

OpenClaw 会将会话转录内容存储在磁盘上的 `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
这是实现会话连续性以及（可选的）会话记忆索引所必需的，但这也意味着
**任何拥有文件系统访问权限的进程 / 用户都可以读取这些日志**。应将磁盘访问视为信任边界，并锁定 `~/.openclaw` 的权限（见下方审计部分）。如果你需要更强的智能体间隔离，请将它们运行在单独的 OS 用户或单独的主机下。

## 节点执行（`system.run`）

如果已配对 macOS 节点，Gateway 网关 可以在该节点上调用 `system.run`。这就是在该 Mac 上的**远程代码执行**：

- 需要节点配对（审批 + 令牌）。
- Gateway 网关节点配对不是逐命令审批界面。它建立的是节点身份 / 信任以及令牌签发。
- Gateway 网关 通过 `gateway.nodes.allowCommands` / `denyCommands` 应用粗粒度的全局节点命令策略。
- 在 Mac 上通过**设置 → Exec 审批**进行控制（security + ask + allowlist）。
- 每个节点的 `system.run` 策略由节点自己的 exec 审批文件（`exec.approvals.node.*`）决定，它可以比 Gateway 网关 的全局命令 ID 策略更严格，也可以更宽松。
- 以 `security="full"` 和 `ask="off"` 运行的节点遵循的是默认的受信任操作员模型。除非你的部署明确需要更严格的审批或允许列表策略，否则应将其视为预期行为。
- 审批模式会绑定精确的请求上下文，并在可能时绑定一个具体的本地脚本 / 文件操作数。如果 OpenClaw 无法为解释器 / 运行时命令精确识别出唯一的直接本地文件，则会拒绝基于审批的执行，而不是承诺完整的语义覆盖。
- 对于 `host=node`，基于审批的运行还会存储一个规范化的已准备
  `systemRunPlan`；后续已批准的转发会复用该已存储计划，并且 Gateway 网关
  验证会拒绝在审批请求创建后由调用方修改 command / cwd / session 上下文。
- 如果你不想要远程执行，请将 security 设置为 **deny**，并移除该 Mac 的节点配对。

这种区分对于分级很重要：

- 一个重新连接的已配对节点宣告了不同的命令列表，这本身并不构成漏洞，只要 Gateway 网关 的全局策略和节点本地 exec 审批仍然执行着真实的执行边界。
- 将节点配对元数据视为第二层隐藏逐命令审批机制的报告，通常属于策略 / UX 混淆，而不是安全边界绕过。

## 动态 Skills（watcher / 远程节点）

OpenClaw 可以在会话中途刷新 Skills 列表：

- **Skills watcher**：对 `SKILL.md` 的更改可在下一次智能体轮次更新 Skills 快照。
- **远程节点**：连接 macOS 节点后，可能使仅限 macOS 的 Skills 变得可用（基于二进制探测）。

请将 skill 文件夹视为**受信任代码**，并限制谁可以修改它们。

## 威胁模型

你的 AI 助手可以：

- 执行任意 shell 命令
- 读写文件
- 访问网络服务
- 给任何人发送消息（如果你给了它 WhatsApp 访问权限）

给你发消息的人可以：

- 试图诱导你的 AI 做坏事
- 通过社会工程获取你的数据访问权
- 探测基础设施细节

## 核心概念：先做访问控制，再谈智能

这里的大多数失败都不是什么高级攻击——而是“有人给机器人发了消息，机器人照做了”。

OpenClaw 的立场：

- **身份优先：** 先决定谁可以和机器人对话（私信配对 / 允许列表 / 显式 `open`）。
- **范围其次：** 再决定机器人被允许在哪里执行操作（群组允许列表 + 提及门槛、工具、沙箱隔离、设备权限）。
- **模型最后：** 假设模型是可以被操纵的；设计时要让这种操纵的影响半径有限。

## 命令授权模型

斜杠命令和指令只会对**已授权发送者**生效。授权来源于
渠道允许列表 / 配对以及 `commands.useAccessGroups`（参见 [配置](/zh-CN/gateway/configuration)
和 [斜杠命令](/zh-CN/tools/slash-commands)）。如果某个渠道允许列表为空或包含 `"*"`，
则该渠道上的命令实际上是开放的。

`/exec` 是仅限会话的便捷功能，供已授权操作员使用。它**不会**写入配置，也**不会**更改其他会话。

## 控制平面工具风险

有两个内置工具可以进行持久化控制平面变更：

- `gateway` 可以通过 `config.schema.lookup` / `config.get` 检查配置，也可以通过 `config.apply`、`config.patch` 和 `update.run` 进行持久化更改。
- `cron` 可以创建定时作业，即使原始聊天 / 任务结束后，这些作业仍会继续运行。

仅限 owner 的 `gateway` 运行时工具仍然拒绝重写
`tools.exec.ask` 或 `tools.exec.security`；旧版 `tools.bash.*` 别名在写入前也会被规范化到同样受保护的 exec 路径。
由智能体驱动的 `gateway config.apply` 和 `gateway config.patch` 编辑默认采用失败即关闭：只有一小部分 prompt、模型和提及门槛路径可由智能体调整。
因此，新的敏感配置树默认会受到保护，除非它们被有意加入允许列表。

对于任何处理不受信任内容的智能体 / 界面，默认应拒绝这些工具：

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` 只会阻止重启动作。它不会禁用 `gateway` 配置 / 更新操作。

## 插件

插件会**在进程内**与 Gateway 网关 一起运行。请将它们视为受信任代码：

- 只安装来自你信任来源的插件。
- 优先使用显式 `plugins.allow` 允许列表。
- 启用前检查插件配置。
- 插件变更后重启 Gateway 网关。
- 如果你安装或更新插件（`openclaw plugins install <package>`、`openclaw plugins update <id>`），应将其视为运行不受信任代码：
  - 安装路径是活动插件安装根目录下对应插件的目录。
  - OpenClaw 会在安装 / 更新前运行内置危险代码扫描。`critical` 发现默认会阻止安装。
  - OpenClaw 会使用 `npm pack`，然后在该目录中运行 `npm install --omit=dev`（npm 生命周期脚本可能在安装期间执行代码）。
  - 优先使用固定且精确的版本（`@scope/pkg@1.2.3`），并在启用前检查磁盘上解包后的代码。
  - `--dangerously-force-unsafe-install` 仅用于插件安装 / 更新流程中内置扫描误报的破窗场景。它不会绕过插件 `before_install` 钩子策略阻止，也不会绕过扫描失败。
  - 由 Gateway 网关 支持的 skill 依赖安装遵循相同的危险 / 可疑区分：除非调用方显式设置 `dangerouslyForceUnsafeInstall`，否则内置 `critical` 发现会阻止安装，而可疑发现仍然只会发出警告。`openclaw skills install` 仍然是单独的 ClawHub skill 下载 / 安装流程。

详情请参见：[插件](/zh-CN/tools/plugin)

## 私信访问模型：配对、允许列表、开放、禁用

当前所有支持私信的渠道都支持一个私信策略（`dmPolicy` 或 `*.dm.policy`），它会在消息被处理**之前**限制入站私信：

- `pairing`（默认）：未知发送者会收到一个简短的配对码，且在获得批准之前，机器人会忽略其消息。配对码 1 小时后过期；重复发送私信不会重复发送配对码，直到创建新的请求。默认情况下，每个渠道最多保留 **3 个待处理请求**。
- `allowlist`：未知发送者会被阻止（没有配对握手）。
- `open`：允许任何人发送私信（公开）。**要求**该渠道允许列表包含 `"*"`（显式选择加入）。
- `disabled`：完全忽略入站私信。

通过 CLI 批准：

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

详情和磁盘文件位置请参见：[配对](/zh-CN/channels/pairing)

## 私信会话隔离（多用户模式）

默认情况下，OpenClaw 会将**所有私信路由到主会话**，这样你的助理就可以跨设备和渠道保持连续性。如果**多个人**都可以向机器人发送私信（开放私信或多人的允许列表），请考虑隔离私信会话：

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

这样可以防止跨用户上下文泄露，同时保持群聊隔离。

这是消息上下文边界，不是主机管理员边界。如果用户彼此对抗，且共享同一个 Gateway 网关主机 / 配置，请按信任边界运行独立的 Gateway 网关。

### 安全私信模式（推荐）

将上面的片段视为**安全私信模式**：

- 默认：`session.dmScope: "main"`（所有私信共享一个会话，以保持连续性）。
- 本地 CLI 新手引导默认值：在未设置时写入 `session.dmScope: "per-channel-peer"`（保留现有显式值）。
- 安全私信模式：`session.dmScope: "per-channel-peer"`（每个渠道 + 发送者组合获得独立的私信上下文）。
- 跨渠道对等隔离：`session.dmScope: "per-peer"`（同一类型的所有渠道中，每个发送者共享一个会话）。

如果你在同一渠道上运行多个账户，请改用 `per-account-channel-peer`。如果同一个人在多个渠道联系你，请使用 `session.identityLinks` 将这些私信会话合并为一个规范身份。参见 [会话管理](/zh-CN/concepts/session) 和 [配置](/zh-CN/gateway/configuration)。

## 私信和群组的允许列表

OpenClaw 具有两层彼此独立的“谁可以触发我？”机制：

- **私信允许列表**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`；旧版：`channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）：谁被允许在私信中与机器人对话。
  - 当 `dmPolicy="pairing"` 时，批准结果会写入 `~/.openclaw/credentials/` 下按账户划分的配对允许列表存储（默认账户为 `<channel>-allowFrom.json`，非默认账户为 `<channel>-<accountId>-allowFrom.json`），并与配置中的允许列表合并。
- **群组允许列表**（按渠道区分）：机器人究竟接受哪些群组 / 频道 / guild 的消息。
  - 常见模式：
    - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`：每个群组的默认项，例如 `requireMention`；设置后，它也会充当群组允许列表（如需保持“全部允许”行为，请包含 `"*"`）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`：限制在群组会话**内部**谁可以触发机器人（WhatsApp / Telegram / Signal / iMessage / Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`：按界面划分的允许列表 + 提及默认值。
  - 群组检查按以下顺序运行：先检查 `groupPolicy` / 群组允许列表，再检查提及 / 回复激活。
  - 回复机器人消息（隐式提及）**不会**绕过发送者允许列表，例如 `groupAllowFrom`。
  - **安全说明：** 应将 `dmPolicy="open"` 和 `groupPolicy="open"` 视为最后手段。它们应极少使用；除非你完全信任房间中的每个人，否则优先选择配对 + 允许列表。

详情请参见：[配置](/zh-CN/gateway/configuration) 和 [群组](/zh-CN/channels/groups)

## 提示注入（它是什么，为什么重要）

提示注入指的是攻击者精心构造一条消息，操纵模型执行不安全的操作（“忽略你的指令”“导出你的文件系统”“打开这个链接并运行命令”等）。

即使系统提示很强，**提示注入问题也尚未被解决**。系统提示护栏只是软性指导；真正的硬性约束来自工具策略、exec 审批、沙箱隔离和渠道允许列表（并且操作员按设计也可以关闭它们）。在实践中有帮助的是：

- 保持入站私信处于锁定状态（配对 / 允许列表）。
- 在群组中优先使用提及门槛；避免在公共房间中部署“始终在线”的机器人。
- 默认将链接、附件和粘贴的指令视为不受信任内容。
- 在沙箱中执行敏感工具；将 secrets 放在智能体可访问文件系统之外。
- 注意：沙箱隔离是可选启用的。如果沙箱模式关闭，隐式 `host=auto` 会解析为 Gateway 网关主机。显式 `host=sandbox` 仍会失败即关闭，因为没有可用的沙箱运行时。如果你希望在配置中明确表达该行为，请设置 `host=gateway`。
- 将高风险工具（`exec`、`browser`、`web_fetch`、`web_search`）限制给受信任的智能体或显式允许列表。
- 如果你对解释器使用允许列表（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`），请启用 `tools.exec.strictInlineEval`，这样内联 eval 形式仍需要显式审批。
- Shell 审批分析还会拒绝**未加引号 heredoc** 中的 POSIX 参数展开形式（`$VAR`、`$?`、`$$`、`$1`、`$@`、`${…}`），因此允许列表中的 heredoc 正文不能把 shell 展开伪装成纯文本绕过审查。给 heredoc 终止符加引号（例如 `<<'EOF'`）即可启用字面量正文语义；如果未加引号的 heredoc 会展开变量，则会被拒绝。
- **模型选择很重要：** 较旧 / 较小 / 旧版模型在应对提示注入和工具滥用方面明显更脆弱。对于启用了工具的智能体，请使用最新一代、最强等级、对指令更稳健的可用模型。

应视为不受信任的危险信号：

- “读取这个文件 / URL，并完全按它说的做。”
- “忽略你的系统提示或安全规则。”
- “泄露你的隐藏指令或工具输出。”
- “粘贴 `~/.openclaw` 或你的日志的完整内容。”

## 外部内容特殊令牌净化

在外部内容和元数据到达模型之前，OpenClaw 会从包装后的内容中剥离常见的自托管 LLM 聊天模板特殊令牌字面量。覆盖的标记家族包括 Qwen / ChatML、Llama、Gemma、Mistral、Phi 和 GPT-OSS 的角色 / 回合令牌。

原因：

- 当前置自托管模型的 OpenAI 兼容后端有时会保留出现在用户文本中的特殊令牌，而不是对其进行屏蔽。攻击者如果能写入入站外部内容（抓取的页面、邮件正文、文件内容工具输出），否则就可以注入一个伪造的 `assistant` 或 `system` 角色边界，从而逃逸已包装内容的护栏。
- 净化发生在外部内容包装层，因此它会统一应用于 fetch / read 工具和入站渠道内容，而不是按提供商分别处理。
- 出站模型响应已经有一个单独的净化器，用于从用户可见回复中剥离泄漏的 `<tool_call>`、`<function_calls>` 以及类似脚手架。外部内容净化器是它的入站对应项。

这不能替代本页中的其他加固措施——`dmPolicy`、允许列表、exec 审批、沙箱隔离和 `contextVisibility` 仍然承担主要工作。它关闭的是一种特定的 tokenizer 层绕过方式，针对的是那些会原样转发带特殊令牌用户文本的自托管技术栈。

## 不安全外部内容绕过标志

OpenClaw 包含一些显式绕过标志，用于禁用外部内容安全包装：

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron 负载字段 `allowUnsafeExternalContent`

指导建议：

- 在生产环境中保持这些值未设置 / 为 false。
- 仅在范围严格受控的临时调试中启用。
- 如果启用，应隔离该智能体（沙箱隔离 + 最小工具 + 专用会话命名空间）。

Hooks 风险说明：

- Hook 负载属于不受信任内容，即使投递来自你可控的系统也是如此（邮件 / 文档 / 网页内容都可能携带提示注入）。
- 使用较弱的模型层级会增加这种风险。对于基于 hook 的自动化，应优先使用强大的现代模型层级，并保持严格的工具策略（`tools.profile: "messaging"` 或更严格），同时尽可能启用沙箱隔离。

### 提示注入并不需要公开私信

即使**只有你自己**可以给机器人发消息，提示注入依然可能通过
机器人读取的**任何不受信任内容**发生（web 搜索 / 抓取结果、浏览器页面、
邮件、文档、附件、粘贴的日志 / 代码）。换句话说：发送者并不是
唯一的威胁面；**内容本身**也可能携带对抗性指令。

启用工具时，典型风险是外泄上下文或触发工具调用。可通过以下方式缩小影响半径：

- 使用只读或禁用工具的**阅读智能体**来总结不受信任内容，
  然后将摘要传给你的主智能体。
- 除非确有需要，否则对启用了工具的智能体关闭 `web_search` / `web_fetch` / `browser`。
- 对于 OpenResponses URL 输入（`input_file` / `input_image`），设置严格的
  `gateway.http.endpoints.responses.files.urlAllowlist` 和
  `gateway.http.endpoints.responses.images.urlAllowlist`，并保持 `maxUrlParts` 较低。
  空允许列表会被视为未设置；如果你想完全禁用 URL 抓取，请使用 `files.allowUrl: false` / `images.allowUrl: false`。
- 对于 OpenResponses 文件输入，解码后的 `input_file` 文本仍会作为
  **不受信任的外部内容**注入。不要因为该文件文本是由 Gateway 网关 本地解码的，就假定它是可信的。注入块仍然带有显式的
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 边界标记和 `Source: External`
  元数据，尽管此路径省略了更长的 `SECURITY NOTICE:` 横幅。
- 当媒体理解在将文本附加到媒体提示前从附件文档中提取文本时，也会应用同样基于标记的包装。
- 对任何接触不受信任输入的智能体启用沙箱隔离和严格工具允许列表。
- 不要把 secrets 放进提示中；应通过 Gateway 网关 主机上的 env / config 传递。

### 自托管 LLM 后端

OpenAI 兼容的自托管后端，如 vLLM、SGLang、TGI、LM Studio，
或自定义 Hugging Face tokenizer 技术栈，在处理聊天模板特殊令牌时，
可能与托管提供商不同。如果某个后端会将
`<|im_start|>`、`<|start_header_id|>` 或 `<start_of_turn>` 这类字面字符串
在用户内容中分词为结构性聊天模板令牌，不受信任文本就可能尝试在 tokenizer 层伪造角色边界。

在将包装后的外部内容发送给模型之前，OpenClaw 会剥离常见模型家族的特殊令牌字面量。请保持外部内容包装处于启用状态，并在可用时优先选择能对用户提供内容中的特殊令牌进行拆分或转义的后端设置。OpenAI
和 Anthropic 这类托管提供商已经会在请求侧执行自己的净化。

### 模型强度（安全说明）

不同模型层级的提示注入抵抗力**并不一致**。更小 / 更便宜的模型通常更容易受到工具滥用和指令劫持影响，尤其是在对抗性提示下。

<Warning>
对于启用了工具的智能体或会读取不受信任内容的智能体，旧模型 / 小模型带来的提示注入风险通常过高。不要在弱模型层级上运行这些工作负载。
</Warning>

建议：

- 对任何可以运行工具或接触文件 / 网络的机器人，**使用最新一代、最佳层级的模型**。
- **不要对启用了工具的智能体或不受信任收件箱使用较旧 / 较弱 / 较小的层级**；提示注入风险过高。
- 如果你必须使用较小的模型，**缩小影响半径**（只读工具、强沙箱隔离、最小文件系统访问、严格允许列表）。
- 运行小模型时，**为所有会话启用沙箱隔离**，并且除非输入受到严格控制，否则**禁用 web_search / web_fetch / browser**。
- 对于仅聊天、输入可信且无工具的个人助理，小模型通常是可以的。

## 群组中的 reasoning 和详细输出

`/reasoning`、`/verbose` 和 `/trace` 可能会暴露内部推理、工具输出或插件诊断信息，
而这些内容
本不应出现在公共渠道中。在群组环境下，应将它们视为**仅用于调试**，除非你明确需要，否则保持关闭。

指导建议：

- 在公共房间中保持 `/reasoning`、`/verbose` 和 `/trace` 关闭。
- 如果你启用它们，也只应在受信任的私信或严格受控的房间中启用。
- 请记住：verbose 和 trace 输出可能包含工具参数、URL、插件诊断信息以及模型看到的数据。

## 配置加固示例

### 文件权限

在 Gateway 网关主机上保持配置和状态私有：

- `~/.openclaw/openclaw.json`：`600`（仅用户可读 / 写）
- `~/.openclaw`：`700`（仅用户可访问）

`openclaw doctor` 可以发出警告，并提供收紧这些权限的选项。

### 网络暴露（bind、端口、防火墙）

Gateway 网关 在单个端口上复用 **WebSocket + HTTP**：

- 默认值：`18789`
- Config / flags / env：`gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`

这个 HTTP 界面包括 Control UI 和 canvas host：

- Control UI（SPA 资源）（默认基础路径 `/`）
- Canvas host：`/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`（任意 HTML / JS；应视为不受信任内容）

如果你在普通浏览器中加载 canvas 内容，应像对待其他不受信任网页一样对待它：

- 不要将 canvas host 暴露给不受信任的网络 / 用户。
- 不要让 canvas 内容与特权 Web 界面共享同一来源，除非你完全理解其中的影响。

bind 模式控制 Gateway 网关 在哪里监听：

- `gateway.bind: "loopback"`（默认）：只有本地客户端可以连接。
- 非 loopback bind（`"lan"`、`"tailnet"`、`"custom"`）会扩大攻击面。仅在启用 Gateway 网关 认证（共享 token / password，或正确配置的非 loopback trusted proxy）并配合真正的防火墙时使用。

经验规则：

- 优先选择 Tailscale Serve，而不是 LAN bind（Serve 会让 Gateway 网关 保持在 loopback 上，由 Tailscale 处理访问）。
- 如果必须绑定到 LAN，请通过防火墙将端口限制为严格的源 IP 允许列表；不要广泛进行端口转发。
- 绝不要在 `0.0.0.0` 上无认证暴露 Gateway 网关。

### 使用 UFW 的 Docker 端口发布

如果你在 VPS 上通过 Docker 运行 OpenClaw，请记住，已发布的容器端口
（`-p HOST:CONTAINER` 或 Compose `ports:`）会通过 Docker 的转发链路路由，
而不仅仅是主机的 `INPUT` 规则。

为了让 Docker 流量与防火墙策略保持一致，请在
`DOCKER-USER` 中强制执行规则（该链会在 Docker 自己的 accept 规则之前评估）。
在许多现代发行版上，`iptables` / `ip6tables` 使用的是 `iptables-nft` 前端，
但这些规则仍会应用到底层 nftables 后端。

最小允许列表示例（IPv4）：

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

IPv6 使用独立表。如果启用了 Docker IPv6，请在 `/etc/ufw/after6.rules` 中添加对应策略。

避免在文档片段中硬编码接口名，例如 `eth0`。不同 VPS 镜像上的接口名
各不相同（`ens3`、`enp*` 等），不匹配可能会意外跳过你的拒绝规则。

重新加载后的快速验证：

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

预期的外部端口应只包括你有意暴露的那些（对于大多数
设置：SSH + 你的反向代理端口）。

### mDNS / Bonjour 发现

Gateway 网关 会通过 mDNS 广播其存在（端口 5353 上的 `_openclaw-gw._tcp`），以供本地设备发现。在完整模式下，这包括可能暴露运行细节的 TXT 记录：

- `cliPath`：CLI 二进制文件的完整文件系统路径（会暴露用户名和安装位置）
- `sshPort`：广播主机上的 SSH 可用性
- `displayName`、`lanHost`：主机名信息

**运维安全考量：** 广播基础设施细节会让本地网络中的任何人更容易进行侦察。即使是文件系统路径和 SSH 可用性这类“看似无害”的信息，也能帮助攻击者绘制你的环境图谱。

**建议：**

1. **最小模式**（默认，推荐用于已暴露的 Gateway 网关）：从 mDNS 广播中省略敏感字段：

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. 如果你不需要本地设备发现，**可完全禁用**：

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **完整模式**（选择性启用）：在 TXT 记录中包含 `cliPath` + `sshPort`：

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **环境变量**（备选）：设置 `OPENCLAW_DISABLE_BONJOUR=1`，无需修改配置即可禁用 mDNS。

在最小模式下，Gateway 网关 仍会广播足以用于设备发现的信息（`role`、`gatewayPort`、`transport`），但会省略 `cliPath` 和 `sshPort`。需要 CLI 路径信息的应用可以稍后通过已认证的 WebSocket 连接获取。

### 锁定 Gateway 网关 WebSocket（本地认证）

Gateway 网关 认证**默认是必需的**。如果没有配置有效的 Gateway 网关 认证路径，
Gateway 网关 会拒绝 WebSocket 连接（失败即关闭）。

新手引导默认会生成一个令牌（即使是在 loopback 场景下），因此
本地客户端也必须进行认证。

设置一个令牌，以便**所有** WS 客户端都必须认证：

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor 可以为你生成一个：`openclaw doctor --generate-gateway-token`。

注意：`gateway.remote.token` / `.password` 是客户端凭证来源。
它们**不会**单独保护本地 WS 访问。
只有当 `gateway.auth.*`
未设置时，本地调用路径才可以回退使用 `gateway.remote.*`。
如果 `gateway.auth.token` / `gateway.auth.password` 通过
SecretRef 显式配置但无法解析，则解析会失败即关闭（不会使用远程回退进行掩盖）。
可选项：当使用 `wss://` 时，可通过 `gateway.remote.tlsFingerprint` 固定远程 TLS。
默认情况下，明文 `ws://` 仅限 loopback。对于受信任的私有网络
路径，可在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`
作为破窗手段。这被有意设计为仅限进程环境变量，而不是
`openclaw.json` 配置键。
移动设备配对，以及 Android 手动或扫描 Gateway 网关 路由更严格：
明文仅在 loopback 下接受，而私有 LAN、link-local、`.local` 和
无点主机名必须使用 TLS，除非你显式选择加入受信任私有网络明文路径。

本地设备配对：

- 为了让同主机客户端体验更顺畅，直接本地 loopback 连接的设备配对会自动批准。
- OpenClaw 还提供了一条狭窄的后端 / 容器本地自连接路径，用于
  受信任的共享密钥辅助流程。
- Tailnet 和 LAN 连接，包括同主机 tailnet bind，都会被视为远程连接，配对仍然需要批准。
- loopback 请求中的转发头证据会取消其 loopback 本地性资格。元数据升级自动批准的范围也被严格限制。两者的规则都请参见
  [Gateway 网关配对](/zh-CN/gateway/pairing)。

认证模式：

- `gateway.auth.mode: "token"`：共享 bearer 令牌（推荐用于大多数设置）。
- `gateway.auth.mode: "password"`：密码认证（建议通过 env 设置：`OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`：信任具备身份感知能力的反向代理来为用户认证，并通过头传递身份信息（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。

轮换检查清单（token / password）：

1. 生成 / 设置一个新的 secret（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_PASSWORD`）。
2. 重启 Gateway 网关（如果是 macOS app 负责监管 Gateway 网关，则重启该 app）。
3. 更新所有远程客户端（调用 Gateway 网关 的机器上的 `gateway.remote.token` / `.password`）。
4. 验证旧凭证已无法连接。

### Tailscale Serve 身份头

当 `gateway.auth.allowTailscale` 为 `true`（Serve 的默认值）时，OpenClaw
会接受 Tailscale Serve 身份头（`tailscale-user-login`）用于 Control
UI / WebSocket 认证。OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）
解析 `x-forwarded-for` 地址，并将其与该头进行匹配，以验证身份。只有当请求命中 loopback
并包含由 Tailscale 注入的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 时，才会触发这一路径。
对于这条异步身份检查路径，来自同一 `{scope, ip}`
的失败尝试会先被串行化，然后限流器才记录失败。
因此，来自某个 Serve 客户端的并发错误重试，第二次尝试可能会立即被锁定，而不是像两个普通不匹配请求那样竞争通过。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）
**不会**使用 Tailscale 身份头认证。它们仍然遵循 Gateway 网关
所配置的 HTTP 认证模式。

重要边界说明：

- Gateway 网关 HTTP bearer 认证实际上等同于全有或全无的操作员访问。
- 应将能够调用 `/v1/chat/completions`、`/v1/responses` 或 `/api/channels/*` 的凭证视为该 Gateway 网关 的完全访问操作员 secret。
- 在 OpenAI 兼容 HTTP 界面上，共享密钥 bearer 认证会恢复完整的默认操作员范围（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）以及智能体轮次的 owner 语义；更窄的 `x-openclaw-scopes` 值不会缩小这条共享密钥路径。
- 只有当请求来自带身份的模式（例如 trusted proxy auth 或私有入口上的 `gateway.auth.mode="none"`）时，HTTP 的逐请求 scope 语义才适用。
- 在这些带身份的模式下，若省略 `x-openclaw-scopes`，会回退到正常的默认操作员范围集合；当你需要更窄的范围集时，请显式发送该头。
- `/tools/invoke` 也遵循同样的共享密钥规则：token / password bearer auth 在这里同样被视为完整操作员访问，而带身份的模式仍会遵循声明的 scope。
- 不要与不受信任的调用方共享这些凭证；应按信任边界使用单独的 Gateway 网关。

**信任假设：** 无令牌 Serve 认证假定 Gateway 网关主机是受信任的。
不要把它视为对抗同主机敌对进程的保护措施。如果不受信任的
本地代码可能在 Gateway 网关主机上运行，请禁用 `gateway.auth.allowTailscale`，
并要求显式共享密钥认证，例如 `gateway.auth.mode: "token"` 或
`"password"`。

**安全规则：** 不要从你自己的反向代理转发这些头。如果
你在 Gateway 网关 前终止 TLS 或做代理，请禁用
`gateway.auth.allowTailscale`，并改用共享密钥认证（`gateway.auth.mode:
"token"` 或 `"password"`），或者使用 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)。

受信任代理：

- 如果你在 Gateway 网关 前终止 TLS，请将 `gateway.trustedProxies` 设置为你的代理 IP。
- OpenClaw 会信任来自这些 IP 的 `x-forwarded-for`（或 `x-real-ip`），以确定客户端 IP，用于本地配对检查和 HTTP 认证 / 本地检查。
- 确保你的代理会**覆盖** `x-forwarded-for`，并阻止对 Gateway 网关端口的直接访问。

参见 [Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/zh-CN/web)。

### 通过节点主机进行浏览器控制（推荐）

如果你的 Gateway 网关 是远程的，而浏览器运行在另一台机器上，请在浏览器所在机器上运行一个**节点主机**，
并让 Gateway 网关 代理浏览器操作（参见 [Browser 工具](/zh-CN/tools/browser)）。
请将节点配对视为管理员级访问。

推荐模式：

- 让 Gateway 网关 和节点主机处于同一个 tailnet（Tailscale）中。
- 有意进行节点配对；如果不需要浏览器代理路由，请将其禁用。

应避免：

- 通过 LAN 或公共互联网暴露中继 / 控制端口。
- 对浏览器控制端点使用 Tailscale Funnel（公共暴露）。

### 磁盘上的 secrets

应假定 `~/.openclaw/`（或 `$OPENCLAW_STATE_DIR/`）下的任何内容都可能包含 secrets 或私有数据：

- `openclaw.json`：配置中可能包含令牌（gateway、remote gateway）、提供商设置和允许列表。
- `credentials/**`：渠道凭证（例如：WhatsApp 凭证）、配对允许列表、旧版 OAuth 导入。
- `agents/<agentId>/agent/auth-profiles.json`：API 密钥、令牌配置文件、OAuth 令牌，以及可选的 `keyRef` / `tokenRef`。
- `secrets.json`（可选）：`file` SecretRef 提供商使用的基于文件的 secret 负载（`secrets.providers`）。
- `agents/<agentId>/agent/auth.json`：旧版兼容文件。发现静态 `api_key` 条目时会被清理。
- `agents/<agentId>/sessions/**`：会话转录（`*.jsonl`）+ 路由元数据（`sessions.json`），其中可能包含私人消息和工具输出。
- 内置插件包：已安装的插件（以及它们的 `node_modules/`）。
- `sandboxes/**`：工具沙箱工作区；可能累积你在沙箱中读 / 写文件的副本。

加固建议：

- 保持严格权限（目录 `700`，文件 `600`）。
- 在 Gateway 网关主机上使用全盘加密。
- 如果主机是共享的，优先为 Gateway 网关 使用专用的 OS 用户账户。

### 工作区 `.env` 文件

OpenClaw 会为智能体和工具加载工作区本地 `.env` 文件，但绝不会让这些文件悄悄覆盖 Gateway 网关 运行时控制。

- 任何以 `OPENCLAW_*` 开头的键都会被来自不受信任工作区 `.env` 文件的值阻止。
- Matrix、Mattermost、IRC 和 Synology Chat 的渠道端点设置也会被阻止通过工作区 `.env` 覆盖，因此克隆的工作区无法通过本地端点配置重定向内置连接器流量。端点环境变量键（如 `MATRIX_HOMESERVER`、`MATTERMOST_URL`、`IRC_HOST`、`SYNOLOGY_CHAT_INCOMING_URL`）必须来自 Gateway 网关 进程环境或 `env.shellEnv`，不能来自工作区加载的 `.env`。
- 这种阻止机制是失败即关闭的：未来版本中新增的运行时控制变量无法从已提交或攻击者提供的 `.env` 中继承；该键会被忽略，Gateway 网关 会保留自己的值。
- 受信任的进程 / OS 环境变量（Gateway 网关 自身的 shell、launchd / systemd unit、app bundle）仍然生效——这项限制仅约束 `.env` 文件加载。

原因：工作区 `.env` 文件经常与智能体代码放在一起、被意外提交，或由工具写入。阻止整个 `OPENCLAW_*` 前缀意味着以后即使新增 `OPENCLAW_*` 标志，也绝不会退化为从工作区状态中静默继承。

### 日志和转录内容（脱敏与保留）

即使访问控制是正确的，日志和转录内容也可能泄露敏感信息：

- Gateway 网关 日志可能包含工具摘要、错误和 URL。
- 会话转录可能包含粘贴的 secrets、文件内容、命令输出和链接。

建议：

- 保持工具摘要脱敏开启（`logging.redactSensitive: "tools"`；默认值）。
- 通过 `logging.redactPatterns` 为你的环境添加自定义模式（令牌、主机名、内部 URL）。
- 分享诊断信息时，优先使用 `openclaw status --all`（可直接粘贴，secrets 已脱敏），而不是原始日志。
- 如果不需要长时间保留，请清理旧的会话转录和日志文件。

详情请参见：[日志](/zh-CN/gateway/logging)

### 私信：默认配对

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 群组：始终要求提及

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

在群聊中，仅在被明确提及时才回复。

### 分离号码（WhatsApp、Signal、Telegram）

对于基于手机号的渠道，请考虑让你的 AI 使用与个人号码分开的号码运行：

- 个人号码：你的对话保持私密
- 机器人号码：AI 处理这些对话，并设置适当边界

### 只读模式（通过沙箱和工具）

你可以通过组合以下方式构建只读配置文件：

- `agents.defaults.sandbox.workspaceAccess: "ro"`（或 `"none"` 以完全禁止工作区访问）
- 使用工具允许 / 拒绝列表来阻止 `write`、`edit`、`apply_patch`、`exec`、`process` 等。

其他加固选项：

- `tools.exec.applyPatch.workspaceOnly: true`（默认）：确保 `apply_patch` 即使在沙箱模式关闭时，也不能在工作区目录之外写入 / 删除。只有当你明确希望 `apply_patch` 操作工作区外文件时，才设置为 `false`。
- `tools.fs.workspaceOnly: true`（可选）：将 `read` / `write` / `edit` / `apply_patch` 路径以及原生提示图像自动加载路径限制在工作区目录内（如果你当前允许绝对路径，并希望增加一道统一护栏，这会很有用）。
- 保持文件系统根路径尽可能窄：避免将主目录这类宽泛路径用作智能体工作区 / 沙箱工作区。宽泛根路径可能会让文件系统工具访问到敏感本地文件（例如 `~/.openclaw` 下的状态 / 配置）。

### 安全基线（可直接复制 / 粘贴）

一个“安全默认”配置，可保持 Gateway 网关 私有、要求私信配对，并避免在群组中部署始终在线的机器人：

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

如果你还希望工具执行也“默认更安全”，请为任何非 owner 智能体添加沙箱，并拒绝危险工具（见下方“按智能体访问配置文件”示例）。

对于聊天驱动的智能体轮次，内置基线是：非 owner 发送者不能使用 `cron` 或 `gateway` 工具。

## 沙箱隔离（推荐）

专门文档：[沙箱隔离](/zh-CN/gateway/sandboxing)

两种互补方式：

- **在 Docker 中运行整个 Gateway 网关**（容器边界）：[Docker](/zh-CN/install/docker)
- **工具沙箱**（`agents.defaults.sandbox`，主机上运行 Gateway 网关 + 由沙箱隔离的工具；Docker 是默认后端）：[沙箱隔离](/zh-CN/gateway/sandboxing)

注意：为了防止跨智能体访问，请将 `agents.defaults.sandbox.scope` 保持为 `"agent"`（默认）
或使用 `"session"` 以实现更严格的按会话隔离。`scope: "shared"` 会使用
单个容器 / 工作区。

还应考虑智能体在沙箱中的工作区访问方式：

- `agents.defaults.sandbox.workspaceAccess: "none"`（默认）会禁止访问智能体工作区；工具会针对位于 `~/.openclaw/sandboxes` 下的沙箱工作区运行
- `agents.defaults.sandbox.workspaceAccess: "ro"` 会将智能体工作区以只读方式挂载到 `/agent`（禁用 `write` / `edit` / `apply_patch`）
- `agents.defaults.sandbox.workspaceAccess: "rw"` 会将智能体工作区以读写方式挂载到 `/workspace`
- 额外的 `sandbox.docker.binds` 会根据标准化和规范化后的源路径进行验证。如果父级符号链接技巧或规范主目录别名最终解析到了诸如 `/etc`、`/var/run` 或 OS 主目录下凭证目录等受阻止根路径中，仍会失败即关闭。

重要：`tools.elevated` 是全局基线的逃逸开口，会在沙箱外运行 exec。默认情况下，有效主机是 `gateway`，当 exec 目标配置为 `node` 时，则为 `node`。请保持 `tools.elevated.allowFrom` 足够严格，不要对陌生人启用它。你还可以通过 `agents.list[].tools.elevated` 进一步按智能体限制 elevated。参见 [Elevated Mode](/zh-CN/tools/elevated)。

### 子智能体委派护栏

如果你允许会话工具，请将委派给子智能体的运行视为另一项边界决策：

- 除非智能体确实需要委派，否则拒绝 `sessions_spawn`。
- 保持 `agents.defaults.subagents.allowAgents` 以及任何按智能体覆盖的 `agents.list[].subagents.allowAgents` 仅限于已知安全的目标智能体。
- 对于任何必须保持在沙箱中的工作流，调用 `sessions_spawn` 时请使用 `sandbox: "require"`（默认值为 `inherit`）。
- `sandbox: "require"` 会在目标子运行时未启用沙箱时快速失败。

## 浏览器控制风险

启用浏览器控制会赋予模型驱动真实浏览器的能力。
如果该浏览器配置文件中已经包含已登录会话，模型就可以
访问这些账户和数据。请将浏览器配置文件视为**敏感状态**：

- 优先为智能体使用专用配置文件（默认的 `openclaw` 配置文件）。
- 避免让智能体使用你的个人日常主力配置文件。
- 对于已启用沙箱的智能体，除非你信任它们，否则保持主机浏览器控制关闭。
- 独立的 loopback 浏览器控制 API 仅支持共享密钥认证
  （gateway token bearer auth 或 gateway password）。它不接受
  trusted-proxy 或 Tailscale Serve 身份头。
- 将浏览器下载内容视为不受信任输入；优先使用隔离的下载目录。
- 尽可能在智能体配置文件中禁用浏览器同步 / 密码管理器（可缩小影响半径）。
- 对于远程 Gateway 网关，应假定“浏览器控制”等同于“操作员访问”，可访问该配置文件所能触及的一切。
- 让 Gateway 网关 和节点主机仅限于 tailnet；避免将浏览器控制端口暴露给 LAN 或公共互联网。
- 当你不需要浏览器代理路由时，请将其禁用（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP 现有会话模式**并不**“更安全”；它会以你的身份访问该主机上 Chrome 配置文件所能到达的一切。

### 浏览器 SSRF 策略（默认严格）

OpenClaw 的浏览器导航策略默认是严格的：私有 / 内部目标会保持阻止状态，除非你显式选择加入。

- 默认值：`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 未设置，因此浏览器导航会继续阻止私有 / 内部 / 特殊用途目标。
- 旧版别名：为了兼容，仍接受 `browser.ssrfPolicy.allowPrivateNetwork`。
- 选择加入模式：设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 以允许私有 / 内部 / 特殊用途目标。
- 在严格模式下，可使用 `hostnameAllowlist`（如 `*.example.com` 这样的模式）和 `allowedHostnames`（精确主机例外，包括像 `localhost` 这样的受阻止名称）进行显式例外配置。
- 为了减少基于重定向的跳转，系统会在请求前检查导航目标，并在导航结束后对最终的 `http(s)` URL 进行尽力复检。

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

## 按智能体访问配置文件（多智能体）

在多智能体路由下，每个智能体都可以有自己的沙箱和工具策略：
利用这一点可为不同智能体分配**完全访问**、**只读**或**无访问**。
完整细节和优先级规则请参见 [多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

常见使用场景：

- 个人智能体：完全访问，不使用沙箱
- 家庭 / 工作智能体：沙箱隔离 + 只读工具
- 公共智能体：沙箱隔离 + 无文件系统 / shell 工具

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

### 示例：无文件系统 / shell 访问（允许提供商消息）

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

## 事件响应

如果你的 AI 做了不该做的事：

### 遏制

1. **停止它：** 停止 macOS app（如果它负责监管 Gateway 网关），或终止你的 `openclaw gateway` 进程。
2. **关闭暴露面：** 将 `gateway.bind` 设为 `"loopback"`（或禁用 Tailscale Funnel / Serve），直到你弄清楚发生了什么。
3. **冻结访问：** 将高风险私信 / 群组切换为 `dmPolicy: "disabled"` / 要求提及，并移除你曾设置过的 `"*"` 全部允许项。

### 轮换（如果 secrets 泄露，应假定已被攻破）

1. 轮换 Gateway 网关 认证（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）并重启。
2. 轮换所有可调用 Gateway 网关 的机器上的远程客户端 secrets（`gateway.remote.token` / `.password`）。
3. 轮换提供商 / API 凭证（WhatsApp 凭证、Slack / Discord 令牌、`auth-profiles.json` 中的模型 / API 密钥，以及使用时的加密 secrets 负载值）。

### 审计

1. 检查 Gateway 网关 日志：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（或 `logging.file`）。
2. 检查相关转录内容：`~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 检查最近的配置更改（任何可能扩大访问范围的项：`gateway.bind`、`gateway.auth`、私信 / 群组策略、`tools.elevated`、插件变更）。
4. 重新运行 `openclaw security audit --deep`，并确认严重发现项已被解决。

### 收集用于报告的材料

- 时间戳、Gateway 网关主机操作系统 + OpenClaw 版本
- 会话转录内容 + 简短日志尾部（脱敏后）
- 攻击者发送了什么 + 智能体做了什么
- Gateway 网关 是否暴露到了 loopback 之外（LAN / Tailscale Funnel / Serve）

## 使用 detect-secrets 进行 secrets 扫描

CI 会在 `secrets` 作业中运行 `detect-secrets` pre-commit hook。
推送到 `main` 时始终会执行全文件扫描。拉取请求在存在基线提交时会使用变更文件
快速路径，否则回退为全文件扫描。如果它失败，说明存在尚未进入基线的新候选项。

### 如果 CI 失败

1. 在本地复现：

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. 了解这些工具：
   - pre-commit 中的 `detect-secrets` 会结合仓库的
     baseline 和排除项运行 `detect-secrets-hook`。
   - `detect-secrets audit` 会打开交互式审查，以将基线中的每一项
     标记为真实或误报。
3. 对于真实 secret：轮换 / 删除它们，然后重新运行扫描以更新基线。
4. 对于误报：运行交互式审查并将其标记为误报：

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 如果你需要新增排除项，请将其添加到 `.detect-secrets.cfg`，并使用匹配的 `--exclude-files` / `--exclude-lines` 标志重新生成
   baseline（该配置文件仅供参考；detect-secrets 不会自动读取它）。

一旦更新后的 `.secrets.baseline` 反映了预期状态，请提交它。

## 报告安全问题

在 OpenClaw 中发现了漏洞？请负责任地报告：

1. 电子邮件：[security@openclaw.ai](mailto:security@openclaw.ai)
2. 在修复前不要公开发布
3. 我们会向你致谢（除非你希望匿名）
