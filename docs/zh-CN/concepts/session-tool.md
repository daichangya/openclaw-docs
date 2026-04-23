---
read_when:
    - 你想了解智能体拥有哪些会话工具
    - 你想配置跨会话访问或 sub-agent 启动
    - 你想检查状态或控制已启动的 sub-agent
summary: 用于跨会话状态、回忆、消息传递和 sub-agent 编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-04-23T20:47:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f52463afe470c3f8b543ab630d7dcbecf5ed196a9c84a33c80fb5b865483b51
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw 为智能体提供了可跨会话工作、检查状态以及编排 sub-agent 的工具。

## 可用工具

| 工具 | 功能 |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list` | 列出会话，并支持可选过滤器（种类、标签、智能体、最近活跃度、预览） |
| `sessions_history` | 读取特定会话的转录 |
| `sessions_send` | 向另一个会话发送消息，并可选择等待 |
| `sessions_spawn` | 为后台工作启动一个隔离的 sub-agent 会话 |
| `sessions_yield` | 结束当前轮次，并等待后续的 sub-agent 结果 |
| `subagents` | 列出、引导或终止当前会话已启动的 sub-agent |
| `session_status` | 显示类似 `/status` 的卡片，并可选择设置每会话模型覆盖项 |

## 列出和读取会话

`sessions_list` 会返回会话及其键、agentId、种类、渠道、模型、
token 计数和时间戳。可按种类（`main`、`group`、`cron`、`hook`、
`node`）、精确 `label`、精确 `agentId`、搜索文本或最近活跃度
（`activeMinutes`）进行过滤。当你需要类似邮箱分拣的处理方式时，它还可以为每一行
请求一个基于可见性范围派生的标题、最后一条消息预览片段，或有界的最近消息。派生标题和预览只会为调用方在所配置的会话工具可见性策略下本来就能看到的会话生成，因此无关会话会保持隐藏。

`sessions_history` 会获取特定会话的对话转录。
默认情况下，工具结果会被排除 —— 传入 `includeTools: true` 可查看它们。
返回视图会有意进行边界限制和安全过滤：

- 助手文本在回忆前会被规范化：
  - 会移除 thinking 标签
  - 会移除 `<relevant-memories>` / `<relevant_memories>` 脚手架区块
  - 会移除纯文本工具调用 XML 载荷区块，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>`，包括那些未正常闭合的截断载荷
  - 会移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、
    `[Tool Result ...]` 和 `[Historical context ...]`
  - 会移除泄露的模型控制 token，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` token，以及全角变体 `<｜...｜>`
  - 会移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>`
- 类似凭证/令牌的文本会在返回前被脱敏
- 长文本块会被截断
- 非常大的历史记录可能会丢弃较早的行，或将过大的行替换为
  `[sessions_history omitted: message too large]`
- 该工具会报告摘要标志，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted` 和 `bytes`

这两个工具都接受**会话键**（例如 `"main"`）或来自之前 list 调用的**会话 ID**。

如果你需要完全逐字节一致的转录，请直接检查磁盘上的转录文件，而不要将 `sessions_history` 视为原始转储。

## 发送跨会话消息

`sessions_send` 会将一条消息投递到另一个会话，并可选择等待
响应：

- **即发即忘：** 设置 `timeoutSeconds: 0` 以加入队列并立即返回。
- **等待回复：** 设置超时时间，并以内联方式获取响应。

在目标响应后，OpenClaw 可以运行一个**reply-back loop**，让智能体交替发送消息（最多 5 轮）。目标智能体可以回复
`REPLY_SKIP` 来提前停止。

## 状态与编排辅助工具

`session_status` 是面向当前或其他可见会话的轻量级 `/status` 等价工具。它会报告使用情况、时间、模型/运行时状态，以及在存在时关联的后台任务上下文。与 `/status` 一样，它可以从最新转录的使用情况条目中回填稀疏的 token/cache 计数，而
`model=default` 会清除每会话覆盖项。

`sessions_yield` 会有意结束当前轮次，以便下一条消息
成为你正在等待的后续事件。在你启动 sub-agent 后，当你希望完成结果以下一条消息到达，而不是构建轮询循环时，请使用它。

`subagents` 是面向已启动的 OpenClaw
sub-agent 的控制平面辅助工具。它支持：

- `action: "list"`：检查活跃/最近运行
- `action: "steer"`：向正在运行的子智能体发送后续引导
- `action: "kill"`：停止一个子智能体或 `all`

## 启动 sub-agent

`sessions_spawn` 默认会为后台任务创建一个隔离会话。
它始终是非阻塞的 —— 会立即返回 `runId` 和
`childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"`，用于外部 harness 智能体。
- 为子会话设置 `model` 和 `thinking` 覆盖项。
- `thread: true` 将启动绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 对子智能体强制启用沙箱隔离。
- 对原生 sub-agent 使用 `context: "fork"`，当子智能体需要当前请求者转录时使用；若需要一个干净的子智能体，可省略此项或使用 `context: "isolated"`。

默认的叶子 sub-agent 不会获得会话工具。当
`maxSpawnDepth >= 2` 时，深度为 1 的编排型 sub-agent 还会额外获得
`sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，这样它们就能管理自己的子智能体。叶子运行仍然不会获得递归编排工具。

完成后，公告步骤会将结果发送到请求者的渠道。
在可用时，完成结果投递会保留所绑定的线程/主题路由；如果完成来源仅标识了一个渠道，OpenClaw 仍可重用请求者会话中存储的路由（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 特定行为，参见 [ACP Agents](/zh-CN/tools/acp-agents)。

## 可见性

会话工具具有作用域限制，用于限定智能体可见内容：

| 级别 | 范围 |
| ------- | ---------------------------------------- |
| `self` | 仅当前会话 |
| `tree` | 当前会话 + 已启动的 sub-agent |
| `agent` | 该智能体的所有会话 |
| `all` | 所有会话（如果已配置，则跨智能体） |

默认值为 `tree`。无论配置如何，沙箱隔离会话都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session) -- 路由、生命周期、维护
- [ACP Agents](/zh-CN/tools/acp-agents) -- 外部 harness 启动
- [多智能体](/zh-CN/concepts/multi-agent) -- 多智能体架构
- [Gateway 网关配置](/zh-CN/gateway/configuration) -- 会话工具配置项
