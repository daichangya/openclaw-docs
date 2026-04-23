---
read_when:
    - 为 OpenClaw 设置 Twitch 聊天集成
summary: Twitch 聊天机器人配置与设置
title: Twitch
x-i18n:
    generated_at: "2026-04-23T20:42:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

通过 IRC 连接支持 Twitch 聊天。OpenClaw 以 Twitch 用户（机器人账户）身份连接，以在频道中接收和发送消息。

## 内置插件

Twitch 在当前 OpenClaw 版本中作为内置插件提供，因此常规打包版本无需单独安装。

如果你使用的是较旧版本，或排除了 Twitch 的自定义安装，请手动安装：

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/twitch
```

本地检出安装（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

详情参见：[Plugins](/zh-CN/tools/plugin)

## 快速设置（初学者）

1. 确保 Twitch 插件可用。
   - 当前打包发布的 OpenClaw 已内置该插件。
   - 较旧/自定义安装可使用上面的命令手动添加。
2. 为机器人创建一个专用的 Twitch 账户（或使用现有账户）。
3. 生成凭证：[Twitch Token Generator](https://twitchtokengenerator.com/)
   - 选择 **Bot Token**
   - 确认已选择作用域 `chat:read` 和 `chat:write`
   - 复制 **Client ID** 和 **Access Token**
4. 查找你的 Twitch 用户 ID：[https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. 配置令牌：
   - 环境变量：`OPENCLAW_TWITCH_ACCESS_TOKEN=...`（仅默认账户）
   - 或配置：`channels.twitch.accessToken`
   - 如果两者都设置，配置优先（环境变量回退仅适用于默认账户）。
6. 启动 Gateway 网关。

**⚠️ 重要：** 添加访问控制（`allowFrom` 或 `allowedRoles`）以防止未授权用户触发机器人。`requireMention` 默认值为 `true`。

最小配置：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // 机器人的 Twitch 账户
      accessToken: "oauth:abc123...", // OAuth Access Token（或使用 OPENCLAW_TWITCH_ACCESS_TOKEN 环境变量）
      clientId: "xyz789...", // 来自 Token Generator 的 Client ID
      channel: "vevisk", // 要加入哪个 Twitch 频道聊天（必填）
      allowFrom: ["123456789"], // （推荐）仅你的 Twitch 用户 ID —— 从 https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ 获取
    },
  },
}
```

## 它是什么

- 一个由 Gateway 网关拥有的 Twitch 渠道。
- 确定性路由：回复始终返回到 Twitch。
- 每个账户都映射到一个隔离的会话键 `agent:<agentId>:twitch:<accountName>`。
- `username` 是机器人的账户（用于认证），`channel` 是要加入的聊天房间。

## 设置（详细）

### 生成凭证

使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

- 选择 **Bot Token**
- 确认已选择作用域 `chat:read` 和 `chat:write`
- 复制 **Client ID** 和 **Access Token**

无需手动注册应用。令牌会在数小时后过期。

### 配置机器人

**环境变量（仅默认账户）：**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**或配置：**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

如果环境变量和配置同时设置，配置优先。

