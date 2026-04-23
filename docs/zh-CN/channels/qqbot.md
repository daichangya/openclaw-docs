---
read_when:
    - 你想将 OpenClaw 连接到 QQ
    - 你需要设置 QQ Bot 凭证
    - 你希望 QQ Bot 支持群聊或私聊
summary: QQ Bot 设置、配置和使用
title: QQ 机器人
x-i18n:
    generated_at: "2026-04-23T22:55:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8127ec59d3a17222e7fe883e77aa1c7d384b231b7d479385421df51c995f7dc2
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot 通过官方 QQ Bot API（WebSocket Gateway 网关）连接到 OpenClaw。
该插件支持 C2C 私聊、群组 @消息，以及频道消息，并支持丰富媒体（图片、语音、视频、文件）。

状态：内置插件。支持私信、群聊、频道以及媒体。
不支持表情回应和话题线程。

## 内置插件

当前的 OpenClaw 版本已内置 QQ Bot，因此普通的打包构建不需要单独执行
`openclaw plugins install` 步骤。

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/)，使用手机 QQ 扫描二维码进行注册 / 登录。
2. 点击 **Create Bot** 创建一个新的 QQ 机器人。
3. 在机器人的设置页面中找到 **AppID** 和 **AppSecret** 并复制。

> AppSecret 不会以明文存储——如果你在保存之前离开该页面，
> 就必须重新生成一个新的。

4. 添加渠道：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重启 Gateway 网关。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

## 配置

最小配置：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

默认账户环境变量：

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

基于文件的 AppSecret：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

说明：

- 环境变量回退仅适用于默认 QQ Bot 账户。
- `openclaw channels add --channel qqbot --token-file ...` 仅提供
  AppSecret；AppID 必须已经在配置中设置，或通过 `QQBOT_APP_ID` 提供。
- `clientSecret` 也接受 SecretRef 输入，而不只是明文字符串。

### 多账户设置

在单个 OpenClaw 实例下运行多个 QQ 机器人：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

每个账户都会启动各自的 WebSocket 连接，并维护独立的
token 缓存（按 `appId` 隔离）。

通过 CLI 添加第二个机器人：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 语音（STT / TTS）

STT 和 TTS 支持两级配置，并带有优先级回退：

| 设置 | 插件专属              | 框架回退                      |
| ---- | --------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`  | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`  | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

在任一项上设置 `enabled: false` 即可禁用。

还可以通过
`channels.qqbot.audioFormatPolicy` 调整出站音频的上传 / 转码行为：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式                       | 描述           |
| -------------------------- | -------------- |
| `qqbot:c2c:OPENID`         | 私聊（C2C）    |
| `qqbot:group:GROUP_OPENID` | 群聊           |
| `qqbot:channel:CHANNEL_ID` | 频道           |

> 每个机器人都有自己的一组用户 OpenID。由机器人 A 接收到的 OpenID **不能**
> 用于通过机器人 B 发送消息。

## 斜杠命令

在 AI 队列之前拦截的内置命令：

| 命令           | 描述                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 延迟测试                                                                                     |
| `/bot-version` | 显示 OpenClaw 框架版本                                                                       |
| `/bot-help`    | 列出所有命令                                                                                 |
| `/bot-upgrade` | 显示 QQBot 升级指南链接                                                                      |
| `/bot-logs`    | 将最近的 Gateway 网关日志导出为文件                                                          |
| `/bot-approve` | 通过原生流程批准待处理的 QQ Bot 操作（例如，确认 C2C 或群组上传）。                         |

在任何命令后附加 `?` 可查看用法帮助（例如 `/bot-upgrade ?`）。

## 引擎架构

QQ Bot 作为插件内的自包含引擎提供：

- 每个账户都拥有按 `appId` 作为键的独立资源栈（WebSocket 连接、API 客户端、token 缓存、媒体存储根目录）。账户之间绝不会共享入站 / 出站状态。
- 多账户日志记录器会用所属账户标记日志行，因此当你在一个 Gateway 网关下运行多个机器人时，诊断信息仍然可以清晰区分。
- 入站、出站以及 Gateway 网关桥接路径共用 `~/.openclaw/media` 下的单一媒体负载根目录，因此上传、下载和转码缓存都会落在同一个受保护目录下，而不是为每个子系统单独建立目录树。
- 凭证可以作为标准 OpenClaw 凭证快照的一部分进行备份和恢复；恢复时，引擎会重新附加每个账户的资源栈，而无需重新进行二维码配对。

## 二维码新手引导

除了手动粘贴 `AppID:AppSecret` 之外，该引擎还支持二维码新手引导流程，用于将 QQ Bot 关联到 OpenClaw：

1. 运行 QQ Bot 设置流程（例如 `openclaw channels add --channel qqbot`），并在提示时选择二维码流程。
2. 使用与目标 QQ Bot 绑定的手机应用扫描生成的二维码。
3. 在手机上批准配对。OpenClaw 会将返回的凭证持久化到 `credentials/` 中对应的账户作用域下。

由机器人自身生成的批准提示（例如 QQ Bot API 提供的“允许此操作吗？”流程）会显示为 OpenClaw 原生提示，你可以使用 `/bot-approve` 接受，而不必通过原始 QQ 客户端回复。

## 故障排除

- **机器人回复“gone to Mars”：** 未配置凭证，或 Gateway 网关未启动。
- **没有入站消息：** 验证 `appId` 和 `clientSecret` 是否正确，并确认机器人已在 QQ 开放平台启用。
- **使用 `--token-file` 设置后仍显示未配置：** `--token-file` 只设置 AppSecret。你仍然需要在配置中设置 `appId`，或提供 `QQBOT_APP_ID`。
- **主动消息没有送达：** 如果用户近期没有互动，QQ 可能会拦截由机器人主动发起的消息。
- **语音未转写：** 确保已配置 STT，并且提供商可访问。

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道故障排除](/zh-CN/channels/troubleshooting)
