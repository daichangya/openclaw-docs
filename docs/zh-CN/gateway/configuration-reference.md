---
read_when:
    - 你需要精确到字段级别的配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: Gateway 网关配置参考：核心 OpenClaw 键、默认值以及指向专用子系统参考页的链接
title: 配置参考
x-i18n:
    generated_at: "2026-04-23T20:48:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76596321b0508dd2953bc066fed85f8ffd5121d926fd66b6add0e4dfea98ab28
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` 的核心配置参考。若想查看面向任务的概览，请参见 [Configuration](/zh-CN/gateway/configuration)。

本页覆盖主要的 OpenClaw 配置表面，并在某个子系统拥有更深入的专用参考页时提供跳转链接。它**不会**尝试在单页中内联每个渠道/插件拥有的命令目录，或每个深层 memory/QMD 配置项。

代码事实来源：

- `openclaw config schema` 会打印用于验证和 Control UI 的实时 JSON Schema，并在可用时合并内置/插件/渠道元数据
- `config.schema.lookup` 会返回单一路径范围的 schema 节点，供下钻工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面验证配置文档基线 hash

专用的深入参考页：

- [Memory configuration reference](/zh-CN/reference/memory-config)，适用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及位于 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置
- [Slash Commands](/zh-CN/tools/slash-commands)，适用于当前内置 + 内置插件命令目录
- 各渠道/插件自有页面，适用于渠道专用命令表面

配置格式是 **JSON5**（允许注释和尾随逗号）。所有字段都是可选的 —— 省略时，OpenClaw 会使用安全默认值。

---

## 渠道

每个渠道在其配置段存在时都会自动启动（除非 `enabled: false`）。

### 私信和群组访问

所有渠道都支持私信策略和群组策略：

| 私信策略 | 行为 |
| -------- | ---- |
| `pairing`（默认） | 未知发送者会收到一次性配对码；owner 必须批准 |
| `allowlist` | 仅允许 `allowFrom` 中的发送者（或已配对允许存储中的发送者） |
| `open` | 允许所有入站私信（要求 `allowFrom: ["*"]`） |
| `disabled` | 忽略所有入站私信 |

| 群组策略 | 行为 |
| -------- | ---- |
| `allowlist`（默认） | 仅允许与已配置允许列表匹配的群组 |
| `open` | 绕过群组允许列表（仍会应用提及门控） |
| `disabled` | 阻止所有群组/房间消息 |

<Note>
`channels.defaults.groupPolicy` 会在提供商的 `groupPolicy` 未设置时作为默认值。
配对码会在 1 小时后过期。待处理的私信配对请求在**每个渠道**中最多保留 **3 个**。
如果某个提供商配置块完全缺失（不存在 `channels.<provider>`），运行时群组策略会回退为 `allowlist`（失败关闭），并在启动时发出警告。
</Note>

### 渠道模型覆盖

使用 `channels.modelByChannel` 可将特定渠道 ID 固定到某个模型。值可接受 `provider/model` 或已配置的模型别名。当某个会话尚未拥有模型覆盖时（例如通过 `/model` 设置），会应用该渠道映射。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### 渠道默认值与 heartbeat

使用 `channels.defaults` 为各提供商共享群组策略和 heartbeat 行为：

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`：当提供商级 `groupPolicy` 未设置时的回退群组策略。
- `channels.defaults.contextVisibility`：所有渠道的默认补充上下文可见性模式。可选值：`all`（默认，包含所有引用/线程/历史上下文）、`allowlist`（只包含允许列表发送者的上下文）、`allowlist_quote`（与 allowlist 相同，但保留显式引用/回复上下文）。按渠道覆盖：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在 heartbeat 输出中包含健康的渠道状态。
- `channels.defaults.heartbeat.showAlerts`：在 heartbeat 输出中包含降级/错误状态。
- `channels.defaults.heartbeat.useIndicator`：渲染紧凑的指示器风格 heartbeat 输出。

### WhatsApp

WhatsApp 通过 gateway 的 web 渠道（Baileys Web）运行。当存在已绑定的会话时，它会自动启动。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 蓝色对勾（在 self-chat 模式下为 false）
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="多账户 WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- 出站命令默认使用账户 `default`（如果存在）；否则使用第一个已配置的账户 id（按排序顺序）。
- 可选的 `channels.whatsapp.defaultAccount` 会在其匹配某个已配置账户 id 时，覆盖上述默认账户选择。
- 旧版单账户 Baileys 认证目录会由 `openclaw doctor` 迁移到 `whatsapp/default`。
- 按账户覆盖：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress（默认：off；显式启用以避免预览编辑限流）
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（仅常规文件；拒绝符号链接），对于默认账户，`TELEGRAM_BOT_TOKEN` 可作为回退值。
- 可选的 `channels.telegram.defaultAccount` 会在其匹配某个已配置账户 id 时覆盖默认账户选择。
- 在多账户设置中（2 个及以上账户 id），请设置显式默认值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免回退路由；当缺失或无效时，`openclaw doctor` 会发出警告。
- `configWrites: false` 会阻止由 Telegram 发起的配置写入（supergroup ID 迁移、`/config set|unset`）。
- 顶层 `bindings[]` 中 `type: "acp"` 的条目可为论坛话题配置持久 ACP 绑定（在 `match.peer.id` 中使用规范格式 `chatId:topic:topicId`）。字段语义共享于 [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings)。
- Telegram 流预览使用 `sendMessage` + `editMessageText`（适用于私聊和群聊）。
- 重试策略：参见 [Retry policy](/zh-CN/concepts/retry)。

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress（在 Discord 上 progress 会映射为 partial）
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // 对 sessions_spawn({ thread: true }) 选择启用
      },
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
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token：`channels.discord.token`，对于默认账户，`DISCORD_BOT_TOKEN` 可作为回退值。
- 显式提供 Discord `token` 的直接出站调用会使用该 token 发起调用；账户重试/策略设置仍来自活动运行时快照中所选账户。
- 可选的 `channels.discord.defaultAccount` 会在其匹配某个已配置账户 id 时覆盖默认账户选择。
- 交付目标请使用 `user:<id>`（私信）或 `channel:<id>`（guild 渠道）；裸数字 ID 会被拒绝。
- Guild slug 会转为小写，并将空格替换为 `-`；渠道键使用 slug 化的名称（不带 `#`）。推荐优先使用 guild ID。
- 默认会忽略 bot 自己发出的消息。`allowBots: true` 会启用它们；使用 `allowBots: "mentions"` 可仅接受提及该 bot 的 bot 消息（bot 自己的消息仍会被过滤）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及渠道级覆盖）会丢弃那些提及了其他用户或角色、但未提及该 bot 的消息（不包括 @everyone/@here）。
- `maxLinesPerMessage`（默认 17）会拆分过高的消息，即使其长度未超过 2000 字符也是如此。
- `channels.discord.threadBindings` 控制 Discord 线程绑定路由：
  - `enabled`：用于线程绑定会话功能的 Discord 覆盖（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及绑定交付/路由）
  - `idleHours`：按小时设置的 Discord 非活动自动取消聚焦覆盖（`0` 表示禁用）
  - `maxAgeHours`：按小时设置的 Discord 硬性最大时长覆盖（`0` 表示禁用）
  - `spawnSubagentSessions`：为 `sessions_spawn({ thread: true })` 自动创建/绑定线程的选择启用开关
- 顶层 `bindings[]` 中 `type: "acp"` 的条目可为渠道和线程配置持久 ACP 绑定（在 `match.peer.id` 中使用渠道/线程 id）。字段语义共享于 [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings)。
- `channels.discord.ui.components.accentColor` 为 Discord components v2 容器设置强调色。
- `channels.discord.voice` 启用 Discord 语音频道对话，以及可选的自动加入 + TTS 覆盖。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 会透传到 `@discordjs/voice` 的 DAVE 选项（默认分别为 `true` 和 `24`）。
- OpenClaw 还会在重复解密失败后，通过离开/重新加入语音会话来尝试恢复语音接收。
- `channels.discord.streaming` 是规范的流模式键。旧版 `streamMode` 和布尔 `streaming` 值会自动迁移。
- `channels.discord.autoPresence` 会将运行时可用性映射为 bot presence（健康 => online，降级 => idle，耗尽 => dnd），并允许可选的状态文本覆盖。
- `channels.discord.dangerouslyAllowNameMatching` 会重新启用可变的名称/tag 匹配（break-glass 兼容模式）。
- `channels.discord.execApprovals`：Discord 原生 exec approval 交付和 approver 授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在 auto 模式下，当 approver 可从 `approvers` 或 `commands.ownerAllowFrom` 解析出来时，exec approval 会激活。
  - `approvers`：允许批准 exec 请求的 Discord 用户 ID。省略时回退到 `commands.ownerAllowFrom`。
  - `agentFilter`：可选的智能体 ID 允许列表。省略则转发所有智能体的 approval。
  - `sessionFilter`：可选的会话键模式（子串或正则）。
  - `target`：approval 提示的发送位置。`"dm"`（默认）发送到 approver 私信，`"channel"` 发送到原始渠道，`"both"` 同时发送到两处。当 target 包含 `"channel"` 时，按钮仅对已解析的 approver 可用。
  - `cleanupAfterResolve`：为 `true` 时，在批准、拒绝或超时后删除 approval 私信。

**Reaction 通知模式：** `off`（无）、`own`（bot 自己的消息，默认）、`all`（所有消息）、`allowlist`（来自 `guilds.<id>.users` 的所有消息）。

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- Service account JSON：支持内联（`serviceAccount`）或基于文件（`serviceAccountFile`）。
- 也支持 Service account SecretRef（`serviceAccountRef`）。
- 环境变量回退：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 交付目标请使用 `spaces/<spaceId>` 或 `users/<userId>`。
- `channels.googlechat.dangerouslyAllowNameMatching` 会重新启用可变的邮箱主体匹配（break-glass 兼容模式）。

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // 当 mode=partial 时使用 Slack 原生流式传输 API
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode** 同时需要 `botToken` 和 `appToken`（对于默认账户，环境变量回退为 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** 需要 `botToken` 加 `signingSecret`（位于根级或按账户设置）。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文
  字符串或 SecretRef 对象。
- Slack 账户快照会暴露按凭证划分的来源/状态字段，例如
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP mode 下的
  `signingSecretStatus`。`configured_unavailable` 表示该账户
  通过 SecretRef 配置，但当前命令/运行时路径无法
  解析密钥值。
- `configWrites: false` 会阻止由 Slack 发起的配置写入。
- 可选的 `channels.slack.defaultAccount` 会在其匹配某个已配置账户 id 时覆盖默认账户选择。
- `channels.slack.streaming.mode` 是规范的 Slack 流模式键。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生流式传输方式。旧版 `streamMode`、布尔 `streaming` 和 `nativeStreaming` 值会自动迁移。
- 交付目标请使用 `user:<id>`（私信）或 `channel:<id>`。

**Reaction 通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

**线程会话隔离：** `thread.historyScope` 可设为按线程（默认）或在渠道内共享。`thread.inheritParent` 会将父渠道 transcript 复制到新线程。

- Slack 原生流式传输以及 Slack 助手风格的 “is typing...” 线程状态都需要一个回复线程目标。顶层私信默认保持非线程模式，因此它们会使用 `typingReaction` 或常规交付，而不是线程式预览。
- `typingReaction` 会在回复运行期间为入站 Slack 消息添加一个临时 reaction，并在完成后移除。请使用 Slack emoji shortcode，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生 exec approval 交付和 approver 授权。其 schema 与 Discord 相同：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 用户 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。

