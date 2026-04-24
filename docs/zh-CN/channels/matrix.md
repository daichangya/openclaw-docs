---
read_when:
    - 在 OpenClaw 中设置 Matrix
    - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
    generated_at: "2026-04-24T22:02:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix 是 OpenClaw 的一个内置渠道插件。
它使用官方的 `matrix-js-sdk`，并支持私信、房间、线程、媒体、表情回应、投票、位置和 E2EE。

## 内置插件

Matrix 在当前的 OpenClaw 版本中作为内置插件提供，因此普通的打包构建不需要单独安装。

如果你使用的是较旧的构建版本，或者是排除了 Matrix 的自定义安装，请手动安装：

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出目录安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

有关插件行为和安装规则，请参阅 [Plugins](/zh-CN/tools/plugin)。

## 设置

1. 确保 Matrix 插件可用。
   - 当前打包发布的 OpenClaw 版本已内置它。
   - 较旧版本或自定义安装可以使用上面的命令手动添加它。
2. 在你的 homeserver 上创建一个 Matrix 账户。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 与机器人开始私信，或邀请它加入房间。
   - 只有当 `channels.matrix.autoJoin` 允许时，新发出的 Matrix 邀请才会生效。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导会询问以下内容：

- homeserver URL
- 认证方式：access token 或 password
- 用户 ID（仅密码认证）
- 可选的设备名称
- 是否启用 E2EE
- 是否配置房间访问和邀请自动加入

向导的关键行为：

- 如果 Matrix 认证环境变量已经存在，并且该账户的认证信息尚未保存在配置中，向导会提供一个环境变量快捷方式，以将认证信息保留在环境变量中。
- 账户名称会规范化为账户 ID。例如，`Ops Bot` 会变为 `ops-bot`。
- 私信允许列表条目可直接接受 `@user:server`；显示名称只有在实时目录查找能找到唯一精确匹配时才有效。
- 房间允许列表条目可直接接受房间 ID 和别名。优先使用 `!room:server` 或 `#alias:server`；无法解析的名称在运行时的允许列表解析中会被忽略。
- 在邀请自动加入的允许列表模式下，只能使用稳定的邀请目标：`!roomId:server`、`#alias:server` 或 `*`。纯房间名称会被拒绝。
- 若要在保存前解析房间名称，请使用 `openclaw channels resolve --channel matrix "Project Room"`。

<Warning>
`channels.matrix.autoJoin` 的默认值是 `off`。

如果你不设置它，机器人将不会加入被邀请的房间或新的私信式邀请，因此除非你先手动加入，否则它不会出现在新群组或被邀请的私信中。

设置 `autoJoin: "allowlist"` 并配合 `autoJoinAllowlist` 可限制它接受哪些邀请；如果你希望它加入每一个邀请，则设置 `autoJoin: "always"`。

在 `allowlist` 模式下，`autoJoinAllowlist` 只接受 `!roomId:server`、`#alias:server` 或 `*`。
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
默认账户使用 `credentials.json`；命名账户使用 `credentials-<account>.json`。
如果那里存在缓存凭证，即使当前认证信息没有直接在配置中设置，OpenClaw 仍会在设置、Doctor 和渠道状态发现中将 Matrix 视为已配置。

对应的环境变量（当配置键未设置时使用）：

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

Matrix 会对账户 ID 中的标点进行转义，以避免带作用域的环境变量发生冲突。
例如，`-` 会变为 `_X2D_`，因此 `ops-prod` 会映射为 `MATRIX_OPS_X2D_PROD_*`。

只有当这些认证环境变量已经存在，并且所选账户还没有在配置中保存 Matrix 认证信息时，交互式向导才会提供环境变量快捷方式。

`MATRIX_HOMESERVER` 不能通过工作区 `.env` 设置；请参阅 [Workspace `.env` files](/zh-CN/gateway/security)。

## 配置示例

这是一个实用的基线配置，启用了私信配对、房间允许列表和 E2EE：

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

