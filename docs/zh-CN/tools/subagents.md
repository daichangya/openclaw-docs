---
read_when:
    - 你想通过智能体进行后台 / 并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查线程绑定的子智能体会话问题
summary: 子智能体：启动隔离的智能体运行，并将结果回传到请求者聊天中
title: 子智能体
x-i18n:
    generated_at: "2026-04-23T23:05:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

子智能体是在现有智能体运行中启动的后台智能体运行。它们会在自己的会话中运行（`agent:<agentId>:subagent:<uuid>`），并在完成后将结果**回传**到请求者聊天渠道。每次子智能体运行都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

## Slash 命令

使用 `/subagents` 检查或控制**当前会话**的子智能体运行：

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

线程绑定控制：

这些命令可用于支持持久线程绑定的渠道。请参阅下文的**支持线程的渠道**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 会显示运行元数据（状态、时间戳、会话 id、transcript 路径、清理信息）。
如需受限且经过安全过滤的回溯视图，请使用 `sessions_history`；如果你需要原始完整 transcript，请检查磁盘上的 transcript 路径。

### 启动行为

`/subagents spawn` 作为用户命令启动一个后台子智能体，而不是内部中继；当运行完成时，它会向请求者聊天发送一条最终完成更新。

- 启动命令是非阻塞的；它会立即返回一个运行 id。
- 完成时，子智能体会将摘要 / 结果消息回传到请求者聊天渠道。
- 完成投递基于推送。一旦已启动，就不要为了等待其完成而循环轮询 `/subagents list`、
  `sessions_list` 或 `sessions_history`；仅在调试或干预时按需检查状态。
- 完成时，OpenClaw 会尽力关闭该子智能体会话打开的已跟踪浏览器标签页 / 进程，然后再继续执行回传清理流程。
- 对于手动启动，投递具备弹性：
  - OpenClaw 会先使用稳定的幂等键尝试直接 `agent` 投递。
  - 如果直接投递失败，则回退到队列路由。
  - 如果队列路由仍不可用，则在最终放弃前，回传会以较短的指数退避策略重试。
- 完成投递会保留已解析的请求者路由：
  - 在可用时，线程绑定或会话绑定的完成路由优先
  - 如果完成来源仅提供一个渠道，OpenClaw 会从请求者会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）中补全缺失的 target / account，以便直接投递仍然可用
- 向请求者会话交接的完成内容，是运行时生成的内部上下文（不是用户编写的文本），其中包括：
  - `Result`（最新可见的 `assistant` 回复文本；否则为经过清理的最新 tool / toolResult 文本；终态失败运行不会复用捕获到的回复文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 紧凑的运行时 / token 统计
  - 一条投递说明，告诉请求者智能体要用正常 assistant 语气重写，而不是直接转发原始内部元数据
