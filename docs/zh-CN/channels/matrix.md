---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-23T07:03:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 678d0e678cbb52a9817d5a1f4977a738820f6d0228f1810614c9c195c0de7218
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix 是 OpenClaw 的一个内置渠道插件。
它使用官方 `matrix-js-sdk`，并支持私信、房间、线程、媒体、回应、投票、位置和 E2EE。

## 内置插件

Matrix 作为当前 OpenClaw 版本中的内置插件提供，因此普通的打包构建不需要单独安装。

如果你使用的是较旧的构建版本，或是排除了 Matrix 的自定义安装，请手动安装：

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

有关插件行为和安装规则，请参阅 [插件](/zh-CN/tools/plugin)。

## 设置

1. 确保 Matrix 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧/自定义安装可使用上述命令手动添加。
2. 在你的 homeserver 上创建一个 Matrix 账号。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人发起私信，或邀请它加入房间。
   - 只有在 `channels.matrix.autoJoin` 允许的情况下，新发出的 Matrix 邀请才会生效。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导会询问以下内容：

- homeserver URL
- 认证方式：访问令牌或密码
- 用户 ID（仅限密码认证）
- 可选的设备名称
- 是否启用 E2EE
- 是否配置房间访问和邀请自动加入

向导的关键行为：

- 如果 Matrix 认证环境变量已存在，并且该账号的认证信息尚未保存在配置中，向导会提供一个环境变量快捷选项，以便将认证信息保留在环境变量中。
- 账号名称会规范化为账号 ID。例如，`Ops Bot` 会变成 `ops-bot`。
- 私信 allowlist 条目可直接接受 `@user:server`；显示名称只有在实时目录查找能找到唯一精确匹配时才可用。
- 房间 allowlist 条目可直接接受房间 ID 和别名。优先使用 `!room:server` 或 `#alias:server`；无法解析的名称会在运行时被 allowlist 解析忽略。
- 在邀请自动加入的 allowlist 模式下，只能使用稳定的邀请目标：`!roomId:server`、`#alias:server` 或 `*`。普通房间名称会被拒绝。
- 如需在保存前解析房间名称，请使用 `openclaw channels resolve --channel matrix "Project Room"`。

<Warning>
`channels.matrix.autoJoin` 默认为 `off`。

如果你不设置它，机器人将不会加入受邀房间或新发起的私信式邀请，因此除非你先手动加入，否则它不会出现在新的群组或受邀私信中。

如果你想限制它接受哪些邀请，请设置 `autoJoin: "allowlist"` 并同时配置 `autoJoinAllowlist`；如果你希望它加入所有邀请，请设置 `autoJoin: "always"`。

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

基于令牌的最小化设置：

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
默认账号使用 `credentials.json`；命名账号使用 `credentials-<account>.json`。
如果那里存在缓存凭证，OpenClaw 在设置、Doctor 和渠道状态发现中会将 Matrix 视为已配置，即使当前认证信息没有直接在配置中设置也是如此。

对应的环境变量（当配置键未设置时使用）：

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

对于非默认账号，请使用账号范围的环境变量：

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

账号 `ops` 的示例：

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

