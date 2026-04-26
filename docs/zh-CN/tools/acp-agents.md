---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置与会话绑定的 ACP 会话
    - 将消息渠道会话绑定到持久化 ACP 会话
    - 排查 ACP 后端和插件接线问题
    - 调试 ACP 完成结果传递或智能体到智能体循环问题
    - 在聊天中使用 `/acp` 命令
summary: 对 Claude Code、Cursor、Gemini CLI 使用 ACP 运行时会话，并为 Codex ACP 显式回退、OpenClaw ACP 以及其他 harness 智能体使用 ACP 运行时会话
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-26T00:39:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a83f8a9a90569fd5d6e7bff4edbf15831e01179964a2d758fd1b70578ca378a0
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol（ACP）](https://agentclientprotocol.com/) 会话让 OpenClaw 能够通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI 以及其他受支持的 ACPX harness）。

如果你用自然语言要求 OpenClaw 在当前会话中绑定或控制 Codex，并且内置的 `codex` 插件已启用，OpenClaw 应使用原生 Codex app-server 插件（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。如果你明确要求 `/acp`、ACP、acpx，或 ACP 适配器测试，OpenClaw 仍然可以通过 ACP 路由 Codex。每次 ACP 会话启动都会被记录为一个[后台任务](/zh-CN/automation/tasks)。

如果你用自然语言要求 OpenClaw “在一个线程中启动 Claude Code” 或使用其他外部 harness，OpenClaw 应将该请求路由到 ACP 运行时（而不是原生子智能体运行时）。

如果你希望让 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有的 OpenClaw 渠道会话，
请使用 [`openclaw mcp serve`](/zh-CN/cli/mcp)，而不是 ACP。

## 我想看哪一页？

这里有三个彼此相近、很容易混淆的功能入口：

| 你想要…… | 使用这个 | 说明 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前会话中绑定或控制 Codex | `/codex bind`、`/codex threads` | 当 `codex` 插件启用时，使用原生 Codex app-server 路径；包括绑定聊天回复、图片转发、模型 / 快速 / 权限、停止和引导控制。ACP 是显式回退方案 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP，或其他外部 harness | 本页：ACP 智能体 | 聊天绑定会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制 |
| 将一个 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端 | [`openclaw acp`](/zh-CN/cli/acp) | 桥接模式。IDE / 客户端通过 stdio/WebSocket 使用 ACP 与 OpenClaw 通信 |
| 将本地 AI CLI 复用为纯文本回退模型 | [CLI 后端](/zh-CN/gateway/cli-backends) | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时 |

## 这是开箱即用的吗？

通常是。全新安装会默认启用内置的 `acpx` 运行时插件，并带有一个插件本地固定版本的 `acpx` 二进制文件，OpenClaw 会在启动时探测并自我修复。运行 `/acp doctor` 可进行就绪性检查。

首次运行的注意事项：

- 如果设置了 `plugins.allow`，它就是一个限制性的插件清单，必须包含 `acpx`；否则内置默认项会被有意阻止，且 `/acp doctor` 会报告缺失的 allowlist 条目。
- 目标 harness 适配器（Codex、Claude 等）可能会在你首次使用时通过 `npx` 按需获取。
- 该 harness 对应的厂商认证仍然必须已存在于主机上。
- 如果主机没有 npm 或网络访问能力，首次运行的适配器获取会失败，直到缓存被预热或通过其他方式安装该适配器。

## 操作手册

聊天中的快速 `/acp` 流程：

1. **启动** — `/acp spawn claude --bind here`、`/acp spawn gemini --mode persistent --thread auto`，或显式使用 `/acp spawn codex --bind here`
2. 在已绑定的会话或线程中**工作**（或者显式指定会话键）。
3. **检查状态** — `/acp status`
4. **调优** — `/acp model <provider/model>`、`/acp permissions <profile>`、`/acp timeout <seconds>`
5. 在不替换上下文的情况下**引导** — `/acp steer tighten logging and continue`
6. **停止** — `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）

当启用了原生 Codex 插件时，应路由到该插件的自然语言触发方式：

- “将这个 Discord 渠道绑定到 Codex。”
- “把这个聊天附加到 Codex 线程 `<id>`。”
- “显示 Codex 线程，然后绑定当前这个。”

原生 Codex 会话绑定是默认的聊天控制路径。OpenClaw 动态工具仍然通过 OpenClaw 执行，而 Codex 原生工具（如 shell / apply-patch）则在 Codex 内部执行。对于 Codex 原生工具事件，OpenClaw 会按轮次注入一个原生 hook relay，以便插件钩子能够阻止
`before_tool_call`、观察 `after_tool_call`，并通过 OpenClaw 审批流程路由 Codex 的
`PermissionRequest` 事件。Codex 的 `Stop` 钩子会被转发到 OpenClaw 的 `before_agent_finalize`，在那里插件可以在 Codex 最终生成答案之前请求再进行一次模型调用。这个 relay 保持刻意保守：它不会修改 Codex 原生工具参数，也不会重写 Codex 线程记录。只有当你明确想要 ACP 运行时 / 会话模型时，才使用显式 ACP。嵌入式 Codex 支持边界记录在
[Codex harness v1 支持约定](/zh-CN/plugins/codex-harness#v1-support-contract) 中。

应路由到 ACP 运行时的自然语言触发方式：

- “把这个任务作为一次性的 Claude Code ACP 会话运行，并总结结果。”
- “在一个线程里用 Gemini CLI 处理这个任务，然后把后续内容继续保留在同一个线程中。”
- “通过 ACP 在后台线程中运行 Codex。”

OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，在支持的情况下绑定到当前会话或线程，并将后续消息路由到该会话，直到关闭 / 过期。只有在明确要求 ACP / acpx，或请求的操作无法使用原生 Codex 插件时，Codex 才会走这条路径。

对于 `sessions_spawn`，只有在 ACP 已启用、
请求方未处于沙箱隔离状态，且 ACP 运行时后端已加载时，才会公布 `runtime: "acp"`。它面向
ACP harness id，例如 `codex`、`claude`、`droid`、`gemini` 或 `opencode`。不要传入来自 `agents_list` 的普通 OpenClaw 配置智能体 id，除非该条目已显式配置了 `agents.list[].runtime.type="acp"`；否则应使用默认子智能体运行时。当一个 OpenClaw 智能体配置了
`runtime.type="acp"` 时，OpenClaw 会使用 `runtime.acp.agent` 作为底层 harness id。

## ACP 与子智能体

当你需要外部 harness 运行时时，使用 ACP。当 `codex` 插件启用且你要进行 Codex 会话绑定 / 控制时，使用原生 Codex app-server。若你希望执行 OpenClaw 原生委派运行，则使用子智能体。

| 区域 | ACP 会话 | 子智能体运行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时 | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时 |
| 会话键 | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主要命令 | `/acp ...` | `/subagents ...` |
| 启动工具 | `sessions_spawn` 配合 `runtime:"acp"` | `sessions_spawn`（默认运行时） |

另请参阅 [子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行的 Claude Code，其栈结构如下：

1. OpenClaw ACP 会话控制平面
2. 内置 `acpx` 运行时插件
3. Claude ACP 适配器
4. Claude 侧运行时 / 会话机制

重要区别：

- ACP Claude 是一种 harness 会话，具备 ACP 控制、会话恢复、后台任务跟踪，以及可选的会话 / 线程绑定。
- CLI 后端是独立的纯文本本地回退运行时。参见 [CLI 后端](/zh-CN/gateway/cli-backends)。

对操作人员来说，实用规则是：

- 想要 `/acp spawn`、可绑定会话、运行时控制，或持久化 harness 工作：使用 ACP
- 想要通过原始 CLI 进行简单的本地文本回退：使用 CLI 后端

## 绑定会话

### 当前会话绑定

`/acp spawn <harness> --bind here` 会将当前会话固定到已启动的 ACP 会话 —— 不创建子线程，仍在同一个聊天界面中。OpenClaw 继续负责传输、认证、安全和消息投递；该会话中的后续消息会路由到同一个会话；`/new` 和 `/reset` 会原地重置该会话；`/acp close` 会移除该绑定。

心智模型：

- **聊天界面** —— 人们持续交流的地方（Discord 渠道、Telegram 话题、iMessage 聊天）。
- **ACP 会话** —— OpenClaw 路由到的持久化 Codex / Claude / Gemini 运行时状态。
- **子线程 / 话题** —— 仅在使用 `--thread ...` 时才会创建的可选额外消息界面。
- **运行时工作区** —— harness 运行的文件系统位置（`cwd`、仓库检出目录、后端工作区）。它独立于聊天界面。

示例：

- `/codex bind` —— 保留当前聊天，启动或附加原生 Codex app-server，并将未来消息路由到这里。
- `/codex model gpt-5.4`、`/codex fast on`、`/codex permissions yolo` —— 直接在聊天中调优已绑定的原生 Codex 线程。
- `/codex stop` 或 `/codex steer focus on the failing tests first` —— 控制当前活跃的原生 Codex 轮次。
- `/acp spawn codex --bind here` —— Codex 的显式 ACP 回退方案。
- `/acp spawn codex --thread auto` —— OpenClaw 可能会创建一个子线程 / 话题并绑定到那里。
- `/acp spawn codex --bind here --cwd /workspace/repo` —— 保持当前聊天绑定，但 Codex 在 `/workspace/repo` 中运行。

说明：

- `--bind here` 和 `--thread ...` 互斥。
- `--bind here` 仅适用于声明支持当前会话绑定的渠道；否则 OpenClaw 会返回清晰的不支持提示。绑定会在 Gateway 网关重启后继续保留。
- 在 Discord 上，仅当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions` —— 对于 `--bind here` 则不需要。
- 如果你启动到不同的 ACP 智能体且没有指定 `--cwd`，OpenClaw 默认会继承**目标智能体的**工作区。若继承的路径缺失（`ENOENT` / `ENOTDIR`），则会回退到后端默认值；其他访问错误（例如 `EACCES`）则会作为启动错误直接暴露。

### 线程绑定会话

当某个渠道适配器启用了线程绑定时，ACP 会话可以绑定到线程：

- OpenClaw 将某个线程绑定到目标 ACP 会话。
- 该线程中的后续消息会路由到已绑定的 ACP 会话。
- ACP 输出会被投递回同一个线程。
- 取消聚焦 / 关闭 / 归档 / 空闲超时，或最大存活时间到期，都会移除该绑定。

线程绑定支持取决于适配器。如果当前渠道适配器不支持线程绑定，OpenClaw 会返回清晰的不支持 / 不可用提示。

线程绑定 ACP 所需的功能标志：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设置为 `false` 可暂停 ACP 分发）
- 渠道适配器的 ACP 线程启动标志已启用（适配器特定）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持线程的渠道

- 任何暴露会话 / 线程绑定能力的渠道适配器。
- 当前内置支持：
  - Discord 线程 / 渠道
  - Telegram 话题（群组 / 超级群组中的论坛话题，以及私信话题）
- 插件渠道也可以通过相同的绑定接口添加支持。

## 渠道特定设置

对于非临时性工作流，请在顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 标记一个持久化 ACP 会话绑定。
- `bindings[].match` 用于标识目标会话：
  - Discord 渠道或线程：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛话题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles 私信 / 群聊：`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。
  - iMessage 私信 / 群聊：`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，优先使用 `chat_id:*`。
- `bindings[].agentId` 是所属的 OpenClaw 智能体 id。
- 可选的 ACP 覆盖项位于 `bindings[].acp` 下：
  - `mode`（`persistent` 或 `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### 每个智能体的运行时默认值

使用 `agents.list[].runtime` 为每个智能体一次性定义 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP 绑定会话的覆盖优先级：

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 全局 ACP 默认值（例如 `acp.backend`）

示例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

行为：

- OpenClaw 会在使用前确保已配置的 ACP 会话存在。
- 该渠道或话题中的消息会路由到已配置的 ACP 会话。
- 在已绑定的会话中，`/new` 和 `/reset` 会原地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍会生效。
- 对于未显式指定 `cwd` 的跨智能体 ACP 启动，OpenClaw 会从智能体配置中继承目标智能体的工作区。
- 缺失的继承工作区路径会回退到后端默认 `cwd`；非缺失类访问失败则会作为启动错误暴露出来。

## 启动 ACP 会话（接口）

### 从 `sessions_spawn`

使用 `runtime: "acp"` 从一个智能体轮次或工具调用中启动 ACP 会话。

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

说明：

- `runtime` 默认为 `subagent`，因此对于 ACP 会话需要显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，OpenClaw 会在已配置时使用 `acp.defaultAgent`。
- `mode: "session"` 需要 `thread: true` 才能保持持久化绑定会话。

接口细节：

- `task`（必填）：发送到 ACP 会话的初始提示。
- `runtime`（ACP 必填）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。如果已设置，则回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持时请求线程绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久化）。
  - 默认值为 `run`
  - 如果 `thread: true` 且省略 `mode`，OpenClaw 可能会根据运行时路径默认采用持久化行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端 / 运行时策略校验）。如果省略，ACP 启动会在已配置时继承目标智能体工作区；缺失的继承路径会回退到后端默认值，而真实访问错误会被直接返回。
- `label`（可选）：面向操作人员的标签，用于会话 / 横幅文本。
- `resumeSessionId`（可选）：恢复现有 ACP 会话，而不是创建新会话。智能体会通过 `session/load` 重放其会话历史。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 会将初始 ACP 运行进度摘要作为系统事件流式返回给请求方会话。
  - 在可用时，接受的响应中会包含 `streamLogPath`，指向一个会话范围的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以对其执行 tail 以查看完整 relay 历史。
- `runTimeoutSeconds`（可选）：在 N 秒后中止 ACP 子轮次。`0` 会让该轮次走 Gateway 网关的无超时路径。相同的值会同时应用到 Gateway 网关运行和 ACP 运行时，这样卡住或额度耗尽的 harness 就不会无限期占用父智能体通道。
- `model`（可选）：ACP 子会话的显式模型覆盖。Codex ACP 启动会在 `session/new` 之前，将 OpenClaw Codex 引用（例如 `openai-codex/gpt-5.4`）规范化为 Codex ACP 启动配置；像 `openai-codex/gpt-5.4/high` 这样的斜杠形式还会设置 Codex ACP 推理强度。其他 harness 必须声明 ACP `models` 并支持 `session/set_model`；否则 OpenClaw / acpx 会清晰地失败，而不是静默回退到目标智能体默认值。
- `thinking`（可选）：ACP 子会话的显式思考 / 推理强度。对于 Codex ACP，`minimal` 映射为低强度，`low` / `medium` / `high` / `xhigh` 直接映射，而 `off` 会省略推理强度启动覆盖。

## 交付模型

ACP 会话既可以是交互式工作区，也可以是由父级拥有的后台工作。交付路径取决于其形态。

### 交互式 ACP 会话

交互式会话用于在可见的聊天界面上持续对话：

- `/acp spawn ... --bind here` 将当前会话绑定到 ACP 会话。
- `/acp spawn ... --thread ...` 将渠道线程 / 话题绑定到 ACP 会话。
- 持久化配置的 `bindings[].type="acp"` 会将匹配的会话路由到同一个 ACP 会话。

已绑定会话中的后续消息会直接路由到 ACP 会话，而 ACP 输出也会投递回同一个渠道 / 线程 / 话题。

### 父级拥有的一次性 ACP 会话

由另一个智能体运行启动的一次性 ACP 会话属于后台子任务，类似子智能体：

- 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
- 子级在它自己的 ACP harness 会话中运行。
- 子级轮次运行在与原生子智能体启动相同的后台通道上，因此缓慢的 ACP harness 不会阻塞不相关的主会话工作。
- 完成结果会通过内部任务完成通知路径回传。
- 当需要面向用户的回复时，父级会用普通助手语气重写子级结果。

不要将这条路径视为父子之间的点对点聊天。子级已经有一个返回给父级的完成通道。

### `sessions_send` 与 A2A 交付

`sessions_send` 可以在启动后将目标指向另一个会话。对于普通对等会话，OpenClaw 会在注入消息后使用智能体到智能体（A2A）的后续路径：

- 等待目标会话的回复
- 可选地让请求方和目标方进行有限次数的后续往返
- 要求目标生成一条通知消息
- 将该通知投递到可见的渠道或线程

这条 A2A 路径是对等发送场景下的回退方案，适用于发送方需要可见后续结果时。它在某个无关会话可以查看并向 ACP 目标发消息时仍会保持启用，例如在较宽松的 `tools.sessions.visibility` 设置下。

只有当请求方是其自有的一次性 ACP 子会话的父级时，OpenClaw 才会跳过 A2A 后续流程。在这种情况下，如果在任务完成之上再运行 A2A，可能会用子级结果唤醒父级，再把父级回复转发回子级，从而形成父 / 子回声循环。对于这种已拥有子级的情况，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为完成路径已经负责处理结果了。

### 恢复现有会话

使用 `resumeSessionId` 来继续之前的 ACP 会话，而不是重新开始。智能体会通过 `session/load` 重放其会话历史，因此它能够带着之前的完整上下文继续工作。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见使用场景：

- 将一个 Codex 会话从你的笔记本电脑交接到手机 —— 告诉你的智能体从你上次中断的地方继续
- 继续一个你之前在 CLI 中以交互方式启动、现在想通过智能体以无头方式继续的编码会话
- 继续因 Gateway 网关重启或空闲超时而中断的工作

说明：

- `resumeSessionId` 需要 `runtime: "acp"` —— 如果与子智能体运行时一起使用，会返回错误。
- `resumeSessionId` 会恢复上游 ACP 会话历史；你正在创建的新 OpenClaw 会话仍会正常应用 `thread` 和 `mode`，因此 `mode: "session"` 仍然需要 `thread: true`。
- 目标智能体必须支持 `session/load`（Codex 和 Claude Code 都支持）。
- 如果找不到该会话 id，启动会以清晰的错误失败 —— 不会静默回退到新会话。

<Accordion title="部署后的冒烟测试">

在 Gateway 网关部署后，运行一次真实的端到端检查，而不是只依赖单元测试：

1. 验证目标主机上已部署的 Gateway 网关版本和提交。
2. 打开一个到在线智能体的临时 ACPX bridge 会话。
3. 要求该智能体调用 `sessions_spawn`，参数为 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，任务内容为 `Reply with exactly LIVE-ACP-SPAWN-OK`。
4. 验证 `accepted=yes`、存在真实的 `childSessionKey`，且没有校验器错误。
5. 清理临时 bridge 会话。

将检查门槛保持在 `mode: "run"`，并跳过 `streamTo: "parent"` —— 线程绑定的 `mode: "session"` 和流 relay 路径属于独立且更丰富的集成验证。

</Accordion>

## 沙箱兼容性

ACP 会话当前运行在主机运行时上，而不是 OpenClaw 沙箱内。

当前限制：

- 如果请求方会话处于沙箱隔离状态，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 都会阻止 ACP 启动。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

当你需要强制使用沙箱执行时，请使用 `runtime: "subagent"`。

### 从 `/acp` 命令

在需要时，使用 `/acp spawn` 从聊天中进行显式操作控制。

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

关键标志：

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

参见[斜杠命令](/zh-CN/tools/slash-commands)。

## 会话目标解析

大多数 `/acp` 操作都接受一个可选的会话目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试键名
   - 然后尝试 UUID 形状的会话 id
   - 最后尝试标签
2. 当前线程绑定（如果当前会话 / 线程已绑定到某个 ACP 会话）
3. 当前请求方会话回退

当前会话绑定和线程绑定都会参与第 2 步。

如果无法解析出目标，OpenClaw 会返回清晰的错误（`Unable to resolve session target: ...`）。

## 启动绑定模式

`/acp spawn` 支持 `--bind here|off`。

| 模式 | 行为 |
| ------ | ---------------------------------------------------------------------- |
| `here` | 原地绑定当前活跃会话；如果当前没有活跃会话则失败。 |
| `off`  | 不创建当前会话绑定。 |

说明：

- `--bind here` 是“让这个渠道或聊天由 Codex 提供支持”这类操作最简单的操作路径。
- `--bind here` 不会创建子线程。
- `--bind here` 仅适用于暴露当前会话绑定支持的渠道。
- `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

## 启动线程模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式 | 行为 |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | 如果当前在活跃线程中：绑定该线程。如果当前不在线程中：在支持时创建 / 绑定一个子线程。 |
| `here` | 要求当前必须处于活跃线程中；否则失败。 |
| `off`  | 不进行绑定。会话以未绑定状态启动。 |

说明：

- 在不支持线程绑定的界面上，默认行为实际上等同于 `off`。
- 线程绑定启动需要渠道策略支持：
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
- 当你想固定当前会话而不创建子线程时，请使用 `--bind here`。

## ACP 控制

| 命令 | 作用 | 示例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | 创建 ACP 会话；可选当前绑定或线程绑定。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 取消目标会话的进行中轮次。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 向运行中的会话发送引导指令。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | 关闭会话并解绑线程目标。 | `/acp close` |
| `/acp status` | 显示后端、模式、状态、运行时选项、能力。 | `/acp status` |
| `/acp set-mode` | 为目标会话设置运行时模式。 | `/acp set-mode plan` |
| `/acp set` | 写入通用运行时配置选项。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | 设置运行时工作目录覆盖值。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 设置审批策略配置文件。 | `/acp permissions strict` |
| `/acp timeout` | 设置运行时超时（秒）。 | `/acp timeout 120` |
| `/acp model` | 设置运行时模型覆盖值。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | 移除会话运行时选项覆盖值。 | `/acp reset-options` |
| `/acp sessions` | 从存储中列出最近的 ACP 会话。 | `/acp sessions` |
| `/acp doctor` | 后端健康状态、能力、可执行修复措施。 | `/acp doctor` |
| `/acp install` | 打印确定性的安装和启用步骤。 | `/acp install` |

`/acp status` 会显示生效中的运行时选项，以及运行时级别和后端级别的会话标识符。当某个后端缺少某项能力时，不支持控制的错误会被清晰地显示出来。`/acp sessions` 会读取当前已绑定会话或请求方会话的存储；目标令牌（`session-key`、`session-id` 或 `session-label`）会通过 Gateway 网关会话发现机制解析，包括自定义的每智能体 `session.store` 根目录。

## 运行时选项映射

`/acp` 提供便捷命令和通用 setter。

等价操作：

- `/acp model <id>` 映射到运行时配置键 `model`。对于 Codex ACP，OpenClaw 会将 `openai-codex/<model>` 规范化为适配器模型 id，并将斜杠推理后缀（例如 `openai-codex/gpt-5.4/high`）映射为 Codex ACP 的 `reasoning_effort`。对于其他 harness，模型控制取决于适配器是否支持 ACP `models` 和 `session/set_model`。
- `/acp set thinking <level>` 映射到运行时配置键 `thinking`。对于 Codex ACP，在适配器支持的情况下，OpenClaw 会发送对应的 `reasoning_effort`。
- `/acp permissions <profile>` 映射到运行时配置键 `approval_policy`。
- `/acp timeout <seconds>` 映射到运行时配置键 `timeout`。
- `/acp cwd <path>` 直接更新运行时 `cwd` 覆盖值。
- `/acp set <key> <value>` 是通用路径。
  - 特殊情况：`key=cwd` 会使用 `cwd` 覆盖路径。
- `/acp reset-options` 会清除目标会话的所有运行时覆盖值。

## acpx harness、插件设置和权限

关于 acpx harness 配置（Claude Code / Codex / Gemini CLI 别名）、
plugin-tools 和 OpenClaw-tools MCP bridge，以及 ACP 权限模式，请参阅
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状 | 可能原因 | 修复方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | 后端插件缺失、被禁用，或被 `plugins.allow` 阻止。 | 安装并启用后端插件；如果设置了该 allowlist，请将 `acpx` 包含在 `plugins.allow` 中，然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP 在全局范围内被禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 来自普通线程消息的分发被禁用。 | 设置 `acp.dispatch.enabled=true`。 |
| `ACP agent "<id>" is not allowed by policy` | 智能体不在 allowlist 中。 | 使用被允许的 `agentId`，或更新 `acp.allowedAgents`。 |
| `Unable to resolve session target: ...` | 键 / id / 标签令牌错误。 | 运行 `/acp sessions`，复制精确的键或标签后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活跃可绑定会话的情况下使用了 `--bind here`。 | 移动到目标聊天 / 渠道后重试，或使用未绑定启动。 |
| `Conversation bindings are unavailable for <channel>.` | 适配器缺少当前会话 ACP 绑定能力。 | 在支持时使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或切换到受支持的渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread` | 在线程上下文之外使用了 `--thread here`。 | 移动到目标线程，或使用 `--thread auto` / `off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 当前活跃绑定目标归另一位用户所有。 | 由所有者重新绑定，或使用其他会话或线程。 |
| `Thread bindings are unavailable for <channel>.` | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或切换到受支持的适配器 / 渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 运行时在主机侧运行；请求方会话处于沙箱隔离状态。 | 在沙箱隔离会话中使用 `runtime="subagent"`，或从非沙箱隔离会话启动 ACP。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | 为 ACP 运行时请求了 `sandbox="require"`。 | 对必须启用沙箱的场景使用 `runtime="subagent"`，或从非沙箱隔离会话中将 ACP 与 `sandbox="inherit"` 一起使用。 |
| `Cannot apply --model ... did not advertise model support` | 目标 harness 未暴露通用 ACP 模型切换支持。 | 使用声明了 ACP `models` / `session/set_model` 的 harness，使用 Codex ACP 模型引用，或如果该 harness 有自己的启动标志，则直接在 harness 中配置模型。 |
| Missing ACP metadata for bound session | ACP 会话元数据已过期或被删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定 / 聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP 会话中阻止写入 / 执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。参见[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。 |
| ACP session fails early with little output | 权限提示被 `permissionMode` / `nonInteractivePermissions` 阻止。 | 检查 Gateway 网关日志中的 `AcpRuntimeError`。若要授予完整权限，请设置 `permissionMode=approve-all`；若要优雅降级，请设置 `nonInteractivePermissions=deny`。 |
| ACP session stalls indefinitely after completing work | harness 进程已结束，但 ACP 会话未报告完成。 | 使用 `ps aux \| grep acpx` 监控；手动杀掉陈旧进程。 |

## 相关内容

- [子智能体](/zh-CN/tools/subagents)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [智能体发送](/zh-CN/tools/agent-send)
