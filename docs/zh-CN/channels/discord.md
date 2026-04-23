---
read_when:
    - 正在开发 Discord 渠道功能
summary: Discord 机器人支持状态、功能和配置
title: Discord
x-i18n:
    generated_at: "2026-04-23T08:25:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord（Bot API）

状态：已就绪，可通过官方 Discord gateway 用于私信和服务器频道。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Discord 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复流程。
  </Card>
</CardGroup>

## 快速开始

你需要创建一个带有机器人的新应用，将机器人添加到你的服务器中，并将其与 OpenClaw 配对。我们建议将你的机器人添加到你自己的私有服务器。如果你还没有服务器，请先[创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和机器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然后点击 **New Application**。给它起一个类似 “OpenClaw” 的名字。

    点击侧边栏中的 **Bot**。将 **Username** 设置为你对 OpenClaw 智能体的称呼。

  </Step>

  <Step title="启用特权 intents">
    仍然停留在 **Bot** 页面，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色允许列表和名称到 ID 匹配需要它）
    - **Presence Intent**（可选；仅在需要在线状态更新时启用）

  </Step>

  <Step title="复制你的机器人令牌">
    向上滚动回 **Bot** 页面并点击 **Reset Token**。

    <Note>
    尽管名字叫这样，这会生成你的第一个令牌——并没有任何内容被“重置”。
    </Note>

    复制该令牌并将其保存到某处。这就是你的 **Bot Token**，你很快就会用到它。

  </Step>

  <Step title="生成邀请 URL，并将机器人添加到你的服务器">
    点击侧边栏中的 **OAuth2**。你将生成一个带有正确权限的邀请 URL，用于将机器人添加到你的服务器。

    向下滚动到 **OAuth2 URL Generator** 并启用：

    - `bot`
    - `applications.commands`

    下方会出现一个 **Bot Permissions** 部分。至少启用：

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（可选）

    这是普通文本频道的基础权限集。如果你计划在 Discord 线程中发帖，包括会创建或继续线程的论坛或媒体频道工作流，还需要启用 **Send Messages in Threads**。
    复制底部生成的 URL，将其粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 进行连接。现在你应该能在 Discord 服务器中看到你的机器人。

  </Step>

  <Step title="启用 Developer Mode 并收集你的 ID">
    回到 Discord 应用中，你需要启用 Developer Mode，这样你才能复制内部 ID。

    1. 点击 **User Settings**（头像旁边的齿轮图标）→ **Advanced** → 打开 **Developer Mode**
    2. 在侧边栏中右键点击你的**服务器图标** → **Copy Server ID**
    3. 右键点击你自己的**头像** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存——下一步你需要把这三个值都提供给 OpenClaw。

  </Step>

  <Step title="允许来自服务器成员的私信">
    为了让配对正常工作，Discord 需要允许你的机器人向你发送私信。右键点击你的**服务器图标** → **Privacy Settings** → 打开 **Direct Messages**。

    这样服务器成员（包括机器人）就可以向你发送私信。如果你想通过 OpenClaw 使用 Discord 私信，请保持此设置开启。如果你只打算使用服务器频道，那么配对完成后可以关闭私信。

  </Step>

  <Step title="安全地设置你的机器人令牌（不要在聊天中发送它）">
    你的 Discord 机器人令牌是机密信息（就像密码一样）。在给你的智能体发送消息之前，先在运行 OpenClaw 的机器上设置它。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    如果 OpenClaw 已经作为后台服务在运行，请通过 OpenClaw Mac 应用重启它，或者停止并重新启动 `openclaw gateway run` 进程。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在任何现有渠道（例如 Telegram）上与你的 OpenClaw 智能体聊天，并告诉它。如果 Discord 是你的第一个渠道，请改用 CLI / 配置标签页。

        > “我已经在配置中设置了 Discord 机器人令牌。请使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 设置。”
      </Tab>
      <Tab title="CLI / 配置">
        如果你更喜欢基于文件的配置，请设置：

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        默认账户的环境变量回退：

```bash
DISCORD_BOT_TOKEN=...
```

        支持明文 `token` 值。`channels.discord.token` 也支持跨 env/file/exec 提供商的 SecretRef 值。参见 [Secrets Management](/zh-CN/gateway/secrets)。

      </Tab>
    </Tabs>

  </Step>

  <Step title="批准首次私信配对">
    等待 Gateway 网关运行起来，然后在 Discord 中向你的机器人发送私信。它会回复一个配对码。

    <Tabs>
      <Tab title="询问你的智能体">
        在你现有的渠道中，将该配对码发送给你的智能体：

        > “批准这个 Discord 配对码：`<CODE>`”
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配对码会在 1 小时后过期。

    现在你应该已经可以通过 Discord 私信与你的智能体聊天了。

  </Step>
</Steps>

<Note>
令牌解析具有账户感知能力。配置中的令牌值优先于环境变量回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。
对于高级出站调用（消息工具/渠道操作），显式的每次调用 `token` 会用于该次调用。这适用于发送以及读取/探测类操作（例如 read/search/fetch/thread/pins/permissions）。账户策略/重试设置仍来自活动运行时快照中所选账户。
</Note>

## 推荐：设置服务器工作区

一旦私信工作正常，你就可以将 Discord 服务器设置为一个完整工作区，其中每个频道都会获得自己的智能体会话及其各自的上下文。对于只有你和机器人使用的私有服务器，我们推荐这样配置。

<Steps>
  <Step title="将你的服务器添加到服务器允许列表">
    这样你的智能体就可以在服务器中的任何频道响应，而不仅仅是在私信中。

    <Tabs>
      <Tab title="询问你的智能体">
        > “将我的 Discord Server ID `<server_id>` 添加到服务器允许列表”
      </Tab>
      <Tab title="配置">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="允许在不使用 @mention 的情况下回复">
    默认情况下，你的智能体只会在被 @mention 时才在服务器频道中响应。对于私有服务器，你很可能希望它对每条消息都做出响应。

    <Tabs>
      <Tab title="询问你的智能体">
        > “允许我的智能体在这个服务器中无需被 @mention 也能回复”
      </Tab>
      <Tab title="配置">
        在你的服务器配置中设置 `requireMention: false`：

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="为服务器频道中的记忆做好规划">
    默认情况下，长期记忆（MEMORY.md）只会在私信会话中加载。服务器频道不会自动加载 MEMORY.md。

    <Tabs>
      <Tab title="询问你的智能体">
        > “当我在 Discord 频道中提问时，如果你需要来自 MEMORY.md 的长期上下文，请使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手动">
        如果你需要在每个频道中共享上下文，请将稳定的说明放入 `AGENTS.md` 或 `USER.md`（它们会注入到每个会话中）。将长期笔记保存在 `MEMORY.md` 中，并在需要时通过 memory 工具访问它们。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在，在你的 Discord 服务器上创建一些频道并开始聊天吧。你的智能体可以看到频道名称，并且每个频道都会获得自己隔离的会话——因此你可以设置 `#coding`、`#home`、`#research`，或者任何适合你工作流的频道。

## 运行时模型

- Gateway 网关负责 Discord 连接。
- 回复路由是确定性的：来自 Discord 的入站回复会返回到 Discord。
- 默认情况下（`session.dmScope=main`），私聊共享智能体主会话（`agent:main:main`）。
- 服务器频道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 默认忽略群组私信（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍携带 `CommandTargetSessionKey` 指向路由后的对话会话。

## 论坛频道

Discord 论坛和媒体频道只接受线程帖子。OpenClaw 支持两种创建方式：

- 向论坛父频道（`channel:<forumId>`）发送消息，以自动创建线程。线程标题使用你消息中的第一条非空行。
- 使用 `openclaw message thread create` 直接创建线程。不要为论坛频道传递 `--message-id`。

示例：发送到论坛父频道以创建线程

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

示例：显式创建论坛线程

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

论坛父频道不接受 Discord 组件。如果你需要组件，请发送到线程本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 为智能体消息支持 Discord components v2 容器。使用带有 `components` 负载的消息工具。交互结果会像普通入站消息一样路由回智能体，并遵循现有的 Discord `replyToMode` 设置。

支持的区块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮，或单个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件只能使用一次。设置 `components.reusable=true` 可让按钮、选择器和表单在过期前被多次使用。

要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签，或 `*`）。配置后，不匹配的用户会收到一条仅自己可见的拒绝提示。

`/model` 和 `/models` 斜杠命令会打开一个交互式模型选择器，其中包含提供商和模型下拉菜单，以及一个提交步骤。除非设置了 `commands.modelsWrite=false`，否则 `/models add` 也支持在聊天中添加新的提供商/模型条目，而且新添加的模型无需重启 Gateway 网关就会显示出来。选择器的回复仅自己可见，且只有调用该命令的用户可以使用它。

文件附件：

- `file` 区块必须指向一个附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；多个文件请使用 `media-gallery`
- 当上传名称应与附件引用匹配时，使用 `filename` 覆盖上传名称

模态表单：

- 添加 `components.modal`，最多支持 5 个字段
- 字段类型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 会自动添加一个触发表单按钮

示例：

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.discord.dmPolicy` 控制私信访问（旧版：`channels.discord.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`；旧版：`channels.discord.dm.allowFrom`）
    - `disabled`

    如果私信策略不是 open，未知用户会被阻止（或在 `pairing` 模式下提示进行配对）。

    多账户优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 当命名账户自身的 `allowFrom` 未设置时，会继承 `channels.discord.allowFrom`。
    - 命名账户不会继承 `channels.discord.accounts.default.allowFrom`。

    用于投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    纯数字 ID 存在歧义，除非显式提供 user/channel 目标类型，否则会被拒绝。

  </Tab>

  <Tab title="服务器策略">
    服务器处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当存在 `channels.discord` 时，安全基线是 `allowlist`。

    `allowlist` 行为：

    - 服务器必须匹配 `channels.discord.guilds`（优先使用 `id`，也接受 slug）
    - 可选的发送者允许列表：`users`（推荐使用稳定 ID）和 `roles`（仅角色 ID）；如果配置了其中任意一项，当发送者匹配 `users` 或 `roles` 时即被允许
    - 默认禁用直接名称/标签匹配；仅在作为紧急兼容模式时启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果某个服务器配置了 `channels`，则未列出的频道会被拒绝
    - 如果某个服务器没有 `channels` 块，则该允许列表服务器中的所有频道都被允许

    示例：

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    如果你只设置了 `DISCORD_BOT_TOKEN`，而没有创建 `channels.discord` 块，则运行时回退为 `groupPolicy="allowlist"`（日志中会有警告），即使 `channels.defaults.groupPolicy` 是 `open` 也是如此。

  </Tab>

  <Tab title="提及和群组私信">
    默认情况下，服务器消息需要提及才会触发。

    提及检测包括：

    - 显式提及机器人
    - 已配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 在支持的情况下，隐式回复机器人行为

    `requireMention` 按服务器/频道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选地丢弃提及了其他用户/角色但未提及机器人的消息（不包括 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选允许列表通过 `dm.groupChannels` 配置（频道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord 服务器成员路由到不同的智能体。基于角色的绑定仅接受角色 ID，并且会在 peer 或 parent-peer 绑定之后、guild-only 绑定之前进行评估。如果某个绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），则所有已配置字段都必须匹配。

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Developer Portal 设置

<AccordionGroup>
  <Accordion title="创建应用和机器人">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. 复制机器人令牌

  </Accordion>

  <Accordion title="特权 intents">
    在 **Bot -> Privileged Gateway Intents** 中，启用：

    - Message Content Intent
    - Server Members Intent（推荐）

    Presence intent 是可选的，只有当你希望接收在线状态更新时才需要。设置机器人在线状态（`setPresence`）并不要求为成员启用在线状态更新。

  </Accordion>

  <Accordion title="OAuth scopes 和基础权限">
    OAuth URL 生成器：

    - scopes：`bot`、`applications.commands`

    典型的基础权限：

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（可选）

    这是普通文本频道的基础权限集。如果你计划在 Discord 线程中发帖，包括会创建或继续线程的论坛或媒体频道工作流，还需要启用 **Send Messages in Threads**。
    除非明确需要，否则避免使用 `Administrator`。

  </Accordion>

  <Accordion title="复制 ID">
    启用 Discord Developer Mode，然后复制：

    - server ID
    - channel ID
    - user ID

    在 OpenClaw 配置中，优先使用数字 ID，以获得可靠的审计和探测能力。

  </Accordion>
</AccordionGroup>

## 原生命令和命令鉴权

- `commands.native` 默认为 `"auto"`，并且对 Discord 已启用。
- 按渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会显式清除先前已注册的 Discord 原生命令。
- 原生命令鉴权使用与普通消息处理相同的 Discord 允许列表/策略。
- 即使未授权用户仍可能在 Discord UI 中看到命令，执行时仍会强制应用 OpenClaw 鉴权，并返回 “not authorized”。

参见 [Slash commands](/zh-CN/tools/slash-commands) 了解命令目录和行为。

默认斜杠命令设置：

- `ephemeral: true`

## 功能细节

<AccordionGroup>
  <Accordion title="回复标签和原生回复">
    Discord 支持在智能体输出中使用回复标签：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（默认）
    - `first`
    - `all`
    - `batched`

    注意：`off` 会禁用隐式回复线程。显式的 `[[reply_to_*]]` 标签仍会被遵循。
    `first` 总是会将隐式原生回复引用附加到该轮的第一条 Discord 出站消息上。
    `batched` 仅在入站轮次是由多条消息组成的去抖批次时，才附加 Discord 的隐式原生回复引用。这在你希望原生回复主要用于存在歧义的突发聊天，而不是每一个单条消息轮次时非常有用。

    消息 ID 会在上下文/历史记录中显示，因此智能体可以定位到特定消息。

  </Accordion>

  <Accordion title="实时流式预览">
    OpenClaw 可以通过发送一条临时消息并在文本到达时编辑它来流式显示草稿回复。`channels.discord.streaming` 接受 `off`（默认）| `partial` | `block` | `progress`。在 Discord 上，`progress` 会映射为 `partial`；`streamMode` 是旧版别名，会被自动迁移。

    默认保持为 `off`，因为当多个机器人或 Gateway 网关共享同一个账户时，Discord 预览编辑很快会触及速率限制。

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` 会在 token 到达时编辑单条预览消息。
    - `block` 会发出草稿大小的分块（使用 `draftChunk` 调整大小和断点，并受 `textChunkLimit` 限制）。
    - 媒体、错误和显式回复的最终消息会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认 `true`）控制工具/进度更新是否复用预览消息。

    预览流式传输仅支持文本；媒体回复会回退为普通投递。当显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

  </Accordion>

  <Accordion title="历史记录、上下文和线程行为">
    服务器历史上下文：

    - `channels.discord.historyLimit` 默认值为 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 表示禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程按频道会话路由，并继承父频道配置，除非被覆盖。
    - `channels.discord.thread.inheritParent`（默认 `false`）可选择让新自动线程从父级对话记录中播种。按账户覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent` 下。
    - 消息工具的 reactions 可以解析 `user:<id>` 私信目标。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 会在回复阶段激活回退期间保留。

    频道主题会作为**不受信任**的上下文注入。允许列表控制的是谁可以触发智能体，而不是完整的补充上下文脱敏边界。

  </Accordion>

  <Accordion title="用于子智能体的线程绑定会话">
    Discord 可以将线程绑定到一个会话目标，以便该线程中的后续消息持续路由到同一个会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子智能体/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活动运行和绑定状态
    - `/session idle <duration|off>` 检查/更新聚焦绑定的空闲自动取消聚焦
    - `/session max-age <duration|off>` 检查/更新聚焦绑定的硬性最长存活时间

    配置：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // 选择启用
      },
    },
  },
}
```

    说明：

    - `session.threadBindings.*` 设置全局默认值。
    - `channels.discord.threadBindings.*` 覆盖 Discord 行为。
    - 要为 `sessions_spawn({ thread: true })` 自动创建/绑定线程，必须将 `spawnSubagentSessions` 设为 true。
    - 要为 ACP（`/acp spawn ... --thread ...` 或 `sessions_spawn({ runtime: "acp", thread: true })`）自动创建/绑定线程，必须将 `spawnAcpSessions` 设为 true。
    - 如果某个账户禁用了线程绑定，则 `/focus` 和相关线程绑定操作不可用。

    参见 [Sub-agents](/zh-CN/tools/subagents)、[ACP Agents](/zh-CN/tools/acp-agents) 和 [Configuration Reference](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久化 ACP 渠道绑定">
    对于稳定的“始终在线” ACP 工作区，可配置顶层的类型化 ACP 绑定，将目标指向 Discord 对话。

    配置路径：

    - 带有 `type: "acp"` 和 `match.channel: "discord"` 的 `bindings[]`

    示例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    说明：

    - `/acp spawn codex --bind here` 会就地绑定当前频道或线程，并让后续消息持续保留在同一个 ACP 会话中。线程消息会继承父频道绑定。
    - 在已绑定的频道或线程中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话。临时线程绑定在激活期间可以覆盖目标解析。
    - 仅当 OpenClaw 需要通过 `--thread auto|here` 创建/绑定子线程时，才需要 `spawnAcpSessions`。

    有关绑定行为的详细信息，参见 [ACP Agents](/zh-CN/tools/acp-agents)。

  </Accordion>

  <Accordion title="反应通知">
    按服务器配置的反应通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反应事件会转换为系统事件，并附加到已路由的 Discord 会话中。

  </Accordion>

  <Accordion title="确认反应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认 emoji。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 `"👀"`）

    说明：

    - Discord 接受 unicode emoji 或自定义 emoji 名称。
    - 使用 `""` 可为某个渠道或账户禁用该反应。

  </Accordion>

  <Accordion title="配置写入">
    默认启用由渠道发起的配置写入。

    这会影响 `/config set|unset` 流程（启用命令功能时）。

    禁用方式：

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway 网关代理">
    使用 `channels.discord.proxy` 通过 HTTP(S) 代理转发 Discord gateway WebSocket 流量和启动时的 REST 查询（应用 ID + allowlist 解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    按账户覆盖：

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit 支持">
    启用 PluralKit 解析，将代理消息映射到系统成员身份：

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 可选；私有系统需要
      },
    },
  },
}
```

    说明：

    - allowlist 可以使用 `pk:<memberId>`
    - 仅当 `channels.discord.dangerouslyAllowNameMatching: true` 时，才会按名称/slug 匹配成员显示名称
    - 查询使用原始消息 ID，并受时间窗口限制
    - 如果查询失败，代理消息会被视为机器人消息并丢弃，除非设置了 `allowBots=true`

  </Accordion>

  <Accordion title="在线状态配置">
    当你设置状态或活动字段，或启用自动在线状态时，将应用在线状态更新。

    仅状态示例：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活动示例（自定义状态是默认活动类型）：

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    直播示例：

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    活动类型映射：

    - 0：Playing
    - 1：Streaming（需要 `activityUrl`）
    - 2：Listening
    - 3：Watching
    - 4：Custom（使用活动文本作为状态内容；emoji 可选）
    - 5：Competing

    自动在线状态示例（运行时健康信号）：

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    自动在线状态会将运行时可用性映射到 Discord 状态：healthy => online，degraded 或 unknown => idle，exhausted 或 unavailable => dnd。可选文本覆盖：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Discord 中的审批">
    Discord 支持在私信中基于按钮处理审批，并且可选择在发起请求的频道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；如果可能，会回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，并且至少可以解析出一个审批人时，Discord 会自动启用原生 exec 审批；审批人可来自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不会从渠道 `allowFrom`、旧版 `dm.allowFrom` 或直接消息的 `defaultTo` 推断 exec 审批人。若要显式禁用 Discord 作为原生审批客户端，请设置 `enabled: false`。

    当 `target` 为 `channel` 或 `both` 时，审批提示会显示在频道中。只有已解析的审批人可以使用按钮；其他用户会收到一条仅自己可见的拒绝提示。审批提示包含命令文本，因此仅应在受信任频道中启用频道投递。如果无法从会话键推导出频道 ID，OpenClaw 会回退到私信投递。

    Discord 还会渲染其他聊天渠道共用的审批按钮。原生 Discord 适配器主要增加了审批人私信路由和频道扇出。
    当这些按钮存在时，它们就是主要的审批 UX；只有当工具结果表明聊天审批不可用，或手动审批是唯一途径时，OpenClaw 才应包含手动 `/approve` 命令。

    Gateway 网关鉴权和审批解析遵循共享的 Gateway 网关客户端契约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve` 解析）。审批默认会在 30 分钟后过期。

    参见 [Exec approvals](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息发送、频道管理、审核、在线状态和元数据操作。

核心示例：

- 消息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

`event-create` 操作接受一个可选的 `image` 参数（URL 或本地文件路径），用于设置计划事件封面图像。

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                             | 默认值  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 已启用  |
| roles                                                                                                                                                              | 已禁用  |
| moderation                                                                                                                                                         | 已禁用  |
| presence                                                                                                                                                           | 已禁用  |

## Components v2 UI

OpenClaw 对 exec 审批和跨上下文标记使用 Discord components v2。Discord 消息操作也可以接受 `components` 用于自定义 UI（高级用法；需要通过 discord 工具构造组件负载）；旧版 `embeds` 仍可用，但不推荐。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（hex）。
- 可通过 `channels.discord.accounts.<id>.ui.components.accentColor` 按账户设置。
- 当存在 components v2 时，`embeds` 会被忽略。

示例：

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## 语音

Discord 有两种不同的语音表面：实时**语音频道**（连续对话）和**语音消息附件**（波形预览格式）。Gateway 网关同时支持这两者。

### 语音频道

要求：

- 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
- 配置 `channels.discord.voice`。
- 机器人在目标语音频道中需要 Connect 和 Speak 权限。

使用 `/vc join|leave|status` 控制会话。该命令使用账户默认智能体，并遵循与其他 Discord 命令相同的 allowlist 和服务器策略规则。

自动加入示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

说明：

- `voice.tts` 仅对语音播放覆盖 `messages.tts`。
- 语音转写轮次会从 Discord `allowFrom`（或 `dm.allowFrom`）派生所有者状态；非所有者说话者无法访问仅所有者可用的工具（例如 `gateway` 和 `cron`）。
- 默认启用语音；设置 `channels.discord.voice.enabled=false` 可禁用。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` 的加入选项。
- 如果未设置，`@discordjs/voice` 的默认值是 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 还会监视接收解密失败，并在短时间内重复失败后通过离开/重新加入语音频道自动恢复。
- 如果接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，这可能是上游 `@discordjs/voice` 接收 bug，见 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)。

### 语音消息

Discord 语音消息会显示波形预览，并要求使用 OGG/Opus 音频。OpenClaw 会自动生成波形，但需要在 Gateway 网关主机上安装 `ffmpeg` 和 `ffprobe` 来进行检测和转换。

- 提供**本地文件路径**（不接受 URL）。
- 不要附带文本内容（Discord 会拒绝在同一负载中同时包含文本和语音消息）。
- 接受任意音频格式；OpenClaw 会在需要时将其转换为 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

<AccordionGroup>
  <Accordion title="使用了不允许的 intents，或机器人看不到任何服务器消息">

    - 启用 Message Content Intent
    - 当你依赖用户/成员解析时，启用 Server Members Intent
    - 修改 intents 后重启 Gateway 网关

  </Accordion>

  <Accordion title="服务器消息被意外阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的服务器 allowlist
    - 如果存在服务器 `channels` 映射，则只允许其中列出的频道
    - 验证 `requireMention` 行为和提及模式

    有用的检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="已设置 require mention false，但仍然被阻止">
    常见原因：

    - `groupPolicy="allowlist"`，但没有匹配的服务器/频道 allowlist
    - `requireMention` 配置在错误位置（必须位于 `channels.discord.guilds` 或频道条目下）
    - 发送者被服务器/频道 `users` allowlist 阻止

  </Accordion>

  <Accordion title="长时间运行的处理程序超时或出现重复回复">

    典型日志：

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    监听器预算控制项：

    - 单账户：`channels.discord.eventQueue.listenerTimeout`
    - 多账户：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker 运行超时控制项：

    - 单账户：`channels.discord.inboundWorker.runTimeoutMs`
    - 多账户：`channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - 默认值：`1800000`（30 分钟）；设为 `0` 可禁用

    推荐基线：

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    对于缓慢的监听器初始化，请使用 `eventQueue.listenerTimeout`；只有在你希望为排队的智能体轮次设置单独安全阀时，才使用 `inboundWorker.runTimeoutMs`。

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查仅适用于数字频道 ID。

    如果你使用 slug 键，运行时匹配仍然可能正常工作，但探测无法完整验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待配对批准

  </Accordion>

  <Accordion title="机器人到机器人的循环">
    默认情况下，会忽略由机器人发送的消息。

    如果你设置了 `channels.discord.allowBots=true`，请使用严格的提及和 allowlist 规则以避免循环行为。
    优先使用 `channels.discord.allowBots="mentions"`，这样只接受提及该机器人的机器人消息。

  </Accordion>

  <Accordion title="语音 STT 因 DecryptionFailed(...) 丢失">

    - 保持 OpenClaw 为最新版本（`openclaw update`），以确保包含 Discord 语音接收恢复逻辑
    - 确认 `channels.discord.voice.daveEncryption=true`（默认值）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在需要时调整
    - 观察日志中的以下内容：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后问题仍持续，请收集日志并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 对照

  </Accordion>
</AccordionGroup>

## 配置参考指引

主要参考：

- [Configuration reference - Discord](/zh-CN/gateway/configuration-reference#discord)

高信号 Discord 字段：

- 启动/鉴权：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件队列：`eventQueue.listenerTimeout`（监听器预算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 入站 worker：`inboundWorker.runTimeoutMs`
- 回复/历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 流式传输：`streaming`（旧版别名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒体/重试：`mediaMaxMb`、`retry`
  - `mediaMaxMb` 限制 Discord 出站上传大小（默认：`100MB`）
- 操作：`actions.*`
- 在线状态：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

## 安全和运维

- 将机器人令牌视为机密（在受监管环境中优先使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态已过期，请重启 Gateway 网关，并使用 `openclaw channels status --probe` 重新检查。

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [安全](/zh-CN/gateway/security)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
- [斜杠命令](/zh-CN/tools/slash-commands)