对于规范化后的账号 ID `ops-bot`，请使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 会对账号 ID 中的标点符号进行转义，以避免带作用域的环境变量发生冲突。
例如，`-` 会变成 `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已存在，且所选账号尚未在配置中保存 Matrix 认证信息时，交互式向导才会提供环境变量快捷选项。

<Note>
`MATRIX_HOMESERVER` 位于端点屏蔽列表中，不能通过工作区 `.env` 文件设置。
它必须来自 shell 环境变量或 Gateway 网关进程环境变量，这样不受信任的工作区就无法将 Matrix 流量重定向到其他 homeserver。完整列表请参阅
[工作区 `.env` 文件](/zh-CN/gateway/security)。
</Note>

## 配置示例

这是一个实用的基础配置，启用了私信配对、房间 allowlist 和 E2EE：

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

`autoJoin` 适用于所有 Matrix 邀请，包括私信式邀请。OpenClaw 无法在邀请发生时可靠地区分受邀房间是私信还是群组，因此所有邀请都会先经过 `autoJoin`。`dm.policy` 会在机器人加入之后、并且该房间被识别为私信后才生效。

## 流式预览

Matrix 回复流式传输为选择启用。

当你希望 OpenClaw 发送一条实时预览回复、在模型生成文本时原地编辑这条预览，并在回复完成后将其定稿时，请将 `channels.matrix.streaming` 设置为 `"partial"`：

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` 是默认值。OpenClaw 会等待最终回复，然后一次性发送。
- `streaming: "partial"` 会为当前智能体输出块创建一条可编辑的预览消息，并使用普通 Matrix 文本消息进行更新。这样会保留 Matrix 传统的“预览优先”通知行为，因此标准客户端可能会在第一段流式预览文本出现时通知，而不是在最终内容完成时通知。
- `streaming: "quiet"` 会为当前智能体输出块创建一条可编辑的静默预览通知。只有在你同时为最终定稿的预览编辑配置了接收者推送规则时，才应使用此模式。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。在启用预览流式传输时，Matrix 会为当前块保留实时草稿，并将已完成的块保留为单独消息。
- 当预览流式传输开启且 `blockStreaming` 关闭时，Matrix 会原地编辑实时草稿，并在块或整轮完成时定稿同一个事件。
- 如果预览内容已无法容纳在单个 Matrix 事件中，OpenClaw 会停止预览流式传输并回退为普通的最终发送。
- 媒体回复仍会正常发送附件。如果过期预览已无法安全复用，OpenClaw 会在发送最终媒体回复前将其清除。
- 预览编辑会带来额外的 Matrix API 调用。如果你希望采用最保守的速率限制行为，请保持关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
如需预览编辑，请使用 `streaming: "partial"` 或 `streaming: "quiet"`；如果你还希望已完成的智能体输出块以单独的进度消息保留可见，再额外添加 `blockStreaming: true`。

如果你需要标准 Matrix 通知而不配置自定义推送规则，请使用 `streaming: "partial"` 获得“预览优先”行为，或保持 `streaming` 为关闭以仅发送最终结果。当 `streaming: "off"` 时：

- `blockStreaming: true` 会将每个已完成的块作为普通的可通知 Matrix 消息发送。
- `blockStreaming: false` 只会将最终完整回复作为普通的可通知 Matrix 消息发送。

### 自托管的静默定稿预览推送规则

如果你运行自己的 Matrix 基础设施，并且希望静默预览只在某个块或最终回复完成时才触发通知，请设置 `streaming: "quiet"`，并为定稿后的预览编辑添加按用户配置的推送规则。

这通常是接收用户侧的设置，而不是 homeserver 全局配置变更：

开始前的快速映射：

- recipient user = 应收到通知的人
- bot user = 发送回复的 OpenClaw Matrix 账号
- 对下面的 API 调用使用 recipient user 的访问令牌
- 在推送规则中，将 `sender` 与 bot user 的完整 MXID 匹配

1. 将 OpenClaw 配置为使用静默预览：

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. 确保接收账号已经能收到普通的 Matrix 推送通知。静默预览规则只有在该用户已有正常工作的 pusher/设备时才会生效。

3. 获取 recipient user 的访问令牌。
   - 使用接收用户的令牌，而不是机器人的令牌。
   - 复用现有客户端会话令牌通常最简单。
   - 如果你需要创建新的令牌，可以通过标准 Matrix Client-Server API 登录：

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

4. 验证接收账号已经存在 pusher：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果这里没有返回任何活动的 pusher/设备，请先修复普通的 Matrix 通知，再添加下面的 OpenClaw 规则。

OpenClaw 会用以下标记来标识已定稿的纯文本预览编辑：

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. 为每个应收到这些通知的接收账号创建一条 override 推送规则：

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

在运行该命令前，请替换以下值：

- `https://matrix.example.org`：你的 homeserver 基础 URL
- `$USER_ACCESS_TOKEN`：接收用户的访问令牌
- `openclaw-finalized-preview-botname`：对此接收用户而言、此机器人专用且唯一的规则 ID
- `@bot:example.org`：你的 OpenClaw Matrix 机器人 MXID，而不是接收用户的 MXID

对多机器人设置很重要：

