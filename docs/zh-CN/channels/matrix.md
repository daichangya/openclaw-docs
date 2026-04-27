---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-27T03:46:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f69a671e5151224a4050f9b1d28924b8450cf1a54dec1a7ea42ad1ed728060a
    source_path: channels/matrix.md
    workflow: 15
---

Matrix 是 OpenClaw 的内置渠道插件。
它使用官方的 `matrix-js-sdk`，并支持私信、房间、线程、媒体、回应、投票、位置和 E2EE。

## 内置插件

Matrix 作为当前 OpenClaw 版本中的内置插件随附，因此普通的打包构建不需要单独安装。

如果你使用的是较旧的构建版本，或者是排除了 Matrix 的自定义安装，请手动安装：

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
   - 较旧/自定义安装可以使用上述命令手动添加它。
2. 在你的 homeserver 上创建一个 Matrix 账号。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人开始私信，或邀请它加入房间。
   - 只有当 `channels.matrix.autoJoin` 允许时，新建的 Matrix 邀请才会生效。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导会询问：

- homeserver URL
- 认证方式：access token 或 password
- 用户 ID（仅密码认证）
- 可选的设备名称
- 是否启用 E2EE
- 是否配置房间访问和邀请自动加入

向导的关键行为：

- 如果 Matrix 认证环境变量已存在，并且该账号尚未在配置中保存认证信息，则向导会提供一个环境变量快捷方式，将认证信息保留在环境变量中。
- 账号名称会规范化为账号 ID。例如，`Ops Bot` 会变成 `ops-bot`。
- 私信允许列表条目可直接接受 `@user:server`；显示名称仅在实时目录查找找到一个精确匹配项时才可用。
- 房间允许列表条目可直接接受房间 ID 和别名。优先使用 `!room:server` 或 `#alias:server`；无法解析的名称会在运行时的允许列表解析中被忽略。
- 在邀请自动加入允许列表模式下，仅使用稳定的邀请目标：`!roomId:server`、`#alias:server` 或 `*`。纯房间名称会被拒绝。
- 若要在保存前解析房间名称，请使用 `openclaw channels resolve --channel matrix "Project Room"`。
- 当设置启用 E2EE 时，OpenClaw 会写入加密配置，并运行与 `openclaw matrix encryption setup` 相同的验证引导流程。

<Warning>
`channels.matrix.autoJoin` 默认为 `off`。

如果你不设置它，机器人将不会加入受邀房间或新的私信式邀请，因此除非你先手动加入，否则它不会出现在新群组或受邀私信中。

设置 `autoJoin: "allowlist"` 并同时配置 `autoJoinAllowlist`，可以限制它接受哪些邀请；或者设置 `autoJoin: "always"`，让它加入每一个邀请。

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

基于 token 的最小设置：

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

基于密码的设置（登录后会缓存 token）：

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
当这些位置存在缓存凭证时，即使当前认证信息未直接在配置中设置，OpenClaw 仍会在设置、Doctor 和渠道状态发现中将 Matrix 视为已配置。

对应的环境变量（当未设置配置键时使用）：

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

对于非默认账号，请使用带账号作用域的环境变量：

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
例如，`-` 会变成 `_X2D_`，因此 `ops-prod` 会映射到 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已存在，且所选账号尚未在配置中保存 Matrix 认证信息时，交互式向导才会提供环境变量快捷方式。

`MATRIX_HOMESERVER` 不能通过工作区 `.env` 设置；请参阅 [Workspace `.env` files](/zh-CN/gateway/security)。

## 配置示例

这是一个启用了私信配对、房间允许列表和 E2EE 的实用基线配置：

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

`autoJoin` 适用于所有 Matrix 邀请，包括私信式邀请。OpenClaw 无法在邀请发生时可靠地将受邀房间分类为私信还是群组，因此所有邀请都会先经过 `autoJoin`。`dm.policy` 会在机器人加入之后、并且该房间被分类为私信后再生效。

## 流式预览

Matrix 回复流式传输为可选启用。