`autoJoin` 适用于所有 Matrix 邀请，包括私信式邀请。OpenClaw 无法在邀请时可靠地将被邀请的房间分类为私信或群组，因此所有邀请都会先经过 `autoJoin`。`dm.policy` 会在机器人加入房间并且该房间被分类为私信后再生效。

## 流式预览

Matrix 回复流式传输是选择启用的。

当你希望 OpenClaw 发送一条实时预览回复、在模型生成文本时原地编辑该预览，并在回复完成后将其定稿时，请将 `channels.matrix.streaming` 设置为 `"partial"`：

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
- `streaming: "partial"` 会为当前 assistant 块创建一条可编辑的预览消息，使用的是普通 Matrix 文本消息。这会保留 Matrix 旧式的“先预览后通知”行为，因此标准客户端可能会在第一次流式预览文本时发出通知，而不是在最终完成的块上通知。
- `streaming: "quiet"` 会为当前 assistant 块创建一条可编辑的静默预览通知。只有当你同时为最终定稿的预览编辑配置了接收方 push rules 时，才应使用此模式。
- `blockStreaming: true` 会启用单独的 Matrix 进度消息。启用预览流式传输后，Matrix 会为当前块保留实时草稿，并将已完成的块保留为单独的消息。
- 当预览流式传输开启且 `blockStreaming` 关闭时，Matrix 会原地编辑实时草稿，并在块或轮次结束时定稿同一个事件。
- 如果预览内容已无法容纳在单个 Matrix 事件中，OpenClaw 会停止预览流式传输并回退到普通的最终投递。
- 媒体回复仍会正常发送附件。如果某个过期的预览已无法安全复用，OpenClaw 会在发送最终媒体回复前将其撤销。
- 预览编辑会产生额外的 Matrix API 调用。如果你希望采用最保守的速率限制行为，请保持关闭流式传输。

`blockStreaming` 本身不会启用草稿预览。
使用 `streaming: "partial"` 或 `streaming: "quiet"` 来启用预览编辑；如果你还希望已完成的 assistant 块保留为单独的进度消息，再额外设置 `blockStreaming: true`。

如果你需要标准 Matrix 通知而不想使用自定义 push rules，请使用 `streaming: "partial"` 以获得“先预览后通知”的行为，或者保持 `streaming` 关闭以仅投递最终消息。使用 `streaming: "off"` 时：

- `blockStreaming: true` 会将每个已完成的块作为普通的可通知 Matrix 消息发送。
- `blockStreaming: false` 只会将最终完成的回复作为普通的可通知 Matrix 消息发送。

### 自托管的静默定稿预览 push rules

静默流式传输（`streaming: "quiet"`）只有在一个块或轮次定稿后才会通知接收者——必须有一条按用户生效的 push rule 匹配已定稿的预览标记。完整设置（接收方 token、pusher 检查、规则安装、各 homeserver 说明）请参阅 [Matrix push rules for quiet previews](/zh-CN/channels/matrix-push-rules)。

## 机器人到机器人房间

默认情况下，来自其他已配置 OpenClaw Matrix 账户的 Matrix 消息会被忽略。

当你确实希望启用智能体之间的 Matrix 通信时，请使用 `allowBots`：

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
- `allowBots: "mentions"` 仅在这些消息在房间中明确提到该机器人时才接受。私信仍然允许。
- `groups.<room>.allowBots` 会覆盖单个房间的账户级设置。
- OpenClaw 仍会忽略来自同一个 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里不提供原生的机器人标记；OpenClaw 将“由机器人撰写”视为“由此 OpenClaw Gateway 网关上另一个已配置的 Matrix 账户发送”。

在共享房间中启用机器人到机器人通信时，请使用严格的房间允许列表和提及要求。

## 加密和验证

在加密的（E2EE）房间中，出站图片事件会使用 `thumbnail_file`，这样图片预览会与完整附件一起加密。未加密房间仍使用普通的 `thumbnail_url`。无需任何配置——该插件会自动检测 E2EE 状态。

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