- 推送规则以 `ruleId` 为键。对同一个规则 ID 重复执行 `PUT` 会更新该条规则。
- 如果同一个接收用户需要对多个 OpenClaw Matrix 机器人账号触发通知，请为每个机器人各创建一条规则，并为每个 `sender` 匹配使用唯一的规则 ID。
- 一个简单的命名模式是 `openclaw-finalized-preview-<botname>`，例如 `openclaw-finalized-preview-ops` 或 `openclaw-finalized-preview-support`。

该规则会根据事件发送者进行评估：

- 使用接收用户的令牌进行认证
- 将 `sender` 与 OpenClaw 机器人 MXID 匹配

6. 验证规则是否存在：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. 测试一条流式回复。在静默模式下，房间中应显示一条静默草稿预览，并且最终的原地编辑应在该块或整轮完成时触发一次通知。

如果你之后需要移除该规则，请使用接收用户的令牌删除同一个规则 ID：

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

注意：

- 使用接收用户的访问令牌创建规则，而不是机器人的令牌。
- 新建的用户自定义 `override` 规则会插入到默认抑制规则之前，因此不需要额外的排序参数。
- 这只影响 OpenClaw 能够安全原地定稿的纯文本预览编辑。媒体回退和过期预览回退仍会使用普通 Matrix 投递。
- 如果 `GET /_matrix/client/v3/pushers` 显示没有 pusher，说明该用户在此账号/设备上尚未配置可用的 Matrix 推送投递。

#### Synapse

对于 Synapse，以上设置通常本身就足够了：

- finalized OpenClaw 预览通知不需要特殊的 `homeserver.yaml` 变更。
- 如果你的 Synapse 部署已经能发送普通 Matrix 推送通知，那么上面的用户令牌 + `pushrules` 调用就是主要设置步骤。
- 如果你在反向代理或 workers 后运行 Synapse，请确保 `/_matrix/client/.../pushrules/` 能正确到达 Synapse。
- 如果你运行的是 Synapse workers，请确保 pusher 状态健康。推送投递由主进程或 `synapse.app.pusher` / 已配置的 pusher workers 处理。

#### Tuwunel

对于 Tuwunel，请使用上文所示的相同设置流程和推送规则 API 调用：

- finalized preview 标记本身不需要任何 Tuwunel 专用配置。
- 如果该用户的普通 Matrix 通知已经正常工作，那么上面的用户令牌 + `pushrules` 调用就是主要设置步骤。
- 如果通知似乎会在用户正在另一台设备上活跃时消失，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 2025 年 9 月 12 日发布的 Tuwunel 1.4.2 中加入了该选项，它可能会在某一台设备处于活跃状态时，有意抑制向其他设备发送推送。

## 机器人到机器人的房间

默认情况下，来自其他已配置 OpenClaw Matrix 账号的 Matrix 消息会被忽略。

当你确实需要智能体之间的 Matrix 通信时，请使用 `allowBots`：

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

- `allowBots: true` 会在允许的房间和私信中接受来自其他已配置 Matrix 机器人账号的消息。
- `allowBots: "mentions"` 仅在这些消息在房间中明确提及此机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖该房间的账号级设置。
- OpenClaw 仍会忽略来自同一个 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不会暴露原生的机器人标记；OpenClaw 将“由机器人撰写”视为“由此 OpenClaw Gateway 网关上另一个已配置的 Matrix 账号发送”。

在共享房间中启用机器人到机器人流量时，请使用严格的房间 allowlist 和提及要求。

## 加密与验证

在加密（E2EE）房间中，出站图片事件会使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需配置——插件会自动检测 E2EE 状态。

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

引导 cross-signing 和验证状态：

```bash
openclaw matrix verify bootstrap
```

详细的引导诊断：

```bash
openclaw matrix verify bootstrap --verbose
```

在引导前强制重置 cross-signing 身份：

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

使用恢复密钥验证此设备：

```bash
openclaw matrix verify device "<your-recovery-key>"
```

详细的设备验证信息：

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

检查房间密钥备份健康状态：

```bash
openclaw matrix verify backup status
```

详细的备份健康诊断：

```bash
openclaw matrix verify backup status --verbose
```

从服务器备份恢复房间密钥：

```bash
openclaw matrix verify backup restore
```

详细的恢复诊断：

```bash
openclaw matrix verify backup restore --verbose
```

