---
read_when:
    - 你想对配置/状态运行一次快速安全审计
    - 你想应用安全的“修复”建议（权限、收紧默认值）
summary: '`openclaw security` 的 CLI 参考（审计并修复常见安全隐患）'
title: 安全
x-i18n:
    generated_at: "2026-04-23T20:45:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb15ae5e3996aa0e2314572128713b5a44ab4094ee3f76a218e8f053868d16b3
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

当多个私信发送者共享主会话时，审计会发出警告，并建议使用**安全私信模式**：`session.dmScope="per-channel-peer"`（对于多账户渠道则使用 `per-account-channel-peer`），以加固共享收件箱。
这是面向协作式/共享收件箱的加固建议。若一个 Gateway 网关由彼此不信任或对抗性的运维者共享，这并不是推荐的部署方式；应通过独立的 gateways，或独立的操作系统用户/主机来划分信任边界。
如果配置表明很可能存在共享用户入口（例如开放的私信/群组策略、已配置的群组目标或通配符发送者规则），它还会发出 `security.trust_model.multi_user_heuristic`，并提醒你 OpenClaw 默认采用的是个人助理信任模型。
对于有意配置的共享用户环境，审计建议是：对所有会话启用沙箱隔离，将文件系统访问限制在工作区范围内，并确保个人/私密身份或凭证不出现在该运行时中。
当小模型（`<=300B`）在未启用沙箱隔离的情况下使用，并且启用了 web/浏览器工具时，它也会发出警告。
对于 webhook 入口，当 `hooks.token` 复用 Gateway 网关令牌、`hooks.token` 过短、`hooks.path="/"`、`hooks.defaultSessionKey` 未设置、`hooks.allowedAgentIds` 未受限制、启用了请求 `sessionKey` 覆盖、以及在未设置 `hooks.allowedSessionKeyPrefixes` 的情况下启用了覆盖时，它也会发出警告。
它还会在以下情况下发出警告：已配置沙箱 Docker 设置但沙箱模式处于关闭状态，`gateway.nodes.denyCommands` 使用了无效的模式样式/未知条目（仅支持节点命令名精确匹配，不支持 shell 文本过滤），`gateway.nodes.allowCommands` 明确启用了危险的节点命令，当全局 `tools.profile="minimal"` 被智能体工具配置覆盖时，当开放群组在没有沙箱/工作区保护的情况下暴露运行时/文件系统工具时，以及当在宽松工具策略下已安装的插件工具可能可达时。
它还会标记 `gateway.allowRealIpFallback=true`（如果代理配置错误则存在请求头伪造风险）以及 `discovery.mdns.mode="full"`（通过 mDNS TXT 记录泄露元数据）。
当沙箱浏览器使用 Docker `bridge` 网络，且未设置 `sandbox.browser.cdpSourceRange` 时，它也会发出警告。
它还会标记危险的沙箱 Docker 网络模式（包括 `host` 和 `container:*` 命名空间加入）。
当现有沙箱浏览器 Docker 容器缺失或使用过期哈希标签时（例如迁移前的容器缺少 `openclaw.browserConfigEpoch`），它也会发出警告，并建议运行 `openclaw sandbox recreate --browser --all`。
当基于 npm 的插件/钩子安装记录未固定版本、缺少完整性元数据，或与当前安装的包版本不一致时，它也会发出警告。
当渠道 allowlist 依赖可变的名称/电子邮件/标签，而不是稳定 ID 时，它也会发出警告（适用于 Discord、Slack、Google Chat、Microsoft Teams、Mattermost，以及适用场景下的 IRC 范围）。
当 `gateway.auth.mode="none"` 导致 Gateway 网关 HTTP API 在没有共享密钥的情况下可访问时（`/tools/invoke` 以及任何已启用的 `/v1/*` 端点），它也会发出警告。
带有 `dangerous`/`dangerously` 前缀的设置表示显式的紧急兼容运维覆盖；启用它们本身**并不自动构成**安全漏洞报告。
有关完整的危险参数清单，请参见[安全](/zh-CN/gateway/security)中的 “Insecure or dangerous flags summary” 部分。

SecretRef 行为：

- `security audit` 会以只读模式解析其目标路径中受支持的 SecretRef。
- 如果当前命令路径中某个 SecretRef 不可用，审计会继续执行，并报告 `secretDiagnostics`（而不是崩溃）。
- `--token` 和 `--password` 仅覆盖本次命令调用中的深度探测身份验证；它们不会改写配置或 SecretRef 映射。

## JSON 输出

在 CI/策略检查中使用 `--json`：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果组合使用 `--fix` 和 `--json`，输出将同时包含修复操作和最终报告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 会更改什么

`--fix` 会应用安全且确定性的修复措施：

- 将常见的 `groupPolicy="open"` 切换为 `groupPolicy="allowlist"`（包括受支持渠道中的账户变体）
- 当 WhatsApp 群组策略切换为 `allowlist` 时，如果存在已存储的 `allowFrom` 文件，且配置中尚未定义 `allowFrom`，则会用该文件为 `groupAllowFrom` 预填充
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态/配置和常见敏感文件的权限
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、会话
  `*.jsonl`）
- 也会收紧 `openclaw.json` 中引用的配置包含文件权限
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置权限

`--fix` **不会**：

- 轮换令牌/密码/API 密钥
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 网关绑定/身份验证/网络暴露选择
- 删除或重写插件/Skills
