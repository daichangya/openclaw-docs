---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 多智能体路由：隔离的智能体、渠道账户和绑定
title: 多智能体路由
x-i18n:
    generated_at: "2026-04-23T20:46:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2970892331b8b6930309201c7054b1c06c76adc6c34924c5f455df9c8c1bd5f
    source_path: concepts/multi-agent.md
    workflow: 15
---

目标：在一个正在运行的 Gateway 网关中使用多个**隔离的**智能体（独立的工作区 + `agentDir` + 会话），以及多个渠道账户（例如两个 WhatsApp）。入站消息会通过绑定路由到某个智能体。

## 什么是“一个智能体”？

一个**智能体**是一个完整作用域的“大脑”，拥有它自己的：

- **工作区**（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、人格规则）。
- **状态目录**（`agentDir`），用于存放身份验证配置、模型注册表和按智能体划分的配置。
- **会话存储**（聊天历史 + 路由状态），位于 `~/.openclaw/agents/<agentId>/sessions` 下。

身份验证配置是**按智能体隔离**的。每个智能体都从自己的以下位置读取：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

此处 `sessions_history` 也是更安全的跨会话回忆路径：它返回的是
有边界、经过净化的视图，而不是原始转录全文。助手回忆会剥离
thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML
负载（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>` 以及被截断的工具调用块）、
降级后的工具调用脚手架、泄露的 ASCII/全角模型控制
令牌，以及在脱敏/截断前格式错误的 MiniMax 工具调用 XML。

主智能体的凭证**不会**自动共享。绝不要在多个智能体之间复用 `agentDir`
（这会导致身份验证/会话冲突）。如果你确实想共享凭证，
请将 `auth-profiles.json` 复制到另一个智能体的 `agentDir` 中。

Skills 会从每个智能体工作区以及共享根目录（例如
`~/.openclaw/skills`）中加载，然后在配置了有效智能体 Skills allowlist 时进行过滤。
使用 `agents.defaults.skills` 作为共享基线，
使用 `agents.list[].skills` 进行按智能体替换。参见
[Skills：按智能体与共享](/zh-CN/tools/skills#per-agent-vs-shared-skills) 和
[Skills：智能体 Skills allowlist](/zh-CN/tools/skills#agent-skill-allowlists)。

Gateway 网关可以托管**一个智能体**（默认）或并排托管**多个智能体**。

**工作区说明：** 每个智能体的工作区都是**默认 cwd**，而不是硬性
沙箱。相对路径会在工作区内解析，但绝对路径仍可访问主机上的其他位置，除非启用了沙箱隔离。参见
[沙箱隔离](/zh-CN/gateway/sandboxing)。

## 路径（速查图）

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作区：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 智能体目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- 会话：`~/.openclaw/agents/<agentId>/sessions`

### 单智能体模式（默认）

如果你什么都不做，OpenClaw 会运行一个单智能体：

- `agentId` 默认为 **`main`**。
- 会话键格式为 `agent:main:<mainKey>`。
- 工作区默认为 `~/.openclaw/workspace`（设置了 `OPENCLAW_PROFILE` 时，则为 `~/.openclaw/workspace-<profile>`）。
- 状态默认为 `~/.openclaw/agents/main/agent`。

## 智能体助手

使用智能体向导添加新的隔离智能体：

```bash
openclaw agents add work
```

然后添加 `bindings`（或让向导代为完成）以路由入站消息。

可通过以下命令验证：

```bash
openclaw agents list --bindings
```

## 快速开始

<Steps>
  <Step title="创建每个智能体工作区">

使用向导，或手动创建工作区：

```bash
openclaw agents add coding
openclaw agents add social
```

每个智能体都会获得自己的工作区，其中包含 `SOUL.md`、`AGENTS.md` 和可选的 `USER.md`，以及位于 `~/.openclaw/agents/<agentId>` 下专用的 `agentDir` 和会话存储。

  </Step>

  <Step title="创建渠道账户">

在你偏好的渠道上，为每个智能体创建一个账户：

- Discord：每个智能体一个机器人，启用 Message Content Intent，并复制各自的令牌。
- Telegram：通过 BotFather 为每个智能体创建一个机器人，并复制各自的令牌。
- WhatsApp：为每个账户绑定各自的电话号码。

```bash
openclaw channels login --channel whatsapp --account work
```

参见渠道指南：[Discord](/zh-CN/channels/discord)、[Telegram](/zh-CN/channels/telegram)、[WhatsApp](/zh-CN/channels/whatsapp)。

  </Step>

  <Step title="添加智能体、账户和绑定">

将智能体添加到 `agents.list` 下，将渠道账户添加到 `channels.<channel>.accounts` 下，并使用 `bindings` 将它们连接起来（参见下方示例）。

  </Step>

  <Step title="重启并验证">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## 多个智能体 = 多个人，多种人格

使用**多个智能体**时，每个 `agentId` 都会成为一个**完全隔离的人格**：

- **不同的电话号码/账户**（按渠道 `accountId`）。
- **不同的人格**（通过按智能体划分的工作区文件，如 `AGENTS.md` 和 `SOUL.md`）。
- **独立的身份验证 + 会话**（除非显式启用，否则不会互相串话）。

这使得**多个人**可以共享一个 Gateway 网关服务器，同时保持各自的 AI “大脑” 和数据相互隔离。

## 跨智能体 QMD memory 搜索

如果某个智能体需要搜索另一个智能体的 QMD 会话转录，请在
`agents.list[].memorySearch.qmd.extraCollections` 下添加额外集合。
只有当每个智能体都应继承相同的共享转录集合时，
才使用 `agents.defaults.memorySearch.qmd.extraCollections`。

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // 在工作区内解析 -> 集合名为 "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

额外集合路径可以在智能体之间共享，但当路径位于智能体工作区之外时，
集合名称必须保持显式。位于工作区内的路径仍按智能体划分作用域，
从而确保每个智能体拥有自己的转录搜索集合。

## 一个 WhatsApp 号码，多个人（私信拆分）

你可以在**同一个 WhatsApp 账户**上，将**不同的 WhatsApp 私信**路由到不同智能体。使用 E.164 发送者号码（例如 `+15551234567`）匹配，`peer.kind: "direct"`。回复仍然来自同一个 WhatsApp 号码（不会有按智能体区分的发送者身份）。

重要细节：私聊会折叠到智能体的**主会话键**，因此要实现真正隔离，必须做到**每个人一个智能体**。

示例：

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

说明：

- 私信访问控制是**按 WhatsApp 账户全局生效**的（pairing/allowlist），而不是按智能体。
- 对于共享群组，请将该群组绑定到一个智能体，或使用[广播群组](/zh-CN/channels/broadcast-groups)。

## 路由规则（消息如何选择智能体）

绑定是**确定性的**，并遵循**最具体匹配优先**：

1. `peer` 匹配（精确私信/群组/频道 id）
2. `parentPeer` 匹配（线程继承）
3. `guildId + roles`（Discord 角色路由）
4. `guildId`（Discord）
5. `teamId`（Slack）
6. 某渠道的 `accountId` 匹配
7. 渠道级匹配（`accountId: "*"`）
8. 回退到默认智能体（`agents.list[].default`，否则为列表中的第一个条目，默认：`main`）

如果同一层级中有多个绑定匹配，则按配置顺序，先出现者获胜。
如果一个绑定设置了多个匹配字段（例如 `peer` + `guildId`），则所有指定字段都必须匹配（`AND` 语义）。

关于账户作用域的重要细节：

- 省略 `accountId` 的绑定只匹配默认账户。
- 若要为某个渠道下所有账户设置回退，请使用 `accountId: "*"`。
- 如果你之后为同一智能体添加了相同绑定，但带有显式账户 id，OpenClaw 会将现有的仅渠道绑定升级为账户作用域绑定，而不是创建重复项。

## 多账户 / 多电话号码

支持**多账户**的渠道（例如 WhatsApp）使用 `accountId` 来标识
每一次登录。每个 `accountId` 都可以路由到不同的智能体，因此一台服务器可以托管
多个电话号码，而不会混淆会话。

如果你希望在省略 `accountId` 时使用某个渠道级默认账户，请设置
`channels.<channel>.defaultAccount`（可选）。如果未设置，OpenClaw 会回退到
`default`（如果存在），否则使用按排序后的第一个已配置账户 id。

常见支持此模式的渠道包括：

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`：一个“大脑”（工作区、按智能体划分的身份验证、按智能体划分的会话存储）。
- `accountId`：一个渠道账户实例（例如 WhatsApp 账户 `"personal"` 与 `"biz"`）。
- `binding`：通过 `(channel, accountId, peer)`，并可选附带 guild/team id，将入站消息路由到某个 `agentId`。
- 私聊会折叠到 `agent:<agentId>:<mainKey>`（按智能体划分的“主会话”；`session.mainKey`）。