当你希望 OpenClaw 发送一条实时预览回复、在模型生成文本期间原地编辑该预览，并在回复完成后将其定稿时，请将 `channels.matrix.streaming` 设置为 `"partial"`：

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
- `streaming: "partial"` 会为当前智能体块创建一条可编辑的预览消息，使用普通 Matrix 文本消息。这会保留 Matrix 旧式的“预览优先”通知行为，因此标准客户端可能会在首次流式预览文本时发送通知，而不是在完成的内容块上发送通知。
- `streaming: "quiet"` 会为当前智能体块创建一条可编辑的静默预览通知。只有当你同时为最终定稿的预览编辑配置了接收者推送规则时，才应使用此选项。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。启用预览流式传输时，Matrix 会为当前块保留实时草稿，并将已完成的块保留为单独消息。
- 当预览流式传输开启且 `blockStreaming` 关闭时，Matrix 会原地编辑实时草稿，并在块或轮次完成时定稿该同一事件。
- 如果预览内容已无法容纳在单个 Matrix 事件中，OpenClaw 会停止预览流式传输，并回退到普通最终投递。
- 媒体回复仍会正常发送附件。如果过期的预览已无法安全复用，OpenClaw 会在发送最终媒体回复之前将其隐藏。
- 预览编辑会增加额外的 Matrix API 调用。如果你希望使用最保守的限流行为，请保持关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
使用 `streaming: "partial"` 或 `streaming: "quiet"` 来启用预览编辑；只有在你还希望已完成的智能体块以单独进度消息形式保留可见时，再额外设置 `blockStreaming: true`。

如果你需要标准 Matrix 通知而不想配置自定义推送规则，请使用 `streaming: "partial"` 以获得“预览优先”行为，或保持 `streaming` 关闭以仅进行最终投递。使用 `streaming: "off"` 时：

- `blockStreaming: true` 会将每个已完成块作为普通可通知的 Matrix 消息发送。
- `blockStreaming: false` 只会将最终完成的回复作为普通可通知的 Matrix 消息发送。

### 用于静默定稿预览的自托管推送规则

静默流式传输（`streaming: "quiet"`）仅在某个块或轮次定稿后通知接收者——需要一条按用户生效的推送规则来匹配定稿后的预览标记。完整设置（接收者 token、pusher 检查、规则安装、按 homeserver 的说明）请参阅 [Matrix push rules for quiet previews](/zh-CN/channels/matrix-push-rules)。

## Bot-to-bot 房间

默认情况下，来自其他已配置 OpenClaw Matrix 账号的 Matrix 消息会被忽略。

当你明确希望启用智能体之间的 Matrix 通信时，请使用 `allowBots`：

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
- `allowBots: "mentions"` 仅在这些消息在房间中明确提到此机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖单个房间的账号级设置。
- OpenClaw 仍会忽略来自同一 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不提供原生的机器人标记；OpenClaw 将“由机器人发送”视为“由此 OpenClaw Gateway 网关上的另一个已配置 Matrix 账号发送”。

在共享房间中启用 bot-to-bot 流量时，请使用严格的房间允许列表和提及要求。

## 加密与验证

在加密（E2EE）房间中，出站图片事件会使用 `thumbnail_file`，因此图片预览会与完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需任何配置——该插件会自动检测 E2EE 状态。

推荐的设置流程：

```bash
openclaw matrix encryption setup
```

这会启用 `channels.matrix.encryption`，引导 Matrix secret storage 和 cross-signing，在需要时创建房间密钥备份状态，然后输出当前验证和备份状态以及后续步骤。

对于新账号，请在创建账号时启用 E2EE：

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

多账号设置可以针对特定账号：

```bash
openclaw matrix encryption setup --account assistant
```

等效的手动配置：

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

验证命令（全部都支持 `--verbose` 用于诊断，支持 `--json` 用于机器可读输出）：

```bash
openclaw matrix verify status
```

详细状态（完整诊断）：

```bash
openclaw matrix verify status --verbose
```

在机器可读输出中包含存储的恢复密钥：

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

在引导前强制执行全新的 cross-signing 身份重置：

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

使用恢复密钥验证此设备：

```bash
openclaw matrix verify device "<your-recovery-key>"
```

此命令会报告三个独立状态：

- `Recovery key accepted`：Matrix 已接受该恢复密钥，用于 secret storage 或设备信任。
- `Backup usable`：可使用受信任的恢复材料加载房间密钥备份。
- `Device verified by owner`：当前 OpenClaw 设备已获得完整的 Matrix cross-signing 身份信任。

