---
read_when:
    - 处理 Zalo 功能或 webhook 时
summary: Zalo 机器人支持状态、功能和配置
title: Zalo
x-i18n:
    generated_at: "2026-04-24T18:07:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

状态：实验性。支持私信。下方的 [功能](#capabilities) 部分反映当前 Marketplace 机器人的行为。

## 内置插件

Zalo 在当前 OpenClaw 版本中作为内置插件提供，因此常规打包构建不需要单独安装。

如果你使用的是较旧版本，或是不包含 Zalo 的自定义安装，请手动安装：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalo`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalo-plugin`
- 详情： [插件](/zh-CN/tools/plugin)

## 快速开始（新手）

1. 确保 Zalo 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧/自定义安装可使用上述命令手动添加。
2. 设置令牌：
   - 环境变量：`ZALO_BOT_TOKEN=...`
   - 或配置：`channels.zalo.accounts.default.botToken: "..."`。
3. 重启 Gateway 网关（或完成设置）。
4. 私信访问默认使用配对；首次联系时批准配对码。

最小配置：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## 它是什么

Zalo 是一款面向越南市场的消息应用；它的 Bot API 允许 Gateway 网关运行一个机器人来处理 1:1 对话。
如果你希望将回复稳定地路由回 Zalo，它很适合用于支持或通知场景。

本页反映当前 OpenClaw 对 **Zalo Bot Creator / Marketplace 机器人** 的行为。
**Zalo Official Account（OA）机器人** 属于 Zalo 的另一种产品形态，行为可能不同。

- 由 Gateway 网关托管的 Zalo Bot API 渠道。
- 确定性路由：回复会返回到 Zalo；模型不会选择渠道。
- 私信共享智能体的主会话。
- 下方的 [功能](#capabilities) 部分展示当前对 Marketplace 机器人的支持情况。

## 设置（快速路径）

### 1）创建机器人令牌（Zalo Bot Platform）

1. 前往 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 并登录。
2. 创建一个新机器人并配置其设置。
3. 复制完整的机器人令牌（通常为 `numeric_id:secret`）。对于 Marketplace 机器人，可用的运行时令牌可能会在创建后出现在机器人的欢迎消息中。

### 2）配置令牌（环境变量或配置）

示例：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

如果你之后迁移到支持群组的 Zalo 机器人产品形态，可以显式添加群组相关配置，例如 `groupPolicy` 和 `groupAllowFrom`。当前 Marketplace 机器人的行为请参见 [功能](#capabilities)。

环境变量方式：`ZALO_BOT_TOKEN=...`（仅适用于默认账户）。

多账户支持：使用 `channels.zalo.accounts` 配置每个账户的令牌以及可选的 `name`。

3. 重启 Gateway 网关。只要成功解析到令牌（环境变量或配置），Zalo 就会启动。
4. 私信访问默认使用配对。首次联系机器人时请批准配对码。

## 工作方式（行为）

- 入站消息会被规范化为共享的渠道信封格式，并附带媒体占位符。
- 回复始终会路由回同一个 Zalo 聊天。
- 默认使用长轮询；也支持通过 `channels.zalo.webhookUrl` 使用 webhook 模式。

## 限制

- 出站文本会按 2000 个字符分块（Zalo API 限制）。
- 媒体下载/上传受 `channels.zalo.mediaMaxMb` 限制（默认 5）。
- 默认阻止流式传输，因为 2000 字符限制会让流式传输的实用性变低。

## 访问控制（私信）

### 私信访问

- 默认：`channels.zalo.dmPolicy = "pairing"`。未知发送者会收到一个配对码；在批准前，其消息会被忽略（配对码 1 小时后过期）。
- 批准方式：
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- 配对是默认的令牌交换方式。详情： [配对](/zh-CN/channels/pairing)
- `channels.zalo.allowFrom` 接受数字用户 ID（不支持用户名查询）。

## 访问控制（群组）

对于 **Zalo Bot Creator / Marketplace 机器人**，群组支持在实践中不可用，因为机器人根本无法被添加到群组中。

这意味着，下面这些群组相关配置键虽然存在于 schema 中，但对 Marketplace 机器人不可用：

- `channels.zalo.groupPolicy` 控制群组入站处理：`open | allowlist | disabled`。
- `channels.zalo.groupAllowFrom` 限制哪些发送者 ID 可以在群组中触发机器人。
- 如果未设置 `groupAllowFrom`，Zalo 会回退到使用 `allowFrom` 进行发送者检查。
- 运行时说明：如果完全缺少 `channels.zalo`，运行时仍会出于安全考虑回退为 `groupPolicy="allowlist"`。

群组策略的取值（当你的机器人产品形态支持群组访问时）如下：

- `groupPolicy: "disabled"` — 阻止所有群组消息。
- `groupPolicy: "open"` — 允许任意群组成员（需要提及门控）。
- `groupPolicy: "allowlist"` — 默认失败关闭；仅接受允许的发送者。

如果你使用的是另一种 Zalo 机器人产品形态，并且已验证群组行为可用，请单独记录该行为，而不要假设它与 Marketplace 机器人的流程一致。

## 长轮询与 webhook

- 默认：长轮询（不需要公共 URL）。
- webhook 模式：设置 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - webhook 密钥长度必须为 8-256 个字符。
  - webhook URL 必须使用 HTTPS。
  - Zalo 会通过 `X-Bot-Api-Secret-Token` 请求头发送事件以供验证。
  - Gateway 网关 HTTP 会在 `channels.zalo.webhookPath` 处理 webhook 请求（默认使用 webhook URL 的路径）。
  - 请求必须使用 `Content-Type: application/json`（或 `+json` 媒体类型）。
  - 重复事件（`event_name + message_id`）会在短暂的重放窗口内被忽略。
  - 突发流量会按路径/来源进行速率限制，并可能返回 HTTP 429。

**注意：** 根据 Zalo API 文档，getUpdates（轮询）与 webhook 每个 Zalo API 实例只能二选一。

## 支持的消息类型

如需快速查看支持情况，请参见 [功能](#capabilities)。下方说明补充了需要更多上下文的行为细节。

- **文本消息**：完全支持，按 2000 个字符分块。
- **文本中的纯 URL**：行为与普通文本输入相同。
- **链接预览 / 富链接卡片**：请参见 [功能](#capabilities) 中的 Marketplace 机器人状态；它们无法稳定触发回复。
- **图片消息**：请参见 [功能](#capabilities) 中的 Marketplace 机器人状态；入站图片处理不稳定（会显示输入中指示，但没有最终回复）。
- **贴纸**：请参见 [功能](#capabilities) 中的 Marketplace 机器人状态。
- **语音消息 / 音频文件 / 视频 / 通用文件附件**：请参见 [功能](#capabilities) 中的 Marketplace 机器人状态。
- **不支持的类型**：会被记录（例如，来自受保护用户的消息）。

## 功能

下表汇总了 OpenClaw 中当前 **Zalo Bot Creator / Marketplace 机器人** 的行为。

| 功能 | 状态 |
| --------------------------- | --------------------------------------- |
| 私信 | ✅ 支持 |
| 群组 | ❌ Marketplace 机器人不可用 |
| 媒体（入站图片） | ⚠️ 有限 / 请在你的环境中验证 |
| 媒体（出站图片） | ⚠️ 尚未针对 Marketplace 机器人重新测试 |
| 文本中的纯 URL | ✅ 支持 |
| 链接预览 | ⚠️ 对 Marketplace 机器人不稳定 |
| 表情回应 | ❌ 不支持 |
| 贴纸 | ⚠️ Marketplace 机器人不会触发智能体回复 |
| 语音消息 / 音频 / 视频 | ⚠️ Marketplace 机器人不会触发智能体回复 |
| 文件附件 | ⚠️ Marketplace 机器人不会触发智能体回复 |
| 线程 | ❌ 不支持 |
| 投票 | ❌ 不支持 |
| 原生命令 | ❌ 不支持 |
| 流式传输 | ⚠️ 已阻止（2000 字符限制） |

## 传递目标（CLI/cron）

- 使用聊天 ID 作为目标。
- 示例：`openclaw message send --channel zalo --target 123456789 --message "hi"`。

## 故障排除

**机器人没有响应：**

- 检查令牌是否有效：`openclaw channels status --probe`
- 验证发送者是否已获批准（配对或 allowFrom）
- 检查 Gateway 网关日志：`openclaw logs --follow`

**Webhook 未接收到事件：**

- 确保 webhook URL 使用 HTTPS
- 验证密钥令牌长度为 8-256 个字符
- 确认 Gateway 网关 HTTP 端点可在配置路径上访问
- 检查是否未运行 getUpdates 轮询（两者互斥）

## 配置参考（Zalo）

完整配置： [配置](/zh-CN/gateway/configuration)

扁平的顶层键（`channels.zalo.botToken`、`channels.zalo.dmPolicy` 及类似项）属于旧版单账户简写。新配置建议优先使用 `channels.zalo.accounts.<id>.*`。两种形式在此仍然保留文档说明，因为它们存在于 schema 中。

提供商选项：

- `channels.zalo.enabled`：启用/禁用渠道启动。
- `channels.zalo.botToken`：来自 Zalo Bot Platform 的机器人令牌。
- `channels.zalo.tokenFile`：从常规文件路径读取令牌。不接受符号链接。
- `channels.zalo.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.zalo.allowFrom`：私信允许列表（用户 ID）。`open` 需要 `"*"`。向导会要求输入数字 ID。
- `channels.zalo.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。配置中存在该项；当前 Marketplace 机器人的行为请参见 [功能](#capabilities) 和 [访问控制（群组）](#access-control-groups)。
- `channels.zalo.groupAllowFrom`：群组发送者允许列表（用户 ID）。未设置时回退到 `allowFrom`。
- `channels.zalo.mediaMaxMb`：入站/出站媒体大小上限（MB，默认 5）。
- `channels.zalo.webhookUrl`：启用 webhook 模式（需要 HTTPS）。
- `channels.zalo.webhookSecret`：webhook 密钥（8-256 个字符）。
- `channels.zalo.webhookPath`：Gateway 网关 HTTP 服务器上的 webhook 路径。
- `channels.zalo.proxy`：API 请求使用的代理 URL。

多账户选项：

- `channels.zalo.accounts.<id>.botToken`：每账户令牌。
- `channels.zalo.accounts.<id>.tokenFile`：每账户常规令牌文件。不接受符号链接。
- `channels.zalo.accounts.<id>.name`：显示名称。
- `channels.zalo.accounts.<id>.enabled`：启用/禁用账户。
- `channels.zalo.accounts.<id>.dmPolicy`：每账户私信策略。
- `channels.zalo.accounts.<id>.allowFrom`：每账户允许列表。
- `channels.zalo.accounts.<id>.groupPolicy`：每账户群组策略。配置中存在该项；当前 Marketplace 机器人的行为请参见 [功能](#capabilities) 和 [访问控制（群组）](#access-control-groups)。
- `channels.zalo.accounts.<id>.groupAllowFrom`：每账户群组发送者允许列表。
- `channels.zalo.accounts.<id>.webhookUrl`：每账户 webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`：每账户 webhook 密钥。
- `channels.zalo.accounts.<id>.webhookPath`：每账户 webhook 路径。
- `channels.zalo.accounts.<id>.proxy`：每账户代理 URL。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证与配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为与提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型与加固
