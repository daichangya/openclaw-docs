---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置与配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-07T03:26:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d53baa2ea5916cd00a99cae0ded3be41ffa13c9a69e8ea8461eb7baa6a99e13c
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix 是 OpenClaw 的 Matrix 内置渠道插件。
它使用官方的 `matrix-js-sdk`，并支持私信、房间、线程、媒体、回应、投票、位置和 E2EE。

## 内置插件

Matrix 作为内置插件随当前的 OpenClaw 版本一同发布，因此常规的打包构建不需要单独安装。

如果你使用的是较旧版本，或是不包含 Matrix 的自定义安装，请手动安装：

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

有关插件行为和安装规则，请参阅 [Plugins](/zh-CN/tools/plugin)。

## 设置

1. 确保 Matrix 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧版本或自定义安装可以通过上述命令手动添加。
2. 在你的 homeserver 上创建一个 Matrix 账户。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人发起私信，或邀请它加入房间。
   - 只有当 `channels.matrix.autoJoin` 允许时，新创建的 Matrix 邀请才会生效。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导实际会询问的内容：

- homeserver URL
- 认证方式：access token 或 password
- 仅当你选择 password 认证时，才会询问用户 ID
- 可选设备名称
- 是否启用 E2EE
- 是否立即配置 Matrix 房间访问
- 是否立即配置 Matrix 邀请自动加入
- 当启用邀请自动加入时，是否应设置为 `allowlist`、`always` 或 `off`

需要注意的向导行为：

- 如果所选账户的 Matrix 认证环境变量已经存在，且该账户尚未在配置中保存认证信息，向导会提供环境变量快捷方式，以便将认证信息保留在环境变量中，而不是把密钥复制到配置里。
- 当你以交互方式添加另一个 Matrix 账户时，输入的账户名称会被规范化为配置和环境变量中使用的账户 ID。例如，`Ops Bot` 会变成 `ops-bot`。
- 私信 allowlist 提示会立即接受完整的 `@user:server` 值。显示名称仅在实时目录查找找到唯一精确匹配时才有效；否则向导会要求你使用完整 Matrix ID 重试。
- 房间 allowlist 提示会直接接受房间 ID 和别名。它们也可以实时解析已加入房间的名称，但无法解析的名称只会按输入内容保留在设置过程中，运行时 allowlist 解析时会忽略。优先使用 `!room:server` 或 `#alias:server`。
- 由于 `channels.matrix.autoJoin` 默认值为 `off`，向导现在会在邀请自动加入步骤前显示明确警告；除非你进行设置，否则智能体不会加入受邀房间或新的类私信邀请。
- 在邀请自动加入的 allowlist 模式下，只能使用稳定的邀请目标：`!roomId:server`、`#alias:server` 或 `*`。纯房间名称会被拒绝。
- 运行时房间/会话标识使用稳定的 Matrix 房间 ID。房间声明的别名仅用作查找输入，不会作为长期会话键或稳定群组标识。
- 若要在保存前解析房间名称，请使用 `openclaw channels resolve --channel matrix "Project Room"`。

<Warning>
`channels.matrix.autoJoin` 默认值为 `off`。

如果你保持未设置，机器人将不会加入受邀房间或新的类私信邀请，因此除非你先手动加入，否则它不会出现在新群组或受邀私信中。

将 `autoJoin: "allowlist"` 与 `autoJoinAllowlist` 一起设置，可以限制它接受哪些邀请；如果你希望它加入所有邀请，则设置 `autoJoin: "always"`。

在 `allowlist` 模式下，`autoJoinAllowlist` 仅接受 `!roomId:server`、`#alias:server` 或 `*`。
</Warning>

Allowlist 示例：

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

加入每一个邀请：

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

最小化基于令牌的设置：

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

基于密码的设置（登录后会缓存令牌）：

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
如果该位置存在缓存凭证，即使当前认证未直接在配置中设置，OpenClaw 仍会在设置、Doctor 和渠道状态发现中将 Matrix 视为已配置。

对应的环境变量（当未设置配置键时使用）：

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

对于非默认账户，请使用带账户作用域的环境变量：

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

账户 `ops` 的示例：

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