验证命令（全部支持 `--verbose` 用于诊断，支持 `--json` 用于机器可读输出）：

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

详细引导诊断：

```bash
openclaw matrix verify bootstrap --verbose
```

在引导前强制执行一次全新的 cross-signing 身份重置：

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

使用恢复密钥验证此设备：

```bash
openclaw matrix verify device "<your-recovery-key>"
```

此命令会报告三个独立状态：

- `Recovery key accepted`：Matrix 已接受该恢复密钥，可用于秘密存储或设备信任。
- `Backup usable`：可以使用受信任的恢复材料加载房间密钥备份。
- `Device verified by owner`：当前 OpenClaw 设备已获得完整的 Matrix cross-signing 身份信任。

详细输出或 JSON 输出中的 `Signed by owner` 仅用于诊断。除非 `Cross-signing verified` 也是 `yes`，否则 OpenClaw 不会将其视为充分条件。

即使恢复密钥可以解锁备份材料，只要完整的 Matrix 身份信任尚未完成，该命令仍会以非零状态退出。
在这种情况下，请从另一个 Matrix 客户端完成自我验证：

```bash
openclaw matrix verify self
```

在另一个 Matrix 客户端中接受请求，比较 SAS 表情符号或数字，
仅在它们匹配时输入 `yes`。该命令会等待 Matrix 报告
`Cross-signing verified: yes` 后才会成功退出。

仅当你明确希望替换当前的 cross-signing 身份时，
才使用 `verify bootstrap --force-reset-cross-signing`。

详细设备验证信息：

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

检查房间密钥备份健康状态：

```bash
openclaw matrix verify backup status
```

详细备份健康状态诊断：

```bash
openclaw matrix verify backup status --verbose
```

从服务器备份恢复房间密钥：

```bash
openclaw matrix verify backup restore
```

交互式自我验证流程：

```bash
openclaw matrix verify self
```

对于更底层或入站的验证请求，请使用：

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

使用 `openclaw matrix verify cancel <id>` 取消请求。

详细恢复诊断：

```bash
openclaw matrix verify backup restore --verbose
```

删除当前服务器备份并创建一个全新的备份基线。如果存储的
备份密钥无法被干净地加载，此重置还可以重新创建秘密存储，以便
未来冷启动时能够加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

默认情况下，所有 `verify` 命令都保持简洁（包括安静的内部 SDK 日志），只有在使用 `--verbose` 时才显示详细诊断信息。
编写脚本时请使用 `--json` 获取完整的机器可读输出。

