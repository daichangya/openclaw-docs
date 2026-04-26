---
read_when:
    - 你想通过智能体进行后台 / 并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查线程绑定的子智能体会话
summary: 子智能体：生成隔离的智能体运行，并将结果通告回请求者聊天界面
title: 子智能体
x-i18n:
    generated_at: "2026-04-26T00:39:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae5c51e89541e3dd48646afb86a49eea21b778d816f8edb7c4b35e93b62bb64f
    source_path: tools/subagents.md
    workflow: 15
---

子智能体是从现有智能体运行中生成的后台智能体运行。它们在各自独立的会话中运行（`agent:<agentId>:subagent:<uuid>`），并在完成后将其结果**通告**回请求者聊天渠道。每个子智能体运行都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

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

这些命令适用于支持持久线程绑定的渠道。请参见下方的**支持线程的渠道**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 会显示运行元数据（状态、时间戳、会话 id、转录路径、清理设置）。
使用 `sessions_history` 获取有边界且经过安全过滤的回溯视图；当你需要原始完整转录时，请检查磁盘上的转录路径。

### 生成行为

`/subagents spawn` 以用户命令而非内部中继的方式启动一个后台子智能体，并在运行结束时向请求者聊天发送一条最终完成更新。

- 生成命令是非阻塞的；它会立即返回一个运行 id。
- 完成后，子智能体会向请求者聊天渠道通告一条摘要 / 结果消息。
- 完成投递是基于推送的。生成后，不要仅为了等待其完成而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在调试或干预时按需检查状态。
- 完成时，OpenClaw 会尽最大努力在通告清理流程继续之前关闭该子智能体会话打开的已跟踪浏览器标签页 / 进程。
- 对于手动生成，投递具有弹性：
  - OpenClaw 会先使用稳定的幂等键尝试直接 `agent` 投递。
  - 如果直接投递失败，则回退到队列路由。
  - 如果队列路由仍不可用，则会以短暂的指数退避重试通告，之后才最终放弃。
- 完成投递会保留已解析的请求者路由：
  - 可用时，线程绑定或会话绑定的完成路由优先
  - 如果完成来源只提供渠道，OpenClaw 会从请求者会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）中补全缺失的目标 / 账号，从而让直接投递仍然可用
- 向请求者会话移交完成结果时，使用的是运行时生成的内部上下文（不是用户撰写的文本），其中包括：
  - `Result`（最新可见的 `assistant` 回复文本；否则为已净化的最新 `tool` / `toolResult` 文本；终态失败的运行不会复用已捕获的回复文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 紧凑的运行时 / token 统计信息
  - 一条投递指令，告知请求者智能体用正常的 assistant 语气重写，而不是转发原始内部元数据
