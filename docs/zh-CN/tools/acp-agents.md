---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置绑定到对话的 ACP 会话
    - 将消息渠道中的对话绑定到持久 ACP 会话
    - 排查 ACP 后端和插件接线问题
    - 调试 ACP 完成结果传递或智能体到智能体循环
    - 从聊天中操作 /acp 命令
summary: 对 Claude Code、Cursor、Gemini CLI、显式 Codex ACP 回退、OpenClaw ACP 和其他 harness 智能体使用 ACP 运行时会话
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-26T03:54:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8ea337e4d9e5a761593b228f1f33fbe10381980c57d36646ab0f50d36f4a5a
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 会话让 OpenClaw 能够通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他受支持的 ACPX harness）。

如果你用自然语言请求 OpenClaw 在当前对话中绑定或控制 Codex，并且内置的 `codex` 插件已启用，OpenClaw 应该使用原生 Codex app-server 插件（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。如果你明确请求 `/acp`、ACP、acpx，或 ACP 适配器测试，OpenClaw 仍然可以通过 ACP 路由 Codex。每次 ACP 会话启动都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

如果你用自然语言请求 OpenClaw “在线程中启动 Claude Code” 或使用其他外部 harness，OpenClaw 应该将该请求路由到 ACP 运行时（而不是原生子智能体运行时）。

如果你希望 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有的 OpenClaw 渠道对话，请使用 [`openclaw mcp serve`](/zh-CN/cli/mcp) 而不是 ACP。

ACP 不是 Codex 的默认路径。它是外部 harness 路径。原生 Codex app-server 插件负责 `/codex ...` 控制以及 `embeddedHarness.runtime: "codex"` 内嵌运行时；ACP 负责 `/acp ...` 控制和 `sessions_spawn({ runtime: "acp" })` 会话。

## 我想要哪个页面？

这里有三个相近但很容易混淆的功能界面：

| 你想要... | 使用这个 | 说明 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前对话中绑定或控制 Codex | `/codex bind`、`/codex threads` | 当 `codex` 插件启用时，使用原生 Codex app-server 路径；包括绑定聊天回复、图片转发、模型/快速/权限设置、停止和引导控制。ACP 是显式回退方案 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部 harness | 本页：ACP 智能体 | 绑定到聊天的会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制 |
| 将一个 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端 | [`openclaw acp`](/zh-CN/cli/acp) | 桥接模式。IDE/客户端通过 stdio/WebSocket 使用 ACP 与 OpenClaw 通信 |
| 复用本地 AI CLI 作为纯文本回退模型 | [CLI 后端](/zh-CN/gateway/cli-backends) | 不是 ACP。不提供 OpenClaw 工具、ACP 控制或 harness 运行时 |

## 开箱即用吗？

通常可以。全新安装默认启用内置的 `acpx` 运行时插件，并附带一个插件本地固定版本的 `acpx` 二进制文件，OpenClaw 会在启动时探测并自我修复。运行 `/acp doctor` 进行就绪检查。

只有当 ACP 确实可用时，OpenClaw 才会向智能体传授 ACP 启动相关能力：必须启用 ACP、不能禁用分发、当前会话不能被沙箱阻止，并且必须已加载运行时后端。如果这些条件不满足，ACP 插件 Skills 和 `sessions_spawn` 的 ACP 指导会保持隐藏，这样智能体就不会建议使用不可用的后端。

首次运行的常见问题：

- 如果设置了 `plugins.allow`，它就是一个限制性的插件清单，必须包含 `acpx`；否则内置默认项会被有意阻止，且 `/acp doctor` 会报告缺少 allowlist 条目。
- 目标 harness 适配器（Codex、Claude 等）在首次使用时可能会通过 `npx` 按需获取。
- 该 harness 的供应商认证仍然必须存在于主机上。
- 如果主机没有 npm 或网络访问能力，首次适配器获取会失败，直到缓存被预热或适配器通过其他方式安装。

## 支持的 harness 目标

使用内置 `acpx` 后端时，可以将以下 harness id 用作 `/acp spawn <id>` 或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目标：