在多账户设置中，除非你传入 `--account <id>`，否则 Matrix CLI 命令会使用隐式的 Matrix 默认账户。
如果你配置了多个命名账户，请先设置 `channels.matrix.defaultAccount`，否则这些隐式 CLI 操作将停止并要求你显式选择一个账户。
当你希望验证或设备操作明确指向某个命名账户时，请使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当某个命名账户的加密被禁用或不可用时，Matrix 警告和验证错误会指向该账户的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="验证的含义">
    只有当你自己的 cross-signing 身份对设备进行签名时，OpenClaw 才会将该设备视为已验证。`verify status --verbose` 会显示三个信任信号：

    - `Locally trusted`：仅被此客户端信任
    - `Cross-signing verified`：SDK 报告该设备已通过 cross-signing 验证
    - `Signed by owner`：已由你自己的 self-signing 密钥签名

    只有在存在 cross-signing 验证时，`Verified by owner` 才会变为 `yes`。
    仅有本地信任或所有者签名本身，都不足以让 OpenClaw 将
    该设备视为完全已验证。

  </Accordion>

  <Accordion title="bootstrap 的作用">
    `verify bootstrap` 是加密账户的修复和设置命令。按顺序，它会：

    - 引导秘密存储，并在可能时复用现有恢复密钥
    - 引导 cross-signing，并上传缺失的公开 cross-signing 密钥
    - 标记并进行当前设备的 cross-signing
    - 如果服务器端房间密钥备份尚不存在，则创建一个

    如果 homeserver 需要 UIA 才能上传 cross-signing 密钥，OpenClaw 会先尝试无认证，然后尝试 `m.login.dummy`，再尝试 `m.login.password`（需要 `channels.matrix.password`）。只有在你明确要丢弃当前身份时，才使用 `--force-reset-cross-signing`。

  </Accordion>

  <Accordion title="全新的备份基线">
    如果你希望未来的加密消息继续可用，并接受丢失无法恢复的旧历史记录：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    添加 `--account <id>` 以指向某个命名账户。如果当前备份秘密无法安全加载，这也可以重新创建秘密存储。

  </Accordion>

  <Accordion title="启动行为">
    当 `encryption: true` 时，`startupVerification` 默认值为 `"if-unverified"`。启动时，未验证的设备会在另一个 Matrix 客户端中请求自我验证，同时跳过重复请求并应用冷却时间。可使用 `startupVerificationCooldownHours` 调整，或使用 `startupVerification: "off"` 禁用。

    启动时还会运行一次保守的加密 bootstrap 检查，复用当前的秘密存储和 cross-signing 身份。如果 bootstrap 状态已损坏，即使没有 `channels.matrix.password`，OpenClaw 也会尝试受保护的修复；如果 homeserver 需要密码 UIA，启动时会记录一条警告，但不会导致致命错误。已由所有者签名的设备会被保留。

    完整升级流程请参阅 [Matrix migration](/zh-CN/install/migrating-matrix)。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 会将验证生命周期通知作为 `m.notice` 消息发布到严格私信验证房间中：请求、就绪（包含“通过表情符号验证”的指引）、开始/完成，以及可用时的 SAS（表情符号/数字）详情。

    来自另一个 Matrix 客户端的入站请求会被跟踪并自动接受。对于自我验证，OpenClaw 会在表情符号验证可用时自动启动 SAS 流程并确认自己这一侧——你仍然需要在你的 Matrix 客户端中比较并确认“它们匹配”。

    验证系统通知不会转发到智能体聊天流水线。

  </Accordion>

  <Accordion title="设备清理">
    旧的由 OpenClaw 管理的设备可能会逐渐累积。列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密存储">
    Matrix E2EE 使用官方 `matrix-js-sdk` 的 Rust 加密路径，并使用 `fake-indexeddb` 作为 IndexedDB shim。加密状态会持久化到 `crypto-idb-snapshot.json`（限制性文件权限）。

    加密运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，其中包括同步存储、加密存储、恢复密钥、IDB 快照、线程绑定和启动验证状态。当 token 变化但账户身份保持不变时，OpenClaw 会复用最佳的现有根目录，以便先前状态仍然可见。

  </Accordion>
</AccordionGroup>

## 资料管理

使用以下命令更新所选账户的 Matrix 自我资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

当你希望明确指向某个命名 Matrix 账户时，请添加 `--account <id>`。

Matrix 可直接接受 `mxc://` 头像 URL。当你传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，然后将解析后的 `mxc://` URL 回写到 `channels.matrix.avatarUrl`（或所选账户的覆盖配置）中。

## 线程

Matrix 支持原生 Matrix 线程，既可用于自动回复，也可用于 message-tool 发送。

