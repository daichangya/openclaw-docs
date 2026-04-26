---
read_when:
    - 你希望通过智能体进行后台或并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查受线程绑定的子智能体会话
sidebarTitle: Sub-agents
summary: 启动隔离的后台智能体运行，并将结果回报到请求者聊天中
title: 子智能体
x-i18n:
    generated_at: "2026-04-26T06:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

子智能体是从现有智能体运行中派生出来的后台智能体运行。  
它们在各自独立的会话（`agent:<agentId>:subagent:<uuid>`）中运行，并且在完成后，会将结果**通知**回请求者聊天渠道。每个子智能体运行都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

主要目标：

- 将“研究 / 长任务 / 慢工具”类工作并行化，而不阻塞主运行。
- 默认保持子智能体隔离（会话隔离 + 可选沙箱隔离）。
- 让工具使用面难以被误用：默认情况下，子智能体**不会**获得会话工具。
- 支持可配置的嵌套深度，以满足编排器模式。

<Note>
**成本说明：** 默认情况下，每个子智能体都有自己的上下文和 token 用量。对于高负载或重复性任务，建议为子智能体设置更便宜的模型，并让主智能体继续使用质量更高的模型。可通过 `agents.defaults.subagents.model` 或按智能体覆盖进行配置。当某个子智能体确实需要请求者的当前对话记录时，智能体可以在该次派生时请求 `context: "fork"`。
</Note>

## 斜杠命令

