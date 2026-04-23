---
read_when:
    - 你想对配置/状态运行一次快速安全审计
    - 你想应用安全的“修复”建议（权限、收紧默认值）
summary: '`openclaw security` 的 CLI 参考（审计并修复常见安全陷阱）'
title: 安全
x-i18n:
    generated_at: "2026-04-23T06:40:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

安全工具（审计 + 可选修复）。

相关内容：

- 安全指南：[安全](/zh-CN/gateway/security)

## 审计

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

当多个私信发送者共享主会话时，审计会发出警告，并建议使用 **安全私信模式**：`session.dmScope="per-channel-peer"`（对于多账号渠道，则使用 `per-account-channel-peer`），适用于共享收件箱。
这是为了加固协作式/共享式收件箱。由彼此不信任或存在对抗关系的操作人员共享同一个 Gateway 网关，并不是推荐的设置；应通过单独的 Gateway 网关（或单独的操作系统用户/主机）来划分信任边界。
当配置表明很可能存在共享用户入口时，它还会输出 `security.trust_model.multi_user_heuristic`（例如开放的私信/群组策略、已配置的群组目标，或通配符发送者规则），并提醒你 OpenClaw 默认采用个人助理信任模型。
对于有意的共享用户设置，审计建议对所有会话启用沙箱隔离，将文件系统访问限制在工作区范围内，并且不要在该运行时中放入个人/私有身份或凭证。
当使用小模型（`<=300B`）且未启用沙箱隔离，同时启用了 web/browser 工具时，它也会发出警告。
对于 webhook 入口，它会在以下情况下发出警告：`hooks.token` 复用 Gateway 网关 token、`hooks.token` 过短、`hooks.path="/"`、未设置 `hooks.defaultSessionKey`、`hooks.allowedAgentIds` 未受限制、启用了请求 `sessionKey` 覆盖，以及启用了覆盖但未设置 `hooks.allowedSessionKeyPrefixes`。
当配置了沙箱 Docker 设置但沙箱模式处于关闭状态时，它也会发出警告；当 `gateway.nodes.denyCommands` 使用无效的类模式/未知条目时也会发出警告（这里只支持精确的节点命令名匹配，不支持 shell 文本过滤）；当 `gateway.nodes.allowCommands` 显式启用危险节点命令时会发出警告；当全局 `tools.profile="minimal"` 被智能体工具配置文件覆盖时会发出警告；当开放群组在没有沙箱/工作区防护的情况下暴露运行时/文件系统工具时会发出警告；当已安装的 plugin 工具可能在宽松工具策略下可被访问时也会发出警告。
它还会将 `gateway.allowRealIpFallback=true` 标记为风险项（如果代理配置错误，会有 header 伪造风险），并将 `discovery.mdns.mode="full"` 标记为风险项（通过 mDNS TXT 记录泄露元数据）。
当沙箱浏览器使用 Docker `bridge` 网络但未设置 `sandbox.browser.cdpSourceRange` 时，它也会发出警告。
它还会标记危险的沙箱 Docker 网络模式（包括 `host` 和 `container:*` 命名空间加入）。
当现有的沙箱浏览器 Docker 容器缺少或使用了过期的哈希标签时（例如迁移前容器缺少 `openclaw.browserConfigEpoch`），它也会发出警告，并建议运行 `openclaw sandbox recreate --browser --all`。
当基于 npm 的 plugin/hook 安装记录未固定版本、缺少完整性元数据，或与当前已安装的软件包版本不一致时，它也会发出警告。
当渠道 allowlist 依赖可变名称/邮箱/标签而不是稳定 ID 时，它会发出警告（适用于 Discord、Slack、Google Chat、Microsoft Teams、Mattermost，以及适用范围内的 IRC）。
当 `gateway.auth.mode="none"` 使 Gateway 网关 HTTP API 在没有共享密钥的情况下可访问时，它也会发出警告（`/tools/invoke` 以及任何已启用的 `/v1/*` 端点）。
以 `dangerous`/`dangerously` 为前缀的设置，是明确的紧急破玻璃式操作员覆盖项；启用其中某一项本身并不自动构成安全漏洞报告。
如需查看完整的危险参数清单，请参见[安全](/zh-CN/gateway/security)中的“`Insecure or dangerous flags summary`”章节。

SecretRef 行为：

- `security audit` 会以只读模式解析其目标路径中受支持的 SecretRef。
- 如果当前命令路径中某个 SecretRef 不可用，审计会继续进行，并报告 `secretDiagnostics`（而不是崩溃）。
- `--token` 和 `--password` 只会覆盖本次命令调用的深度探测认证；它们不会重写配置或 SecretRef 映射。

## JSON 输出

对 CI/策略检查使用 `--json`：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果同时使用 `--fix` 和 `--json`，输出会同时包含修复操作和最终报告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 会修改什么

`--fix` 会应用安全且确定性的修复措施：

- 将常见的 `groupPolicy="open"` 切换为 `groupPolicy="allowlist"`（包括受支持渠道中的账号变体）
- 当 WhatsApp 群组策略切换为 `allowlist` 时，如果已存在存储的 `allowFrom` 文件且配置中尚未定义 `allowFrom`，则从该文件为 `groupAllowFrom` 设定初始值
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态/配置以及常见敏感文件的权限
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、会话
  `*.jsonl`）
- 也会收紧从 `openclaw.json` 引用的配置 include 文件的权限
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置权限

`--fix` **不会**：

- 轮换 token/password/API key
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 网关的绑定/认证/网络暴露选择
- 删除或重写 plugins/Skills