详细输出或 JSON 输出中的 `Signed by owner` 仅用于诊断。除非 `Cross-signing verified` 也为 `yes`，否则 OpenClaw 不会将其视为足够。

即使恢复密钥可以解锁备份材料，只要完整的 Matrix 身份信任尚未完成，此命令仍会以非零状态退出。在这种情况下，请从另一个 Matrix 客户端完成自验证：

```bash
openclaw matrix verify self
```

在另一个 Matrix 客户端中接受请求，比较 SAS 表情符号或数字，并且仅在它们匹配时输入 `yes`。该命令会等待 Matrix 报告 `Cross-signing verified: yes`，然后才会成功退出。

仅当你明确想要替换当前 cross-signing 身份时，才使用 `verify bootstrap --force-reset-cross-signing`。

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

如果备份密钥尚未加载到磁盘，请传入 Matrix 恢复密钥：

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

交互式自验证流程：

```bash
openclaw matrix verify self
```

对于更底层或入站验证请求，请使用：

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

使用 `openclaw matrix verify cancel <id>` 可取消请求。

详细的恢复诊断：

```bash
openclaw matrix verify backup restore --verbose
```

删除当前服务器备份并创建一个全新的备份基线。如果存储的备份密钥无法被干净地加载，此重置也可以重新创建 secret storage，以便未来冷启动时能够加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

所有 `verify` 命令默认都保持简洁（包括安静的内部 SDK 日志），只有在使用 `--verbose` 时才会显示详细诊断信息。
在编写脚本时，请使用 `--json` 获取完整的机器可读输出。

在多账号设置中，Matrix CLI 命令会使用隐式的 Matrix 默认账号，除非你传入 `--account <id>`。
如果你配置了多个命名账号，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作会停止并要求你显式选择一个账号。
当你希望验证或设备操作明确针对某个命名账号时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当某个命名账号的加密被禁用或不可用时，Matrix 警告和验证错误会指向该账号的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="已验证的含义">
    只有当你自己的 cross-signing 身份对设备进行了签名时，OpenClaw 才会将设备视为已验证。`verify status --verbose` 会显示三种信任信号：

    - `Locally trusted`：仅被此客户端本地信任
    - `Cross-signing verified`：SDK 报告已通过 cross-signing 完成验证
    - `Signed by owner`：已由你自己的 self-signing 密钥签名

    只有在存在 cross-signing 验证时，`Verified by owner` 才会变为 `yes`。
    仅有本地信任或 owner 签名本身，并不足以让 OpenClaw 将该设备视为完全已验证。

  </Accordion>

  <Accordion title="bootstrap 的作用">
    `verify bootstrap` 是加密账号的修复与设置命令。它会按以下顺序执行：

    - 引导 secret storage，并在可能时复用现有恢复密钥
    - 引导 cross-signing 并上传缺失的公开 cross-signing 密钥
    - 标记并 cross-sign 当前设备
    - 如果服务器端尚不存在房间密钥备份，则创建一个

    如果 homeserver 需要 UIA 才能上传 cross-signing 密钥，OpenClaw 会先尝试无认证方式，然后尝试 `m.login.dummy`，最后尝试 `m.login.password`（需要 `channels.matrix.password`）。只有在你明确要丢弃当前身份时，才使用 `--force-reset-cross-signing`。

  </Accordion>

  <Accordion title="全新的备份基线">
    如果你想让未来的加密消息继续可用，并接受丢失无法恢复的旧历史记录：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    添加 `--account <id>` 可针对某个命名账号。这也可以在当前备份密钥无法安全加载时重新创建 secret storage。
    仅当你明确希望旧恢复密钥不再能解锁新的备份基线时，才添加 `--rotate-recovery-key`。

  </Accordion>

  <Accordion title="启动行为">
    当 `encryption: true` 时，`startupVerification` 默认为 `"if-unverified"`。启动时，未验证设备会在另一个 Matrix 客户端中请求自验证，同时跳过重复请求并应用冷却时间。可通过 `startupVerificationCooldownHours` 调整，或通过 `startupVerification: "off"` 禁用。

    启动时还会执行一次保守的加密 bootstrap 过程，复用当前的 secret storage 和 cross-signing 身份。如果 bootstrap 状态损坏，即使没有 `channels.matrix.password`，OpenClaw 也会尝试进行受保护的修复；如果 homeserver 需要密码 UIA，启动时会记录警告且不会视为致命错误。已由 owner 签名的设备会被保留。

    完整升级流程请参阅 [Matrix migration](/zh-CN/install/migrating-matrix)。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 会将验证生命周期通知作为 `m.notice` 消息发布到严格的私信验证房间中：请求、就绪（附带“通过表情符号验证”的说明）、开始/完成，以及在可用时附带 SAS（表情符号/数字）详情。

    来自另一个 Matrix 客户端的入站请求会被跟踪并自动接受。对于自验证，OpenClaw 会在表情符号验证可用后自动启动 SAS 流程并确认自身这一侧——但你仍然需要在你的 Matrix 客户端中比较并确认 “They match”。

    验证系统通知不会被转发到智能体聊天流水线。

  </Accordion>

  <Accordion title="已删除或无效的 Matrix 设备">
    如果 `verify status` 表示当前设备已不再列在 homeserver 上，请创建一个新的 OpenClaw Matrix 设备。对于密码登录：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    对于 token 认证，请在你的 Matrix 客户端或管理 UI 中创建一个新的 access token，然后更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    将 `assistant` 替换为失败命令中的账号 ID，或者对默认账号省略 `--account`。

  </Accordion>

  <Accordion title="设备清理">
    由 OpenClaw 管理的旧设备可能会不断累积。可列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密存储">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路径，并以 `fake-indexeddb` 作为 IndexedDB shim。加密状态会持久化到 `crypto-idb-snapshot.json`（采用严格的文件权限）。

    加密运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，其中包括同步存储、加密存储、恢复密钥、IDB 快照、线程绑定和启动验证状态。当 token 发生变化但账号身份保持不变时，OpenClaw 会复用现有的最佳根目录，以便先前状态仍然可见。

  </Accordion>