- `--model` 和 `--thinking` 会覆盖该次特定运行的默认值。
- 完成后，使用 `info` / `log` 检查详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久线程绑定会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
- 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode，或显式的 Codex ACP / acpx），当工具声明了该运行时，请使用 `runtime: "acp"` 的 `sessions_spawn`，并参见 [ACP Agents](/zh-CN/tools/acp-agents)，尤其是在调试完成回传或智能体到智能体循环时的 [ACP delivery model](/zh-CN/tools/acp-agents#delivery-model)。启用 `codex` 插件后，Codex 聊天 / 线程控制应优先使用 `/codex ...` 而不是 ACP，除非用户明确要求 ACP / acpx。只有在 ACP 已启用、请求者未处于沙箱隔离状态，并且已加载 `acpx` 等后端插件时，OpenClaw 才会显示 `runtime: "acp"`。`runtime: "acp"` 需要一个外部 ACP harness id，或 `agents.list[]` 中 `runtime.type="acp"` 的条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认子智能体运行时。

主要目标：

- 将“研究 / 长任务 / 慢工具”工作并行化，而不阻塞主运行。
- 默认保持子智能体隔离（会话分离 + 可选沙箱隔离）。
- 保持工具表面不易被误用：子智能体默认**不会**获得会话工具。
- 支持可配置的嵌套深度，以适配编排器模式。

成本说明：默认情况下，每个子智能体都有其**自己的**上下文和 token 使用量。对于高负载或重复性任务，请为子智能体设置更便宜的模型，并让你的主智能体继续使用质量更高的模型。你可以通过 `agents.defaults.subagents.model` 或按智能体覆盖来配置这一点。当子级确实需要请求者当前转录时，智能体可以在该次生成中请求 `context: "fork"`。

## 上下文模式

原生子智能体默认以隔离方式启动，除非调用方明确要求分叉当前转录。

| 模式 | 适用场景 | 行为 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新的研究、独立实现、慢工具工作，或任何可以在任务文本中简要说明的事项 | 创建一个干净的子级转录。这是默认模式，并且会保持较低的 token 使用量。 |
| `fork` | 依赖当前对话、先前工具结果，或请求者转录中已存在的细致指令的工作 | 在子级启动前，将请求者转录分支到子会话中。 |

谨慎使用 `fork`。它用于对上下文敏感的委派，而不是替代清晰编写任务提示。

## 工具

使用 `sessions_spawn`：

- 启动一个子智能体运行（`deliver: false`，全局 lane：`subagent`）
- 然后执行一个通告步骤，并将通告回复发布到请求者聊天渠道
- 默认模型：继承调用方，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式指定的 `sessions_spawn.model` 仍然优先。
- 默认 thinking：继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式指定的 `sessions_spawn.thinking` 仍然优先。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

工具参数：

- `task`（必填）
- `label?`（可选）
- `agentId?`（可选；如果允许，可在另一个智能体 id 下生成）
- `runtime?`（`subagent|acp`，默认 `subagent`；`acp` 仅用于外部 ACP harness，例如 `claude`、`droid`、`gemini`、`opencode`，或显式请求的 Codex ACP / acpx，或 `agents.list[]` 中 `runtime.type` 为 `acp` 的条目）
- `model?`（可选；覆盖子智能体模型；无效值会被跳过，子智能体会使用默认模型运行，并在工具结果中给出警告）
- `thinking?`（可选；覆盖子智能体运行的 thinking 级别）
- `runTimeoutSeconds?`（默认在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`；设置后，子智能体运行会在 N 秒后中止）
- `thread?`（默认 `false`；为 `true` 时，请求为该子智能体会话启用渠道线程绑定）
- `mode?`（`run|session`）
  - 默认值为 `run`
  - 如果 `thread: true` 且省略 `mode`，默认变为 `session`
  - `mode: "session"` 需要 `thread: true`
- `cleanup?`（`delete|keep`，默认 `keep`）
- `sandbox?`（`inherit|require`，默认 `inherit`；`require` 会在目标子级运行时未处于沙箱隔离时拒绝生成）
- `context?`（`isolated|fork`，默认 `isolated`；仅适用于原生子智能体）
  - `isolated` 会创建一个干净的子级转录，并且是默认值。
  - `fork` 会将请求者当前转录分支到子会话中，使子级以相同的对话上下文启动。
  - 仅当子级需要当前转录时才使用 `fork`。对于范围明确的工作，请省略 `context`。
- `sessions_spawn` **不**接受渠道投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需投递，请从已生成的运行中使用 `message` / `sessions_send`。

## 线程绑定会话

当某个渠道启用了线程绑定时，子智能体可以持续绑定到一个线程上，以便该线程中的后续用户消息继续路由到同一个子智能体会话。

### 支持线程的渠道

- Discord（当前唯一受支持的渠道）：支持持久的线程绑定子智能体会话（使用带 `thread: true` 的 `sessions_spawn`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用带有 `thread: true` 的 `sessions_spawn` 进行生成（可选地加上 `mode: "session"`）。
2. OpenClaw 会在活动渠道中创建一个线程或将线程绑定到该会话目标。
3. 该线程中的回复和后续消息都会路由到绑定的会话。
4. 使用 `/session idle` 检查 / 更新不活动自动取消聚焦设置，使用 `/session max-age` 控制硬性上限。
5. 使用 `/unfocus` 手动解除绑定。

手动控制：

- `/focus <target>` 会将当前线程（或创建一个线程）绑定到某个子智能体 / 会话目标。
- `/unfocus` 会移除当前已绑定线程的绑定。
- `/agents` 会列出活动运行及绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅对已聚焦的绑定线程有效。

配置开关：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- 渠道覆盖和生成自动绑定键是特定于适配器的。请参见上方的**支持线程的渠道**。

当前适配器的详细信息请参见 [Configuration Reference](/zh-CN/gateway/configuration-reference) 和 [Slash commands](/zh-CN/tools/slash-commands)。

允许列表：

- `agents.list[].subagents.allowAgents`：可通过 `agentId` 定向的智能体 id 列表（`["*"]` 表示允许任意）。默认值：仅允许请求者智能体。
- `agents.defaults.subagents.allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时，使用的默认目标智能体允许列表。
- 沙箱继承保护：如果请求者会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些将以非沙箱方式运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。默认值：false。

发现：

- 使用 `agents_list` 查看当前哪些智能体 id 允许用于 `sessions_spawn`。响应中包含每个列出智能体的有效模型和嵌入式运行时元数据，以便调用方区分 PI、Codex app-server 以及其他已配置的原生运行时。

自动归档：

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 之后自动归档（默认值：60）。
- 归档使用 `sessions.delete`，并将转录重命名为 `*.deleted.<timestamp>`（同一文件夹中）。
- `cleanup: "delete"` 会在通告后立即归档（仍会通过重命名保留转录）。
- 自动归档是尽力而为的；如果 Gateway 网关重启，待处理计时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会一直保留到自动归档发生。
- 自动归档对深度 1 和深度 2 会话一视同仁。
- 浏览器清理与归档清理是分开的：当运行结束时，会尽最大努力关闭已跟踪的浏览器标签页 / 进程，即使转录 / 会话记录被保留也是如此。

## 嵌套子智能体

默认情况下，子智能体不能生成它们自己的子智能体（`maxSpawnDepth: 1`）。你可以通过将 `maxSpawnDepth` 设置为 `2` 来启用一层嵌套，这允许使用**编排器模式**：主智能体 → 编排器子智能体 → 工作子子智能体。

### 如何启用

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体生成子级（默认值：1）
        maxChildrenPerAgent: 5, // 每个智能体会话的最大活动子级数（默认值：5）
        maxConcurrent: 8, // 全局并发 lane 上限（默认值：8）
        runTimeoutSeconds: 900, // 省略时 sessions_spawn 的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形态 | 角色 | 可生成？ |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体 | 始终可以 |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（当允许深度 2 时可作为编排器） | 仅当 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作单元） | 永不允许 |

### 通告链

结果会沿链路向上回流：

1. 深度 2 工作单元完成 → 向其父级（深度 1 编排器）通告
2. 深度 1 编排器接收通告、综合结果、完成 → 向主智能体通告
3. 主智能体接收通告并投递给用户

每一层只能看到其直接子级发来的通告。

操作指南：

- 子级工作启动一次后，等待完成事件即可，不要围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。
- `sessions_list` 和 `/subagents list` 会让子会话关系聚焦于实时工作：活跃子级保持附着，已结束子级会在一个较短的最近窗口内保持可见，而仅存储中的过期子级链接会在其新鲜度窗口过后被忽略。这样可以防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后重新唤起幽灵子级。
- 如果某个子级完成事件在你已经发送最终答案之后才到达，正确的后续处理是精确的静默 token `NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制范围会在生成时写入会话元数据。这可以防止扁平化或已恢复的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）**：获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话 / 系统工具仍被拒绝。
- **深度 1（叶子，当 `maxSpawnDepth == 1` 时）**：没有会话工具（当前默认行为）。
- **深度 2（叶子工作单元）**：没有会话工具 —— 在深度 2 上始终拒绝 `sessions_spawn`。不能继续生成更多子级。

### 每个智能体的生成上限

每个智能体会话（任意深度）同一时间最多可以有 `maxChildrenPerAgent`（默认值：5）个活动子级。这可以防止单个编排器发生失控扇出。

### 级联停止

停止一个深度 1 编排器会自动停止其所有深度 2 子级：

- 在主聊天中发送 `/stop` 会停止所有深度 1 智能体，并级联停止它们的深度 2 子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联到其子级。
- `/subagents kill all` 会停止请求者的所有子智能体，并进行级联。

## 身份验证

子智能体认证按**智能体 id**解析，而不是按会话类型：

- 子智能体会话键是 `agent:<agentId>:subagent:<uuid>`。
- 认证存储从该智能体的 `agentDir` 加载。
- 主智能体的认证配置文件会作为**回退**合并进来；发生冲突时，智能体配置文件会覆盖主配置文件。

注意：该合并是附加式的，因此主配置文件始终可作为回退使用。当前尚不支持每个智能体完全隔离的认证。

## 通告

子智能体通过一个通告步骤回报结果：

- 通告步骤在子智能体会话内部运行（而不是在请求者会话中）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的 assistant 文本是精确的静默 token `NO_REPLY` / `no_reply`，则即使之前存在可见进度，也会抑制通告输出。
- 否则，投递取决于请求者深度：
  - 顶层请求者会话使用带外部投递的后续 `agent` 调用（`deliver=true`）
  - 嵌套请求者子智能体会话接收内部后续注入（`deliver=false`），以便编排器可在会话内综合子级结果
  - 如果嵌套请求者子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求者
- 对于顶层请求者会话，完成模式的直接投递会先解析任何已绑定的会话 / 线程路由和 hook 覆盖，然后从请求者会话存储的路由中补全缺失的渠道目标字段。这样即使完成来源仅标识了渠道，也能将完成结果保持在正确的聊天 / 主题中。
- 在构建嵌套完成发现结果时，子级完成聚合会限定在当前请求者运行范围内，从而防止过期的前一次运行子级输出泄漏到当前通告中。
- 在渠道适配器可用时，通告回复会保留线程 / 主题路由。
- 通告上下文会规范化为稳定的内部事件块：
  - 来源（`subagent` 或 `cron`）
  - 子会话键 / id
  - 通告类型 + 任务标签
  - 从运行时结果推导出的状态行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最新可见 assistant 文本中选取的结果内容；否则使用已净化的最新 `tool` / `toolResult` 文本；终态失败运行会报告失败状态，而不会重放已捕获的回复文本
  - 一条后续指令，说明何时回复、何时保持静默
- `Status` 不是从模型输出推断的；它来自运行时结果信号。
- 超时时，如果子级只执行到了工具调用，通告可以将该历史折叠为简短的部分进度摘要，而不是重放原始工具输出。

通告载荷在末尾包含一行统计信息（即使被包装也是如此）：

- 运行时长（例如 `runtime 5m12s`）
- token 使用量（输入 / 输出 / 总计）
- 已配置模型定价时的预估成本（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId` 和转录路径（这样主智能体可以通过 `sessions_history` 获取历史记录，或在磁盘上检查文件）
- 内部元数据仅用于编排；面向用户的回复应以正常 assistant 语气重写。

`sessions_history` 是更安全的编排路径：

- 会先对 assistant 回溯进行规范化：
  - 去除 thinking 标签
  - 去除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 去除纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括那些从未正常闭合的截断载荷
  - 去除降级后的工具调用 / 结果脚手架和历史上下文标记
  - 去除泄漏的模型控制 token，例如 `<|assistant|>`、其他 ASCII `<|...|>` token，以及全角变体 `<｜...｜>`
  - 去除格式错误的 MiniMax 工具调用 XML
- 类凭证 / token 文本会被脱敏
- 长内容块可能会被截断
- 非常大的历史记录可能会丢弃较早的行，或用 `[sessions_history omitted: message too large]` 替换过大的行
- 当你需要完整、逐字节的转录时，后备方案是在磁盘上检查原始转录

## 工具策略（子智能体工具）

子智能体首先使用与父级或目标智能体相同的配置文件和工具策略流水线。之后，OpenClaw 会应用子智能体限制层。

在没有限制性 `tools.profile` 的情况下，子智能体获得**除会话工具**和系统工具之外的**所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 也仍然是有边界、已净化的回溯视图；它不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子级。

通过配置覆盖：

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
        // deny 优先
        deny: ["gateway", "cron"],
        // 如果设置了 allow，它会变为仅允许列表（deny 仍然优先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以缩小已解析的工具集合，但不能把已被 `tools.profile` 移除的工具重新加回来。例如，`tools.profile: "coding"` 包含 `web_search` / `web_fetch`，但不包含 `browser` 工具。若要让 coding 配置文件的子智能体使用浏览器自动化，请在配置文件阶段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

如果只希望某一个智能体获得浏览器自动化，请使用按智能体配置的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用一个专用的进程内队列 lane：

- lane 名称：`subagent`
- 并发数：`agents.defaults.subagents.maxConcurrent`（默认值 `8`）

## 存活性与恢复

OpenClaw 不会将缺少 `endedAt` 永久视为某个子智能体仍然存活的证明。超过过期运行窗口的未结束运行将不再在 `/subagents list`、状态摘要、后代完成门控以及每会话并发检查中计为活动 / 待处理。

在 Gateway 网关重启后，过期且未结束的已恢复运行会被修剪，除非其子会话被标记为 `abortedLastRun: true`。这些因重启而中止的子会话仍可通过子智能体孤儿恢复流程进行恢复，该流程会先发送一条合成恢复消息，然后再清除中止标记。

如果子智能体生成因 Gateway 网关 `PAIRING_REQUIRED` / `scope-upgrade` 失败，在编辑配对状态之前，请先检查 RPC 调用方。内部 `sessions_spawn` 协调应通过 direct loopback shared-token / password auth 以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 连接；该路径不依赖 CLI 的配对设备 scope 基线。远程调用方、显式 `deviceIdentity`、显式设备 token 路径以及浏览器 / node 客户端仍然需要正常的设备批准来进行 scope 升级。

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止由其生成的任何活动子智能体运行，同时级联到嵌套子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联到其子级。

## 限制

- 子智能体通告是**尽力而为**的。如果 Gateway 网关重启，待处理的“回传通告”工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为一个安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只会注入 `AGENTS.md` + `TOOLS.md`（不包含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。对于大多数用例，建议使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活动子级数量上限（默认值：5，范围：1–20）。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [智能体发送](/zh-CN/tools/agent-send)