## 平台示例

### 每个智能体一个 Discord 机器人

每个 Discord 机器人账户映射到一个唯一的 `accountId`。将每个账户绑定到一个智能体，并为每个机器人维护各自的 allowlist。

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

说明：

- 邀请每个机器人加入 guild，并启用 Message Content Intent。
- 令牌存放在 `channels.discord.accounts.<id>.token` 中（默认账户可使用 `DISCORD_BOT_TOKEN`）。

### 每个智能体一个 Telegram 机器人

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

说明：

- 通过 BotFather 为每个智能体创建一个机器人，并复制各自的令牌。
- 令牌存放在 `channels.telegram.accounts.<id>.botToken` 中（默认账户可使用 `TELEGRAM_BOT_TOKEN`）。

### 每个智能体一个 WhatsApp 号码

在启动 Gateway 网关之前，为每个账户完成绑定：

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json`（JSON5）：

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // 确定性路由：第一个匹配获胜（最具体的规则优先）。
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // 可选的按对等端覆盖（示例：将某个特定群组发送到 work 智能体）。
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // 默认关闭：智能体到智能体消息必须显式启用 + 加入 allowlist。
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // 可选覆盖。默认值：~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // 可选覆盖。默认值：~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## 示例：WhatsApp 日常聊天 + Telegram 深度工作

按渠道拆分：将 WhatsApp 路由到一个快速的日常智能体，将 Telegram 路由到一个 Opus 智能体。

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

说明：

- 如果某个渠道有多个账户，请在绑定中添加 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
- 若要将某个单独的私信/群组路由到 Opus，同时其余消息仍走 chat，请为该对等端添加一个 `match.peer` 绑定；对等端匹配始终优先于渠道级规则。

## 示例：同一渠道，将一个对等端路由到 Opus

保持 WhatsApp 使用快速智能体，但将某一个私信路由到 Opus：

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

对等端绑定始终优先，因此请将它们放在渠道级规则之上。

## 绑定到 WhatsApp 群组的家庭智能体

将一个专用的家庭智能体绑定到单个 WhatsApp 群组，并启用提及门控
以及更严格的工具策略：

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

说明：

- 工具 allow/deny 列表是针对**工具**的，不是 Skills。如果某个 Skill 需要运行
  一个二进制程序，请确保允许了 `exec`，并且该二进制文件存在于沙箱中。
- 若要更严格的门控，请设置 `agents.list[].groupChat.mentionPatterns`，并保持
  该渠道启用了群组 allowlist。

## 按智能体配置沙箱和工具

每个智能体都可以拥有自己的沙箱和工具限制：

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // personal 智能体不使用沙箱
        },
        // 无工具限制 - 所有工具均可用
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 始终启用沙箱
          scope: "agent",  // 每个智能体一个容器
          docker: {
            // 可选的一次性设置，在容器创建后运行
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 仅允许 read 工具
          deny: ["exec", "write", "edit", "apply_patch"],    // 拒绝其他工具
        },
      },
    ],
  },
}
```

注意：`setupCommand` 位于 `sandbox.docker` 下，并在容器创建时运行一次。
当解析后的作用域为 `"shared"` 时，按智能体配置的 `sandbox.docker.*` 覆盖会被忽略。

**好处：**

- **安全隔离**：为不受信任的智能体限制工具
- **资源控制**：对特定智能体启用沙箱，同时让其他智能体仍运行在主机上
- **灵活策略**：按智能体配置不同权限

注意：`tools.elevated` 是**全局**且基于发送者的；不能按智能体配置。
如果你需要按智能体划分边界，请使用 `agents.list[].tools` 拒绝 `exec`。
对于群组定向，请使用 `agents.list[].groupChat.mentionPatterns`，这样 @提及就能清晰映射到目标智能体。

详见 [多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools) 中的详细示例。

## 相关

- [渠道路由](/zh-CN/channels/channel-routing) — 消息如何路由到智能体
- [子智能体](/zh-CN/tools/subagents) — 生成后台智能体运行
- [ACP 智能体](/zh-CN/tools/acp-agents) — 运行外部编码 harness
- [存在状态](/zh-CN/concepts/presence) — 智能体存在状态和可用性
- [会话](/zh-CN/concepts/session) — 会话隔离和路由