| 操作组 | 默认值 | 说明 |
| ------ | ------ | ---- |
| reactions | 已启用 | 添加 reaction + 列出 reactions |
| messages | 已启用 | 读取/发送/编辑/删除 |
| pins | 已启用 | pin/unpin/list |
| memberInfo | 已启用 | 成员信息 |
| emojiList | 已启用 | 自定义 emoji 列表 |

### Mattermost

Mattermost 作为插件提供：`openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // 选择启用
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 反向代理/公共部署时可选的显式 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

聊天模式：`oncall`（在 @提及时响应，默认）、`onmessage`（响应每条消息）、`onchar`（响应以触发前缀开头的消息）。

启用 Mattermost 原生命令时：

- `commands.callbackPath` 必须是路径（例如 `/api/channels/mattermost/command`），而不是完整 URL。
- `commands.callbackUrl` 必须解析到 OpenClaw gateway 端点，并且能从 Mattermost 服务器访问。
- 原生斜杠回调会使用 Mattermost 在斜杠命令注册期间返回的每命令 token
  进行认证。如果注册失败或没有任何命令被激活，
  OpenClaw 会拒绝回调，并返回
  `Unauthorized: invalid command token.`。
- 对于私有/tailnet/内部回调主机，Mattermost 可能要求
  `ServiceSettings.AllowedUntrustedInternalConnections` 包含回调 host/domain。
  请使用 host/domain 值，而不是完整 URL。
- `channels.mattermost.configWrites`：允许或拒绝由 Mattermost 发起的配置写入。
- `channels.mattermost.requireMention`：在渠道中回复前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：按渠道覆盖提及门控（`"*"` 表示默认值）。
- 可选的 `channels.mattermost.defaultAccount` 会在其匹配某个已配置账户 id 时覆盖默认账户选择。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 可选的账户绑定
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Reaction 通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

- `channels.signal.account`：将渠道启动固定到特定的 Signal 账户身份。
- `channels.signal.configWrites`：允许或拒绝由 Signal 发起的配置写入。
- 可选的 `channels.signal.defaultAccount` 会在其匹配某个已配置账户 id 时覆盖默认账户选择。

### BlueBubbles

BlueBubbles 是推荐的 iMessage 路径（由插件支持，配置在 `channels.bluebubbles` 下）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl、password、webhookPath、群组控制和高级操作：
      // 参见 /channels/bluebubbles
    },
  },
}
```

- 此处覆盖的核心键路径：`channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 可选的 `channels.bluebubbles.defaultAccount` 会在其匹配某个已配置账户 id 时覆盖默认账户选择。
- 顶层 `bindings[]` 中 `type: "acp"` 的条目可将 BlueBubbles 会话绑定到持久 ACP 会话。请在 `match.peer.id` 中使用 BlueBubbles handle 或目标字符串（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义： [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings)。
- 完整的 BlueBubbles 渠道配置记录在 [BlueBubbles](/zh-CN/channels/bluebubbles) 中。

### iMessage

OpenClaw 会启动 `imsg rpc`（基于 stdio 的 JSON-RPC）。无需 daemon 或端口。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- 可选的 `channels.imessage.defaultAccount` 会在其匹配某个已配置账户 id 时覆盖默认账户选择。

- 需要对 Messages 数据库授予 Full Disk Access。
- 推荐优先使用 `chat_id:<id>` 目标。使用 `imsg chats --limit 20` 可列出聊天。
- `cliPath` 可以指向一个 SSH 包装器；设置 `remoteHost`（`host` 或 `user@host`）以通过 SCP 获取附件。
- `attachmentRoots` 和 `remoteAttachmentRoots` 用于限制入站附件路径（默认：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用严格的主机密钥检查，因此请确保中继主机密钥已存在于 `~/.ssh/known_hosts` 中。
- `channels.imessage.configWrites`：允许或拒绝由 iMessage 发起的配置写入。
- 顶层 `bindings[]` 中 `type: "acp"` 的条目可将 iMessage 会话绑定到持久 ACP 会话。请在 `match.peer.id` 中使用标准化 handle 或显式聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义： [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH 包装器示例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 由插件支持，配置在 `channels.matrix` 下。

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Token 认证使用 `accessToken`；密码认证使用 `userId` + `password`。
- `channels.matrix.proxy` 会通过显式 HTTP(S) 代理路由 Matrix HTTP 流量。命名账户可使用 `channels.matrix.accounts.<id>.proxy` 覆盖它。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允许私有/内部 homeserver。`proxy` 与此网络选择启用是彼此独立的控制项。
- `channels.matrix.defaultAccount` 在多账户设置中选择首选账户。
- `channels.matrix.autoJoin` 默认为 `off`，因此邀请房间和新的私信风格邀请会被忽略，直到你设置 `autoJoin: "allowlist"` 并提供 `autoJoinAllowlist`，或设置 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 exec approval 交付和 approver 授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在 auto 模式下，当 approver 可从 `approvers` 或 `commands.ownerAllowFrom` 解析出来时，exec approval 会激活。
  - `approvers`：允许批准 exec 请求的 Matrix 用户 ID（例如 `@owner:example.org`）。
  - `agentFilter`：可选的智能体 ID 允许列表。省略则转发所有智能体的 approval。
  - `sessionFilter`：可选的会话键模式（子串或正则）。
  - `target`：approval 提示的发送位置。`"dm"`（默认）、`"channel"`（原始房间）或 `"both"`。
  - 按账户覆盖：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix 私信如何分组成会话：`per-user`（默认）按已路由对端共享，`per-room` 则隔离每个私信房间。
- Matrix 状态探测和实时目录查找使用与运行时流量相同的代理策略。
- 完整的 Matrix 配置、目标规则和设置示例记录在 [Matrix](/zh-CN/channels/matrix) 中。

### Microsoft Teams

Microsoft Teams 由插件支持，配置在 `channels.msteams` 下。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、webhook、团队/渠道策略：
      // 参见 /channels/msteams
    },
  },
}
```

- 此处覆盖的核心键路径：`channels.msteams`、`channels.msteams.configWrites`。
- 完整的 Teams 配置（凭证、webhook、私信/群组策略、按团队/按渠道覆盖）记录在 [Microsoft Teams](/zh-CN/channels/msteams) 中。

### IRC

IRC 由插件支持，配置在 `channels.irc` 下。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- 此处覆盖的核心键路径：`channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 可选的 `channels.irc.defaultAccount` 会在其匹配某个已配置账户 id 时覆盖默认账户选择。
- 完整的 IRC 渠道配置（host/port/TLS/channels/allowlists/mention gating）记录在 [IRC](/zh-CN/channels/irc) 中。

### 多账户（所有渠道）

为每个渠道运行多个账户（每个账户都有自己的 `accountId`）：

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- 当省略 `accountId` 时，会使用 `default`（CLI + 路由）。
- 环境变量 token 仅适用于 **default** 账户。
- 基础渠道设置会应用于所有账户，除非在账户级进行了覆盖。
- 使用 `bindings[].match.accountId` 可将每个账户路由到不同智能体。
- 如果你通过 `openclaw channels add`（或渠道新手引导）添加非默认账户，而当前仍处于单账户顶层渠道配置形态，OpenClaw 会先将账户作用域的顶层单账户值提升到渠道账户映射中，以便原始账户继续工作。大多数渠道会将其移动到 `channels.<channel>.accounts.default`；Matrix 则可以保留现有匹配的命名/default 目标。
- 现有仅渠道级的绑定（无 `accountId`）会继续匹配默认账户；账户作用域绑定仍然是可选的。
- `openclaw doctor --fix` 也会通过将账户作用域的顶层单账户值移动到该渠道选定的提升账户中来修复混合形态。大多数渠道使用 `accounts.default`；Matrix 则可以保留现有匹配的命名/default 目标。

### 其他插件渠道

许多插件渠道配置为 `channels.<id>`，并记录在各自专用的渠道页面中（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
完整渠道索引请参见：[Channels](/zh-CN/channels)。

### 群聊提及门控

群组消息默认**要求提及**（元数据提及或安全正则模式）。适用于 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群聊。

**提及类型：**

- **元数据提及**：原生平台 @提及。在 WhatsApp self-chat 模式中会被忽略。
- **文本模式**：位于 `agents.list[].groupChat.mentionPatterns` 中的安全正则模式。无效模式和不安全的嵌套重复会被忽略。
- 仅在能够检测到提及时（原生提及或至少存在一个模式），才会强制执行提及门控。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` 设置全局默认值。渠道可以通过 `channels.<channel>.historyLimit`（或按账户）进行覆盖。设为 `0` 可禁用。

#### 私信历史限制

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解析顺序：按私信覆盖 → 提供商默认值 → 不限制（全部保留）。

支持的渠道：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### self-chat 模式

将你自己的号码加入 `allowFrom` 以启用 self-chat 模式（忽略原生 @提及，只响应文本模式）：

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Commands（聊天命令处理）

```json5
{
  commands: {
    native: "auto", // 在支持时注册原生命令
    nativeSkills: "auto", // 在支持时注册原生 skill 命令
    text: true, // 解析聊天消息中的 /commands
    bash: false, // 允许 !（别名：/bash）
    bashForegroundMs: 2000,
    config: false, // 允许 /config
    mcp: false, // 允许 /mcp
    plugins: false, // 允许 /plugins
    debug: false, // 允许 /debug
    restart: true, // 允许 /restart + gateway restart 工具
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="命令详情">

- 此配置块用于配置命令表面。关于当前的内置 + 内置插件命令目录，请参见 [Slash Commands](/zh-CN/tools/slash-commands)。
- 本页是**配置键参考**，不是完整的命令目录。诸如 QQ Bot 的 `/bot-ping` `/bot-help` `/bot-logs`、LINE 的 `/card`、device-pair 的 `/pair`、memory 的 `/dreaming`、phone-control 的 `/phone` 以及 Talk 的 `/voice` 等由渠道/插件拥有的命令，记录在各自的渠道/插件页面以及 [Slash Commands](/zh-CN/tools/slash-commands) 中。
- 文本命令必须是带有前导 `/` 的**独立**消息。
- `native: "auto"` 会为 Discord/Telegram 打开原生命令，而对 Slack 保持关闭。
- `nativeSkills: "auto"` 会为 Discord/Telegram 打开原生 skill 命令，而对 Slack 保持关闭。
- 可按渠道覆盖：`channels.discord.commands.native`（布尔值或 `"auto"`）。`false` 会清除先前已注册的命令。
- 可通过 `channels.<provider>.commands.nativeSkills` 按渠道覆盖原生 skill 注册。
- `channels.telegram.customCommands` 会添加额外的 Telegram bot 菜单项。
- `bash: true` 会为主机 shell 启用 `! <cmd>`。要求 `tools.elevated.enabled` 已启用，且发送者位于 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 会启用 `/config`（读取/写入 `openclaw.json`）。对于 gateway `chat.send` 客户端，持久化的 `/config set|unset` 写入还需要 `operator.admin`；只读的 `/config show` 对普通写权限的 operator 客户端仍然可用。
- `mcp: true` 会为 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器配置启用 `/mcp`。
- `plugins: true` 会为插件发现、安装以及启用/禁用控制启用 `/plugins`。
- `channels.<provider>.configWrites` 用于按渠道控制配置变更（默认：true）。
- 对于多账户渠道，`channels.<provider>.accounts.<id>.configWrites` 也会控制那些以该账户为目标的写入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 会禁用 `/restart` 和 gateway restart 工具操作。默认：`true`。
- `ownerAllowFrom` 是用于仅限 owner 命令/工具的显式 owner 允许列表。它与 `allowFrom` 分开。
- `ownerDisplay: "hash"` 会在系统提示中对 owner id 进行哈希。设置 `ownerDisplaySecret` 可控制哈希方式。
- `allowFrom` 是按提供商配置的。一旦设置，它就成为**唯一**授权来源（渠道允许列表/配对以及 `useAccessGroups` 都会被忽略）。
- `useAccessGroups: false` 会在 `allowFrom` 未设置时，允许命令绕过访问组策略。
- 命令文档映射：
  - 内置 + 内置插件目录：[Slash Commands](/zh-CN/tools/slash-commands)
  - 渠道专用命令表面：[Channels](/zh-CN/channels)
  - QQ Bot 命令：[QQ Bot](/zh-CN/channels/qqbot)
  - 配对命令：[Pairing](/zh-CN/channels/pairing)
  - LINE card 命令：[LINE](/zh-CN/channels/line)
  - memory dreaming：[Dreaming](/zh-CN/concepts/dreaming)

</Accordion>

---

## 智能体默认值

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

可选的仓库根目录，会显示在系统提示的 Runtime 行中。如果未设置，OpenClaw 会从工作区开始向上遍历并自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

为未设置 `agents.list[].skills` 的智能体提供可选的默认 skill 允许列表。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 Skills
    ],
  },
}
```

