---
read_when:
    - 你希望将 OpenClaw 连接到 IRC 渠道或私信
    - 你正在配置 IRC 允许列表、群组策略或提及门控
summary: IRC 插件设置、访问控制与故障排除
title: IRC
x-i18n:
    generated_at: "2026-04-23T20:41:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

当你希望 OpenClaw 进入经典 IRC 渠道（`#room`）和私信时，请使用 IRC。
IRC 作为内置插件提供，但需要在主配置的 `channels.irc` 下进行配置。

## 快速开始

1. 在 `~/.openclaw/openclaw.json` 中启用 IRC 配置。
2. 至少设置以下内容：

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

建议使用私有 IRC 服务器进行机器人协作。如果你有意使用公共 IRC 网络，常见选择包括 Libera.Chat、OFTC 和 Snoonet。避免将可预测的公共频道用于机器人或 swarm 的回传流量。

3. 启动/重启 Gateway 网关：

```bash
openclaw gateway run
```

## 默认安全设置

- `channels.irc.dmPolicy` 默认为 `"pairing"`。
- `channels.irc.groupPolicy` 默认为 `"allowlist"`。
- 当 `groupPolicy="allowlist"` 时，设置 `channels.irc.groups` 以定义允许的渠道。
- 除非你有意接受明文传输，否则请使用 TLS（`channels.irc.tls=true`）。

## 访问控制

IRC 渠道有两个独立的“门”：

1. **渠道访问**（`groupPolicy` + `groups`）：机器人是否完全接受来自某个渠道的消息。
2. **发送者访问**（`groupAllowFrom` / 每渠道 `groups["#channel"].allowFrom`）：谁有权在该渠道内触发机器人。

配置键：

- 私信允许列表（私信发送者访问）：`channels.irc.allowFrom`
- 群组发送者允许列表（渠道发送者访问）：`channels.irc.groupAllowFrom`
- 每渠道控制（渠道 + 发送者 + 提及规则）：`channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` 允许未配置的渠道（**默认仍然受提及门控限制**）

允许列表项应使用稳定的发送者身份（`nick!user@host`）。
仅使用裸 `nick` 匹配是可变的，并且只有在 `channels.irc.dangerouslyAllowNameMatching: true` 时才会启用。

### 常见陷阱：`allowFrom` 用于私信，不用于渠道

如果你看到这样的日志：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……这意味着该发送者未被允许发送**群组/渠道**消息。你可以通过以下方式修复：

- 设置 `channels.irc.groupAllowFrom`（对所有渠道全局生效），或
- 设置每渠道发送者允许列表：`channels.irc.groups["#channel"].allowFrom`

示例（允许 `#tuirc-dev` 中的任何人与机器人对话）：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 回复触发（提及）

即使某个渠道已被允许（通过 `groupPolicy` + `groups`），并且发送者也被允许，OpenClaw 在群组场景下默认仍启用**提及门控**。

这意味着，除非消息中包含与机器人匹配的提及模式，否则你可能会看到类似 `drop channel … (missing-mention)` 的日志。

如果你希望机器人在 IRC 渠道中**无需提及即可回复**，请为该渠道禁用提及门控：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

或者，如果你希望允许**所有** IRC 渠道（不使用每渠道允许列表），并且仍然无需提及即可回复：

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## 安全说明（推荐用于公共渠道）

如果你在公共渠道中设置 `allowFrom: ["*"]`，任何人都可以提示机器人。
为降低风险，建议限制该渠道可用的工具。

### 渠道内所有人使用相同的工具权限

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### 按发送者区分工具权限（所有者权限更大）

使用 `toolsBySender`，对 `"*"` 应用更严格的策略，对你的 nick 应用更宽松的策略：

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

说明：

- `toolsBySender` 键应对 IRC 发送者身份值使用 `id:`：
  使用 `id:eigen`，或使用 `id:eigen!~eigen@174.127.248.171` 进行更强匹配。
- 旧版无前缀键仍然受支持，但只会按 `id:` 进行匹配。
- 首个匹配到的发送者策略优先生效；`"*"` 是通配回退。

有关群组访问与提及门控（以及它们如何交互）的更多信息，请参阅：[/channels/groups](/zh-CN/channels/groups)。

## NickServ

连接后若要通过 NickServ 进行身份验证：

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

连接时可选执行一次性注册：

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

在 nick 完成注册后禁用 `register`，以避免重复尝试执行 REGISTER。

## 环境变量

默认账户支持：

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`（逗号分隔）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` 不能通过工作区 `.env` 设置；请参阅[工作区 `.env` 文件](/zh-CN/gateway/security)。

## 故障排除

- 如果机器人已连接但从不在渠道中回复，请检查 `channels.irc.groups`，**以及**是否因为提及门控而丢弃了消息（`missing-mention`）。如果你希望它无需 ping 就能回复，请为该渠道设置 `requireMention:false`。
- 如果登录失败，请检查 nick 是否可用以及服务器密码是否正确。
- 如果在自定义网络上 TLS 失败，请检查 host/port 和证书配置。

## 相关内容

- [渠道概览](/zh-CN/channels)——所有支持的渠道
- [配对](/zh-CN/channels/pairing)——私信认证与配对流程
- [群组](/zh-CN/channels/groups)——群聊行为与提及门控
- [渠道路由](/zh-CN/channels/channel-routing)——消息的会话路由
- [安全](/zh-CN/gateway/security)——访问模型与加固措施
