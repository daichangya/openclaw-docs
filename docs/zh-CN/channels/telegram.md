---
read_when:
    - 正在开发 Telegram 功能或 Webhook
summary: Telegram 机器人支持状态、功能和配置
title: Telegram
x-i18n:
    generated_at: "2026-04-21T00:17:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c70775b55d4923a31ad8bae7f4c6e7cbae754c05c3a578180d63db2b59e39a
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram（Bot API）

状态：通过 grammY 为机器人私信和群组提供生产就绪支持。长轮询是默认模式；Webhook 模式为可选。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Telegram 的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断与修复操作手册。
  </Card>
  <Card title="Gateway 网关配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式与示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="在 BotFather 中创建机器人令牌">
    打开 Telegram 并与 **@BotFather** 对话（确认用户名严格为 `@BotFather`）。

    运行 `/newbot`，按提示操作，并保存令牌。

  </Step>

  <Step title="配置令牌和私信策略">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    环境变量回退：`TELEGRAM_BOT_TOKEN=...`（仅默认账户）。
    Telegram **不**使用 `openclaw channels login telegram`；请在配置或环境变量中配置令牌，然后启动 Gateway 网关。

  </Step>

  <Step title="启动 Gateway 网关并批准第一条私信">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配对码会在 1 小时后过期。

  </Step>

  <Step title="将机器人添加到群组">
    将机器人添加到你的群组，然后设置 `channels.telegram.groups` 和 `groupPolicy` 以匹配你的访问模型。
  </Step>
</Steps>

<Note>
令牌解析顺序是账户感知的。实际行为是，配置值优先于环境变量回退，而 `TELEGRAM_BOT_TOKEN` 仅适用于默认账户。
</Note>

## Telegram 侧设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram 机器人默认启用 **隐私模式**，这会限制它们能接收到的群组消息。

    如果机器人必须看到所有群组消息，可以：

    - 通过 `/setprivacy` 禁用隐私模式，或
    - 将机器人设为群管理员。

    切换隐私模式后，请在每个群组中移除并重新添加机器人，以便 Telegram 应用更改。

  </Accordion>

  <Accordion title="群组权限">
    管理员身份由 Telegram 群组设置控制。

    管理员机器人会接收所有群组消息，这对始终在线的群组行为很有帮助。

  </Accordion>

  <Accordion title="有用的 BotFather 开关">

    - `/setjoingroups`：允许或禁止加入群组
    - `/setprivacy`：控制群组可见性行为

  </Accordion>