删除当前服务器备份并创建一个全新的备份基线。如果已存储的备份密钥无法被干净地加载，此重置也可以重建 secret storage，以便未来冷启动时能够加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

所有 `verify` 命令默认都保持简洁（包括安静的内部 SDK 日志），只有在使用 `--verbose` 时才显示详细诊断信息。
在编写脚本时，请使用 `--json` 获取完整的机器可读输出。

在多账号设置中，除非你传入 `--account <id>`，否则 Matrix CLI 命令会使用隐式的 Matrix 默认账号。
如果你配置了多个命名账号，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作会停止并要求你明确选择一个账号。
当你希望验证或设备操作明确针对某个命名账号时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当某个命名账号的加密被禁用或不可用时，Matrix 警告和验证错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

### “已验证” 的含义

只有当这个 Matrix 设备已被你自己的 cross-signing 身份验证时，OpenClaw 才会将其视为已验证。
在实践中，`openclaw matrix verify status --verbose` 会暴露三个信任信号：

- `Locally trusted`：该设备仅被当前客户端信任
- `Cross-signing verified`：SDK 报告该设备已通过 cross-signing 验证
- `Signed by owner`：该设备已由你自己的 self-signing 密钥签名

只有在存在 cross-signing 验证或 owner-signing 时，`Verified by owner` 才会变为 `yes`。
仅有本地信任还不足以让 OpenClaw 将设备视为完全已验证。

### bootstrap 会做什么

`openclaw matrix verify bootstrap` 是针对加密 Matrix 账号的修复和设置命令。
它会按顺序完成以下所有操作：

- 引导 secret storage，并尽可能复用现有恢复密钥
- 引导 cross-signing 并上传缺失的公开 cross-signing 密钥
- 尝试标记并 cross-sign 当前设备
- 如果服务器端房间密钥备份尚不存在，则创建一个新的备份

如果 homeserver 在上传 cross-signing 密钥时需要交互式认证，OpenClaw 会先尝试不带认证上传，然后尝试使用 `m.login.dummy`，如果配置了 `channels.matrix.password`，再尝试使用 `m.login.password`。

只有当你明确希望丢弃当前 cross-signing 身份并创建新身份时，才使用 `--force-reset-cross-signing`。

如果你明确希望丢弃当前房间密钥备份，并为未来消息建立新的备份基线，请使用 `openclaw matrix verify backup reset --yes`。
仅当你接受无法恢复的旧加密历史将继续不可用，并且接受在当前备份密钥无法安全加载时 OpenClaw 可能会重建 secret storage，才应这样做。

### 全新的备份基线

如果你希望未来的加密消息继续正常工作，并接受丢失无法恢复的旧历史，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果你希望明确指定某个命名 Matrix 账号，请为每条命令添加 `--account <id>`。

### 启动行为

当 `encryption: true` 时，Matrix 默认会将 `startupVerification` 设为 `"if-unverified"`。
启动时，如果该设备仍未验证，Matrix 会在另一个 Matrix 客户端中请求自验证，在已有待处理请求时跳过重复请求，并在重启后重试前应用本地冷却时间。
默认情况下，失败的请求尝试会比成功创建请求后的重试更早再次进行。
如果你想禁用自动启动请求，请设置 `startupVerification: "off"`；如果你想缩短或延长重试窗口，请调整 `startupVerificationCooldownHours`。

启动时还会自动执行一次保守的加密 bootstrap 检查。
该检查会优先尝试复用当前的 secret storage 和 cross-signing 身份，并避免重置 cross-signing，除非你显式运行 bootstrap 修复流程。

如果启动时仍然发现损坏的 bootstrap 状态，即使未配置 `channels.matrix.password`，OpenClaw 也可以尝试执行受保护的修复路径。
如果 homeserver 为该修复要求基于密码的 UIA，OpenClaw 会记录一条警告，并保持启动为非致命状态，而不是中止机器人。
如果当前设备已经由 owner 签名，OpenClaw 会保留该身份，而不是自动重置它。

完整的升级流程、限制、恢复命令和常见迁移消息，请参阅 [Matrix 迁移](/zh-CN/install/migrating-matrix)。

### 验证通知

Matrix 会将验证生命周期通知直接作为 `m.notice` 消息发布到严格私信验证房间中。
这包括：

