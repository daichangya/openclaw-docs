---
read_when:
    - 处理 WhatsApp/web 渠道行为或收件箱路由
summary: WhatsApp 渠道支持、访问控制、消息投递行为和运维
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T20:10:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a74c21cbc178c2e629f6d1273e37e9f8b503d9fedc51bada530c765a1fca0b11
    source_path: channels/whatsapp.md
    workflow: 15
---

状态：通过 WhatsApp Web（Baileys）达到生产就绪。Gateway 网关负责已关联的会话。

## 安装（按需）

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  会在你首次选择该渠道时，提示安装 WhatsApp 插件。
- 当插件尚未安装时，`openclaw channels login --channel whatsapp` 也会提供安装流程。
- 开发渠道 + git 检出：默认使用本地插件路径。
- 稳定版/Beta：默认使用 npm 包 `@openclaw/whatsapp`。

仍然可以手动安装：

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    未知发送者的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复操作手册。
  </Card>
  <Card title="Gateway 网关配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="配置 WhatsApp 访问策略">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="关联 WhatsApp（QR 码）">

```bash
openclaw channels login --channel whatsapp
```

    对于特定账号：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登录前附加现有/自定义的 WhatsApp Web 凭证目录：

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="启动 Gateway 网关">

```bash
openclaw gateway
```

  </Step>

  <Step title="批准第一个配对请求（如果使用配对模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求会在 1 小时后过期。每个渠道最多保留 3 个待处理请求。

  </Step>
</Steps>

<Note>
OpenClaw 建议尽可能为 WhatsApp 使用单独的号码。（渠道元数据和设置流程已针对这种设置进行优化，但也支持个人号码设置。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    这是最清晰的运维模式：

    - 为 OpenClaw 使用单独的 WhatsApp 身份
    - 更清晰的私信允许名单和路由边界
    - 更低的自聊混淆概率

    最小策略模式：

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="个人号码回退方案">
    新手引导支持个人号码模式，并会写入一个适合自聊的基线配置：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    在运行时，自聊保护会依据已关联的自身号码和 `allowFrom` 生效。

  </Accordion>

  <Accordion title="仅限 WhatsApp Web 的渠道范围">
    在当前的 OpenClaw 渠道架构中，消息平台渠道基于 WhatsApp Web（`Baileys`）。

    内置聊天渠道注册表中没有单独的 Twilio WhatsApp 消息渠道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 网关负责 WhatsApp socket 和重连循环。
- 出站发送要求目标账号存在活动中的 WhatsApp 监听器。
- 状态和广播聊天会被忽略（`@status`、`@broadcast`）。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 会将私信折叠到智能体主会话）。
- 群组会话彼此隔离（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web 传输遵循 Gateway 网关主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` 及其小写变体）。优先使用主机级代理配置，而不是渠道专用的 WhatsApp 代理设置。

## 插件钩子与隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、
群组标识符、发送者名称以及会话关联字段。因此，
除非你显式选择启用，否则 WhatsApp 不会将入站 `message_received` 钩子负载广播给插件：

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

你可以将此选择启用范围限定到某个账号：

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

仅在你信任插件可以接收入站 WhatsApp 消息内容和标识符时，才启用此功能。

## 访问控制与激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 风格的号码（内部会进行标准化）。

    多账号覆盖：对于该账号，`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）优先于渠道级默认值。

    运行时行为细节：

    - 配对会持久化到渠道允许存储中，并与配置的 `allowFrom` 合并
    - 如果未配置允许名单，则默认允许已关联的自身号码
    - OpenClaw 永远不会自动配对出站 `fromMe` 私信（即你从已关联设备发给自己的消息）

  </Tab>

  <Tab title="群组策略 + 允许名单">
    群组访问有两层：

    1. **群组成员允许名单**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，则所有群组都有资格
       - 如果存在 `groups`，它就充当群组允许名单（允许使用 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者允许名单
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站消息

    发送者允许名单回退：

    - 如果未设置 `groupAllowFrom`，运行时会在可用时回退到 `allowFrom`
    - 在提及/回复激活之前，会先评估发送者允许名单

    注意：如果完全不存在 `channels.whatsapp` 配置块，运行时的群组策略回退值是 `allowlist`（并记录一条警告日志），即使已设置 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    默认情况下，群组回复需要被提及。

    提及检测包括：

    - 对机器人身份的显式 WhatsApp 提及
    - 已配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复给机器人检测（回复发送者与机器人身份匹配）

    安全说明：

    - 引用/回复只会满足提及门控；它**不会**授予发送者授权
    - 在 `groupPolicy: "allowlist"` 下，即使非允许名单发送者回复了允许名单用户的消息，仍会被阻止

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 会更新会话状态（而不是全局配置）。它受所有者权限控制。

  </Tab>
</Tabs>

## 个人号码和自聊行为

