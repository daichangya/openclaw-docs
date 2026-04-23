---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 多智能体路由：隔离的智能体、渠道账号与绑定
title: 多智能体路由
x-i18n:
    generated_at: "2026-04-23T22:57:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

在一个运行中的 Gateway 网关中，同时运行多个**彼此隔离**的智能体——每个智能体都有自己的工作区、状态目录（`agentDir`）和会话历史——以及多个渠道账号（例如两个 WhatsApp）。入站消息会通过绑定被路由到正确的智能体。

这里的**智能体**指的是完整的每个人设作用域：工作区文件、凭证配置、模型注册表和会话存储。`agentDir` 是磁盘上的状态目录，用于保存该智能体在 `~/.openclaw/agents/<agentId>/` 下的配置。**绑定**会将一个渠道账号（例如一个 Slack 工作区或一个 WhatsApp 号码）映射到其中一个智能体。

## 什么是“一个智能体”？

一个**智能体**是一个作用域完整的大脑，拥有自己的：

- **工作区**（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、人设规则）。
- **状态目录**（`agentDir`），用于存放凭证配置、模型注册表和按智能体划分的配置。
- **会话存储**（聊天历史 + 路由状态），位于 `~/.openclaw/agents/<agentId>/sessions`。

凭证配置是**按智能体划分**的。每个智能体会从自己的以下位置读取：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

这里的 `sessions_history` 也是更安全的跨会话回忆路径：它返回的是经过边界限制和脱敏处理的视图，而不是原始会话记录转储。助手回忆会移除 thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截断的工具调用块）、降级后的工具调用脚手架、泄露的 ASCII / 全角模型控制 token，以及格式错误的 MiniMax 工具调用 XML，然后再进行脱敏 / 截断。

主智能体凭证**不会**自动共享。不要在多个智能体之间复用 `agentDir`（这会导致凭证 / 会话冲突）。如果你想共享凭证，请将 `auth-profiles.json` 复制到另一个智能体的 `agentDir` 中。