对于规范化后的账户 ID `ops-bot`，请使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 会对账户 ID 中的标点进行转义，以避免带作用域环境变量发生冲突。
例如，`-` 会变成 `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已经存在，且所选账户尚未在配置中保存 Matrix 认证时，交互式向导才会提供环境变量快捷方式。

## 配置示例

这是一个实用的基线配置，启用了私信配对、房间 allowlist 和 E2EE：

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

`autoJoin` 适用于 Matrix 邀请的整体情况，而不仅仅是房间/群组邀请。
这也包括新的类私信邀请。在邀请发生时，OpenClaw 无法可靠地知道受邀房间最终会被视为私信还是群组，因此所有邀请都会先经过相同的 `autoJoin` 决策。`dm.policy` 仍会在机器人加入后、且房间被分类为私信后生效，因此 `autoJoin` 控制加入行为，而 `dm.policy` 控制回复/访问行为。

## 流式预览

Matrix 回复流式传输为主动选择启用。

当你希望 OpenClaw 发送一条实时预览回复、在模型生成文本期间原位编辑该预览，并在回复完成后最终定稿时，请将 `channels.matrix.streaming` 设置为 `"partial"`：

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` 是默认值。OpenClaw 会等待最终回复并只发送一次。
- `streaming: "partial"` 会为当前智能体块创建一条可编辑的预览消息，并使用普通 Matrix 文本消息。这会保留 Matrix 旧式的“先预览后完成”通知行为，因此标准客户端可能会针对第一段流式预览文本发出通知，而不是针对最终完成的内容块。
- `streaming: "quiet"` 会为当前智能体块创建一条可编辑的静默预览通知。仅当你也为最终定稿的预览编辑配置了收件人推送规则时才使用此选项。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。启用预览流式传输后，Matrix 会为当前块保留实时草稿，并将已完成的块保留为单独消息。
- 当启用预览流式传输且 `blockStreaming` 为关闭状态时，Matrix 会原位编辑实时草稿，并在块或回合结束时定稿该同一事件。
- 如果预览内容不再适合放入单个 Matrix 事件，OpenClaw 会停止预览流式传输，并回退到普通最终投递。
- 媒体回复仍会照常发送附件。如果陈旧预览无法再被安全复用，OpenClaw 会在发送最终媒体回复前将其删除。
- 预览编辑会产生额外的 Matrix API 调用。如果你希望采用最保守的速率限制行为，请保持关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
使用 `streaming: "partial"` 或 `streaming: "quiet"` 启用预览编辑；然后仅在你还希望已完成的智能体块作为单独进度消息保留可见时，再添加 `blockStreaming: true`。

如果你需要标准 Matrix 通知且不使用自定义推送规则，请使用 `streaming: "partial"` 获得“先预览”行为，或保持 `streaming` 为关闭状态以仅进行最终投递。使用 `streaming: "off"` 时：

- `blockStreaming: true` 会将每个已完成块作为普通可通知的 Matrix 消息发送。
- `blockStreaming: false` 只会将最终完成的回复作为普通可通知的 Matrix 消息发送。

### 自托管环境中用于静默最终预览的推送规则

如果你运行自己的 Matrix 基础设施，并希望静默预览仅在一个块或最终回复完成时才发送通知，请设置 `streaming: "quiet"`，并为最终定稿的预览编辑添加按用户区分的推送规则。

这通常是收件用户侧的设置，而不是 homeserver 全局配置变更：

开始前的快速说明：

- recipient user = 应收到通知的人
- bot user = 发送回复的 OpenClaw Matrix 账户
- 下方 API 调用请使用收件用户的 access token
- 在推送规则中，将 `sender` 与 bot user 的完整 MXID 匹配

1. 配置 OpenClaw 使用静默预览：

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. 确保收件账户已经能收到普通的 Matrix 推送通知。静默预览规则只有在该用户已经拥有正常工作的 pusher/设备时才会生效。

3. 获取收件用户的 access token。
   - 使用接收用户的令牌，而不是机器人的令牌。
   - 复用现有客户端会话令牌通常是最简单的方式。
   - 如果你需要签发新的令牌，可以通过标准 Matrix Client-Server API 登录：

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. 验证收件账户已经拥有 pusher：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果这里没有返回活动的 pusher/设备，请先修复普通 Matrix 通知，然后再添加下方的 OpenClaw 规则。

OpenClaw 会为最终定稿的纯文本预览编辑添加以下标记：

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. 为每个应接收这些通知的收件账户创建一条 override 推送规则：

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

运行命令前请替换以下值：

- `https://matrix.example.org`：你的 homeserver 基础 URL
- `$USER_ACCESS_TOKEN`：接收用户的 access token
- `openclaw-finalized-preview-botname`：对此接收用户而言，此机器人的唯一规则 ID
- `@bot:example.org`：你的 OpenClaw Matrix 机器人 MXID，而不是接收用户的 MXID