使用 `/subagents` 来检查或控制**当前会话**的子智能体运行：

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` 会显示运行元数据（Status、时间戳、会话 id、transcript 路径、cleanup）。使用 `sessions_history` 可查看有界且经过安全过滤的回顾视图；当你需要原始完整 transcript 时，可检查磁盘上的 transcript 路径。

### 线程绑定控制

这些命令适用于支持持久线程绑定的渠道。请参见下方的[支持线程的渠道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 派生行为

`/subagents spawn` 会以用户命令（而非内部中继）的方式启动一个后台子智能体，并在运行完成后向请求者聊天发送一条最终完成更新。

<AccordionGroup>
  <Accordion title="非阻塞、基于推送的完成">
    - 派生命令是非阻塞的；它会立即返回一个运行 id。
    - 完成时，子智能体会将摘要/结果消息通知回请求者聊天渠道。
    - 完成采用推送方式。一旦派生完成，**不要**仅为了等待其结束而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在调试或干预时才按需检查状态。
    - 完成时，OpenClaw 会尽最大努力在继续执行通知清理流程之前，关闭该子智能体会话打开并被跟踪的浏览器标签页/进程。
  </Accordion>
  <Accordion title="手动派生的投递韧性">
    - OpenClaw 会先尝试使用稳定的幂等键进行直接 `agent` 投递。
    - 如果直接投递失败，则回退到队列路由。
    - 如果队列路由仍不可用，则会在最终放弃之前，使用短时指数退避重试通知。
    - 完成投递会保留已解析的请求者路由：如果可用，线程绑定或会话绑定的完成路由优先；如果完成来源只提供渠道，OpenClaw 会从请求者会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）中补全缺失的 target/account，以便直接投递仍能正常工作。
  </Accordion>
  <Accordion title="完成移交元数据">
    向请求者会话的完成移交是运行时生成的内部上下文（不是用户编写的文本），其中包括：

    - `Result` —— 最新可见的 `assistant` 回复文本；否则为经过净化的最新 tool/toolResult 文本。终态失败运行不会复用捕获的回复文本。
    - `Status` —— `completed successfully` / `failed` / `timed out` / `unknown`。
    - 紧凑的运行时/token 统计信息。
    - 一条投递说明，指示请求者智能体以正常 assistant 语气重写，而不是转发原始内部元数据。

  </Accordion>
  <Accordion title="模式与 ACP 运行时">
    - `--model` 和 `--thinking` 会覆盖该次运行的默认值。
    - 完成后可使用 `info`/`log` 检查详细信息和输出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode 或显式的 Codex ACP/acpx），当工具声明该运行时时，请使用 `runtime: "acp"` 的 `sessions_spawn`。调试完成回传或智能体之间循环时，请参见 [ACP 投递模型](/zh-CN/tools/acp-agents#delivery-model)。当启用了 `codex` 插件时，除非用户明确要求 ACP/acpx，否则 Codex 聊天/线程控制应优先使用 `/codex ...` 而不是 ACP。
    - 只有在 ACP 已启用、请求者未处于沙箱中，且已加载 `acpx` 等后端插件时，OpenClaw 才会显示 `runtime: "acp"`。`runtime: "acp"` 需要一个外部 ACP harness id，或某个带有 `runtime.type="acp"` 的 `agents.list[]` 条目；对于 `agents_list` 中的普通 OpenClaw 配置智能体，应使用默认的子智能体运行时。
  </Accordion>
</AccordionGroup>

## 上下文模式

原生子智能体默认以隔离方式启动，除非调用方明确要求分叉当前对话记录。

| 模式       | 适用场景 | 行为 |
| ---------- | -------- | ---- |
| `isolated` | 新研究、独立实现、慢工具工作，或任何可以在任务文本中简要说明的工作 | 创建一个干净的子 transcript。这是默认值，并且能将 token 用量保持得更低。 |
| `fork`     | 依赖当前对话、先前工具结果，或请求者 transcript 中已有的细致指令的工作 | 在子会话开始前，将请求者 transcript 分支到子会话中。 |

谨慎使用 `fork`。它适用于对上下文敏感的委派，而不是用来替代清晰的任务提示编写。

## 工具：`sessions_spawn`

以 `deliver: false` 在全局 `subagent` 通道上启动一个子智能体运行，然后执行通知步骤，并将通知回复发布到请求者聊天渠道。

**默认值：**

- **模型：** 继承调用方，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式指定的 `sessions_spawn.model` 仍然优先。
- **Thinking：** 继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式指定的 `sessions_spawn.thinking` 仍然优先。
- **运行超时：** 如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

### 工具参数

<ParamField path="task" type="string" required>
  子智能体的任务描述。
</ParamField>
<ParamField path="label" type="string">
  可选的人类可读标签。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允许的情况下，以另一个智能体 id 派生。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅用于外部 ACP harness（`claude`、`droid`、`gemini`、`opencode` 或显式请求的 Codex ACP/acpx），以及 `agents.list[]` 中 `runtime.type` 为 `acp` 的条目。
</ParamField>
<ParamField path="model" type="string">
  覆盖子智能体模型。无效值会被跳过，子智能体会使用默认模型运行，并在工具结果中给出警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子智能体运行的 thinking 级别。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  在已设置时默认使用 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`。设置后，子智能体运行会在 N 秒后中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  当为 `true` 时，请求为该子智能体会话启用渠道线程绑定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认值会变为 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 会在通知后立即归档（仍会通过重命名保留 transcript）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 会在目标子运行时未处于沙箱隔离时拒绝派生。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 会将请求者当前的 transcript 分支到子会话中。仅适用于原生子智能体。仅在子智能体需要当前 transcript 时使用 `fork`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受渠道投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需投递，请从已派生的运行中使用 `message`/`sessions_send`。
</Warning>

## 线程绑定会话

当某个渠道启用了线程绑定时，子智能体可以保持绑定到某个线程，因此该线程中的后续用户消息会持续路由到同一个子智能体会话。

### 支持线程的渠道

