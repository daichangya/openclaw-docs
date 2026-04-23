---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置绑定到会话的 ACP 会话
    - 将消息渠道会话绑定到持久化 ACP 会话最新高清无码analysis to=functions.read 】【：】【“】【commentary  天天中彩票大奖=json? no need. translate.
    - 排查 ACP 后端和插件接线问题
    - 调试 ACP 完成投递或智能体到智能体循环问题
    - 在聊天中操作 /acp 命令
summary: 使用 ACP 运行时会话来接入 Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP 以及其他 harness 智能体
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-23T21:06:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f7a47390cf8cad0363f0d1f03e58a229c9fcc7ac6ad4c86392925c42383bb83
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol（ACP）](https://agentclientprotocol.com/) 会话让 OpenClaw 能够通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI，以及其他受支持的 ACPX harness）。

如果你用自然语言要求 OpenClaw “在 Codex 中运行这个”或“在线程里启动 Claude Code”，OpenClaw 应将该请求路由到 ACP 运行时（而不是原生 sub-agent 运行时）。每一次 ACP 会话启动都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

如果你希望 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有的 OpenClaw 渠道会话，请改用 [`openclaw mcp serve`](/zh-CN/cli/mcp)，而不是 ACP。

## 我该看哪一页？

这里有三个相邻但很容易混淆的界面：

| 你想要……                                                                            | 使用这个                                  | 说明                                                                                                                |
| ------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 通过 OpenClaw 运行 Codex、Claude Code、Gemini CLI 或其他外部 harness                | 本页：ACP 智能体                          | 绑定到聊天的会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制                         |
| 将一个 OpenClaw Gateway 网关会话暴露为 ACP 服务器，供编辑器或客户端使用            | [`openclaw acp`](/zh-CN/cli/acp)                | 桥接模式。IDE/客户端通过 stdio/WebSocket 对 OpenClaw 使用 ACP                                                     |
| 将本地 AI CLI 复用为纯文本回退模型                                                   | [CLI Backends](/zh-CN/gateway/cli-backends)     | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时                                                   |

## 开箱即用吗？

通常是的。全新安装默认启用了内置的 `acpx` 运行时插件，并带有插件本地固定版本的 `acpx` 二进制，OpenClaw 会在启动时探测并自修复它。运行 `/acp doctor` 可进行就绪状态检查。

首次运行常见注意事项：

- 目标 harness 适配器（Codex、Claude 等）可能会在你首次使用时按需通过 `npx` 拉取。
- 该 harness 对应的厂商身份验证仍然必须存在于宿主机上。
- 如果宿主机没有 npm 或没有网络访问能力，则首次运行的适配器拉取会失败，直到缓存预热完成或用其他方式安装适配器。

## 运维手册

在聊天中使用快速 `/acp` 流程：

1. **启动** —— `/acp spawn codex --bind here` 或 `/acp spawn codex --mode persistent --thread auto`
2. 在已绑定的会话或线程中**工作**（或显式指定 session key）。
3. **检查状态** —— `/acp status`
4. **调优** —— `/acp model <provider/model>`、`/acp permissions <profile>`、`/acp timeout <seconds>`
5. 在**不替换上下文**的情况下进行引导 —— `/acp steer tighten logging and continue`
6. **停止** —— `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）

应当路由到 ACP 运行时的自然语言触发示例：

- “把这个 Discord 频道绑定到 Codex。”
- “在这里的一个线程里启动一个持久 Codex 会话。”
- “把这个作为一次性 Claude Code ACP 会话运行，并总结结果。”
- “为这个任务使用 Gemini CLI，在线程中运行，然后把后续跟进都保留在同一线程里。”

OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，在支持时绑定到当前会话或线程，并在关闭/过期之前将后续消息持续路由到该会话。

## ACP 与子智能体

当你想使用外部 harness 运行时时，请使用 ACP。想使用 OpenClaw 原生委派运行时，请使用子智能体。

| 区域           | ACP 会话                                  | 子智能体运行                           |
| -------------- | ----------------------------------------- | -------------------------------------- |
| 运行时         | ACP 后端插件（例如 acpx）                 | OpenClaw 原生子智能体运行时            |
| 会话键         | `agent:<agentId>:acp:<uuid>`              | `agent:<agentId>:subagent:<uuid>`      |
| 主命令         | `/acp ...`                                | `/subagents ...`                       |
| 启动工具       | `sessions_spawn` 且 `runtime:"acp"`       | `sessions_spawn`（默认运行时）         |

另请参见 [子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 使用 Claude Code，其栈为：

1. OpenClaw ACP 会话控制平面
2. 内置的 `acpx` 运行时插件
3. Claude ACP 适配器
4. Claude 侧运行时/会话机制

重要区别：

- ACP Claude 是一个带有 ACP 控制、会话恢复、后台任务跟踪以及可选会话/线程绑定的 harness 会话。
- CLI backends 则是独立的纯文本本地回退运行时。参见 [CLI Backends](/zh-CN/gateway/cli-backends)。

对运维来说，实用规则是：

- 如果你想要 `/acp spawn`、可绑定会话、运行时控制或持久 harness 工作：使用 ACP
- 如果你只想通过原始 CLI 获得简单的本地文本回退：使用 CLI backends

## 绑定会话

### 当前会话绑定

`/acp spawn <harness> --bind here` 会将当前会话固定到新启动的 ACP 会话 —— 不创建子线程，保持同一聊天表面。OpenClaw 继续掌控传输、身份验证、安全与投递；该会话中的后续消息会路由到同一会话；`/new` 和 `/reset` 会原地重置该会话；`/acp close` 会移除绑定。

心智模型：

- **聊天表面** —— 人们持续交流的地方（Discord 频道、Telegram 主题、iMessage 聊天）。
- **ACP 会话** —— OpenClaw 路由到的、持久的 Codex/Claude/Gemini 运行时状态。
- **子线程/主题** —— 仅由 `--thread ...` 创建的可选附加消息表面。
- **运行时工作区** —— harness 运行所在的文件系统位置（`cwd`、仓库检出、后端工作区）。它独立于聊天表面。

示例：

- `/acp spawn codex --bind here` —— 保持当前聊天，启动或附加 Codex，并将未来消息路由到这里。
- `/acp spawn codex --thread auto` —— OpenClaw 可能创建一个子线程/主题并绑定到那里。
- `/acp spawn codex --bind here --cwd /workspace/repo` —— 仍绑定当前聊天，但 Codex 在 `/workspace/repo` 中运行。

说明：

- `--bind here` 与 `--thread ...` 互斥。
- `--bind here` 仅适用于声明支持当前会话绑定的渠道；否则 OpenClaw 会返回清晰的不支持消息。绑定在 gateway 重启后仍会保留。
- 在 Discord 上，仅当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions` —— 对于 `--bind here` 并不需要。
- 如果你启动到另一个 ACP 智能体且未指定 `--cwd`，OpenClaw 默认会继承**目标智能体**的工作区。若继承路径缺失（`ENOENT`/`ENOTDIR`），则回退到后端默认值；其他访问错误（例如 `EACCES`）会作为启动错误抛出。

### 线程绑定会话

当某个渠道适配器启用了线程绑定时，ACP 会话可以绑定到线程：

- OpenClaw 将一个线程绑定到目标 ACP 会话。
- 该线程中的后续消息会路由到已绑定的 ACP 会话。
- ACP 输出会投递回同一线程。
- 失焦/关闭/归档/空闲超时或最大时长到期会移除绑定。

线程绑定支持是适配器专属的。如果当前渠道适配器不支持线程绑定，OpenClaw 会返回清晰的不支持/不可用消息。

线程绑定 ACP 所需的特性标志：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设置为 `false` 可暂停 ACP 分发）
- 已启用渠道适配器的 ACP 线程启动标志（适配器专属）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持线程的渠道

- 任何公开会话/线程绑定能力的渠道适配器。
- 当前内置支持：
  - Discord 线程/频道
  - Telegram topics（群组/超级群组中的论坛主题，以及私信主题）
- 插件渠道也可以通过相同的绑定接口添加支持。

## 渠道专属设置

对于非临时工作流，请在顶层 `bindings[]` 条目中配置持久 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 表示一个持久 ACP 会话绑定。
- `bindings[].match` 标识目标会话：
  - Discord 频道或线程：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛主题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles 私信/群聊：`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。
  - iMessage 私信/群聊：`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，优先使用 `chat_id:*`。
- `bindings[].agentId` 是所属的 OpenClaw 智能体 id。
- 可选的 ACP 覆盖位于 `bindings[].acp` 下：
  - `mode`（`persistent` 或 `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### 每个智能体的运行时默认值

使用 `agents.list[].runtime` 为每个智能体定义一次 ACP 默认值：

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
- 该频道或主题中的消息会路由到已配置的 ACP 会话。
- 在已绑定会话中，`/new` 和 `/reset` 会原地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的）在存在时仍会生效。
- 对于跨智能体 ACP 启动，如果未显式指定 `cwd`，OpenClaw 会从智能体配置中继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 cwd；非缺失的访问失败会作为启动错误抛出。

## 启动 ACP 会话（接口）

### 从 `sessions_spawn`

使用 `runtime: "acp"` 可从智能体轮次或工具调用中启动 ACP 会话。

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

- `runtime` 默认为 `subagent`，因此对于 ACP 会话，请显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，当配置了 `acp.defaultAgent` 时，OpenClaw 会使用它。
- `mode: "session"` 需要 `thread: true`，以保持一个持久绑定的会话。

接口详情：

- `task`（必填）：发送给 ACP 会话的初始提示词。
- `runtime`（ACP 必填）：必须是 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。若已设置，则回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持时请求线程绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久）。
  - 默认值为 `run`
  - 如果 `thread: true` 且省略了 mode，OpenClaw 可按运行时路径默认采用持久行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端/运行时策略校验）。如果省略，ACP 启动会在已配置时继承目标智能体工作区；缺失的继承路径会回退到后端默认值，而真实的访问错误会直接返回。
- `label`（可选）：用于会话/banner 文本中面向运维者的标签。
- `resumeSessionId`（可选）：恢复一个现有 ACP 会话，而不是创建新会话。该智能体会通过 `session/load` 回放其会话历史。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 会将初始 ACP 运行进度摘要作为系统事件流回请求者会话。
  - 当可用时，接受的响应中还会包含 `streamLogPath`，指向某个按会话划分的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以对其执行 tail 以查看完整中继历史。
- `model`（可选）：ACP 子会话的显式模型覆盖。对 `runtime: "acp"` 生效，因此子会话会使用所请求模型，而不是静默回退到目标智能体默认值。

## 投递模型

ACP 会话既可以是交互式工作区，也可以是由父级拥有的后台工作。投递路径取决于其形态。

### 交互式 ACP 会话

交互式会话用于持续在可见聊天表面中对话：

- `/acp spawn ... --bind here` 会将当前会话绑定到 ACP 会话。
- `/acp spawn ... --thread ...` 会将某个渠道线程/主题绑定到 ACP 会话。
- 持久配置的 `bindings[].type="acp"` 会将匹配到的会话路由到同一个 ACP 会话。

已绑定会话中的后续消息会直接路由到 ACP 会话，而 ACP 输出也会投递回同一频道/线程/主题。

### 父级拥有的一次性 ACP 会话

由另一个智能体运行所启动的一次性 ACP 会话是后台子任务，类似子智能体：

- 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求执行工作。
- 子级在自己的 ACP harness 会话中运行。
- 完成状态会通过内部任务完成通知路径回传。
- 当需要面向用户回复时，父级会以正常助手口吻重写子级结果。

不要把这一路径当作父子之间的点对点聊天。子级本来就已有一个回传给父级的完成通道。

### `sessions_send` 与 A2A 投递

在启动之后，`sessions_send` 可以将消息发送到另一个会话。对于普通对等会话，OpenClaw 在注入消息后使用智能体到智能体（A2A）跟进路径：

- 等待目标会话的回复
- 可选地让请求方和目标方交换有限轮数的后续消息
- 请求目标方生成一条通知消息
- 将该通知投递到可见频道或线程

这条 A2A 路径是对等发送的回退机制，适用于发送方需要一个可见跟进的场景。当某个无关会话在例如宽泛的 `tools.sessions.visibility` 设置下可以看见并向 ACP 目标发消息时，它仍会保持启用。

仅当请求方是其**父级拥有的一次性 ACP 子任务**的父级时，OpenClaw 才会跳过 A2A 跟进。因为在这种情况下，在任务完成之上再叠加 A2A 可能会导致：父级被子级结果唤醒、将父级回复再次转发回子级，从而形成父子回声循环。对于这种拥有子任务的情况，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为完成路径本身已经负责结果传递。

### 恢复现有会话

使用 `resumeSessionId` 可继续一个先前的 ACP 会话，而不是从头开始。智能体会通过 `session/load` 回放其会话历史，因此它能够在保留完整上下文的前提下继续。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见用例：

- 将一个 Codex 会话从笔记本移交到手机 —— 告诉你的智能体接着之前的位置继续
- 继续一个你最初在 CLI 中交互式启动、现在通过智能体无头接手的编码会话
- 接着处理因 gateway 重启或空闲超时而中断的工作

说明：

- `resumeSessionId` 需要 `runtime: "acp"` —— 若与子智能体运行时一起使用，会返回错误。
- `resumeSessionId` 会恢复上游 ACP 会话历史；`thread` 和 `mode` 仍会正常作用于你当前创建的新 OpenClaw 会话，因此 `mode: "session"` 依然要求 `thread: true`。
- 目标智能体必须支持 `session/load`（Codex 和 Claude Code 都支持）。
- 如果找不到该会话 ID，则启动会以清晰错误失败 —— 不会静默回退到新会话。

<Accordion title="部署后冒烟测试">

在 gateway 部署之后，请运行一次真实端到端检查，而不是只信任单元测试：

1. 验证目标主机上的已部署 gateway 版本和 commit。
2. 打开一个临时 ACPX bridge 会话，连接到一个真实智能体。
3. 让该智能体调用 `sessions_spawn`，其中 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，任务为 `Reply with exactly LIVE-ACP-SPAWN-OK`。
4. 验证 `accepted=yes`、存在真实的 `childSessionKey`，且没有 validator 错误。
5. 清理临时 bridge 会话。

请将门控保持在 `mode: "run"`，并跳过 `streamTo: "parent"` —— 绑定线程的 `mode: "session"` 和流中继路径属于另一个更丰富的集成阶段。

</Accordion>

## 沙箱兼容性

ACP 会话当前运行在宿主运行时上，而不是 OpenClaw 沙箱内。

当前限制：

- 如果请求会话处于沙箱中，那么 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 发起的 ACP 启动都会被阻止。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- 带 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

当你需要由沙箱强制执行的运行时，请使用 `runtime: "subagent"`。

### 通过 `/acp` 命令

当需要从聊天中进行显式运维控制时，请使用 `/acp spawn`。

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

参见 [斜杠命令](/zh-CN/tools/slash-commands)。

## 会话目标解析

大多数 `/acp` 操作都接受一个可选的会话目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试 key
   - 然后尝试 UUID 形态的 session id
   - 再尝试 label
2. 当前线程绑定（如果当前会话/线程已绑定到某个 ACP 会话）
3. 当前请求方会话回退

当前会话绑定和线程绑定都参与第 2 步。

如果没有目标能解析成功，OpenClaw 会返回清晰错误（`Unable to resolve session target: ...`）。

## 启动绑定模式

`/acp spawn` 支持 `--bind here|off`。

| 模式   | 行为                                                           |
| ------ | -------------------------------------------------------------- |
| `here` | 原地绑定当前活动会话；如果当前没有活动会话则失败。            |
| `off`  | 不创建当前会话绑定。                                           |

说明：

- `--bind here` 是运维者实现“让这个频道或聊天由 Codex 驱动”的最简单路径。
- `--bind here` 不会创建子线程。
- `--bind here` 仅适用于支持当前会话绑定的渠道。
- 在同一次 `/acp spawn` 调用中，`--bind` 与 `--thread` 不能同时使用。

## 启动线程模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式   | 行为                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------- |
| `auto` | 在当前已处于线程中时：绑定该线程。在非线程场景下：若支持，则创建/绑定一个子线程。                |
| `here` | 要求当前必须处于活动线程中；否则失败。                                                            |
| `off`  | 不绑定。会话以未绑定状态启动。                                                                    |

说明：

- 在不支持线程绑定的表面上，默认行为实际上等同于 `off`。
- 线程绑定启动需要渠道策略支持：
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
- 如果你想在不创建子线程的情况下固定当前会话，请使用 `--bind here`。

## ACP 控制

| 命令                 | 作用                                                        | 示例                                                          |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP 会话；可选当前会话绑定或线程绑定。                | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目标会话中正在进行的轮次。                              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 向正在运行的会话发送引导指令。                              | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 关闭会话并解除线程目标绑定。                                | `/acp close`                                                  |
| `/acp status`        | 显示后端、模式、状态、运行时选项、能力。                    | `/acp status`                                                 |
| `/acp set-mode`      | 为目标会话设置运行时模式。                                  | `/acp set-mode plan`                                          |
| `/acp set`           | 通用运行时配置项写入。                                      | `/acp set model openai/gpt-5.5`                               |
| `/acp cwd`           | 设置运行时工作目录覆盖。                                    | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 设置审批策略配置文件。                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 设置运行时超时（秒）。                                      | `/acp timeout 120`                                            |
| `/acp model`         | 设置运行时模型覆盖。                                        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除会话运行时选项覆盖。                                    | `/acp reset-options`                                          |
| `/acp sessions`      | 从存储中列出最近的 ACP 会话。                               | `/acp sessions`                                               |
| `/acp doctor`        | 后端健康状态、能力和可执行修复。                            | `/acp doctor`                                                 |
| `/acp install`       | 打印确定性的安装和启用步骤。                                | `/acp install`                                                |

`/acp status` 会显示生效的运行时选项，以及运行时级和后端级的会话标识符。当某个后端缺少某项能力时，不支持控制错误会被清晰地呈现出来。`/acp sessions` 会为当前绑定会话或请求方会话读取存储；目标令牌（`session-key`、`session-id` 或 `session-label`）会通过 gateway 会话发现进行解析，包括按智能体自定义的 `session.store` 根目录。

## 运行时选项映射

`/acp` 既有便捷命令，也有通用 setter。

等价操作：

- `/acp model <id>` 映射到运行时配置键 `model`。
- `/acp permissions <profile>` 映射到运行时配置键 `approval_policy`。
- `/acp timeout <seconds>` 映射到运行时配置键 `timeout`。
- `/acp cwd <path>` 直接更新运行时 cwd 覆盖。
- `/acp set <key> <value>` 是通用路径。
  - 特殊情况：`key=cwd` 使用 cwd 覆盖路径。
- `/acp reset-options` 会清除目标会话的所有运行时覆盖。

## acpx harness 支持（当前）

当前 acpx 内置 harness 别名：

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI：`cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义智能体别名，否则请优先将这些值用于 `agentId`。
如果你的本地 Cursor 安装仍将 ACP 暴露为 `agent acp`，请在 acpx 配置中覆盖 `cursor` 智能体命令，而不是更改内置默认值。

直接使用 acpx CLI 也可以通过 `--agent <command>` 指向任意适配器，但这个原始逃生口属于 acpx CLI 功能（而不是普通的 OpenClaw `agentId` 路径）。

## 必需配置

核心 ACP 基线：

```json5
{
  acp: {
    enabled: true,
    // 可选。默认值为 true；设置 false 可暂停 ACP 分发，同时保留 /acp 控制。
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

线程绑定配置是渠道适配器专属的。以下是 Discord 示例：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

如果线程绑定 ACP 启动无法工作，请先验证适配器特性标志：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

当前会话绑定不需要创建子线程。它们需要一个活动的会话上下文，以及一个暴露 ACP 会话绑定能力的渠道适配器。

参见 [配置参考](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

全新安装默认启用了内置的 `acpx` 运行时插件，因此 ACP
通常无需手动安装插件即可工作。

从以下命令开始：

```text
/acp doctor
```

如果你禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者
想切换到本地开发检出，请使用显式插件路径：

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间的本地工作区安装：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然后验证后端健康状态：

```text
/acp doctor
```

### acpx 命令与版本配置

默认情况下，内置 `acpx` 插件使用其插件本地固定二进制（插件包内的 `node_modules/.bin/acpx`）。启动时会先将后端注册为 not-ready，然后后台作业会校验 `acpx --version`；如果二进制缺失或版本不匹配，它会运行 `npm install --omit=dev --no-save acpx@<pinned>` 并重新校验。整个过程中 gateway 保持非阻塞。

可在插件配置中覆盖命令或版本：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` 接受绝对路径、相对路径（相对于 OpenClaw 工作区解析）或命令名。
- `expectedVersion: "any"` 会禁用严格版本匹配。
- 自定义 `command` 路径会禁用插件本地自动安装。

参见 [插件](/zh-CN/tools/plugin)。

### 自动依赖安装

当你使用 `npm install -g openclaw` 全局安装 OpenClaw 时，acpx
运行时依赖（平台专属二进制）会通过 postinstall 钩子自动安装。如果自动安装失败，gateway 仍会正常启动，并通过 `openclaw acp doctor` 报告缺失依赖。

### 插件工具 MCP bridge

默认情况下，ACPX 会话**不会**将 OpenClaw 插件注册的工具暴露给
ACP harness。

如果你希望 Codex 或 Claude Code 之类的 ACP 智能体能够调用已安装的
OpenClaw 插件工具（例如 memory recall/store），请启用专用桥接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

其作用：

- 向 ACPX 会话引导中注入一个名为 `openclaw-plugin-tools` 的内置 MCP server。
- 暴露由已安装且已启用的 OpenClaw
  插件注册的插件工具。
- 使该功能保持显式，并且默认关闭。

安全与信任说明：

- 这会扩展 ACP harness 的工具表面。
- ACP 智能体只能访问 gateway 中已激活的插件工具。
- 应将其视作与允许这些插件在
  OpenClaw 本体中执行相同的信任边界。
- 启用前请审查已安装插件。

自定义 `mcpServers` 仍按原样工作。内置 plugin-tools bridge 是一个
额外的显式启用便利功能，而不是通用 MCP server 配置的替代品。

### OpenClaw 工具 MCP bridge

默认情况下，ACPX 会话也**不会**通过
MCP 暴露内置 OpenClaw 工具。当 ACP 智能体需要某些选定的
内置工具（例如 `cron`）时，请启用单独的核心工具桥接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

其作用：

- 向 ACPX 会话引导中注入一个名为 `openclaw-tools` 的内置 MCP server。
- 暴露选定的内置 OpenClaw 工具。初始 server 暴露的是 `cron`。
- 使核心工具暴露保持显式，并且默认关闭。

### 运行时超时配置

内置的 `acpx` 插件默认将内嵌运行时轮次设置为 120 秒
超时。这为 Gemini CLI 之类较慢的 harness 提供了足够时间来完成
ACP 启动和初始化。如果你的宿主需要不同的
运行时限制，可以覆盖它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

修改该值后请重启 gateway。

### 健康探针智能体配置

内置的 `acpx` 插件在判断内嵌运行时后端是否就绪时，会探测一个 harness 智能体。默认是 `codex`。如果你的部署使用不同的默认 ACP 智能体，请将探针智能体设置为相同 id：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

修改该值后请重启 gateway。

## 权限配置

ACP 会话以非交互方式运行 —— 没有 TTY 可以批准或拒绝文件写入和 shell 执行权限提示。acpx 插件提供了两个配置键来控制权限处理方式：

这些 ACPX harness 权限与 OpenClaw exec 审批是分离的，也与 CLI-backend 的厂商绕过标志（例如 Claude CLI `--permission-mode bypassPermissions`）分离。ACPX 的 `approve-all` 是 ACP 会话层面的紧急兼容开关。

### `permissionMode`

控制 harness 智能体在无需提示的情况下可执行哪些操作。

| 值               | 行为                                                      |
| ---------------- | --------------------------------------------------------- |
| `approve-all`    | 自动批准所有文件写入和 shell 命令。                       |
| `approve-reads`  | 仅自动批准读取；写入和 exec 仍需提示。                    |
| `deny-all`       | 拒绝所有权限提示。                                        |

### `nonInteractivePermissions`

控制当本应显示权限提示、但没有可交互 TTY 可用时（ACP 会话中始终如此）会发生什么。

| 值      | 行为                                                          |
| ------- | ------------------------------------------------------------- |
| `fail`  | 以 `AcpRuntimeError` 中止会话。**（默认）**                   |
| `deny`  | 静默拒绝该权限并继续（优雅降级）。                            |

### 配置

通过插件配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

修改这些值后请重启 gateway。

> **重要：** OpenClaw 当前默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP 会话中，任何会触发权限提示的写入或 exec 操作都可能失败，并报错 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`。
>
> 如果你需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，这样会话会优雅降级，而不是直接崩溃。

## 故障排除

| 症状                                                                          | 可能原因                                                                     | 修复方式                                                                                                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                       | 后端插件缺失或已禁用。                                                       | 安装并启用后端插件，然后运行 `/acp doctor`。                                                                                                                       |
| `ACP is disabled by policy (acp.enabled=false)`                               | ACP 被全局禁用。                                                             | 设置 `acp.enabled=true`。                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`             | 普通线程消息的分发被禁用。                                                   | 设置 `acp.dispatch.enabled=true`。                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                   | 智能体不在 allowlist 中。                                                    | 使用被允许的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                               |
| `Unable to resolve session target: ...`                                       | key/id/label 令牌错误。                                                      | 运行 `/acp sessions`，复制精确 key/label，然后重试。                                                                                                               |
| `--bind here requires running /acp spawn inside an active ... conversation`   | 在没有活动且可绑定的会话中使用了 `--bind here`。                             | 移动到目标聊天/频道中重试，或使用不绑定的启动方式。                                                                                                                |
| `Conversation bindings are unavailable for <channel>.`                        | 适配器缺少当前会话 ACP 绑定能力。                                            | 在支持时使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或切换到受支持的渠道。                                                                         |
| `--thread here requires running /acp spawn inside an active ... thread`       | 在非线程上下文中使用了 `--thread here`。                                     | 切换到目标线程，或使用 `--thread auto` / `off`。                                                                                                                   |
| `Only <user-id> can rebind this channel/conversation/thread.`                 | 当前活动绑定目标归另一个用户所有。                                           | 由所有者重新绑定，或使用其他会话或线程。                                                                                                                           |
| `Thread bindings are unavailable for <channel>.`                              | 适配器缺少线程绑定能力。                                                     | 使用 `--thread off`，或切换到受支持的适配器/渠道。                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                            | ACP 运行时位于宿主侧；请求会话处于沙箱中。                                   | 在沙箱会话中使用 `runtime="subagent"`，或从非沙箱会话发起 ACP 启动。                                                                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`       | 对 ACP 运行时请求了 `sandbox="require"`。                                    | 对需要强制沙箱的场景使用 `runtime="subagent"`，或从非沙箱会话中以 `sandbox="inherit"` 使用 ACP。                                                                   |
| 缺少绑定会话的 ACP 元数据                                                     | ACP 会话元数据已过期/已删除。                                                | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。                                                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`      | 在非交互式 ACP 会话中，`permissionMode` 阻止了写入/exec。                    | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all`，然后重启 gateway。参见[权限配置](#permission-configuration)。                                |
| ACP 会话很早失败，且输出很少                                                  | 权限提示被 `permissionMode` / `nonInteractivePermissions` 阻止。             | 检查 gateway 日志中的 `AcpRuntimeError`。若需完全权限，请设置 `permissionMode=approve-all`；若需优雅降级，请设置 `nonInteractivePermissions=deny`。               |
| ACP 会话在完成工作后无限期挂起                                                | Harness 进程已结束，但 ACP 会话没有报告完成。                                | 使用 `ps aux \| grep acpx` 监控；必要时手动杀掉陈旧进程。