多机器人设置的重要说明：

- 推送规则以 `ruleId` 为键。对同一个规则 ID 再次执行 `PUT` 会更新该规则。
- 如果同一个接收用户需要对多个 OpenClaw Matrix 机器人账户发出通知，请为每个机器人创建一条规则，并为每个 sender 匹配使用唯一规则 ID。
- 一个简单的命名模式是 `openclaw-finalized-preview-<botname>`，例如 `openclaw-finalized-preview-ops` 或 `openclaw-finalized-preview-support`。

该规则会针对事件发送者进行评估：

- 使用接收用户的令牌进行认证
- 让 `sender` 与 OpenClaw 机器人 MXID 匹配

6. 验证规则是否存在：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. 测试一条流式回复。在静默模式下，房间应显示一条静默草稿预览，并且最终的原位编辑应在块或回合结束时通知一次。

如果你之后需要删除该规则，请使用接收用户的令牌删除同一个规则 ID：

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

说明：

- 请使用接收用户的 access token 创建规则，而不是机器人的。
- 新建的用户自定义 `override` 规则会插入到默认抑制规则之前，因此不需要额外的排序参数。
- 这只影响 OpenClaw 能够安全原位定稿的纯文本预览编辑。媒体回退和陈旧预览回退仍使用普通 Matrix 投递。
- 如果 `GET /_matrix/client/v3/pushers` 显示没有 pusher，说明该用户的这个账户/设备尚未启用正常工作的 Matrix 推送投递。

#### Synapse

对于 Synapse，上述设置通常本身就足够了：

- 对于最终定稿的 OpenClaw 预览通知，不需要特殊的 `homeserver.yaml` 更改。
- 如果你的 Synapse 部署已经能发送普通 Matrix 推送通知，那么用户令牌加上上方的 `pushrules` 调用就是主要设置步骤。
- 如果你的 Synapse 运行在反向代理或 workers 后方，请确保 `/_matrix/client/.../pushrules/` 能正确到达 Synapse。
- 如果你运行 Synapse workers，请确保 pusher 状态正常。推送投递由主进程或 `synapse.app.pusher` / 已配置的 pusher workers 处理。

#### Tuwunel

对于 Tuwunel，请使用上方显示的相同设置流程和 push-rule API 调用：

- 最终预览标记本身不需要 Tuwunel 特定配置。
- 如果该用户的普通 Matrix 通知已经正常工作，那么用户令牌加上上方的 `pushrules` 调用就是主要设置步骤。
- 如果当用户在另一台设备上处于活跃状态时通知似乎消失了，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 2025 年 9 月 12 日发布的 Tuwunel 1.4.2 中添加了该选项，它可能会在一台设备处于活跃状态时，有意抑制向其他设备推送通知。

## 加密与验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，因此图片预览会与完整附件一起被加密。未加密房间仍使用普通的 `thumbnail_url`。不需要任何配置 —— 插件会自动检测 E2EE 状态。

### Bot 与 bot 房间

默认情况下，来自其他已配置 OpenClaw Matrix 账户的 Matrix 消息会被忽略。

当你有意允许智能体之间的 Matrix 流量时，请使用 `allowBots`：

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

- `allowBots: true` 会在允许的房间和私信中接受来自其他已配置 Matrix 机器人账户的消息。
- `allowBots: "mentions"` 仅在这些消息在房间中明确提及此机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖该房间的账户级设置。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不暴露原生 bot 标记；OpenClaw 将“bot-authored”视为“由此 OpenClaw Gateway 网关上另一个已配置 Matrix 账户发送”。

在共享房间中启用 bot-to-bot 流量时，请使用严格的房间 allowlist 和提及要求。

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

检查验证状态：

```bash
openclaw matrix verify status
```

详细状态（完整诊断）：

```bash
openclaw matrix verify status --verbose
```

在机器可读输出中包含已存储的恢复密钥：

```bash
openclaw matrix verify status --include-recovery-key --json
```

引导跨签名与验证状态：

```bash
openclaw matrix verify bootstrap
```

