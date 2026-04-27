---
read_when:
    - 为 OpenClaw 设置 Zalo 个人账号
    - 调试 Zalo 个人账号登录或消息流程
summary: 通过原生 `zca-js` 提供的 Zalo 个人账号支持（QR 登录）、能力与配置
title: Zalo 个人账号
x-i18n:
    generated_at: "2026-04-27T06:02:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: eaa50ef95eb5c0d887e712e4d18c71068184df4cfe7d71ab5bbeb996c4789179
    source_path: channels/zalouser.md
    workflow: 15
---

状态：实验性。此集成通过 OpenClaw 内部的原生 `zca-js` 自动化一个**Zalo 个人账号**。

<Warning>
这是一个非官方集成，可能导致账号被暂停或封禁。请自行承担风险。
</Warning>

## 内置插件

Zalo 个人账号作为内置插件随当前 OpenClaw 版本一同提供，因此常规打包构建无需单独安装。

如果你使用的是较旧版本，或是不包含 Zalo 个人账号的自定义安装，请手动安装：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 详情参见：[Plugins](/zh-CN/tools/plugin)

不需要外部 `zca`/`openzca` CLI 二进制文件。

## 快速设置（新手）

1. 确保 Zalo 个人账号插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧版本/自定义安装可使用上述命令手动添加。
2. 登录（QR，在 Gateway 网关所在机器上）：
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
5. 私信访问默认使用配对；首次联系时批准配对代码。

## 它是什么

- 完全通过 `zca-js` 在进程内运行。
- 使用原生事件监听器接收入站消息。
- 通过 JS API 直接发送回复（文本/媒体/链接）。
- 面向无法使用 Zalo Bot API 的“个人账号”使用场景而设计。

## 命名

渠道 ID 为 `zalouser`，以明确表示这是对**Zalo 个人用户账号**（非官方）的自动化。我们保留 `zalo`，用于未来可能出现的官方 Zalo API 集成。

## 查找 ID（目录）

使用目录 CLI 发现联系人/群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 出站文本会被分块到约 2000 个字符（Zalo 客户端限制）。
- 默认禁用流式传输。

## 访问控制（私信）

`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。

`channels.zalouser.allowFrom` 可接受用户 ID 或名称。在设置期间，名称会通过插件的进程内联系人查找解析为 ID。

批准方式：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）

- 默认：`channels.zalouser.groupPolicy = "open"`（允许群组）。当未设置时，可使用 `channels.defaults.groupPolicy` 覆盖默认值。
- 限制为允许列表：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键应为稳定的群组 ID；如有可能，名称会在启动时解析为 ID）
  - `channels.zalouser.groupAllowFrom`（控制允许群组中哪些发送者可以触发机器人）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示你设置群组允许列表。
- 启动时，OpenClaw 会将允许列表中的群组/用户名称解析为 ID，并记录映射关系。
- 默认情况下，群组允许列表匹配仅基于 ID。未解析的名称会在鉴权时被忽略，除非启用 `channels.zalouser.dangerouslyAllowNameMatching: true`。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一个紧急兼容模式，会重新启用可变的群组名称匹配。
- 如果未设置 `groupAllowFrom`，运行时会回退到 `allowFrom` 来执行群组发送者检查。
- 发送者检查同时适用于普通群组消息和控制命令（例如 `/new`、`/reset`）。

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
- 解析顺序：精确群组 id/名称 -> 规范化后的群组 slug -> `*` -> 默认值（`true`）。
- 这同时适用于允许列表群组和开放群组模式。
- 引用机器人消息会被视为用于激活群组的一种隐式提及。
- 已授权的控制命令（例如 `/new`）可以绕过提及门控。
- 当某条群组消息因需要提及而被跳过时，OpenClaw 会将其存储为待处理的群组历史，并在下一条被处理的群组消息中包含它。
- 群组历史限制默认取自 `messages.groupChat.historyLimit`（回退值为 `50`）。你可以通过 `channels.zalouser.historyLimit` 按账号覆盖。

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

账号映射到 OpenClaw 状态中的 `zalouser` 配置文件。示例：

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

## 正在输入、反应和投递确认

- OpenClaw 会在发送回复前先发送一个“正在输入”事件（尽力而为）。
- 在渠道操作中，消息反应动作 `react` 支持 `zalouser`。
  - 使用 `remove: true` 可从消息中移除指定的反应表情符号。
  - 反应语义参见：[Reactions](/zh-CN/tools/reactions)
- 对于包含事件元数据的入站消息，OpenClaw 会发送 delivered + seen 确认（尽力而为）。

## 故障排除

**登录无法保持：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允许列表/群组名称未解析：**

- 在 `allowFrom`/`groupAllowFrom`/`groups` 中使用数字 ID，或使用精确的好友/群组名称。

**从旧版基于 CLI 的设置升级：**

- 移除任何关于旧外部 `zca` 进程的假设。
- 该渠道现在完全在 OpenClaw 内运行，不依赖外部 CLI 二进制文件。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证与配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为与提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型与加固措施