</AccordionGroup>

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制私信访问：

    - `pairing`（默认）
    - `allowlist`（要求 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `channels.telegram.allowFrom` 接受数字形式的 Telegram 用户 ID。支持并会标准化 `telegram:` / `tg:` 前缀。
    `dmPolicy: "allowlist"` 且 `allowFrom` 为空时会阻止所有私信，并被配置校验拒绝。
    设置时只要求填写数字用户 ID。
    如果你升级后配置中仍包含 `@username` 形式的 allowlist 条目，请运行 `openclaw doctor --fix` 进行解析（尽力而为；需要 Telegram 机器人令牌）。
    如果你之前依赖配对存储的 allowlist 文件，`openclaw doctor --fix` 可以在 allowlist 流程中将这些条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 还没有显式 ID 时）。

    对于单一所有者的机器人，推荐使用 `dmPolicy: "allowlist"` 并显式填写数字 `allowFrom` ID，这样访问策略会稳定地保存在配置中（而不是依赖之前的配对批准）。

    常见误解：批准私信配对并不意味着“这个发送者在任何地方都已授权”。
    配对只授予私信访问权限。群组发送者授权仍然来自显式配置的 allowlist。
    如果你希望实现“我授权一次后，私信和群组命令都能用”，请把你的数字 Telegram 用户 ID 放到 `channels.telegram.allowFrom` 中。

    ### 查找你的 Telegram 用户 ID

    更安全的方法（不使用第三方机器人）：

    1. 向你的机器人发送私信。
    2. 运行 `openclaw logs --follow`。
    3. 读取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隐私性较低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群组策略和 allowlist">
    以下两个控制项会同时生效：

    1. **允许哪些群组**（`channels.telegram.groups`）
       - 没有 `groups` 配置：
         - 当 `groupPolicy: "open"` 时：任何群组都可以通过群组 ID 检查
         - 当 `groupPolicy: "allowlist"`（默认）时：群组会被阻止，直到你添加 `groups` 条目（或 `"*"`）
       - 已配置 `groups`：其行为等同于 allowlist（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 会回退到 `allowFrom`。
    `groupAllowFrom` 条目应为数字形式的 Telegram 用户 ID（`telegram:` / `tg:` 前缀会被标准化）。
    不要把 Telegram 群组或超级群聊天 ID 放进 `groupAllowFrom`。负数聊天 ID 应放在 `channels.telegram.groups` 下。
    非数字条目会在发送者授权时被忽略。
    安全边界（`2026.2.25+`）：群组发送者授权**不会**继承私信配对存储批准。
    配对仍然仅适用于私信。对于群组，请设置 `groupAllowFrom` 或按群组/话题设置 `allowFrom`。
    如果未设置 `groupAllowFrom`，Telegram 会回退到配置中的 `allowFrom`，而不是配对存储。
    单一所有者机器人的实用模式：将你的用户 ID 设到 `channels.telegram.allowFrom` 中，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    运行时说明：如果 `channels.telegram` 完全缺失，则运行时默认采用失败即关闭的 `groupPolicy="allowlist"`，除非显式设置了 `channels.defaults.groupPolicy`。

    示例：允许某个特定群组中的任意成员：

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    示例：只允许某个特定群组中的特定用户：

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      常见错误：`groupAllowFrom` 不是 Telegram 群组 allowlist。

      - 像 `-1001234567890` 这样的负数 Telegram 群组或超级群聊天 ID，应放在 `channels.telegram.groups` 下。
      - 像 `8734062810` 这样的 Telegram 用户 ID，应放在 `groupAllowFrom` 下，当你想限制允许群组中哪些人可以触发机器人时使用。
      - 仅当你希望允许群组中的任意成员都能与机器人对话时，才使用 `groupAllowFrom: ["*"]`。
    </Warning>

  </Tab>

  <Tab title="提及行为">
    群组回复默认需要提及。

    提及可以来自：

    - 原生 `@botusername` 提及，或
    - 以下位置中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    会话级命令开关：

    - `/activation always`
    - `/activation mention`

    这些只会更新会话状态。若要持久保存，请使用配置。

    持久配置示例：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    获取群组聊天 ID 的方法：

    - 将群组消息转发给 `@userinfobot` / `@getidsbot`
    - 或从 `openclaw logs --follow` 中读取 `chat.id`
    - 或检查 Bot API 的 `getUpdates`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 Gateway 网关进程管理。
- 路由是确定性的：Telegram 入站回复会回到 Telegram（模型不会选择渠道）。
- 入站消息会被标准化为共享渠道信封格式，包含回复元数据和媒体占位符。
- 群组会话按群组 ID 隔离。论坛话题会追加 `:topic:<threadId>`，以保持话题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会使用线程感知的会话键进行路由，并为回复保留线程 ID。
- 长轮询使用带有按聊天/按线程顺序处理的 grammY runner。整体 runner sink 并发使用 `agents.defaults.maxConcurrent`。
- 长轮询监视器默认会在 120 秒内没有完成的 `getUpdates` 存活信号时触发重启。只有在你的部署在长时间运行任务期间仍然出现误判的轮询停滞重启时，才增加 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围是 `30000` 到 `600000`；支持按账户覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

## 功能参考

