---
read_when:
    - 你想了解智能体拥有哪些会话工具
    - 你想配置跨会话访问或生成子智能体
    - 你想检查状态或控制已生成的子智能体
summary: 用于跨会话状态、回忆、消息传递和子智能体编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-04-23T01:35:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d99408f3052f4fa461bc26bf79456e7f852069ec101b9d593442cef6dd20a3ac
    source_path: concepts/session-tool.md
    workflow: 15
---

# 会话工具

OpenClaw 为智能体提供工具，以便跨会话工作、检查状态并编排子智能体。

## 可用工具

| 工具 | 作用 |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出会话，并可选使用过滤器（kind、label、agent、最近活动时间、预览） |
| `sessions_history` | 读取特定会话的转录记录 |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待 |
| `sessions_spawn`   | 为后台工作生成一个隔离的子智能体会话 |
| `sessions_yield`   | 结束当前轮次，并等待后续的子智能体结果 |
| `subagents`        | 列出、引导或终止当前会话已生成的子智能体 |
| `session_status`   | 显示一个类似 `/status` 的卡片，并可选择为单个会话设置模型覆盖 |

## 列出和读取会话

`sessions_list` 会返回会话及其 key、agentId、kind、channel、model、token 计数和时间戳。你可以按 kind（`main`、`group`、`cron`、`hook`、`node`）、精确的 `label`、精确的 `agentId`、搜索文本或最近活动时间（`activeMinutes`）进行筛选。当你需要类似邮箱收件箱的分诊视图时，它还可以请求派生标题、最后一条消息预览或限定数量的最近消息。预览转录读取会被限制在当前配置的会话工具可见性策略允许看到的会话范围内。

`sessions_history` 会获取特定会话的对话转录记录。默认情况下，工具结果会被排除——传入 `includeTools: true` 可查看它们。返回的视图会被有意限制并经过安全过滤：

- 在回忆前，assistant 文本会被规范化：
  - 会移除 thinking 标签
  - 会移除 `<relevant-memories>` / `<relevant_memories>` 脚手架区块
  - 会移除纯文本工具调用 XML 负载区块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，也包括那些被截断且未正常闭合的负载
  - 会移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 会移除泄露的模型控制 token，例如 `<|assistant|>`、其他 ASCII `<|...|>` token，以及全角 `<｜...｜>` 变体
  - 会移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` / `</minimax:tool_call>`
- 在返回前，类似凭证/token 的文本会被脱敏
- 长文本区块会被截断
- 对于非常大的历史记录，可能会丢弃较早的行，或将超大的单行替换为 `[sessions_history omitted: message too large]`
- 该工具会报告摘要标记，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted` 和 `bytes`

这两个工具都接受 **会话 key**（例如 `"main"`）或来自之前列表调用的 **会话 ID**。

如果你需要精确到字节、完全一致的转录记录，请直接检查磁盘上的转录文件，而不要把 `sessions_history` 当作原始转储使用。

## 发送跨会话消息

`sessions_send` 会向另一个会话投递消息，并可选择等待响应：

- **只发送不等待：** 设置 `timeoutSeconds: 0` 以入队并立即返回。
- **等待回复：** 设置一个超时时间，并以内联方式获取响应。

目标响应后，OpenClaw 可以运行一个**回复往返循环**，其中智能体会交替发送消息（最多 5 轮）。目标智能体可以回复 `REPLY_SKIP` 以提前停止。

## 状态与编排辅助工具

`session_status` 是用于当前会话或另一个可见会话的轻量级 `/status` 等效工具。它会报告用量、时间、模型/运行时状态，以及存在时所关联的后台任务上下文。与 `/status` 一样，它可以从最新的转录 usage 条目中回填稀疏的 token/cache 计数器，而 `model=default` 会清除单个会话的覆盖设置。

`sessions_yield` 会有意结束当前轮次，以便下一条消息成为你正在等待的后续事件。在生成子智能体后，如果你希望完成结果作为下一条消息到达，而不是构建轮询循环，就可以使用它。

`subagents` 是用于已生成的 OpenClaw 子智能体的控制平面辅助工具。它支持：

- `action: "list"`，用于检查活跃/最近运行
- `action: "steer"`，用于向正在运行的子任务发送后续指导
- `action: "kill"`，用于停止一个子任务或 `all`

## 生成子智能体

`sessions_spawn` 会为后台任务创建一个隔离的会话。它始终是非阻塞的——会立即返回一个 `runId` 和 `childSessionKey`。

关键选项包括：

- `runtime: "subagent"`（默认）或 `"acp"`，用于外部 harness 智能体。
- 为子会话设置 `model` 和 `thinking` 覆盖。
- `thread: true`，用于将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"`，用于对子任务强制启用沙箱隔离。

默认的叶子子智能体不会获得会话工具。当 `maxSpawnDepth >= 2` 时，深度为 1 的编排型子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们管理自己的子任务。叶子运行仍然不会获得递归编排工具。

完成后，announce 步骤会将结果发布到请求方的渠道。完成交付会尽可能保留已绑定的线程/主题路由；如果完成来源只标识了一个渠道，OpenClaw 仍可复用请求方会话中存储的路由（`lastChannel` / `lastTo`）来进行直接交付。

有关 ACP 特定行为，请参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 可见性

会话工具的作用域经过限制，以控制智能体可以看到的内容：

| 级别 | 范围 |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话 |
| `tree`  | 当前会话 + 已生成的子智能体 |
| `agent` | 该智能体的所有会话 |
| `all`   | 所有会话（如果已配置，也包括跨智能体） |

默认级别为 `tree`。沙箱隔离会话无论配置如何都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session) -- 路由、生命周期、维护
- [ACP 智能体](/zh-CN/tools/acp-agents) -- 外部 harness 生成
- [多智能体](/zh-CN/concepts/multi-agent) -- 多智能体架构
- [Gateway 网关配置](/zh-CN/gateway/configuration) -- 会话工具配置选项