- `dm.sessionScope: "per-user"`（默认）会让 Matrix 私信路由保持为发送方作用域，因此多个私信房间在解析到同一对端时可以共享一个会话。
- `dm.sessionScope: "per-room"` 会将每个 Matrix 私信房间隔离到其各自的会话键中，同时仍使用普通的私信认证和允许列表检查。
- 显式的 Matrix 会话绑定仍然优先于 `dm.sessionScope`，因此已绑定的房间和线程会继续使用其选定的目标会话。
- `threadReplies: "off"` 会让回复保持在顶层，并使入站线程消息继续使用父级会话。
- `threadReplies: "inbound"` 仅当入站消息本身已经位于某个线程中时，才在线程内回复。
- `threadReplies: "always"` 会将房间回复保持在线程中，并以触发消息为根，同时从第一条触发消息开始，通过匹配的线程作用域会话来路由该对话。
- `dm.threadReplies` 仅覆盖私信的顶层设置。例如，你可以让房间线程保持隔离，同时让私信保持扁平。
- 入站线程消息会将线程根消息作为额外的智能体上下文一并包含。
- 当目标是同一房间，或同一私信用户目标时，message-tool 发送会自动继承当前 Matrix 线程，除非显式提供了 `threadId`。
- 只有当当前会话元数据能证明这是同一 Matrix 账户上的同一私信对端时，才会启用同会话私信用户目标复用；否则 OpenClaw 会回退到普通的按用户作用域路由。
- 当 OpenClaw 发现某个 Matrix 私信房间与另一个私信房间在同一个共享 Matrix 私信会话上发生冲突时，如果启用了线程绑定，并且提供了 `dm.sessionScope` 提示，它会在该房间中发布一次性的 `m.notice`，提示可使用 `/focus` 逃生口。
- Matrix 支持运行时线程绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和绑定到线程的 `/acp spawn` 都可在 Matrix 房间和私信中使用。
- 当 `threadBindings.spawnSubagentSessions=true` 时，顶层 Matrix 房间/私信中的 `/focus` 会创建一个新的 Matrix 线程，并将其绑定到目标会话。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here` 时，则会绑定当前线程本身。

## ACP 会话绑定

Matrix 房间、私信和现有 Matrix 线程都可以变为持久的 ACP 工作区，而无需改变聊天界面。

快速操作流程：

- 在你想继续使用的 Matrix 私信、房间或现有线程中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间会保持为聊天界面，后续消息将路由到新建的 ACP 会话。
- 在现有线程中，`--bind here` 会将当前线程原地绑定。
- `/new` 和 `/reset` 会原地重置同一个已绑定的 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

说明：

- `--bind here` 不会创建子 Matrix 线程。
- `threadBindings.spawnAcpSessions` 仅在 `/acp spawn --thread auto|here` 时需要，因为此时 OpenClaw 需要创建或绑定一个子 Matrix 线程。

### 线程绑定配置

Matrix 会继承 `session.threadBindings` 中的全局默认值，同时也支持按渠道覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 线程绑定的 spawn 标志为选择启用：

- 设置 `threadBindings.spawnSubagentSessions: true`，以允许顶层 `/focus` 创建并绑定新的 Matrix 线程。
- 设置 `threadBindings.spawnAcpSessions: true`，以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 线程。

## 表情回应

Matrix 支持出站表情回应操作、入站表情回应通知和入站确认表情回应。

- 出站表情回应工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 会向特定 Matrix 事件添加一个表情回应。
- `reactions` 会列出特定 Matrix 事件当前的表情回应摘要。
- `emoji=""` 会移除机器人账户自己在该事件上的所有表情回应。
- `remove: true` 只会移除机器人账户在该事件上的指定表情回应。

确认表情回应使用标准的 OpenClaw 解析顺序：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退值

确认表情回应作用域按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

表情回应通知模式按以下顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认值：`own`

行为：

- `reactionNotifications: "own"` 会在目标为机器人撰写的 Matrix 消息时，转发已添加的 `m.reaction` 事件。
- `reactionNotifications: "off"` 会禁用表情回应系统事件。
- 表情回应移除不会被合成为系统事件，因为 Matrix 将其显示为 redaction，而不是独立的 `m.reaction` 移除事件。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发智能体时，有多少条最近的房间消息会作为 `InboundHistory` 包含进来。它会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则有效默认值为 `0`。设置为 `0` 可禁用。
- Matrix 房间历史仅限房间。私信仍继续使用普通会话历史。
- Matrix 房间历史采用仅待处理模式：OpenClaw 会缓冲尚未触发回复的房间消息，然后在提及或其他触发到来时对该窗口进行快照。
- 当前触发消息不会包含在 `InboundHistory` 中；该消息会保留在本轮的主入站正文中。
- 对同一 Matrix 事件的重试会复用原始历史快照，而不是漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于管理补充房间上下文，例如获取到的回复文本、线程根消息和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文会按接收时的样子保留。
- `contextVisibility: "allowlist"` 会将补充上下文过滤为仅保留通过当前房间/用户允许列表检查的发送者内容。
- `contextVisibility: "allowlist_quote"` 的行为与 `allowlist` 相同，但仍会保留一条显式引用的回复。

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

有关提及门控和允许列表行为，请参阅 [Groups](/zh-CN/channels/groups)。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果某个尚未获批的 Matrix 用户在获批前持续向你发送消息，OpenClaw 会复用同一个待处理配对码，并且可能会在短暂冷却后再次发送提醒回复，而不是生成新的配对码。

有关共享的私信配对流程和存储布局，请参阅 [Pairing](/zh-CN/channels/pairing)。

## 直接房间修复

如果私信状态不同步，OpenClaw 可能会留下过时的 `m.direct` 映射，将其指向旧的单独房间，而不是当前有效的私信。可使用以下命令检查某个对端的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复流程：

- 优先选择已在 `m.direct` 中映射的严格 1:1 私信
- 如果没有，则回退到当前已加入的、与该用户的任意严格 1:1 私信
- 如果不存在健康的私信，则创建一个新的直接房间并重写 `m.direct`

修复流程不会自动删除旧房间。它只会选出健康的私信并更新映射，以便新的 Matrix 发送、验证通知和其他私信流程再次指向正确的房间。

## Exec approvals

Matrix 可以作为某个 Matrix 账户的原生审批客户端。原生的
私信/渠道路由控制仍位于 exec approval 配置下：

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认值：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批人必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"`，且至少有一个审批人可被解析时，Matrix 会自动启用原生审批。Exec approvals 会优先使用 `execApprovals.approvers`，并且可以回退到 `channels.matrix.dm.allowFrom`。插件审批通过 `channels.matrix.dm.allowFrom` 进行授权。设置 `enabled: false` 可显式禁用 Matrix 作为原生审批客户端。否则，审批请求会回退到其他已配置的审批路由或审批回退策略。