- 省略 `agents.defaults.skills` 可默认不限制 Skills。
- 省略 `agents.list[].skills` 以继承默认值。
- 设置 `agents.list[].skills: []` 表示无 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它
  不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）的自动创建。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

控制何时将工作区引导文件注入到系统提示中。默认值：`"always"`。

- `"continuation-skip"`：安全的续接轮次（在 assistant 已完成响应之后）会跳过工作区引导的重新注入，从而减少提示大小。Heartbeat 运行和压缩后的重试仍会重建上下文。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

单个工作区引导文件在截断前的最大字符数。默认值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区引导文件合计注入的最大字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制当引导上下文被截断时，是否向智能体显示警告文本。
默认值：`"once"`。

- `"off"`：绝不在系统提示中注入警告文本。
- `"once"`：对每个唯一的截断签名只注入一次警告（推荐）。
- `"always"`：只要存在截断，就在每次运行时注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 上下文预算归属映射

OpenClaw 有多个高容量的提示/上下文预算，它们会按子系统
有意分开，而不是全部流经一个通用控制项。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  常规工作区引导注入。
- `agents.defaults.startupContext.*`：
  一次性的 `/new` 和 `/reset` 启动前导，包括最近的每日
  `memory/*.md` 文件。
- `skills.limits.*`：
  注入到系统提示中的紧凑 Skills 列表。
- `agents.defaults.contextLimits.*`：
  有界的运行时摘录和由运行时拥有的注入块。
- `memory.qmd.limits.*`：
  已索引的记忆搜索片段和注入大小控制。

仅当某个智能体需要不同预算时，才使用相应的按智能体覆盖：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在裸 `/new` 和 `/reset`
运行中注入的首次轮次启动前导。

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

有界运行时上下文表面的共享默认值。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`：在添加截断元数据和续接提示前，
  `memory_get` 摘录的默认上限。
- `memoryGetDefaultLines`：省略 `lines` 时，
  `memory_get` 的默认行窗口。
- `toolResultMaxChars`：用于持久化结果和
  溢出恢复的实时工具结果上限。
- `postCompactionMaxChars`：用于压缩后刷新注入时
  AGENTS.md 摘录的上限。

#### `agents.list[].contextLimits`

共享 `contextLimits` 配置项的按智能体覆盖。省略的字段会继承
`agents.defaults.contextLimits`。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入到系统提示中的紧凑 Skills 列表的全局上限。这
不会影响按需读取 `SKILL.md` 文件。

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 提示预算的按智能体覆盖。

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

在调用提供商之前，transcript/工具图像块中图像最长边的最大像素尺寸。
默认值：`1200`。

对于截图较多的运行，更低的值通常会减少视觉 token 使用量和请求负载大小。
更高的值则会保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

用于系统提示上下文的时区（不是消息时间戳）。会回退到主机时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系统提示中的时间格式。默认值：`auto`（操作系统偏好）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // 全局默认提供商参数
      embeddedHarness: {
        runtime: "auto", // auto | pi | 已注册 harness id，例如 codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`：既可以是字符串（`"provider/model"`），也可以是对象（`{ primary, fallbacks }`）。
  - 字符串形式只设置主模型。
  - 对象形式设置主模型以及按顺序排列的故障转移模型。
- `imageModel`：既可以是字符串（`"provider/model"`），也可以是对象（`{ primary, fallbacks }`）。
  - 由 `image` 工具路径作为其视觉模型配置使用。
  - 当已选/默认模型不能接受图像输入时，也会用作回退路由。
