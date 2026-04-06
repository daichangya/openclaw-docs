---
read_when:
    - 设置 Slack 或调试 Slack socket/HTTP 模式
summary: Slack 设置与运行时行为（Socket Mode + HTTP 请求 URL）
title: Slack
x-i18n:
    generated_at: "2026-04-06T07:21:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f324c1b203146b8b885179e9f76cd6883cedf96a87df1d9642626d8e7fb392a7
    source_path: channels/slack.md
    workflow: 15
---

# Slack

状态：已可在生产环境中用于通过 Slack 应用集成实现私信和渠道。默认模式为 Socket Mode；也支持 HTTP 请求 URL。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断与修复手册。
  </Card>
</CardGroup>

## 快速设置

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建 Slack 应用和令牌">
        在 Slack 应用设置中：

        - 启用 **Socket Mode**
        - 创建带有 `connections:write` 权限的 **App Token**（`xapp-...`）
        - 安装应用并复制 **Bot Token**（`xoxb-...`）
      </Step>

      <Step title="配置 OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        环境变量回退（仅默认账户）：

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="订阅应用事件">
        为机器人订阅以下事件：

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        另外，为私信启用 App Home **Messages Tab**。
      </Step>

      <Step title="启动 Gateway 网关">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP 请求 URL">
    <Steps>
      <Step title="为 HTTP 配置 Slack 应用">

        - 将模式设为 HTTP（`channels.slack.mode="http"`）
        - 复制 Slack **Signing Secret**
        - 将事件订阅、交互和斜杠命令的 Request URL 都设置为同一路径（默认 `/slack/events`）

      </Step>

      <Step title="配置 OpenClaw HTTP 模式">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="为多账户 HTTP 使用唯一的 webhook 路径">
        支持按账户使用 HTTP 模式。

        为每个账户指定不同的 `webhookPath`，以避免注册冲突。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Manifest 和 scope 清单

<Tabs>
  <Tab title="Socket Mode（默认）">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Tab>

  <Tab title="HTTP 请求 URL">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="可选的用户令牌 scopes（读取操作）">
    如果你配置了 `channels.slack.userToken`，常见的读取 scopes 包括：

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果你依赖 Slack 搜索读取）

  </Accordion>
</AccordionGroup>

## 令牌模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文字符串或 SecretRef 对象。
- 配置中的令牌会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）仅支持通过配置提供（无环境变量回退），并默认使用只读行为（`userTokenReadOnly: true`）。
- 可选：如果你希望发送消息时使用当前智能体身份（自定义 `username` 和图标），可添加 `chat:write.customize`。`icon_emoji` 使用 `:emoji_name:` 语法。

状态快照行为：

- Slack 账户检查会跟踪每个凭证的 `*Source` 和 `*Status` 字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态可为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示该账户通过 SecretRef 或其他非内联密钥来源完成了配置，但当前命令或运行时路径无法解析出实际值。
- 在 HTTP 模式下，会包含 `signingSecretStatus`；在 Socket Mode 下，所需配对是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作或目录读取，如果配置了用户令牌，则可优先使用用户令牌。对于写入，仍优先使用机器人令牌；仅当 `userTokenReadOnly: false` 且机器人令牌不可用时，才允许使用用户令牌执行写入。
</Tip>

## 操作和门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作组：

| 组 | 默认值 |
| ---------- | ------- |
| messages   | 已启用 |
| reactions  | 已启用 |
| pins       | 已启用 |
| memberInfo | 已启用 |
| emojiList  | 已启用 |

当前 Slack 消息操作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。

## 访问控制与路由

<Tabs>
  <Tab title="私信策略">
    `channels.slack.dmPolicy` 控制私信访问（旧版：`channels.slack.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.slack.allowFrom` 包含 `"*"`；旧版：`channels.slack.dm.allowFrom`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认 true）
    - `channels.slack.allowFrom`（推荐）
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认 false）
    - `dm.groupChannels`（可选 MPIM 允许列表）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 当命名账户自己的 `allowFrom` 未设置时，会继承 `channels.slack.allowFrom`。
    - 命名账户不会继承 `channels.slack.accounts.default.allowFrom`。

    在私信中配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="渠道策略">
    `channels.slack.groupPolicy` 控制渠道处理方式：

    - `open`
    - `allowlist`
    - `disabled`

    渠道允许列表位于 `channels.slack.channels` 下，且应使用稳定的渠道 ID。

    运行时说明：如果 `channels.slack` 完全缺失（仅使用环境变量配置），运行时会回退为 `groupPolicy="allowlist"` 并记录警告日志（即使已设置 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 当令牌访问允许时，渠道允许列表项和私信允许列表项会在启动时解析
    - 无法解析的渠道名称项会按原样保留在配置中，但默认会在路由中被忽略
    - 入站授权和渠道路由默认优先使用 ID；直接按用户名/slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="提及与渠道用户">
    渠道消息默认受提及门控。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人线程行为

    每渠道控制（`channels.slack.channels.<id>`；仅可通过启动时解析或 `dangerouslyAllowNameMatching` 使用名称）：

    - `requireMention`
    - `users`（允许列表）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍仅映射到 `id:`）

  </Tab>
