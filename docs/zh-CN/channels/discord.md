---
read_when:
    - 正在开发 Discord 渠道功能
summary: Discord 机器人支持状态、功能和配置
title: Discord
x-i18n:
    generated_at: "2026-04-23T07:03:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0bee2c419651701f7ab57e46a4c0c473c83596eb9bd2156bac3c6117513236ab
    source_path: channels/discord.md
    workflow: 15
---

# Discord（Bot API）

状态：已就绪，可通过官方 Discord Gateway 网关用于私信和服务器频道。

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

你需要创建一个带机器人的新应用，将机器人添加到你的服务器，并将其与 OpenClaw 配对。我们建议把你的机器人添加到你自己的私有服务器。如果你还没有服务器，请先[创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和机器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然后点击 **New Application**。给它起一个类似 “OpenClaw” 的名字。

    点击侧边栏中的 **Bot**。将 **Username** 设置为你对 OpenClaw 智能体的称呼。

  </Step>

  <Step title="启用特权 intents">
    仍在 **Bot** 页面时，向下滚动到 **Privileged Gateway Intents**，并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色 allowlist 和名称到 ID 匹配时必需）
    - **Presence Intent**（可选；仅在需要在线状态更新时使用）

  </Step>

  <Step title="复制你的机器人令牌">
    向上滚动回 **Bot** 页面顶部，点击 **Reset Token**。

    <Note>
    尽管名字叫这样，但这里会生成你的第一个令牌 —— 并没有任何内容被“重置”。
    </Note>

    复制该令牌并保存到某处。这就是你的 **Bot Token**，你很快就会用到它。

  </Step>

  <Step title="生成邀请 URL 并将机器人添加到你的服务器">
    点击侧边栏中的 **OAuth2**。你将生成一个带有正确权限的邀请 URL，用于把机器人添加到你的服务器。

    向下滚动到 **OAuth2 URL Generator**，并启用：

    - `bot`
    - `applications.commands`

    下方会出现 **Bot Permissions** 区域。至少启用：

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（可选）

    这是普通文本频道的基础权限集。如果你计划在 Discord 帖子串中发帖，包括会创建或继续帖子串的 forum 或 media 渠道工作流，还需要启用 **Send Messages in Threads**。
    复制底部生成的 URL，粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 进行连接。现在你应该能在 Discord 服务器中看到你的机器人。

  </Step>

  <Step title="启用开发者模式并收集你的 ID">
    回到 Discord 应用中，你需要启用开发者模式，这样才能复制内部 ID。

    1. 点击 **User Settings**（头像旁边的齿轮图标）→ **Advanced** → 打开 **Developer Mode**
    2. 在侧边栏中右键点击你的 **server icon** → **Copy Server ID**
    3. 右键点击你自己的 **avatar** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存 —— 下一步你会把这三项都提供给 OpenClaw。

  </Step>

  <Step title="允许来自服务器成员的私信">
    要让配对正常工作，Discord 需要允许你的机器人向你发送私信。右键点击你的 **server icon** → **Privacy Settings** → 打开 **Direct Messages**。

    这样服务器成员（包括机器人）就可以向你发送私信。如果你想在 OpenClaw 中使用 Discord 私信，请保持该选项启用。如果你只打算使用服务器频道，那么在完成配对后可以关闭私信。

  </Step>

  <Step title="安全设置你的机器人令牌（不要在聊天中发送它）">
    你的 Discord 机器人令牌是机密信息（类似密码）。在给你的智能体发消息之前，请先在运行 OpenClaw 的机器上设置它。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    如果 OpenClaw 已经作为后台服务运行，请通过 OpenClaw Mac 应用重启它，或者停止并重新启动 `openclaw gateway run` 进程。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在任何现有渠道（例如 Telegram）上与你的 OpenClaw 智能体聊天，并告诉它。如果 Discord 是你的第一个渠道，请改用 CLI / config 标签页。

        > “我已经在配置中设置好了 Discord 机器人令牌。请使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 设置。”
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

        支持纯文本 `token` 值。`channels.discord.token` 也支持跨 env/file/exec 提供商的 SecretRef 值。请参阅 [Secrets Management](/zh-CN/gateway/secrets)。

      </Tab>
    </Tabs>

  </Step>

  <Step title="批准首次私信配对">
    等待 Gateway 网关运行后，在 Discord 中向你的机器人发送私信。它会回复一个配对码。

    <Tabs>
      <Tab title="询问你的智能体">
        在你现有的渠道中，把配对码发送给你的智能体：

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

    现在你应该已经可以通过私信在 Discord 中与你的智能体聊天了。

  </Step>
</Steps>

<Note>
令牌解析是账户感知的。配置中的令牌值优先于环境变量回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。
对于高级出站调用（消息工具/渠道操作），会为该次调用使用显式的逐调用 `token`。这适用于发送以及读取/探测类操作（例如 read/search/fetch/thread/pins/permissions）。账户策略和重试设置仍然来自活动运行时快照中所选的账户。
</Note>

## 推荐：设置服务器工作区

私信可用后，你可以把 Discord 服务器设置为一个完整工作区，其中每个频道都会获得自己的智能体会话和独立上下文。对于只有你和机器人使用的私有服务器，我们推荐这样做。

<Steps>
  <Step title="将你的服务器添加到服务器 allowlist">
    这样你的智能体就可以在服务器中的任意频道内响应，而不仅仅是私信。

    <Tabs>
      <Tab title="询问你的智能体">
        > “把我的 Discord Server ID `<server_id>` 添加到服务器 allowlist”
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
    默认情况下，你的智能体只有在服务器频道中被 @ 提及时才会回复。对于私有服务器，你可能更希望它对每条消息都进行回复。

    <Tabs>
      <Tab title="询问你的智能体">
        > “允许我的智能体在这个服务器中回复，而不需要被 @ 提及”
      </Tab>
      <Tab title="配置">
        在你的服务器配置中将 `requireMention: false` 设置为：

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

  <Step title="规划服务器频道中的记忆使用">
    默认情况下，长期记忆（MEMORY.md）只会在私信会话中加载。服务器频道不会自动加载 MEMORY.md。

    <Tabs>
      <Tab title="询问你的智能体">
        > “当我在 Discord 频道中提问时，如果你需要来自 MEMORY.md 的长期上下文，请使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手动">
        如果你需要在每个频道中共享上下文，请把稳定的指令放在 `AGENTS.md` 或 `USER.md` 中（它们会注入到每个会话）。把长期笔记保存在 `MEMORY.md` 中，并在需要时通过 memory 工具访问它们。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在，在你的 Discord 服务器中创建一些频道并开始聊天吧。你的智能体可以看到频道名称，并且每个频道都会获得自己隔离的会话 —— 因此你可以设置 `#coding`、`#home`、`#research`，或者任何适合你工作流的频道。

## 运行时模型

- Gateway 网关负责 Discord 连接。
- 回复路由是确定性的：来自 Discord 的入站消息会回复到 Discord。
- 默认情况下（`session.dmScope=main`），私聊共享智能体主会话（`agent:main:main`）。
- 服务器频道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 默认忽略群组私信（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍会将 `CommandTargetSessionKey` 传递到路由后的对话会话。

## forum 渠道

Discord forum 和 media 渠道只接受帖子串。OpenClaw 支持两种创建方式：

- 向 forum 父频道（`channel:<forumId>`）发送消息以自动创建帖子串。帖子串标题使用你消息中的第一行非空内容。
- 使用 `openclaw message thread create` 直接创建帖子串。对于 forum 渠道，不要传递 `--message-id`。

示例：发送到 forum 父频道以创建帖子串

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

示例：显式创建 forum 帖子串

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum 父频道不接受 Discord components。如果你需要 components，请发送到帖子串本身（`channel:<threadId>`）。

## 交互式 components

OpenClaw 为智能体消息支持 Discord components v2 容器。请使用带有 `components` 负载的消息工具。交互结果会像普通入站消息一样路由回智能体，并遵循现有的 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或单个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，components 为一次性使用。设置 `components.reusable=true` 可允许按钮、选择器和表单在过期前被多次使用。

如果要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签，或 `*`）。配置后，不匹配的用户会收到一条仅自己可见的拒绝消息。

`/model` 和 `/models` 斜杠命令会打开一个交互式模型选择器，其中包含提供商和模型下拉菜单，以及一个 Submit 步骤。除非设置了 `commands.modelsWrite=false`，否则 `/models add` 也支持通过聊天添加新的提供商/模型条目，新增模型无需重启 Gateway 网关即可显示。选择器回复为仅自己可见，并且只有调用它的用户可以使用。

文件附件：

- `file` 块必须指向一个附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单文件）；多个文件请使用 `media-gallery`
- 当上传名称需要与附件引用匹配时，请使用 `filename` 覆盖上传名称

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

    如果私信策略不是 open，未知用户会被阻止（或在 `pairing` 模式下被提示进行配对）。

    多账户优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 当具名账户自己的 `allowFrom` 未设置时，会继承 `channels.discord.allowFrom`。
    - 具名账户不会继承 `channels.discord.accounts.default.allowFrom`。

    用于投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    裸数字 ID 存在歧义，除非提供了明确的用户/频道目标类型，否则会被拒绝。

  </Tab>

  <Tab title="服务器策略">
    服务器处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当存在 `channels.discord` 时，安全的基线是 `allowlist`。

    `allowlist` 行为：

    - 服务器必须匹配 `channels.discord.guilds`（优先使用 `id`，也接受 slug）
    - 可选的发送者 allowlist：`users`（推荐使用稳定 ID）和 `roles`（仅角色 ID）；如果配置了任一项，则当发送者匹配 `users` 或 `roles` 时即被允许
    - 默认禁用直接名称/标签匹配；只有在紧急兼容模式下才启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果某个服务器配置了 `channels`，则未列出的频道会被拒绝
    - 如果某个服务器没有 `channels` 块，则该 allowlist 服务器中的所有频道都被允许

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

    如果你只设置了 `DISCORD_BOT_TOKEN`，但没有创建 `channels.discord` 块，则运行时回退为 `groupPolicy="allowlist"`（日志中会有警告），即使 `channels.defaults.groupPolicy` 是 `open` 也是如此。

  </Tab>

  <Tab title="提及和群组私信">
    默认情况下，服务器消息受提及门控。

    提及检测包括：

    - 显式提及机器人
    - 已配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 在受支持场景中的隐式回复机器人行为

    `requireMention` 按服务器/频道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选择丢弃那些提及了其他用户/角色但没有提及机器人的消息（不包括 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选：通过 `dm.groupChannels` allowlist 允许（频道 ID 或 slug）

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

    Presence intent 是可选的，只有在你希望接收在线状态更新时才需要。设置机器人在线状态（`setPresence`）并不要求为成员启用在线状态更新。

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

    这是普通文本频道的基础权限集。如果你计划在 Discord 帖子串中发帖，包括会创建或继续帖子串的 forum 或 media 渠道工作流，还需要启用 **Send Messages in Threads**。
    除非明确需要，否则避免使用 `Administrator`。

  </Accordion>

  <Accordion title="复制 ID">
    启用 Discord Developer Mode，然后复制：

    - server ID
    - channel ID
    - user ID

    在 OpenClaw 配置中优先使用数字 ID，以获得更可靠的审计和探测结果。

  </Accordion>
</AccordionGroup>

## 原生命令和命令鉴权

- `commands.native` 默认为 `"auto"`，并且已为 Discord 启用。
- 按渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会显式清除之前已注册的 Discord 原生命令。
- 原生命令鉴权使用与普通消息处理相同的 Discord allowlist/策略。
- 对于未获授权的用户，这些命令在 Discord UI 中可能仍然可见；但执行时仍会强制执行 OpenClaw 鉴权，并返回 “not authorized”。

命令目录和行为请参阅[斜杠命令](/zh-CN/tools/slash-commands)。

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
    `first` 始终会把隐式原生回复引用附加到该轮的第一条 Discord 出站消息上。
    `batched` 仅当入站轮次是由多条消息组成的去抖动批次时，才会附加 Discord 的隐式原生回复引用。当你主要想在含糊不清的突发聊天中使用原生回复，而不是对每一个单消息轮次都使用时，这会很有用。

    消息 ID 会在上下文/历史记录中呈现，因此智能体可以定位特定消息。

  </Accordion>

  <Accordion title="实时流式预览">
    OpenClaw 可以通过发送一条临时消息并在文本到达时编辑它，来流式显示草稿回复。

    - `channels.discord.streaming` 控制预览流式传输（`off` | `partial` | `block` | `progress`，默认：`off`）。
    - 默认保持 `off`，因为 Discord 预览编辑很容易触发速率限制，尤其是在多个机器人或 Gateway 网关共享同一账户或服务器流量时。
    - 为了跨渠道一致性，接受 `progress`，并在 Discord 上映射为 `partial`。
    - `channels.discord.streamMode` 是旧版别名，会被自动迁移。
    - `partial` 会在 token 到达时编辑单条预览消息。
    - `block` 会输出草稿大小的分块（使用 `draftChunk` 调整大小和断点）。
    - 媒体、错误和显式回复的最终消息会取消待处理的预览编辑，而不会在正常投递前刷新临时草稿。
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条草稿预览消息（默认：`true`）。设置为 `false` 可保留单独的工具/进度消息。

    示例：

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    `block` 模式的默认分块设置（会被限制在 `channels.discord.textChunkLimit` 范围内）：

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

    预览流式传输仅支持文本；媒体回复会回退为普通投递。

    注意：预览流式传输与分块流式传输是分开的。当为 Discord 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免重复流式传输。

  </Accordion>

  <Accordion title="历史记录、上下文和帖子串行为">
    服务器历史上下文：

    - `channels.discord.historyLimit` 默认值为 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 表示禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    帖子串行为：

    - Discord 帖子串作为频道会话进行路由
    - 父帖子串元数据可用于父会话关联
    - 除非存在特定于帖子串的条目，否则帖子串配置会继承父频道配置
    - 新创建的自动帖子串是否继承父转录内容，由 `channels.discord.thread.inheritParent` 选择启用（默认 `false`）。当为 `false` 时，新创建的 Discord 帖子串会话会与父频道转录内容隔离；当为 `true` 时，父频道历史会为新帖子串会话提供初始上下文
    - 按账户覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent`
    - 消息工具的 reaction 除了频道目标外，也可以解析 `user:<id>` 私信目标
    - `channels.discord.guilds.<guild>.channels.<channel>.requireMention: false` 会在回复阶段激活回退期间被保留，因此即使运行回复阶段回退，已配置为始终开启的频道仍会保持始终开启

    频道主题会作为**不受信任**的上下文注入（而不是作为系统提示词）。
    回复和引用消息上下文目前会按接收时的样子保留。
    Discord allowlist 主要用于限制谁可以触发智能体，而不是完整的补充上下文脱敏边界。

  </Accordion>

  <Accordion title="用于子智能体的线程绑定会话">
    Discord 可以将一个帖子串绑定到某个会话目标，这样该帖子串中的后续消息会持续路由到同一个会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新帖子串绑定到一个子智能体/会话目标
    - `/unfocus` 移除当前帖子串绑定
    - `/agents` 显示活动运行和绑定状态
    - `/session idle <duration|off>` 查看/更新聚焦绑定的空闲自动取消聚焦时间
    - `/session max-age <duration|off>` 查看/更新聚焦绑定的硬性最大存活时间

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
    - `channels.discord.threadBindings.*` 会覆盖 Discord 行为。
    - `spawnSubagentSessions` 必须为 true，才能为 `sessions_spawn({ thread: true })` 自动创建/绑定帖子串。
    - `spawnAcpSessions` 必须为 true，才能为 ACP 自动创建/绑定帖子串（`/acp spawn ... --thread ...` 或 `sessions_spawn({ runtime: "acp", thread: true })`）。
    - 如果某个账户禁用了帖子串绑定，则 `/focus` 及相关帖子串绑定操作不可用。

    请参阅[子智能体](/zh-CN/tools/subagents)、[ACP Agents](/zh-CN/tools/acp-agents) 和[配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久化 ACP 渠道绑定">
    对于稳定的“始终在线” ACP 工作区，可配置顶层的类型化 ACP 绑定，并将其目标指向 Discord 对话。

    配置路径：

    - `bindings[]`，其中 `type: "acp"` 且 `match.channel: "discord"`

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

    - `/acp spawn codex --bind here` 会就地绑定当前 Discord 频道或帖子串，并使未来的消息持续路由到同一个 ACP 会话。
    - 这仍然可能意味着“启动一个全新的 Codex ACP 会话”，但它本身不会创建新的 Discord 帖子串。现有频道会继续作为聊天界面。
    - Codex 仍然可能在它自己的 `cwd` 或磁盘上的后端工作区中运行。该工作区是运行时状态，而不是 Discord 帖子串。
    - 帖子串消息可以继承父频道的 ACP 绑定。
    - 在已绑定的频道或帖子串中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话。
    - 临时帖子串绑定仍然可用，并且在生效期间可以覆盖目标解析。
    - 只有当 OpenClaw 需要通过 `--thread auto|here` 创建/绑定子帖子串时，才需要 `spawnAcpSessions`。对于当前频道中的 `/acp spawn ... --bind here`，则不需要。

    有关绑定行为的详细信息，请参阅 [ACP Agents](/zh-CN/tools/acp-agents)。

  </Accordion>

  <Accordion title="Reaction 通知">
    按服务器配置的 reaction 通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    Reaction 事件会被转换为系统事件，并附加到路由后的 Discord 会话。

  </Accordion>

  <Accordion title="确认 Reaction">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认 emoji。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 “👀”）

    说明：

    - Discord 接受 unicode emoji 或自定义 emoji 名称。
    - 使用 `""` 可为某个渠道或账户禁用该 reaction。

  </Accordion>

  <Accordion title="配置写入">
    默认启用由渠道发起的配置写入。

    这会影响 `/config set|unset` 流程（当命令功能启用时）。

    禁用：

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
    使用 `channels.discord.proxy`，通过 HTTP(S) 代理路由 Discord gateway WebSocket 流量和启动时的 REST 查询（application ID + allowlist 解析）。

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
    启用 PluralKit 解析，将代理消息映射到 system member 身份：

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
    - 只有当 `channels.discord.dangerouslyAllowNameMatching: true` 时，才会按名称/slug 匹配成员显示名
    - 查询使用原始消息 ID，并受时间窗口限制
    - 如果查询失败，代理消息会被视为机器人消息并丢弃，除非设置了 `allowBots=true`

  </Accordion>

  <Accordion title="在线状态配置">
    当你设置状态或活动字段，或启用自动在线状态时，会应用在线状态更新。

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

    Streaming 示例：

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

    自动在线状态会将运行时可用性映射为 Discord 状态：healthy => online，degraded 或 unknown => idle，exhausted 或 unavailable => dnd。可选的文本覆盖项：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Discord 中的审批">
    Discord 支持在私信中使用基于按钮的审批处理，并且还可以选择在发起审批的原始频道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；在可能时回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，并且至少可以解析出一个 approver（来自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`）时，Discord 会自动启用原生 exec 审批。Discord 不会从渠道 `allowFrom`、旧版 `dm.allowFrom` 或私信 `defaultTo` 推断 exec approver。将 `enabled: false` 设为显式禁用 Discord 作为原生审批客户端。

    当 `target` 为 `channel` 或 `both` 时，审批提示会显示在频道中。只有已解析的 approver 可以使用这些按钮；其他用户会收到仅自己可见的拒绝提示。审批提示包含命令文本，因此仅应在受信任的频道中启用频道投递。如果无法从会话键推导出频道 ID，OpenClaw 会回退为私信投递。

    Discord 也会渲染其他聊天渠道使用的共享审批按钮。原生 Discord 适配器主要增加了 approver 私信路由和频道扇出。
    当这些按钮存在时，它们就是主要的审批 UX；只有当工具结果表明聊天审批不可用，或手动审批是唯一途径时，OpenClaw 才应包含手动 `/approve` 命令。

    此处理器的 Gateway 网关鉴权使用与其他 Gateway 网关客户端相同的共享凭证解析契约：

    - 环境变量优先的本地鉴权（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`，然后是 `gateway.auth.*`）
    - 在本地模式下，仅当 `gateway.auth.*` 未设置时，才可将 `gateway.remote.*` 作为回退；已配置但无法解析的本地 SecretRef 会失败关闭
    - 在适用情况下，通过 `gateway.remote.*` 支持远程模式
    - URL 覆盖是安全的覆盖：CLI 覆盖不会复用隐式凭证，而环境变量覆盖仅使用环境变量凭证

    审批解析行为：

    - 以 `plugin:` 为前缀的 ID 通过 `plugin.approval.resolve` 解析。
    - 其他 ID 通过 `exec.approval.resolve` 解析。
    - Discord 不会在这里再执行额外的 exec 到 plugin 回退跳转；ID 前缀决定它调用哪个 Gateway 网关方法。

    默认情况下，Exec 审批会在 30 分钟后过期。如果审批因未知审批 ID 而失败，请检查 approver 解析、功能是否已启用，以及已投递的审批 ID 类型是否与待处理请求匹配。

    相关文档：[Exec approvals](/zh-CN/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息传递、频道管理、审核、在线状态和元数据操作。

核心示例：

- 消息传递：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- reactions：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

`event-create` 操作接受一个可选的 `image` 参数（URL 或本地文件路径），用于设置计划事件封面图片。

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组 | 默认值 |
| --- | --- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | enabled |
| roles | disabled |
| moderation | disabled |
| presence | disabled |

## Components v2 UI

OpenClaw 使用 Discord components v2 作为 exec 审批和跨上下文标记的 UI。Discord 消息操作也可以接受 `components` 用于自定义 UI（高级用法；需要通过 discord 工具构造组件负载），而旧版 `embeds` 仍然可用，但不推荐。

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

## 语音频道

OpenClaw 可以加入 Discord 语音频道，以实现实时、连续的对话。这与语音消息附件是分开的。

要求：

- 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
- 配置 `channels.discord.voice`。
- 机器人需要在目标语音频道中拥有 Connect 和 Speak 权限。

使用仅限 Discord 的原生命令 `/vc join|leave|status` 来控制会话。该命令使用账户默认智能体，并遵循与其他 Discord 命令相同的 allowlist 和 group policy 规则。

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
- 语音转录轮次会根据 Discord `allowFrom`（或 `dm.allowFrom`）派生 owner 状态；非 owner 的说话者无法访问仅限 owner 的工具（例如 `gateway` 和 `cron`）。
- 语音默认启用；设置 `channels.discord.voice.enabled=false` 可禁用它。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` 的加入选项。
- 如果未设置，`@discordjs/voice` 的默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 还会监控接收解密失败，并在短时间内重复失败后，通过离开/重新加入语音频道自动恢复。
- 如果接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，这可能是上游 `@discordjs/voice` 的接收 bug，记录在 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 中。

## 语音消息

Discord 语音消息会显示波形预览，并且需要 OGG/Opus 音频和元数据。OpenClaw 会自动生成波形，但它需要在 Gateway 网关主机上可用的 `ffmpeg` 和 `ffprobe` 来检查和转换音频文件。

要求和限制：

- 提供**本地文件路径**（URL 会被拒绝）。
- 省略文本内容（Discord 不允许在同一负载中同时发送文本和语音消息）。
- 接受任意音频格式；OpenClaw 会在需要时将其转换为 OGG/Opus。

示例：

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
    - 如果存在服务器 `channels` 映射，则只允许列出的频道
    - 验证 `requireMention` 行为和提及模式

    有用的检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMention 为 false，但仍然被阻止">
    常见原因：

    - `groupPolicy="allowlist"`，但没有匹配的服务器/频道 allowlist
    - `requireMention` 配置在错误的位置（必须位于 `channels.discord.guilds` 或频道条目下）
    - 发送者被服务器/频道 `users` allowlist 阻止

  </Accordion>

  <Accordion title="长时间运行的处理器超时或出现重复回复">

    典型日志：

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    监听器预算旋钮：

    - 单账户：`channels.discord.eventQueue.listenerTimeout`
    - 多账户：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker 运行超时旋钮：

    - 单账户：`channels.discord.inboundWorker.runTimeoutMs`
    - 多账户：`channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - 默认值：`1800000`（30 分钟）；设置为 `0` 可禁用

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

    对于缓慢的监听器初始化，请使用 `eventQueue.listenerTimeout`；只有在你希望为排队的智能体轮次设置单独的安全阀时，才使用 `inboundWorker.runTimeoutMs`。

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查仅适用于数字频道 ID。

    如果你使用 slug 键，运行时匹配仍然可以工作，但探测无法完整验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待配对批准

  </Accordion>

  <Accordion title="机器人到机器人的循环">
    默认情况下，由机器人发送的消息会被忽略。

    如果你设置了 `channels.discord.allowBots=true`，请使用严格的提及和 allowlist 规则，以避免循环行为。
    建议使用 `channels.discord.allowBots="mentions"`，仅接受提及该机器人的机器人消息。

  </Accordion>

  <Accordion title="语音 STT 因 DecryptionFailed(...) 丢失">

    - 保持 OpenClaw 为最新版本（`openclaw update`），以确保存在 Discord 语音接收恢复逻辑
    - 确认 `channels.discord.voice.daveEncryption=true`（默认）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在必要时调整
    - 关注日志中的以下内容：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后故障仍然持续，请收集日志并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 进行对比

  </Accordion>
</AccordionGroup>

## 配置参考指引

主要参考：

- [配置参考 - Discord](/zh-CN/gateway/configuration-reference#discord)

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
