---
read_when:
    - 为 OpenClaw 设置 Zalo 个人账号
    - 调试 Zalo 个人账号登录或消息流程
summary: 通过原生 `zca-js` 支持 Zalo 个人账号（二维码登录）、功能，以及配置
title: Zalo 个人账号
x-i18n:
    generated_at: "2026-04-24T18:07:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

状态：实验性。此集成通过 OpenClaw 内部的原生 `zca-js` 自动化一个 **Zalo 个人账号**。

> **警告：** 这是一个非官方集成，可能导致账号被暂停或封禁。请自行承担风险。

## 内置插件

Zalo Personal 作为内置插件随当前的 OpenClaw 版本一起提供，因此普通的打包构建无需单独安装。

如果你使用的是较旧版本，或排除了 Zalo Personal 的自定义安装，请手动安装：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 详情： [Plugins](/zh-CN/tools/plugin)

不需要外部的 `zca`/`openzca` CLI 二进制文件。

## 快速设置（初学者）

1. 确保 Zalo Personal 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧版本 / 自定义安装可使用上述命令手动添加。
2. 登录（二维码，在 Gateway 网关机器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 移动应用扫描二维码。
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
5. 私信访问默认使用配对；首次联系时批准配对码。

## 它是什么

- 完全通过 `zca-js` 在进程内运行。
- 使用原生事件监听器接收入站消息。
- 通过 JS API 直接发送回复（文本 / 媒体 / 链接）。
- 适用于无法使用 Zalo Bot API 的“个人账号”场景。

## 命名

渠道 id 是 `zalouser`，以明确表示这是对 **Zalo 个人用户账号**（非官方）的自动化。我们保留 `zalo`，用于未来可能推出的官方 Zalo API 集成。

## 查找 ID（目录）

使用目录 CLI 发现联系人 / 群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 出站文本会被分块到大约 2000 个字符（Zalo 客户端限制）。
- 默认阻止流式传输。

## 访问控制（私信）

`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。

`channels.zalouser.allowFrom` 接受用户 ID 或名称。在设置期间，会使用该插件的进程内联系人查找将名称解析为 ID。

通过以下命令批准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）

- 默认：`channels.zalouser.groupPolicy = "open"`（允许群组）。使用 `channels.defaults.groupPolicy` 可在未设置时覆盖默认值。
- 使用以下配置限制为 allowlist：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键应为稳定的群组 ID；名称会在启动时尽可能解析为 ID）
  - `channels.zalouser.groupAllowFrom`（控制在允许的群组中哪些发送者可以触发机器人）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示你设置群组 allowlist。
- 启动时，OpenClaw 会将 allowlist 中的群组 / 用户名称解析为 ID，并记录映射。
- 群组 allowlist 匹配默认仅按 ID 进行。未解析的名称在鉴权时会被忽略，除非启用 `channels.zalouser.dangerouslyAllowNameMatching: true`。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一种破窗兼容模式，会重新启用可变的群组名称匹配。
- 如果未设置 `groupAllowFrom`，运行时会回退到 `allowFrom` 来执行群组发送者检查。
- 发送者检查同时适用于普通群消息和控制命令（例如 `/new`、`/reset`）。

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
- 解析顺序：精确群组 id/名称 -> 规范化的群组 slug -> `*` -> 默认值（`true`）。
- 这同时适用于 allowlist 群组和开放群组模式。
- 引用一条机器人消息会被视为群组激活的隐式提及。
- 已授权的控制命令（例如 `/new`）可以绕过提及门控。
- 当某条群消息因要求提及而被跳过时，OpenClaw 会将其存储为待处理的群历史，并在下一条被处理的群消息中包含它。
- 群组历史限制默认使用 `messages.groupChat.historyLimit`（回退值为 `50`）。你可以通过 `channels.zalouser.historyLimit` 按账号覆盖。

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

## 多账号

账号会映射到 OpenClaw 状态中的 `zalouser` 配置文件。示例：

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

## 正在输入、表情回应和送达确认

- OpenClaw 会在发送回复前发送一个正在输入事件（尽力而为）。
- 在渠道动作中，`zalouser` 支持消息表情回应动作 `react`。
  - 使用 `remove: true` 可从消息中移除特定的表情回应。
  - 表情回应语义： [Reactions](/zh-CN/tools/reactions)
- 对于包含事件元数据的入站消息，OpenClaw 会发送已送达 + 已查看确认（尽力而为）。

## 故障排除

**登录无法保持：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist / 群组名称未解析：**

- 在 `allowFrom`/`groupAllowFrom`/`groups` 中使用数字 ID，或使用精确的好友 / 群组名称。

**从旧的基于 CLI 的设置升级：**

- 移除任何旧的外部 `zca` 进程假设。
- 该渠道现在完全在 OpenClaw 内运行，不需要外部 CLI 二进制文件。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与加固措施
