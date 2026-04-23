---
read_when:
    - |-
      你希望通过智能体执行后台/并行工作 博悦 to=functions.read  天天彩票是json
      {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/","offset":1,"limit":1}
    - "你正在更改 `sessions_spawn` 或子智能体工具策略ԥхьаӡара to=functions.read 】【。】【”】【json\n{\"path\":\"/home/runner/work/docs/docs/source/scripts/docs-i18n/\",\"offset\":1,\"limit\":1}\U0004E903analysis to=functions.read code  天天众json\n{\"path\":\"/home/runner/work/docs/docs/source/scripts/docs-i18n/\",\"offset\":1,\"limit\":1}"
    - 你正在实现或排查线程绑定的子智能体会话
summary: 子智能体：生成隔离的智能体运行，并将结果回报到请求者聊天中
title: 子智能体
x-i18n:
    generated_at: "2026-04-23T21:10:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc5a5865f1758bcbaf6b68443e25f1fd754e90ee810f4fee03ae996e2f64562f
    source_path: tools/subagents.md
    workflow: 15
---

子智能体是在现有智能体运行过程中生成的后台智能体运行。它们运行在自己的会话中（`agent:<agentId>:subagent:<uuid>`），并在完成后，**将结果通告**回请求者聊天渠道。每个子智能体运行都会被追踪为一个[后台任务](/zh-CN/automation/tasks)。

## 斜杠命令

使用 `/subagents` 可检查或控制**当前会话**的子智能体运行：

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

线程绑定控制：

这些命令仅适用于支持持久线程绑定的渠道。请参见下方的**支持线程的渠道**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 会显示运行元数据（状态、时间戳、会话 id、转录路径、清理方式）。
如需有限且经过安全过滤的回溯视图，请使用 `sessions_history`；如果你需要查看原始完整转录，请直接检查磁盘上的转录路径。

### 生成行为

`/subagents spawn` 会以用户命令的方式启动一个后台子智能体，而不是内部中继，并且在该运行完成后，会向请求者聊天发送一条最终完成更新。

- spawn 命令是非阻塞的；它会立即返回一个运行 id。
- 完成时，子智能体会将一条摘要/结果消息通告回请求者聊天渠道。
- 完成采用推送模式。一旦生成后，不要通过循环轮询 `/subagents list`、
  `sessions_list` 或 `sessions_history` 来等待它完成；仅在需要调试或干预时按需检查状态。
- 完成时，OpenClaw 会尽力在通告清理流程继续之前，关闭由该子智能体会话打开的已跟踪浏览器标签页/进程。
- 对于手动生成，投递具有弹性：
  - OpenClaw 会先尝试使用稳定幂等键进行直接 `agent` 投递。
  - 如果直接投递失败，会回退到队列路由。
  - 如果队列路由仍不可用，通告会在短暂的指数退避后继续重试，直到最终放弃。
- 完成投递会保留已解析的请求者路由：
  - 只要可用，线程绑定或基于会话的完成路由就优先生效
  - 如果完成来源只提供了一个渠道，OpenClaw 会从请求者会话已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）中补齐缺失的目标/账户，以确保直接投递仍可工作
- 向请求者会话交接的完成内容属于运行时生成的内部上下文（而不是用户编写的文本），其中包括：
  - `Result`（最近可见的 `assistant` 回复文本；否则使用已清理的最近 tool/toolResult 文本；终止失败的运行不会复用捕获到的回复文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 紧凑的运行时/token 统计信息
  - 一条投递指令，告诉请求者智能体要用正常助手语气重写，而不是转发原始内部元数据
- `--model` 和 `--thinking` 会覆盖该次运行的默认值。
- 完成后可使用 `info`/`log` 检查详情和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久线程绑定会话，请使用 `sessions_spawn`，并设置 `thread: true` 与 `mode: "session"`。
- 对于 ACP harness 会话（Codex、Claude Code、Gemini CLI），请使用 `sessions_spawn` 并设置 `runtime: "acp"`；在调试完成通知或智能体到智能体循环时，请参见 [ACP Agents](/zh-CN/tools/acp-agents)，尤其是其中的 [ACP 投递模型](/zh-CN/tools/acp-agents#delivery-model)。

主要目标：

- 在不阻塞主运行的情况下，并行执行“研究 / 长任务 / 慢工具”工作。
- 默认保持子智能体隔离（会话隔离 + 可选沙箱隔离）。
- 保持工具表面不易被误用：子智能体默认**不会**获得会话工具。
- 支持可配置的嵌套深度，以适配编排器模式。

成本说明：每个子智能体默认都有其**自己的**上下文和 token 消耗。对于重量级或
重复性任务，可以为子智能体设置更便宜的模型，而将主智能体保留在
更高质量模型上。可通过 `agents.defaults.subagents.model` 或按智能体
覆盖项进行配置。当某个子智能体确实需要请求者当前转录内容时，智能体可以在那次生成时请求
`context: "fork"`。

## 工具

使用 `sessions_spawn`：

- 启动一个子智能体运行（`deliver: false`，全局通道：`subagent`）
- 然后执行一次通告步骤，并将通告回复发送到请求者聊天渠道
- 默认模型：继承调用者，除非你设置了 `agents.defaults.subagents.model`（或按智能体的 `agents.list[].subagents.model`）；显式的 `sessions_spawn.model` 仍然优先生效。
- 默认 thinking：继承调用者，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体的 `agents.list[].subagents.thinking`）；显式的 `sessions_spawn.thinking` 仍然优先生效。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退为 `0`（无超时）。

工具参数：

- `task`（必需）
- `label?`（可选）
- `agentId?`（可选；如果允许，可在另一个智能体 id 下生成）
- `model?`（可选；覆盖子智能体模型；无效值会被跳过，子智能体会使用默认模型运行，并在工具结果中附带警告）
- `thinking?`（可选；覆盖子智能体运行的 thinking 级别）
- `runTimeoutSeconds?`（默认使用 `agents.defaults.subagents.runTimeoutSeconds`，若未设置则为 `0`；设置后，子智能体运行会在 N 秒后中止）
- `thread?`（默认 `false`；若为 `true`，则为该子智能体会话请求渠道线程绑定）
- `mode?`（`run|session`）
  - 默认是 `run`
  - 如果 `thread: true` 且未指定 `mode`，默认会变为 `session`
  - `mode: "session"` 要求 `thread: true`
- `cleanup?`（`delete|keep`，默认 `keep`）
- `sandbox?`（`inherit|require`，默认 `inherit`；`require` 会在目标子运行时未启用沙箱时拒绝生成）
- `context?`（`isolated|fork`，默认 `isolated`；仅适用于原生子智能体）
  - `isolated` 会创建干净的子转录，是默认值。
  - `fork` 会将请求者当前转录分叉到子会话中，使子会话以相同对话上下文开始。
  - 只有当子智能体确实需要当前转录时才使用 `fork`。对于范围明确的工作，请省略 `context`。
- `sessions_spawn` **不接受**渠道投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需投递，请在生成后的运行中使用 `message`/`sessions_send`。

## 线程绑定会话

当某个渠道启用了线程绑定时，子智能体可以保持绑定到某个线程，这样之后该线程中的用户后续消息仍会继续路由到同一个子智能体会话。

### 支持线程的渠道

- Discord（目前唯一受支持的渠道）：支持持久线程绑定的子智能体会话（`sessions_spawn` 配合 `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用 `sessions_spawn` 并设置 `thread: true`（可选地设置 `mode: "session"`）进行生成。
2. OpenClaw 会在当前渠道中创建一个线程，或将现有线程绑定到该会话目标。
3. 该线程中的回复和后续消息都会路由到绑定的会话。
4. 使用 `/session idle` 检查/更新因不活动而自动取消聚焦的设置，使用 `/session max-age` 控制硬上限。
5. 使用 `/unfocus` 手动解除绑定。

手动控制：

- `/focus <target>` 会将当前线程（或新建一个线程）绑定到某个子智能体/会话目标。
- `/unfocus` 会移除当前绑定线程的绑定。
- `/agents` 会列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅适用于已聚焦的绑定线程。

配置开关：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- 渠道覆盖和生成自动绑定键是适配器特定的。请参见上方的**支持线程的渠道**。

当前适配器详情请参见 [配置参考](/zh-CN/gateway/configuration-reference) 和 [斜杠命令](/zh-CN/tools/slash-commands)。

Allowlist：

- `agents.list[].subagents.allowAgents`：可通过 `agentId` 指定的目标智能体 id 列表（`["*"]` 表示允许任意）。默认值：仅允许请求者智能体本身。
- `agents.defaults.subagents.allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体 allowlist。
- 沙箱继承保护：如果请求者会话处于沙箱中，`sessions_spawn` 会拒绝那些会在非沙箱环境中运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：当为 true 时，会阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式 profile 选择）。默认值：false。

发现：

- 使用 `agents_list` 查看当前有哪些智能体 id 允许被 `sessions_spawn` 使用。

自动归档：

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 指定时间后自动归档（默认：60 分钟）。
- 归档使用 `sessions.delete`，并将转录重命名为 `*.deleted.<timestamp>`（位于同一文件夹）。
- `cleanup: "delete"` 会在通告之后立即归档（仍通过重命名保留转录）。
- 自动归档是尽力而为的；如果 gateway 重启，待处理定时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话仍会保留到自动归档阶段。
- 自动归档同样适用于深度 1 和深度 2 会话。
- 浏览器清理与归档清理是分开的：当运行完成时，会尽力关闭已跟踪的浏览器标签页/进程，即使转录/会话记录被保留。

## 嵌套子智能体

默认情况下，子智能体不能继续生成自己的子智能体（`maxSpawnDepth: 1`）。你可以通过设置 `maxSpawnDepth: 2` 来启用一层嵌套，从而支持**编排器模式**：主智能体 → 编排子智能体 → 工作者子子智能体。

### 如何启用

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### 深度层级

| 深度 | 会话键形状 | 角色 | 可否继续生成？ |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0 | `agent:<id>:main` | 主智能体 | 始终可以 |
| 1 | `agent:<id>:subagent:<uuid>` | 子智能体（当允许深度 2 时可作为编排器） | 仅当 `maxSpawnDepth >= 2` |
| 2 | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作者） | 永远不可以 |

### 通告链

结果会沿链路逐级回流：

1. 深度 2 工作者完成 → 向其父级（深度 1 编排器）发送通告
2. 深度 1 编排器接收到通告，综合结果后完成 → 向主智能体发送通告
3. 主智能体接收到通告并将结果投递给用户

每一层只会看到来自其直接子级的通告。

运维建议：

- 启动一次子任务后，就等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或
  `exec` sleep 命令构建轮询循环。
- 如果子任务完成事件在你已经发送最终答案之后才到达，
  正确的后续响应是精确的静默 token：`NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制作用域会在生成时写入会话元数据。这样可以防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，且 `maxSpawnDepth >= 2` 时）**：获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话/系统工具仍然被拒绝。
- **深度 1（叶子节点，且 `maxSpawnDepth == 1` 时）**：没有会话工具（当前默认行为）。
- **深度 2（叶子工作者）**：没有会话工具——在深度 2 下，`sessions_spawn` 始终被拒绝。不能再继续生成子级。

### 按智能体划分的生成上限

每个智能体会话（任意深度）最多只能同时拥有 `maxChildrenPerAgent`（默认：5）个活动子级。这可以防止某个单独的编排器失控扇出。

### 级联停止

停止一个深度 1 编排器会自动停止它所有深度 2 子级：

- 在主聊天中发送 `/stop` 会停止所有深度 1 智能体，并级联停止它们的深度 2 子级。
- `/subagents kill <id>` 会停止某个特定子智能体，并级联停止其子级。
- `/subagents kill all` 会停止该请求者的所有子智能体，并进行级联。

## 认证

子智能体认证按**智能体 id**解析，而不是按会话类型解析：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 认证存储会从该智能体的 `agentDir` 中加载。
- 主智能体的认证配置文件会作为**回退项**合并进来；当发生冲突时，智能体配置文件会覆盖主配置文件。

注意：这种合并是增量式的，因此主配置文件始终可作为回退项使用。当前尚不支持每个智能体完全隔离的认证。

## 通告

子智能体通过通告步骤回报结果：

- 通告步骤运行在子智能体会话内部（而不是请求者会话中）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最近的助手文本是精确的静默 token `NO_REPLY` / `no_reply`，
  即使之前存在可见的进度，也会抑制通告输出。
- 否则，投递取决于请求者深度：
  - 顶层请求者会话使用带外部投递的后续 `agent` 调用（`deliver=true`）
  - 嵌套的请求者子智能体会话会收到一个内部后续注入（`deliver=false`），这样编排器就能在会话内综合子级结果
  - 如果嵌套的请求者子智能体会话已不存在，则 OpenClaw 会在可用时回退到该会话的请求者
- 对于顶层请求者会话，完成模式的直接投递会先解析任何已绑定的会话/线程路由与 hook 覆盖，然后从请求者会话存储的路由中补全缺失的渠道目标字段。这样即使完成来源只标识了渠道，也能让完成结果保留在正确的聊天/话题中。
- 在构建嵌套完成结果时，子完成聚合会限定在当前请求者运行作用域内，从而防止旧运行中的子结果泄漏到当前通告中。
- 通告回复会在渠道适配器支持时保留线程/话题路由。
- 通告上下文会标准化为稳定的内部事件块：
  - 来源（`subagent` 或 `cron`）
  - 子会话 key/id
  - 通告类型 + 任务标签
  - 从运行时结果推导出的状态行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最近可见的助手文本中选择结果内容；否则使用清理后的最近 tool/toolResult 文本；终止失败的运行会报告失败状态，而不会重放捕获的回复文本
  - 一条描述何时应该回复、何时应保持静默的后续指令
- `Status` 并不是从模型输出中推断的；它来自运行时结果信号。
- 在超时情况下，如果子级只执行到了工具调用阶段，通告可以将这段历史折叠为简短的部分进度摘要，而不是重放原始工具输出。

通告负载在末尾包含一行统计信息（即使经过包装）：

- 运行时（例如 `runtime 5m12s`）
- Token 使用量（input/output/total）
- 当配置了模型定价（`models.providers.*.models[].cost`）时的预估成本
- `sessionKey`、`sessionId` 和转录路径（这样主智能体就可以通过 `sessions_history` 获取历史，或直接检查磁盘上的文件）
- 内部元数据仅用于编排；面向用户的回复应重写为正常助手语气。

`sessions_history` 是更安全的编排路径：

- 助手回溯会先进行标准化：
  - 去除 thinking 标签
  - 去除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 去除纯文本工具调用 XML 负载块，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>`，包括那些未能完整闭合的截断
    负载
  - 去除降级后的工具调用/结果脚手架和历史上下文标记
  - 去除泄漏的模型控制 token，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` token，以及全角 `<｜...｜>` 变体
  - 去除畸形的 MiniMax 工具调用 XML
- 凭证/token 样式文本会被脱敏
- 长文本块可能会被截断
- 非常大的历史可能会丢弃较旧的行，或用
  `[sessions_history omitted: message too large]` 替换超大行
- 当你需要逐字节的完整转录时，请改为直接检查磁盘上的原始转录文件

## 工具策略（子智能体工具）

默认情况下，子智能体会获得**除会话工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 仍然是有界且经过清理的回溯视图；它
不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 的编排器子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理自己的子级。

可通过配置覆盖：

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 并发

子智能体使用一个专用的进程内队列通道：

- 通道名称：`subagent`
- 并发度：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止由它生成的所有活动子智能体运行，同时级联到嵌套子级。
- `/subagents kill <id>` 会停止一个特定子智能体，并级联到其子级。

## 限制

- 子智能体通告是**尽力而为**的。如果 gateway 重启，待处理的“通告回传”工作会丢失。
- 子智能体仍共享同一个 gateway 进程资源；请将 `maxConcurrent` 视为一个安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只会注入 `AGENTS.md` + `TOOLS.md`（不会注入 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。对于大多数用例，推荐深度 2。
- `maxChildrenPerAgent` 会限制每个会话的活动子级数量（默认：5，范围：1–20）。
