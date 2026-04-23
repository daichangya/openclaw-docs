---
read_when:
    - 更改自动回复执行或并发时
summary: 将入站自动回复运行串行化的命令队列设计
title: 命令队列
x-i18n:
    generated_at: "2026-04-23T20:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0bcb6028142a8eb575f00ac68a023715fbc4c2efa72bcd19912abac931beabf4
    source_path: concepts/queue.md
    workflow: 15
---

# 命令队列（2026-01-16）

我们通过一个小型进程内队列将入站自动回复运行（所有渠道）串行化，以防止多个智能体运行发生冲突，同时仍允许跨会话进行安全并行。

## 为什么

- 自动回复运行可能开销很大（LLM 调用），并且当多个入站消息在很短时间内到达时可能发生冲突。
- 串行化可以避免争用共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的可能性。

## 工作原理

- 一个具备 lane 感知能力的 FIFO 队列会按照可配置的并发上限排空每个 lane（未配置 lane 默认值为 1；main 默认值为 4，subagent 为 8）。
- `runEmbeddedPiAgent` 会按**会话键**入队（lane `session:<key>`），以保证每个会话在同一时间只有一个活动运行。
- 然后，每个会话运行会再进入一个**全局 lane**（默认是 `main`），这样整体并行度就会受到 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果某次排队运行在开始前等待超过约 2 秒，队列会发出一条简短提示。
- 输入中指示器仍会在入队时立即触发（若渠道支持），因此在轮到它处理之前，用户体验不会改变。

## 队列模式（按渠道）

入站消息可以引导当前运行、等待后续轮次，或同时进行两者：

- `steer`：立即注入当前运行中（在下一个工具边界之后取消待处理工具调用）。如果未启用流式传输，则回退为 followup。
- `followup`：排队等待当前运行结束后的下一次智能体轮次。
- `collect`：将所有排队消息合并为**单个**后续轮次（默认）。如果消息目标不同渠道/线程，则会分别排空以保留路由。
- `steer-backlog`（也叫 `steer+backlog`）：立即 steer，**并且**为后续轮次保留该消息。
- `interrupt`（旧版）：中止该会话的当前活动运行，然后运行最新消息。
- `queue`（旧别名）：与 `steer` 相同。

Steer-backlog 意味着在 steer 运行之后，你还可能收到一条 followup 响应，因此在流式传输界面上看起来可能像重复回复。如果你希望每条入站消息只得到一个响应，请优先使用 `collect`/`steer`。
可将 `/queue collect` 作为独立命令发送（按会话生效），或设置 `messages.queue.byChannel.discord: "collect"`。

默认值（配置中未设置时）：

- 所有界面 → `collect`

可通过 `messages.queue` 全局配置或按渠道配置：

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 队列选项

这些选项适用于 `followup`、`collect` 和 `steer-backlog`（也适用于回退为 followup 的 `steer`）：

- `debounceMs`：在启动后续轮次前等待安静窗口（防止“继续、继续”）。
- `cap`：每个会话允许排队的最大消息数。
- `drop`：溢出策略（`old`、`new`、`summarize`）。

Summarize 会保留一份被丢弃消息的简短项目符号列表，并将其作为合成 followup 提示注入。
默认值：`debounceMs: 1000`、`cap: 20`、`drop: summarize`。

## 按会话覆盖

- 将 `/queue <mode>` 作为独立命令发送，以为当前会话存储该模式。
- 可组合选项：`/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 作用范围与保证

- 适用于所有使用 gateway 回复流水线的入站渠道上的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）在整个进程范围内用于入站消息 + 主心跳；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行。
- 还可能存在其他 lane（例如 `cron`、`subagent`），这样后台作业可以并行运行，而不会阻塞入站回复。这些分离运行会作为 [background tasks](/zh-CN/automation/tasks) 进行跟踪。
- 按会话的 lane 可保证同一时间只有一个智能体运行会接触某个特定会话。
- 无外部依赖，也不使用后台工作线程；纯 TypeScript + promises。

## 故障排除

- 如果命令看起来卡住了，请启用详细日志，并查找“queued for …ms”行，以确认队列正在排空。
- 如果你需要查看队列深度，请启用详细日志并观察队列耗时行。
