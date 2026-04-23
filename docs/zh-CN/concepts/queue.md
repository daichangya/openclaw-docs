---
read_when:
    - 更改自动回复执行或并发行为
summary: 用于串行化入站自动回复运行的命令队列设计
title: 命令队列
x-i18n:
    generated_at: "2026-04-23T22:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# 命令队列（2026-01-16）

我们通过一个小型进程内队列，将入站自动回复运行（所有渠道）串行化，以防止多个智能体运行发生冲突，同时仍允许在不同会话之间进行安全并行。

## 原因

- 自动回复运行可能成本较高（LLM 调用），并且当多条入站消息在相近时间到达时，可能会发生冲突。
- 串行化可避免争用共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的可能性。

## 工作原理

- 一个具备 lane 感知能力的 FIFO 队列会按每个 lane 进行排空，并受可配置并发上限控制（未配置 lane 的默认值为 1；main 默认为 4，subagent 默认为 8）。
- `runEmbeddedPiAgent` 按**会话键**入队（lane `session:<key>`），以保证每个会话同一时间只有一个活动运行。
- 然后，每个会话运行还会被排入一个**全局 lane**（默认是 `main`），因此整体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队运行在开始前等待超过约 2 秒，会输出一条简短提示。
- 输入中指示器仍会在入队时立即触发（如果该渠道支持），因此等待轮到时用户体验不会改变。

## 队列模式（按渠道）

入站消息可以控制当前运行、等待后续轮次，或同时执行两者：

- `steer`：立即注入当前运行（在下一个工具边界之后取消待处理工具调用）。如果当前未流式传输，则回退到 followup。
- `followup`：加入当前运行结束后的下一个智能体轮次队列。
- `collect`：将所有排队消息合并为**一个**后续轮次（默认）。如果消息目标是不同渠道/线程，则会分别排空以保留路由。
- `steer-backlog`（也叫 `steer+backlog`）：现在引导 **并且** 为后续轮次保留该消息。
- `interrupt`（旧版）：中止该会话的活动运行，然后运行最新消息。
- `queue`（旧别名）：与 `steer` 相同。

Steer-backlog 意味着在被引导的运行之后，你可能还会收到一条后续响应，因此流式界面看起来可能像是重复回复。如果你希望每条入站消息只对应一个响应，请优先使用 `collect`/`steer`。
发送独立命令 `/queue collect`（按会话生效），或设置 `messages.queue.byChannel.discord: "collect"`。

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

这些选项适用于 `followup`、`collect` 和 `steer-backlog`（以及回退到 followup 时的 `steer`）：

- `debounceMs`：在启动后续轮次前等待安静期（防止出现“继续、继续”）。
- `cap`：每个会话的最大排队消息数。
- `drop`：溢出策略（`old`、`new`、`summarize`）。

Summarize 会保留一份简短的已丢弃消息项目符号列表，并将其作为一个合成的后续提示注入。
默认值：`debounceMs: 1000`、`cap: 20`、`drop: summarize`。

## 按会话覆盖

- 发送独立命令 `/queue <mode>` 可为当前会话存储该模式。
- 选项可组合：`/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除该会话的覆盖设置。

## 范围与保证

- 适用于所有使用 Gateway 网关回复管线的入站渠道上的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）在进程级别适用于入站消息 + 主心跳；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行。
- 还可能存在其他 lane（例如 `cron`、`subagent`），这样后台任务就可以并行运行，而不会阻塞入站回复。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。
- 按会话 lane 保证同一时间只有一个智能体运行会访问某个给定会话。
- 无外部依赖，也不使用后台工作线程；纯 TypeScript + promises。

## 故障排除

- 如果命令看起来卡住了，请启用详细日志，并查找 “queued for …ms” 行，以确认队列正在排空。
- 如果你需要查看队列深度，请启用详细日志并观察队列计时行。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [重试策略](/zh-CN/concepts/retry)