- `imageGenerationModel`：既可以是字符串（`"provider/model"`），也可以是对象（`{ primary, fallbacks }`）。
  - 由共享图像生成能力，以及任何未来生成图像的工具/插件表面使用。
  - 典型值：用于原生 Gemini 图像生成的 `google/gemini-3.1-flash-image-preview`、用于 fal 的 `fal/fal-ai/flux/dev`，或用于 OpenAI Images 的 `openai/gpt-image-2`。
  - 如果你直接选择某个 provider/model，也请同时配置对应的提供商认证/API key（例如 `google/*` 需要 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/*` 需要 `OPENAI_API_KEY`，`fal/*` 需要 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推断出一个带认证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：既可以是字符串（`"provider/model"`），也可以是对象（`{ primary, fallbacks }`）。
  - 由共享音乐生成能力和内置 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.5+`。
  - 如果省略，`music_generate` 仍可推断出一个带认证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择某个 provider/model，也请同时配置对应的提供商认证/API key。
- `videoGenerationModel`：既可以是字符串（`"provider/model"`），也可以是对象（`{ primary, fallbacks }`）。
  - 由共享视频生成能力和内置 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断出一个带认证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择某个 provider/model，也请同时配置对应的提供商认证/API key。
  - 内置的 Qwen 视频生成提供商最多支持 1 个输出视频、1 张输入图像、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：既可以是字符串（`"provider/model"`），也可以是对象（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用于模型路由。
  - 如果省略，PDF 工具会先回退到 `imageModel`，再回退到已解析的会话/默认模型。
- `pdfMaxBytesMb`：当调用时未传入 `maxBytesMb` 时，`pdf` 工具的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具在提取回退模式中考虑的默认最大页数。
- `verboseDefault`：智能体的默认 verbose 级别。可选值：`"off"`、`"on"`、`"full"`。默认：`"off"`。
- `elevatedDefault`：智能体的默认 elevated-output 级别。可选值：`"off"`、`"on"`、`"ask"`、`"full"`。默认：`"on"`。
- `model.primary`：格式为 `provider/model`（例如 `openai/gpt-5.5`）。如果省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 id 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商（这是已弃用的兼容行为，因此推荐显式使用 `provider/model`）。如果该提供商不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的 provider/model，而不是暴露一个陈旧的、已移除提供商默认值。
- `models`：已配置的模型目录和 `/model` 的允许列表。每个条目都可以包含 `alias`（快捷方式）和 `params`（提供商特定参数，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`）。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。`config set` 会拒绝那些会移除现有允许列表条目的替换，除非你传入 `--replace`。
  - 提供商作用域的 configure/onboarding 流程会将所选提供商模型合并到该映射中，并保留已配置的无关提供商。
- `params`：应用于所有模型的全局默认提供商参数。设置在 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（按模型）覆盖，然后 `agents.list[].params`（匹配的智能体 id）再按键覆盖。详见 [Prompt Caching](/zh-CN/reference/prompt-caching)。
- `embeddedHarness`：默认的底层嵌入式智能体运行时策略。使用 `runtime: "auto"` 可让已注册的插件 harness 认领受支持模型，使用 `runtime: "pi"` 可强制使用内置 PI harness，或使用已注册的 harness id，例如 `runtime: "codex"`。设置 `fallback: "none"` 可禁用自动 PI 回退。
- 会修改这些字段的配置写入器（例如 `/models set`、`/models set-image` 以及 fallback add/remove 命令）会保存规范对象形式，并尽可能保留现有 fallback 列表。
- `maxConcurrent`：跨会话的最大并行智能体运行数（每个会话本身仍是串行的）。默认：4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` 控制哪个底层执行器运行嵌入式智能体轮次。
大多数部署应保持默认值 `{ runtime: "auto", fallback: "pi" }`。
当可信插件提供原生 harness 时使用它，例如内置的
Codex app-server harness。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`：`"auto"`、`"pi"` 或已注册的插件 harness id。内置 Codex 插件会注册 `codex`。
- `fallback`：`"pi"` 或 `"none"`。`"pi"` 会在未选择任何插件 harness 时，将内置 PI harness 保留为兼容性回退。`"none"` 则会在插件 harness 缺失或不受支持时直接失败，而不是静默使用 PI。已选择的插件 harness 失败会始终直接暴露。
- 环境变量覆盖：`OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` 会覆盖 `runtime`；`OPENCLAW_AGENT_HARNESS_FALLBACK=none` 会为该进程禁用 PI 回退。
- 对于仅使用 Codex 的部署，请设置 `model: "openai/gpt-5.5"`、`embeddedHarness.runtime: "codex"` 和 `embeddedHarness.fallback: "none"`。
- 在第一次嵌入式运行之后，harness 选择会按会话 id 固定。配置/环境变量更改只影响新的或已重置的会话，不影响已有 transcript。具有 transcript 历史但没有已记录固定值的 legacy 会话会被视为固定到 PI。`/status` 会在 `Fast` 旁边显示非 PI 的 harness id，例如 `codex`。
- 这只控制嵌入式聊天 harness。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用它们各自的 provider/model 设置。

**内置别名简写**（仅在模型存在于 `agents.defaults.models` 中时适用）：

| 别名 | 模型 |
| ---- | ---- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.5` |
| `gpt-mini` | `openai/gpt-5.4-mini` |
| `gpt-nano` | `openai/gpt-5.4-nano` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

你自己配置的别名始终优先于默认值。

Z.AI GLM-4.x 模型会自动启用 thinking 模式，除非你设置了 `--thinking off` 或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 用于工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设为 `false` 可禁用它。
Anthropic Claude 4.6 模型在未显式设置 thinking 级别时，默认使用 `adaptive` thinking。

### `agents.defaults.cliBackends`

用于纯文本回退运行（无工具调用）的可选 CLI 后端。当 API 提供商失败时，它可作为备份方案。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 后端以文本优先；工具始终禁用。
- 当设置了 `sessionArg` 时支持会话。
- 当 `imageArg` 接受文件路径时支持图像透传。

### `agents.defaults.systemPromptOverride`

用固定字符串替换整个由 OpenClaw 组装的系统提示。可设置在默认级别（`agents.defaults.systemPromptOverride`）或按智能体设置（`agents.list[].systemPromptOverride`）。按智能体的值优先；空字符串或仅空白的值会被忽略。适合用于受控的提示实验。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

按模型家族应用、与提供商无关的 prompt overlay。GPT-5 家族模型 id 会在各提供商之间接收共享行为契约；`personality` 只控制友好的交互风格层。

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`（默认）和 `"on"` 会启用友好的交互风格层。
- `"off"` 只会禁用友好层；带标签的 GPT-5 行为契约仍保持启用。
- 当这个共享设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

定期 heartbeat 运行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m 表示禁用
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 默认：true；false 会从系统提示中省略 Heartbeat 段
        lightContext: false, // 默认：false；true 只保留工作区引导文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 会在全新会话中运行每次 heartbeat（无对话历史）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（默认）| block
        target: "none", // 默认：none | 可选：last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：时长字符串（ms/s/m/h）。默认值：`30m`（API key 认证）或 `1h`（OAuth 认证）。设为 `0m` 可禁用。
- `includeSystemPromptSection`：为 false 时，会从系统提示中省略 Heartbeat 段，并跳过将 `HEARTBEAT.md` 注入引导上下文。默认：`true`。
- `suppressToolErrorWarnings`：为 true 时，会在 heartbeat 运行期间抑制工具错误警告负载。
- `timeoutSeconds`：heartbeat 智能体轮次在被中止前允许的最长秒数。若不设置，则使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：direct/私信交付策略。`allow`（默认）允许 direct 目标交付。`block` 会抑制 direct 目标交付，并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，heartbeat 运行会使用轻量引导上下文，并且仅保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次 heartbeat 都会在一个全新会话中运行，不带任何先前对话历史。隔离模式与 cron 的 `sessionTarget: "isolated"` 相同。可将每次 heartbeat 的 token 成本从约 100K 降到约 2-5K token。
- 按智能体设置：使用 `agents.list[].heartbeat`。当任一智能体定义了 `heartbeat` 时，**只有这些智能体**会运行 heartbeat。
- Heartbeat 会运行完整的智能体轮次 —— 更短的间隔会消耗更多 token。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 已注册压缩提供商插件的 id（可选）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // 当 identifierPolicy=custom 时使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] 表示禁用重新注入
        model: "openrouter/anthropic/claude-sonnet-4-6", // 仅用于压缩的模型覆盖（可选）
        notifyUser: true, // 在压缩开始和完成时发送简短通知给用户（默认：false）
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（针对长历史的分块摘要）。参见 [Compaction](/zh-CN/concepts/compaction)。
- `provider`：已注册压缩提供商插件的 id。设置后，将调用该提供商的 `summarize()`，而不是使用内置 LLM 摘要。在失败时回退到内置实现。设置 provider 会强制使用 `mode: "safeguard"`。参见 [Compaction](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 中止前允许单次压缩操作运行的最大秒数。默认：`900`。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在压缩摘要时预置内置的不透明标识符保留指导。
- `identifierInstructions`：当 `identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `postCompactionSections`：压缩后重新注入的可选 AGENTS.md H2/H3 段名。默认值为 `["Session Startup", "Red Lines"]`；设为 `[]` 可禁用重新注入。若未设置，或显式设为该默认对，则旧版 `Every Session`/`Safety` 标题也可作为 legacy 回退接受。
- `model`：仅用于压缩摘要的可选 `provider/model-id` 覆盖。当主会话需要保留某个模型，而压缩摘要应在另一个模型上运行时使用；若未设置，压缩会使用该会话的主模型。
- `notifyUser`：为 `true` 时，会在压缩开始和完成时向用户发送简短通知（例如 “Compacting context...” 和 “Compaction complete”）。默认禁用，以保持压缩静默。
- `memoryFlush`：在自动压缩前执行的静默智能体轮次，用于存储持久记忆。当工作区为只读时会跳过。

### `agents.defaults.contextPruning`

在发送给 LLM 之前，从内存中的上下文里修剪**旧工具结果**。**不会**修改磁盘上的会话历史。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 时长（ms/s/m/h），默认单位：分钟
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 模式行为">

- `mode: "cache-ttl"` 会启用修剪过程。
- `ttl` 控制在上次缓存触碰之后，多久允许再次运行修剪。
- 修剪会先对超大的工具结果执行软裁剪，然后在需要时对更旧的工具结果执行硬清空。

**软裁剪** 会保留开头 + 结尾，并在中间插入 `...`。

**硬清空** 会用占位符替换整个工具结果。

说明：

- 图像块永远不会被裁剪/清空。
- 比例是基于字符的（近似），而不是精确 token 计数。
- 如果 assistant 消息数量少于 `keepLastAssistants`，则跳过修剪。

</Accordion>

行为细节请参见 [Session Pruning](/zh-CN/concepts/session-pruning)。

### 分块流式传输

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（使用 minMs/maxMs）
    },
  },
}
```

- 非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才会启用分块回复。
- 渠道覆盖：`channels.<channel>.blockStreamingCoalesce`（以及按账户变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`：分块回复之间的随机暂停。`natural` = 800–2500ms。按智能体覆盖：`agents.list[].humanDelay`。

行为和分块细节请参见 [Streaming](/zh-CN/concepts/streaming)。

### 输入中指示器

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 默认值：私聊/提及时使用 `instant`，未提及的群聊使用 `message`。
- 按会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

参见 [Typing Indicators](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南请参见 [Sandboxing](/zh-CN/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // 也支持 SecretRef / 内联内容：
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="沙箱详情">

**后端：**

- `docker`：本地 Docker 运行时（默认）
- `ssh`：通用 SSH 支持的远程运行时
- `openshell`：OpenShell 运行时

当选择 `backend: "openshell"` 时，运行时专用设置会移到
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：格式为 `user@host[:port]` 的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于各 scope 工作区的绝对远程根路径
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：内联内容或 SecretRef，OpenClaw 会在运行时将其物化为临时文件
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略控制项

**SSH 认证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 由 SecretRef 支持的 `*Data` 值会在沙箱会话启动前从活动 secrets 运行时快照中解析

**SSH 后端行为：**

- 在创建或重建之后，只对远程工作区执行一次播种
- 然后保持远程 SSH 工作区为规范版本
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程更改同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：在 `~/.openclaw/sandboxes` 下使用按 scope 划分的沙箱工作区
- `ro`：沙箱工作区位于 `/workspace`，智能体工作区只读挂载到 `/agent`
- `rw`：智能体工作区以读写方式挂载到 `/workspace`

**范围：**

- `session`：每会话一个容器 + 工作区
- `agent`：每智能体一个容器 + 工作区（默认）
- `shared`：共享容器和工作区（无跨会话隔离）

**OpenShell 插件配置：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 可选
          gatewayEndpoint: "https://lab.example", // 可选
          policy: "strict", // 可选 OpenShell 策略 id
          providers: ["openai"], // 可选
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 模式：**

- `mirror`：在 exec 前将本地内容播种到远程，exec 后再同步回来；本地工作区保持为规范版本
- `remote`：在创建沙箱时仅播种一次远程内容，然后保持远程工作区为规范版本

在 `remote` 模式下，播种步骤之后，在 OpenClaw 外部对主机本地所做的编辑不会自动同步进沙箱。
传输方式是通过 SSH 进入 OpenShell 沙箱，但插件拥有沙箱生命周期以及可选的镜像同步。

**`setupCommand`** 会在容器创建后运行一次（通过 `sh -lc`）。它需要网络出口、可写根文件系统和 root 用户。

**容器默认使用 `network: "none"`** —— 如果智能体需要出站访问，请设为 `"bridge"`（或自定义 bridge 网络）。
`"host"` 会被阻止。默认也会阻止 `"container:<id>"`，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（break-glass）。

**入站附件** 会被暂存到活动工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载额外的主机目录；全局和按智能体的 bind 会合并。

**沙箱浏览器**（`sandbox.browser.enabled`）：在容器中运行 Chromium + CDP。noVNC URL 会被注入到系统提示中。不需要在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，OpenClaw 会发出一个短期有效的 token URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话以主机浏览器为目标。
- `network` 默认为 `openclaw-sandbox-browser`（专用 bridge 网络）。只有在你明确需要全局 bridge 连通性时才设置为 `bridge`。
- `cdpSourceRange` 可选地在容器边界将 CDP 入站限制到某个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅向沙箱浏览器容器挂载额外的主机目录。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。
- 启动默认值定义在 `scripts/sandbox-browser-entrypoint.sh` 中，并已针对容器主机调优：
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`（默认启用）
  - `--disable-3d-apis`、`--disable-software-rasterizer` 和 `--disable-gpu`
    默认启用；如果 WebGL/3D 使用场景确实需要，可通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 关闭它们。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 会重新启用扩展，如果你的工作流
    依赖它们。
  - `--renderer-process-limit=2` 可通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 修改；设为 `0` 可使用 Chromium 的
    默认进程上限。
  - 以及在启用 `noSandbox` 时使用 `--no-sandbox` 和 `--disable-setuid-sandbox`。
  - 这些默认值是容器镜像基线；如果要更改容器默认值，请使用带自定义
    entrypoint 的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅适用于 Docker。

构建镜像：

```bash
scripts/sandbox-setup.sh           # 主沙箱镜像
scripts/sandbox-browser-setup.sh   # 可选的浏览器镜像
```

### `agents.list`（按智能体覆盖）

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // 或 { primary, fallbacks }
        thinkingDefault: "high", // 按智能体的 thinking 级别覆盖
        reasoningDefault: "on", // 按智能体的 reasoning 可见性覆盖
        fastModeDefault: false, // 按智能体的 fast mode 覆盖
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 按键覆盖匹配的 defaults.models params
        skills: ["docs-search"], // 设置后会替换 agents.defaults.skills
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`：稳定的智能体 id（必填）。
- `default`：如果设置了多个，则第一个生效（会记录警告）。如果一个都没设，则列表中的第一项为默认值。
- `model`：字符串形式只覆盖 `primary`；对象形式 `{ primary, fallbacks }` 同时覆盖两者（`[]` 会禁用全局 fallback）。仅覆盖 `primary` 的 cron 作业仍会继承默认 fallback，除非你设置 `fallbacks: []`。
- `params`：按智能体的流参数，会合并覆盖到 `agents.defaults.models` 中所选模型条目之上。适合用于设置智能体专用的覆盖项，例如 `cacheRetention`、`temperature` 或 `maxTokens`，而无需复制整个模型目录。
- `skills`：可选的按智能体 skill 允许列表。若省略，则该智能体会在已设置时继承 `agents.defaults.skills`；显式列表会替换默认值而不是合并，`[]` 表示无 Skills。
- `thinkingDefault`：可选的按智能体默认 thinking 级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当未设置按消息或按会话覆盖时，会覆盖该智能体的 `agents.defaults.thinkingDefault`。
- `reasoningDefault`：可选的按智能体默认 reasoning 可见性（`on | off | stream`）。当未设置按消息或按会话的 reasoning 覆盖时生效。
- `fastModeDefault`：可选的按智能体默认 fast mode（`true | false`）。当未设置按消息或按会话的 fast-mode 覆盖时生效。
- `embeddedHarness`：可选的按智能体底层 harness 策略覆盖。使用 `{ runtime: "codex", fallback: "none" }` 可让某一个智能体仅使用 Codex，而其他智能体仍保留默认的 PI 回退。
- `runtime`：可选的按智能体运行时描述符。当该智能体应默认使用 ACP harness 会话时，请使用 `type: "acp"` 并设置 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 会推导默认值：从 `emoji` 推导 `ackReaction`，从 `name`/`emoji` 推导 `mentionPatterns`。
- `subagents.allowAgents`：用于 `sessions_spawn` 的智能体 id 允许列表（`["*"]` = 任意；默认：仅同一智能体）。
- 沙箱继承守卫：如果请求方会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些将以非沙箱方式运行的目标。
- `subagents.requireAgentId`：为 true 时，会阻止那些省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择 profile；默认：false）。

---

## 多智能体路由

在一个 Gateway 网关内运行多个隔离智能体。参见 [Multi-Agent](/zh-CN/concepts/multi-agent)。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 绑定匹配字段

- `type`（可选）：普通路由使用 `route`（省略时默认也是 route），持久 ACP 会话绑定使用 `acp`。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账户；省略 = 默认账户）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；渠道特定）
- `acp`（可选；仅适用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（整个渠道范围）
6. 默认智能体

在每一层中，第一个匹配的 `bindings` 条目胜出。

对于 `type: "acp"` 条目，OpenClaw 会按精确的会话身份（`match.channel` + 账户 + `match.peer.id`）进行解析，而不会使用上面的 route 绑定层级顺序。

### 按智能体划分的访问配置文件

<Accordion title="完全访问（无沙箱）">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="只读工具 + 工作区">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="无文件系统访问（仅消息传递）">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

优先级细节请参见 [Multi-Agent Sandbox & Tools](/zh-CN/tools/multi-agent-sandbox-tools)。

---

## 会话

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // 高于此 token 数时跳过父线程 fork（0 表示禁用）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration 或 false
      maxDiskBytes: "500mb", // 可选硬预算
      highWaterBytes: "400mb", // 可选清理目标
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 默认的按小时非活动自动取消聚焦（`0` 表示禁用）
      maxAgeHours: 0, // 默认的按小时硬性最大时长（`0` 表示禁用）
    },
    mainKey: "main", // legacy（运行时始终使用 "main"）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="会话字段详情">

- **`scope`**：群聊上下文的基础会话分组策略。
  - `per-sender`（默认）：在渠道上下文中，每个发送者获得一个隔离会话。
  - `global`：渠道上下文中的所有参与者共享一个会话（仅在确实需要共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：按发送者 id 跨渠道隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账户 + 渠道 + 发送者隔离（推荐用于多账户）。
- **`identityLinks`**：将规范 id 映射到带提供商前缀的对端，用于跨渠道共享会话。
- **`reset`**：主重置策略。`daily` 会在本地时间 `atHour` 重置；`idle` 会在 `idleMinutes` 后重置。当两者都已配置时，以先到期者为准。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 可作为 `direct` 的别名。
- **`parentForkMaxTokens`**：创建 forked 线程会话时，允许父会话 `totalTokens` 的最大值（默认 `100000`）。
  - 如果父会话的 `totalTokens` 高于该值，OpenClaw 会启动一个新的线程会话，而不是继承父 transcript 历史。
  - 设为 `0` 可禁用该保护，并始终允许父级 fork。
- **`mainKey`**：legacy 字段。运行时始终对主私聊 bucket 使用 `"main"`。
- **`agentToAgent.maxPingPongTurns`**：智能体之间进行 agent-to-agent 交换时的最大回发轮数（整数，范围：`0`–`5`）。`0` 会禁用 ping-pong 链式交互。
- **`sendPolicy`**：可按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 为别名）、`keyPrefix` 或 `rawKeyPrefix` 进行匹配。第一个 deny 规则胜出。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 会执行清理。
  - `pruneAfter`：陈旧条目的年龄截止值（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。
  - `rotateBytes`：当 `sessions.json` 超过该大小时执行轮转（默认 `10mb`）。
  - `resetArchiveRetention`：`*.reset.<timestamp>` transcript 归档的保留期。默认为 `pruneAfter`；设为 `false` 可禁用。
  - `maxDiskBytes`：可选的会话目录磁盘预算。在 `warn` 模式下会记录警告；在 `enforce` 模式下会先移除最旧的产物/会话。
  - `highWaterBytes`：预算清理后的可选目标值。默认是 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（提供商可覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：按小时设置的默认非活动自动取消聚焦时长（`0` 表示禁用；提供商可覆盖）
  - `maxAgeHours`：按小时设置的默认硬性最大时长（`0` 表示禁用；提供商可覆盖）

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // 或 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 表示禁用
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 响应前缀

按渠道/账户覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析顺序（越具体越优先）：账户 → 渠道 → 全局。`""` 会禁用并停止向上回退。`"auto"` 会推导为 `[{identity.name}]`。

**模板变量：**

| 变量 | 描述 | 示例 |
| ---- | ---- | ---- |
| `{model}` | 短模型名 | `claude-opus-4-6` |
| `{modelFull}` | 完整模型标识符 | `anthropic/claude-opus-4-6` |
| `{provider}` | 提供商名称 | `anthropic` |
| `{thinkingLevel}` | 当前 thinking 级别 | `high`、`low`、`off` |
| `{identity.name}` | 智能体 identity 名称 | （与 `"auto"` 相同） |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### Ack reaction

- 默认使用活动智能体的 `identity.emoji`，否则为 `"👀"`。设为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账户 → 渠道 → `messages.ackReaction` → identity 回退。
- 范围：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：会在 Slack、Discord 和 Telegram 上于回复后移除 ack。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期状态 reaction。
  在 Slack 和 Discord 上，未设置时，如果 ack reaction 处于活动状态，则会保持启用状态 reaction。
  在 Telegram 上，请显式将其设为 `true` 以启用生命周期状态 reaction。

### 入站防抖

会将来自同一发送者的快速纯文本消息批处理为单个智能体轮次。媒体/附件会立即触发刷新。控制命令会绕过防抖。

### TTS（text-to-speech）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` 控制默认的自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好设置，`/tts status` 会显示生效状态。
- `summaryModel` 会覆盖自动摘要所使用的 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（选择启用）。
- API key 会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- `openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序是配置，然后是 `OPENAI_TTS_BASE_URL`，最后是 `https://api.openai.com/v1`。
- 当 `openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为 OpenAI 兼容的 TTS 服务器，并放宽模型/语音校验。

---

## Talk

Talk 模式的默认值（macOS/iOS/Android）。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` 在配置了多个 Talk 提供商时，必须匹配 `talk.providers` 中的某个键。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容，并会自动迁移到 `talk.providers.<provider>`。
- Voice ID 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- `ELEVENLABS_API_KEY` 回退仅在未配置任何 Talk API key 时生效。
- `providers.*.voiceAliases` 允许 Talk 指令使用友好名称。
- `silenceTimeoutMs` 控制 Talk 模式在用户静音后等待多久才发送 transcript。未设置时，将保持平台默认暂停窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）。

---

## 工具

### 工具配置文件

`tools.profile` 会在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

当未设置时，本地新手引导默认会为新的本地配置设为 `tools.profile: "coding"`（现有显式 profile 会被保留）。

| 配置文件 | 包含内容 |
| -------- | -------- |
| `minimal` | 仅 `session_status` |
| `coding` | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` | 不限制（与未设置相同） |

### 工具组

| 组 | 工具 |
| --- | --- |
| `group:runtime` | `exec`、`process`、`code_execution`（`bash` 可作为 `exec` 的别名） |
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`x_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:agents` | `agents_list` |
| `group:media` | `image`、`image_generate`、`video_generate`、`tts` |
| `group:openclaw` | 所有内置工具（不包括提供商插件） |

### `tools.allow` / `tools.deny`

全局工具 allow/deny 策略（deny 优先）。不区分大小写，并支持 `*` 通配符。即使 Docker 沙箱隔离关闭也会生效。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

进一步为特定提供商或模型限制工具。顺序为：基础 profile → 提供商 profile → allow/deny。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.5": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

控制沙箱之外的 elevated exec 访问：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 按智能体覆盖（`agents.list[].tools.elevated`）只能进一步收紧限制。
- `/elevated on|off|ask|full` 会按会话存储状态；内联指令仅适用于单条消息。
- Elevated `exec` 会绕过沙箱隔离，并使用已配置的逃逸路径（默认是 `gateway`，而当 exec 目标为 `node` 时使用 `node`）。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

工具循环安全检查默认**禁用**。将 `enabled: true` 设为启用。
设置可在全局 `tools.loopDetection` 中定义，并可在 `agents.list[].tools.loopDetection` 中按智能体覆盖。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`：用于循环分析所保留的最大工具调用历史。
- `warningThreshold`：对重复无进展模式发出警告的阈值。
- `criticalThreshold`：用于阻止关键循环的更高重复阈值。
- `globalCircuitBreakerThreshold`：任何无进展运行的硬停止阈值。
- `detectors.genericRepeat`：对重复的同工具/同参数调用发出警告。
- `detectors.knownPollNoProgress`：对已知轮询工具（`process.poll`、`command_status` 等）的无进展情况发出警告/阻止。
- `detectors.pingPong`：对交替出现的无进展成对模式发出警告/阻止。
- 如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，验证会失败。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // 或 BRAVE_API_KEY 环境变量
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 可选；省略则自动检测
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

配置入站媒体理解（图像/音频/视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 选择启用：将完成的异步音乐/视频直接发送到渠道
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="媒体模型条目字段">

**提供商条目**（`type: "provider"` 或省略）：

- `provider`：API 提供商 id（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
- `model`：模型 id 覆盖
- `profile` / `preferredProfile`：`auth-profiles.json` 配置文件选择

**CLI 条目**（`type: "cli"`）：

- `command`：要运行的可执行文件
- `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等）

**通用字段：**

- `capabilities`：可选列表（`image`、`audio`、`video`）。默认值：`openai`/`anthropic`/`minimax` → image，`google` → image+audio+video，`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：按条目覆盖。
- 失败时会回退到下一个条目。

提供商认证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

**异步完成字段：**

- `asyncCompletion.directSend`：为 `true` 时，已完成的异步 `music_generate`
  和 `video_generate` 任务会优先尝试直接渠道交付。默认：`false`
  （旧版请求方会话唤醒/模型交付路径）。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

控制会话工具（`sessions_list`、`sessions_history`、`sessions_send`）可以将哪些会话作为目标。

默认值：`tree`（当前会话 + 由其生成的会话，例如子智能体）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

说明：

- `self`：仅当前会话键。
- `tree`：当前会话 + 由当前会话生成的会话（子智能体）。
- `agent`：属于当前智能体 id 的任意会话（如果你在同一智能体 id 下运行按发送者划分的会话，则可能包含其他用户）。
- `all`：任意会话。跨智能体定向仍需要 `tools.agentToAgent`。
- 沙箱收紧：当当前会话处于沙箱隔离中，且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 时，即使 `tools.sessions.visibility="all"`，可见性也会被强制为 `tree`。

### `tools.sessions_spawn`

控制 `sessions_spawn` 的内联附件支持。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 选择启用：设为 true 以允许内联文件附件
        maxTotalBytes: 5242880, // 所有文件总计 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 每个文件 1 MB
        retainOnSessionKeep: false, // 当 cleanup="keep" 时保留附件
      },
    },
  },
}
```

说明：

- 附件仅支持 `runtime: "subagent"`。ACP 运行时会拒绝它们。
- 文件会以 `.openclaw/attachments/<uuid>/` 的形式物化到子工作区中，并附带一个 `.manifest.json`。
- 附件内容会自动从 transcript 持久化中脱敏。
- Base64 输入会通过严格的字母表/填充校验以及解码前大小保护进行验证。
- 目录权限为 `0700`，文件权限为 `0600`。
- 清理由 `cleanup` 策略控制：`delete` 总会移除附件；`keep` 仅在 `retainOnSessionKeep: true` 时保留它们。

<a id="toolsexperimental"></a>

### `tools.experimental`

实验性的内置工具标志。默认关闭，除非适用了严格 agentic GPT-5 自动启用规则。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 启用实验性的 update_plan
    },
  },
}
```

说明：

- `planTool`：为非平凡的多步骤工作跟踪启用结构化 `update_plan` 工具。
- 默认值：`false`，除非 `agents.defaults.embeddedPi.executionContract`（或按智能体覆盖）在 OpenAI 或 OpenAI Codex 的 GPT-5 家族运行中被设置为 `"strict-agentic"`。设为 `true` 可在该范围之外强制启用该工具；设为 `false` 则即使在 strict-agentic GPT-5 运行中也保持关闭。
- 启用后，系统提示还会添加使用指导，使模型仅在重要工作中使用它，并且最多只保留一个 `in_progress` 步骤。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：为生成的子智能体设置默认模型。如果省略，子智能体会继承调用方的模型。
- `allowAgents`：当请求方智能体未设置自己的 `subagents.allowAgents` 时，作为 `sessions_spawn` 目标智能体 id 的默认允许列表（`["*"]` = 任意；默认：仅同一智能体）。
- `runTimeoutSeconds`：当工具调用省略 `runTimeoutSeconds` 时，`sessions_spawn` 的默认超时时间（秒）。`0` 表示无超时。
- 按子智能体的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和 base URL

OpenClaw 使用内置模型目录。可通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

```json5
{
  models: {
    mode: "merge", // merge（默认）| replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- 对于自定义认证需求，请使用 `authHeader: true` + `headers`。
- 可通过 `OPENCLAW_AGENT_DIR` 覆盖智能体配置根目录（或使用其 legacy 环境变量别名 `PI_CODING_AGENT_DIR`）。
- 对于匹配的提供商 ID，合并优先级如下：
  - 非空的智能体 `models.json` `baseUrl` 值优先。
  - 非空的智能体 `apiKey` 值仅在该提供商在当前配置/auth-profile 上下文中不是由 SecretRef 管理时优先。
  - 由 SecretRef 管理的提供商 `apiKey` 值会从源标记刷新（环境变量 ref 使用 `ENV_VAR_NAME`，文件/exec ref 使用 `secretref-managed`），而不是持久化已解析的密钥。
  - 由 SecretRef 管理的提供商 header 值会从源标记刷新（环境变量 ref 使用 `secretref-env:ENV_VAR_NAME`，文件/exec ref 使用 `secretref-managed`）。
  - 空的或缺失的智能体 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
  - 匹配模型的 `contextWindow`/`maxTokens` 会在显式配置值与隐式目录值之间取更高者。
  - 匹配模型的 `contextTokens` 在存在时会保留显式运行时上限；当你希望限制生效上下文，而不修改原生模型元数据时可使用它。
  - 当你希望由配置完全重写 `models.json` 时，请使用 `models.mode: "replace"`。
  - 标记持久化以来源为准：标记是根据活动源配置快照（解析前）写入的，而不是根据已解析的运行时密钥值写入。

### 提供商字段详情

- `models.mode`：提供商目录行为（`merge` 或 `replace`）。
- `models.providers`：以提供商 id 为键的自定义提供商映射。
  - 安全编辑：使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` 进行增量更新。`config set` 会拒绝破坏性替换，除非你传入 `--replace`。
- `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。
- `models.providers.*.apiKey`：提供商凭证（优先使用 SecretRef/环境变量替换）。
- `models.providers.*.auth`：认证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，向请求中注入 `options.num_ctx`（默认：`true`）。
- `models.providers.*.authHeader`：在需要时强制通过 `Authorization` 请求头传输凭证。
- `models.providers.*.baseUrl`：上游 API 的 base URL。
- `models.providers.*.headers`：用于代理/租户路由的额外静态请求头。
- `models.providers.*.request`：模型提供商 HTTP 请求的传输覆盖。
  - `request.headers`：额外请求头（与提供商默认值合并）。值支持 SecretRef。
  - `request.auth`：认证策略覆盖。模式：`"provider-default"`（使用提供商内置认证）、`"authorization-bearer"`（配合 `token`）、`"header"`（配合 `headerName`、`value` 和可选 `prefix`）。
  - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（配合 `url`）。这两种模式都接受可选的 `tls` 子对象。
  - `request.tls`：直接连接时的 TLS 覆盖。字段包括：`ca`、`cert`、`key`、`passphrase`（全部支持 SecretRef）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`：为 `true` 时，当 DNS 将 `baseUrl` 解析到私有、CGNAT 或类似地址范围时，允许通过提供商 HTTP fetch 防护访问 HTTPS `baseUrl`（面向受信任、自托管 OpenAI 兼容端点的操作员选择启用）。WebSocket 对 headers/TLS 也会使用相同的 `request`，但不会应用该 fetch SSRF 防护。默认 `false`。
- `models.providers.*.models`：显式的提供商模型目录条目。
- `models.providers.*.models.*.contextWindow`：原生模型上下文窗口元数据。
- `models.providers.*.models.*.contextTokens`：可选的运行时上下文上限。当你希望有效上下文预算小于模型原生 `contextWindow` 时，请使用它。
- `models.providers.*.models.*.compat.supportsDeveloperRole`：可选兼容性提示。对于 `api: "openai-completions"` 且 `baseUrl` 非空并且是非原生值（host 不是 `api.openai.com`）的情况，OpenClaw 会在运行时强制将其设为 `false`。空的/省略的 `baseUrl` 会保留默认 OpenAI 行为。
- `models.providers.*.models.*.compat.requiresStringContent`：面向只接受字符串的 OpenAI 兼容聊天端点的可选兼容性提示。为 `true` 时，OpenClaw 会在发送请求前，将纯文本的 `messages[].content` 数组压平为普通字符串。
- `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启/关闭隐式发现。
- `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用于定向发现的可选 provider-id 过滤器。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新轮询间隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：发现到的模型的回退上下文窗口。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：发现到的模型的回退最大输出 token 数。

### 提供商示例

<Accordion title="Cerebras（GLM 4.6 / 4.7）">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

对 Cerebras 使用 `cerebras/zai-glm-4.7`；对 Z.AI 直连使用 `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。对 Zen 目录使用 `opencode/...` 引用，对 Go 目录使用 `opencode-go/...` 引用。快捷方式：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

设置 `ZAI_API_KEY`。`z.ai/*` 和 `z-ai/*` 都是可接受的别名。快捷方式：`openclaw onboard --auth-choice zai-api-key`。

- 通用端点：`https://api.z.ai/api/paas/v4`
- 编码端点（默认）：`https://api.z.ai/api/coding/paas/v4`
- 对于通用端点，请定义一个带 base URL 覆盖的自定义提供商。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

对于中国端点：使用 `baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

原生 Moonshot 端点会在共享的
`openai-completions` 传输上声明流式使用兼容性，而 OpenClaw 会根据端点能力
而不是仅根据内置 provider id 来处理这一点。

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic 兼容的内置提供商。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic（Anthropic 兼容）">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL 不应包含 `/v1`（Anthropic 客户端会自行追加）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（直连）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

设置 `MINIMAX_API_KEY`。快捷方式：
`openclaw onboard --auth-choice minimax-global-api` 或
`openclaw onboard --auth-choice minimax-cn-api`。
模型目录默认仅包含 M2.7。
在 Anthropic 兼容的流式传输路径上，除非你显式设置 `thinking`，
否则 OpenClaw 默认会禁用 MiniMax thinking。`/fast on` 或
`params.fastMode: true` 会将 `MiniMax-M2.7` 重写为
`MiniMax-M2.7-highspeed`。

</Accordion>

<Accordion title="本地模型（LM Studio）">

参见 [Local Models](/zh-CN/gateway/local-models)。简而言之：在高性能硬件上通过 LM Studio Responses API 运行大型本地模型；同时保留已合并的托管模型用于回退。

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或明文字符串
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：仅针对内置 Skills 的可选允许列表（不会影响托管/工作区 Skills）。
- `load.extraDirs`：额外的共享 skill 根目录（优先级最低）。
- `install.preferBrew`：为 true 时，当 `brew` 可用，会优先使用 Homebrew 安装器，再回退到其他安装器类型。
- `install.nodeManager`：用于 `metadata.openclaw.install`
  规格的 node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使 skill 已内置/已安装，也会禁用它。
- `entries.<skillKey>.apiKey`：面向声明了主环境变量的 skill 的便捷字段（明文字符串或 SecretRef 对象）。

---

## 插件

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- 从 `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions` 以及 `plugins.load.paths` 加载。
- 发现机制接受原生 OpenClaw 插件，以及兼容的 Codex bundle 和 Claude bundle，包括无 manifest 的 Claude 默认布局 bundle。
- **配置更改需要重启 gateway。**
- `allow`：可选允许列表（只加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API key 便捷字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件作用域环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：为 `false` 时，core 会阻止 `before_prompt_build`，并忽略 legacy `before_agent_start` 中会修改提示的字段，同时保留 legacy `modelOverride` 和 `providerOverride`。适用于原生插件 hook 和受支持的 bundle 提供的 hook 目录。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任该插件可以为后台子智能体运行请求按次的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：面向可信子智能体覆盖的规范 `provider/model` 目标的可选允许列表。仅当你有意允许任意模型时才使用 `"*"`。
- `plugins.entries.<id>.config`：插件定义的配置对象（当可用时，会由原生 OpenClaw 插件 schema 校验）。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch 提供商设置。
  - `apiKey`：Firecrawl API key（支持 SecretRef）。会回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API base URL（默认：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅提取页面主体内容（默认：`true`）。
  - `maxAgeMs`：最大缓存年龄，单位为毫秒（默认：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时秒数（默认：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web search）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：搜索使用的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：memory dreaming 设置。关于阶段和阈值请参见 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：dreaming 总开关（默认 `false`）。
  - `frequency`：每次完整 dreaming sweep 的 cron 频率（默认 `"0 3 * * *"`）。
  - 阶段策略和阈值属于实现细节（不是面向用户的配置键）。
- 完整的 memory 配置位于 [Memory configuration reference](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude bundle 插件也可以从 `settings.json` 贡献内嵌 Pi 默认值；OpenClaw 会将它们作为已净化的智能体设置应用，而不是作为原始 OpenClaw 配置补丁。
- `plugins.slots.memory`：选择活动的 memory 插件 id，或设为 `"none"` 以禁用 memory 插件。
- `plugins.slots.contextEngine`：选择活动的上下文引擎插件 id；默认值为 `"legacy"`，除非你安装并选择了其他引擎。
- `plugins.installs`：由 CLI 管理的安装元数据，供 `openclaw plugins update` 使用。
  - 包含 `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - 请将 `plugins.installs.*` 视为托管状态；优先使用 CLI 命令，而不是手动编辑。

参见 [Plugins](/zh-CN/tools/plugin)。

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在受信任的私有网络访问中选择启用
      // allowPrivateNetwork: true, // legacy 别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` 会禁用 `act:evaluate` 和 `wait --fn`。
- 当未设置时，`ssrfPolicy.dangerouslyAllowPrivateNetwork` 为禁用，因此 browser 导航默认保持严格。
- 仅在你明确受信任私有网络 browser 导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/发现检查期间也会受到同样的私有网络阻止。
- `ssrfPolicy.allowPrivateNetwork` 仍作为 legacy 别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 作为显式例外。
- 远程配置文件仅支持附加（start/stop/reset 已禁用）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时，请使用 HTTP(S)；
  当提供商直接提供 DevTools WebSocket URL 时，请使用 WS(S)。
- `existing-session` 配置文件使用 Chrome MCP 而不是 CDP，并且可以在
  选定主机上附加，或通过已连接的 browser node 附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以定位特定的
  Chromium 系浏览器配置文件，例如 Brave 或 Edge。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：
  使用 snapshot/ref 驱动的操作而不是 CSS 选择器定向、单文件上传
  hook、无对话框超时覆盖、无 `wait --load networkidle`，并且没有
  `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅在远程 CDP 时
  才显式设置 `cdpUrl`。
- 自动检测顺序：默认浏览器（如果是 Chromium 系）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- 控制服务：仅 loopback（端口从 `gateway.port` 派生，默认 `18791`）。
- `extraArgs` 会向本地 Chromium 启动附加额外标志（例如
  `--disable-gpu`、窗口大小设置或调试标志）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji、短文本、图像 URL 或 data URI
    },
  },
}
```

- `seamColor`：原生 app UI 外观的强调色（Talk Mode 气泡着色等）。
- `assistant`：Control UI 的 identity 覆盖。会回退到活动智能体 identity。

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // 或 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // 适用于 mode=trusted-proxy；参见 /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // 危险：允许绝对外部 http(s) embed URL
      // allowedOrigins: ["https://control.example.com"], // 非 loopback Control UI 必填
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危险的 Host-header origin 回退模式
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 可选。默认 false。
    allowRealIpFallback: false,
    tools: {
      // 额外的 /tools/invoke HTTP deny
      deny: ["browser"],
      // 从默认 HTTP deny 列表中移除工具
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway 字段详情">

- `mode`：`local`（运行 gateway）或 `remote`（连接到远程 gateway）。除非为 `local`，否则 Gateway 网关会拒绝启动。
- `port`：WS + HTTP 共用的单一复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版 bind 别名**：请在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用 host 别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 说明**：默认的 `loopback` bind 会在容器内部监听 `127.0.0.1`。在 Docker bridge 网络（`-p 18789:18789`）下，流量会到达 `eth0`，因此 gateway 不可访问。请使用 `--network host`，或设置 `bind: "lan"`（或使用 `bind: "custom"` 并设置 `customBindHost: "0.0.0.0"`）以监听所有接口。
- **认证**：默认要求启用认证。非 loopback 绑定必须启用 gateway 认证。实际上，这意味着需要共享 token/密码，或使用带 `gateway.auth.mode: "trusted-proxy"` 的 identity-aware 反向代理。新手引导默认会生成一个 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请显式将 `gateway.auth.mode` 设为 `token` 或 `password`。当两者都已配置而 mode 未设置时，启动和服务安装/修复流程会失败。
- `gateway.auth.mode: "none"`：显式无认证模式。仅用于受信任的本地 loopback 设置；新手引导不会有意提供该选项。
- `gateway.auth.mode: "trusted-proxy"`：将认证委托给 identity-aware 反向代理，并信任来自 `gateway.trustedProxies` 的身份请求头（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。该模式要求**非 loopback** 代理来源；同主机上的 loopback 反向代理不满足 trusted-proxy 认证要求。
- `gateway.auth.allowTailscale`：为 `true` 时，Tailscale Serve 身份请求头可用于满足 Control UI/WebSocket 认证（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 请求头认证；它们仍遵循 gateway 的常规 HTTP 认证模式。此无 token 流程假定 gateway 主机是受信任的。当 `tailscale.mode = "serve"` 时，默认值为 `true`。
- `gateway.auth.rateLimit`：可选的失败认证限流器。按客户端 IP 和认证范围生效（共享密钥与设备 token 会独立跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, clientIp}` 的失败尝试会在写入失败前串行化。因此，同一客户端并发的错误尝试可能会在第二个请求时就触发限流，而不是两个请求都像普通不匹配那样竞速通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；如果你有意希望 localhost 流量也被限流（例如测试环境或严格代理部署），请设为 `false`。
- 来自浏览器源的 WS 认证尝试始终会在关闭 loopback 豁免的情况下被限流（作为针对基于浏览器的 localhost 暴力破解的纵深防御）。
- 在 loopback 上，这些浏览器源的锁定会按规范化后的 `Origin`
  值彼此隔离，因此来自某个 localhost origin 的重复失败不会自动
  锁定另一个 origin。
- `tailscale.mode`：`serve`（仅 tailnet，loopback bind）或 `funnel`（公开访问，需要认证）。
- `controlUi.allowedOrigins`：Gateway 网关 WebSocket 连接的显式浏览器源允许列表。当浏览器客户端来自非 loopback 源时，此项必填。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为那些有意依赖 Host-header origin 策略的部署启用 Host-header origin 回退。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，`remote.url` 必须是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端侧的 break-glass 覆盖，允许对受信任的私有网络 IP 使用明文 `ws://`；默认仍然仅允许在 loopback 上使用明文。
- `gateway.remote.token` / `.password` 是远程客户端凭证字段。它们本身不会配置 gateway 认证。
- `gateway.push.apns.relay.baseUrl`：供官方/TestFlight iOS 构建在将 relay 支持的注册发布到 gateway 后使用的外部 APNs relay 基础 HTTPS URL。该 URL 必须与编译进 iOS 构建中的 relay URL 一致。
- `gateway.push.apns.relay.timeoutMs`：gateway 到 relay 的发送超时，单位为毫秒。默认值为 `10000`。
- relay 支持的注册会委托给某个特定的 gateway identity。已配对的 iOS app 会获取 `gateway.identity.get`，在 relay 注册中包含该 identity，并向 gateway 转发一个按注册范围限定的发送授权。其他 gateway 不能复用该已存储的注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：针对上述 relay 配置的临时环境变量覆盖。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅开发环境使用的逃生开关，用于 loopback HTTP relay URL。生产 relay URL 应保持使用 HTTPS。
- `gateway.channelHealthCheckMinutes`：渠道健康监控间隔（分钟）。设为 `0` 可全局禁用健康监控重启。默认：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧 socket 阈值（分钟）。请保持其大于或等于 `gateway.channelHealthCheckMinutes`。默认：`30`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账户在滚动一小时内允许的最大健康监控重启次数。默认：`10`。
- `channels.<provider>.healthMonitor.enabled`：对单个渠道选择退出健康监控重启，同时保留全局监控启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账户渠道的按账户覆盖。设置后，其优先级高于渠道级覆盖。
- 仅当 `gateway.auth.*` 未设置时，本地 gateway 调用路径才可将 `gateway.remote.*` 作为回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 且解析失败，则会以失败关闭方式处理（不会有远程回退掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端请求头的反向代理 IP。只应列出你控制的代理。loopback 条目对于同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**让 loopback 请求满足 `gateway.auth.mode: "trusted-proxy"` 的条件。
- `allowRealIpFallback`：为 `true` 时，如果缺少 `X-Forwarded-For`，gateway 会接受 `X-Real-IP`。默认 `false`，以保持失败关闭行为。
- `gateway.tools.deny`：针对 HTTP `POST /tools/invoke` 额外阻止的工具名（扩展默认 deny 列表）。
- `gateway.tools.allow`：将工具名从默认 HTTP deny 列表中移除。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。通过 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：使用 `gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表会被视为未设置；请使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 来禁用 URL 获取。
- 可选的响应加固请求头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅对你控制的 HTTPS 源设置；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在同一主机上运行多个 gateway，需使用唯一端口和状态目录：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

参见 [Multiple Gateways](/zh-CN/gateway/multiple-gateways)。

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`：在 gateway 监听器上启用 TLS 终止（HTTPS/WSS）（默认：`false`）。
- `autoGenerate`：当未配置显式文件时，自动生成本地自签名证书/密钥对；仅适用于本地/开发环境。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；应限制其权限。
- `caPath`：可选的 CA bundle 路径，用于客户端校验或自定义信任链。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`：控制如何在运行时应用配置编辑。
  - `"off"`：忽略实时编辑；更改需要显式重启。
  - `"restart"`：配置更改时始终重启 gateway 进程。
  - `"hot"`：在进程内应用更改，无需重启。
  - `"hybrid"`（默认）：先尝试热重载；如有需要则回退到重启。
- `debounceMs`：在应用配置更改前的防抖窗口，单位为毫秒（非负整数）。
- `deferralTimeoutMs`：在强制重启前等待进行中操作完成的最大毫秒数（默认：`300000` = 5 分钟）。

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

认证方式：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
查询字符串中的 hook token 会被拒绝。

校验和安全说明：

- `hooks.enabled=true` 要求 `hooks.token` 非空。
- `hooks.token` 必须与 `gateway.auth.token` **不同**；复用 Gateway 网关 token 会被拒绝。
- `hooks.path` 不能是 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果某个映射或 preset 使用了模板化 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 并将 `hooks.allowRequestSessionKey=true`。静态映射键不需要该选择启用。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true`（默认：`false`）时，才接受来自请求负载的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 通过模板渲染得到的映射 `sessionKey` 值也被视为外部提供，因此同样要求 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 会匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 会匹配通用路径中的某个负载字段。
- 类似 `{{messages[0].subject}}` 的模板会从负载中读取值。
- `transform` 可以指向一个返回 hook action 的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且必须保持在 `hooks.transformsDir` 之内（绝对路径和路径穿越都会被拒绝）。
- `agentId` 会路由到特定智能体；未知 ID 会回退到默认值。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 允许全部，`[]` = 全部拒绝）。
- `defaultSessionKey`：可选的固定会话键，用于没有显式 `sessionKey` 的 hook 智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的映射会话键设置 `sessionKey`（默认：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。当任一映射或 preset 使用模板化 `sessionKey` 时，它就成为必填项。
- `deliver: true` 会将最终回复发送到某个渠道；`channel` 默认值为 `last`。
- `model` 会为该 hook 运行覆盖 LLM（如果设置了模型目录，则该模型必须被允许）。

</Accordion>

### Gmail 集成

- 内置 Gmail preset 使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留这种按消息路由的方式，请设置 `hooks.allowRequestSessionKey: true`，并约束 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果你需要 `hooks.allowRequestSessionKey: false`，请用静态 `sessionKey` 覆盖该 preset，而不要使用模板化默认值。

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 配置后，Gateway 网关会在启动时自动运行 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可禁用。
- 不要在 Gateway 网关之外再单独运行一个 `gog gmail watch serve`。

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // 或 OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- 会在 Gateway 网关端口下，通过 HTTP 提供可由智能体编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：请保持 `gateway.bind: "loopback"`（默认）。
- 非 loopback 绑定：canvas 路由要求 Gateway 网关认证（token/password/trusted-proxy），与其他 Gateway 网关 HTTP 表面一致。
- Node WebView 通常不会发送认证请求头；在某个 node 完成配对并连接后，Gateway 网关会为 canvas/A2UI 访问公布 node 作用域的能力 URL。
- 能力 URL 绑定到活动的 node WS 会话，并且会很快过期。不会使用基于 IP 的回退。
- 会向所提供的 HTML 中注入 live-reload 客户端。
- 当目录为空时，会自动创建起始 `index.html`。
- 还会在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需要重启 gateway。
- 对于大型目录或出现 `EMFILE` 错误时，请禁用 live reload。

---

## 设备发现

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（默认）：在 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- hostname 默认为 `openclaw`。可通过 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域网（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

会在 `~/.openclaw/dns/` 下写入一个单播 DNS-SD 区域。对于跨网络发现，请配合 DNS 服务器（推荐 CoreDNS）+ Tailscale split DNS 一起使用。

设置：`openclaw dns setup --apply`。

---

## 环境

### `env`（内联环境变量）

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 只有当进程环境中缺少该键时，才会应用内联环境变量。
- `.env` 文件：当前工作目录下的 `.env` + `~/.openclaw/.env`（两者都不会覆盖现有变量）。
- `shellEnv`：从你的登录 shell profile 中导入缺失的预期键名。
- 完整优先级请参见 [Environment](/zh-CN/help/environment)。

### 环境变量替换

可以在任意配置字符串中通过 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失/为空的变量会在配置加载时抛出错误。
- 使用 `$${VAR}` 可转义为字面量 `${VAR}`。
- 支持与 `$include` 一起使用。

---

## Secrets

Secret ref 是增量特性：明文值仍然可用。

### `SecretRef`

使用统一的对象结构：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

校验规则：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` 的 id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` 的 id：绝对 JSON pointer（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` 的 id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` 的 id 不得包含 `.` 或 `..` 形式的斜杠分隔路径段（例如 `a/../b` 会被拒绝）

### 受支持的凭证表面

- 规范矩阵： [SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 以受支持的 `openclaw.json` 凭证路径为目标。
- `auth-profiles.json` ref 也包含在运行时解析和审计覆盖中。

### Secret providers 配置

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 可选的显式 env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

说明：

- `file` provider 支持 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式下，`id` 必须为 `"value"`）。
- 当 Windows ACL 校验不可用时，file 和 exec provider 路径会以失败关闭方式处理。仅当路径可信且确实无法校验时，才设置 `allowInsecurePath: true`。
- `exec` provider 要求 `command` 为绝对路径，并通过 stdin/stdout 上传输协议负载。
- 默认会拒绝符号链接形式的命令路径。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时仍会校验解析后的目标路径。
- 如果配置了 `trustedDirs`，受信任目录检查会作用于解析后的目标路径。
- `exec` 子进程环境默认尽量精简；请通过 `passEnv` 显式传入所需变量。
- Secret ref 会在激活时解析为内存中的快照，之后请求路径只读取该快照。
- 激活期间会应用活动表面过滤：已启用表面上未解析的 ref 会导致启动/重载失败，而非活动表面会被跳过并带有诊断信息。

---

## Auth 存储

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- 按智能体的 profiles 存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持静态凭证模式下的值级 ref（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- OAuth 模式 profile（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的 auth-profile 凭证。
- 静态运行时凭证来自内存中已解析的快照；发现 legacy 静态 `auth.json` 条目时会清理。
- 旧版 OAuth 会从 `~/.openclaw/credentials/oauth.json` 导入。
- 参见 [OAuth](/zh-CN/concepts/oauth)。
- Secrets 运行时行为以及 `audit/configure/apply` 工具：参见 [Secrets Management](/zh-CN/gateway/secrets)。

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`：当某个 profile 因真实的
  计费/余额不足错误而失败时的基础退避时间（小时）（默认：`5`）。即使是 `401`/`403` 响应，显式的计费文本
  也可能落到这里，但提供商特定的文本
  匹配器仍仅作用于拥有它们的提供商（例如 OpenRouter 的
  `Key limit exceeded`）。可重试的 HTTP `402` 使用窗口或
  organization/workspace 支出上限消息则会保留在 `rate_limit` 路径中。
- `billingBackoffHoursByProvider`：可选的按提供商计费退避小时数覆盖。
- `billingMaxHours`：计费退避指数增长的小时上限（默认：`24`）。
- `authPermanentBackoffMinutes`：针对高置信度 `auth_permanent` 失败的基础退避时间（分钟）（默认：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟上限（默认：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口（小时）（默认：`24`）。
- `overloadedProfileRotations`：对于过载错误，在切换到模型回退之前，同一提供商 auth-profile 允许的最大轮换次数（默认：`1`）。像 `ModelNotReadyException` 这样的提供商繁忙形态会落在这里。
- `overloadedBackoffMs`：在重试过载的提供商/profile 轮换前的固定延迟（默认：`0`）。
- `rateLimitedProfileRotations`：对于限流错误，在切换到模型回退之前，同一提供商 auth-profile 允许的最大轮换次数（默认：`1`）。该限流桶包括诸如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted` 等提供商特定文本。

---

## 日志

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 默认日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 设置 `logging.file` 以使用稳定路径。
- 使用 `--verbose` 时，`consoleLevel` 会提升为 `debug`。
- `maxFileBytes`：在写入被抑制前允许的最大日志文件大小，单位为字节（正整数；默认：`524288000` = 500 MB）。生产部署请使用外部日志轮转。

---

## 诊断

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`：instrumentation 输出的总开关（默认：`true`）。
- `flags`：启用定向日志输出的标志字符串数组（支持通配符，例如 `"telegram.*"` 或 `"*"`）。
- `stuckSessionWarnMs`：当某个会话保持在 processing 状态时，用于发出卡住会话警告的年龄阈值，单位为毫秒。
- `otel.enabled`：启用 OpenTelemetry 导出管线（默认：`false`）。
- `otel.endpoint`：用于 OTel 导出的 collector URL。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求一起发送的额外 HTTP/gRPC 元数据请求头。
- `otel.serviceName`：资源属性中的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或 log 导出。
- `otel.sampleRate`：trace 采样率 `0`–`1`。
- `otel.flushIntervalMs`：定期 telemetry flush 间隔，单位为毫秒。
- `cacheTrace.enabled`：为嵌入式运行记录缓存 trace 快照（默认：`false`）。
- `cacheTrace.filePath`：缓存 trace JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存 trace 输出中包含哪些内容（默认均为 `true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`：npm/git 安装的发布渠道 —— `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：在 gateway 启动时检查 npm 更新（默认：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认：`false`）。
- `auto.stableDelayHours`：stable 渠道自动应用前的最小延迟小时数（默认：`6`；最大：`168`）。
- `auto.stableJitterHours`：stable 渠道额外的发布扩散窗口小时数（默认：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道检查运行的频率（小时）（默认：`1`；最大：`24`）。

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`：全局 ACP 功能开关（默认：`false`）。
- `dispatch.enabled`：ACP 会话轮次分发的独立开关（默认：`true`）。设为 `false` 可在阻止执行的同时保留 ACP 命令可用。
- `backend`：默认 ACP 运行时后端 id（必须匹配已注册的 ACP 运行时插件）。
- `defaultAgent`：当 spawn 未指定显式目标时的回退 ACP 目标智能体 id。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 id 允许列表；空表示无额外限制。
- `maxConcurrentSessions`：同时活动的 ACP 会话最大数量。
- `stream.coalesceIdleMs`：流式文本的空闲 flush 窗口，单位为毫秒。
- `stream.maxChunkChars`：在分割流式块投影前允许的最大块大小。
- `stream.repeatSuppression`：抑制每轮中重复的状态/工具行（默认：`true`）。
- `stream.deliveryMode`：`"live"` 会增量流式传输；`"final_only"` 会缓冲直到轮次终止事件。
- `stream.hiddenBoundarySeparator`：在隐藏工具事件之后、可见文本之前使用的分隔符（默认：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次投影的 assistant 输出最大字符数。
- `stream.maxSessionUpdateChars`：ACP 状态/更新投影行的最大字符数。
- `stream.tagVisibility`：tag 名称到布尔可见性覆盖的映射记录，用于流式事件。
- `runtime.ttlMinutes`：ACP 会话 worker 在可被清理前的空闲 TTL（分钟）。
- `runtime.installCommand`：可选的安装命令，用于在引导 ACP 运行时环境时执行。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` 控制 banner 标语样式：
  - `"random"`（默认）：轮换显示有趣/季节性标语。
  - `"default"`：固定的中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：不显示标语文本（仍会显示 banner 标题/版本）。
- 若要隐藏整个 banner（而不仅仅是标语），请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

---

## 向导

由 CLI 引导式设置流程（`onboard`、`configure`、`doctor`）写入的元数据：

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

请参见 [Agent defaults](#agent-defaults) 下 `agents.list` 的 identity 字段。

---

## Bridge（legacy，已移除）

当前版本已不再包含 TCP bridge。Nodes 通过 Gateway 网关 WebSocket 连接。`bridge.*` 键已不再属于配置 schema 的一部分（在移除前校验会失败；`openclaw doctor --fix` 可清除未知键）。

<Accordion title="旧版 bridge 配置（历史参考）">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // 已弃用，仅供已存储 notify:true 作业的回退
    webhookToken: "replace-with-dedicated-token", // 可选：用于出站 webhook 认证的 bearer token
    sessionRetention: "24h", // duration string 或 false
    runLog: {
      maxBytes: "2mb", // 默认 2_000_000 字节
      keepLines: 2000, // 默认 2000
    },
  },
}
```

- `sessionRetention`：在从 `sessions.json` 清理之前，保留已完成的独立 cron 运行会话的时长。也控制已归档的已删除 cron transcript 的清理。默认：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）在修剪前的最大大小。默认：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志修剪时保留的最新行数。默认：`2000`。
- `webhookToken`：用于 cron webhook POST 交付（`delivery.mode = "webhook"`）的 bearer token；若省略则不会发送认证请求头。
- `webhook`：已弃用的旧版回退 webhook URL（http/https），仅供仍然带有 `notify: true` 的已存储作业使用。

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`：一次性作业在瞬时错误上的最大重试次数（默认：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试尝试对应的退避延迟数组，单位为毫秒（默认：`[30000, 60000, 300000]`；1–10 项）。
- `retryOn`：会触发重试的错误类型 —— `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略则会重试所有瞬时类型。

仅适用于一次性 cron 作业。循环作业使用单独的失败处理机制。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`：为 cron 作业启用失败告警（默认：`false`）。
- `after`：在触发告警前所需的连续失败次数（正整数，最小值：`1`）。
- `cooldownMs`：同一作业重复告警之间的最小间隔，单位为毫秒（非负整数）。
- `mode`：交付模式 —— `"announce"` 会通过渠道消息发送；`"webhook"` 会 POST 到已配置的 webhook。
- `accountId`：用于限定告警交付范围的可选账户或渠道 id。

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- 适用于所有作业的 cron 失败通知默认目标。
- `mode`：`"announce"` 或 `"webhook"`；当目标数据足够时，默认值为 `"announce"`。
- `channel`：用于 announce 交付的渠道覆盖。`"last"` 会复用最后一次已知的交付渠道。
- `to`：显式的 announce 目标或 webhook URL。webhook 模式下必填。
- `accountId`：可选的交付账户覆盖。
- 按作业的 `delivery.failureDestination` 会覆盖这个全局默认值。
- 当既未设置全局也未设置按作业失败目标时，那些本来就通过 `announce` 交付的作业，在失败时会回退到其主 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 的作业，除非该作业的主 `delivery.mode` 是 `"webhook"`。

参见 [Cron Jobs](/zh-CN/automation/cron-jobs)。独立的 cron 执行会作为 [后台任务](/zh-CN/automation/tasks) 进行跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量 | 描述 |
| ---- | ---- |
| `{{Body}}` | 完整的入站消息正文 |
| `{{RawBody}}` | 原始正文（无历史/发送者包装） |
| `{{BodyStripped}}` | 去除群组提及后的正文 |
| `{{From}}` | 发送者标识符 |
| `{{To}}` | 目标标识符 |
| `{{MessageSid}}` | 渠道消息 id |
| `{{SessionId}}` | 当前会话 UUID |
| `{{IsNewSession}}` | 当创建了新会话时为 `"true"` |
| `{{MediaUrl}}` | 入站媒体伪 URL |
| `{{MediaPath}}` | 本地媒体路径 |
| `{{MediaType}}` | 媒体类型（image/audio/document/…） |
| `{{Transcript}}` | 音频 transcript |
| `{{Prompt}}` | CLI 条目的已解析媒体提示 |
| `{{MaxChars}}` | CLI 条目的已解析最大输出字符数 |
| `{{ChatType}}` | `"direct"` 或 `"group"` |
| `{{GroupSubject}}` | 群组主题（尽力而为） |
| `{{GroupMembers}}` | 群组成员预览（尽力而为） |
| `{{SenderName}}` | 发送者显示名称（尽力而为） |
| `{{SenderE164}}` | 发送者电话号码（尽力而为） |
| `{{Provider}}` | 提供商提示（whatsapp、telegram、discord 等） |

---

## 配置 include（`$include`）

将配置拆分到多个文件中：

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**合并行为：**

- 单文件：替换包含它的对象。
- 文件数组：按顺序深度合并（后面的覆盖前面的）。
- 同级键：会在 include 之后合并（覆盖 include 中的值）。
- 嵌套 include：最多支持 10 层深度。
- 路径：相对于包含它的文件解析，但必须保持在顶层配置目录（`openclaw.json` 所在目录的 `dirname`）之内。绝对路径/`../` 形式只有在最终解析结果仍位于该边界内时才允许。
- 仅修改某个由单文件 include 支持的顶层段的 OpenClaw 自有写入，会直写到该 include 文件。例如，`plugins install` 会将 `plugins: { $include: "./plugins.json5" }` 的更新写入 `plugins.json5`，并保持 `openclaw.json` 不变。
- 根 include、include 数组，以及带有同级覆盖的 include，对 OpenClaw 自有写入来说是只读的；这类写入会以失败关闭方式处理，而不会将配置压平。
- 错误：会为缺失文件、解析错误和循环 include 提供清晰提示。

---

_相关内容：[Configuration](/zh-CN/gateway/configuration) · [Configuration Examples](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_