- `--model` 和 `--thinking` 会覆盖该次运行的默认值。
- 使用 `info` / `log` 可在完成后检查详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久线程绑定会话，请使用 `sessions_spawn` 并设置 `thread: true` 和 `mode: "session"`。
- 对于 ACP harness 会话（Codex、Claude Code、Gemini CLI），请使用 `sessions_spawn` 并设置 `runtime: "acp"`，同时参阅 [ACP 智能体](/zh-CN/tools/acp-agents)，尤其是在调试完成投递或智能体到智能体循环时查看 [ACP 投递模型](/zh-CN/tools/acp-agents#delivery-model)。

主要目标：

- 并行化 “研究 / 长任务 / 慢工具” 类型的工作，而不阻塞主运行。
- 默认保持子智能体隔离（会话隔离 + 可选沙箱隔离）。
- 保持工具接口难以被误用：默认情况下，子智能体**不会**获得会话工具。
- 支持为编排器模式配置可嵌套深度。

成本说明：每个子智能体默认都有**自己的**上下文和 token 使用量。对于重型或重复性任务，请为子智能体设置更便宜的模型，并让主智能体继续使用更高质量的模型。你可以通过 `agents.defaults.subagents.model` 或按智能体覆盖来配置。如果子智能体确实需要请求者当前 transcript，智能体可以在该次启动中请求 `context: "fork"`。

## 工具

使用 `sessions_spawn`：

- 启动一个子智能体运行（`deliver: false`，全局 lane：`subagent`）
- 然后执行一次回传步骤，并将回传回复发布到请求者聊天渠道
- 默认模型：继承调用者，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式的 `sessions_spawn.model` 仍然优先。
- 默认 thinking：继承调用者，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式的 `sessions_spawn.thinking` 仍然优先。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

工具参数：

- `task`（必填）
- `label?`（可选）
- `agentId?`（可选；如果允许，可在另一个智能体 id 下启动）
- `model?`（可选；覆盖子智能体模型；无效值会被跳过，子智能体将使用默认模型运行，并在工具结果中给出警告）
- `thinking?`（可选；覆盖子智能体运行的 thinking 级别）
- `runTimeoutSeconds?`（已设置时默认取 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`；设置后，子智能体运行会在 N 秒后中止）
- `thread?`（默认 `false`；当为 `true` 时，请求为该子智能体会话启用渠道线程绑定）
- `mode?`（`run|session`）
  - 默认是 `run`
  - 如果 `thread: true` 且省略 `mode`，默认值会变为 `session`
  - `mode: "session"` 要求 `thread: true`
- `cleanup?`（`delete|keep`，默认 `keep`）
- `sandbox?`（`inherit|require`，默认 `inherit`；如果目标子运行时不是沙箱隔离的，`require` 会拒绝启动）
- `context?`（`isolated|fork`，默认 `isolated`；仅限原生子智能体）
  - `isolated` 会创建一个干净的子 transcript，并且是默认值。
  - `fork` 会将请求者当前 transcript 分叉到子会话中，因此子会话会以相同的对话上下文开始。
  - 仅在子会话需要当前 transcript 时才使用 `fork`。对于范围明确的工作，请省略 `context`。
- `sessions_spawn` **不接受**渠道投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需投递，请在已启动的运行中使用 `message` / `sessions_send`。

## 线程绑定会话

当某个渠道启用了线程绑定时，子智能体可以保持绑定到一个线程，这样该线程中的后续用户消息就会继续路由到同一个子智能体会话。

### 支持线程的渠道

- Discord（当前唯一受支持的渠道）：支持持久线程绑定的子智能体会话（`sessions_spawn` 配合 `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用 `sessions_spawn` 启动，并设置 `thread: true`（可选地设置 `mode: "session"`）。
2. OpenClaw 会在当前激活渠道中创建一个线程，或将某个线程绑定到该会话目标。
3. 该线程中的回复和后续消息会路由到绑定的会话。
4. 使用 `/session idle` 查看 / 更新无活动自动取消聚焦策略，使用 `/session max-age` 控制硬性上限。
5. 使用 `/unfocus` 手动解除绑定。

手动控制：

- `/focus <target>` 将当前线程（或创建一个线程）绑定到某个子智能体 / 会话目标。
- `/unfocus` 移除当前已绑定线程的绑定。
- `/agents` 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅对已聚焦的绑定线程有效。

配置开关：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- 渠道覆盖和启动自动绑定键是特定于适配器的。请参阅上文的**支持线程的渠道**。

有关当前适配器详情，请参阅[配置参考](/zh-CN/gateway/configuration-reference)和 [Slash commands](/zh-CN/tools/slash-commands)。

允许列表：

- `agents.list[].subagents.allowAgents`：可通过 `agentId` 作为目标的智能体 id 列表（`["*"]` 表示允许任意目标）。默认：仅允许请求者智能体。
- `agents.defaults.subagents.allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体允许列表。
- 沙箱继承保护：如果请求者会话是沙箱隔离的，`sessions_spawn` 会拒绝那些会以非沙箱方式运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：当为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式配置文件选择）。默认：false。

发现：

- 使用 `agents_list` 查看当前哪些智能体 id 被允许用于 `sessions_spawn`。

自动归档：

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 之后自动归档（默认：60）。
- 归档使用 `sessions.delete`，并将 transcript 重命名为 `*.deleted.<timestamp>`（同一文件夹内）。
- `cleanup: "delete"` 会在回传后立即归档（仍然通过重命名保留 transcript）。
- 自动归档是尽力而为的；如果 Gateway 网关重启，待处理计时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会保留到自动归档时。
- 自动归档同样适用于深度 1 和深度 2 会话。
- 浏览器清理与归档清理是分开的：在运行结束时，已跟踪的浏览器标签页 / 进程会尽力关闭，即使 transcript / 会话记录被保留。

## 嵌套子智能体

默认情况下，子智能体不能再启动自己的子智能体（`maxSpawnDepth: 1`）。你可以将 `maxSpawnDepth: 2` 设为允许一层嵌套，这样就支持**编排器模式**：主智能体 → 编排器子智能体 → 工作型子子智能体。

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

### 深度级别

| 深度 | 会话键形状                            | 角色                                          | 可否启动子级？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体                                    | 始终可以                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（当允许深度 2 时可作为编排器） | 仅当 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作者）                   | 永远不可以                        |

### 回传链

结果会沿链路向上流动：

1. 深度 2 工作者完成 → 回传给其父级（深度 1 编排器）
2. 深度 1 编排器接收回传、综合结果、完成 → 回传给主智能体
3. 主智能体接收回传并投递给用户

每一级只会看到来自其直接子级的回传。

运维指导：

- 只启动一次子任务，并等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或
  `exec` sleep 命令构建轮询循环。
- 如果子任务完成事件在你已经发送最终答案之后才到达，
  正确的后续动作是发送精确的静默 token：`NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制范围会在启动时写入会话元数据。这样可以防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）**：会获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子任务。其他会话 / 系统工具仍然被拒绝。
- **深度 1（叶子节点，当 `maxSpawnDepth == 1` 时）**：不提供任何会话工具（当前默认行为）。
- **深度 2（叶子工作者）**：不提供任何会话工具——在深度 2 上，`sessions_spawn` 始终被拒绝。不能再继续启动子级。

### 按智能体划分的启动数量上限

每个智能体会话（任意深度）同时最多只能拥有 `maxChildrenPerAgent`（默认：5）个活动子任务。这可以防止单个编排器出现失控式扇出。

### 级联停止

停止深度 1 编排器会自动停止它的所有深度 2 子任务：

- 在主聊天中执行 `/stop` 会停止所有深度 1 智能体，并级联停止它们的深度 2 子任务。
- `/subagents kill <id>` 会停止指定的子智能体，并级联停止其子任务。
- `/subagents kill all` 会停止该请求者的所有子智能体，并执行级联停止。

## 身份验证

子智能体的 auth 是按**智能体 id**解析的，而不是按会话类型：

- 子智能体会话键是 `agent:<agentId>:subagent:<uuid>`。
- auth 存储会从该智能体的 `agentDir` 加载。
- 主智能体的 auth 配置文件会作为**回退**合并进来；如有冲突，智能体配置文件优先于主配置文件。

注意：这种合并是追加式的，因此主配置文件始终可作为回退使用。目前尚不支持每个智能体完全隔离的 auth。

## 回传

子智能体通过回传步骤进行结果汇报：

- 回传步骤在子智能体会话内部运行（而不是在请求者会话中运行）。
- 如果子智能体回复恰好为 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新 assistant 文本恰好是静默 token `NO_REPLY` / `no_reply`，
  即使之前存在可见的进度，也会抑制回传输出。
- 否则，投递行为取决于请求者深度：
  - 顶层请求者会话使用后续 `agent` 调用，并开启外部投递（`deliver=true`）
  - 嵌套请求者子智能体会话会接收内部后续注入（`deliver=false`），以便编排器在会话内综合子结果
  - 如果某个嵌套请求者子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求者
- 对于顶层请求者会话，完成模式下的直接投递会先解析任何已绑定的会话 / 线程路由和 hook 覆盖项，然后从请求者会话中存储的路由补全缺失的渠道目标字段。即使完成来源只标识了渠道，这也能让完成消息保持在正确的聊天 / 话题中。
- 在构建嵌套完成结果时，子任务完成聚合会限定在当前请求者运行范围内，以防旧运行中的子任务输出泄漏到当前回传中。
- 在渠道适配器支持的情况下，回传回复会保留线程 / 话题路由。
- 回传上下文会被规范化为稳定的内部事件块：
  - 来源（`subagent` 或 `cron`）
  - 子会话键 / id
  - 回传类型 + 任务标签
  - 基于运行时结果派生的状态行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最新可见 assistant 文本中选择结果内容；否则使用经过清理的最新 tool / toolResult 文本；终态失败运行会报告失败状态，而不会重放已捕获的回复文本
  - 一条后续说明，描述何时应回复、何时应保持静默
- `Status` 不是从模型输出中推断出来的；它来自运行时结果信号。
- 在超时情况下，如果子任务只执行到了工具调用，回传可以将该历史压缩成简短的部分进展摘要，而不是重放原始工具输出。

回传负载末尾会包含一行统计信息（即使被包裹时也会保留）：

- 运行时长（例如 `runtime 5m12s`）
- Token 使用量（输入 / 输出 / 总量）
- 当配置了模型定价（`models.providers.*.models[].cost`）时，显示估算成本
- `sessionKey`、`sessionId` 和 transcript 路径（这样主智能体可以通过 `sessions_history` 获取历史，或直接检查磁盘上的文件）
- 内部元数据仅用于编排；面向用户的回复应重写为正常 assistant 语气。

`sessions_history` 是更安全的编排路径：

- assistant 回溯会先被规范化：
  - 去除 thinking 标签
  - 去除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 去除纯文本工具调用 XML 负载块，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>`，包括那些从未正常闭合的截断
    负载
  - 去除降级的工具调用 / 结果脚手架和历史上下文标记
  - 去除泄漏的模型控制 token，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` token，以及全角变体 `<｜...｜>`
  - 去除格式错误的 MiniMax 工具调用 XML
- 类似凭证 / token 的文本会被脱敏
- 过长的块可能会被截断
- 对于非常大的历史，可能会丢弃较早的行，或用
  `[sessions_history omitted: message too large]` 替换超大的单行
- 当你需要完整的逐字节 transcript 时，回退方案是直接检查磁盘上的原始 transcript

## 工具策略（子智能体工具）

默认情况下，子智能体会获得**除会话工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 仍然是有边界、经过清理的回溯视图；它
不是原始 transcript 转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理它们的子任务。

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

子智能体使用专用的进程内队列 lane：

- Lane 名称：`subagent`
- 并发数：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止由其启动的所有活动子智能体运行，同时级联停止嵌套子任务。
- `/subagents kill <id>` 会停止指定的子智能体，并级联停止其子任务。

## 限制

- 子智能体回传是**尽力而为**的。如果 Gateway 网关重启，待处理的“回传结果”工作会丢失。
- 子智能体仍然共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md` + `TOOLS.md`（不包括 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。对于大多数使用场景，推荐深度 2。
- `maxChildrenPerAgent` 限制每个会话的活动子任务数量（默认：5，范围：1–20）。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [智能体发送](/zh-CN/tools/agent-send)
