---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置与对话绑定的 ACP 会话
    - 将消息渠道中的对话绑定到持久化 ACP 会话
    - 排查 ACP 后端和插件接线问题
    - 调试 ACP 完成结果传递或智能体到智能体循环问题
    - 从聊天中操作 `/acp` 命令
summary: 对 Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP 和其他 harness 智能体使用 ACP 运行时会话
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-24T02:39:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d09d4142ad56d9782ed5d7e40f7eab4c89f22131d35f749fcb07700c4d354e30
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol（ACP）](https://agentclientprotocol.com/) 会话让 OpenClaw 能够通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI，以及其他受支持的 ACPX harness）。

如果你用自然语言让 OpenClaw “在 Codex 里运行这个”或“在线程里启动 Claude Code”，OpenClaw 应该将该请求路由到 ACP 运行时（而不是原生子智能体运行时）。每次 ACP 会话启动都会被跟踪为一个[后台任务](/zh-CN/automation/tasks)。

如果你想让 Codex 或 Claude Code 作为外部 MCP 客户端直接连接
到现有的 OpenClaw 渠道对话，请使用 [`openclaw mcp serve`](/zh-CN/cli/mcp)
而不是 ACP。

## 我需要看哪个页面？

这里有三个相近且容易混淆的功能面：

| 你想要…… | 使用这个 | 说明 |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 通过 OpenClaw 运行 Codex、Claude Code、Gemini CLI 或其他外部 harness | 本页：ACP 智能体 | 与聊天绑定的会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制 |
| 将 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端 | [`openclaw acp`](/zh-CN/cli/acp) | 桥接模式。IDE/客户端 通过 stdio/WebSocket 使用 ACP 与 OpenClaw 通信 |
| 将本地 AI CLI 复用为仅文本的回退模型 | [CLI Backends](/zh-CN/gateway/cli-backends) | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时 |

## 开箱即用吗？

通常可以。全新安装会默认启用内置的 `acpx` 运行时插件，并附带一个插件本地固定版本的 `acpx` 二进制文件，OpenClaw 会在启动时探测并自我修复它。运行 `/acp doctor` 可进行就绪性检查。

首次运行的常见注意事项：

- 目标 harness 适配器（Codex、Claude 等）可能会在你第一次使用时通过 `npx` 按需拉取。
- 该 harness 对应的供应商认证仍然必须已存在于宿主机上。
- 如果宿主机没有 npm 或网络访问能力，首次运行时的适配器拉取会失败，直到缓存被预热或以其他方式安装该适配器。

## 操作手册

在聊天中快速使用 `/acp` 的流程：

1. **启动** — `/acp spawn codex --bind here` 或 `/acp spawn codex --mode persistent --thread auto`
2. 在绑定的对话或线程中**处理工作**（或者显式指定会话键）。
3. **检查状态** — `/acp status`
4. **调优** — `/acp model <provider/model>`、`/acp permissions <profile>`、`/acp timeout <seconds>`
5. **引导**而不替换上下文 — `/acp steer tighten logging and continue`
6. **停止** — `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）

应当路由到 ACP 运行时的自然语言触发示例：

- “把这个 Discord 频道绑定到 Codex。”
- “在这里的线程里启动一个持久的 Codex 会话。”
- “把这个作为一次性的 Claude Code ACP 会话来运行，并总结结果。”
- “这个任务使用 Gemini CLI 在线程中处理，然后后续继续在同一个线程里进行。”

OpenClaw 会选择 `runtime: "acp"`，解析 harness 的 `agentId`，在支持的情况下绑定到当前对话或线程，并将后续消息路由到该会话，直到关闭或过期。

## ACP 与子智能体的区别

如果你想使用外部 harness 运行时，请使用 ACP。如果你想使用 OpenClaw 原生委派运行，请使用子智能体。

| 区域 | ACP 会话 | 子智能体运行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时 | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时 |
| 会话键 | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主要命令 | `/acp ...` | `/subagents ...` |
| 启动工具 | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（默认运行时） |

另见 [Sub-agents](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行的 Claude Code，其栈如下：

1. OpenClaw ACP 会话控制平面
2. 内置的 `acpx` 运行时插件
3. Claude ACP 适配器
4. Claude 侧的运行时/会话机制

一个重要区别：

- ACP Claude 是一种 harness 会话，具有 ACP 控制、会话恢复、后台任务跟踪，以及可选的对话/线程绑定能力。
- CLI 后端则是独立的、仅文本的本地回退运行时。参见 [CLI Backends](/zh-CN/gateway/cli-backends)。

对操作人员来说，实用规则是：

- 想要 `/acp spawn`、可绑定的会话、运行时控制或持久化 harness 工作：使用 ACP
- 想要通过原始 CLI 获得简单的本地文本回退：使用 CLI 后端

## 绑定的会话

### 绑定到当前对话

`/acp spawn <harness> --bind here` 会将当前对话固定绑定到新启动的 ACP 会话 —— 不创建子线程，仍在同一个聊天界面中。OpenClaw 继续负责传输、认证、安全和消息投递；该对话中的后续消息会路由到同一个会话；`/new` 和 `/reset` 会在原位重置该会话；`/acp close` 会移除该绑定。

理解模型：

- **聊天界面** — 人们持续对话的地方（Discord 频道、Telegram 话题、iMessage 聊天）。
- **ACP 会话** — OpenClaw 路由到的持久化 Codex/Claude/Gemini 运行时状态。
- **子线程/话题** — 一个可选的额外消息界面，仅在使用 `--thread ...` 时创建。
- **运行时工作区** — harness 运行所在的文件系统位置（`cwd`、仓库检出目录、后端工作区）。它独立于聊天界面。

示例：

- `/acp spawn codex --bind here` — 保持当前聊天，启动或附加 Codex，并将未来消息路由到这里。
- `/acp spawn codex --thread auto` — OpenClaw 可能会创建一个子线程/话题并绑定到那里。
- `/acp spawn codex --bind here --cwd /workspace/repo` — 仍绑定当前聊天，但 Codex 在 `/workspace/repo` 中运行。

说明：

- `--bind here` 与 `--thread ...` 互斥。
- `--bind here` 仅适用于声明支持当前对话绑定的渠道；否则 OpenClaw 会返回清晰的不支持提示。绑定会在 Gateway 网关重启后继续保留。
- 在 Discord 上，只有当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions` —— 对于 `--bind here` 则不需要。
- 如果你启动到另一个 ACP 智能体且未指定 `--cwd`，OpenClaw 默认会继承**目标智能体的**工作区。缺失的继承路径（`ENOENT`/`ENOTDIR`）会回退到后端默认值；其他访问错误（例如 `EACCES`）会作为启动错误直接暴露。

### 绑定到线程的会话

当某个渠道适配器启用了线程绑定时，ACP 会话可以绑定到线程：

- OpenClaw 将线程绑定到目标 ACP 会话。
- 该线程中的后续消息会路由到绑定的 ACP 会话。
- ACP 输出会回传到同一个线程。
- 失焦/关闭/归档/空闲超时或最大存活时间到期都会移除该绑定。

线程绑定支持取决于适配器。如果当前渠道适配器不支持线程绑定，OpenClaw 会返回清晰的不支持/不可用提示。

线程绑定 ACP 所需的功能标志：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停 ACP 分发）
- 渠道适配器的 ACP 线程启动标志已启用（适配器特定）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持线程的渠道

- 任何暴露会话/线程绑定能力的渠道适配器。
- 当前内置支持：
  - Discord 线程/频道
  - Telegram 话题（群组/超级群组中的论坛话题，以及私信话题）
- 渠道插件也可以通过同一绑定接口添加支持。

## 渠道特定设置

对于非临时工作流，请在顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 表示一个持久化 ACP 对话绑定。
- `bindings[].match` 用于标识目标对话：
  - Discord 频道或线程：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛话题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles 私信/群聊：`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。
  - iMessage 私信/群聊：`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
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

- OpenClaw 会在使用前确保已存在配置好的 ACP 会话。
- 该频道或话题中的消息会路由到配置好的 ACP 会话。
- 在绑定的对话中，`/new` 和 `/reset` 会在原位重置同一个 ACP 会话键。
- 临时运行时绑定（例如通过线程聚焦流程创建的绑定）在存在时仍会生效。
- 对于未显式指定 `cwd` 的跨智能体 ACP 启动，OpenClaw 会从智能体配置中继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 `cwd`；非缺失类访问失败会作为启动错误直接暴露。

## 启动 ACP 会话（接口）

### 从 `sessions_spawn` 启动

使用 `runtime: "acp"` 可从智能体轮次或工具调用中启动 ACP 会话。

```json
{
  "task": "打开仓库并总结失败的测试",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

说明：

- `runtime` 默认为 `subagent`，因此 ACP 会话必须显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，OpenClaw 会在已配置时使用 `acp.defaultAgent`。
- `mode: "session"` 需要 `thread: true` 才能保持一个持久化的绑定对话。

接口详情：

- `task`（必填）：发送到 ACP 会话的初始提示。
- `runtime`（ACP 必填）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。如果已设置，则回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持时请求线程绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久化）。
  - 默认为 `run`
  - 如果 `thread: true` 且省略 `mode`，OpenClaw 可能会根据运行时路径默认采用持久化行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端/运行时策略校验）。如果省略，ACP 启动会在已配置时继承目标智能体工作区；缺失的继承路径会回退到后端默认值，而真实的访问错误会被直接返回。
- `label`（可选）：用于会话/横幅文本中的面向操作员标签。
- `resumeSessionId`（可选）：恢复现有 ACP 会话，而不是创建新会话。智能体会通过 `session/load` 重放其对话历史。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 会将初始 ACP 运行的进度摘要作为系统事件流式回传给请求方会话。
  - 可用时，接受的响应会包含 `streamLogPath`，指向一个按会话划分的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以 tail 它来查看完整的中继历史。
- `model`（可选）：为 ACP 子会话显式覆盖模型。对 `runtime: "acp"` 生效，因此子会话会使用所请求的模型，而不是静默回退到目标智能体默认模型。

## 交付模型

ACP 会话既可以是交互式工作区，也可以是由父级拥有的后台工作。交付路径取决于它的形态。

### 交互式 ACP 会话

交互式会话旨在让你持续在可见的聊天界面中交流：

- `/acp spawn ... --bind here` 将当前对话绑定到 ACP 会话。
- `/acp spawn ... --thread ...` 将某个渠道线程/话题绑定到 ACP 会话。
- 持久化配置的 `bindings[].type="acp"` 会将匹配的对话路由到同一个 ACP 会话。

绑定对话中的后续消息会直接路由到 ACP 会话，ACP 输出也会回传到同一个频道/线程/话题。

### 由父级拥有的一次性 ACP 会话

由另一个智能体运行启动的一次性 ACP 会话是后台子级，类似子智能体：

- 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
- 子级在自己的 ACP harness 会话中运行。
- 完成结果通过内部任务完成通知路径回报。
- 当需要面向用户的回复时，父级会用普通助手口吻重写子级结果。

不要把这一路径视为父子之间的点对点聊天。子级已经有一条回传完成结果给父级的通道。

### `sessions_send` 与 A2A 交付

`sessions_send` 可以在启动后将消息发送到另一个会话。对于普通对等会话，OpenClaw 在注入消息后会使用智能体到智能体（A2A）的后续跟进路径：

- 等待目标会话的回复
- 可选地让请求方与目标交换有限轮数的后续消息
- 要求目标生成一条通知消息
- 将该通知投递到可见的频道或线程

这条 A2A 路径是对等发送时的一种回退机制，用于发送方需要可见跟进结果的场景。当一个无关会话能够看到并向 ACP 目标发送消息时，它仍然保持启用，例如在较宽松的 `tools.sessions.visibility` 设置下。

只有当请求方是其自有的一次性 ACP 子会话的父级时，OpenClaw 才会跳过 A2A 跟进。在这种情况下，如果在任务完成之上再运行 A2A，就可能用子级结果唤醒父级，再将父级回复转发回子级，从而形成父子回声循环。对于这种自有子级场景，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为完成路径已经负责处理结果。

### 恢复现有会话

使用 `resumeSessionId` 可继续之前的 ACP 会话，而不是重新开始。智能体会通过 `session/load` 重放其对话历史，因此它会带着之前的完整上下文继续工作。

```json
{
  "task": "从我们上次停下的地方继续——修复剩余的测试失败",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见用例：

- 将一个 Codex 会话从你的笔记本电脑交接到手机 —— 告诉你的智能体从你上次停下的地方继续
- 继续一个你此前在 CLI 中交互式启动、现在要通过智能体以无头方式继续的编码会话
- 继续处理因 Gateway 网关重启或空闲超时而中断的工作

说明：

- `resumeSessionId` 需要 `runtime: "acp"` —— 如果与子智能体运行时一起使用，会返回错误。
- `resumeSessionId` 会恢复上游 ACP 对话历史；`thread` 和 `mode` 仍然会正常应用于你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍然要求 `thread: true`。
- 目标智能体必须支持 `session/load`（Codex 和 Claude Code 都支持）。
- 如果找不到该会话 id，启动会以清晰错误失败 —— 不会静默回退到新会话。

<Accordion title="部署后冒烟测试">

Gateway 网关部署后，请运行一次真实的端到端检查，而不要只依赖单元测试：

1. 在目标主机上验证已部署的 Gateway 网关版本和提交。
2. 打开一个临时的 ACPX 桥接会话连接到在线智能体。
3. 要求该智能体调用 `sessions_spawn`，并设置 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，任务内容为 `Reply with exactly LIVE-ACP-SPAWN-OK`。
4. 验证 `accepted=yes`、存在真实的 `childSessionKey`，并且没有校验器错误。
5. 清理该临时桥接会话。

请将门槛保持在 `mode: "run"`，并跳过 `streamTo: "parent"` —— 绑定线程的 `mode: "session"` 和流中继路径属于另外更丰富的集成验证阶段。

</Accordion>

## 沙箱兼容性

ACP 会话当前运行在宿主运行时上，而不是 OpenClaw 沙箱内部。

当前限制：

- 如果请求方会话处于沙箱中，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 启动都会被阻止。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- 带有 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

当你需要由沙箱强制执行的运行时，请使用 `runtime: "subagent"`。

### 从 `/acp` 命令启动

在需要时，使用 `/acp spawn` 从聊天中进行显式的操作员控制。

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

参见 [Slash Commands](/zh-CN/tools/slash-commands)。

## 会话目标解析

大多数 `/acp` 操作都接受一个可选的会话目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试 key
   - 然后尝试 UUID 形状的 session id
   - 再尝试 label
2. 当前线程绑定（如果此对话/线程已绑定到 ACP 会话）
3. 当前请求方会话回退

当前对话绑定和线程绑定都会参与第 2 步。

如果无法解析出目标，OpenClaw 会返回清晰错误（`Unable to resolve session target: ...`）。

## 启动绑定模式

`/acp spawn` 支持 `--bind here|off`。

| 模式 | 行为 |
| ------ | ---------------------------------------------------------------------- |
| `here` | 将当前活动对话原位绑定；如果当前没有活动对话则失败。 |
| `off` | 不创建当前对话绑定。 |

说明：

- `--bind here` 是“让这个频道或聊天由 Codex 支持”的最简单操作路径。
- `--bind here` 不会创建子线程。
- `--bind here` 仅在暴露当前对话绑定支持的渠道中可用。
- `--bind` 和 `--thread` 不能在同一次 `/acp spawn` 调用中同时使用。

## 启动线程模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式 | 行为 |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | 在活动线程中：绑定该线程。在线程外：在支持时创建/绑定一个子线程。 |
| `here` | 要求当前处于活动线程中；如果不在线程中则失败。 |
| `off` | 不进行绑定。会话以未绑定状态启动。 |

说明：

- 在不支持线程绑定的界面上，默认行为实际上等同于 `off`。
- 绑定线程的启动需要渠道策略支持：
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
- 当你想固定当前对话且不创建子线程时，请使用 `--bind here`。

## ACP 控制

| 命令 | 作用 | 示例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | 创建 ACP 会话；可选择当前对话绑定或线程绑定。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 取消目标会话的进行中轮次。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 向运行中的会话发送引导指令。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | 关闭会话并解除线程目标绑定。 | `/acp close` |
| `/acp status` | 显示后端、模式、状态、运行时选项和能力。 | `/acp status` |
| `/acp set-mode` | 为目标会话设置运行时模式。 | `/acp set-mode plan` |
| `/acp set` | 通用运行时配置选项写入。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | 设置运行时工作目录覆盖。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 设置审批策略配置文件。 | `/acp permissions strict` |
| `/acp timeout` | 设置运行时超时（秒）。 | `/acp timeout 120` |
| `/acp model` | 设置运行时模型覆盖。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | 移除会话运行时选项覆盖。 | `/acp reset-options` |
| `/acp sessions` | 列出存储中的最近 ACP 会话。 | `/acp sessions` |
| `/acp doctor` | 后端健康状态、能力和可执行修复建议。 | `/acp doctor` |
| `/acp install` | 打印确定性的安装和启用步骤。 | `/acp install` |

`/acp status` 会显示生效的运行时选项，以及运行时级别和后端级别的会话标识符。当后端缺少某项能力时，不支持控制的错误会被清晰地呈现出来。`/acp sessions` 会读取当前绑定会话或请求方会话的存储；目标标记（`session-key`、`session-id` 或 `session-label`）会通过 Gateway 网关会话发现进行解析，包括每个智能体自定义的 `session.store` 根路径。

## 运行时选项映射

`/acp` 提供了便捷命令和一个通用设置器。

等效操作：

- `/acp model <id>` 映射到运行时配置键 `model`。
- `/acp permissions <profile>` 映射到运行时配置键 `approval_policy`。
- `/acp timeout <seconds>` 映射到运行时配置键 `timeout`。
- `/acp cwd <path>` 直接更新运行时 `cwd` 覆盖。
- `/acp set <key> <value>` 是通用路径。
  - 特殊情况：`key=cwd` 使用 `cwd` 覆盖路径。
- `/acp reset-options` 会清除目标会话的所有运行时覆盖。

## acpx harness、插件设置和权限

关于 acpx harness 配置（Claude Code / Codex / Gemini CLI 别名）、plugin-tools 和 OpenClaw-tools MCP 桥接，以及 ACP 权限模式，请参见
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状 | 可能原因 | 修复方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured` | 后端插件缺失或已禁用。 | 安装并启用后端插件，然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP 已被全局禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 来自普通线程消息的分发已禁用。 | 设置 `acp.dispatch.enabled=true`。 |
| `ACP agent "<id>" is not allowed by policy` | 智能体不在允许列表中。 | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。 |
| `Unable to resolve session target: ...` | key/id/label 标记错误。 | 运行 `/acp sessions`，复制准确的 key/label 后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动可绑定对话的情况下使用了 `--bind here`。 | 切换到目标聊天/频道后重试，或使用不绑定的启动。 |
| `Conversation bindings are unavailable for <channel>.` | 适配器缺少当前对话 ACP 绑定能力。 | 在支持时使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或切换到受支持的渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread` | 在线程上下文之外使用了 `--thread here`。 | 切换到目标线程，或使用 `--thread auto`/`off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 另一个用户拥有当前活动绑定目标。 | 由拥有者重新绑定，或使用其他对话或线程。 |
| `Thread bindings are unavailable for <channel>.` | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或切换到受支持的适配器/渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 运行时位于宿主侧；请求方会话处于沙箱中。 | 在沙箱会话中使用 `runtime="subagent"`，或从非沙箱会话运行 ACP 启动。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | 为 ACP 运行时请求了 `sandbox="require"`。 | 对需要强制沙箱隔离的场景使用 `runtime="subagent"`，或从非沙箱会话中配合 `sandbox="inherit"` 使用 ACP。 |
| 绑定会话缺少 ACP 元数据 | ACP 会话元数据已过期/被删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP 会话中阻止写入/执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。参见 [权限配置](#permission-configuration)。 |
| ACP 会话在很少输出的情况下提前失败 | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。 | 检查 Gateway 网关日志中的 `AcpRuntimeError`。若需完整权限，设置 `permissionMode=approve-all`；若需优雅降级，设置 `nonInteractivePermissions=deny`。 |
| ACP 会话在完成工作后无限期卡住 | harness 进程已结束，但 ACP 会话未报告完成。 | 使用 `ps aux \| grep acpx` 监控；手动终止陈旧进程。 |

## 相关内容

- [Sub-agents](/zh-CN/tools/subagents)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [智能体发送](/zh-CN/tools/agent-send)
