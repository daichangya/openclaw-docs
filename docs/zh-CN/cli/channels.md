---
read_when:
    - 你想添加 / 删除渠道账户（WhatsApp / Telegram / Discord / Google Chat / Slack / Mattermost（插件）/ Signal / iMessage / Matrix）
    - 你想检查渠道状态或跟踪渠道日志
summary: '`openclaw channels` 的 CLI 参考（账户、状态、登录 / 登出、日志）'
title: 渠道
x-i18n:
    generated_at: "2026-04-23T20:43:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16378d5b9040627111a458d5c007b71493f62eb19ddbaff754ec85004f301eaf
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

管理 Gateway 网关上的聊天渠道账户及其运行时状态。

相关文档：

- 渠道指南：[Channels](/zh-CN/channels/index)
- Gateway 网关配置：[Configuration](/zh-CN/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## 状态 / 能力 / 解析 / 日志

- `channels status`：`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（仅可与 `--channel` 一起使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是实时路径：在 Gateway 网关可达时，它会对每个账户运行
`probeAccount` 以及可选的 `auditAccount` 检查，因此输出可能同时包含传输
状态以及探测结果，例如 `works`、`probe failed`、`audit ok` 或 `audit failed`。
如果 Gateway 网关不可达，`channels status` 会回退为仅配置摘要，而不是实时探测输出。

## 添加 / 删除账户

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

提示：`openclaw channels add --help` 会显示按渠道划分的参数（token、私钥、app token、signal-cli 路径等）。

常见的非交互式添加方式包括：

- bot-token 渠道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal / iMessage 传输字段：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 字段：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 字段：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 字段：`--private-key`、`--relay-urls`
- Tlon 字段：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env`：在支持的情况下用于默认账户的基于环境变量的身份验证

当你在没有参数的情况下运行 `openclaw channels add` 时，交互式向导可能会提示：

- 所选渠道对应的账户 ID
- 这些账户的可选显示名称
- `Bind configured channel accounts to agents now?`

如果你确认立即绑定，向导会询问哪个智能体应拥有每个已配置的渠道账户，并写入按账户范围划分的路由绑定。

你也可以稍后使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（参见 [agents](/zh-CN/cli/agents)）。

当你为某个仍在使用单账户顶层设置的渠道添加非默认账户时，OpenClaw 会先将按账户范围划分的顶层值提升到该渠道的账户映射中，再写入新账户。大多数渠道会将这些值写入 `channels.<channel>.accounts.default`，但内置渠道也可以保留现有的匹配提升账户。Matrix 是当前示例：如果已经存在一个命名账户，或者 `defaultAccount` 指向某个现有命名账户，那么提升过程会保留该账户，而不是新建一个 `accounts.default`。

路由行为保持一致：

- 现有仅渠道绑定（没有 `accountId`）会继续匹配默认账户。
- `channels add` 在非交互模式下不会自动创建或重写绑定。
- 交互式设置可以选择性地添加按账户范围划分的绑定。

如果你的配置已经处于混合状态（存在命名账户，同时仍设置了顶层单账户值），请运行 `openclaw doctor --fix`，将按账户范围划分的值移动到该渠道所选择的提升账户中。大多数渠道会提升到 `accounts.default`；Matrix 则可以保留现有的命名 / 默认目标。

## 登录 / 登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

说明：

- `channels login` 支持 `--verbose`。
- 当仅配置了一个受支持的登录目标时，`channels login` / `logout` 可以推断渠道。

## 故障排除

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 获取引导式修复。
- `openclaw channels list` 打印 `Claude: HTTP 403 ... user:profile` → usage snapshot 需要 `user:profile` scope。请使用 `--no-usage`，或提供 claude.ai session key（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`），或通过 Claude CLI 重新认证。
- 当 Gateway 网关不可达时，`openclaw channels status` 会回退为仅配置摘要。如果某个受支持的渠道凭证通过 SecretRef 配置，但在当前命令路径中不可用，则会将该账户报告为已配置并附带降级说明，而不是显示为未配置。

## 能力探测

获取提供商能力提示（在可用时包括 intents / scopes）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选的；省略时会列出每个渠道（包括插件）。
- `--account` 仅在使用 `--channel` 时有效。
- `--target` 接受 `channel:<id>` 或原始数字渠道 id，并且仅适用于 Discord。
- 探测是提供商特定的：Discord intents + 可选渠道权限；Slack bot + 用户 scopes；Telegram bot 标志 + webhook；Signal 守护进程版本；Microsoft Teams app token + Graph 角色 / scopes（在已知情况下带注释）。没有探测能力的渠道会报告 `Probe: unavailable`。

## 将名称解析为 ID

使用提供商目录将渠道 / 用户名称解析为 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

说明：

- 使用 `--kind user|group|auto` 强制目标类型。
- 当多个条目共享相同名称时，解析会优先选择活动匹配项。
- `channels resolve` 是只读的。如果所选账户通过 SecretRef 配置，但该凭证在当前命令路径中不可用，则命令会返回带说明的降级未解析结果，而不是中止整个运行。
