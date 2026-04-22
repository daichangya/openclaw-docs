---
read_when:
    - 更改输入指示器行为或默认设置
summary: 当 OpenClaw 显示输入指示器，以及如何调整它们
title: 输入指示器
x-i18n:
    generated_at: "2026-04-22T05:01:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# 输入指示器

当一次运行处于活动状态时，输入指示器会发送到聊天渠道。使用
`agents.defaults.typingMode` 来控制输入**何时**开始，使用 `typingIntervalSeconds`
来控制它**多久**刷新一次。

## 默认值

当 `agents.defaults.typingMode` **未设置** 时，OpenClaw 会保持旧版行为：

- **私聊**：模型循环一开始就立即显示输入状态。
- **带提及的群聊**：立即显示输入状态。
- **不带提及的群聊**：只有在消息文本开始流式传输时才显示输入状态。
- **心跳运行**：如果解析后的心跳目标是支持输入状态的聊天，且未禁用输入状态，则在心跳运行开始时显示输入状态。

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` — 永不显示输入指示器。
- `instant` — **一旦模型循环开始** 就显示输入状态，即使该次运行最终只返回静默回复标记也是如此。
- `thinking` — 在**第一个推理增量**到达时开始显示输入状态（要求该次运行设置 `reasoningLevel: "stream"`）。
- `message` — 在**第一个非静默文本增量**到达时开始显示输入状态（会忽略 `NO_REPLY` 静默标记）。

按“触发得有多早”的顺序排列：
`never` → `message` → `thinking` → `instant`

## 配置

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

你可以按会话覆盖模式或频率：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事项

- 当整个负载就是精确的静默标记时，`message` 模式不会为仅静默的回复显示输入状态（例如 `NO_REPLY` / `no_reply`，按大小写不敏感匹配）。
- `thinking` 仅在该次运行流式传输推理时才会触发（`reasoningLevel: "stream"`）。
  如果模型没有发出推理增量，输入状态就不会开始。
- 心跳输入状态是已解析投递目标的存活信号。它会在心跳运行开始时启动，而不是遵循 `message` 或 `thinking` 的流式时机。将 `typingMode: "never"` 设为禁用。
- 当 `target: "none"`、目标无法解析、心跳的聊天投递被禁用，或渠道不支持输入状态时，心跳不会显示输入状态。
- `typingIntervalSeconds` 控制的是**刷新频率**，不是开始时间。
  默认值为 6 秒。