</AccordionGroup>

## 个人资料管理

使用以下命令更新所选账号的 Matrix 自身资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

当你希望明确针对某个命名 Matrix 账号时，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后把解析后的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账号的覆盖项）中。

## 线程

Matrix 同时支持用于自动回复和消息工具发送的原生 Matrix 线程。

- `dm.sessionScope: "per-user"`（默认）会让 Matrix 私信路由保持发送者作用域，因此多个私信房间在解析为同一对端时可以共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离为各自独立的会话键，同时仍使用正常的私信认证和允许列表检查。
- 显式的 Matrix 会话绑定仍然优先于 `dm.sessionScope`，因此已绑定的房间和线程会继续使用其所选目标会话。
- `threadReplies: "off"` 会让回复保持在顶层，并将入站线程消息保留在父会话上。
- `threadReplies: "inbound"` 仅当入站消息本来就在该线程中时，才在线程内回复。
- `threadReplies: "always"` 会将房间回复保留在线程中，并以触发消息为根，同时从第一条触发消息开始，通过匹配的线程作用域会话来路由该会话。
- `dm.threadReplies` 仅覆盖私信的顶层设置。例如，你可以让房间线程保持隔离，同时让私信保持扁平。
- 入站线程消息会将线程根消息作为额外的智能体上下文包含进来。
- 消息工具发送会在目标为同一房间或同一私信用户目标时自动继承当前 Matrix 线程，除非明确提供了 `threadId`。
- 同一会话的私信用户目标复用，仅当当前会话元数据能够证明是同一 Matrix 账号上的同一私信对端时才会生效；否则 OpenClaw 会回退到正常的用户作用域路由。
- 当 OpenClaw 发现某个 Matrix 私信房间与同一共享 Matrix 私信会话上的另一个私信房间发生冲突时，如果启用了线程绑定并设置了 `dm.sessionScope` 提示，它会在该房间中发布一次性 `m.notice`，提示可使用 `/focus` 作为逃生口。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和线程绑定的 `/acp spawn` 都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions=true` 时，在顶层 Matrix 房间/私信中执行 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程内运行 `/focus` 或 `/acp spawn --thread here`，则会改为绑定当前线程。

## ACP 会话绑定

Matrix 房间、私信和现有 Matrix 线程都可以转换为持久化 ACP 工作区，而无需改变聊天界面。

快速操作流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会保持为聊天界面，后续消息会路由到生成的 ACP 会话。
- 在现有线程中，`--bind here` 会将当前线程原地绑定。
- `/new` 和 `/reset` 会原地重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

注意：

- `--bind here` 不会创建子 Matrix 线程。
- `threadBindings.spawnAcpSessions` 仅在 `/acp spawn --thread auto|here` 时需要，因为此时 OpenClaw 需要创建或绑定一个子 Matrix 线程。

### 线程绑定配置

Matrix 会继承来自 `session.threadBindings` 的全局默认值，同时也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 的线程绑定 spawn 标志为可选启用：

- 设置 `threadBindings.spawnSubagentSessions: true`，允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true`，允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 回应

