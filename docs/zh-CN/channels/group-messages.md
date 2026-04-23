---
read_when:
    - 更改群组消息规则或提及功能时
summary: WhatsApp 群组消息处理的行为与配置（`mentionPatterns` 在各个界面间共享）
title: 群组消息
x-i18n:
    generated_at: "2026-04-23T20:41:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: db88738bafccf7a439d0e2258a169c03c651f952b597403fc871218dff357bdb
    source_path: channels/group-messages.md
    workflow: 15
---

# 群组消息（WhatsApp web 渠道）

目标：让 Clawd 可以待在 WhatsApp 群组中，仅在被点名时唤醒，并且将该线程与个人私信会话分开。

注意：`agents.list[].groupChat.mentionPatterns` 现在也被 Telegram/Discord/Slack/iMessage 使用；本文档聚焦于 WhatsApp 特定行为。对于多智能体设置，请为每个智能体设置 `agents.list[].groupChat.mentionPatterns`（或使用 `messages.groupChat.mentionPatterns` 作为全局回退）。

## 当前实现（2025-12-03）

- 激活模式：`mention`（默认）或 `always`。`mention` 需要一次点名触发（真实的 WhatsApp @ 提及，通过 `mentionedJids`、安全的正则模式，或文本中任意位置出现机器人的 E.164 号码）。`always` 会在每条消息上唤醒智能体，但它应仅在能提供有意义价值时回复；否则返回精确的静默令牌 `NO_REPLY` / `no_reply`。默认值可在配置中设置（`channels.whatsapp.groups`），并可通过 `/activation` 按群组覆盖。当设置了 `channels.whatsapp.groups` 时，它也会充当群组允许列表（包含 `"*"` 可允许全部）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式的 `channels.whatsapp.allowFrom`）。默认值为 `allowlist`（在你添加发送者之前会被阻止）。
- 按群组区分会话：会话键形如 `agent:<agentId>:whatsapp:group:<jid>`，因此诸如 `/verbose on`、`/trace on` 或 `/think high`（作为独立消息发送）的命令都只作用于该群组；个人私信状态不会受影响。群组线程会跳过心跳。
- 上下文注入：**仅待处理的**群组消息（默认 50 条）中，_未_ 触发运行的消息会以前缀 `[Chat messages since your last reply - for context]` 注入，而触发的那一行会放在 `[Current message - respond to this]` 下。已经在会话中的消息不会再次注入。
- 发送者显示：每个群组批次现在都会以 `[from: Sender Name (+E164)]` 结尾，这样 Pi 就知道是谁在说话。
- 阅后即焚/view-once：我们会在提取文本/提及之前先解包这些消息，因此其中的点名仍然可以触发。
- 群组系统提示词：在群组会话的第一轮（以及每次 `/activation` 更改模式时），我们会向系统提示词中注入一小段说明，例如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.`。如果元数据不可用，我们仍会告诉智能体这是一个群聊。

## 配置示例（WhatsApp）

在 `~/.openclaw/openclaw.json` 中添加一个 `groupChat` 块，这样即使 WhatsApp 从文本正文中去掉可见的 `@`，显示名称点名也能生效：

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

- 这些正则表达式不区分大小写，并使用与其他配置正则界面相同的安全正则防护；无效模式和不安全的嵌套重复会被忽略。
- 当有人点击联系人时，WhatsApp 仍会通过 `mentionedJids` 发送规范提及，因此数字回退很少需要，但作为安全兜底仍然有用。

### 激活命令（仅限所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，若未设置则为机器人自己的 E.164 号码）可以更改此项。在群组中以独立消息发送 `/status`，可查看当前激活模式。

## 使用方式

1. 将你的 WhatsApp 账户（运行 OpenClaw 的那个）加入群组。
2. 发送 `@openclaw …`（或包含该号码）。除非你设置 `groupPolicy: "open"`，否则只有允许列表中的发送者可以触发它。
3. 智能体提示词将包含最近的群组上下文以及末尾的 `[from: …]` 标记，以便它正确回应相应的人。
4. 会话级指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）仅应用于该群组的会话；请将它们作为独立消息发送，以便被识别。你的个人私信会话保持独立。

## 测试 / 验证

- 手动冒烟测试：
  - 在群组中发送一次 `@openclaw` 点名，并确认回复中提到了发送者姓名。
  - 发送第二次点名，并验证历史记录块已被包含，然后在下一轮被清除。
- 检查 Gateway 网关日志（使用 `--verbose` 运行），查看显示 `from: <groupJid>` 和 `[from: …]` 后缀的 `inbound web message` 条目。

## 已知注意事项

- 为避免产生噪声广播，群组会有意跳过心跳。
- 回声抑制使用合并后的整批字符串；如果你在没有提及的情况下发送两次相同文本，只有第一次会得到响应。
- 会话存储条目会在会话存储中显示为 `agent:<agentId>:whatsapp:group:<jid>`（默认位于 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；如果缺少该条目，只表示该群组尚未触发过一次运行。
- 群组中的输入中指示器遵循 `agents.defaults.typingMode`（默认：未被提及时为 `message`）。
