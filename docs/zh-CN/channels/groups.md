---
read_when:
    - 更改群聊行为或提及门控
summary: 跨不同界面上的群聊行为（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群组
x-i18n:
    generated_at: "2026-04-23T17:19:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17f61407e916114e75b43ed781c43d9291b9ea5758ae4a7cd27407a0c994d375
    source_path: channels/groups.md
    workflow: 15
---

# 群组

OpenClaw 在不同界面上的群聊处理方式保持一致：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 新手介绍（2 分钟）

OpenClaw “运行”在你自己的消息账号上。没有单独的 WhatsApp 机器人用户。
如果**你**在某个群组中，OpenClaw 就可以看到该群组并在那里回复。

默认行为：

- 群组默认受限（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非你显式禁用提及门控。

也就是说：在允许列表中的发送者可以通过提及 OpenClaw 来触发它。

> TL;DR
>
> - **私信访问**由 `*.allowFrom` 控制。
> - **群组访问**由 `*.groupPolicy` + 允许列表（`*.groups`、`*.groupAllowFrom`）控制。
> - **回复触发**由提及门控（`requireMention`、`/activation`）控制。

快速流程（群组消息的处理过程）：

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 上下文可见性与允许列表

群组安全涉及两种不同的控制方式：

- **触发授权**：谁可以触发智能体（`groupPolicy`、`groups`、`groupAllowFrom`、渠道特定的允许列表）。
- **上下文可见性**：哪些补充上下文会注入到模型中（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保证正常的聊天行为，并尽量保留消息接收时的原始上下文。这意味着，允许列表主要决定谁可以触发操作，而不是对每一段引用或历史片段都进行通用脱敏的边界。

当前行为因渠道而异：

- 某些渠道已经在特定路径中对补充上下文应用了基于发送者的过滤（例如 Slack 线程初始化、Matrix 回复 / 线程查询）。
- 其他渠道仍会按接收时原样传递引用 / 回复 / 转发上下文。

加固方向（计划中）：

- `contextVisibility: "all"`（默认）保持当前按接收时原样处理的行为。
- `contextVisibility: "allowlist"` 将补充上下文过滤为仅来自允许列表发送者。
- `contextVisibility: "allowlist_quote"` 在 `allowlist` 基础上额外允许一个显式的引用 / 回复例外。

在这一加固模型尚未在各渠道中一致实现之前，请预期不同界面之间会存在差异。

![群组消息流程](/images/groups-flow.svg)

如果你想要……

| 目标 | 需要设置的内容 |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允许所有群组，但仅在 `@mentions` 时回复 | `groups: { "*": { requireMention: true } }`                |
| 禁用所有群组回复 | `groupPolicy: "disabled"`                                  |
| 仅允许特定群组 | `groups: { "<group-id>": { ... } }`（不使用 `"*"` 键）         |
| 只有你可以在群组中触发 | `groupPolicy: "allowlist"`，`groupAllowFrom: ["+1555..."]` |

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间 / 渠道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛话题会在群组 id 后附加 `:topic:<threadId>`，因此每个话题都有自己的会话。
- 私聊使用主会话（如果已配置，也可以按发送者分别使用）。
- 群组会话会跳过心跳。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公开群组（单个智能体）

可以——如果你的“个人”流量是**私信**，而“公开”流量是**群组**，这种方式效果很好。

原因是：在单智能体模式下，私信通常会进入**主**会话键（`agent:main:main`），而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果你启用沙箱隔离并设置 `mode: "non-main"`，这些群组会话就会在已配置的沙箱后端中运行，而你的主私信会话仍留在主机上。如果你没有自行选择后端，Docker 是默认后端。

这样你就拥有了一个智能体“大脑”（共享工作区 + 记忆），但有两种不同的执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具

> 如果你需要真正独立的工作区 / 人设（“个人”和“公开”绝不能混用），请使用第二个智能体 + 绑定。参见 [Multi-Agent Routing](/zh-CN/concepts/multi-agent)。

示例（私信在主机上运行，群组在沙箱中运行并仅允许消息工具）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

想要实现“群组只能看到文件夹 X”，而不是“完全没有主机访问权限”？保留 `workspaceAccess: "none"`，然后只将允许列表中的路径挂载到沙箱中：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

相关内容：

