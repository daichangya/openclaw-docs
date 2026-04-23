---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置与配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-23T20:41:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 605fdb2e47630dbc2aa62d6e7c69e76997fab10e2d010a474e3500e2d9d54bd5
    source_path: channels/matrix.md
    workflow: 15
---

Matrix 是 OpenClaw 的一个内置渠道插件。
它使用官方 `matrix-js-sdk`，并支持私信、房间、线程、媒体、表情回应、投票、位置以及 E2EE。

## 内置插件

Matrix 会作为内置插件随当前的 OpenClaw 版本一起发布，因此普通打包构建不需要单独安装。

如果你使用的是较旧版本，或是不包含 Matrix 的自定义安装，请手动安装：

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

有关插件行为和安装规则，请参见 [Plugins](/zh-CN/tools/plugin)。

## 设置

1. 确保 Matrix 插件可用。
   - 当前打包发布的 OpenClaw 版本已内置该插件。
   - 较旧版本/自定义安装可以使用上述命令手动添加。
2. 在你的 homeserver 上创建一个 Matrix 账户。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人开始私信，或邀请它进入一个房间。
   - 只有当 `channels.matrix.autoJoin` 允许时，新创建的 Matrix 邀请才会生效。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导会询问：

- homeserver URL
- 认证方式：access token 或 password
- 用户 ID（仅 password 认证）
- 可选的设备名称
- 是否启用 E2EE
- 是否配置房间访问和邀请自动加入

向导的关键行为：

- 如果 Matrix 认证环境变量已存在，且该账户尚未在配置中保存认证信息，则向导会提供环境变量快捷方式，以将认证信息保留在环境变量中。
- 账户名称会规范化为账户 ID。例如，`Ops Bot` 会变为 `ops-bot`。
- 私信允许列表条目可直接接受 `@user:server`；显示名称只有在实时目录查找找到唯一精确匹配时才有效。
- 房间允许列表条目可直接接受房间 ID 和别名。优先使用 `!room:server` 或 `#alias:server`；未解析的名称会在运行时被允许列表解析忽略。
- 在邀请自动加入允许列表模式下，仅使用稳定的邀请目标：`!roomId:server`、`#alias:server` 或 `*`。普通房间名称会被拒绝。
- 如需在保存前解析房间名称，请使用 `openclaw channels resolve --channel matrix "Project Room"`。

<Warning>
`channels.matrix.autoJoin` 的默认值为 `off`。

如果你不设置它，机器人将不会加入被邀请的房间或新的私信式邀请，因此除非你先手动加入，否则它不会出现在新群组或受邀私信中。

如需限制它接受哪些邀请，请将 `autoJoin: "allowlist"` 与 `autoJoinAllowlist` 一起设置；如果你希望它加入每一个邀请，请设置 `autoJoin: "always"`。

在 `allowlist` 模式下，`autoJoinAllowlist` 仅接受 `!roomId:server`、`#alias:server` 或 `*`。
</Warning>

允许列表示例：

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

加入所有邀请：

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

最小化的基于 token 的设置：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

基于 password 的设置（登录后会缓存 token）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix 会将缓存的凭证存储在 `~/.openclaw/credentials/matrix/` 中。
默认账户使用 `credentials.json`；命名账户使用 `credentials-<account>.json`。
当该位置存在缓存凭证时，即使当前认证未直接在配置中设置，OpenClaw 仍会在设置、Doctor 和渠道状态发现中将 Matrix 视为已配置。

环境变量对应项（当未设置配置键时使用）：

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

对于非默认账户，使用带账户作用域的环境变量：

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

账户 `ops` 的示例：

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

