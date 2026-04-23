---
read_when:
    - 为 OpenClaw 设置 Zalo Personal
    - 调试 Zalo Personal 登录或消息流
summary: 通过原生 `zca-js`（QR 登录）提供的 Zalo 个人账户支持、能力和配置
title: Zalo 个人版
x-i18n:
    generated_at: "2026-04-23T20:42:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal（非官方）

状态：实验性。此集成通过 OpenClaw 内部原生 `zca-js` 自动化一个 **Zalo 个人账户**。

> **警告：** 这是非官方集成，可能导致账户被暂停 / 封禁。请自行承担使用风险。

## 内置插件

Zalo Personal 在当前的 OpenClaw 版本中作为内置插件提供，因此普通
打包构建无需单独安装。

如果你使用的是较旧的构建版本，或排除了 Zalo Personal 的自定义安装，
请手动安装：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 详情请参阅：[Plugins](/zh-CN/tools/plugin)

不需要外部 `zca` / `openzca` CLI 二进制文件。

## 快速设置（初学者）

1. 确保 Zalo Personal 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧 / 自定义安装可通过上述命令手动添加。
2. 登录（在 Gateway 网关所在机器上通过 QR 码）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 手机应用扫描二维码。
3. 启用该渠道：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. 重启 Gateway 网关（或完成设置）。
5. 私信访问默认使用配对；首次联系时请批准配对码。

## 它是什么

- 完全通过 `zca-js` 在进程内运行。
- 使用原生事件监听器接收入站消息。
- 通过 JS API 直接发送回复（文本 / 媒体 / 链接）。
- 适用于无法使用 Zalo Bot API 的“个人账户”使用场景。

## 命名

渠道 id 为 `zalouser`，以明确表示这是在自动化一个 **Zalo 个人用户账户**（非官方）。我们保留 `zalo`，用于未来可能推出的官方 Zalo API 集成。

## 查找 ID（目录）

使用目录 CLI 发现联系人 / 群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 出站文本会按约 2000 个字符分块（Zalo 客户端限制）。
- 默认禁用流式传输。

## 访问控制（私信）

`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。

`channels.zalouser.allowFrom` 可接受用户 ID 或名称。在设置期间，名称会通过插件进程内的联系人查找解析为 ID。

批准方式：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）

- 默认值：`channels.zalouser.groupPolicy = "open"`（允许群组）。未设置时，可使用 `channels.defaults.groupPolicy` 覆盖默认值。
- 使用以下配置限制为允许列表：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键应为稳定的群组 ID；如果可能，名称会在启动时解析为 ID）
  - `channels.zalouser.groupAllowFrom`（控制哪些被允许群组中的发送者可以触发机器人）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示你设置群组允许列表。
- 启动时，OpenClaw 会将允许列表中的群组 / 用户名称解析为 ID，并记录映射关系。
- 默认情况下，群组允许列表匹配仅基于 ID。对于未解析的名称，除非启用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否则在鉴权时会被忽略。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一种破窗应急兼容模式，会重新启用可变群组名称匹配。
- 如果未设置 `groupAllowFrom`，运行时会回退为使用 `allowFrom` 进行群组发送者检查。
- 发送者检查适用于普通群组消息和控制命令（例如 `/new`、`/reset`）。

示例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### 群组提及门控

- `channels.zalouser.groups.<group>.requireMention` 控制群组回复是否需要提及。
- 解析顺序：精确群组 id / 名称 -> 规范化群组 slug -> `*` -> 默认值（`true`）。
- 这同时适用于允许列表群组和开放群组模式。
- 引用一条机器人消息会被视为群组激活的隐式提及。
- 已获授权的控制命令（例如 `/new`）可以绕过提及门控。
- 当群组消息因需要提及而被跳过时，OpenClaw 会将其保存为待处理的群组历史，并在下一条处理的群组消息中包含它。
- 群组历史限制默认使用 `messages.groupChat.historyLimit`（回退值为 `50`）。你可以按账户使用 `channels.zalouser.historyLimit` 覆盖。

示例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## 多账户

账户会映射到 OpenClaw 状态中的 `zalouser` profile。示例：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 正在输入、回应和送达确认

- OpenClaw 会在发送回复前发送一个“正在输入”事件（尽力而为）。
- `zalouser` 在渠道操作中支持消息回应动作 `react`。
  - 使用 `remove: true` 可从消息中移除特定的回应表情。
  - 回应语义： [Reactions](/zh-CN/tools/reactions)
- 对于包含事件元数据的入站消息，OpenClaw 会发送 delivered + seen 确认（尽力而为）。

## 故障排除

**登录无法保持：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允许列表 / 群组名称未解析：**

- 在 `allowFrom` / `groupAllowFrom` / `groups` 中使用数字 ID，或使用精确的好友 / 群组名称。

**从旧的基于 CLI 的设置升级：**

- 移除任何关于旧外部 `zca` 进程的假设。
- 该渠道现在完全在 OpenClaw 内运行，无需外部 CLI 二进制文件。

## 相关内容

- [Channels Overview](/zh-CN/channels) —— 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) —— 私信身份验证和配对流程
- [Groups](/zh-CN/channels/groups) —— 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) —— 消息的会话路由
- [Security](/zh-CN/gateway/security) —— 访问模型与加固措施