- 验证请求通知
- 验证就绪通知（带有明确的“通过表情符号验证”指引）
- 验证开始和完成通知
- SAS 详情（表情符号和十进制），如可用

来自另一个 Matrix 客户端的传入验证请求会被 OpenClaw 跟踪并自动接受。
对于自验证流程，当表情符号验证可用时，OpenClaw 也会自动启动 SAS 流程并确认自己这一侧。
对于来自另一个 Matrix 用户/设备的验证请求，OpenClaw 会自动接受该请求，然后等待 SAS 流程正常继续。
你仍然需要在你的 Matrix 客户端中比对表情符号或十进制 SAS，并在其中确认“它们匹配”，以完成验证。

OpenClaw 不会盲目自动接受由自己发起的重复流程。如果已存在待处理的自验证请求，启动时会跳过创建新请求。

验证协议/系统通知不会被转发到智能体聊天管道，因此不会产生 `NO_REPLY`。

### 设备卫生

账号中可能会累积旧的由 OpenClaw 管理的 Matrix 设备，从而使加密房间的信任状态更难判断。
可使用以下命令列出它们：

```bash
openclaw matrix devices list
```

使用以下命令移除过期的由 OpenClaw 管理的设备：

```bash
openclaw matrix devices prune-stale
```

### 加密存储

Matrix E2EE 在 Node 中使用官方 `matrix-js-sdk` 的 Rust 加密路径，并以 `fake-indexeddb` 作为 IndexedDB shim。加密状态会持久化到快照文件（`crypto-idb-snapshot.json`）中，并在启动时恢复。该快照文件属于敏感的运行时状态，使用严格的文件权限进行存储。

加密运行时状态位于按账号、按用户 token 哈希划分的根目录下：
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`。
该目录包含同步存储（`bot-storage.json`）、加密存储（`crypto/`）、
恢复密钥文件（`recovery-key.json`）、IndexedDB 快照（`crypto-idb-snapshot.json`）、
线程绑定（`thread-bindings.json`）以及启动验证状态（`startup-verification.json`）。
当 token 发生变化但账号身份保持不变时，OpenClaw 会为该 account/homeserver/user 元组复用最佳的现有根目录，以便先前的同步状态、加密状态、线程绑定和启动验证状态仍然可见。

## 资料管理

使用以下命令更新所选账号的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

当你希望明确指定某个命名 Matrix 账号时，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后将解析得到的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账号的覆盖配置）中。

## 线程

Matrix 同时支持自动回复和 message-tool 发送使用原生 Matrix 线程。

- `dm.sessionScope: "per-user"`（默认）会让 Matrix 私信路由保持按发送者作用域，因此多个私信房间在解析为同一对端时可以共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离为各自独立的会话键，同时仍使用普通的私信认证和 allowlist 检查。
- 显式的 Matrix 会话绑定仍然优先生效，因此已绑定的房间和线程会保持其选定的目标会话。
- `threadReplies: "off"` 会让回复保持在顶层，并让传入的线程消息继续使用父会话。
- `threadReplies: "inbound"` 仅当传入消息本身已经位于某个线程中时，才在线程内回复。
- `threadReplies: "always"` 会让房间回复保持在线程中，线程根为触发消息，并从第一条触发消息开始，通过匹配的线程作用域会话路由该会话。
- `dm.threadReplies` 仅覆盖私信的顶层设置。例如，你可以让房间线程保持隔离，同时让私信保持扁平。
- 传入的线程消息会将线程根消息作为额外的智能体上下文一并包含。
- 当目标是同一个房间，或同一个私信用户目标时，message-tool 发送会自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 同一会话的私信用户目标复用，只有在当前会话元数据能够证明它是在同一个 Matrix 账号上的同一私信对端时才会生效；否则 OpenClaw 会回退到普通的按用户作用域路由。
- 当 OpenClaw 发现某个 Matrix 私信房间与另一个私信房间在同一个共享 Matrix 私信会话上发生冲突时，如果启用了线程绑定并设置了 `dm.sessionScope` 提示，它会在该房间中发布一次性的 `m.notice`，其中包含 `/focus` 逃生口。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 以及线程绑定的 `/acp spawn` 都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions=true` 时，在 Matrix 房间/私信顶层执行 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程内运行 `/focus` 或 `/acp spawn --thread here`，则会改为绑定当前线程本身。