Matrix 支持出站回应操作、入站回应通知和入站确认回应。

- 出站回应工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 会向特定 Matrix 事件添加一个回应。
- `reactions` 会列出特定 Matrix 事件当前的回应摘要。
- `emoji=""` 会移除机器人账号在该事件上的自身回应。
- `remove: true` 仅移除机器人账号对指定表情符号的回应。

确认回应使用标准 OpenClaw 解析顺序：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退值

确认回应作用域按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

回应通知模式按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认值：`own`

行为：

- `reactionNotifications: "own"` 会在目标为机器人所发送的 Matrix 消息时，转发新增的 `m.reaction` 事件。
- `reactionNotifications: "off"` 会禁用回应系统事件。
- 回应移除不会被合成为系统事件，因为 Matrix 将其表现为 redaction，而不是独立的 `m.reaction` 移除事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，作为 `InboundHistory` 包含多少条最近房间消息。它会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则实际默认值为 `0`。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍使用普通会话历史。
- Matrix 房间历史为“仅待处理”模式：OpenClaw 会缓冲那些尚未触发回复的房间消息，然后在提及或其他触发到来时对该窗口进行快照。
- 当前触发消息不会包含在 `InboundHistory` 中；它会保留在该轮次的主入站正文中。
- 对同一 Matrix 事件的重试会复用原始历史快照，而不会漂移到较新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收时原样保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅包含通过当前房间/用户允许列表检查的发送者。
- `contextVisibility: "allowlist_quote"` 的行为类似 `allowlist`，但仍会保留一条显式引用回复。

此设置影响的是补充上下文的可见性，而不是入站消息本身是否可以触发回复。
触发授权仍由 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置决定。

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

有关提及门控和允许列表行为，请参阅 [Groups](/zh-CN/channels/groups)。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个尚未获批的 Matrix 用户在获批前持续向你发送消息，OpenClaw 会复用同一个待处理配对码，并且可能会在短暂冷却后再次发送提醒回复，而不是生成新的代码。

有关共享的私信配对流程和存储布局，请参阅 [Pairing](/zh-CN/channels/pairing)。

## 直接房间修复

如果私信状态不同步，OpenClaw 可能最终会留下陈旧的 `m.direct` 映射，将其指向旧的单聊房间，而不是当前活跃的私信。可使用以下命令检查某个对端当前的映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复流程：

- 优先选择已映射在 `m.direct` 中的严格 1:1 私信
- 如果没有，则回退到当前已加入、与该用户的任意严格 1:1 私信
- 如果不存在健康的私信，则创建一个新的直接房间并重写 `m.direct`

修复流程不会自动删除旧房间。它只会选择健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他直接消息流程再次定向到正确的房间。

## Exec 审批

Matrix 可以作为 Matrix 账号的原生审批客户端。原生私信/渠道路由开关仍位于 exec 审批配置下：

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；会回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认值：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批人必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，且至少有一个审批人可被解析时，Matrix 会自动启用原生审批。Exec 审批会优先使用 `execApprovals.approvers`，并可回退到 `channels.matrix.dm.allowFrom`。插件审批通过 `channels.matrix.dm.allowFrom` 进行授权。设置 `enabled: false` 可显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路由或审批回退策略。

Matrix 原生路由支持这两类审批：

- `channels.matrix.execApprovals.*` 控制 Matrix 审批提示的原生私信/渠道扇出模式。
- Exec 审批使用来自 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 的 exec 审批人集合。
- 插件审批使用来自 `channels.matrix.dm.allowFrom` 的 Matrix 私信允许列表。
- Matrix 回应快捷方式和消息更新同时适用于 exec 和插件审批。

