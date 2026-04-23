---
read_when:
    - 你想了解智能体拥有哪些会话工具
    - 你想配置跨会话访问或子智能体生成
    - 你想检查状态或控制已生成的子智能体
summary: 用于跨会话状态、召回、消息传递和子智能体编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-04-23T07:05:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8b545429726d0880e6086ba7190497861bf3f3e1e88d53cb38ef9e5e4468c6
    source_path: concepts/session-tool.md
    workflow: 15
---

# 会话工具

OpenClaw 为智能体提供工具，用于跨会话工作、检查状态以及编排子智能体。

## 可用工具

| 工具               | 功能                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | 列出会话，可附带可选过滤条件（类型、标签、智能体、最近活动、预览）         |
| `sessions_history` | 读取特定会话的对话记录                                                     |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待                                         |
| `sessions_spawn`   | 为后台工作生成一个隔离的子智能体会话                                       |
| `sessions_yield`   | 结束当前轮次，并等待后续的子智能体结果                                     |
| `subagents`        | 列出、引导或终止为该会话生成的子智能体                                     |
| `session_status`   | 显示类似 `/status` 的卡片，并可选择为每个会话设置模型覆盖                 |

## 列出和读取会话

`sessions_list` 会返回会话及其键名、agentId、类型、渠道、模型、
token 计数和时间戳。可按类型（`main`、`group`、`cron`、`hook`、
`node`）、精确 `label`、精确 `agentId`、搜索文本或最近活动时间
（`activeMinutes`）过滤。当你需要类似邮箱的分流排查时，它还可以为每一行请求
受可见性范围限制的派生标题、最后一条消息预览片段，或有限数量的
最近消息。派生标题和预览只会为调用方在当前配置的会话工具
可见性策略下本来就可以看到的会话生成，因此无关会话会保持隐藏。

`sessions_history` 会获取特定会话的对话记录。
默认情况下，工具结果会被排除——传入 `includeTools: true` 可查看它们。
返回的视图会被有意限制并经过安全过滤：

- 助手文本在召回前会被规范化：
  - 会移除 thinking 标签
  - 会移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 会移除纯文本工具调用 XML 负载块，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>`，包括那些从未正常闭合的截断负载
  - 会移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、
    `[Tool Result ...]` 和 `[Historical context ...]`
  - 会移除泄露的模型控制 token，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` token，以及全角变体 `<｜...｜>`
  - 会移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>`
- 返回前会对类似凭证/令牌的文本进行脱敏
- 过长文本块会被截断
- 超大的历史记录可能会丢弃较早的行，或将超大行替换为
  `[sessions_history omitted: message too large]`
- 该工具会报告摘要标志，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted` 和 `bytes`

这两个工具都接受**会话键名**（例如 `"main"`）或来自之前 list 调用的
**会话 ID**。

如果你需要精确到字节级一致的原始对话记录，请检查磁盘上的转录文件，
不要将 `sessions_history` 当作原始转储使用。

## 发送跨会话消息

`sessions_send` 会向另一个会话投递消息，并可选择等待响应：

- **发送后不管：** 设置 `timeoutSeconds: 0` 以入队后立即返回。
- **等待回复：** 设置超时时间，并以内联方式获得响应。

目标响应后，OpenClaw 可以运行一个**回复往返循环**，让多个
智能体轮流发送消息（最多 5 轮）。目标智能体可以回复
`REPLY_SKIP` 以提前停止。

## 状态和编排辅助工具

`session_status` 是用于当前或其他可见会话的轻量级 `/status` 等效工具。
它会报告使用情况、时间、模型/运行时状态，以及存在时的已关联后台任务上下文。
与 `/status` 一样，它可以从最近的对话记录使用条目中回填稀疏的 token/缓存计数，
并且 `model=default` 会清除每会话覆盖。

`sessions_yield` 会有意结束当前轮次，以便下一条消息可以成为
你正在等待的后续事件。在生成子智能体后，如果你希望完成结果作为下一条消息到达，
而不是构建轮询循环，请使用它。

`subagents` 是用于已生成 OpenClaw
子智能体的控制平面辅助工具。它支持：

- `action: "list"`：检查活跃/最近运行
- `action: "steer"`：向正在运行的子智能体发送后续引导
- `action: "kill"`：停止某个子智能体或 `all`

## 生成子智能体

`sessions_spawn` 会为后台任务创建一个隔离会话。它始终
是非阻塞的——会立即返回 `runId` 和 `childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"`，用于外部 harness 智能体。
- 为子会话设置 `model` 和 `thinking` 覆盖。
- `thread: true` 可将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 可对该子会话强制启用沙箱隔离。

默认的叶子子智能体不会获得会话工具。当
`maxSpawnDepth >= 2` 时，深度为 1 的编排型子智能体还会额外获得
`sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，
以便它们管理自己的子级。叶子运行仍然不会获得递归
编排工具。

完成后，公告步骤会将结果发布到请求方的渠道。
完成投递会在可用时保留已绑定的线程/话题路由，并且如果完成来源
只标识了一个渠道，OpenClaw 仍然可以复用请求方会话中已存储的路由
（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 专用行为，请参见 [ACP Agents](/zh-CN/tools/acp-agents)。

## 可见性

会话工具具有作用域限制，以限制智能体可见的内容：

| 级别    | 范围                               |
| ------- | ---------------------------------- |
| `self`  | 仅当前会话                         |
| `tree`  | 当前会话 + 已生成的子智能体        |
| `agent` | 该智能体的所有会话                 |
| `all`   | 所有会话（如果已配置，则跨智能体） |

默认值为 `tree`。沙箱隔离会话无论配置如何都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session) -- 路由、生命周期、维护
- [ACP Agents](/zh-CN/tools/acp-agents) -- 外部 harness 生成
- [多智能体](/zh-CN/concepts/multi-agent) -- 多智能体架构
- [Gateway Configuration](/zh-CN/gateway/configuration) -- 会话工具配置项