### 访问控制（推荐）

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // （推荐）仅你的 Twitch 用户 ID
    },
  },
}
```

优先使用 `allowFrom` 作为硬性允许列表。如果你希望基于角色控制访问，请改用 `allowedRoles`。

**可用角色：** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

**为什么使用用户 ID？** 用户名可能会更改，从而允许冒充。用户 ID 是永久不变的。

查找你的 Twitch 用户 ID：[https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)（将你的 Twitch 用户名转换为 ID）

## 令牌刷新（可选）

来自 [Twitch Token Generator](https://twitchtokengenerator.com/) 的令牌不能自动刷新 —— 过期后请重新生成。

如果需要自动刷新令牌，请在 [Twitch Developer Console](https://dev.twitch.tv/console) 创建你自己的 Twitch 应用，并添加到配置中：

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

机器人会在令牌过期前自动刷新，并记录刷新事件。

## 多账户支持

使用 `channels.twitch.accounts` 配置每个账户的令牌。共享模式参见 [`gateway/configuration`](/zh-CN/gateway/configuration)。

示例（一个机器人账户加入两个频道）：

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**注意：** 每个账户都需要自己的令牌（每个频道一个令牌）。

## 访问控制

### 基于角色的限制

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### 按用户 ID 设置允许列表（最安全）

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### 基于角色的访问（替代方式）

`allowFrom` 是硬性允许列表。设置后，仅允许这些用户 ID。
如果你希望基于角色访问，请不要设置 `allowFrom`，改为配置 `allowedRoles`：

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### 禁用 @mention 要求

默认情况下，`requireMention` 为 `true`。如要禁用并响应所有消息：

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## 故障排除

首先，运行诊断命令：

```bash
openclaw doctor
openclaw channels status --probe
```

### 机器人不响应消息

**检查访问控制：** 确保你的用户 ID 在 `allowFrom` 中，或者暂时删除
`allowFrom` 并设置 `allowedRoles: ["all"]` 进行测试。

**检查机器人是否在频道中：** 机器人必须加入 `channel` 中指定的频道。

### 令牌问题

**“Failed to connect” 或认证错误：**

- 确认 `accessToken` 是 OAuth 访问令牌值（通常以 `oauth:` 前缀开头）
- 检查令牌具有 `chat:read` 和 `chat:write` 作用域
- 如果使用令牌刷新，请确认已设置 `clientSecret` 和 `refreshToken`

### 令牌刷新不工作

**检查日志中的刷新事件：**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

如果你看到 “token refresh disabled (no refresh token)”：

- 确保提供了 `clientSecret`
- 确保提供了 `refreshToken`

## 配置

**账户配置：**

- `username` - 机器人用户名
- `accessToken` - 具有 `chat:read` 和 `chat:write` 的 OAuth 访问令牌
- `clientId` - Twitch Client ID（来自 Token Generator 或你的应用）
- `channel` - 要加入的频道（必填）
- `enabled` - 启用此账户（默认：`true`）
- `clientSecret` - 可选：用于自动刷新令牌
- `refreshToken` - 可选：用于自动刷新令牌
- `expiresIn` - 令牌过期时间（秒）
- `obtainmentTimestamp` - 令牌获取时间戳
- `allowFrom` - 用户 ID 允许列表
- `allowedRoles` - 基于角色的访问控制（`"moderator" | "owner" | "vip" | "subscriber" | "all"`）
- `requireMention` - 要求 @mention（默认：`true`）

**提供商选项：**

- `channels.twitch.enabled` - 启用/禁用渠道启动
- `channels.twitch.username` - 机器人用户名（简化的单账户配置）
- `channels.twitch.accessToken` - OAuth 访问令牌（简化的单账户配置）
- `channels.twitch.clientId` - Twitch Client ID（简化的单账户配置）
- `channels.twitch.channel` - 要加入的频道（简化的单账户配置）
- `channels.twitch.accounts.<accountName>` - 多账户配置（上面所有账户字段）

完整示例：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## 工具操作

智能体可以调用 `twitch`，支持的操作：

- `send` - 向频道发送消息

示例：

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## 安全与运维

- **像对待密码一样对待令牌** —— 绝不要将令牌提交到 git
- **对长期运行的机器人使用自动令牌刷新**
- **使用用户 ID 允许列表**，而不是用户名，进行访问控制
- **监控日志** 中的令牌刷新事件和连接状态
- **将令牌作用域最小化** —— 仅请求 `chat:read` 和 `chat:write`
- **如果卡住**：确认没有其他进程占用该会话后，重启 Gateway 网关

## 限制

- **每条消息 500 个字符**
（会按单词边界自动分块）
- Markdown 会在分块前被剥离
- 无速率限制（使用 Twitch 内置速率限制）

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证与配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为与提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与安全加固