</Tabs>

## 线程、会话与回复标签

- 私信路由为 `direct`；渠道为 `channel`；MPIM 为 `group`。
- 使用默认 `session.dmScope=main` 时，Slack 私信会折叠到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 线程回复在适用时可创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认值为 `thread`；`thread.inheritParent` 默认值为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时会抓取多少条现有线程消息（默认 `20`；设为 `0` 可禁用）。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 分别设置
- 私聊的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注意：`replyToMode="off"` 会禁用 Slack 中**所有**回复线程功能，包括显式 `[[reply_to_*]]` 标签。这与 Telegram 不同，在 Telegram 中，即使是 `"off"` 模式也仍会遵循显式标签。此差异反映了平台的线程模型：Slack 线程会将消息隐藏在渠道之外，而 Telegram 回复仍会显示在主聊天流中。

## 确认反应

`ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认 emoji。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 `"👀"`）

说明：

- Slack 需要短代码格式（例如 `"eyes"`）。
- 使用 `""` 可为某个 Slack 账户或全局禁用该反应。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成期间显示进度状态文本，然后发送最终文本。

当 `streaming` 为 `partial` 时，`channels.slack.nativeStreaming` 控制 Slack 原生文本流式传输（默认：`true`）。

- 必须有可用的回复线程，原生文本流式传输才会显示。线程选择仍遵循 `replyToMode`。如果没有线程，则使用普通草稿预览。
- 媒体和非文本负载会回退为普通发送。
- 如果流式传输在回复中途失败，OpenClaw 会对剩余负载回退为普通发送。

使用草稿预览而不是 Slack 原生文本流式传输：

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

旧版键：

- `channels.slack.streamMode`（`replace | status_final | append`）会自动迁移到 `channels.slack.streaming`。
- 布尔值 `channels.slack.streaming` 会自动迁移到 `channels.slack.nativeStreaming`。

## 输入中反应回退

`typingReaction` 会在 OpenClaw 处理回复期间为入站 Slack 消息临时添加一个反应，并在本次运行结束后将其移除。这在非线程回复场景中最有用，因为线程回复会使用默认的“正在输入...”状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

说明：

- Slack 需要短代码格式（例如 `"hourglass_flowing_sand"`）。
- 该反应为尽力而为机制，并会在回复完成或失败路径结束后自动尝试清理。

## 媒体、分块与发送

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（基于令牌认证的请求流程），并在抓取成功且大小限制允许时写入媒体存储。

    运行时入站大小上限默认为 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本分块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用按段落优先拆分
    - 文件发送使用 Slack 上传 API，并可包含线程回复（`thread_ts`）
    - 如果配置了 `channels.slack.mediaMaxMb`，出站媒体上限将遵循其设置；否则，渠道发送使用媒体管道中的 MIME 类型默认值
  </Accordion>

  <Accordion title="发送目标">
    推荐的显式目标：

    - 私信使用 `user:<id>`
    - 渠道使用 `channel:<id>`

    发送到用户目标时，Slack 私信会通过 Slack 会话 API 打开。

  </Accordion>
</AccordionGroup>

## 命令与斜杠行为

- Slack 的原生命令自动模式默认**关闭**（`commands.native: "auto"` 不会启用 Slack 原生命令）。
- 使用 `channels.slack.commands.native: true`（或全局 `commands.native: true`）启用原生 Slack 命令处理器。
- 启用原生命令后，需要在 Slack 中注册匹配的斜杠命令（`/<command>` 名称），但有一个例外：
  - 状态命令需要注册为 `/agentstatus`（Slack 保留了 `/status`）
- 如果未启用原生命令，你可以通过 `channels.slack.slashCommand` 运行一个已配置的单一斜杠命令。
- 原生参数菜单现在会自适应其渲染策略：
  - 最多 5 个选项：按钮块
  - 6-100 个选项：静态选择菜单
  - 超过 100 个选项：当交互选项处理器可用时，使用支持异步选项过滤的外部选择
  - 如果编码后的选项值超出 Slack 限制，该流程会回退为按钮
- 对于较长的选项负载，斜杠命令参数菜单会在分派选定值之前显示确认对话框。

默认斜杠命令设置：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

斜杠会话使用隔离键：

- `agent:<agentId>:slack:slash:<userId>`

并且仍会针对目标会话执行命令路由（`CommandTargetSessionKey`）。

## 交互式回复

Slack 可以渲染由智能体编写的交互式回复控件，但此功能默认禁用。

全局启用方式：

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

或仅为某个 Slack 账户启用：

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

启用后，智能体可以输出仅适用于 Slack 的回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并将点击或选择通过现有的 Slack 交互事件路径回传。

说明：

- 这是 Slack 专用 UI。其他渠道不会将 Slack Block Kit 指令转换为它们自己的按钮系统。
- 交互回调值是 OpenClaw 生成的不透明令牌，而不是智能体编写的原始值。
- 如果生成的交互块会超出 Slack Block Kit 限制，OpenClaw 会回退为原始文本回复，而不是发送无效的 blocks 负载。

## Slack 中的 exec 审批

Slack 可以作为原生审批客户端，使用交互按钮和交互事件，而不必回退到 Web UI 或终端。

- exec 审批使用 `channels.slack.execApprovals.*` 控制原生私信/渠道路由。
- 当请求已经落在 Slack 中且审批 ID 类型为 `plugin:` 时，插件审批仍可通过相同的 Slack 原生按钮界面处理。
- 审批人授权仍然会被强制执行：只有被识别为审批人的用户才能通过 Slack 批准或拒绝请求。

这使用与其他渠道相同的共享审批按钮界面。当你在 Slack 应用设置中启用 `interactivity` 时，审批提示会直接在会话中渲染为 Block Kit 按钮。
当这些按钮存在时，它们是主要的审批 UX；仅当工具结果表明聊天审批不可用或手动审批是唯一途径时，OpenClaw
才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；尽可能回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"` 且至少解析出一名
审批人时，Slack 会自动启用原生 exec 审批。设置 `enabled: false` 可显式禁用 Slack 作为原生审批客户端。
设置 `enabled: true` 可在审批人可解析时强制启用原生审批。