Matrix 原生路由同时支持两种审批类型：

- `channels.matrix.execApprovals.*` 控制 Matrix 审批提示的原生私信/渠道扇出模式。
- Exec approvals 使用来自 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 的 exec 审批人集合。
- 插件审批使用 `channels.matrix.dm.allowFrom` 中的 Matrix 私信允许列表。
- Matrix 表情回应快捷方式和消息更新同时适用于 exec 和插件审批。

投递规则：

- `target: "dm"` 会将审批提示发送到审批人的私信
- `target: "channel"` 会将提示发回到发起的 Matrix 房间或私信
- `target: "both"` 会同时发送到审批人的私信以及发起的 Matrix 房间或私信

Matrix 审批提示会在主审批消息上植入表情回应快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 在有效 exec 策略允许该决定时始终允许

审批人可以对该消息添加表情回应，或使用回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批人可以批准或拒绝。对于 exec approvals，渠道投递会包含命令文本，因此仅应在受信任的房间中启用 `channel` 或 `both`。

按账户覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec approvals](/zh-CN/tools/exec-approvals)

## 斜杠命令

Matrix 斜杠命令（例如 `/new`、`/reset`、`/model`）可直接在私信中使用。在房间中，OpenClaw 也能识别带有机器人自身 Matrix 提及前缀的斜杠命令，因此 `@bot:server /new` 会触发命令路径，而不需要自定义提及正则。这让机器人能够响应房间风格的 `@mention /command` 帖子；当用户在输入命令前先通过补全选中机器人时，Element 和类似客户端就会发送这种格式。