<AccordionGroup>
  <Accordion title="实时流式预览（消息编辑）">
    OpenClaw 可以实时流式传输部分回复：

    - 私聊：预览消息 + `editMessageText`
    - 群组/话题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认：`partial`）
    - `progress` 在 Telegram 上会映射为 `partial`（兼容跨渠道命名）
    - 旧版 `channels.telegram.streamMode` 和布尔型 `streaming` 值会自动映射

    对于纯文本回复：

    - 私信：OpenClaw 会保留同一条预览消息，并在原地执行最终编辑（不会发送第二条消息）
    - 群组/话题：OpenClaw 会保留同一条预览消息，并在原地执行最终编辑（不会发送第二条消息）

    对于复杂回复（例如媒体负载），OpenClaw 会回退到普通最终投递，然后清理预览消息。

    预览流式传输与分块流式传输彼此独立。当为 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

    如果原生草稿传输不可用或被拒绝，OpenClaw 会自动回退到 `sendMessage` + `editMessageText`。

    仅限 Telegram 的推理流：

    - `/reasoning stream` 会在生成过程中将推理发送到实时预览
    - 最终答案发送时不包含推理文本

  </Accordion>

  <Accordion title="格式化和 HTML 回退">
    出站文本使用 Telegram `parse_mode: "HTML"`。

    - 类 Markdown 文本会被渲染为 Telegram 安全的 HTML。
    - 原始模型 HTML 会被转义，以减少 Telegram 解析失败。
    - 如果 Telegram 拒绝解析后的 HTML，OpenClaw 会以纯文本重试。

    链接预览默认启用，可通过 `channels.telegram.linkPreview: false` 禁用。

  </Accordion>

  <Accordion title="原生命令和自定义命令">
    Telegram 命令菜单注册会在启动时通过 `setMyCommands` 处理。

    原生命令默认值：

    - `commands.native: "auto"` 会为 Telegram 启用原生命令

    添加自定义命令菜单项：

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git 备份" },
        { command: "generate", description: "创建图像" },
      ],
    },
  },
}
```

    规则：

    - 名称会被标准化（去掉前导 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突或重复项会被跳过并记录日志

    说明：

    - 自定义命令仅是菜单项；它们不会自动实现行为
    - 即使没有显示在 Telegram 菜单中，plugin/skill 命令在手动输入时仍然可以工作

    如果禁用了原生命令，内置命令会被移除。如果已配置，自定义/plugin 命令仍可能被注册。

    常见设置失败：

    - 带有 `BOT_COMMANDS_TOO_MUCH` 的 `setMyCommands failed` 表示 Telegram 菜单在裁剪后仍然超出限制；请减少 plugin/skill/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 带有网络或抓取错误的 `setMyCommands failed` 通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` plugin）

    安装 `device-pair` plugin 后：

    1. `/pair` 生成设置代码
    2. 在 iOS 应用中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/作用域）
    4. 批准请求：
       - `/pair approve <requestId>` 用于显式批准
       - 当只有一个待处理请求时，使用 `/pair approve`
       - `/pair approve latest` 用于最近的请求

    设置代码携带一个短期有效的 bootstrap 令牌。内置 bootstrap 交接会将主节点令牌保持为 `scopes: []`；任何交接出去的操作员令牌都会被限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。Bootstrap 作用域检查带有角色前缀，因此该操作员 allowlist 只能满足操作员请求；非操作员角色仍然需要其自身角色前缀下的作用域。

    如果设备以已更改的认证详情重试（例如角色、作用域、公钥），之前的待处理请求会被新请求取代，且新请求会使用不同的 `requestId`。批准前请重新运行 `/pair pending`。

    更多详情：[配对](/zh-CN/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="内联按钮">
    配置内联键盘范围：

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    按账户覆盖：

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    范围：

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（默认）

    旧版 `capabilities: ["inlineButtons"]` 会映射为 `inlineButtons: "all"`。

    消息动作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    回调点击会作为文本传递给智能体：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="面向智能体和自动化的 Telegram 消息动作">
    Telegram 工具动作包括：

    - `sendMessage`（`to`、`content`、可选的 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、可选的 `iconColor`、`iconCustomEmojiId`）

    渠道消息动作公开了更易用的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    控制开关：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 当前默认启用，没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用当前激活的配置/密钥快照（启动/重载时），因此动作路径不会在每次发送时临时重新解析 SecretRef。

    移除表情反应的语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复指定的 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会被遵循。

  </Accordion>

  <Accordion title="论坛话题和线程行为">
    论坛超级群：

    - 话题会话键会追加 `:topic:<threadId>`
    - 回复和输入状态会定向到该话题线程
    - 话题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    常规话题（`threadId=1`）特殊情况：

    - 发送消息时省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 输入状态动作仍包含 `message_thread_id`

    话题继承：话题条目会继承群组设置，除非被覆盖（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅适用于话题，不会从群组默认值继承。

    **按话题的智能体路由**：每个话题都可以通过在话题配置中设置 `agentId` 路由到不同的智能体。这会让每个话题拥有各自隔离的工作区、记忆和会话。示例：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 常规话题 → main 智能体
                "3": { agentId: "zu" },        // 开发话题 → zu 智能体
                "5": { agentId: "coder" }      // 代码审查 → coder 智能体
              }
            }
          }
        }
      }
    }
    ```

    然后每个话题都会拥有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 话题绑定**：论坛话题可以通过顶层类型化 ACP 绑定固定 ACP harness 会话：

    - `bindings[]` 中带有 `type: "acp"` 和 `match.channel: "telegram"`

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
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    该功能当前仅适用于群组和超级群中的论坛话题。

    **从聊天中生成线程绑定的 ACP**：

    - `/acp spawn <agent> --thread here|auto` 可以将当前 Telegram 话题绑定到一个新的 ACP 会话。
    - 后续该话题中的消息会直接路由到已绑定的 ACP 会话（无需 `/acp steer`）。
    - 成功绑定后，OpenClaw 会将生成确认消息固定在该话题中。
    - 需要 `channels.telegram.threadBindings.spawnAcpSessions=true`。

    模板上下文包括：

    - `MessageThreadId`
    - `IsForum`

    私信线程行为：

    - 带有 `message_thread_id` 的私聊会保留私信路由，但使用线程感知的会话键和回复目标。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 区分语音消息和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中添加标签 `[[audio_as_voice]]` 可强制按语音消息发送

    消息动作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 视频消息

    Telegram 区分视频文件和视频便笺。

    消息动作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    视频便笺不支持说明文字；提供的消息文本会单独发送。

    ### 贴纸

    入站贴纸处理：

    - 静态 WEBP：下载并处理（占位符 `<media:sticker>`）
    - 动画 TGS：跳过
    - 视频 WEBM：跳过

    贴纸上下文字段：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    贴纸缓存文件：

    - `~/.openclaw/telegram/sticker-cache.json`

    贴纸会尽可能只描述一次并缓存，以减少重复的视觉调用。

    启用贴纸动作：

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    发送贴纸动作：

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    搜索已缓存贴纸：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="表情反应通知">
    Telegram 表情反应会以 `message_reaction` 更新到达（与消息负载分开）。

    启用后，OpenClaw 会将如下系统事件加入队列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`: `off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（默认：`minimal`）

    说明：

    - `own` 表示仅用户对机器人发送消息的表情反应（尽力通过已发送消息缓存判断）。
    - 表情反应事件仍遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。
    - Telegram 不会在表情反应更新中提供线程 ID。
      - 非论坛群组会路由到群聊会话
      - 论坛群组会路由到群组常规话题会话（`:topic:1`），而不是确切的原始话题

    轮询或 webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="确认表情反应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认表情。

    解析顺序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 "👀"）

    说明：

    - Telegram 需要 unicode emoji（例如 "👀"）。
    - 使用 `""` 可为某个渠道或账户禁用该表情反应。

  </Accordion>

  <Accordion title="来自 Telegram 事件和命令的配置写入">
    渠道配置写入默认启用（`configWrites !== false`）。

    由 Telegram 触发的写入包括：

    - 群组迁移事件（`migrate_to_chat_id`），用于更新 `channels.telegram.groups`
    - `/config set` 和 `/config unset`（需要启用命令）

    禁用方式：

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="长轮询与 webhook">
    默认：长轮询。

    Webhook 模式：

    - 设置 `channels.telegram.webhookUrl`
    - 设置 `channels.telegram.webhookSecret`（设置 webhook URL 时必需）
    - 可选 `channels.telegram.webhookPath`（默认 `/telegram-webhook`）
    - 可选 `channels.telegram.webhookHost`（默认 `127.0.0.1`）
    - 可选 `channels.telegram.webhookPort`（默认 `8787`）

    Webhook 模式的默认本地监听器绑定到 `127.0.0.1:8787`。

    如果你的公网端点不同，请在前面放置一个反向代理，并让 `webhookUrl` 指向公网 URL。
    当你确实需要外部入口时，请设置 `webhookHost`（例如 `0.0.0.0`）。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会在按长度拆分前优先按段落边界（空行）拆分。
    - `channels.telegram.mediaMaxMb`（默认 100）限制 Telegram 入站和出站媒体大小。
    - `channels.telegram.timeoutSeconds` 会覆盖 Telegram API 客户端超时（如果未设置，则使用 grammY 默认值）。
    - `channels.telegram.pollingStallThresholdMs` 默认值为 `120000`；仅在出现误判的轮询停滞重启时，才在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 回复/引用/转发补充上下文当前会按接收内容原样传递。
    - Telegram allowlist 主要用于控制谁可以触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助函数（CLI/工具/动作）中的可恢复出站 API 错误。

    CLI 发送目标可以是数字聊天 ID 或用户名：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram 投票使用 `openclaw message poll`，并支持论坛话题：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    仅限 Telegram 的投票标志：

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - 论坛话题使用 `--thread-id`（或使用 `:topic:` 目标）

    Telegram 发送还支持：

    - `--buttons`，当 `channels.telegram.capabilities.inlineButtons` 允许该目标表面时，用于内联键盘
    - `--force-document`，将出站图像和 GIF 作为文档发送，而不是作为压缩照片或动画媒体上传

    动作控制开关：

    - `channels.telegram.actions.sendMessage=false` 会禁用出站 Telegram 消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，同时保持普通发送可用

  </Accordion>

  <Accordion title="Telegram 中的 exec 批准">
    Telegram 支持在批准者私信中进行 exec 批准，也可以选择在原始聊天或话题中发布批准提示。

    配置路径：

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`（可选；在可能时会回退为从 `allowFrom` 和直接 `defaultTo` 推断出的数字所有者 ID）
    - `channels.telegram.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`

    批准者必须是数字形式的 Telegram 用户 ID。当 `enabled` 未设置或为 `"auto"` 且至少可解析出一个批准者时，Telegram 会自动启用原生 exec 批准，这些批准者可来自 `execApprovals.approvers`，也可来自账户的数字所有者配置（`allowFrom` 和私信 `defaultTo`）。将 `enabled: false` 设置为显式禁用 Telegram 作为原生批准客户端。否则，批准请求会回退到其他已配置的批准路由或 exec 批准回退策略。

    Telegram 还会渲染其他聊天渠道共用的批准按钮。原生 Telegram 适配器主要增加了批准者私信路由、渠道/话题扇出，以及投递前的输入提示。
    当这些按钮存在时，它们就是主要的批准交互方式；仅当工具结果表明聊天批准不可用，或手动批准是唯一途径时，OpenClaw
    才应包含手动 `/approve` 命令。

    投递规则：

    - `target: "dm"` 只会将批准提示发送到已解析的批准者私信
    - `target: "channel"` 会将提示发回原始 Telegram 聊天或话题
    - `target: "both"` 会同时发送到批准者私信和原始聊天或话题

    只有已解析的批准者才能批准或拒绝。非批准者不能使用 `/approve`，也不能使用 Telegram 批准按钮。

    批准解析行为：

    - 带 `plugin:` 前缀的 ID 始终通过 plugin 批准解析。
    - 其他批准 ID 会先尝试 `exec.approval.resolve`。
    - 如果 Telegram 也被授权用于 plugin 批准，并且 Gateway 网关提示
      exec 批准未知或已过期，Telegram 会再通过
      `plugin.approval.resolve` 重试一次。
    - 真正的 exec 批准拒绝或错误不会静默回退到 plugin
      批准解析。

    渠道内投递会在聊天中显示命令文本，因此仅应在受信任的群组或话题中启用 `channel` 或 `both`。当提示投递到论坛话题时，OpenClaw 会为批准提示和批准后的后续消息都保留该话题。exec 批准默认在 30 分钟后过期。

    内联批准按钮还依赖 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。

    相关文档：[Exec approvals](/zh-CN/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，Telegram 可以选择回复错误文本，或抑制错误回复。两个配置键控制此行为：

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 会向聊天发送一条友好的错误消息。`silent` 会完全抑制错误回复。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 向同一聊天发送错误回复之间的最小时间间隔。可防止故障期间出现错误刷屏。        |

支持按账户、按群组和按话题覆盖（继承规则与其他 Telegram 配置键相同）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // 在此群组中抑制错误
        },
      },
    },
  },
}
```

## 故障排除

<AccordionGroup>
  <Accordion title="机器人不响应未提及的群组消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完全可见性。
      - BotFather：`/setprivacy` -> Disable
      - 然后将机器人从群组中移除并重新添加
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；无法对通配符 `"*"` 进行成员资格探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="机器人完全看不到群组消息">

    - 当存在 `channels.telegram.groups` 时，必须列出该群组（或包含 `"*"`）
    - 验证机器人是否已加入群组
    - 查看日志：`openclaw logs --follow` 以了解跳过原因

  </Accordion>

  <Accordion title="命令部分生效或完全无效">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - 带有 `BOT_COMMANDS_TOO_MUCH` 的 `setMyCommands failed` 表示原生命令菜单条目过多；请减少 plugin/skill/自定义命令，或禁用原生菜单
    - 带有网络或抓取错误的 `setMyCommands failed` 通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性有问题

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ + 自定义 fetch 或代理，在 AbortSignal 类型不匹配时可能触发立即中止行为。
    - 某些主机会优先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出站可能导致 Telegram API 间歇性失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将这些作为可恢复网络错误进行重试。
    - 如果日志包含 `Polling stall detected`，OpenClaw 默认会在 120 秒内没有完成的长轮询存活信号时重启轮询并重建 Telegram 传输。
    - 仅当长时间运行的 `getUpdates` 调用本身健康，但你的主机仍报告误判的轮询停滞重启时，才增加 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的代理、DNS、IPv6 或 TLS 出站问题。
    - 在直连出站或 TLS 不稳定的 VPS 主机上，可通过 `channels.telegram.proxy` 为 Telegram API 调用走代理：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）和 `dnsResultOrder=ipv4first`。
    - 如果你的主机是 WSL2，或明确在仅 IPv4 行为下表现更好，请强制指定地址族选择：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基准测试地址段响应（`198.18.0.0/15`）默认已允许
      用于 Telegram 媒体下载。如果受信任的假 IP 或
      透明代理在媒体下载期间将 `api.telegram.org` 重写到其他
      私有、内部或特殊用途地址，你可以选择启用
      仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同样的选择启用也可按账户设置在
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理将 Telegram 媒体主机解析为 `198.18.x.x`，请先保持
      dangerous 标志关闭。Telegram 媒体默认已经允许 RFC 2544
      基准测试地址段。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 防护。仅应在受信任、由操作员控制的代理
      环境中使用，例如 Clash、Mihomo 或 Surge 的假 IP 路由，
      当它们在 RFC 2544 基准测试地址段之外合成私有或特殊用途响应时才使用。
      对于普通公网 Telegram 访问，请保持关闭。
    </Warning>

    - 环境变量覆盖（临时）：
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - 验证 DNS 响应：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多帮助：[渠道故障排除](/zh-CN/channels/troubleshooting)。

## Telegram 配置参考指引

主要参考：

- `channels.telegram.enabled`：启用或禁用渠道启动。
- `channels.telegram.botToken`：机器人令牌（BotFather）。
- `channels.telegram.tokenFile`：从常规文件路径读取令牌。符号链接会被拒绝。
- `channels.telegram.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.telegram.allowFrom`：私信 allowlist（数字形式的 Telegram 用户 ID）。`allowlist` 要求至少有一个发送者 ID。`open` 要求包含 `"*"`。`openclaw doctor --fix` 可以将旧版 `@username` 条目解析为 ID，也可以在 allowlist 迁移流程中从配对存储文件恢复 allowlist 条目。
- `channels.telegram.actions.poll`：启用或禁用 Telegram 投票创建（默认：启用；仍然要求 `sendMessage`）。
- `channels.telegram.defaultTo`：当未提供显式 `--reply-to` 时，CLI `--deliver` 使用的默认 Telegram 目标。
- `channels.telegram.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.telegram.groupAllowFrom`：群组发送者 allowlist（数字形式的 Telegram 用户 ID）。`openclaw doctor --fix` 可以将旧版 `@username` 条目解析为 ID。非数字条目在认证时会被忽略。群组认证不会使用私信配对存储回退（`2026.2.25+`）。
- 多账户优先级：
  - 当配置了两个或更多账户 ID 时，设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以显式指定默认路由。
  - 如果两者都未设置，OpenClaw 会回退到第一个标准化后的账户 ID，并且 `openclaw doctor` 会发出警告。
  - `channels.telegram.accounts.default.allowFrom` 和 `channels.telegram.accounts.default.groupAllowFrom` 仅适用于 `default` 账户。
  - 当账户级值未设置时，命名账户会继承 `channels.telegram.allowFrom` 和 `channels.telegram.groupAllowFrom`。
  - 命名账户不会继承 `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`。
- `channels.telegram.groups`：按群组的默认值 + allowlist（使用 `"*"` 作为全局默认值）。
  - `channels.telegram.groups.<id>.groupPolicy`：按群组覆盖 `groupPolicy`（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.requireMention`：提及门控默认值。
  - `channels.telegram.groups.<id>.skills`：技能过滤器（省略 = 所有 Skills，空值 = 无）。
  - `channels.telegram.groups.<id>.allowFrom`：按群组覆盖发送者 allowlist。
  - `channels.telegram.groups.<id>.systemPrompt`：该群组的额外系统提示词。
  - `channels.telegram.groups.<id>.enabled`：当为 `false` 时禁用该群组。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`：按话题覆盖（群组字段 + 仅话题字段 `agentId`）。
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`：将此话题路由到特定智能体（覆盖群组级和绑定路由）。
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`：按话题覆盖 `groupPolicy`（`open | allowlist | disabled`）。
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`：按话题覆盖提及门控。
- 顶层 `bindings[]` 中带有 `type: "acp"` 且在 `match.peer.id` 中使用规范话题 ID `chatId:topic:topicId`：持久 ACP 话题绑定字段（参见 [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings)）。
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`：将私信话题路由到特定智能体（行为与论坛话题相同）。
- `channels.telegram.execApprovals.enabled`：为此账户启用 Telegram 作为基于聊天的原生 exec 批准客户端。
- `channels.telegram.execApprovals.approvers`：允许批准或拒绝 exec 请求的 Telegram 用户 ID。当 `channels.telegram.allowFrom` 或直接的 `channels.telegram.defaultTo` 已能标识所有者时，此项可选。
- `channels.telegram.execApprovals.target`：`dm | channel | both`（默认：`dm`）。`channel` 和 `both` 在存在时会保留原始 Telegram 话题。
- `channels.telegram.execApprovals.agentFilter`：转发批准提示的可选智能体 ID 过滤器。
- `channels.telegram.execApprovals.sessionFilter`：转发批准提示的可选会话键过滤器（子串或正则表达式）。
- `channels.telegram.accounts.<account>.execApprovals`：按账户覆盖 Telegram exec 批准路由和批准者授权。
- `channels.telegram.capabilities.inlineButtons`：`off | dm | group | all | allowlist`（默认：allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`：按账户覆盖。
- `channels.telegram.commands.nativeSkills`：启用或禁用 Telegram 原生 Skills 命令。
- `channels.telegram.replyToMode`：`off | first | all`（默认：`off`）。
- `channels.telegram.textChunkLimit`：出站分块大小（字符数）。
- `channels.telegram.chunkMode`：`length`（默认）或 `newline`，表示在按长度分块前先按空行（段落边界）拆分。
- `channels.telegram.linkPreview`：切换出站消息的链接预览（默认：true）。
- `channels.telegram.streaming`：`off | partial | block | progress`（实时流式预览；默认：`partial`；`progress` 映射为 `partial`；`block` 是旧版预览模式兼容值）。Telegram 预览流式传输使用单条预览消息并原地编辑。
- `channels.telegram.mediaMaxMb`：Telegram 入站/出站媒体上限（MB，默认：100）。
- `channels.telegram.retry`：Telegram 发送辅助函数（CLI/工具/动作）在可恢复出站 API 错误上的重试策略（尝试次数、`minDelayMs`、`maxDelayMs`、抖动）。
- `channels.telegram.network.autoSelectFamily`：覆盖 Node `autoSelectFamily`（true=启用，false=禁用）。在 Node 22+ 上默认启用，WSL2 默认禁用。
- `channels.telegram.network.dnsResultOrder`：覆盖 DNS 结果顺序（`ipv4first` 或 `verbatim`）。在 Node 22+ 上默认是 `ipv4first`。
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`：危险的显式启用项，用于受信任的假 IP 或透明代理环境，这些环境会让 Telegram 媒体下载将 `api.telegram.org` 解析到默认 RFC 2544 基准测试地址段白名单之外的私有、内部或特殊用途地址。
- `channels.telegram.proxy`：Bot API 调用的代理 URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`：启用 webhook 模式（要求设置 `channels.telegram.webhookSecret`）。
- `channels.telegram.webhookSecret`：webhook 密钥（设置 `webhookUrl` 时必需）。
- `channels.telegram.webhookPath`：本地 webhook 路径（默认 `/telegram-webhook`）。
- `channels.telegram.webhookHost`：本地 webhook 绑定主机（默认 `127.0.0.1`）。
- `channels.telegram.webhookPort`：本地 webhook 绑定端口（默认 `8787`）。
- `channels.telegram.actions.reactions`：控制 Telegram 工具表情反应。
- `channels.telegram.actions.sendMessage`：控制 Telegram 工具消息发送。
- `channels.telegram.actions.deleteMessage`：控制 Telegram 工具消息删除。
- `channels.telegram.actions.sticker`：控制 Telegram 贴纸动作——发送和搜索（默认：false）。
- `channels.telegram.reactionNotifications`：`off | own | all` —— 控制哪些表情反应会触发系统事件（未设置时默认：`own`）。
- `channels.telegram.reactionLevel`：`off | ack | minimal | extensive` —— 控制智能体的表情反应能力（未设置时默认：`minimal`）。
- `channels.telegram.errorPolicy`：`reply | silent` —— 控制错误回复行为（默认：`reply`）。支持按账户、按群组、按话题覆盖。
- `channels.telegram.errorCooldownMs`：向同一聊天发送错误回复之间的最小毫秒数（默认：`60000`）。可防止故障期间出现错误刷屏。

- [配置参考 - Telegram](/zh-CN/gateway/configuration-reference#telegram)

Telegram 专用高信号字段：

- 启动/认证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向常规文件；符号链接会被拒绝）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- exec 批准：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`
- 流式传输：`streaming`（预览）、`blockStreaming`
- 格式化/投递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 动作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 表情反应：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