投递规则：

- `target: "dm"` 会将审批提示发送到审批人的私信
- `target: "channel"` 会将提示发回原始 Matrix 房间或私信
- `target: "both"` 会同时发送到审批人的私信以及原始 Matrix 房间或私信

Matrix 审批提示会在主审批消息上预置回应快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 在当前生效的 exec 策略允许该决策时始终允许

审批人可以对此消息添加回应，也可以使用回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批人才能批准或拒绝。对于 exec 审批，渠道投递包含命令文本，因此仅应在受信任房间中启用 `channel` 或 `both`。

按账号覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档： [Exec approvals](/zh-CN/tools/exec-approvals)

## 斜杠命令

Matrix 斜杠命令（例如 `/new`、`/reset`、`/model`）可直接在私信中使用。在房间中，OpenClaw 也能识别以前缀为机器人自身 Matrix 提及的斜杠命令，因此 `@bot:server /new` 会触发命令路径，而无需自定义提及正则。这使得机器人能够响应 Element 和类似客户端在用户先 Tab 补全机器人再输入命令时发出的房间式 `@mention /command` 帖子。

授权规则仍然适用：命令发送者必须像普通消息一样满足私信或房间允许列表/owner 策略。

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
你可以使用 `groups.<room>.account` 将继承的房间条目限定到某个 Matrix 账号。
未设置 `account` 的条目会在所有 Matrix 账号之间共享，而设置了 `account: "default"` 的条目在默认账号直接配置于顶层 `channels.matrix.*` 时仍然有效。
部分共享认证默认值本身不会创建一个单独的隐式默认账号。只有当该默认值具备新的认证信息（`homeserver` 加 `accessToken`，或 `homeserver` 加 `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账号；命名账号在稍后由缓存凭证满足认证时，仍然可以通过 `homeserver` 加 `userId` 保持可发现状态。
如果 Matrix 已经正好有一个命名账号，或者 `defaultAccount` 指向现有的命名账号键，则单账号到多账号的修复/设置升级会保留该账号，而不是创建新的 `accounts.default` 条目。只有 Matrix 认证/bootstrap 键会移动到该提升后的账号中；共享的投递策略键仍保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账号时，请设置 `defaultAccount`。
如果配置了多个 Matrix 账号，且其中一个账号 ID 为 `default`，即使 `defaultAccount` 未设置，OpenClaw 也会隐式使用该账号。
如果你配置了多个命名账号，请设置 `defaultAccount`，或者为依赖隐式账号选择的 CLI 命令传入 `--account <id>`。
当你希望对单个命令覆盖这种隐式选择时，请为 `openclaw matrix verify ...` 和 `openclaw matrix devices ...` 传入 `--account <id>`。

共享多账号模式请参阅 [Configuration reference](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 私有/LAN homeserver

默认情况下，出于 SSRF 保护考虑，OpenClaw 会阻止私有/内部 Matrix homeserver，除非你针对每个账号显式选择启用。

如果你的 homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该 Matrix 账号启用 `network.dangerouslyAllowPrivateNetwork`：

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

此选择启用仅允许受信任的私有/内部目标。诸如 `http://matrix.example.org:8008` 之类的公共明文 homeserver 仍会被阻止。尽可能优先使用 `https://`。

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

命名账号可以使用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会对运行时 Matrix 流量和账号状态探测使用同一个代理设置。

## 目标解析

无论 OpenClaw 在何处要求你提供房间或用户目标，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房间 ID 区分大小写。在配置显式投递目标、cron 作业、绑定或允许列表时，请使用 Matrix 中房间 ID 的精确大小写。
OpenClaw 会将内部会话键保持为规范形式以供存储，因此这些小写键不能作为 Matrix 投递 ID 的可靠来源。