对于规范化账户 ID `ops-bot`，使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 会对账户 ID 中的标点符号进行转义，以避免带作用域的环境变量发生冲突。
例如，`-` 会变成 `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

交互式向导仅在这些认证环境变量已存在，且所选账户尚未在配置中保存 Matrix 认证信息时，才会提供环境变量快捷方式。

`MATRIX_HOMESERVER` 不能从工作区 `.env` 中设置；请参见 [Workspace `.env` files](/zh-CN/gateway/security)。

## 配置示例

这是一个实用的基础配置，启用了私信配对、房间允许列表和 E2EE：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` 适用于所有 Matrix 邀请，包括私信式邀请。OpenClaw 无法在邀请时可靠地将被邀请的房间分类为私信或群组，因此所有邀请都会先经过 `autoJoin`。`dm.policy` 会在机器人加入后且房间被分类为私信时生效。

## 流式预览

Matrix 回复的流式传输为选择启用。

当你希望 OpenClaw 发送单条实时预览回复、在模型生成文本时原地编辑该预览，并在回复完成时将其定稿，请将 `channels.matrix.streaming` 设置为 `"partial"`：

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` 是默认值。OpenClaw 会等待最终回复并一次性发送。
- `streaming: "partial"` 会为当前助手内容块创建一条可编辑预览消息，使用普通 Matrix 文本消息。这会保留 Matrix 传统的“预览优先”通知行为，因此标准客户端可能会在第一次流式预览文本时发出通知，而不是在完成后的内容块时通知。
- `streaming: "quiet"` 会为当前助手内容块创建一条可编辑的静默预览通知。仅当你同时为最终定稿的预览编辑配置了收件人推送规则时，才应使用此选项。
- `blockStreaming: true` 启用独立的 Matrix 进度消息。启用预览流式传输后，Matrix 会保留当前内容块的实时草稿，并将已完成的内容块保留为独立消息。
- 当预览流式传输开启且 `blockStreaming` 关闭时，Matrix 会原地编辑实时草稿，并在该内容块或该轮结束时将同一事件定稿。
- 如果预览内容无法再容纳在单个 Matrix 事件中，OpenClaw 会停止预览流式传输并回退到普通最终发送。
- 媒体回复仍会正常发送附件。如果过期的预览无法再安全复用，OpenClaw 会在发送最终媒体回复前将其清除。
- 预览编辑会产生额外的 Matrix API 调用。如果你希望采用最保守的速率限制行为，请关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
如需预览编辑，请使用 `streaming: "partial"` 或 `streaming: "quiet"`；只有当你还希望已完成的助手内容块作为独立进度消息保留可见时，才再添加 `blockStreaming: true`。

如果你需要标准 Matrix 通知而不配置自定义推送规则，请使用 `streaming: "partial"` 以获得“预览优先”行为，或保持 `streaming` 关闭以仅在最终内容发送时通知。在 `streaming: "off"` 时：

- `blockStreaming: true` 会将每个已完成内容块作为普通可通知的 Matrix 消息发送。
- `blockStreaming: false` 仅发送最终完成的回复，作为普通可通知的 Matrix 消息。

### 用于静默定稿预览的自托管推送规则

静默流式传输（`streaming: "quiet"`）仅会在内容块或整轮定稿时通知收件人 —— 需要一个按用户配置的推送规则来匹配定稿预览标记。完整设置（收件人 token、pusher 检查、规则安装、各 homeserver 注意事项）请参见 [Matrix push rules for quiet previews](/zh-CN/channels/matrix-push-rules)。

## 机器人到机器人的房间

默认情况下，来自其他已配置 OpenClaw Matrix 账户的 Matrix 消息会被忽略。

当你有意启用智能体之间的 Matrix 通信时，请使用 `allowBots`：

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` 接受来自其他已配置 Matrix 机器人账户、且位于允许房间和私信中的消息。
- `allowBots: "mentions"` 仅在这些消息在房间中显式提到此机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖单个房间的账户级设置。
- OpenClaw 仍会忽略来自同一个 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不提供原生机器人标记；OpenClaw 将“由机器人发送”视为“由此 OpenClaw Gateway 网关上的另一个已配置 Matrix 账户发送”。

