---
read_when:
    - 你想了解智能体拥有哪些会话工具
    - 你想配置跨会话访问或子智能体生成
    - 你想检查状态或控制已生成的子智能体
summary: 用于跨会话状态、回忆、消息传递和子智能体编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-04-23T22:57:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw 为智能体提供了可跨会话工作、检查状态和编排子智能体的工具。

## 可用工具

| 工具               | 作用                                                                     |
| ------------------ | ------------------------------------------------------------------------ |
| `sessions_list`    | 列出会话，可选过滤器包括种类、标签、智能体、最近活跃时间和预览           |
| `sessions_history` | 读取特定会话的转录内容                                                   |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待回复                                   |
| `sessions_spawn`   | 为后台工作生成一个隔离的子智能体会话                                     |
| `sessions_yield`   | 结束当前轮次并等待后续的子智能体结果                                     |
| `subagents`        | 列出、引导或终止此会话已生成的子智能体                                   |
| `session_status`   | 显示类似 `/status` 的状态卡片，并可选择设置按会话生效的模型覆盖          |

## 列出和读取会话

`sessions_list` 会返回会话及其 key、agentId、kind、channel、model、token 计数和时间戳。你可以按种类（`main`、`group`、`cron`、`hook`、`node`）、精确 `label`、精确 `agentId`、搜索文本或最近活跃时间（`activeMinutes`）进行筛选。当你需要类似邮箱的分拣视图时，它还可以为每一行请求一个受可见性范围限制的派生标题、最后一条消息的预览片段，或有界的最近消息。派生标题和预览仅会为调用方在已配置的会话工具可见性策略下本就可见的会话生成，因此无关会话会保持隐藏。

`sessions_history` 会获取特定会话的对话转录。默认情况下，工具结果会被排除 —— 传入 `includeTools: true` 可查看它们。返回的视图会被有意限制并进行安全过滤：

- 助手文本在回忆前会被标准化：
  - 会移除 thinking 标签
  - 会移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 会移除纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括那些从未正常闭合的截断载荷
  - 会移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 会移除泄漏的模型控制 token，例如 `<|assistant|>`、其他 ASCII `<|...|>` token，以及全角 `<｜...｜>` 变体
  - 会移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>`
- 返回前会对类似凭证/token 的文本进行脱敏
- 长文本块会被截断
- 非常大的历史记录可能会丢弃较早的行，或将过大的行替换为
  `[sessions_history omitted: message too large]`
- 该工具会报告摘要标记，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted` 和 `bytes`

这两个工具都接受 **session key**（如 `"main"`）或前一次列表调用返回的 **session ID**。

如果你需要精确到逐字节的原始转录，请直接检查磁盘上的转录文件，而不要将 `sessions_history` 当作原始转储使用。

## 发送跨会话消息

`sessions_send` 会将消息发送到另一个会话，并可选择等待响应：

- **发后即忘：** 设置 `timeoutSeconds: 0` 以入队后立即返回。
- **等待回复：** 设置超时时间，并内联获取响应。

目标回复后，OpenClaw 可以运行一个**回传循环**，让智能体交替发送消息（最多 5 轮）。目标智能体可以回复 `REPLY_SKIP` 以提前停止。

## 状态和编排辅助工具

`session_status` 是当前会话或另一个可见会话的轻量级 `/status` 等效工具。它会在存在相关信息时报告用量、时间、模型/运行时状态以及关联的后台任务上下文。与 `/status` 一样，它可以从最新的转录用量条目中回填稀疏的 token/cache 计数，而 `model=default` 会清除按会话生效的覆盖。

`sessions_yield` 会有意结束当前轮次，以便下一条消息就是你正在等待的后续事件。在你希望完成结果以下一条消息到达，而不是构建轮询循环时，可在生成子智能体后使用它。

`subagents` 是针对已生成 OpenClaw 子智能体的控制平面辅助工具。它支持：

- `action: "list"`：检查活跃/最近的运行
- `action: "steer"`：向正在运行的子项发送后续引导
- `action: "kill"`：停止一个子项或 `all`

## 生成子智能体

`sessions_spawn` 默认会为后台任务创建一个隔离的会话。它始终是非阻塞的 —— 会立即返回 `runId` 和 `childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"`，用于外部 harness 智能体。
- 针对子会话的 `model` 和 `thinking` 覆盖。
- `thread: true` 可将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 可对子项强制启用沙箱隔离。
- 当子项需要当前请求者的转录内容时，原生子智能体使用 `context: "fork"`；若需要一个干净的子项，则省略它或使用 `context: "isolated"`。

默认的叶子子智能体不会获得会话工具。当 `maxSpawnDepth >= 2` 时，深度为 1 的编排型子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们管理自己的子项。叶子运行仍然不会获得递归编排工具。

完成后，公告步骤会将结果发布到请求者的渠道。完成投递会在可用时保留已绑定的线程/主题路由；如果完成来源仅标识了一个渠道，OpenClaw 仍可复用请求者会话中存储的路由（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 特定行为，请参见 [ACP Agents](/zh-CN/tools/acp-agents)。

## 可见性

会话工具带有作用域限制，以限制智能体可见的内容：

| 级别    | 范围                         |
| ------- | ---------------------------- |
| `self`  | 仅当前会话                   |
| `tree`  | 当前会话 + 已生成的子智能体  |
| `agent` | 此智能体的所有会话           |
| `all`   | 所有会话（如果已配置可跨智能体） |

默认值为 `tree`。沙箱隔离会话无论配置如何都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session) —— 路由、生命周期、维护
- [ACP Agents](/zh-CN/tools/acp-agents) —— 外部 harness 生成
- [多智能体](/zh-CN/concepts/multi-agent) —— 多智能体架构
- [Gateway 网关配置](/zh-CN/gateway/configuration) —— 会话工具配置项

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
