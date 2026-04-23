---
read_when:
    - 渠道传输层显示已连接，但回复失败
    - 在深入查看提供商文档之前，你需要先进行渠道特定检查
summary: 按渠道划分的快速故障排除，包含各渠道特有的故障特征与修复方法
title: 渠道故障排除
x-i18n:
    generated_at: "2026-04-23T20:42:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce24e5f113aa31c9c652fabb1ba6b97827627c6e263b1b4c93ffa230a3bdd9fe
    source_path: channels/troubleshooting.md
    workflow: 15
---

当渠道已连接但行为异常时，请使用本页。

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
- 渠道探测显示传输层已连接，并且在支持的情况下显示 `works` 或 `audit ok`

## WhatsApp

### WhatsApp 故障特征

| 症状                         | 最快检查方式                                        | 修复方法                                         |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| 已连接但私信没有回复         | `openclaw pairing list whatsapp`                    | 批准发送者，或切换私信策略/允许列表。            |
| 群消息被忽略                 | 检查配置中的 `requireMention` 和提及模式            | 提及机器人，或放宽该群组的提及策略。             |
| 随机断连/反复重新登录循环    | `openclaw channels status --probe` + 日志           | 重新登录，并验证凭证目录状态正常。               |

完整故障排除请参阅：[WhatsApp 故障排除](/zh-CN/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 故障特征

| 症状                                | 最快检查方式                                     | 修复方法                                                                                                                |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `/start` 后没有可用的回复流程       | `openclaw pairing list telegram`                 | 批准配对，或更改私信策略。                                                                                              |
| 机器人在线，但群组中始终无响应      | 检查提及要求和机器人的 privacy mode              | 禁用 privacy mode 以便可见群组消息，或提及机器人。                                                                      |
| 发送失败并出现网络错误              | 检查日志中的 Telegram API 调用失败信息           | 修复到 `api.telegram.org` 的 DNS/IPv6/代理路由。                                                                        |
| 轮询卡住或重连很慢                  | 使用 `openclaw logs --follow` 查看轮询诊断信息   | 升级；如果重启属于误报，可调整 `pollingStallThresholdMs`。持续卡住通常仍指向代理/DNS/IPv6 问题。                      |
| 启动时 `setMyCommands` 被拒绝       | 检查日志中的 `BOT_COMMANDS_TOO_MUCH`             | 减少插件/Skills/自定义 Telegram 命令，或禁用原生菜单。                                                                  |
| 升级后允许列表把你拦住了            | `openclaw security audit` 和配置允许列表         | 运行 `openclaw doctor --fix`，或将 `@username` 替换为数字发送者 ID。                                                   |

完整故障排除请参阅：[Telegram 故障排除](/zh-CN/channels/telegram#troubleshooting)

## Discord

### Discord 故障特征

| 症状                         | 最快检查方式                      | 修复方法                                                  |
| ---------------------------- | --------------------------------- | --------------------------------------------------------- |
| 机器人在线但没有 guild 回复  | `openclaw channels status --probe`| 允许该 guild/渠道，并验证 message content intent。        |
| 群消息被忽略                 | 检查日志中是否有提及门控丢弃      | 提及机器人，或为 guild/渠道设置 `requireMention: false`。 |
| 私信回复缺失                 | `openclaw pairing list discord`   | 批准私信配对，或调整私信策略。                            |

完整故障排除请参阅：[Discord 故障排除](/zh-CN/channels/discord#troubleshooting)

## Slack

### Slack 故障特征

| 症状                                   | 最快检查方式                              | 修复方法                                                                                                                                                 |
| -------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode 已连接但没有响应           | `openclaw channels status --probe`        | 验证 app token、bot token 和所需权限范围；在基于 SecretRef 的设置中，注意是否出现 `botTokenStatus` / `appTokenStatus = configured_unavailable`。     |
| 私信被拦截                             | `openclaw pairing list slack`             | 批准配对，或放宽私信策略。                                                                                                                               |
| 渠道消息被忽略                         | 检查 `groupPolicy` 和渠道允许列表         | 允许该渠道，或将策略切换为 `open`。                                                                                                                     |

完整故障排除请参阅：[Slack 故障排除](/zh-CN/channels/slack#troubleshooting)

## iMessage 和 BlueBubbles

### iMessage 和 BlueBubbles 故障特征

| 症状                         | 最快检查方式                                                            | 修复方法                                              |
| ---------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 没有入站事件                 | 验证 webhook/服务器可达性和应用权限                                     | 修复 webhook URL 或 BlueBubbles 服务器状态。          |
| 可以发送，但在 macOS 上无法接收 | 检查 macOS 对 Messages 自动化的隐私权限                              | 重新授予 TCC 权限，并重启渠道进程。                   |
| 私信发送者被拦截             | `openclaw pairing list imessage` 或 `openclaw pairing list bluebubbles` | 批准配对，或更新允许列表。                            |

完整故障排除：

- [iMessage 故障排除](/zh-CN/channels/imessage#troubleshooting)
- [BlueBubbles 故障排除](/zh-CN/channels/bluebubbles#troubleshooting)

## Signal

### Signal 故障特征

| 症状                         | 最快检查方式                              | 修复方法                                                     |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| 守护进程可达，但机器人无响应 | `openclaw channels status --probe`        | 验证 `signal-cli` 守护进程 URL/账户和接收模式。              |
| 私信被拦截                   | `openclaw pairing list signal`            | 批准发送者，或调整私信策略。                                 |
| 群组回复未触发               | 检查群组允许列表和提及模式                | 添加发送者/群组，或放宽门控。                                |

完整故障排除请参阅：[Signal 故障排除](/zh-CN/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 故障特征

| 症状                         | 最快检查方式                                | 修复方法                                                            |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| 机器人回复“gone to Mars”     | 验证配置中的 `appId` 和 `clientSecret`      | 设置凭证，或重启 Gateway 网关。                                     |
| 没有入站消息                 | `openclaw channels status --probe`          | 在 QQ 开放平台上验证凭证。                                          |
| 语音未转写                   | 检查 STT 提供商配置                         | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。                  |
| 主动消息未送达               | 检查 QQ 平台的交互要求                      | 在近期没有交互的情况下，QQ 可能会拦截机器人主动发起的消息。         |

完整故障排除请参阅：[QQ Bot 故障排除](/zh-CN/channels/qqbot#troubleshooting)

## Matrix

### Matrix 故障特征

| 症状                                | 最快检查方式                           | 修复方法                                                                     |
| ----------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| 已登录但忽略房间消息                | `openclaw channels status --probe`     | 检查 `groupPolicy`、房间允许列表和提及门控。                                 |
| 私信不处理                          | `openclaw pairing list matrix`         | 批准发送者，或调整私信策略。                                                 |
| 加密房间失败                        | `openclaw matrix verify status`        | 重新验证设备，然后检查 `openclaw matrix verify backup status`。              |
| 备份恢复处于待处理/损坏状态         | `openclaw matrix verify backup status` | 运行 `openclaw matrix verify backup restore`，或使用恢复密钥重新运行。       |
| 跨签名/bootstrap 状态异常           | `openclaw matrix verify bootstrap`     | 一次性修复 secret storage、跨签名和备份状态。                                |

完整设置与配置请参阅：[Matrix](/zh-CN/channels/matrix)