在共享房间中启用机器人到机器人通信时，请使用严格的房间允许列表和提及要求。

## 加密与验证

在加密的（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需任何配置 —— 插件会自动检测 E2EE 状态。

启用加密：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

验证命令（全部支持 `--verbose` 用于诊断，以及 `--json` 用于机器可读输出）：

| 命令 | 用途 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status` | 检查交叉签名和设备验证状态 |
| `openclaw matrix verify status --include-recovery-key --json` | 包含已存储的恢复密钥 |
| `openclaw matrix verify bootstrap` | 引导交叉签名和验证（见下文） |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | 丢弃当前交叉签名身份并创建新的身份 |
| `openclaw matrix verify device "<recovery-key>"` | 使用恢复密钥验证此设备 |
| `openclaw matrix verify backup status` | 检查房间密钥备份健康状态 |
| `openclaw matrix verify backup restore` | 从服务器备份恢复房间密钥 |
| `openclaw matrix verify backup reset --yes` | 删除当前备份并创建新的基线（可能会重新创建秘密存储） |

在多账户设置中，除非你传入 `--account <id>`，否则 Matrix CLI 命令会使用隐式的 Matrix 默认账户。
如果你配置了多个命名账户，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作会停止并要求你显式选择账户。
当你希望验证或设备操作明确指向某个命名账户时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当某个命名账户的加密被禁用或不可用时，Matrix 警告和验证错误会指向该账户的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="已验证的含义">
    只有当你自己的交叉签名身份对设备进行了签名时，OpenClaw 才会将该设备视为已验证。`verify status --verbose` 会显示三种信任信号：

    - `Locally trusted`：仅此客户端本地信任
    - `Cross-signing verified`：SDK 通过交叉签名报告为已验证
    - `Signed by owner`：由你自己的 self-signing 密钥签名

    只有当存在交叉签名或所有者签名时，`Verified by owner` 才会变为 `yes`。仅有本地信任还不够。

  </Accordion>

  <Accordion title="bootstrap 的作用">
    `verify bootstrap` 是加密账户的修复与设置命令。按顺序，它会：

    - 引导秘密存储，并在可能时复用现有恢复密钥
    - 引导交叉签名并上传缺失的公开交叉签名密钥
    - 标记并交叉签名当前设备
    - 如果服务器端房间密钥备份尚不存在，则创建一个

    如果 homeserver 要求使用 UIA 上传交叉签名密钥，OpenClaw 会先尝试无认证，再尝试 `m.login.dummy`，最后尝试 `m.login.password`（需要 `channels.matrix.password`）。只有在你明确想丢弃当前身份时，才使用 `--force-reset-cross-signing`。

  </Accordion>

  <Accordion title="新的备份基线">
    如果你希望保持未来的加密消息可用，并接受丢失无法恢复的旧历史记录：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    添加 `--account <id>` 可指向某个命名账户。如果当前备份密钥无法安全加载，这也可能重新创建秘密存储。

  </Accordion>

  <Accordion title="启动行为">
    当 `encryption: true` 时，`startupVerification` 默认值为 `"if-unverified"`。启动时，未验证设备会在另一个 Matrix 客户端中请求自我验证，同时跳过重复请求并应用冷却时间。可通过 `startupVerificationCooldownHours` 调整，或通过 `startupVerification: "off"` 禁用。

    启动时还会执行一次保守的加密 bootstrap 流程，复用当前的秘密存储和交叉签名身份。如果 bootstrap 状态损坏，即使没有 `channels.matrix.password`，OpenClaw 也会尝试受保护的修复；如果 homeserver 需要 password UIA，启动时会记录警告，但不会导致致命错误。已由所有者签名的设备会被保留。

    完整升级流程请参见 [Matrix migration](/zh-CN/install/migrating-matrix)。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 会将验证生命周期通知以 `m.notice` 消息形式发送到严格私信验证房间中：请求、就绪（带有“通过 emoji 验证”的提示）、开始/完成，以及可用时的 SAS（emoji/十进制）详情。

    来自其他 Matrix 客户端的传入请求会被跟踪并自动接受。对于自我验证，OpenClaw 会在 emoji 验证可用时自动启动 SAS 流程并确认自身这一侧 —— 你仍需要在 Matrix 客户端中比较并确认“它们匹配”。

    验证系统通知不会转发到智能体聊天流水线。

  </Accordion>

  <Accordion title="设备清理">
    由 OpenClaw 管理的旧设备可能会逐渐积累。可列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密存储">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路径，并使用 `fake-indexeddb` 作为 IndexedDB 垫片。加密状态会持久化到 `crypto-idb-snapshot.json`（限制性文件权限）。

    加密运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，其中包括同步存储、加密存储、恢复密钥、IDB 快照、线程绑定和启动验证状态。当 token 发生变化但账户身份保持不变时，OpenClaw 会复用最佳现有根目录，以便先前状态仍然可见。

  </Accordion>
</AccordionGroup>

## 配置文件管理

使用以下命令更新所选账户的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

当你希望显式指向某个命名 Matrix 账户时，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后将解析后的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账户的覆盖配置）中。

## 线程

Matrix 同时支持用于自动回复和消息工具发送的原生 Matrix 线程。

- `dm.sessionScope: "per-user"`（默认）会保持 Matrix 私信路由按发送者范围处理，因此多个私信房间在解析到同一对端时可以共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离到各自的会话键中，同时仍使用普通私信认证和允许列表检查。
- 显式 Matrix 会话绑定的优先级仍高于 `dm.sessionScope`，因此已绑定的房间和线程会保持其选定的目标会话。
- `threadReplies: "off"` 会让回复保持在顶层，并让传入的线程消息继续使用父会话。
- `threadReplies: "inbound"` 仅当传入消息本来就在该线程中时，才在线程内回复。
- `threadReplies: "always"` 会让房间回复保留在线程中，以触发消息为根，并从第一条触发消息开始，通过匹配的线程范围会话路由该会话。
- `dm.threadReplies` 仅针对私信覆盖顶层设置。例如，你可以保持房间线程隔离，同时让私信保持扁平。
- 传入的线程消息会将线程根消息作为额外的智能体上下文。
- 当目标是同一房间或同一私信用户目标时，消息工具发送会自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 仅当当前会话元数据能够证明是同一 Matrix 账户上的同一私信对端时，才会启用同会话私信用户目标复用；否则 OpenClaw 会回退到普通的用户范围路由。
- 当 OpenClaw 发现某个 Matrix 私信房间与另一个私信房间在同一个共享 Matrix 私信会话上发生冲突时，如果启用了线程绑定并且提供了 `dm.sessionScope` 提示，它会在该房间中发送一次性的 `m.notice`，其中包含 `/focus` 逃生入口。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 以及线程绑定的 `/acp spawn` 都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions=true` 时，顶层 Matrix 房间/私信中的 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程内运行 `/focus` 或 `/acp spawn --thread here` 时，则会改为绑定当前线程。