## ACP 会话绑定

Matrix 房间、私信以及现有 Matrix 线程都可以变成持久化的 ACP 工作区，而无需更改聊天界面。

快速操作流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在 Matrix 私信或房间的顶层，当前私信/房间会继续作为聊天界面，后续消息会被路由到新建的 ACP 会话。
- 在现有 Matrix 线程内部，`--bind here` 会将当前线程原地绑定。
- `/new` 和 `/reset` 会原地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除该绑定。

注意：

- `--bind here` 不会创建子 Matrix 线程。
- 只有在使用 `/acp spawn --thread auto|here` 时，才需要 `threadBindings.spawnAcpSessions`，因为此时 OpenClaw 需要创建或绑定一个子 Matrix 线程。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，同时也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 的线程绑定 spawn 标志为显式启用：

- 设置 `threadBindings.spawnSubagentSessions: true` 以允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true` 以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## Reactions

Matrix 支持出站 reaction 操作、入站 reaction 通知，以及入站确认 reaction。

- 出站 reaction 工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 会向特定的 Matrix 事件添加一个 reaction。
- `reactions` 会列出特定 Matrix 事件当前的 reaction 摘要。
- `emoji=""` 会移除机器人账号在该事件上的自身 reaction。
- `remove: true` 只会移除该机器人账号上的指定 emoji reaction。

确认 reaction 使用标准 OpenClaw 解析顺序：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退

确认 reaction 作用域按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Reaction 通知模式按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认值：`own`

行为：

- `reactionNotifications: "own"` 会在新增的 `m.reaction` 事件指向机器人撰写的 Matrix 消息时将其转发。
- `reactionNotifications: "off"` 会禁用 reaction 系统事件。
- reaction 移除不会被合成为系统事件，因为 Matrix 将其作为 redaction 暴露，而不是作为独立的 `m.reaction` 移除事件暴露。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含多少条最近的房间消息。它会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则有效默认值为 `0`。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍使用普通会话历史。
- Matrix 房间历史是仅待处理的：OpenClaw 会缓冲那些尚未触发回复的房间消息，然后在提及或其他触发到来时，对该窗口拍摄快照。
- 当前触发消息不会包含在 `InboundHistory` 中；该轮中它会保留在主入站正文里。
- 对同一个 Matrix 事件的重试会复用原始历史快照，而不是漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取到的回复文本、线程根和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收时原样保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为通过当前房间/用户 allowlist 检查的发送者。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一条显式引用回复。

此设置影响的是补充上下文的可见性，而不是入站消息本身是否可以触发回复。
触发授权仍然来自 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置。

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

有关提及门控和 allowlist 行为，请参阅 [群组](/zh-CN/channels/groups)。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个尚未批准的 Matrix 用户在获得批准前持续向你发送消息，OpenClaw 会复用同一个待处理配对码，并且在短暂冷却后可能再次发送提醒回复，而不是创建新的配对码。

有关共享的私信配对流程和存储布局，请参阅 [配对](/zh-CN/channels/pairing)。

## 直接房间修复

如果私信状态不同步，OpenClaw 可能会保留陈旧的 `m.direct` 映射，将其指向旧的单聊房间，而不是当前活跃的私信。使用以下命令检查某个对端当前的映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复流程：

- 优先选择已经在 `m.direct` 中映射的严格 1:1 私信
- 如果没有，则回退到当前已加入的、与该用户的任意严格 1:1 私信
- 如果不存在健康的私信，则创建一个新的 direct room 并重写 `m.direct`

修复流程不会自动删除旧房间。它只会选择健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他私信流程再次指向正确的房间。

## Exec 审批

Matrix 可以作为某个 Matrix 账号的原生审批客户端。原生
私信/渠道路由控制项仍位于 exec 审批配置下：

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批人必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，且至少有一个审批人可以解析时，Matrix 会自动启用原生审批。Exec 审批优先使用 `execApprovals.approvers`，并可回退到 `channels.matrix.dm.allowFrom`。插件审批通过 `channels.matrix.dm.allowFrom` 授权。设置 `enabled: false` 可显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路径或审批回退策略。

Matrix 原生路由同时支持两种审批类型：

- `channels.matrix.execApprovals.*` 控制 Matrix 审批提示的原生私信/渠道扇出模式。
- Exec 审批使用来自 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 的 exec 审批人集合。
- 插件审批使用来自 `channels.matrix.dm.allowFrom` 的 Matrix 私信 allowlist。
- Matrix reaction 快捷方式和消息更新同时适用于 exec 审批和插件审批。

投递规则：

- `target: "dm"` 会将审批提示发送到审批人的私信
- `target: "channel"` 会将提示发送回发起的 Matrix 房间或私信
- `target: "both"` 会将提示发送到审批人的私信以及发起的 Matrix 房间或私信

Matrix 审批提示会在主审批消息上预置 reaction 快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 始终允许，前提是有效的 exec 策略允许该决定

审批人可以对该消息添加 reaction，也可以使用回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批人可以批准或拒绝。对于 exec 审批，渠道投递会包含命令文本，因此仅应在受信任房间中启用 `channel` 或 `both`。

按账号覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec 审批](/zh-CN/tools/exec-approvals)

## Slash commands

Matrix slash commands（例如 `/new`、`/reset`、`/model`）可直接在私信中使用。在房间中，OpenClaw 也能识别以前缀为机器人自身 Matrix 提及的 slash commands，因此 `@bot:server /new` 会触发命令路径，而无需自定义提及正则。这让机器人在 Element 和类似客户端中对房间样式的 `@mention /command` 消息保持响应，这类消息通常出现在用户先用 Tab 补全机器人，再输入命令时。

授权规则仍然适用：命令发送者必须像普通消息一样满足私信或房间的 allowlist/owner 策略。

## 多账号

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

顶层 `channels.matrix` 值会作为命名账号的默认值，除非某个账号进行了覆盖。
你可以使用 `groups.<room>.account` 将继承的房间条目限定到某一个 Matrix 账号。
未设置 `account` 的条目会在所有 Matrix 账号之间共享，而设置了 `account: "default"` 的条目在默认账号直接配置于顶层 `channels.matrix.*` 时也仍然有效。
部分共享认证默认值本身不会创建一个单独的隐式默认账号。只有当该默认账号具备最新认证信息（`homeserver` 加 `accessToken`，或 `homeserver` 加 `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账号；命名账号仍然可以只通过 `homeserver` 加 `userId` 保持可发现性，并在稍后缓存凭证满足认证时生效。
如果 Matrix 已经恰好存在一个命名账号，或者 `defaultAccount` 指向一个现有的命名账号键，那么从单账号到多账号的修复/设置升级会保留该账号，而不是新建一个 `accounts.default` 条目。只有 Matrix 认证/bootstrap 键会移动到该升级后的账号中；共享的投递策略键仍会保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账号时，请设置 `defaultAccount`。
如果配置了多个 Matrix 账号，并且其中一个账号 ID 为 `default`，那么即使未设置 `defaultAccount`，OpenClaw 也会隐式使用该账号。
如果你配置了多个命名账号，请设置 `defaultAccount`，或为依赖隐式账号选择的 CLI 命令传入 `--account <id>`。
当你希望为单个命令覆盖该隐式选择时，请将 `--account <id>` 传给 `openclaw matrix verify ...` 和 `openclaw matrix devices ...`。

