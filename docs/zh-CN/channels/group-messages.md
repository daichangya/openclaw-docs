---
read_when:
    - 更改群组消息规则或提及方式
summary: WhatsApp 群组消息处理的行为和配置（`mentionPatterns` 在各个界面之间共享）
title: 群组消息
x-i18n:
    generated_at: "2026-04-23T22:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: f67ed72c0e61aef18a529cb1d9dbc98909e213352ff7cbef93fe4c9bf8357186
    source_path: channels/group-messages.md
    workflow: 15
---

# 群组消息（WhatsApp web 渠道）

目标：让 Clawd 可以待在 WhatsApp 群组中，只在被点名时唤醒，并将该线程与个人私信会话分开。

注意：`agents.list[].groupChat.mentionPatterns` 现在也用于 Telegram/Discord/Slack/iMessage；本文档重点介绍 WhatsApp 特有的行为。对于多智能体设置，请为每个智能体设置 `agents.list[].groupChat.mentionPatterns`（或使用 `messages.groupChat.mentionPatterns` 作为全局回退）。

## 当前实现（2025-12-03）

- 激活模式：`mention`（默认）或 `always`。`mention` 需要一次点名（真正的 WhatsApp @ 提及，通过 `mentionedJids`、安全正则模式，或文本中任意位置出现机器人的 E.164 号码）。`always` 会在每条消息上唤醒智能体，但它应仅在能够提供有意义帮助时回复；否则返回精确的静默令牌 `NO_REPLY` / `no_reply`。默认值可在配置中设置（`channels.whatsapp.groups`），并可通过 `/activation` 按群组覆盖。当设置了 `channels.whatsapp.groups` 时，它还会充当群组允许列表（包含 `"*"` 以允许全部）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式的 `channels.whatsapp.allowFrom`）。默认值为 `allowlist`（在你添加发送者之前会被阻止）。
- 按群组划分的会话：会话键看起来像 `agent:<agentId>:whatsapp:group:<jid>`，因此诸如 `/verbose on`、`/trace on` 或 `/think high` 之类的命令（作为独立消息发送）会限定在该群组内；个人私信状态不会受到影响。群组线程会跳过心跳。
- 上下文注入：**仅待处理** 的群组消息（默认 50 条）如果 _没有_ 触发运行，会以 `[Chat messages since your last reply - for context]` 为前缀注入，触发的那一行则放在 `[Current message - respond to this]` 之下。已经在会话中的消息不会被再次注入。
- 发送者呈现：现在每个群组批次都会以 `[from: Sender Name (+E164)]` 结尾，以便 Pi 知道是谁在发言。
- 阅后即焚 / 查看一次：我们会在提取文本 / 提及之前先解包这些内容，因此其中的点名仍然可以触发。
- 群组系统提示：在群组会话的第一轮（以及每次 `/activation` 更改模式时），我们会向系统提示中注入一段简短说明，例如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.`。如果元数据不可用，我们仍会告诉智能体这是一个群聊。

## 配置示例（WhatsApp）

向 `~/.openclaw/openclaw.json` 添加一个 `groupChat` 块，以便即使 WhatsApp 在文本正文中去掉了可见的 `@`，显示名称点名仍然可以生效：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

说明：

- 这些正则表达式不区分大小写，并使用与其他配置正则界面相同的安全正则防护规则；无效模式和不安全的嵌套重复会被忽略。
- 当有人点按联系人时，WhatsApp 仍会通过 `mentionedJids` 发送规范化提及，因此数字回退很少需要，但它是一个有用的安全兜底。

### 激活命令（仅限所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，若未设置则使用机器人自己的 E.164）可以更改此项。在群组中发送独立消息 `/status` 以查看当前激活模式。

## 如何使用

1. 将你的 WhatsApp 账号（运行 OpenClaw 的那个）添加到群组中。
2. 发送 `@openclaw …`（或包含号码）。除非你设置 `groupPolicy: "open"`，否则只有在允许列表中的发送者才能触发它。
3. 智能体提示将包含最近的群组上下文以及末尾的 `[from: …]` 标记，以便它能够回应正确的人。
4. 会话级指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）仅应用于该群组的会话；请将它们作为独立消息发送，以便能够被识别。你的个人私信会话将保持独立。

## 测试 / 验证

- 手动冒烟测试：
  - 在群组中发送一次 `@openclaw` 点名，并确认回复中提到了发送者姓名。
  - 发送第二次点名，并验证历史块已被包含，然后在下一轮被清除。
- 检查 Gateway 网关日志（使用 `--verbose` 运行），查看显示 `from: <groupJid>` 和 `[from: …]` 后缀的 `inbound web message` 条目。

## 已知注意事项

- 群组会有意跳过心跳，以避免产生嘈杂的广播。
- 回声抑制使用组合后的批次字符串；如果你在没有提及的情况下发送两次相同文本，只有第一次会得到回复。
- 会话存储条目会在会话存储中显示为 `agent:<agentId>:whatsapp:group:<jid>`（默认位于 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；如果缺少条目，只意味着该群组尚未触发过运行。
- 群组中的输入指示器遵循 `agents.defaults.typingMode`（默认：未被提及时为 `message`）。

## 相关

- [群组](/zh-CN/channels/groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [广播群组](/zh-CN/channels/broadcast-groups)
