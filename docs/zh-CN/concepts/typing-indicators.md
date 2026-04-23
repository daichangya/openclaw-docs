---
read_when:
    - 更改“正在输入”指示器的行为或默认值
summary: OpenClaw 何时显示“正在输入”指示器，以及如何调整它们
title: “正在输入”指示器
x-i18n:
    generated_at: "2026-04-23T22:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

“正在输入”指示器会在一次运行处于激活状态时发送到聊天渠道。使用
`agents.defaults.typingMode` 控制**何时**开始显示输入状态，使用 `typingIntervalSeconds`
控制**多久**刷新一次。

## 默认值

当 `agents.defaults.typingMode` **未设置** 时，OpenClaw 会保留旧版行为：

- **私聊**：模型循环一开始就立即显示“正在输入”。
- **带提及的群聊**：立即显示“正在输入”。
- **不带提及的群聊**：只有在消息文本开始流式输出时才显示“正在输入”。
- **Heartbeat 运行**：如果已解析的 heartbeat 目标是支持输入状态的聊天，且未禁用输入状态，则在 heartbeat 运行开始时显示“正在输入”。

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` — 永不显示“正在输入”指示器。
- `instant` — **模型循环一开始**就显示“正在输入”，即使该次运行之后只返回静默回复 token。
- `thinking` — 在**第一个推理增量**出现时显示“正在输入”（要求该次运行使用 `reasoningLevel: "stream"`）。
- `message` — 在**第一个非静默文本增量**出现时显示“正在输入”（会忽略 `NO_REPLY` 静默 token）。

按“触发有多早”的顺序排列：
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

你也可以按会话覆盖模式或频率：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 说明

- 在 `message` 模式下，如果整个负载恰好是静默 token，则不会显示“正在输入”，例如 `NO_REPLY` / `no_reply`（大小写不敏感匹配）。
- `thinking` 只有在该次运行流式输出推理内容时才会触发（`reasoningLevel: "stream"`）。
  如果模型没有发出推理增量，则不会开始显示“正在输入”。
- Heartbeat 输入状态是针对已解析投递目标的存活信号。它会在 heartbeat 运行开始时显示，而不是遵循 `message` 或 `thinking` 的流式时机。将 `typingMode: "never"` 设为禁用它。
- 在以下情况下，heartbeat 不会显示“正在输入”：`target: "none"`、目标无法解析、该 heartbeat 禁用了聊天投递，或该渠道不支持输入状态。
- `typingIntervalSeconds` 控制的是**刷新频率**，而不是开始时间。
  默认值为 6 秒。

## 相关内容

- [在线状态](/zh-CN/concepts/presence)
- [流式传输与分块](/zh-CN/concepts/streaming)