有关共享的多账号模式，请参阅 [配置参考](/zh-CN/gateway/configuration-reference#multi-account-all-channels)。

## 私有/LAN homeserver

默认情况下，出于 SSRF 防护，OpenClaw 会屏蔽私有/内部 Matrix homeserver，除非你为每个账号显式选择启用。

如果你的 homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该 Matrix 账号启用
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

此显式启用仅允许受信任的私有/内部目标。公共明文 homeserver，例如
`http://matrix.example.org:8008`，仍会被屏蔽。请尽可能优先使用 `https://`。

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

命名账号可以通过 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会对运行时 Matrix 流量和账号状态探测使用同一个代理设置。

## 目标解析

无论 OpenClaw 在何处要求你提供房间或用户目标，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找使用已登录的 Matrix 账号：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退为搜索该账号已加入房间的名称。
- 已加入房间名称查找属于尽力而为。如果某个房间名称无法解析为 ID 或别名，它会在运行时 allowlist 解析中被忽略。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选标签。
- `defaultAccount`：配置多个 Matrix 账号时的首选账号 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许该 Matrix 账号连接到私有/内部 homeserver。当 homeserver 解析为 `localhost`、LAN/Tailscale IP 或内部主机（如 `matrix-synapse`）时，请启用此项。
- `proxy`：Matrix 流量可选的 HTTP(S) 代理 URL。命名账号可使用各自的 `proxy` 覆盖顶层默认值。
- `userId`：完整的 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：基于令牌认证所使用的访问令牌。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 在 env/file/exec 提供商中都支持明文值和 SecretRef 值。请参阅 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：基于密码登录所使用的密码。支持明文值和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：密码登录时的设备显示名称。
- `avatarUrl`：用于资料同步和 `profile set` 更新的已存储自身头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。
- `encryption`：启用 E2EE。
- `allowlistOnly`：为 `true` 时，会将 `open` 房间策略升级为 `allowlist`，并将所有活跃的私信策略（除 `disabled` 外，包括 `pairing` 和 `open`）强制设为 `allowlist`。不影响 `disabled` 策略。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账号的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的 allowlist 用户 ID。完整 Matrix 用户 ID 最安全；精确目录匹配会在启动时以及监控运行期间 allowlist 变化时解析。无法解析的名称会被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则有效默认值为 `0`。设置为 `0` 可禁用。
- `replyToMode`：`off`、`first`、`all` 或 `batched`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`"partial"`、`"quiet"`、`true` 或 `false`。`"partial"` 和 `true` 会启用使用普通 Matrix 文本消息的“预览优先”草稿更新。`"quiet"` 为自托管推送规则设置使用不触发通知的预览通知。`false` 等同于 `"off"`。
- `blockStreaming`：`true` 会在草稿预览流式传输激活时，为已完成的智能体输出块启用单独的进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：线程绑定会话路由和生命周期的按渠道覆盖。
- `startupVerification`：启动时的自动自验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：自动启动验证请求重试前的冷却时间。
- `textChunkLimit`：出站消息按字符数分块时的块大小上限（在 `chunkMode` 为 `length` 时生效）。
- `chunkMode`：`length` 按字符数拆分消息；`newline` 按行边界拆分。
- `responsePrefix`：为该渠道所有出站回复添加的可选前缀字符串。
- `ackReaction`：该渠道/账号的可选确认 reaction 覆盖。
- `ackReactionScope`：可选的确认 reaction 作用域覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站 reaction 通知模式（`own`、`off`）。
- `mediaMaxMb`：出站发送和入站媒体处理的媒体大小上限（MB）。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认值：`off`。适用于所有 Matrix 邀请，包括私信式邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不会信任受邀房间声称的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：控制 OpenClaw 加入房间并将其识别为私信之后的私信访问权限。它不会改变邀请是否会被自动加入。
- `dm.allowFrom`：私信流量的 allowlist 用户 ID。完整 Matrix 用户 ID 最安全；精确目录匹配会在启动时以及监控运行期间 allowlist 变化时解析。无法解析的名称会被忽略。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。如果你希望每个 Matrix 私信房间都保留独立上下文，即使对端相同，也请使用 `per-room`。
- `dm.threadReplies`：仅限私信的线程策略覆盖（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，用于控制私信中的回复位置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许批准 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已经标识审批人时，此项可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：命名的按账号覆盖。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间的策略映射。优先使用房间 ID 或别名；无法解析的房间名称会在运行时被忽略。解析完成后，会话/群组标识使用稳定的房间 ID。
- `groups.<room>.account`：在多账号设置中，将某个继承的房间条目限制到特定 Matrix 账号。
- `groups.<room>.allowBots`：针对已配置机器人发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：按房间的发送者 allowlist。
- `groups.<room>.tools`：按房间的工具允许/拒绝覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 会禁用该房间的提及要求；`false` 会强制重新开启。
- `groups.<room>.skills`：可选的房间级 Skills 过滤器。
- `groups.<room>.systemPrompt`：可选的房间级系统提示片段。
- `rooms`：`groups` 的旧别名。
- `actions`：按操作的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固措施