授权规则仍然适用：命令发送者必须像发送普通消息一样满足私信或房间允许列表/所有者策略。

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
你可以通过 `groups.<room>.account` 将继承的房间条目限定到某个 Matrix 账户。
未设置 `account` 的条目会在所有 Matrix 账户间共享，而设置了 `account: "default"` 的条目在默认账户直接配置在顶层 `channels.matrix.*` 时仍然有效。
部分共享认证默认值本身不会创建一个单独的隐式默认账户。只有当该默认值具有新的认证信息（`homeserver` 加 `accessToken`，或 `homeserver` 加 `userId` 和 `password`）时，OpenClaw 才会合成顶层 `default` 账户；命名账户仍然可以在稍后由缓存凭证满足认证条件时，通过 `homeserver` 加 `userId` 保持可发现。
如果 Matrix 已经恰好有一个命名账户，或者 `defaultAccount` 指向了一个现有的命名账户键，那么从单账户到多账户的修复/设置升级会保留该账户，而不会创建一个新的 `accounts.default` 条目。只有 Matrix 认证/bootstrap 键会移动到这个升级后的账户中；共享投递策略键会保留在顶层。
当你希望 OpenClaw 在隐式路由、探测和 CLI 操作中优先使用某个命名 Matrix 账户时，请设置 `defaultAccount`。
如果配置了多个 Matrix 账户，并且其中一个账户 ID 为 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用该账户。
如果你配置了多个命名账户，请设置 `defaultAccount`，或为依赖隐式账户选择的 CLI 命令传入 `--account <id>`。
当你希望对某一条命令覆盖该隐式选择时，请为 `openclaw matrix verify ...` 和 `openclaw matrix devices ...` 传入 `--account <id>`。