当已关联的自身号码也存在于 `allowFrom` 中时，WhatsApp 自聊保护会启用：

- 跳过自聊轮次的已读回执
- 忽略原本会提醒你自己的 mention-JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认使用 `[{identity.name}]` 或 `[openclaw]`

## 消息标准化与上下文

<AccordionGroup>
  <Accordion title="入站封装 + 回复上下文">
    传入的 WhatsApp 消息会被包装到共享的入站封装中。

    如果存在引用回复，上下文会按以下形式附加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用时也会填充回复元数据字段（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。

  </Accordion>

  <Accordion title="媒体占位符以及位置/联系人提取">
    仅媒体的入站消息会使用如下占位符进行标准化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置消息正文使用简洁的坐标文本。位置标签/备注以及联系人/vCard 详细信息会渲染为带围栏的不受信任元数据，而不是内联提示文本。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，当机器人最终被触发时，未处理的消息可以被缓冲并作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 表示禁用

    注入标记：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已读回执">
    对于已接受的入站 WhatsApp 消息，默认启用已读回执。

    全局禁用：

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    按账号覆盖：

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    即使全局启用，自聊轮次也会跳过已读回执。

  </Accordion>
</AccordionGroup>

## 消息投递、分块和媒体

<AccordionGroup>
  <Accordion title="文本分块">
    - 默认分块限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式优先按段落边界（空行）拆分，然后回退到按长度安全分块
  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图片、视频、音频（PTT 语音便笺）和文档负载
    - 为了兼容语音便笺，`audio/ogg` 会被重写为 `audio/ogg; codecs=opus`
    - 通过在视频发送时设置 `gifPlayback: true`，支持动画 GIF 播放
    - 发送多媒体回复负载时，说明文字会应用到第一个媒体项
    - 媒体来源可以是 HTTP(S)、`file://` 或本地路径
  </Accordion>

  <Accordion title="媒体大小限制和回退行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 按账号覆盖使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 图片会自动优化（调整大小/质量扫描）以满足限制
    - 发送媒体失败时，首项回退会发送文本警告，而不是静默丢弃响应
  </Accordion>
</AccordionGroup>

## 回复引用

WhatsApp 支持原生回复引用，即出站回复会以可见方式引用入站消息。使用 `channels.whatsapp.replyToMode` 控制它。

| 值       | 行为                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | 当提供商支持时引用入站消息；否则跳过引用                                           |
| `"on"`   | 始终引用入站消息；如果引用被拒绝，则回退为普通发送                                 |
| `"off"`  | 从不引用；作为普通消息发送                                                         |