| Harness id | 典型后端 | 说明 |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude` | Claude Code ACP 适配器 | 需要主机上具备 Claude Code 认证。 |
| `codex` | Codex ACP 适配器 | 仅当原生 `/codex` 不可用或明确请求 ACP 时，作为显式 ACP 回退。 |
| `copilot` | GitHub Copilot ACP 适配器 | 需要 Copilot CLI/运行时认证。 |
| `cursor` | Cursor CLI ACP（`cursor-agent acp`） | 如果本地安装暴露了不同的 ACP 入口点，请覆盖 acpx 命令。 |
| `droid` | Factory Droid CLI | 需要 Factory/Droid 认证或 harness 环境中的 `FACTORY_API_KEY`。 |
| `gemini` | Gemini CLI ACP 适配器 | 需要 Gemini CLI 认证或 API key 设置。 |
| `opencode` | OpenCode ACP 适配器 | 需要 OpenCode CLI/提供商认证。 |
| `openclaw` | 通过 `openclaw acp` 的 OpenClaw Gateway 网关桥接 | 允许支持 ACP 的 harness 回连到 OpenClaw Gateway 网关会话。 |
| `pi` | Pi / 内嵌 OpenClaw 运行时 | 用于 OpenClaw 原生 harness 实验。 |
| `iflow` | iFlow CLI | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `kilocode` | Kilo Code CLI | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `kimi` | Kimi/Moonshot CLI | 需要主机上具备 Kimi/Moonshot 认证。 |
| `kiro` | Kiro CLI | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `qwen` | Qwen Code / Qwen CLI | 需要主机上具备兼容 Qwen 的认证。 |

自定义 acpx 智能体别名可以在 acpx 本身中配置，但 OpenClaw 策略仍会在分发前检查 `acp.allowedAgents` 以及任何 `agents.list[].runtime.acp.agent` 映射。

## 运行时前提条件

ACP 会启动一个真实的外部 harness 进程。OpenClaw 负责路由、后台任务状态、交付、绑定和策略；harness 负责其提供商登录、模型目录、文件系统行为和原生工具。

在责怪 OpenClaw 之前，请先确认：

- `/acp doctor` 报告后端已启用且运行正常。
- 当设置了 allowlist 时，目标 id 已被 `acp.allowedAgents` 允许。
- harness 命令可以在 Gateway 网关主机上启动。
- 该 harness 的提供商认证已存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
- 所选模型对该 harness 可用。模型 id 不能跨 harness 通用。
- 请求的 `cwd` 存在且可访问，或者省略 `cwd` 让后端使用默认值。
- 权限模式与工作内容匹配。非交互式会话无法点击原生权限提示，因此以写入/执行为主的编码运行通常需要一个可以无头继续执行的 ACPX 权限配置。

默认情况下，OpenClaw 插件工具和内置 OpenClaw 工具不会暴露给 ACP harness。只有在 harness 应该直接调用这些工具时，才在 [ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup) 中启用显式 MCP 桥接。

## 操作手册

从聊天中使用 `/acp` 的快速流程：

1. **启动** — `/acp spawn claude --bind here`、`/acp spawn gemini --mode persistent --thread auto`，或显式使用 `/acp spawn codex --bind here`
2. 在已绑定的对话或线程中**工作**（或显式指定会话键）。
3. **检查状态** — `/acp status`
4. **调整** — `/acp model <provider/model>`、`/acp permissions <profile>`、`/acp timeout <seconds>`
5. **引导**而不替换上下文 — `/acp steer tighten logging and continue`
6. **停止** — `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）

生命周期细节：

- 启动会创建或恢复一个 ACP 运行时会话，在 OpenClaw 会话存储中记录 ACP 元数据，并且当运行由父级拥有时，可能会创建一个后台任务。
- 已绑定的后续消息会直接进入 ACP 会话，直到绑定被关闭、失焦、重置或过期。
- Gateway 网关命令保持本地执行。`/acp ...`、`/status` 和 `/unfocus` 绝不会作为普通提示文本发送给已绑定的 ACP harness。
- `cancel` 会在后端支持取消时中止当前轮次；它不会删除绑定或会话元数据。
- `close` 会从 OpenClaw 的视角结束 ACP 会话并移除绑定。如果 harness 支持恢复，它仍可能保留自己的上游历史记录。
- 空闲运行时工作进程在 `acp.runtime.ttlMinutes` 之后可能会被清理；已存储的会话元数据仍可用于 `/acp sessions`。

