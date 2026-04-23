---
read_when:
    - 更改输入指示器行为或默认值
summary: OpenClaw 何时显示输入指示器以及如何调节它们
title: 输入指示器
x-i18n:
    generated_at: "2026-04-23T20:47:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 936480fec0490dc7a26c2f2f036c923153dd71ecd220ebb9e2bd59e7dcb55016
    source_path: concepts/typing-indicators.md
    workflow: 15
---

在运行处于活动状态时，OpenClaw 会向聊天渠道发送输入指示器。使用
`agents.defaults.typingMode` 控制**何时**开始显示输入状态，使用 `typingIntervalSeconds`
控制**多久**刷新一次。

## 默认行为

当 `agents.defaults.typingMode` **未设置**时，OpenClaw 会保留旧版行为：

- **私聊**：模型循环一开始就立即显示输入状态。
- **带提及的群聊**：立即显示输入状态。
- **无提及的群聊**：只有在消息文本开始流式输出时才显示输入状态。
- **heartbeat 运行**：如果解析后的 heartbeat 目标是支持输入状态的聊天，并且未禁用输入状态，则会在 heartbeat 运行开始时显示输入状态。

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` —— 永不显示输入指示器。
- `instant` —— **模型循环一开始就立即**显示输入状态，即使该运行稍后只返回静默回复 token。
- `thinking` —— 在**第一条 reasoning 增量**到来时开始显示输入状态（要求该运行的 `reasoningLevel: "stream"`）。
- `message` —— 在**第一条非静默文本增量**到来时开始显示输入状态（会忽略
  `NO_REPLY` 静默 token）。

按“触发有多早”排序：
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

你也可以按会话覆盖模式或节奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 说明

- 当整个 payload 都是精确的静默 token（例如 `NO_REPLY` / `no_reply`，大小写不敏感匹配）时，`message` 模式不会为仅静默回复显示输入状态。
- `thinking` 只有在运行会流式传输 reasoning 时才会触发（`reasoningLevel: "stream"`）。
  如果模型没有发出 reasoning 增量，输入状态就不会开始显示。
- heartbeat 输入状态是针对已解析投递目标的存活信号。它会在 heartbeat 运行开始时启动，而不是遵循 `message` 或 `thinking` 的流时序。设置 `typingMode: "never"` 可禁用它。
- 当 `target: "none"`、目标无法解析、heartbeat 的聊天投递被禁用，或渠道不支持输入状态时，heartbeats 不会显示输入状态。
- `typingIntervalSeconds` 控制的是**刷新频率**，而不是开始时间。
  默认值为 6 秒。
