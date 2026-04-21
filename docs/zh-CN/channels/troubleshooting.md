---
read_when:
    - 渠道传输显示已连接，但回复失败
    - 在深入查看提供商文档之前，你需要先进行渠道专属检查
summary: 按渠道划分的快速故障排除：每个渠道的失败特征与修复方法
title: 渠道故障排除
x-i18n:
    generated_at: "2026-04-21T00:17:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
    source_path: channels/troubleshooting.md
    workflow: 15
---

# 渠道故障排除

当渠道已连接但行为异常时，请使用此页面。

## 命令排查顺序

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

| 症状 | 最快检查方法 | 修复方法 |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| 已连接但私信无回复 | `openclaw pairing list whatsapp` | 批准发送者，或切换私信策略 / 允许名单。 |
| 群组消息被忽略 | 检查配置中的 `requireMention` 和提及模式 | 提及机器人，或放宽该群组的提及策略。 |
| 随机断开 / 重新登录循环 | `openclaw channels status --probe` + 日志 | 重新登录，并确认凭证目录状态正常。 |

完整故障排除：[/channels/whatsapp#troubleshooting](/zh-CN/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失败特征

| 症状 | 最快检查方法 | 修复方法 |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` 后没有可用的回复流程 | `openclaw pairing list telegram` | 批准配对或更改私信策略。 |
| 机器人在线但群组始终无响应 | 验证提及要求和机器人的隐私模式 | 关闭隐私模式以便群组可见，或提及机器人。 |
| 发送失败并出现网络错误 | 检查日志中的 Telegram API 调用失败 | 修复到 `api.telegram.org` 的 DNS / IPv6 / 代理路由。 |
| 轮询卡住或重连很慢 | 用 `openclaw logs --follow` 查看轮询诊断信息 | 升级；如果重启是误报，调整 `pollingStallThresholdMs`。持续卡住通常仍然指向代理 / DNS / IPv6 问题。 |
| 启动时 `setMyCommands` 被拒绝 | 检查日志中的 `BOT_COMMANDS_TOO_MUCH` | 减少插件 / Skills / 自定义 Telegram 命令，或禁用原生菜单。 |
| 升级后允许名单把你拦住了 | `openclaw security audit` 和配置中的允许名单 | 运行 `openclaw doctor --fix`，或将 `@username` 替换为数字发送者 ID。 |

完整故障排除：[/channels/telegram#troubleshooting](/zh-CN/channels/telegram#troubleshooting)

## Discord

### Discord 失败特征

| 症状 | 最快检查方法 | 修复方法 |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| 机器人在线但服务器中无回复 | `openclaw channels status --probe` | 允许该服务器 / 渠道，并验证消息内容 intent。 |
| 群组消息被忽略 | 检查日志中是否有提及门控丢弃 | 提及机器人，或将服务器 / 渠道的 `requireMention: false`。 |
| 私信回复缺失 | `openclaw pairing list discord` | 批准私信配对，或调整私信策略。 |

完整故障排除：[/channels/discord#troubleshooting](/zh-CN/channels/discord#troubleshooting)

## Slack

### Slack 失败特征

| 症状 | 最快检查方法 | 修复方法 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode 已连接但没有响应 | `openclaw channels status --probe` | 验证 app token、bot token 和所需作用域；在基于 SecretRef 的设置中，留意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。 |
| 私信被阻止 | `openclaw pairing list slack` | 批准配对，或放宽私信策略。 |
| 渠道消息被忽略 | 检查 `groupPolicy` 和渠道允许名单 | 允许该渠道，或将策略切换为 `open`。 |

完整故障排除：[/channels/slack#troubleshooting](/zh-CN/channels/slack#troubleshooting)

## iMessage 和 BlueBubbles

### iMessage 和 BlueBubbles 失败特征

| 症状 | 最快检查方法 | 修复方法 |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 没有入站事件 | 验证 webhook / 服务器可达性和应用权限 | 修复 webhook URL 或 BlueBubbles 服务器状态。 |
| 在 macOS 上可以发送但无法接收 | 检查 macOS 对 Messages 自动化的隐私权限 | 重新授予 TCC 权限并重启渠道进程。 |
| 私信发送者被阻止 | `openclaw pairing list imessage` 或 `openclaw pairing list bluebubbles` | 批准配对，或更新允许名单。 |

完整故障排除：

- [/channels/imessage#troubleshooting](/zh-CN/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/zh-CN/channels/bluebubbles#troubleshooting)

## Signal

### Signal 失败特征

| 症状 | 最快检查方法 | 修复方法 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 守护进程可访问但机器人无响应 | `openclaw channels status --probe` | 验证 `signal-cli` 守护进程 URL / 账号和接收模式。 |
| 私信被阻止 | `openclaw pairing list signal` | 批准发送者，或调整私信策略。 |
| 群组回复未触发 | 检查群组允许名单和提及模式 | 添加发送者 / 群组，或放宽门控条件。 |

完整故障排除：[/channels/signal#troubleshooting](/zh-CN/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失败特征

| 症状 | 最快检查方法 | 修复方法 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 机器人回复“去了火星” | 验证配置中的 `appId` 和 `clientSecret` | 设置凭证，或重启 Gateway 网关。 |
| 没有入站消息 | `openclaw channels status --probe` | 在 QQ 开放平台上验证凭证。 |
| 语音未转写 | 检查 STT 提供商配置 | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。 |
| 主动消息未送达 | 检查 QQ 平台的交互要求 | 如果最近没有交互，QQ 可能会阻止机器人主动发消息。 |

完整故障排除：[/channels/qqbot#troubleshooting](/zh-CN/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失败特征

| 症状 | 最快检查方法 | 修复方法 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登录但忽略房间消息 | `openclaw channels status --probe` | 检查 `groupPolicy`、房间允许名单和提及门控。 |
| 私信未处理 | `openclaw pairing list matrix` | 批准发送者，或调整私信策略。 |
| 加密房间失败 | `openclaw matrix verify status` | 重新验证设备，然后检查 `openclaw matrix verify backup status`。 |
| 备份恢复处于待处理 / 已损坏 | `openclaw matrix verify backup status` | 运行 `openclaw matrix verify backup restore`，或使用恢复密钥重新运行。 |
| 交叉签名 / bootstrap 状态异常 | `openclaw matrix verify bootstrap` | 一次性修复秘密存储、交叉签名和备份状态。 |

完整设置和配置：[Matrix](/zh-CN/channels/matrix)