多账户支持：使用 `channels.matrix.accounts` 配置每个账户的凭证和可选的 `name`。共享模式请参阅 [Configuration reference](/zh-CN/gateway/configuration-reference#multi-account-all-channels)。

详细引导诊断：

```bash
openclaw matrix verify bootstrap --verbose
```

在引导前强制重置全新的跨签名身份：

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

使用恢复密钥验证此设备：

```bash
openclaw matrix verify device "<your-recovery-key>"
```

详细设备验证信息：

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

检查房间密钥备份健康状态：

```bash
openclaw matrix verify backup status
```

详细备份健康诊断：

```bash
openclaw matrix verify backup status --verbose
```

从服务器备份恢复房间密钥：

```bash
openclaw matrix verify backup restore
```

详细恢复诊断：

```bash
openclaw matrix verify backup restore --verbose
```

删除当前服务器备份，并创建一个全新的备份基线。如果存储的
备份密钥无法被正常加载，此重置也可以重新创建密钥存储，以便
未来的冷启动能够加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

所有 `verify` 命令默认都保持简洁（包括静默的内部 SDK 日志），仅在使用 `--verbose` 时显示详细诊断。
在脚本场景中请使用 `--json` 获取完整的机器可读输出。

在多账户设置中，Matrix CLI 命令会使用隐式的 Matrix 默认账户，除非你传入 `--account <id>`。
如果你配置了多个命名账户，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作会停止并要求你显式选择账户。
无论何时你希望验证或设备操作显式针对某个命名账户，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当某个命名账户的加密功能被禁用或不可用时，Matrix 警告和验证错误会指向该账户的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

### “已验证” 的含义

只有当这个 Matrix 设备已由你自己的跨签名身份验证时，OpenClaw 才会将其视为已验证。
实际上，`openclaw matrix verify status --verbose` 会暴露三个信任信号：

- `Locally trusted`：此设备仅被当前客户端信任
- `Cross-signing verified`：SDK 报告该设备已通过跨签名完成验证
- `Signed by owner`：该设备已由你自己的自签名密钥签名

只有存在跨签名验证或所有者签名时，`Verified by owner` 才会变为 `yes`。
仅有本地信任还不足以让 OpenClaw 将该设备视为完全已验证。

### bootstrap 会做什么

`openclaw matrix verify bootstrap` 是用于修复和设置加密 Matrix 账户的命令。
它会按顺序执行以下所有操作：

- 引导密钥存储，并尽可能复用现有恢复密钥
- 引导跨签名并上传缺失的公开跨签名密钥
- 尝试标记并跨签名当前设备
- 如果服务器端房间密钥备份不存在，则创建新的备份

如果 homeserver 需要交互式认证才能上传跨签名密钥，OpenClaw 会先在不带认证的情况下尝试上传，然后尝试使用 `m.login.dummy`，如果配置了 `channels.matrix.password`，则再尝试 `m.login.password`。

仅当你有意丢弃当前跨签名身份并创建新身份时，才使用 `--force-reset-cross-signing`。

如果你有意丢弃当前房间密钥备份，并为未来消息建立新的
备份基线，请使用 `openclaw matrix verify backup reset --yes`。
仅当你接受无法恢复的旧加密历史将继续不可用，并且 OpenClaw 可能在当前备份
密钥无法安全加载时重建密钥存储时，再执行此操作。

### 全新备份基线

如果你希望未来的加密消息继续可用，并接受失去无法恢复的旧历史，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

当你希望显式针对某个命名 Matrix 账户时，请为每条命令添加 `--account <id>`。

### 启动行为

当 `encryption: true` 时，Matrix 默认将 `startupVerification` 设为 `"if-unverified"`。
启动时，如果此设备仍未验证，Matrix 会在另一个 Matrix 客户端中请求自我验证，
在已有待处理请求时跳过重复请求，并在重启后重试前应用本地冷却时间。
默认情况下，请求尝试失败后的重试会比成功创建请求后的重试更快。
将 `startupVerification: "off"` 设为关闭自动启动请求，或者调整 `startupVerificationCooldownHours`
以获得更短或更长的重试窗口。

启动时还会自动执行一次保守的加密引导检查。
该过程会优先尝试复用当前密钥存储和跨签名身份，并避免重置跨签名，除非你运行显式的引导修复流程。

如果启动时发现损坏的引导状态，且配置了 `channels.matrix.password`，OpenClaw 可以尝试更严格的修复路径。
如果当前设备已经由所有者签名，OpenClaw 会保留该身份，而不是自动重置它。

从上一个公开 Matrix 插件升级时：

- OpenClaw 会尽可能自动复用相同的 Matrix 账户、access token 和设备身份。
- 在运行任何可执行的 Matrix 迁移变更之前，OpenClaw 会在 `~/Backups/openclaw-migrations/` 下创建或复用恢复快照。
- 如果你使用多个 Matrix 账户，请在从旧的扁平存储布局升级前设置 `channels.matrix.defaultAccount`，这样 OpenClaw 才知道该将共享旧状态分配给哪个账户。
- 如果旧插件曾在本地存储 Matrix 房间密钥备份解密密钥，启动过程或 `openclaw doctor --fix` 会自动将其导入新的恢复密钥流程中。
- 如果在准备迁移后 Matrix access token 已发生变化，启动过程现在会在放弃自动备份恢复前扫描同级 token-hash 存储根目录，查找待恢复的旧状态。
- 如果同一账户、homeserver 和用户之后再次更改 Matrix access token，OpenClaw 现在会优先复用最完整的现有 token-hash 存储根目录，而不是从空的 Matrix 状态目录开始。
- 在下一次 Gateway 网关启动时，已备份的房间密钥会自动恢复到新的加密存储中。
- 如果旧插件中存在从未备份的仅本地房间密钥，OpenClaw 会明确发出警告。这些密钥无法从先前的 rust crypto store 自动导出，因此某些旧的加密历史在手动恢复前可能仍不可用。
- 有关完整的升级流程、限制、恢复命令和常见迁移消息，请参阅 [Matrix migration](/zh-CN/install/migrating-matrix)。

加密运行时状态按每账户、每用户的 token-hash 根目录组织，位于
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 中。
该目录包含同步存储（`bot-storage.json`）、加密存储（`crypto/`）、
恢复密钥文件（`recovery-key.json`）、IndexedDB 快照（`crypto-idb-snapshot.json`）、
线程绑定（`thread-bindings.json`）以及启动验证状态（`startup-verification.json`），
当这些功能被使用时都会包含在内。
当令牌发生变化但账户身份保持不变时，OpenClaw 会为该 account/homeserver/user 组合
复用最合适的现有根目录，因此之前的同步状态、加密状态、线程绑定
以及启动验证状态都会保留可见。

### Node crypto store 模型

此插件中的 Matrix E2EE 在 Node 中使用官方 `matrix-js-sdk` 的 Rust crypto 路径。
当你希望加密状态在重启后仍能保留时，该路径需要基于 IndexedDB 的持久化。

OpenClaw 目前在 Node 中通过以下方式提供该能力：

- 使用 `fake-indexeddb` 作为 SDK 所期望的 IndexedDB API shim
- 在 `initRustCrypto` 之前，从 `crypto-idb-snapshot.json` 恢复 Rust crypto IndexedDB 内容
- 在初始化后及运行期间，将更新后的 IndexedDB 内容持久化回 `crypto-idb-snapshot.json`
- 通过 advisory file lock 将针对 `crypto-idb-snapshot.json` 的快照恢复与持久化串行化，以避免 Gateway 网关运行时持久化与 CLI 维护在同一快照文件上发生竞争

这是兼容性/存储层处理，并不是自定义加密实现。
快照文件属于敏感运行时状态，并以严格的文件权限存储。
在 OpenClaw 的安全模型下，Gateway 网关主机和本地 OpenClaw 状态目录本就位于受信任的操作员边界内，因此这主要是运维持久性问题，而不是单独的远程信任边界问题。

计划中的改进：

- 为持久化 Matrix 密钥材料添加 SecretRef 支持，以便恢复密钥和相关的存储加密密钥可以来自 OpenClaw secrets providers，而不只是本地文件

## 资料管理

使用以下命令更新所选账户的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

当你希望显式针对某个命名 Matrix 账户时，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后将解析后的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账户的覆盖项）中。

## 自动验证通知

Matrix 现在会将验证生命周期通知直接作为 `m.notice` 消息发布到严格的私信验证房间中。
其中包括：

- 验证请求通知
- 验证就绪通知（包含明确的“通过表情符号验证”指引）
- 验证开始和完成通知
- SAS 详情（表情符号和十进制数字），在可用时显示

来自另一个 Matrix 客户端的传入验证请求会被 OpenClaw 跟踪并自动接受。
对于自我验证流程，当表情符号验证可用时，OpenClaw 也会自动启动 SAS 流程并确认自己这一侧。
对于来自另一个 Matrix 用户/设备的验证请求，OpenClaw 会自动接受请求，然后等待 SAS 流程正常继续。
你仍然需要在你的 Matrix 客户端中比较表情符号或十进制 SAS，并在那边确认“它们匹配”，才能完成验证。

OpenClaw 不会盲目自动接受自行发起的重复流程。如果已有待处理的自我验证请求，启动过程会跳过创建新请求。

验证协议/系统通知不会被转发到智能体聊天流水线，因此不会产生 `NO_REPLY`。

### 设备清理

旧的 OpenClaw 管理的 Matrix 设备可能会在账户中累积，导致加密房间中的信任关系更难理解。
请使用以下命令列出它们：

```bash
openclaw matrix devices list
```

使用以下命令移除陈旧的 OpenClaw 管理设备：

```bash
openclaw matrix devices prune-stale
```

### Direct Room Repair

如果私信状态不同步，OpenClaw 可能会出现陈旧的 `m.direct` 映射，这些映射指向旧的一对一房间，而不是当前正在使用的私信。使用以下命令检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复会将 Matrix 特有逻辑保留在插件内部：

- 它优先选择已经映射在 `m.direct` 中的严格一对一私信
- 否则回退到与该用户当前已加入的任意严格一对一私信
- 如果不存在健康的私信，它会创建一个新的 direct room，并重写 `m.direct` 使其指向该房间

修复流程不会自动删除旧房间。它只会选择健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他私信流程再次指向正确的房间。

## 线程

Matrix 同时支持原生 Matrix 线程，用于自动回复和 message-tool 发送。

- `dm.sessionScope: "per-user"`（默认）会让 Matrix 私信路由按发送者范围工作，因此多个私信房间在解析为同一对端时可以共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离到各自独立的会话键中，同时仍使用普通的私信认证和 allowlist 检查。
- 显式的 Matrix 会话绑定仍优先于 `dm.sessionScope`，因此已绑定的房间和线程会保留其选定的目标会话。
- `threadReplies: "off"` 会保持回复在顶层，并将传入的线程消息保留在父会话中。
- `threadReplies: "inbound"` 仅当传入消息本身已经位于某个线程中时，才在线程内回复。
- `threadReplies: "always"` 会将房间回复保持在以触发消息为根的线程中，并从第一条触发消息起，通过匹配的线程作用域会话路由该对话。
- `dm.threadReplies` 仅对私信覆盖顶层设置。例如，你可以让房间线程保持隔离，而私信保持扁平。
- 传入的线程消息会包含线程根消息作为额外的智能体上下文。
- message-tool 发送现在会在目标是同一房间，或同一私信用户目标时，自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 仅当当前会话元数据能证明是同一 Matrix 账户上的同一私信对端时，才会启用同会话的私信用户目标复用；否则 OpenClaw 会回退到普通的按用户范围路由。
- 当 OpenClaw 发现某个 Matrix 私信房间与同一个共享 Matrix 私信会话上的另一个私信房间发生冲突时，如果启用了线程绑定且配置了 `dm.sessionScope` 提示，它会在该房间中发布一次性 `m.notice`，并附带 `/focus` 逃生出口。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 以及线程绑定的 `/acp spawn` 现在都可以在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions=true` 时，顶层 Matrix 房间/私信中的 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here` 时，则会绑定当前线程本身。

## ACP 对话绑定

Matrix 房间、私信和现有 Matrix 线程都可以转换为持久的 ACP 工作区，而无需改变聊天界面。

快速操作流程：

- 在你希望继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会保留为聊天界面，未来消息会路由到新生成的 ACP 会话。
- 在现有 Matrix 线程中，`--bind here` 会将当前线程原地绑定。
- `/new` 和 `/reset` 会原地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- 只有在 `/acp spawn --thread auto|here` 场景下，当 OpenClaw 需要创建或绑定子 Matrix 线程时，才需要 `threadBindings.spawnAcpSessions`。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，同时也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 线程绑定的生成标志为主动选择启用：

- 设置 `threadBindings.spawnSubagentSessions: true` 以允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true` 以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 回应

Matrix 支持出站回应操作、传入回应通知以及传入确认回应。

- 出站回应工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 会向特定 Matrix 事件添加一个回应。
- `reactions` 会列出特定 Matrix 事件当前的回应摘要。
- `emoji=""` 会移除机器人账户自己在该事件上的回应。
- `remove: true` 只会移除机器人账户对该指定表情符号的回应。

确认回应使用标准的 OpenClaw 解析顺序：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退

确认回应作用域按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

回应通知模式按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认值：`own`

当前行为：

- `reactionNotifications: "own"` 会在新增的 `m.reaction` 事件目标是机器人撰写的 Matrix 消息时转发这些事件。
- `reactionNotifications: "off"` 会禁用回应系统事件。
- 由于 Matrix 将回应移除表现为 redaction，而不是独立的 `m.reaction` 删除，因此目前仍不会将回应移除综合为系统事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当某条 Matrix 房间消息触发智能体时，有多少最近房间消息会作为 `InboundHistory` 包含进来。
- 它会回退到 `messages.groupChat.historyLimit`。如果两者都未设置，则生效的默认值为 `0`，因此受提及门控的房间消息不会被缓冲。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍然使用普通会话历史。
- Matrix 房间历史为仅待处理模式：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发到来时对该窗口进行快照。
- 当前触发消息不会包含在 `InboundHistory` 中；它会保留在该回合的主传入正文中。
- 同一 Matrix 事件的重试会复用原始历史快照，而不会向前漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收时的原样保留。
- `contextVisibility: "allowlist"` 会根据当前房间/用户 allowlist 检查，将补充上下文过滤到允许的发送者。
- `contextVisibility: "allowlist_quote"` 与 `allowlist` 类似，但仍会保留一条显式引用回复。

此设置影响的是补充上下文的可见性，而不是传入消息本身是否可以触发回复。
触发授权仍来自 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置。

## 私信与房间策略示例

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

有关提及门控和 allowlist 行为，请参阅 [Groups](/zh-CN/channels/groups)。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个尚未获批准的 Matrix 用户在批准前持续向你发送消息，OpenClaw 会复用同一个待处理配对码，并可能在短暂冷却后再次发送提醒回复，而不是生成新的配对码。

有关共享的私信配对流程和存储布局，请参阅 [Pairing](/zh-CN/channels/pairing)。

## Exec 审批

Matrix 可以作为 Matrix 账户的 exec 审批客户端。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；会回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批者必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，且至少能从 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 解析出一个审批者时，Matrix 会自动启用原生 exec 审批。设置 `enabled: false` 可显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路由或 exec 审批回退策略。

原生 Matrix 路由目前仅支持 exec：

- `channels.matrix.execApprovals.*` 仅控制 exec 审批的原生私信/渠道路由。
- 插件审批仍使用共享的同聊天 `/approve`，以及任何已配置的 `approvals.plugin` 转发。
- 当 Matrix 能安全推断审批者时，仍可复用 `channels.matrix.dm.allowFrom` 进行插件审批授权，但它不会暴露单独的原生插件审批私信/渠道扇出路径。

投递规则：

- `target: "dm"` 会将审批提示发送到审批者私信
- `target: "channel"` 会将提示发送回发起的 Matrix 房间或私信
- `target: "both"` 会同时发送到审批者私信以及发起的 Matrix 房间或私信

Matrix 审批提示会在主审批消息上附带回应快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 在有效 exec 策略允许时始终允许该决策

审批者可以对该消息添加回应，或使用回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批者才能批准或拒绝。渠道投递会包含命令文本，因此仅在受信任房间中启用 `channel` 或 `both`。

Matrix 审批提示会复用共享核心审批规划器。Matrix 特有的原生界面仅作为 exec 审批的传输层：房间/私信路由以及消息发送/更新/删除行为。

每账户覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec approvals](/zh-CN/tools/exec-approvals)

## 多账户示例

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
你可以使用 `groups.<room>.account`（或旧版 `rooms.<room>.account`）将继承的房间条目限定到某一个 Matrix 账户。
未设置 `account` 的条目会在所有 Matrix 账户之间共享，而当默认账户直接配置在顶层 `channels.matrix.*` 上时，带有 `account: "default"` 的条目仍然有效。
部分共享认证默认值本身不会创建单独的隐式默认账户。只有当这个默认账户拥有新的认证信息（`homeserver` 加 `accessToken`，或 `homeserver` 加 `userId` 和 `password`）时，OpenClaw 才会综合出顶层 `default` 账户；命名账户仍然可以在稍后由缓存凭证满足认证条件时，通过 `homeserver` 加 `userId` 保持可发现。
如果 Matrix 已经恰好有一个命名账户，或者 `defaultAccount` 指向现有命名账户键，那么单账户到多账户的修复/设置提升会保留该账户，而不会创建新的 `accounts.default` 条目。只有 Matrix 认证/引导键会移动到该提升后的账户；共享投递策略键会保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账户时，请设置 `defaultAccount`。
如果你配置了多个命名账户，请设置 `defaultAccount` 或为依赖隐式账户选择的 CLI 命令传入 `--account <id>`。
当你希望为某条命令覆盖该隐式选择时，请将 `--account <id>` 传给 `openclaw matrix verify ...` 和 `openclaw matrix devices ...`。

## 私有/LAN homeserver

默认情况下，出于 SSRF 防护，OpenClaw 会阻止连接私有/内部 Matrix homeserver，除非你
按账户显式选择启用。

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

此选择启用仅允许受信任的私有/内部目标。像
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

命名账户可以通过 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会对运行时 Matrix 流量和账户状态探测使用相同的代理设置。

## 目标解析

无论在 OpenClaw 的哪个位置要求你提供房间或用户目标，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找会使用已登录的 Matrix 账户：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退到搜索该账户已加入房间的名称。
- 已加入房间名称查找为尽力而为。如果无法将房间名称解析为 ID 或别名，则运行时 allowlist 解析会忽略它。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账户的可选标签。
- `defaultAccount`：配置多个 Matrix 账户时的首选账户 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此 Matrix 账户连接私有/内部 homeserver。当 homeserver 解析到 `localhost`、LAN/Tailscale IP 或诸如 `matrix-synapse` 的内部主机时，请启用此项。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。命名账户可以用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：基于令牌认证所用的 access token。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 支持明文值与 SecretRef 值，适用于 env/file/exec providers。请参阅 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：基于密码登录所用的密码。支持明文值与 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：密码登录时的设备显示名称。
- `avatarUrl`：为资料同步和 `set-profile` 更新所存储的自身头像 URL。
- `initialSyncLimit`：启动同步事件限制。
- `encryption`：启用 E2EE。
- `allowlistOnly`：对私信和房间强制仅 allowlist 行为。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账户的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的用户 ID allowlist。
- `groupAllowFrom` 条目应为完整 Matrix 用户 ID。无法解析的名称会在运行时被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则生效默认值为 `0`。设置 `0` 可禁用。
- `replyToMode`：`off`、`first`、`all` 或 `batched`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`partial`、`quiet`、`true` 或 `false`。`partial` 和 `true` 会启用使用普通 Matrix 文本消息的预览优先草稿更新。`quiet` 会对自托管推送规则场景使用不通知的预览通知。
- `blockStreaming`：`true` 会在草稿预览流式传输处于启用状态时，为已完成的智能体块启用单独进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：线程绑定会话路由和生命周期的按渠道覆盖。
- `startupVerification`：启动时自动自我验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：自动启动验证请求再次尝试前的冷却时间。
- `textChunkLimit`：出站消息分块大小。
- `chunkMode`：`length` 或 `newline`。
- `responsePrefix`：出站回复的可选消息前缀。
- `ackReaction`：此渠道/账户的可选确认回应覆盖值。
- `ackReactionScope`：可选确认回应作用域覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：传入回应通知模式（`own`、`off`）。
- `mediaMaxMb`：Matrix 媒体处理的媒体大小上限（MB）。它适用于出站发送和传入媒体处理。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认：`off`。这适用于 Matrix 邀请的整体情况，包括类私信邀请，而不仅仅是房间/群组邀请。OpenClaw 在邀请发生时做出这一决策，此时它还无法可靠地将已加入房间分类为私信或群组。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不会信任受邀房间自行声明的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：控制 OpenClaw 加入房间并将其分类为私信后的私信访问。它不会改变邀请是否自动加入。
- `dm.allowFrom` 条目应为完整 Matrix 用户 ID，除非你已经通过实时目录查找解析过它们。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。当你希望每个 Matrix 私信房间即使面对同一对端也保留独立上下文时，请使用 `per-room`。
- `dm.threadReplies`：仅私信线程策略覆盖（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，影响私信中的回复位置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许审批 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已经标识审批者时，此项为可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：命名的按账户覆盖项。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间划分的策略映射。优先使用房间 ID 或别名；无法解析的房间名称会在运行时被忽略。解析后会话/群组标识使用稳定的房间 ID，而面向人的标签仍来自房间名称。
- `groups.<room>.account`：在多账户设置中，将某个继承的房间条目限定到特定 Matrix 账户。
- `groups.<room>.allowBots`：针对已配置机器人发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：按房间划分的发送者 allowlist。
- `groups.<room>.tools`：按房间划分的工具允许/拒绝覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 会关闭该房间的提及要求；`false` 会重新强制开启。
- `groups.<room>.skills`：可选的房间级 Skills 过滤器。
- `groups.<room>.systemPrompt`：可选的房间级 system prompt 片段。
- `rooms`：`groups` 的旧别名。
- `actions`：按操作划分的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信认证与配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为与提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与加固