默认值是 `"auto"`。按账号覆盖使用 `channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## 反应级别

`channels.whatsapp.reactionLevel` 控制智能体在 WhatsApp 上使用 emoji 反应的范围：

| 级别          | 确认反应 | 智能体主动反应          | 说明                              |
| ------------- | -------- | ----------------------- | --------------------------------- |
| `"off"`       | 否       | 否                      | 完全不使用反应                    |
| `"ack"`       | 是       | 否                      | 仅使用确认反应（回复前接收确认）  |
| `"minimal"`   | 是       | 是（保守）              | 确认反应 + 智能体反应，策略较保守 |
| `"extensive"` | 是       | 是（鼓励）              | 确认反应 + 智能体反应，策略更积极 |

默认值：`"minimal"`。

按账号覆盖使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 确认反应

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在接收入站消息时立即发送确认反应。
确认反应受 `reactionLevel` 控制——当 `reactionLevel` 为 `"off"` 时会被抑制。

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

行为说明：

- 在入站消息被接受后立即发送（回复前）
- 失败会被记录到日志中，但不会阻止正常回复投递
- 群组模式 `mentions` 会在由提及触发的轮次中做出反应；群组激活模式 `always` 会绕过此检查
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此处不使用旧版 `messages.ackReaction`）

## 多账号与凭证

<AccordionGroup>
  <Accordion title="账号选择和默认值">
    - 账号 id 来自 `channels.whatsapp.accounts`
    - 默认账号选择：如果存在 `default` 则使用它，否则使用第一个已配置的账号 id（排序后）
    - 账号 id 会在内部标准化后用于查找
  </Accordion>

  <Accordion title="凭证路径和旧版兼容性">
    - 当前凭证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的旧版默认凭证仍然可以被识别/迁移，用于默认账号流程
  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 会清除该账号的 WhatsApp 凭证状态。

    在旧版凭证目录中，会保留 `oauth.json`，同时移除 Baileys 凭证文件。

  </Accordion>
</AccordionGroup>

## 工具、操作和配置写入

- 智能体工具支持包括 WhatsApp 反应操作（`react`）。
- 操作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 默认启用渠道发起的配置写入（可通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="未关联（需要 QR 码）">
    症状：渠道状态显示未关联。

    修复：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已关联但已断开 / 重连循环">
    症状：已关联账号反复断开连接或重复尝试重连。

    修复：

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    如有需要，使用 `channels login` 重新关联。

  </Accordion>

  <Accordion title="发送时没有活动监听器">
    当目标账号不存在活动中的 Gateway 网关监听器时，出站发送会快速失败。

    请确保 Gateway 网关正在运行且该账号已关联。

  </Accordion>

  <Accordion title="群组消息被意外忽略">
    按以下顺序检查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允许名单条目
    - 提及门控（`requireMention` + 提及模式）
    - `openclaw.json`（JSON5）中的重复键：后面的条目会覆盖前面的条目，因此每个作用域只保留一个 `groupPolicy`

  </Accordion>

  <Accordion title="Bun 运行时警告">
    WhatsApp Gateway 网关运行时应使用 Node。Bun 被标记为不兼容稳定的 WhatsApp/Telegram Gateway 网关运行。
  </Accordion>
</AccordionGroup>

## 系统提示词

WhatsApp 通过 `groups` 和 `direct` 映射支持类似 Telegram 的群组和直接聊天系统提示词。

群组消息的解析层级：

首先确定生效的 `groups` 映射：如果账号定义了自己的 `groups`，它会完全替换根级 `groups` 映射（不进行深度合并）。随后提示词查找会在这个最终得到的单一映射上进行：

1. **群组专用系统提示词**（`groups["<groupId>"].systemPrompt`）：当映射中存在该特定群组条目，**且**其定义了 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不应用任何系统提示词。
2. **群组通配符系统提示词**（`groups["*"].systemPrompt`）：当映射中完全不存在该特定群组条目，或虽然存在但没有定义 `systemPrompt` 键时使用。

直接消息的解析层级：

首先确定生效的 `direct` 映射：如果账号定义了自己的 `direct`，它会完全替换根级 `direct` 映射（不进行深度合并）。随后提示词查找会在这个最终得到的单一映射上进行：

1. **直接聊天专用系统提示词**（`direct["<peerId>"].systemPrompt`）：当映射中存在该特定对端条目，**且**其定义了 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则会抑制通配符，并且不应用任何系统提示词。
2. **直接聊天通配符系统提示词**（`direct["*"].systemPrompt`）：当映射中完全不存在该特定对端条目，或虽然存在但没有定义 `systemPrompt` 键时使用。

注意：`dms` 仍然是轻量级的逐私信历史覆盖桶（`dms.<id>.historyLimit`）；提示词覆盖位于 `direct` 下。

**与 Telegram 多账号行为的区别：** 在 Telegram 中，为了防止机器人接收到它不属于的群组消息，在多账号设置下，根级 `groups` 会被有意抑制——即使某些账号根本没有定义自己的 `groups` 也是如此。WhatsApp 不应用这个保护：无论配置了多少账号，对于没有定义账号级覆盖的账号，根级 `groups` 和根级 `direct` 都会始终被继承。在多账号 WhatsApp 设置中，如果你想要按账号定制群组或直接聊天提示词，请在每个账号下显式定义完整映射，而不要依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 既是逐群组配置映射，也是聊天级群组允许名单。在根级或账号作用域中，`groups["*"]` 都表示该作用域“允许所有群组”。
- 只有当你本来就希望该作用域允许所有群组时，才添加通配符群组 `systemPrompt`。如果你仍然只想让一组固定的群组 ID 有资格被允许，不要用 `groups["*"]` 作为提示词默认值。相反，应在每个显式列入允许名单的群组条目上重复该提示词。
- 群组准入和发送者授权是两个独立检查。`groups["*"]` 会扩大可以进入群组处理流程的群组集合，但它本身不会授权这些群组中的每个发送者。发送者访问仍然由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 单独控制。
- `channels.whatsapp.direct` 对私信没有相同的副作用。`direct["*"]` 只会在私信已经通过 `dmPolicy` 加上 `allowFrom` 或配对存储规则获准后，提供默认的直接聊天配置。

示例：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // 仅当根级作用域应允许所有群组时才使用。
        // 适用于所有未定义自己 groups 映射的账号。
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // 适用于所有未定义自己 direct 映射的账号。
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // 该账号定义了自己的 groups，因此根级 groups 会被完全
            // 替换。若要保留通配符，也需要在这里显式定义 "*"。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // 仅当此账号中应允许所有群组时才使用。
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // 该账号定义了自己的 direct 映射，因此根级 direct 条目会被
            // 完全替换。若要保留通配符，也需要在这里显式定义 "*"。
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## 配置参考指引

主要参考：

- [配置参考 - WhatsApp](/zh-CN/gateway/config-channels#whatsapp)

高价值的 WhatsApp 字段：

- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 消息投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多账号：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账号级覆盖
- 运维：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示词：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
