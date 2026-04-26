---
read_when:
    - 你想添加/移除渠道账户（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Matrix）
    - 你想检查渠道 Status 或持续查看渠道日志
summary: '`openclaw channels` 的 CLI 参考（账户、Status、登录/登出、日志）'
title: 渠道
x-i18n:
    generated_at: "2026-04-26T12:02:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

在 Gateway 网关上管理聊天渠道账户及其运行时 Status。

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

## Status / capabilities / resolve / logs

- `channels status`：`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（仅可与 `--channel` 一起使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是实时路径：当 Gateway 网关可访问时，它会对每个账户运行 `probeAccount` 和可选的 `auditAccount` 检查，因此输出中可能包含传输状态，以及诸如 `works`、`probe failed`、`audit ok` 或 `audit failed` 之类的探测结果。
如果 Gateway 网关不可访问，`channels status` 会回退为仅基于配置的摘要，而不是实时探测输出。

## 添加 / 移除账户

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

提示：`openclaw channels add --help` 会显示各渠道专用的标志（token、私钥、应用 token、signal-cli 路径等）。

常见的非交互式添加入口包括：

- bot-token 渠道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 传输字段：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 字段：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 字段：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 字段：`--private-key`、`--relay-urls`
- Tlon 字段：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env`：用于支持的默认账户、基于环境变量的认证

如果某个渠道插件需要在基于标志的 add 命令期间安装，OpenClaw 会使用该渠道的默认安装源，而不会打开交互式插件安装提示。

当你在不带标志的情况下运行 `openclaw channels add` 时，交互式向导可能会提示：

- 为所选渠道设置账户 id
- 为这些账户设置可选显示名称
- `Bind configured channel accounts to agents now?`

如果你确认立即绑定，向导会询问每个已配置的渠道账户应归属于哪个智能体，并写入按账户范围划分的路由绑定。

你也可以稍后使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 来管理同样的路由规则（参见 [agents](/zh-CN/cli/agents)）。

当你向仍在使用单账户顶层设置的渠道添加非默认账户时，OpenClaw 会先将按账户范围划分的顶层值提升到该渠道的账户映射中，然后再写入新账户。大多数渠道会将这些值放入 `channels.<channel>.accounts.default`，但内置渠道也可能保留一个现有且匹配的已提升账户。Matrix 就是当前的例子：如果已经存在一个具名账户，或者 `defaultAccount` 指向一个现有的具名账户，那么提升过程会保留该账户，而不是新建一个 `accounts.default`。

路由行为保持一致：

- 现有仅按渠道匹配的绑定（没有 `accountId`）会继续匹配默认账户。
- `channels add` 在非交互模式下不会自动创建或重写绑定。
- 交互式设置可以选择性地添加按账户范围划分的绑定。

如果你的配置已经处于混合状态（存在具名账户，同时顶层单账户值仍然保留），请运行 `openclaw doctor --fix`，将按账户范围划分的值移动到该渠道所选的已提升账户中。大多数渠道会提升到 `accounts.default`；Matrix 则可以保留一个现有的具名/默认目标账户。

## 登录 / 登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

说明：

- `channels login` 支持 `--verbose`。
- 当只配置了一个受支持的登录目标时，`channels login` / `logout` 可以自动推断渠道。

## 故障排除

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 获取引导式修复。
- `openclaw channels list` 输出 `Claude: HTTP 403 ... user:profile` → usage 快照需要 `user:profile` scope。可使用 `--no-usage`，或提供 claude.ai 会话密钥（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`），或通过 Claude CLI 重新认证。
- 当 Gateway 网关不可访问时，`openclaw channels status` 会回退为仅基于配置的摘要。如果某个受支持的渠道凭证是通过 SecretRef 配置的，但在当前命令路径中不可用，它会将该账户报告为“已配置但状态降级”，并附带说明，而不是显示为未配置。

## capabilities 探测

获取提供商能力提示（可用时包括 intents/scopes）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选的；省略时会列出所有渠道（包括扩展）。
- `--account` 仅在与 `--channel` 一起使用时有效。
- `--target` 接受 `channel:<id>` 或原始数字渠道 id，并且仅适用于 Discord。
- 探测是按提供商实现的：Discord intents + 可选渠道权限；Slack bot + 用户 scopes；Telegram bot 标志 + webhook；Signal 守护进程版本；Microsoft Teams 应用 token + Graph 角色/scopes（在已知时会附加标注）。没有探测能力的渠道会报告 `Probe: unavailable`。

## 将名称解析为 ID

使用提供商目录将渠道/用户名称解析为 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

说明：

- 使用 `--kind user|group|auto` 可强制指定目标类型。
- 当多个条目共享相同名称时，解析会优先选择活跃匹配项。
- `channels resolve` 是只读操作。如果所选账户是通过 SecretRef 配置的，但该凭证在当前命令路径中不可用，则该命令会返回带说明的降级未解析结果，而不是中止整个运行。

## 相关内容

- [CLI reference](/zh-CN/cli)
- [Channels overview](/zh-CN/channels)