在没有显式 Slack exec 审批配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆盖审批人、添加过滤器或
选择将消息发送回来源聊天时，才需要显式的 Slack 原生配置：

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

共享 `approvals.exec` 转发是独立的。仅当 exec 审批提示还必须
路由到其他聊天或显式的带外目标时才使用它。共享 `approvals.plugin` 转发同样
是独立的；当这些请求已经落在 Slack 中时，Slack 原生按钮仍可以处理插件审批。

同一聊天中的 `/approve` 也可用于已支持命令的 Slack 渠道和私信。有关完整的审批转发模型，请参阅 [Exec approvals](/zh-CN/tools/exec-approvals)。

## 事件与运行行为

- 消息编辑/删除/线程广播会映射为系统事件。
- 添加/移除反应事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名以及添加/移除固定消息事件会映射为系统事件。
- 当启用 `configWrites` 时，`channel_id_changed` 可以迁移渠道配置键。
- 渠道 topic/purpose 元数据被视为不受信任的上下文，并可注入到路由上下文中。
- 线程发起者和初始线程历史上下文播种会在适用时按配置的发送者允许列表进行过滤。
- 块操作和模态交互会发出结构化的 `Slack interaction: ...` 系统事件，并带有丰富的负载字段：
  - 块操作：选中的值、标签、选择器值以及 `workflow_*` 元数据
  - 模态 `view_submission` 和 `view_closed` 事件，附带已路由的渠道元数据和表单输入

## 配置参考指针

主要参考：

- [配置参考 - Slack](/zh-CN/gateway/configuration-reference#slack)

  高信号 Slack 字段：
  - 模式/认证：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
  - 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
  - 兼容性开关：`dangerouslyAllowNameMatching`（最后手段；除非必要请保持关闭）
  - 渠道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
  - 线程/历史：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
  - 发送：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`nativeStreaming`
  - 运维/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

## 故障排除

<AccordionGroup>
  <Accordion title="渠道中没有回复">
    按顺序检查：

    - `groupPolicy`
    - 渠道允许列表（`channels.slack.channels`）
    - `requireMention`
    - 每渠道 `users` 允许列表

    有用的命令：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="私信消息被忽略">
    检查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或旧版 `channels.slack.dm.policy`）
    - 配对审批 / 允许列表条目

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式未连接">
    验证机器人令牌和应用令牌，以及 Slack 应用设置中是否已启用 Socket Mode。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，则表示该 Slack 账户
    已完成配置，但当前运行时无法解析由 SecretRef 支持的
    值。

  </Accordion>

  <Accordion title="HTTP 模式未接收到事件">
    验证：

    - signing secret
    - webhook 路径
    - Slack Request URL（事件 + 交互 + 斜杠命令）
    - 每个 HTTP 账户使用唯一的 `webhookPath`

    如果账户快照中出现 `signingSecretStatus: "configured_unavailable"`，
    则表示该 HTTP 账户已完成配置，但当前运行时无法
    解析由 SecretRef 支持的 signing secret。

  </Accordion>

  <Accordion title="原生命令 / 斜杠命令未触发">
    确认你期望的是：

    - 原生命令模式（`channels.slack.commands.native: true`），并在 Slack 中注册了匹配的斜杠命令
    - 或单一斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    另外还要检查 `commands.useAccessGroups` 以及渠道/用户允许列表。

  </Accordion>
</AccordionGroup>

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [故障排除](/zh-CN/channels/troubleshooting)
- [配置](/zh-CN/gateway/configuration)
- [斜杠命令](/zh-CN/tools/slash-commands)
