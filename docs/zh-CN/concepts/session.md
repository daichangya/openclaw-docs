---
read_when:
    - 你想了解会话路由与隔离机制
    - 你想为多用户设置配置私信范围♀♀♀analysis to=final code  omitted
summary: OpenClaw 如何管理对话会话
title: 会话管理
x-i18n:
    generated_at: "2026-04-23T20:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39ee93111f66fe56be970a6ccd5ae50deb5792ef396c112e0f737d1f7a9ec2f8
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw 将对话组织为**会话**。每条消息都会根据其来源被路由到某个
会话 —— 例如私信、群聊、cron 作业等。

## 消息如何路由

| 来源 | 行为 |
| --------------- | ------------------------- |
| 私信 | 默认共享会话 |
| 群聊 | 按群组隔离 |
| 房间/渠道 | 按房间隔离 |
| Cron 作业 | 每次运行使用新会话 |
| Webhook | 按 hook 隔离 |

## 私信隔离

默认情况下，所有私信共享一个会话，以保持连续性。这对于
单用户设置是合适的。

<Warning>
如果有多个人可以给你的智能体发消息，请启用私信隔离。否则，所有
用户都会共享同一个对话上下文 —— Alice 的私密消息会对 Bob 可见。
</Warning>

**修复方法：**

```json5
{
  session: {
    dmScope: "per-channel-peer", // 按渠道 + 发送者隔离
  },
}
```

其他选项：

- `main`（默认）—— 所有私信共享一个会话。
- `per-peer` —— 按发送者隔离（跨渠道）。
- `per-channel-peer` —— 按渠道 + 发送者隔离（推荐）。
- `per-account-channel-peer` —— 按账户 + 渠道 + 发送者隔离。

<Tip>
如果同一个人通过多个渠道联系你，请使用
`session.identityLinks` 链接他们的身份，这样他们就会共享一个会话。
</Tip>

使用 `openclaw security audit` 验证你的设置。

## 会话生命周期

会话会一直复用，直到过期：

- **每日重置**（默认）—— gateway
  主机本地时间每天凌晨 4:00 开启新会话。
- **空闲重置**（可选）—— 一段时间无活动后开启新会话。设置
  `session.reset.idleMinutes`。
- **手动重置**—— 在聊天中输入 `/new` 或 `/reset`。`/new <model>` 还会
  切换模型。

当同时配置每日重置和空闲重置时，以先到期者为准。

拥有活动中的提供商自有 CLI 会话的会话，不会被隐式的
每日默认值切断。当这些会话应按计时器过期时，请使用 `/reset` 或显式配置 `session.reset`。

## 状态存储位置

所有会话状态都由 **gateway** 持有。UI 客户端通过 gateway 查询
会话数据。

- **存储：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **转录记录：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## 会话维护

OpenClaw 会随着时间自动限制会话存储大小。默认情况下，它运行在
`warn` 模式（报告将会清理哪些内容）。将 `session.maintenance.mode`
设置为 `"enforce"` 以启用自动清理：

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

可使用 `openclaw sessions cleanup --dry-run` 预览。

## 检查会话

- `openclaw status` —— 会话存储路径和最近活动。
- `openclaw sessions --json` —— 所有会话（可用 `--active <minutes>` 过滤）。
- 聊天中的 `/status` —— 上下文使用量、模型和开关状态。
- `/context list` —— 系统提示词中包含了什么。

## 延伸阅读

- [Session Pruning](/zh-CN/concepts/session-pruning) —— 裁剪工具结果
- [Compaction](/zh-CN/concepts/compaction) —— 总结长对话
- [Session Tools](/zh-CN/concepts/session-tool) —— 用于跨会话工作的智能体工具
- [Session Management Deep Dive](/zh-CN/reference/session-management-compaction) —
  存储 schema、转录记录、发送策略、来源元数据和高级配置
- [Multi-Agent](/zh-CN/concepts/multi-agent) — 跨智能体的路由与会话隔离
- [Background Tasks](/zh-CN/automation/tasks) — 分离任务如何创建带有会话引用的任务记录
- [Channel Routing](/zh-CN/channels/channel-routing) — 入站消息如何被路由到会话