当原生 Codex 插件已启用时，应路由到该插件的自然语言触发方式：

- “将这个 Discord 渠道绑定到 Codex。”
- “把这个聊天附加到 Codex 线程 `<id>`。”
- “显示 Codex 线程，然后绑定这个。”

原生 Codex 对话绑定是默认的聊天控制路径。OpenClaw 动态工具仍通过 OpenClaw 执行，而 Codex 原生工具（如 shell/apply-patch）则在 Codex 内部执行。对于 Codex 原生工具事件，OpenClaw 会按轮次注入一个原生钩子中继，使插件钩子能够阻止 `before_tool_call`、观察 `after_tool_call`，并通过 OpenClaw 审批来路由 Codex `PermissionRequest` 事件。Codex `Stop` 钩子会被中继到 OpenClaw `before_agent_finalize`，在 Codex 最终生成答案之前，插件可以在这里请求再进行一次模型传递。该中继机制刻意保持保守：它不会修改 Codex 原生工具参数，也不会重写 Codex 线程记录。只有当你想要 ACP 运行时/会话模型时，才使用显式 ACP。内嵌 Codex 支持边界记录在 [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract) 中。

关于模型/提供商/运行时选择，请记住：

- `openai-codex/*` 是 PI Codex OAuth/订阅路径。
- `openai/*` 加上 `embeddedHarness.runtime: "codex"` 是原生 Codex app-server 内嵌运行时路径。
- `/codex ...` 是原生 Codex 对话控制。
- `/acp ...` 或 `runtime: "acp"` 是显式 ACP/acpx 控制。

应路由到 ACP 运行时的自然语言触发方式：

- “把这个作为一次性 Claude Code ACP 会话运行，并总结结果。”
- “对此任务使用 Gemini CLI 并在线程中运行，然后将后续内容保持在同一个线程中。”
- “通过 ACP 在后台线程中运行 Codex。”

OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，在支持时绑定到当前对话或线程，并将后续消息路由到该会话，直到关闭/过期。只有在显式请求 ACP/acpx，或者所请求操作的原生 Codex 插件不可用时，Codex 才会走这条路径。

对于 `sessions_spawn`，只有在 ACP 已启用、请求方未处于沙箱隔离状态，并且已加载 ACP 运行时后端时，才会公布 `runtime: "acp"`。它面向 ACP harness id，例如 `codex`、`claude`、`droid`、`gemini` 或 `opencode`。不要从 `agents_list` 传入普通的 OpenClaw 配置智能体 id，除非该条目已显式配置 `agents.list[].runtime.type="acp"`；否则应使用默认子智能体运行时。当某个 OpenClaw 智能体配置了 `runtime.type="acp"` 时，OpenClaw 会使用 `runtime.acp.agent` 作为底层 harness id。

## ACP 与子智能体

当你想要外部 harness 运行时时，请使用 ACP。当 `codex` 插件已启用并且你要进行 Codex 对话绑定/控制时，请使用原生 Codex app-server。当你想要 OpenClaw 原生委派运行时，请使用子智能体。

| 区域 | ACP 会话 | 子智能体运行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时 | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时 |
| 会话键 | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主要命令 | `/acp ...` | `/subagents ...` |
| 启动工具 | 带 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（默认运行时） |