## ACP 会话绑定

Matrix 房间、私信和现有 Matrix 线程都可以在不改变聊天界面的情况下转换为持久的 ACP 工作区。

快速操作流程：

- 在你希望继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会保持为聊天界面，后续消息会路由到生成的 ACP 会话。
- 在现有 Matrix 线程中，`--bind here` 会就地绑定当前线程。
- `/new` 和 `/reset` 会就地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- `threadBindings.spawnAcpSessions` 仅在 `/acp spawn --thread auto|here` 时需要，因为此时 OpenClaw 需要创建或绑定一个子 Matrix 线程。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，同时也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 的线程绑定生成标志为按需启用：

- 设置 `threadBindings.spawnSubagentSessions: true` 以允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true` 以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 表情回应

Matrix 支持出站表情回应操作、入站表情回应通知以及入站确认表情回应。

- 出站表情回应工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 会向特定 Matrix 事件添加一个表情回应。
- `reactions` 会列出特定 Matrix 事件当前的表情回应摘要。
- `emoji=""` 会移除机器人账户在该事件上的自身表情回应。
- `remove: true` 仅移除机器人账户的指定 emoji 表情回应。

确认表情回应使用标准 OpenClaw 解析顺序：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退

确认表情回应范围按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

表情回应通知模式按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认值：`own`

行为：

- `reactionNotifications: "own"` 会在目标为机器人创建的 Matrix 消息时，转发表情回应新增的 `m.reaction` 事件。
- `reactionNotifications: "off"` 会禁用表情回应系统事件。
- 表情回应移除不会合成为系统事件，因为 Matrix 将其显示为 redaction，而不是独立的 `m.reaction` 移除事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含多少条最近的房间消息。它会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则实际默认值为 `0`。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间本身。私信仍使用普通会话历史。
- Matrix 房间历史仅包含待处理内容：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发到来时对该窗口进行快照。
- 当前触发消息不会包含在 `InboundHistory` 中；在该轮中它会保留在主入站正文中。
- 对同一 Matrix 事件的重试会复用原始历史快照，而不会漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如提取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收时原样保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅保留通过当前房间/用户允许列表检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为与 `allowlist` 类似，但仍会保留一条显式引用的回复。

此设置影响的是补充上下文的可见性，而不是入站消息本身是否可以触发回复。
触发授权仍来自 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置。

## 私信和房间策略

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

有关提及门控和允许列表行为，请参见 [Groups](/zh-CN/channels/groups)。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个未获批准的 Matrix 用户在批准前持续给你发消息，OpenClaw 会复用同一个待处理配对码，并可能在短暂冷却后再次发送提醒回复，而不是生成新的配对码。

有关共享的私信配对流程和存储布局，请参见 [Pairing](/zh-CN/channels/pairing)。

## 直接房间修复

如果直接消息状态不同步，OpenClaw 可能会出现陈旧的 `m.direct` 映射，指向旧的单人房间而不是当前有效的私信。可使用以下命令检查某个对端当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复流程：

- 优先选择已在 `m.direct` 中映射的严格 1:1 私信
- 如果没有，则回退到当前已加入且与该用户对应的任意严格 1:1 私信
- 如果不存在健康的私信，则创建一个新的直接房间并重写 `m.direct`

修复流程不会自动删除旧房间。它只会选择健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他直接消息流程再次指向正确的房间。

## Exec 审批

Matrix 可以充当某个 Matrix 账户的原生审批客户端。原生私信/渠道路由控制项仍位于 exec 审批配置下：

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批人必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，且至少能解析出一个审批人时，Matrix 会自动启用原生审批。Exec 审批会优先使用 `execApprovals.approvers`，并可回退到 `channels.matrix.dm.allowFrom`。插件审批通过 `channels.matrix.dm.allowFrom` 授权。将 `enabled: false` 设置为显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路由或审批回退策略。

Matrix 原生路由同时支持两种审批类型：

- `channels.matrix.execApprovals.*` 控制 Matrix 审批提示的原生私信/渠道扇出模式。
- Exec 审批使用来自 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 的 exec 审批人集合。
- 插件审批使用来自 `channels.matrix.dm.allowFrom` 的 Matrix 私信允许列表。
- Matrix 表情快捷审批和消息更新同时适用于 exec 审批和插件审批。

投递规则：

- `target: "dm"` 将审批提示发送到审批人的私信
- `target: "channel"` 将提示发回原始 Matrix 房间或私信
- `target: "both"` 同时发送到审批人私信和原始 Matrix 房间或私信

Matrix 审批提示会在主审批消息上添加表情快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 始终允许（仅当该决策被实际 exec 策略允许时）

审批人可以对该消息添加表情，也可以使用回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批人才能执行批准或拒绝。对于 exec 审批，渠道投递会包含命令文本，因此仅在受信任房间中启用 `channel` 或 `both`。

按账户覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec approvals](/zh-CN/tools/exec-approvals)

## 斜杠命令

Matrix 斜杠命令（例如 `/new`、`/reset`、`/model`）可直接在私信中使用。在房间中，OpenClaw 也能识别带有机器人自身 Matrix 提及前缀的斜杠命令，因此 `@bot:server /new` 会触发命令路径，而无需自定义提及正则。这让机器人能对房间风格的 `@mention /command` 帖子作出响应，这类帖子通常由 Element 及类似客户端在用户使用 Tab 补全机器人后输入命令时发出。

授权规则仍然适用：命令发送者必须像普通消息一样满足私信或房间允许列表/所有者策略。

## 多账户

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

顶层 `channels.matrix` 值会作为命名账户的默认值，除非某个账户进行了覆盖。
你可以使用 `groups.<room>.account` 将继承的房间条目限定到某个 Matrix 账户。
未设置 `account` 的条目会在所有 Matrix 账户之间共享，而设置 `account: "default"` 的条目在默认账户直接配置于顶层 `channels.matrix.*` 时仍然有效。
部分共享认证默认值本身不会单独创建一个隐式默认账户。只有当该默认值具有新的认证信息（`homeserver` 加 `accessToken`，或 `homeserver` 加 `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账户；命名账户仍然可以通过 `homeserver` 加 `userId` 保持可发现，并在稍后由缓存凭证满足认证。
如果 Matrix 已经恰好有一个命名账户，或者 `defaultAccount` 指向现有的命名账户键，则从单账户到多账户的修复/设置提升会保留该账户，而不是创建新的 `accounts.default` 条目。只有 Matrix 认证/bootstrap 键会移动到被提升的账户中；共享投递策略键仍保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账户时，请设置 `defaultAccount`。
如果配置了多个 Matrix 账户，且其中一个账户 id 为 `default`，即使 `defaultAccount` 未设置，OpenClaw 也会隐式使用该账户。
如果你配置了多个命名账户，请设置 `defaultAccount`，或在依赖隐式账户选择的 CLI 命令中传递 `--account <id>`。
当你希望仅对某条命令覆盖该隐式选择时，请向 `openclaw matrix verify ...` 和 `openclaw matrix devices ...` 传递 `--account <id>`。

