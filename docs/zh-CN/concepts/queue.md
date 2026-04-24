---
read_when:
    - 更改自动回复执行或并发行为
summary: 将入站自动回复运行串行化的命令队列设计
title: 命令队列
x-i18n:
    generated_at: "2026-04-24T18:07:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

我们通过一个小型进程内队列将入站自动回复运行（所有渠道）串行化，以防止多个智能体运行发生冲突，同时仍允许会话之间进行安全的并行处理。

## 为什么

- 自动回复运行可能成本较高（LLM 调用），并且当多条入站消息在短时间内接连到达时可能发生冲突。
- 串行化可以避免争用共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的可能性。

## 工作原理

- 一个支持 lane 感知的 FIFO 队列会按每个 lane 排空，并带有可配置的并发上限（未配置 lane 的默认值为 1；`main` 默认为 4，`subagent` 默认为 8）。
- `runEmbeddedPiAgent` 按 **会话键** 入队（lane `session:<key>`），以保证每个会话同一时间只有一个活动运行。
- 然后，每个会话运行会被排入一个 **全局 lane**（默认是 `main`），因此总体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果某个排队运行在启动前等待超过约 2 秒，会输出一条简短提示。
- 正在输入指示器仍会在入队时立即触发（当渠道支持时），因此等待期间的用户体验不会改变。

## 队列模式（按渠道）

入站消息可以引导当前运行、等待后续轮次，或同时执行两者：

- `steer`：立即注入当前运行（在下一个工具边界之后取消待处理的工具调用）。如果不支持流式传输，则回退为后续轮次。
- `followup`：在当前运行结束后，为下一次智能体轮次排队。
- `collect`：将所有排队消息合并为 **单个** 后续轮次（默认）。如果消息目标是不同的渠道 / 线程，则会分别排空以保留路由。
- `steer-backlog`（也叫 `steer+backlog`）：现在引导，**并且** 保留该消息用于一个后续轮次。
- `interrupt`（旧版）：中止该会话的活动运行，然后处理最新消息。
- `queue`（旧别名）：与 `steer` 相同。

`steer-backlog` 表示在引导运行之后，你还可能收到一次后续响应，因此在流式界面上看起来可能像重复回复。如果你希望每条入站消息只得到一次响应，优先使用 `collect`/`steer`。
发送独立命令 `/queue collect`（按会话生效），或设置 `messages.queue.byChannel.discord: "collect"`。

默认值（配置中未设置时）：

- 所有界面 → `collect`

通过 `messages.queue` 全局配置或按渠道配置：

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

这些选项适用于 `followup`、`collect` 和 `steer-backlog`（以及回退为 followup 时的 `steer`）：

- `debounceMs`：在启动后续轮次前等待安静期（防止出现“继续、继续”）。
- `cap`：每个会话允许排队的最大消息数。
- `drop`：溢出策略（`old`、`new`、`summarize`）。

`Summarize` 会保留一个简短的已丢弃消息项目符号列表，并将其作为合成的后续提示注入。
默认值：`debounceMs: 1000`、`cap: 20`、`drop: summarize`。

## 按会话覆盖

- 发送独立命令 `/queue <mode>` 可为当前会话存储该模式。
- 可组合选项：`/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖设置。

## 作用范围与保证

- 适用于所有使用网关回复流水线的入站渠道上的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）在整个进程范围内用于入站 + 主心跳；设置 `agents.defaults.maxConcurrent` 可以允许多个会话并行运行。
- 还可能存在其他 lane（例如 `cron`、`subagent`），这样后台任务就可以并行运行，而不会阻塞入站回复。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。
- 按会话划分的 lane 可保证同一时间只有一个智能体运行会操作某个给定会话。
- 无需外部依赖或后台工作线程；纯 TypeScript + promises。

## 故障排除

- 如果命令看起来卡住了，请启用详细日志，并查找“queued for …ms”这样的行，以确认队列正在排空。
- 如果你需要查看队列深度，请启用详细日志并观察队列计时相关的输出行。

## 相关内容

- [Session management](/zh-CN/concepts/session)
- [Retry policy](/zh-CN/concepts/retry)