另见 [子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行的 Claude Code，堆栈如下：

1. OpenClaw ACP 会话控制平面
2. 内置 `acpx` 运行时插件
3. Claude ACP 适配器
4. Claude 侧运行时/会话机制

重要区别：

- ACP Claude 是一种 harness 会话，具有 ACP 控制、会话恢复、后台任务跟踪以及可选的对话/线程绑定。
- CLI 后端是独立的纯文本本地回退运行时。参见 [CLI 后端](/zh-CN/gateway/cli-backends)。

对操作者来说，实用规则是：

- 想要 `/acp spawn`、可绑定会话、运行时控制或持久 harness 工作：使用 ACP
- 想要通过原始 CLI 获得简单的本地文本回退：使用 CLI 后端

## 绑定会话

### 绑定到当前对话

`/acp spawn <harness> --bind here` 会将当前对话固定绑定到已启动的 ACP 会话——不创建子线程，保持在同一个聊天界面。OpenClaw 继续负责传输、认证、安全和消息交付；该对话中的后续消息会路由到同一个会话；`/new` 和 `/reset` 会原地重置该会话；`/acp close` 会移除绑定。

思维模型：

- **聊天界面** — 人们持续交流的地方（Discord 渠道、Telegram 话题、iMessage 聊天）。
- **ACP 会话** — OpenClaw 路由到的持久 Codex/Claude/Gemini 运行时状态。
- **子线程/话题** — 仅由 `--thread ...` 创建的可选额外消息界面。
- **运行时工作区** — harness 运行所在的文件系统位置（`cwd`、仓库检出目录、后端工作区）。它独立于聊天界面。

示例：

- `/codex bind` — 保持当前聊天，启动或附加原生 Codex app-server，并将未来消息路由到这里。
- `/codex model gpt-5.4`、`/codex fast on`、`/codex permissions yolo` — 在聊天中调整已绑定的原生 Codex 线程。
- `/codex stop` 或 `/codex steer focus on the failing tests first` — 控制当前活跃的原生 Codex 轮次。
- `/acp spawn codex --bind here` — 用于 Codex 的显式 ACP 回退。
- `/acp spawn codex --thread auto` — OpenClaw 可能会创建子线程/话题并绑定到那里。
- `/acp spawn codex --bind here --cwd /workspace/repo` — 仍绑定当前聊天，但 Codex 在 `/workspace/repo` 中运行。

说明：

- `--bind here` 与 `--thread ...` 互斥。
- `--bind here` 仅适用于声明支持“绑定到当前对话”的渠道；否则 OpenClaw 会返回明确的不支持消息。绑定会在 Gateway 网关重启后继续保留。
- 在 Discord 上，仅当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions` —— 对于 `--bind here` 则不需要。
- 如果你启动到另一个 ACP 智能体且未指定 `--cwd`，OpenClaw 默认会继承**目标智能体的**工作区。缺失的继承路径（`ENOENT`/`ENOTDIR`）会回退到后端默认值；其他访问错误（例如 `EACCES`）会作为启动错误显示。
- Gateway 网关管理命令在已绑定对话中仍保持本地执行。特别是，即使普通后续文本会路由到已绑定的 ACP 会话，`/acp ...` 命令仍由 OpenClaw 处理；只要该界面启用了命令处理，`/status` 和 `/unfocus` 也同样保持本地执行。

### 绑定到线程的会话

当某个渠道适配器启用了线程绑定时，ACP 会话可以绑定到线程：

- OpenClaw 会将线程绑定到目标 ACP 会话。
- 该线程中的后续消息会路由到已绑定的 ACP 会话。
- ACP 输出会回传到同一个线程。
- 失焦/关闭/归档/空闲超时或最大存活时间过期都会移除该绑定。
- `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 网关命令，不是发给 ACP harness 的提示。

线程绑定支持因适配器而异。如果当前渠道适配器不支持线程绑定，OpenClaw 会返回明确的不支持/不可用消息。

线程绑定 ACP 所需的功能标志：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停 ACP 分发）
- 渠道适配器的 ACP 线程启动标志已启用（适配器特定）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持线程的渠道

- 任何暴露会话/线程绑定能力的渠道适配器。
- 当前内置支持：
  - Discord 线程/渠道
  - Telegram 话题（群组/超级群组中的 forum topics，以及私信话题）
- 插件渠道也可以通过相同的绑定接口添加支持。

## 渠道特定设置

对于非临时工作流，请在顶层 `bindings[]` 条目中配置持久 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 表示一个持久 ACP 对话绑定。
- `bindings[].match` 用于标识目标对话：
  - Discord 渠道或线程：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
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

- OpenClaw 会在使用前确保配置的 ACP 会话存在。
- 该渠道或话题中的消息会路由到已配置的 ACP 会话。
- 在已绑定对话中，`/new` 和 `/reset` 会原地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍会生效。
- 对于未显式指定 `cwd` 的跨智能体 ACP 启动，OpenClaw 会从智能体配置继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 `cwd`；非缺失型访问失败则会作为启动错误显示。

## 启动 ACP 会话（接口）

### 从 `sessions_spawn`

使用 `runtime: "acp"` 从智能体轮次或工具调用中启动 ACP 会话。

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

- `runtime` 默认为 `subagent`，因此对于 ACP 会话请显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，OpenClaw 会在已配置时使用 `acp.defaultAgent`。
- `mode: "session"` 需要 `thread: true` 才能保持持久绑定对话。

接口细节：

- `task`（必填）：发送到 ACP 会话的初始提示。
- `runtime`（ACP 必填）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。如果已设置，则回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持时请求线程绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久）。
  - 默认为 `run`
  - 如果 `thread: true` 且省略 mode，OpenClaw 可能会根据运行时路径默认使用持久行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端/运行时策略验证）。如果省略，ACP 启动会在已配置时继承目标智能体工作区；缺失的继承路径会回退到后端默认值，而真实访问错误会直接返回。
- `label`（可选）：面向操作者的标签，用于会话/横幅文本。
- `resumeSessionId`（可选）：恢复现有 ACP 会话，而不是创建新会话。智能体会通过 `session/load` 重放其对话历史。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 会将初始 ACP 运行进度摘要作为系统事件流式回传到请求方会话。
  - 在可用时，接受的响应包括 `streamLogPath`，指向一个按会话划分的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），你可以对其执行 tail 以查看完整的中继历史。
- `runTimeoutSeconds`（可选）：在 N 秒后中止 ACP 子轮次。`0` 会让该轮次走 Gateway 网关的无超时路径。相同的值会同时应用到 Gateway 网关运行和 ACP 运行时，这样卡住或配额耗尽的 harness 就不会无限期占用父智能体通道。
- `model`（可选）：ACP 子会话的显式模型覆盖。Codex ACP 启动会在 `session/new` 之前，将 OpenClaw Codex 引用（如 `openai-codex/gpt-5.4`）标准化为 Codex ACP 启动配置；带斜杠的形式（如 `openai-codex/gpt-5.4/high`）还会设置 Codex ACP 推理强度。其他 harness 必须声明 ACP `models` 并支持 `session/set_model`；否则 OpenClaw/acpx 会明确失败，而不是静默回退到目标智能体默认值。
- `thinking`（可选）：ACP 子会话的显式 thinking/推理强度。对于 Codex ACP，`minimal` 映射为低强度，`low`/`medium`/`high`/`xhigh` 直接映射，`off` 则省略推理强度启动覆盖。

## 交付模型

ACP 会话既可以是交互式工作区，也可以是父级拥有的后台工作。交付路径取决于这种形态。

### 交互式 ACP 会话

交互式会话旨在持续在可见聊天界面中进行交流：

- `/acp spawn ... --bind here` 将当前对话绑定到 ACP 会话。
- `/acp spawn ... --thread ...` 将渠道线程/话题绑定到 ACP 会话。
- 持久配置的 `bindings[].type="acp"` 会将匹配的对话路由到同一个 ACP 会话。

已绑定对话中的后续消息会直接路由到 ACP 会话，ACP 输出也会回传到同一个渠道/线程/话题。

OpenClaw 发送给 harness 的内容：

- 普通的已绑定后续消息会作为提示文本发送，外加附件，但仅限 harness/后端支持附件时。
- `/acp` 管理命令和本地 Gateway 网关命令会在 ACP 分发前被拦截。
- 运行时生成的完成事件会根据目标进行具体化。OpenClaw 智能体会收到 OpenClaw 的内部运行时上下文信封；外部 ACP harness 会收到带有子结果和指令的普通提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封绝不能发送给外部 harness，也不能作为 ACP 用户转录文本持久化。
- ACP 转录条目使用用户可见的触发文本或普通完成提示。内部事件元数据会尽可能以结构化方式保留在 OpenClaw 中，而不会被视为用户创作的聊天内容。

### 父级拥有的一次性 ACP 会话

由另一智能体运行启动的一次性 ACP 会话是后台子会话，类似于子智能体：

- 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求执行工作。
- 子级在自己的 ACP harness 会话中运行。
- 子级轮次运行在与原生子智能体启动相同的后台通道上，因此缓慢的 ACP harness 不会阻塞无关的主会话工作。
- 完成结果会通过任务完成公告路径回报。OpenClaw 会在发送给外部 harness 之前，将内部完成元数据转换为普通 ACP 提示，因此 harness 不会看到仅供 OpenClaw 使用的运行时上下文标记。
- 当需要面向用户的回复时，父级会用正常助手语气重写子级结果。

不要把这条路径当作父子之间的点对点聊天。子级已经有一条返回父级的完成通道。

### `sessions_send` 和 A2A 交付

`sessions_send` 可以在启动后将消息发送到另一个会话。对于普通对等会话，OpenClaw 会在注入消息后使用智能体到智能体（A2A）的后续路径：

- 等待目标会话的回复
- 可选地让请求方和目标交换有限数量的后续轮次
- 要求目标生成一条公告消息
- 将该公告投递到可见渠道或线程

这条 A2A 路径是对等发送的回退方案，适用于发送方需要可见后续结果的场景。当某个无关会话能够看到并向 ACP 目标发送消息时，例如在较宽松的 `tools.sessions.visibility` 设置下，它仍会保持启用。

只有当请求方是其父级拥有的一次性 ACP 子会话的父级时，OpenClaw 才会跳过 A2A 后续流程。在这种情况下，如果在任务完成之上再运行 A2A，可能会用子级结果唤醒父级，再把父级回复转发回子级，从而形成父子回声循环。对于这种所属子级场景，`sessions_send` 结果会报告 `delivery.status="skipped"`，因为完成路径已经负责处理结果。

### 恢复现有会话

使用 `resumeSessionId` 继续先前的 ACP 会话，而不是重新开始。智能体会通过 `session/load` 重放其对话历史，因此能够带着之前的完整上下文继续进行。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见用例：

- 将 Codex 会话从你的笔记本电脑移交到手机——告诉你的智能体从你上次停下的地方继续
- 继续你之前在 CLI 中以交互方式启动、现在想通过智能体无头继续的编码会话
- 继续处理因 Gateway 网关重启或空闲超时而中断的工作

说明：

- `resumeSessionId` 需要 `runtime: "acp"`——如果与子智能体运行时一起使用，会返回错误。
- `resumeSessionId` 会恢复上游 ACP 对话历史；`thread` 和 `mode` 仍会正常应用到你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍然需要 `thread: true`。
- 目标智能体必须支持 `session/load`（Codex 和 Claude Code 支持）。
- 如果找不到会话 ID，启动会以明确错误失败——不会静默回退到新会话。

<Accordion title="部署后冒烟测试">

Gateway 网关部署后，请运行一次真实的端到端检查，而不要只依赖单元测试：

1. 验证目标主机上的已部署 Gateway 网关版本和提交。
2. 打开一个连接到真实智能体的临时 ACPX 桥接会话。
3. 要求该智能体调用 `sessions_spawn`，并设置 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任务 `Reply with exactly LIVE-ACP-SPAWN-OK`。
4. 验证 `accepted=yes`、存在真实的 `childSessionKey`，并且没有验证器错误。
5. 清理临时桥接会话。

请将检查门槛保持在 `mode: "run"`，并跳过 `streamTo: "parent"`——绑定到线程的 `mode: "session"` 和流中继路径属于另外更完整的集成验证。

</Accordion>

## 沙箱兼容性

ACP 会话当前运行在主机运行时上，而不是在 OpenClaw 沙箱中。

安全边界：

- 外部 harness 可以根据其自身 CLI 权限和所选 `cwd` 进行读写。
- OpenClaw 的沙箱策略不会包裹 ACP harness 执行。
- OpenClaw 仍会强制执行 ACP 功能开关、允许的智能体、会话所有权、渠道绑定和 Gateway 网关交付策略。
- 当你需要强制沙箱执行的 OpenClaw 原生工作时，请使用 `runtime: "subagent"`。

当前限制：

- 如果请求方会话处于沙箱隔离状态，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 启动都会被阻止。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- 带 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

当你需要强制沙箱执行时，请使用 `runtime: "subagent"`。

### 从 `/acp` 命令

在需要时，使用 `/acp spawn` 从聊天中进行显式操作者控制。

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
   - 先尝试键
   - 然后尝试 UUID 形状的会话 id
   - 再尝试标签
2. 当前线程绑定（如果当前对话/线程已绑定到某个 ACP 会话）
3. 当前请求方会话回退

绑定到当前对话和绑定到线程都会参与第 2 步。

如果无法解析到目标，OpenClaw 会返回明确错误（`Unable to resolve session target: ...`）。

## 启动绑定模式

`/acp spawn` 支持 `--bind here|off`。

| 模式 | 行为 |
| ------ | ---------------------------------------------------------------------- |
| `here` | 原地绑定当前活动对话；如果当前没有活动对话则失败。 |
| `off` | 不创建当前对话绑定。 |

说明：

- `--bind here` 是“让这个渠道或聊天由 Codex 提供支持”的最简单操作者路径。
- `--bind here` 不会创建子线程。
- `--bind here` 仅适用于暴露“绑定到当前对话”支持的渠道。
- `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

## 启动线程模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式 | 行为 |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | 在线程中时：绑定该线程。在线程外时：在支持的情况下创建/绑定子线程。 |
| `here` | 要求当前处于活动线程中；否则失败。 |
| `off` | 不绑定。会话以未绑定状态启动。 |

说明：

- 在不支持线程绑定的界面上，默认行为实际上等同于 `off`。
- 绑定到线程的启动需要渠道策略支持：
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
- 当你想固定当前对话而不创建子线程时，请使用 `--bind here`。

## ACP 控制

| 命令 | 作用 | 示例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | 创建 ACP 会话；可选绑定当前对话或线程。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 取消目标会话中正在进行的轮次。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 向正在运行的会话发送引导指令。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | 关闭会话并解绑线程目标。 | `/acp close` |
| `/acp status` | 显示后端、模式、状态、运行时选项和能力。 | `/acp status` |
| `/acp set-mode` | 为目标会话设置运行时模式。 | `/acp set-mode plan` |
| `/acp set` | 通用运行时配置选项写入。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | 设置运行时工作目录覆盖。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 设置审批策略配置。 | `/acp permissions strict` |
| `/acp timeout` | 设置运行时超时（秒）。 | `/acp timeout 120` |
| `/acp model` | 设置运行时模型覆盖。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | 移除会话运行时选项覆盖。 | `/acp reset-options` |
| `/acp sessions` | 列出存储中的最近 ACP 会话。 | `/acp sessions` |
| `/acp doctor` | 后端健康状态、能力和可执行修复。 | `/acp doctor` |
| `/acp install` | 打印确定性的安装和启用步骤。 | `/acp install` |

`/acp status` 会显示生效中的运行时选项，以及运行时级别和后端级别的会话标识符。当某个后端缺少某项能力时，不支持控制的错误会被清晰地显示出来。`/acp sessions` 会读取当前已绑定会话或请求方会话对应的存储；目标令牌（`session-key`、`session-id` 或 `session-label`）会通过 Gateway 网关会话发现来解析，包括自定义的每智能体 `session.store` 根目录。

## 运行时选项映射

`/acp` 提供便捷命令和一个通用设置器。

等价操作：

- `/acp model <id>` 映射到运行时配置键 `model`。对于 Codex ACP，OpenClaw 会将 `openai-codex/<model>` 标准化为适配器模型 id，并将带斜杠的推理后缀（如 `openai-codex/gpt-5.4/high`）映射为 Codex ACP 的 `reasoning_effort`。对于其他 harness，模型控制取决于适配器是否支持 ACP `models` 和 `session/set_model`。
- `/acp set thinking <level>` 映射到运行时配置键 `thinking`。对于 Codex ACP，在适配器支持的情况下，OpenClaw 会发送对应的 `reasoning_effort`。
- `/acp permissions <profile>` 映射到运行时配置键 `approval_policy`。
- `/acp timeout <seconds>` 映射到运行时配置键 `timeout`。
- `/acp cwd <path>` 直接更新运行时 `cwd` 覆盖。
- `/acp set <key> <value>` 是通用途径。
  - 特殊情况：`key=cwd` 使用 `cwd` 覆盖路径。
- `/acp reset-options` 会清除目标会话的所有运行时覆盖项。

## acpx harness、插件设置和权限

关于 acpx harness 配置（Claude Code / Codex / Gemini CLI 别名）、plugin-tools 和 OpenClaw-tools 的 MCP 桥接，以及 ACP 权限模式，请参见 [ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状 | 可能原因 | 修复方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | 后端插件缺失、已禁用，或被 `plugins.allow` 阻止。 | 安装并启用后端插件；如果设置了 `plugins.allow` allowlist，请将 `acpx` 包含进去；然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP 被全局禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 普通线程消息的分发已禁用。 | 设置 `acp.dispatch.enabled=true`。 |
| `ACP agent "<id>" is not allowed by policy` | 智能体不在 allowlist 中。 | 使用允许的 `agentId`，或更新 `acp.allowedAgents`。 |
| `/acp doctor` 在启动后立刻报告 backend not ready | 插件依赖探测或自我修复仍在进行中。 | 稍等片刻后重新运行 `/acp doctor`；如果仍然不健康，请检查后端安装错误以及插件允许/拒绝策略。 |
| Harness command not found | 适配器 CLI 未安装，或首次运行的 `npx` 获取失败。 | 在 Gateway 网关主机上安装/预热该适配器，或显式配置 acpx 智能体命令。 |
| Model-not-found from the harness | 该模型 id 对另一个提供商/harness 有效，但对当前 ACP 目标无效。 | 使用该 harness 列出的模型、在 harness 中配置该模型，或省略该覆盖。 |
| Vendor auth error from the harness | OpenClaw 本身正常，但目标 CLI/提供商尚未登录。 | 在 Gateway 网关主机环境中登录，或提供所需的提供商 key。 |
| `Unable to resolve session target: ...` | 键/id/标签令牌错误。 | 运行 `/acp sessions`，复制准确的键/标签，然后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动可绑定对话的情况下使用了 `--bind here`。 | 移动到目标聊天/渠道后重试，或使用不绑定的启动方式。 |
| `Conversation bindings are unavailable for <channel>.` | 适配器缺少绑定当前对话的 ACP 能力。 | 在支持时使用 `/acp spawn ... --thread ...`，配置顶层 `bindings[]`，或切换到受支持渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread` | 在线程上下文之外使用了 `--thread here`。 | 移动到目标线程，或使用 `--thread auto`/`off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 另一个用户拥有当前活跃绑定目标。 | 由所有者重新绑定，或使用其他对话或线程。 |
| `Thread bindings are unavailable for <channel>.` | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或切换到受支持的适配器/渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 运行时位于主机侧；请求方会话处于沙箱隔离状态。 | 在沙箱隔离会话中使用 `runtime="subagent"`，或从非沙箱会话运行 ACP 启动。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | 为 ACP 运行时请求了 `sandbox="require"`。 | 如需强制沙箱隔离，请使用 `runtime="subagent"`；或者在非沙箱会话中将 ACP 与 `sandbox="inherit"` 一起使用。 |
| `Cannot apply --model ... did not advertise model support` | 目标 harness 未暴露通用 ACP 模型切换能力。 | 使用声明了 ACP `models`/`session/set_model` 的 harness，使用 Codex ACP 模型引用，或如果该 harness 有自己的启动标志，则直接在 harness 中配置模型。 |
| Missing ACP metadata for bound session | ACP 会话元数据已过期/被删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP 会话中阻止了写入/执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all`，然后重启 Gateway 网关。参见 [权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。 |
| ACP session fails early with little output | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。 | 检查 Gateway 网关日志中的 `AcpRuntimeError`。如需完整权限，将 `permissionMode=approve-all`；如需优雅降级，将 `nonInteractivePermissions=deny`。 |
| ACP session stalls indefinitely after completing work | harness 进程已完成，但 ACP 会话没有报告完成。 | 使用 `ps aux \| grep acpx` 监控；手动杀掉陈旧进程。 |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` | 内部事件信封泄漏到了 ACP 边界之外。 | 更新 OpenClaw 并重新运行完成流程；外部 harness 应只接收普通完成提示。 |

## 相关内容

- [子智能体](/zh-CN/tools/subagents)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [智能体发送](/zh-CN/tools/agent-send)
