---
read_when:
    - 渠道传输显示已连接，但回复失败
    - 在深入查看提供商文档之前，你需要先进行渠道专项检查
summary: 按渠道划分的快速故障排除，包含各渠道的失败特征和修复方法
title: 渠道故障排除
x-i18n:
    generated_at: "2026-04-20T06:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aef31742cd5cc4af3fa3d3ea1acba51875ad4a1423c0e8c87372c3df31b0528
    source_path: channels/troubleshooting.md
    workflow: 15
---

# 渠道故障排除

当渠道已连接但行为异常时，请使用本页。

## 命令检查阶梯

请先按顺序运行以下命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健康基线：

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable` 或 `admin-capable`
- 渠道探测显示传输已连接，并且在支持的情况下显示 `works` 或 `audit ok`

## WhatsApp

### WhatsApp 失败特征

| 症状 | 最快检查 | 修复方法 |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| 已连接但没有 私信 回复 | `openclaw pairing list whatsapp` | 批准发送者，或切换 私信 策略 / 允许列表。 |
| 群组消息被忽略 | 检查配置中的 `requireMention` 和提及模式 | 提及机器人，或放宽该群组的提及策略。 |
| 随机断开 / 反复重新登录 | `openclaw channels status --probe` + 日志 | 重新登录，并确认凭证目录状态正常。 |

完整故障排除：[/channels/whatsapp#troubleshooting](/zh-CN/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失败特征

| 症状 | 最快检查 | 修复方法 |
| ----------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `/start` 之后没有可用的回复流程 | `openclaw pairing list telegram` | 批准配对，或更改 私信 策略。 |
| 机器人在线，但群组始终无响应 | 验证提及要求和机器人的隐私模式 | 为群组可见性禁用隐私模式，或提及机器人。 |
| 发送失败并出现网络错误 | 检查日志中的 Telegram API 调用失败 | 修复到 `api.telegram.org` 的 DNS / IPv6 / 代理路由。 |
| 启动时 `setMyCommands` 被拒绝 | 检查日志中的 `BOT_COMMANDS_TOO_MUCH` | 减少插件 / Skills / 自定义 Telegram 命令，或禁用原生菜单。 |
| 升级后允许列表把你拦住了 | `openclaw security audit` 和配置允许列表 | 运行 `openclaw doctor --fix`，或将 `@username` 替换为数字发送者 ID。 |

完整故障排除：[/channels/telegram#troubleshooting](/zh-CN/channels/telegram#troubleshooting)

## Discord

### Discord 失败特征

| 症状 | 最快检查 | 修复方法 |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| 机器人在线，但没有服务器回复 | `openclaw channels status --probe` | 允许对应服务器 / 渠道，并验证消息内容 intent。 |
| 群组消息被忽略 | 检查日志中因提及门控而丢弃的记录 | 提及机器人，或将服务器 / 渠道的 `requireMention: false`。 |
| 私信 回复缺失 | `openclaw pairing list discord` | 批准 私信 配对，或调整 私信 策略。 |

完整故障排除：[/channels/discord#troubleshooting](/zh-CN/channels/discord#troubleshooting)

## Slack

### Slack 失败特征

| 症状 | 最快检查 | 修复方法 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket 模式已连接但没有响应 | `openclaw channels status --probe` | 验证 app token + bot token 以及所需作用域；在使用 SecretRef 的配置中，注意查看 `botTokenStatus` / `appTokenStatus = configured_unavailable`。 |
| 私信 被拦截 | `openclaw pairing list slack` | 批准配对，或放宽 私信 策略。 |
| 渠道消息被忽略 | 检查 `groupPolicy` 和渠道允许列表 | 允许该渠道，或将策略切换为 `open`。 |

完整故障排除：[/channels/slack#troubleshooting](/zh-CN/channels/slack#troubleshooting)

## iMessage 和 BlueBubbles

### iMessage 和 BlueBubbles 失败特征

| 症状 | 最快检查 | 修复方法 |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 没有入站事件 | 验证 webhook / 服务器可达性和应用权限 | 修复 webhook URL 或 BlueBubbles 服务器状态。 |
| 在 macOS 上能发送但不能接收 | 检查 macOS 中 Messages 自动化的隐私权限 | 重新授予 TCC 权限并重启渠道进程。 |
| 私信 发送者被拦截 | `openclaw pairing list imessage` 或 `openclaw pairing list bluebubbles` | 批准配对，或更新允许列表。 |

完整故障排除：

- [/channels/imessage#troubleshooting](/zh-CN/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/zh-CN/channels/bluebubbles#troubleshooting)

## Signal

### Signal 失败特征

| 症状 | 最快检查 | 修复方法 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 守护进程可达，但机器人无响应 | `openclaw channels status --probe` | 验证 `signal-cli` 守护进程 URL / 账户以及接收模式。 |
| 私信 被拦截 | `openclaw pairing list signal` | 批准发送者，或调整 私信 策略。 |
| 群组回复未触发 | 检查群组允许列表和提及模式 | 添加发送者 / 群组，或放宽门控条件。 |

完整故障排除：[/channels/signal#troubleshooting](/zh-CN/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失败特征

| 症状 | 最快检查 | 修复方法 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 机器人回复“去了火星” | 验证配置中的 `appId` 和 `clientSecret` | 设置凭证，或重启 Gateway 网关。 |
| 没有入站消息 | `openclaw channels status --probe` | 在 QQ 开放平台上验证凭证。 |
| 语音未转写 | 检查 STT 提供商配置 | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。 |
| 主动消息未送达 | 检查 QQ 平台的交互要求 | 如果近期没有交互，QQ 可能会阻止机器人主动发消息。 |

完整故障排除：[/channels/qqbot#troubleshooting](/zh-CN/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失败特征

| 症状 | 最快检查 | 修复方法 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登录但忽略房间消息 | `openclaw channels status --probe` | 检查 `groupPolicy`、房间允许列表和提及门控。 |
| 私信 不处理 | `openclaw pairing list matrix` | 批准发送者，或调整 私信 策略。 |
| 加密房间失败 | `openclaw matrix verify status` | 重新验证设备，然后检查 `openclaw matrix verify backup status`。 |
| 备份恢复处于待处理 / 已损坏 | `openclaw matrix verify backup status` | 运行 `openclaw matrix verify backup restore`，或使用恢复密钥重新运行。 |
| 交叉签名 / 引导看起来异常 | `openclaw matrix verify bootstrap` | 一次性修复密钥存储、交叉签名和备份状态。 |

完整设置和配置：[Matrix](/zh-CN/channels/matrix)