目前只有 **Discord** 是受支持的渠道。它支持持久的线程绑定子智能体会话（`sessions_spawn` 配合 `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键  
`channels.discord.threadBindings.enabled`、  
`channels.discord.threadBindings.idleHours`、  
`channels.discord.threadBindings.maxAgeHours` 和  
`channels.discord.threadBindings.spawnSubagentSessions`。

### 快速流程

<Steps>
  <Step title="派生">
    使用带有 `thread: true` 的 `sessions_spawn`（并可选指定 `mode: "session"`）。
  </Step>
  <Step title="绑定">
    OpenClaw 会在当前活动渠道中为该会话目标创建或绑定一个线程。
  </Step>
  <Step title="路由后续消息">
    该线程中的回复和后续消息会路由到已绑定的会话。
  </Step>
  <Step title="检查超时">
    使用 `/session idle` 检查/更新不活动自动取消聚焦，并使用 `/session max-age` 控制硬性上限。
  </Step>
  <Step title="解除绑定">
    使用 `/unfocus` 手动解除绑定。
  </Step>
</Steps>

### 手动控制

| 命令 | 效果 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 将当前线程（或创建一个线程）绑定到某个子智能体/会话目标 |
| `/unfocus`         | 移除当前已绑定线程的绑定 |
| `/agents`          | 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`） |
| `/session idle`    | 检查/更新空闲自动取消聚焦（仅适用于已聚焦的绑定线程） |
| `/session max-age` | 检查/更新硬性上限（仅适用于已聚焦的绑定线程） |

### 配置开关