共享多账户模式请参见 [Configuration reference](/zh-CN/gateway/configuration-reference#multi-account-all-channels)。

## 私有/LAN homeserver

默认情况下，出于 SSRF 防护，OpenClaw 会阻止私有/内部 Matrix homeserver，除非你为每个账户显式选择启用。

如果你的 homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该 Matrix 账户启用
`network.dangerouslyAllowPrivateNetwork`：

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI 设置示例：

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

此选择启用仅允许受信任的私有/内部目标。诸如
`http://matrix.example.org:8008` 这样的公共明文 homeserver 仍会被阻止。请尽可能优先使用 `https://`。

## 代理 Matrix 流量

如果你的 Matrix 部署需要显式的出站 HTTP(S) 代理，请设置 `channels.matrix.proxy`：

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

命名账户可通过 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会对运行时 Matrix 流量和账户状态探测使用相同的代理设置。

## 目标解析

在 OpenClaw 要求你提供房间或用户目标的任何地方，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找使用已登录的 Matrix 账户：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退到搜索该账户已加入的房间名称。
- 已加入房间名称查找是尽力而为的。如果某个房间名称无法解析为 ID 或别名，则在运行时允许列表解析中会被忽略。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账户的可选标签。
- `defaultAccount`：配置多个 Matrix 账户时的首选账户 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此 Matrix 账户连接到私有/内部 homeserver。当 homeserver 解析到 `localhost`、LAN/Tailscale IP 或 `matrix-synapse` 之类的内部主机时，请启用此项。
- `proxy`：用于 Matrix 流量的可选 HTTP(S) 代理 URL。命名账户可以使用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：用于基于 token 认证的访问令牌。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 支持通过 env/file/exec 提供商使用明文值和 SecretRef 值。请参见 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：用于基于 password 登录的密码。支持明文值和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：用于 password 登录的设备显示名称。
- `avatarUrl`：用于配置文件同步和 `profile set` 更新的已存储自身头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。
- `encryption`：启用 E2EE。
- `allowlistOnly`：当为 `true` 时，会将 `open` 房间策略升级为 `allowlist`，并将除 `disabled` 之外的所有活动私信策略（包括 `pairing` 和 `open`）强制设为 `allowlist`。不会影响 `disabled` 策略。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账户的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：用于房间流量的用户 ID 允许列表。完整 Matrix 用户 ID 最安全；精确目录匹配会在启动时以及监视器运行期间允许列表发生变化时解析。未解析的名称会被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则实际默认值为 `0`。设置为 `0` 可禁用。
- `replyToMode`：`off`、`first`、`all` 或 `batched`。
- `markdown`：用于出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`"partial"`、`"quiet"`、`true` 或 `false`。`"partial"` 和 `true` 会使用普通 Matrix 文本消息启用“预览优先”的草稿更新。`"quiet"` 会为自托管推送规则设置使用静默预览通知。`false` 等同于 `"off"`。
- `blockStreaming`：当草稿预览流式传输处于活动状态时，`true` 会为已完成的助手内容块启用独立进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：用于线程绑定会话路由和生命周期的按渠道覆盖。
- `startupVerification`：启动时自动自我验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：重试自动启动验证请求前的冷却时间。
- `textChunkLimit`：按字符计的出站消息分块大小（当 `chunkMode` 为 `length` 时适用）。
- `chunkMode`：`length` 按字符数拆分消息；`newline` 按行边界拆分。
- `responsePrefix`：为该渠道所有出站回复添加的可选前缀字符串。
- `ackReaction`：该渠道/账户的可选确认表情覆盖。
- `ackReactionScope`：可选确认表情范围覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站表情通知模式（`own`、`off`）。
- `mediaMaxMb`：用于出站发送和入站媒体处理的媒体大小上限，单位为 MB。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认值：`off`。适用于所有 Matrix 邀请，包括私信式邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不信任受邀房间声称的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：控制 OpenClaw 加入房间并将其分类为私信后的私信访问。它不会改变邀请是否会被自动加入。
- `dm.allowFrom`：用于私信流量的用户 ID 允许列表。完整 Matrix 用户 ID 最安全；精确目录匹配会在启动时以及监视器运行期间允许列表发生变化时解析。未解析的名称会被忽略。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。如果你希望每个 Matrix 私信房间即使对端相同也保持独立上下文，请使用 `per-room`。
- `dm.threadReplies`：仅私信使用的线程策略覆盖（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，同时影响私信中的回复位置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许批准 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已经标识审批人时，此项可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：命名的按账户覆盖。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间策略映射。优先使用房间 ID 或别名；未解析的房间名称会在运行时被忽略。解析后，会话/群组身份使用稳定的房间 ID。
- `groups.<room>.account`：在多账户设置中，将一个继承的房间条目限制到特定 Matrix 账户。
- `groups.<room>.allowBots`：针对已配置机器人发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：按房间划分的发送者允许列表。
- `groups.<room>.tools`：按房间划分的工具允许/拒绝覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会强制重新开启。
- `groups.<room>.skills`：可选的房间级 Skills 过滤器。
- `groups.<room>.systemPrompt`：可选的房间级系统提示词片段。
- `rooms`：`groups` 的旧别名。
- `actions`：按操作划分的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与加固措施