- 配置键和默认值：[Gateway 配置](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)
- 调试为什么某个工具被阻止：[沙箱 vs 工具策略 vs 提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱隔离](/zh-CN/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 保留给房间 / 渠道；群聊使用 `g-<slug>`（小写，空格转为 `-`，保留 `#@+._-`）。

## 群组策略

控制每个渠道如何处理群组 / 房间消息：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| 策略 | 行为 |
| ------------- | ------------------------------------------------------------ |
| `"open"` | 群组绕过允许列表；提及门控仍然适用。 |
| `"disabled"` | 完全阻止所有群组消息。 |
| `"allowlist"` | 仅允许与已配置允许列表匹配的群组 / 房间。 |

说明：

- `groupPolicy` 与提及门控是分开的（提及门控要求 `@mentions`）。
- WhatsApp / Telegram / Signal / iMessage / Microsoft Teams / Zalo：使用 `groupAllowFrom`（回退为显式 `allowFrom`）。
- 私信配对批准（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍需通过群组允许列表显式控制。
- Discord：允许列表使用 `channels.discord.guilds.<id>.channels`。
- Slack：允许列表使用 `channels.slack.channels`。
- Matrix：允许列表使用 `channels.matrix.groups`。优先使用房间 ID 或别名；已加入房间的名称查询仅为尽力而为，运行时无法解析的名称会被忽略。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持按房间配置 `users` 允许列表。
- 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram 允许列表可匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
- 默认值是 `groupPolicy: "allowlist"`；如果你的群组允许列表为空，群组消息会被阻止。
- 运行时安全：当某个提供商配置块完全缺失时（`channels.<provider>` 不存在），群组策略会回退到故障关闭模式（通常是 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

快速心智模型（群组消息的评估顺序）：

1. `groupPolicy`（open / disabled / allowlist）
2. 群组允许列表（`*.groups`、`*.groupAllowFrom`、渠道特定允许列表）
3. 提及门控（`requireMention`、`/activation`）

## 提及门控（默认）

除非按群组覆盖，否则群组消息需要提及。默认值按各子系统存放在 `*.groups."*"` 下。

如果渠道支持回复元数据，那么回复机器人消息会被视为隐式提及。
如果渠道暴露引用元数据，那么引用机器人消息也可以被视为隐式提及。当前内置支持的渠道包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

说明：

- `mentionPatterns` 是不区分大小写的安全正则模式；无效模式和不安全的嵌套重复形式会被忽略。
- 提供显式提及的界面仍然会通过；这些模式只是后备方案。
- 按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（当多个智能体共享一个群组时很有用）。
- 只有在可以检测提及时，才会强制执行提及门控（原生提及或已配置 `mentionPatterns`）。
- Discord 默认值位于 `channels.discord.guilds."*"`（可按 guild / channel 覆盖）。
- 群组历史上下文会在各渠道间以统一方式包装，并且仅包含**待处理消息**（即因提及门控而被跳过的消息）；全局默认值使用 `messages.groupChat.historyLimit`，覆盖值使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）。设置为 `0` 可禁用。

## 群组 / 渠道工具限制（可选）

某些渠道配置支持限制**特定群组 / 房间 / 渠道内部**可用的工具。

- `tools`：为整个群组允许 / 拒绝工具。
- `toolsBySender`：群组内按发送者进行覆盖。
  使用显式键前缀：
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及通配符 `"*"`。
  旧版无前缀键仍然被接受，但只会按 `id:` 匹配。

解析顺序（越具体优先级越高）：

1. 群组 / 渠道 `toolsBySender` 匹配
2. 群组 / 渠道 `tools`
3. 默认值（`"*"`）`toolsBySender` 匹配
4. 默认值（`"*"`）`tools`

示例（Telegram）：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

说明：

- 群组 / 渠道工具限制会在全局 / 智能体工具策略之外额外应用（`deny` 仍然优先）。
- 某些渠道对房间 / 渠道使用不同的嵌套结构（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。

## 群组允许列表

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，这些键会作为群组允许列表。使用 `"*"` 可允许所有群组，同时仍可设置默认的提及行为。

一个常见误解是：私信配对批准并不等同于群组授权。
对于支持私信配对的渠道，配对存储只会解锁私信。群组命令仍然需要通过配置允许列表显式进行群组发送者授权，例如 `groupAllowFrom`，或该渠道文档中说明的配置回退项。

常见意图（可直接复制 / 粘贴）：

1. 禁用所有群组回复

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 仅允许特定群组（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. 允许所有群组但要求提及（显式设置）

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. 只有所有者可以在群组中触发（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## 激活（仅所有者）

群组所有者可以按群组切换激活模式：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 决定（若未设置，则使用机器人的自身 E.164）。请将该命令作为单独一条消息发送。其他界面当前会忽略 `/activation`。

## 上下文字段

群组入站负载会设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛话题还会包含 `MessageThreadId` 和 `IsForum`。

渠道特定说明：

- BlueBubbles 可以在填充 `GroupMembers` 之前，选择性地从本地联系人数据库中补充未命名的 macOS 群组参与者信息。此功能默认关闭，并且仅在正常群组门控通过后才会运行。

在新群组会话的第一轮中，智能体系统提示会包含群组介绍。它会提醒模型像人类一样回复、避免使用 Markdown 表格、尽量减少空行、遵循正常聊天间距，并避免输入字面量 `\n` 序列。来自渠道的群组名称和参与者标签会作为带围栏的不受信任元数据呈现，而不是内联系统指令。

## iMessage 细节

- 在路由或允许列表中优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终会返回到同一个 `chat_id`。

## WhatsApp 系统提示

有关规范的 WhatsApp 系统提示规则，包括群组和私聊提示解析、通配符行为以及账号覆盖语义，请参见 [WhatsApp](/zh-CN/channels/whatsapp#system-prompts)。

## WhatsApp 细节

有关仅适用于 WhatsApp 的行为（历史注入、提及处理细节），请参见 [群组消息](/zh-CN/channels/group-messages)。