Skills 会从每个智能体的工作区以及 `~/.openclaw/skills` 等共享根目录加载，然后在配置了有效的智能体 Skills 允许列表时进行过滤。使用 `agents.defaults.skills` 作为共享基线，使用 `agents.list[].skills` 作为按智能体的替换配置。请参阅
[Skills：按智能体与共享](/zh-CN/tools/skills#per-agent-vs-shared-skills) 和
[Skills：智能体 Skills 允许列表](/zh-CN/tools/skills#agent-skill-allowlists)。

Gateway 网关可以承载**一个智能体**（默认）或并行承载**多个智能体**。

**工作区说明：** 每个智能体的工作区都是**默认 cwd**，而不是硬性沙箱。相对路径会解析到工作区内，但绝对路径仍可访问主机上的其他位置，除非启用了沙箱隔离。请参阅
[沙箱隔离](/zh-CN/gateway/sandboxing)。

## 路径（快速映射）

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作区：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 智能体目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- 会话：`~/.openclaw/agents/<agentId>/sessions`

### 单智能体模式（默认）

如果你不做任何配置，OpenClaw 会运行一个单独的智能体：

- `agentId` 默认为 **`main`**。
- 会话键格式为 `agent:main:<mainKey>`。
- 工作区默认是 `~/.openclaw/workspace`（如果设置了 `OPENCLAW_PROFILE`，则为 `~/.openclaw/workspace-<profile>`）。
- 状态默认位于 `~/.openclaw/agents/main/agent`。

## 智能体辅助工具

使用智能体向导添加一个新的隔离智能体：

```bash
openclaw agents add work
```

然后添加 `bindings`（或者让向导帮你完成），将入站消息路由过去。

使用以下命令验证：

```bash
openclaw agents list --bindings
```

## 快速开始

<Steps>
  <Step title="为每个智能体创建工作区">

使用向导，或手动创建工作区：

```bash
openclaw agents add coding
openclaw agents add social
```

每个智能体都会获得自己的工作区，其中包含 `SOUL.md`、`AGENTS.md` 和可选的 `USER.md`，以及位于 `~/.openclaw/agents/<agentId>` 下的专用 `agentDir` 和会话存储。

  </Step>

  <Step title="创建渠道账号">

在你偏好的渠道中，为每个智能体创建一个账号：

- Discord：每个智能体一个 bot，启用 Message Content Intent，并复制各自的 token。
- Telegram：通过 BotFather 为每个智能体创建一个 bot，并复制各自的 token。
- WhatsApp：为每个账号关联各自的电话号码。

```bash
openclaw channels login --channel whatsapp --account work
```

请参阅各渠道指南：[Discord](/zh-CN/channels/discord)、[Telegram](/zh-CN/channels/telegram)、[WhatsApp](/zh-CN/channels/whatsapp)。

  </Step>

  <Step title="添加智能体、账号和绑定">

在 `agents.list` 下添加智能体，在 `channels.<channel>.accounts` 下添加渠道账号，并使用 `bindings` 将它们连接起来（示例见下文）。

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

在**多个智能体**场景下，每个 `agentId` 都会成为一个**完全隔离的人设**：

- **不同的电话号码 / 账号**（每个渠道的 `accountId`）。
- **不同的人格**（按智能体的工作区文件，例如 `AGENTS.md` 和 `SOUL.md`）。
- **独立的凭证 + 会话**（除非显式启用，否则不会互相串话）。

这样可以让**多个人**共享同一个 Gateway 网关服务器，同时保持各自的 AI “大脑” 和数据彼此隔离。

## 跨智能体 QMD 记忆搜索

如果一个智能体需要搜索另一个智能体的 QMD 会话记录，请在
`agents.list[].memorySearch.qmd.extraCollections` 下添加额外集合。
只有在每个智能体都应该继承相同共享会话记录集合时，才使用 `agents.defaults.memorySearch.qmd.extraCollections`。

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

额外集合路径可以在多个智能体之间共享，但当路径位于智能体工作区之外时，集合名称必须显式指定。位于工作区内的路径仍保持按智能体划分，因此每个智能体都会保留自己的会话记录搜索集合。

## 一个 WhatsApp 号码，多个人（私信拆分）

你可以在**一个 WhatsApp 账号**上，将**不同的 WhatsApp 私信**路由到不同的智能体。使用发送者的 E.164 号码（例如 `+15551234567`）并设置 `peer.kind: "direct"` 进行匹配。回复仍然会来自同一个 WhatsApp 号码（没有按智能体区分的发送者身份）。

重要细节：直接聊天会收敛到该智能体的**主会话键**，因此真正的隔离要求**每个人一个智能体**。

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

- 私信访问控制是**按 WhatsApp 账号全局生效**的（配对 / 允许列表），而不是按智能体生效。
- 对于共享群组，请将该群组绑定到一个智能体，或使用[广播群组](/zh-CN/channels/broadcast-groups)。

## 路由规则（消息如何选择智能体）

绑定是**确定性的**，并且**最具体者优先**：

1. `peer` 匹配（精确的私信 / 群组 / 渠道 id）
2. `parentPeer` 匹配（线程继承）
3. `guildId + roles`（Discord 角色路由）
4. `guildId`（Discord）
5. `teamId`（Slack）
6. 某个渠道的 `accountId` 匹配
7. 渠道级匹配（`accountId: "*"`）
8. 回退到默认智能体（`agents.list[].default`，否则为列表中的第一项，默认：`main`）

如果同一层级有多个绑定匹配，则按配置顺序，最先出现的那个获胜。
如果一个绑定设置了多个匹配字段（例如 `peer` + `guildId`），则所有已指定字段都必须满足（`AND` 语义）。

关于账号作用域的重要细节：

- 省略 `accountId` 的绑定只匹配默认账号。
- 使用 `accountId: "*"` 作为跨所有账号的渠道级回退。
- 如果你之后为同一智能体添加了具有显式账号 id 的相同绑定，OpenClaw 会将现有的仅渠道绑定升级为账号作用域绑定，而不是重复创建。

## 多个账号 / 电话号码

支持**多个账号**的渠道（例如 WhatsApp）使用 `accountId` 来标识
每次登录。每个 `accountId` 都可以路由到不同的智能体，因此一台服务器可以托管
多个电话号码，而不会混淆会话。

如果你希望在省略 `accountId` 时使用某个渠道级默认账号，可设置
`channels.<channel>.defaultAccount`（可选）。如果未设置，OpenClaw 会回退到
`default`（如果存在），否则回退到按排序后的第一个已配置账号 id。

支持这种模式的常见渠道包括：

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`：一个“脑”（工作区、按智能体划分的凭证、按智能体划分的会话存储）。
- `accountId`：一个渠道账号实例（例如 WhatsApp 账号 `"personal"` 与 `"biz"`）。
- `binding`：通过 `(channel, accountId, peer)` 并可选配 guild / team id，将入站消息路由到某个 `agentId`。
- 直接聊天会收敛到 `agent:<agentId>:<mainKey>`（按智能体划分的“主会话”；`session.mainKey`）。

## 平台示例

### 每个智能体一个 Discord bot

每个 Discord bot 账号映射到唯一的 `accountId`。将每个账号绑定到一个智能体，并为每个 bot 保持各自的允许列表。

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

- 将每个 bot 邀请到 guild 中，并启用 Message Content Intent。
- token 存放在 `channels.discord.accounts.<id>.token` 中（默认账号可以使用 `DISCORD_BOT_TOKEN`）。

### 每个智能体一个 Telegram bot

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

- 通过 BotFather 为每个智能体创建一个 bot，并复制各自的 token。
- token 存放在 `channels.telegram.accounts.<id>.botToken` 中（默认账号可以使用 `TELEGRAM_BOT_TOKEN`）。

### 每个智能体一个 WhatsApp 号码

在启动 Gateway 网关之前，先关联每个账号：

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

  // 确定性路由：第一个匹配者获胜（最具体的放前面）。
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // 可选的按 peer 覆盖（示例：将某个特定群组发送给 work 智能体）。
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // 默认关闭：智能体到智能体消息传递必须显式启用 + 加入允许列表。
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

按渠道拆分：将 WhatsApp 路由到一个快速日常智能体，将 Telegram 路由到一个 Opus 智能体。

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

- 如果某个渠道有多个账号，请在绑定中添加 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
- 如果你想将单个私信 / 群组路由到 Opus，同时让其余内容继续走 chat，请为该 peer 添加 `match.peer` 绑定；peer 匹配始终优先于渠道级规则。

## 示例：同一渠道，将一个 peer 路由到 Opus

让 WhatsApp 继续使用快速智能体，但将一个私信路由到 Opus：

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

peer 绑定始终优先，因此请将它们放在渠道级规则之前。

## 绑定到 WhatsApp 群组的家庭智能体

将一个专用家庭智能体绑定到单个 WhatsApp 群组，并启用提及门控
和更严格的工具策略：

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

- 工具允许 / 拒绝列表是针对**工具**，不是 Skills。如果某个 Skill 需要运行二进制文件，请确保允许了 `exec`，并且该二进制文件在沙箱中存在。
- 若要实现更严格的门控，请设置 `agents.list[].groupChat.mentionPatterns`，并为该渠道保持启用群组允许列表。

## 按智能体划分的沙箱与工具配置

每个智能体都可以有自己的沙箱和工具限制：

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
        // 无工具限制 - 所有工具可用
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 始终启用沙箱
          scope: "agent",  // 每个智能体一个容器
          docker: {
            // 容器创建后的可选一次性设置
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

注意：`setupCommand` 位于 `sandbox.docker` 下，并会在容器创建时运行一次。
当解析后的作用域为 `"shared"` 时，按智能体设置的 `sandbox.docker.*` 覆盖会被忽略。

**好处：**

- **安全隔离：** 限制不受信任智能体的工具
- **资源控制：** 对特定智能体启用沙箱，同时让其他智能体继续在主机上运行
- **灵活策略：** 为不同智能体设置不同权限

注意：`tools.elevated` 是**全局**且基于发送者的；它不能按智能体配置。
如果你需要按智能体设置边界，请使用 `agents.list[].tools` 拒绝 `exec`。
对于群组定向，请使用 `agents.list[].groupChat.mentionPatterns`，这样 @ 提及就能清晰地映射到目标智能体。

详细示例请参阅 [多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

## 相关

- [渠道路由](/zh-CN/channels/channel-routing) — 消息如何路由到智能体
- [子智能体](/zh-CN/tools/subagents) — 生成后台智能体运行
- [ACP Agents](/zh-CN/tools/acp-agents) — 运行外部编码 harness
- [在线状态](/zh-CN/concepts/presence) — 智能体的在线状态与可用性
- [会话](/zh-CN/concepts/session) — 会话隔离与路由
