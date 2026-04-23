---
read_when:
    - 设置私信访问控制
    - 配对新的 iOS/Android 节点
    - 审查 OpenClaw 的安全态势
summary: 配对概览：批准谁可以向你发送私信，以及哪些节点可以加入
title: 配对
x-i18n:
    generated_at: "2026-04-23T20:41:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

“配对”是 OpenClaw 中明确的**所有者批准**步骤。
它用于两个场景：

1. **私信配对**（谁被允许与机器人对话）
2. **节点配对**（哪些设备/节点被允许加入 Gateway 网关网络）

安全背景： [Security](/zh-CN/gateway/security)

## 1）私信配对（入站聊天访问）

当某个渠道配置了 `pairing` 私信策略时，未知发送者会收到一个短代码，在你批准之前，他们的消息**不会被处理**。

默认私信策略文档见： [Security](/zh-CN/gateway/security)

配对代码：

- 8 个字符，大写，不含易混淆字符（`0O1I`）。
- **1 小时后过期**。机器人只会在创建新请求时发送配对消息（大致为每个发送者每小时一次）。
- 默认情况下，待处理的私信配对请求每个渠道最多 **3 个**；在某个请求过期或获批之前，额外请求会被忽略。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

支持的渠道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 状态存储位置

存储于 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准允许列表存储：
  - 默认账户：`<channel>-allowFrom.json`
  - 非默认账户：`<channel>-<accountId>-allowFrom.json`

账户作用域行为：

- 非默认账户只会读取/写入其各自作用域的允许列表文件。
- 默认账户使用按渠道划分、无账户作用域的允许列表文件。

请将这些文件视为敏感信息（它们控制对你的助手的访问）。

重要：此存储仅用于私信访问。群组授权是单独处理的。
批准私信配对代码并不会自动允许该发送者在群组中执行命令或控制机器人。对于群组访问，请配置该渠道的显式群组允许列表（例如 `groupAllowFrom`、`groups`，或按渠道而定的每群组/每主题覆盖项）。

## 2）节点设备配对（iOS/Android/macOS/无头节点）

节点以 **device** 身份并使用 `role: node` 连接到 Gateway 网关。Gateway 网关会创建设备配对请求，必须经过批准。

### 通过 Telegram 配对（iOS 推荐）

如果你使用 `device-pair` 插件，你可以完全通过 Telegram 完成首次设备配对：

1. 在 Telegram 中向你的机器人发送：`/pair`
2. 机器人会回复两条消息：一条说明消息，以及另一条单独的**设置代码**消息（便于在 Telegram 中复制/粘贴）。
3. 在手机上打开 OpenClaw iOS 应用 → Settings → Gateway。
4. 粘贴设置代码并连接。
5. 回到 Telegram：`/pair pending`（查看请求 ID、角色和作用域），然后批准。

该设置代码是一个 base64 编码的 JSON 载荷，包含：

- `url`：Gateway 网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用于初始配对握手的短期单设备 bootstrap 令牌

该 bootstrap 令牌带有内置的配对 bootstrap 配置：

- 主交接的 `node` 令牌保持为 `scopes: []`
- 任何交接的 `operator` 令牌都会限制在 bootstrap 允许列表内：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- bootstrap 作用域检查采用角色前缀，而不是单一平坦作用域池：
  operator 作用域条目只满足 operator 请求，而非 operator 角色
  仍必须在其自身角色前缀下请求作用域

在设置代码有效期间，请像对待密码一样保护它。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

如果同一设备使用不同的认证详情重试（例如不同的角色/作用域/公钥），之前的待处理请求会被替代，并创建新的 `requestId`。

重要：已配对设备不会悄悄获得更广泛的访问权限。如果它重新连接并请求更多作用域或更高权限的角色，OpenClaw 会保留现有批准状态不变，并创建新的待处理升级请求。在你批准之前，请使用 `openclaw devices list` 比较当前已批准的访问权限与新请求的访问权限。

### 节点配对状态存储

存储于 `~/.openclaw/devices/` 下：

- `pending.json`（短期；待处理请求会过期）
- `paired.json`（已配对设备 + 令牌）

### 说明

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|rename`）是一个单独的、由 Gateway 网关持有的配对存储。WS 节点仍然需要设备配对。
- 配对记录是已批准角色的持久化真实来源。活动设备令牌会继续受限于该已批准角色集合；即使存在超出已批准角色范围的异常令牌条目，也不会产生新的访问权限。

## 相关文档

- 安全模型 + prompt injection： [Security](/zh-CN/gateway/security)
- 安全更新（运行 doctor）： [Updating](/zh-CN/install/updating)
- 渠道配置：
  - Telegram： [Telegram](/zh-CN/channels/telegram)
  - WhatsApp： [WhatsApp](/zh-CN/channels/whatsapp)
  - Signal： [Signal](/zh-CN/channels/signal)
  - BlueBubbles（iMessage）： [BlueBubbles](/zh-CN/channels/bluebubbles)
  - iMessage（传统版）： [iMessage](/zh-CN/channels/imessage)
  - Discord： [Discord](/zh-CN/channels/discord)
  - Slack： [Slack](/zh-CN/channels/slack)