实时目录查找使用当前登录的 Matrix 账号：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式房间 ID 和别名，然后回退到搜索该账号已加入的房间名称。
- 已加入房间名称查找是尽力而为的。如果某个房间名称无法解析为 ID 或别名，它会在运行时允许列表解析中被忽略。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账号的可选标签。
- `defaultAccount`：配置了多个 Matrix 账号时的首选账号 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此 Matrix 账号连接到私有/内部 homeserver。当 homeserver 解析到 `localhost`、LAN/Tailscale IP 或内部主机（例如 `matrix-synapse`）时启用此项。
- `proxy`：用于 Matrix 流量的可选 HTTP(S) 代理 URL。命名账号可以用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整的 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：基于 token 的认证所使用的 access token。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 在 env/file/exec provider 中均支持纯文本值和 SecretRef 值。请参阅 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：基于密码登录所使用的密码。支持纯文本值和 SecretRef 值。
- `deviceId`：显式的 Matrix 设备 ID。
- `deviceName`：用于密码登录的设备显示名称。
- `avatarUrl`：用于资料同步和 `profile set` 更新的已存储自身头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。
- `encryption`：启用 E2EE。
- `allowlistOnly`：当为 `true` 时，会将 `open` 房间策略升级为 `allowlist`，并强制除 `disabled` 之外的所有活动私信策略（包括 `pairing` 和 `open`）变为 `allowlist`。不影响 `disabled` 策略。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账号的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文的可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的用户 ID 允许列表。完整 Matrix 用户 ID 最安全；精确目录匹配会在启动时以及监视器运行期间允许列表变更时进行解析。无法解析的名称会被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则实际默认值为 `0`。设置为 `0` 可禁用。
- `replyToMode`：`off`、`first`、`all` 或 `batched`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`"partial"`、`"quiet"`、`true` 或 `false`。`"partial"` 和 `true` 会使用普通 Matrix 文本消息启用“预览优先”的草稿更新。`"quiet"` 对自托管推送规则设置使用不触发通知的预览通知。`false` 等同于 `"off"`。
- `blockStreaming`：`true` 会在草稿预览流式传输激活时，为已完成的智能体块启用独立进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：按渠道覆盖线程绑定的会话路由和生命周期。
- `startupVerification`：启动时自动自验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：重试自动启动验证请求前的冷却时间。
- `textChunkLimit`：出站消息按字符数分块时的块大小上限（当 `chunkMode` 为 `length` 时适用）。
- `chunkMode`：`length` 按字符数拆分消息；`newline` 按行边界拆分。
- `responsePrefix`：为此渠道的所有出站回复添加的可选前缀字符串。
- `ackReaction`：此渠道/账号的可选确认回应覆盖值。
- `ackReactionScope`：可选的确认回应作用域覆盖值（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站回应通知模式（`own`、`off`）。
- `mediaMaxMb`：出站发送和入站媒体处理的媒体大小上限，单位为 MB。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认值：`off`。适用于所有 Matrix 邀请，包括私信式邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不信任受邀房间所声明的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：控制 OpenClaw 加入房间并将其分类为私信之后的私信访问权限。它不会改变邀请是否会被自动加入。
- `dm.allowFrom`：私信流量的用户 ID 允许列表。完整 Matrix 用户 ID 最安全；精确目录匹配会在启动时以及监视器运行期间允许列表变更时进行解析。无法解析的名称会被忽略。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。如果你希望每个 Matrix 私信房间即使对端相同也保持独立上下文，请使用 `per-room`。
- `dm.threadReplies`：仅用于私信的线程策略覆盖值（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，影响私信中的回复位置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许审批 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已经标识审批人时，此项可选。
- `execApprovals.target`：`dm | channel | both`（默认值：`dm`）。
- `accounts`：按账号命名的覆盖项。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间的策略映射。优先使用房间 ID 或别名；无法解析的房间名称会在运行时被忽略。解析后，会话/群组身份使用稳定的房间 ID。
- `groups.<room>.account`：在多账号设置中，将一个继承的房间条目限制到某个特定 Matrix 账号。
- `groups.<room>.allowBots`：针对已配置机器人发送者的房间级覆盖值（`true` 或 `"mentions"`）。
- `groups.<room>.users`：按房间的发送者允许列表。
- `groups.<room>.tools`：按房间的工具允许/拒绝覆盖值。
- `groups.<room>.autoReply`：房间级提及门控覆盖值。`true` 会禁用该房间的提及要求；`false` 会强制重新启用。
- `groups.<room>.skills`：可选的房间级 Skills 过滤器。
- `groups.<room>.systemPrompt`：可选的房间级 system prompt 片段。
- `rooms`：`groups` 的旧别名。
- `actions`：按操作的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信认证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型和加固