有关共享的多账户模式，请参阅 [Configuration reference](/zh-CN/gateway/config-channels#multi-account-all-channels)。

## 私有/LAN homeserver

默认情况下，出于 SSRF 防护，OpenClaw 会阻止私有/内部 Matrix homeserver，除非你
为每个账户显式选择启用。

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

此选择启用仅允许受信任的私有/内部目标。公共明文 homeserver，例如
`http://matrix.example.org:8008`，仍会被阻止。请尽可能优先使用 `https://`。

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

命名账户可以使用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 会将同一个代理设置用于运行时 Matrix 流量和账户状态探测。

## 目标解析

在 OpenClaw 要求你提供房间或用户目标的任何地方，Matrix 都接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找使用已登录的 Matrix 账户：

- 用户查找会查询该 homeserver 上的 Matrix 用户目录。
- 房间查找会直接接受显式的房间 ID 和别名，然后回退到搜索该账户已加入的房间名称。
- 已加入房间名称查找属于尽力而为。如果某个房间名称无法解析为 ID 或别名，它会在运行时允许列表解析中被忽略。

## 配置参考

- `enabled`：启用或禁用该渠道。
- `name`：账户的可选标签。
- `defaultAccount`：配置了多个 Matrix 账户时的首选账户 ID。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此 Matrix 账户连接到私有/内部 homeserver。当 homeserver 解析到 `localhost`、LAN/Tailscale IP 或内部主机（例如 `matrix-synapse`）时，请启用此项。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。命名账户可以使用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整的 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：用于基于 token 认证的 access token。`channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 在 env/file/exec 提供商中都支持明文值和 SecretRef 值。请参阅 [Secrets Management](/zh-CN/gateway/secrets)。
- `password`：用于基于密码登录的密码。支持明文值和 SecretRef 值。
- `deviceId`：显式的 Matrix 设备 ID。
- `deviceName`：用于密码登录的设备显示名称。
- `avatarUrl`：用于资料同步和 `profile set` 更新的已存储自头像 URL。
- `initialSyncLimit`：启动同步期间获取的最大事件数。
- `encryption`：启用 E2EE。
- `allowlistOnly`：当为 `true` 时，会将 `open` 房间策略升级为 `allowlist`，并强制所有活动私信策略（除 `disabled` 外，包括 `pairing` 和 `open`）变为 `allowlist`。不会影响 `disabled` 策略。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账户的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文的可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的允许列表用户 ID。完整的 Matrix 用户 ID 最安全；精确的目录匹配会在启动时以及监视器运行期间允许列表变更时解析。无法解析的名称会被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。会回退到 `messages.groupChat.historyLimit`；如果两者都未设置，则有效默认值为 `0`。设置 `0` 可禁用。
- `replyToMode`：`off`、`first`、`all` 或 `batched`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`"partial"`、`"quiet"`、`true` 或 `false`。`"partial"` 和 `true` 会使用普通 Matrix 文本消息启用“先预览后更新”的草稿更新。`"quiet"` 为自托管 push-rule 设置使用不通知的预览通知。`false` 等同于 `"off"`。
- `blockStreaming`：当草稿预览流式传输处于活动状态时，`true` 会为已完成的 assistant 块启用单独的进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：线程绑定会话路由和生命周期的按渠道覆盖。
- `startupVerification`：启动时的自动自我验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：重试自动启动验证请求前的冷却时间。
- `textChunkLimit`：出站消息的分块大小（按字符数，适用于 `chunkMode` 为 `length` 时）。
- `chunkMode`：`length` 按字符数拆分消息；`newline` 按行边界拆分。
- `responsePrefix`：为此渠道的所有出站回复添加的可选前缀字符串。
- `ackReaction`：此渠道/账户的可选确认表情回应覆盖值。
- `ackReactionScope`：可选的确认表情回应作用域覆盖值（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站表情回应通知模式（`own`、`off`）。
- `mediaMaxMb`：用于出站发送和入站媒体处理的媒体大小上限，单位为 MB。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认值：`off`。适用于所有 Matrix 邀请，包括私信式邀请。
- `autoJoinAllowlist`：当 `autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目会在处理邀请时解析为房间 ID；OpenClaw 不会信任被邀请房间所声明的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：控制 OpenClaw 加入房间并将其分类为私信后如何访问私信。它不会改变邀请是否会被自动加入。
- `dm.allowFrom`：私信流量的允许列表用户 ID。完整的 Matrix 用户 ID 最安全；精确的目录匹配会在启动时以及监视器运行期间允许列表变更时解析。无法解析的名称会被忽略。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。如果你希望每个 Matrix 私信房间即使面对同一对端也保留独立上下文，请使用 `per-room`。
- `dm.threadReplies`：仅私信的线程策略覆盖值（`off`、`inbound`、`always`）。它会覆盖顶层 `threadReplies` 设置，同时影响私信中的回复放置和会话隔离。
- `execApprovals`：Matrix 原生 exec 审批投递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许批准 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已经标识了审批人时，此项可选。
- `execApprovals.target`：`dm | channel | both`（默认值：`dm`）。
- `accounts`：按名称定义的每账户覆盖项。顶层 `channels.matrix` 值会作为这些条目的默认值。
- `groups`：按房间定义的策略映射。优先使用房间 ID 或别名；无法解析的房间名称会在运行时被忽略。会话/群组身份在解析后使用稳定的房间 ID。
- `groups.<room>.account`：在多账户设置中，将一个继承的房间条目限制到特定 Matrix 账户。
- `groups.<room>.allowBots`：对已配置机器人发送者的房间级覆盖值（`true` 或 `"mentions"`）。
- `groups.<room>.users`：按房间定义的发送者允许列表。
- `groups.<room>.tools`：按房间定义的工具允许/拒绝覆盖值。
- `groups.<room>.autoReply`：房间级提及门控覆盖值。`true` 会禁用该房间的提及要求；`false` 会强制重新启用。
- `groups.<room>.skills`：可选的房间级 Skills 过滤器。
- `groups.<room>.systemPrompt`：可选的房间级系统提示片段。
- `rooms`：`groups` 的旧别名。
- `actions`：按操作定义的工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关

- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信认证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型和加固