- **全局默认值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **渠道覆盖和派生自动绑定键** 由各适配器分别定义。请参见上方的[支持线程的渠道](#thread-supporting-channels)。

当前适配器详情请参见[配置参考](/zh-CN/gateway/configuration-reference)和[斜杠命令](/zh-CN/tools/slash-commands)。

### 允许列表

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可通过 `agentId` 定向的智能体 id 列表（`["*"]` 表示允许任意智能体）。默认值：仅允许请求者智能体。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求者智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体允许列表。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。按智能体覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果请求者会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些将以非沙箱方式运行的目标。

### 发现

使用 `agents_list` 查看当前哪些智能体 id 被允许用于 `sessions_spawn`。响应中包含每个已列出智能体的生效模型和嵌入式运行时元数据，以便调用方区分 PI、Codex app-server 以及其他已配置的原生运行时。

### 自动归档

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes`（默认值为 `60`）后自动归档。
- 归档使用 `sessions.delete`，并将 transcript 重命名为 `*.deleted.<timestamp>`（同一文件夹内）。
- `cleanup: "delete"` 会在通知后立即归档（仍会通过重命名保留 transcript）。
- 自动归档是尽力而为的；如果 Gateway 网关重启，待处理的定时器将会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会一直保留到自动归档发生。
- 自动归档同样适用于深度 1 和深度 2 的会话。
- 浏览器清理独立于归档清理：当运行结束时，即使保留了 transcript/会话记录，被跟踪的浏览器标签页/进程也会尽力关闭。

## 嵌套子智能体

默认情况下，子智能体不能派生它们自己的子智能体（`maxSpawnDepth: 1`）。将 `maxSpawnDepth` 设置为 `2` 可启用一层嵌套 —— **编排器模式**：主智能体 → 编排器子智能体 → 工作子子智能体。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体派生子级（默认值：1）
        maxChildrenPerAgent: 5, // 每个智能体会话的最大活动子级数（默认值：5）
        maxConcurrent: 8, // 全局并发通道上限（默认值：8）
        runTimeoutSeconds: 900, // sessions_spawn 省略时的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度层级

| 深度 | 会话键形态 | 角色 | 可否派生？ |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体 | 始终可以 |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（允许深度 2 时为编排器） | 仅当 `maxSpawnDepth >= 2` 时 |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作节点） | 永不允许 |

### 通知链

结果会沿链路向上回传：

1. 深度 2 的工作节点完成 → 向其父级（深度 1 编排器）通知。
2. 深度 1 编排器接收通知，综合结果并完成 → 向主智能体通知。
3. 主智能体接收通知并将结果投递给用户。

每一层只能看到其直接子级的通知。

<Note>
**操作指南：** 启动一次子级工作后，等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。`sessions_list` 和 `/subagents list` 会让子会话关系聚焦于实时工作 —— 仍在运行的子级会保持附着，已结束的子级会在一个较短的最近窗口内保持可见，而仅存在于存储中的过期子级链接会在其新鲜期窗口之后被忽略。这样可以防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后重新“复活”幽灵子级。如果某个子级完成事件在你已发送最终答案之后才到达，正确的后续处理是精确的静默 token `NO_REPLY` / `no_reply`。
</Note>

### 按深度划分的工具策略

- 角色和控制范围会在派生时写入会话元数据。这样可防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，且 `maxSpawnDepth >= 2` 时）：** 获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话/系统工具仍被拒绝。
- **深度 1（叶子节点，且 `maxSpawnDepth == 1` 时）：** 无会话工具（当前默认行为）。
- **深度 2（叶子工作节点）：** 无会话工具 —— 在深度 2 时，`sessions_spawn` 始终被拒绝。不能继续派生更多子级。

### 按智能体的派生上限

每个智能体会话（任意深度）同一时间最多只能拥有 `maxChildrenPerAgent`（默认值 `5`）个活动子级。这可防止单个编排器发生失控扇出。

### 级联停止

停止一个深度 1 编排器会自动停止其所有深度 2 子级：

- 主聊天中的 `/stop` 会停止所有深度 1 智能体，并级联停止它们的深度 2 子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联停止其子级。
- `/subagents kill all` 会停止请求者的所有子智能体，并执行级联停止。

## 身份验证

子智能体身份验证按**智能体 id**解析，而不是按会话类型解析：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 身份验证存储从该智能体的 `agentDir` 加载。
- 主智能体的身份验证配置文件会作为**回退**合并进来；发生冲突时，智能体配置文件会覆盖主配置文件。

这种合并是增量式的，因此主配置文件始终可作为回退使用。当前尚不支持每个智能体完全隔离的身份验证。

## 通知

子智能体通过通知步骤回报结果：

- 通知步骤在子智能体会话内部运行（而不是请求者会话内）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的 assistant 文本是精确的静默 token `NO_REPLY` / `no_reply`，即使之前存在可见进度，也会抑制通知输出。

投递方式取决于请求者深度：

- 顶层请求者会话使用后续 `agent` 调用并进行外部投递（`deliver=true`）。
- 嵌套的请求者子智能体会话接收内部后续注入（`deliver=false`），以便编排器在会话内综合子级结果。
- 如果某个嵌套的请求者子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求者。

对于顶层请求者会话，完成模式下的直接投递会首先解析任何已绑定的会话/线程路由及 hook 覆盖，然后从请求者会话存储的路由中补全缺失的渠道目标字段。这样即使完成来源只标识了渠道，也能确保完成消息投递到正确的聊天/话题。

在构建嵌套完成结果时，子级完成聚合会限定在当前请求者运行范围内，从而防止之前运行中陈旧的子级输出泄漏到当前通知中。通知回复会在渠道适配器可用时保留线程/话题路由。

### 通知上下文

通知上下文会被规范化为稳定的内部事件块：

| 字段 | 来源 |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` 或 `cron` |
| Session ids    | 子会话 key/id |
| Type           | 通知类型 + 任务标签 |
| Status         | 根据运行时结果派生（`success`、`error`、`timeout` 或 `unknown`）—— **不是**从模型文本推断 |
| Result content | 最新可见 assistant 文本；否则为经过净化的最新 tool/toolResult 文本 |
| Follow-up      | 描述何时回复、何时保持静默的说明 |

终态失败运行会报告失败状态，而不会重放已捕获的回复文本。超时时，如果子级只执行到了工具调用阶段，通知可以将该历史压缩为简短的部分进度摘要，而不是重放原始工具输出。

### 统计信息行

通知负载在末尾包含一行统计信息（即使被包裹时也是如此）：

- 运行时长（例如 `runtime 5m12s`）。
- Token 用量（输入/输出/总量）。
- 当配置了模型定价（`models.providers.*.models[].cost`）时的预估成本。
- `sessionKey`、`sessionId` 和 transcript 路径，以便主智能体通过 `sessions_history` 获取历史记录，或在磁盘上检查该文件。

内部元数据仅用于编排；面向用户的回复应以正常 assistant 语气重写。

### 为什么优先使用 `sessions_history`

`sessions_history` 是更安全的编排路径：

- assistant 回顾会先被规范化：移除 thinking 标签；移除 `<relevant-memories>` / `<relevant_memories>` 脚手架；移除纯文本工具调用 XML 负载块（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括那些被截断且未能正常闭合的负载；移除降级的工具调用/结果脚手架和历史上下文标记；移除泄漏的模型控制 token（`<|assistant|>`、其他 ASCII `<|...|>`、全角 `<｜...｜>`）；移除格式错误的 MiniMax 工具调用 XML。
- 类凭证/token 的文本会被脱敏。
- 长块内容可能会被截断。
- 极大的历史记录可能会丢弃较早的行，或用 `[sessions_history omitted: message too large]` 替换某个过大的行。
- 当你需要完整逐字节 transcript 时，回退方案是直接检查磁盘上的原始 transcript。

## 工具策略

子智能体首先使用与父智能体或目标智能体相同的配置文件和工具策略流水线。之后，OpenClaw 会应用子智能体限制层。

在没有限制性 `tools.profile` 的情况下，子智能体将获得**除会话工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 仍然是有界、经过净化的回顾视图 —— 它不是原始 transcript 转储。

当 `maxSpawnDepth >= 2` 时，深度 1 的编排器子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子级。

### 通过配置覆盖

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
        // 如果设置了 allow，则变为仅允许这些（deny 仍然优先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以缩小已经解析出的工具集，但不能**重新加入**被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。若要让 coding 配置文件的子智能体使用浏览器自动化，请在配置文件阶段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当仅有一个智能体应获得浏览器自动化时，可使用按智能体的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用专用的进程内队列通道：

- **通道名称：** `subagent`
- **并发数：** `agents.defaults.subagents.maxConcurrent`（默认值 `8`）

## 存活性与恢复

OpenClaw 不会将缺少 `endedAt` 视为某个子智能体仍然存活的永久证据。超过过期运行窗口且未结束的运行，将不再在 `/subagents list`、状态摘要、后代完成门控以及按会话的并发检查中计为活动/待处理。

Gateway 网关重启后，过期且未结束的已恢复运行会被清理，除非其子会话被标记为 `abortedLastRun: true`。这些因重启而中止的子会话仍可通过子智能体孤儿恢复流程进行恢复，该流程会在清除中止标记之前发送一条合成恢复消息。

<Note>
如果子智能体派生因 Gateway 网关 `PAIRING_REQUIRED` / `scope-upgrade` 而失败，请先检查 RPC 调用方，再编辑配对状态。内部 `sessions_spawn` 协调应通过直接 loopback shared-token/password 身份验证，以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 进行连接；该路径不依赖 CLI 已配对设备的 scope 基线。远程调用方、显式 `deviceIdentity`、显式 device-token 路径以及浏览器/node 客户端仍然需要正常的设备批准才能完成 scope 升级。
</Note>

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止由其派生的所有活动子智能体运行，同时级联停止嵌套子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联停止其子级。

## 限制

- 子智能体通知是**尽力而为**的。如果 Gateway 网关重启，待处理的“通知回传”工作将会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只会注入 `AGENTS.md` + `TOOLS.md`（不包括 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。对于大多数使用场景，建议使用深度 2。
- `maxChildrenPerAgent` 会限制每个会话的活动子级数量（默认值 `5`，范围 `1–20`）。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [智能体发送](/zh-CN/tools/agent-send)
- [后台任务](/zh-CN/automation/tasks)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
