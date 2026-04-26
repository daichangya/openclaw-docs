---
read_when:
    - 通过 ACP 运行编码 harness
    - 在消息渠道上设置绑定到会话的 ACP 会话
    - 将消息渠道会话绑定到持久化 ACP 会话
    - 排查 ACP 后端、插件接线或完成结果投递问题
    - 在聊天中操作 `/acp` 命令
sidebarTitle: ACP agents
summary: 通过 ACP 后端运行外部编码 harness（Claude Code、Cursor、Gemini CLI、显式 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 智能体
x-i18n:
    generated_at: "2026-04-26T07:51:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 会话
让 OpenClaw 通过 ACP 后端插件运行外部编码 harness（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
受支持的 ACPX harness）。

每个 ACP 会话启动都会被跟踪为一个[后台任务](/zh-CN/automation/tasks)。

<Note>
**ACP 是外部 harness 路径，不是默认的 Codex 路径。**
原生 Codex 应用服务器插件负责 `/codex ...` 控制，以及
`agentRuntime.id: "codex"` 内嵌运行时；ACP 负责
`/acp ...` 控制和 `sessions_spawn({ runtime: "acp" })` 会话。

如果你想让 Codex 或 Claude Code 作为外部 MCP 客户端
直接连接到现有的 OpenClaw 渠道会话，请使用
[`openclaw mcp serve`](/zh-CN/cli/mcp)，而不是 ACP。
</Note>

## 我需要哪一页？

| 你想要… | 使用这个 | 说明 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在当前会话中绑定或控制 Codex | `/codex bind`、`/codex threads` | 当启用 `codex` 插件时使用原生 Codex 应用服务器路径；包括绑定聊天回复、图像转发、模型/fast/permissions、停止和 steer 控制。ACP 是显式回退路径 |
| 通过 OpenClaw 运行 Claude Code、Gemini CLI、显式 Codex ACP 或其他外部 harness | 本页 | 绑定聊天的会话、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制 |
| 将一个 OpenClaw Gateway 网关会话作为 ACP 服务器暴露给编辑器或客户端 | [`openclaw acp`](/zh-CN/cli/acp) | 桥接模式。IDE/客户端 通过 stdio/WebSocket 使用 ACP 与 OpenClaw 通信 |
| 复用本地 AI CLI 作为纯文本回退模型 | [CLI Backends](/zh-CN/gateway/cli-backends) | 不是 ACP。没有 OpenClaw 工具、没有 ACP 控制、没有 harness 运行时 |

## 开箱即用吗？

通常可以。全新安装默认启用了内置的 `acpx` 运行时插件，
并带有插件本地固定版本的 `acpx` 二进制，OpenClaw 会在启动时探测它
并执行自修复。运行 `/acp doctor` 可进行就绪检查。

只有当 ACP **真正可用** 时，OpenClaw 才会向智能体介绍 ACP 启动功能：
ACP 必须已启用、分发不能被禁用、当前会话不能被沙箱阻止，并且必须已加载
一个运行时后端。如果这些条件不满足，ACP 插件 Skills 和
`sessions_spawn` 的 ACP 指南会保持隐藏，这样智能体就不会建议
一个不可用的后端。

<AccordionGroup>
  <Accordion title="首次运行注意事项">
    - 如果设置了 `plugins.allow`，它就是一个限制性的插件清单，并且**必须**包含 `acpx`；否则内置默认值会被有意阻止，`/acp doctor` 会报告缺少允许列表条目。
    - 目标 harness 适配器（Codex、Claude 等）可能会在你首次使用时通过 `npx` 按需拉取。
    - 该 harness 的供应商认证仍然必须存在于主机上。
    - 如果主机没有 npm 或网络访问能力，首次运行的适配器拉取会失败，直到缓存被预热或适配器以其他方式安装为止。
  </Accordion>
  <Accordion title="运行时前提条件">
    ACP 会启动一个真实的外部 harness 进程。OpenClaw 负责路由、
    后台任务状态、投递、绑定和策略；harness
    负责其 provider 登录、模型目录、文件系统行为以及
    原生工具。

    在责怪 OpenClaw 之前，请先确认：

    - `/acp doctor` 报告后端已启用且健康。
    - 当设置了 `acp.allowedAgents` 允许列表时，目标 id 在允许范围内。
    - harness 命令可以在 Gateway 网关主机上启动。
    - 该 harness 所需的 provider 认证已存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所选模型确实存在于该 harness 中——模型 id 在不同 harness 之间并不通用。
    - 请求的 `cwd` 存在且可访问，或者省略 `cwd` 让后端使用其默认值。
    - 权限模式与工作类型匹配。非交互会话无法点击原生权限提示，因此大量写入/exec 的编码运行通常需要一个可以无头继续执行的 ACPX 权限配置文件。

  </Accordion>
</AccordionGroup>

默认情况下，OpenClaw 插件工具和内置 OpenClaw 工具**不会**
暴露给 ACP harness。只有在 harness
确实应直接调用这些工具时，才在
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup) 中启用显式 MCP 桥接。

## 支持的 harness 目标

使用内置 `acpx` 后端时，可将这些 harness id 用作 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 的目标：

| Harness id | 典型后端 | 说明 |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 适配器 | 需要主机上已有 Claude Code 认证。 |
| `codex`    | Codex ACP 适配器 | 仅在原生 `/codex` 不可用或明确要求 ACP 时，作为显式 ACP 回退。 |
| `copilot`  | GitHub Copilot ACP 适配器 | 需要 Copilot CLI/运行时认证。 |
| `cursor`   | Cursor CLI ACP（`cursor-agent acp`） | 如果本地安装暴露的是不同的 ACP 入口点，请覆盖 acpx 命令。 |
| `droid`    | Factory Droid CLI | 需要 Factory/Droid 认证，或在 harness 环境中设置 `FACTORY_API_KEY`。 |
| `gemini`   | Gemini CLI ACP 适配器 | 需要 Gemini CLI 认证或 API 密钥设置。 |
| `iflow`    | iFlow CLI | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `kilocode` | Kilo Code CLI | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `kimi`     | Kimi/Moonshot CLI | 需要主机上已有 Kimi/Moonshot 认证。 |
| `kiro`     | Kiro CLI | 适配器可用性和模型控制取决于已安装的 CLI。 |
| `opencode` | OpenCode ACP 适配器 | 需要 OpenCode CLI/provider 认证。 |
| `openclaw` | 通过 `openclaw acp` 实现的 OpenClaw Gateway 网关桥接 | 允许一个支持 ACP 的 harness 反向连接到一个 OpenClaw Gateway 网关会话。 |
| `pi`       | Pi/内嵌 OpenClaw 运行时 | 用于 OpenClaw 原生 harness 实验。 |
| `qwen`     | Qwen Code / Qwen CLI | 需要主机上兼容 Qwen 的认证。 |

可以在 acpx 自身中配置自定义 acpx 智能体别名，但 OpenClaw
策略仍然会检查 `acp.allowedAgents`，以及
任何 `agents.list[].runtime.acp.agent` 映射，然后才进行分发。

## 操作手册

在聊天中使用 `/acp` 的快速流程：

<Steps>
  <Step title="启动">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或显式使用
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在已绑定的会话或线程中继续（或者显式指定会话
    键）。
  </Step>
  <Step title="检查状态">
    `/acp status`
  </Step>
  <Step title="调整">
    `/acp model <provider/model>`、
    `/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="引导">
    在不替换上下文的情况下：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（当前轮次）或 `/acp close`（会话 + 绑定）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命周期细节">
    - 启动会创建或恢复一个 ACP 运行时会话，在 OpenClaw 会话存储中记录 ACP 元数据，并且在该运行由父级拥有时可能会创建一个后台任务。
    - 绑定后的后续消息会直接发送到 ACP 会话，直到绑定被关闭、取消聚焦、重置或过期。
    - Gateway 网关命令会保留在本地。`/acp ...`、`/status` 和 `/unfocus` 永远不会作为普通提示文本发送给已绑定的 ACP harness。
    - `cancel` 会在后端支持取消时中止当前轮次；它不会删除绑定或会话元数据。
    - `close` 会从 OpenClaw 的视角结束 ACP 会话并移除绑定。如果 harness 支持恢复，它仍可能保留自己的上游历史。
    - 空闲运行时工作进程会在 `acp.runtime.ttlMinutes` 之后进入可清理状态；已存储的会话元数据仍可通过 `/acp sessions` 查看。
  </Accordion>
  <Accordion title="原生 Codex 路由规则">
    当原生 Codex
    插件已启用时，应路由到**原生 Codex 插件**的自然语言触发词：

    - “把这个 Discord 频道绑定到 Codex。”
    - “把这个聊天附加到 Codex 线程 `<id>`。”
    - “显示 Codex 线程，然后绑定这个。”

    原生 Codex 会话绑定是默认的聊天控制路径。
    OpenClaw 动态工具仍通过 OpenClaw 执行，而
    Codex 原生工具（如 shell/apply-patch）则在 Codex 内执行。
    对于 Codex 原生工具事件，OpenClaw 会按轮次注入一个原生
    hook 中继，使插件钩子能够阻止 `before_tool_call`、观察
    `after_tool_call`，并将 Codex `PermissionRequest` 事件
    通过 OpenClaw 审批进行路由。Codex `Stop` 钩子会被中继到
    OpenClaw `before_agent_finalize`，插件可在其中请求模型在 Codex 最终输出答案前
    再进行一次传递。该中继保持刻意保守：
    它不会修改 Codex 原生工具参数，也不会重写 Codex 线程记录。只有当你想使用 ACP 运行时/会话模型时，
    才应使用显式 ACP。内嵌 Codex
    支持边界记录于
    [Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / provider / 运行时选择速查表">
    - `openai-codex/*` — PI Codex OAuth/订阅路径。
    - `openai/*` 加 `agentRuntime.id: "codex"` — 原生 Codex 应用服务器内嵌运行时。
    - `/codex ...` — 原生 Codex 会话控制。
    - `/acp ...` 或 `runtime: "acp"` — 显式 ACP/acpx 控制。
  </Accordion>
  <Accordion title="ACP 路由的自然语言触发词">
    应路由到 ACP 运行时的触发词：

    - “把这个任务作为一次性 Claude Code ACP 会话运行，并总结结果。”
    - “对此任务使用 Gemini CLI 在线程中运行，然后将后续内容继续保留在同一个线程中。”
    - “通过 ACP 在线程后台运行 Codex。”

    OpenClaw 会选择 `runtime: "acp"`，解析 harness `agentId`，
    在支持时绑定到当前会话或线程，并且
    将后续消息路由到该会话，直到关闭/过期。只有在显式要求 ACP/acpx
    或原生 Codex 插件对所请求操作不可用时，Codex 才会走这条路径。

    对于 `sessions_spawn`，只有在 ACP
    已启用、请求方未被沙箱隔离，且 ACP 运行时
    后端已加载时，才会公布 `runtime: "acp"`。
    它面向 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode` 这类 ACP harness id。不要传入来自
    `agents_list` 的普通 OpenClaw 配置智能体 id，除非该条目
    明确配置了 `agents.list[].runtime.type="acp"`；
    否则请使用默认的子智能体运行时。当某个 OpenClaw 智能体
    配置了 `runtime.type="acp"` 时，OpenClaw 会使用
    `runtime.acp.agent` 作为底层 harness id。

  </Accordion>
</AccordionGroup>

## ACP 与子智能体的区别

当你需要外部 harness 运行时时，请使用 ACP。当 `codex`
插件已启用，并且你需要 Codex 会话绑定/控制时，请使用**原生 Codex
应用服务器**。当你需要 OpenClaw 原生的
委派运行时，请使用**子智能体**。

| 区域 | ACP 会话 | 子智能体运行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时 | ACP 后端插件（例如 acpx） | OpenClaw 原生子智能体运行时 |
| 会话键 | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主命令 | `/acp ...` | `/subagents ...` |
| 启动工具 | `sessions_spawn` 配合 `runtime:"acp"` | `sessions_spawn`（默认运行时） |

另请参见 [子智能体](/zh-CN/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 运行 Claude Code，其栈如下：

1. OpenClaw ACP 会话控制平面。
2. 内置 `acpx` 运行时插件。
3. Claude ACP 适配器。
4. Claude 侧运行时/会话机制。

ACP Claude 是一个**harness 会话**，具备 ACP 控制、会话恢复、
后台任务跟踪，以及可选的会话/线程绑定。

CLI 后端则是独立的纯文本本地回退运行时——参见
[CLI Backends](/zh-CN/gateway/cli-backends)。

对于操作员来说，实际规则是：

- **想要 `/acp spawn`、可绑定会话、运行时控制，或持久化 harness 工作？** 用 ACP。
- **想要通过原始 CLI 实现简单的本地文本回退？** 用 CLI 后端。

## 绑定会话

### 心智模型

- **聊天界面**——人们持续交流的地方（Discord 频道、Telegram 话题、iMessage 聊天）。
- **ACP 会话**——OpenClaw 路由到的持久化 Codex/Claude/Gemini 运行时状态。
- **子线程/话题**——仅在使用 `--thread ...` 时创建的可选额外消息界面。
- **运行时工作区**——harness 运行所在的文件系统位置（`cwd`、仓库检出、后端工作区）。它独立于聊天界面。

### 当前会话绑定

`/acp spawn <harness> --bind here` 会将当前会话固定绑定到
已启动的 ACP 会话——不创建子线程，使用同一个聊天界面。OpenClaw 继续
负责传输、认证、安全性和投递。该会话中的后续消息会路由到同一个
会话；`/new` 和 `/reset` 会原地重置该
会话；`/acp close` 会移除绑定。

示例：

```text
/codex bind                                              # 原生 Codex 绑定，后续消息路由到这里
/codex model gpt-5.4                                     # 调整已绑定的原生 Codex 线程
/codex stop                                              # 控制当前活动的原生 Codex 轮次
/acp spawn codex --bind here                             # 针对 Codex 的显式 ACP 回退
/acp spawn codex --thread auto                           # 可能会创建一个子线程/话题并绑定到那里
/acp spawn codex --bind here --cwd /workspace/repo       # 相同聊天绑定，Codex 在 /workspace/repo 中运行
```

<AccordionGroup>
  <Accordion title="绑定规则与排他性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 仅适用于声明支持当前会话绑定的渠道；否则 OpenClaw 会返回明确的不支持消息。绑定会在 Gateway 网关重启后继续保留。
    - 在 Discord 上，只有当 OpenClaw 需要为 `--thread auto|here` 创建子线程时，才需要 `spawnAcpSessions`——对于 `--bind here` 则不需要。
    - 如果你在未指定 `--cwd` 的情况下启动到另一个 ACP 智能体，OpenClaw 默认会继承**目标智能体的**工作区。缺失的继承路径（`ENOENT`/`ENOTDIR`）会回退到后端默认值；其他访问错误（例如 `EACCES`）会作为启动错误直接显示。
    - Gateway 网关管理命令会保留在绑定会话本地——即使普通后续文本会被路由到已绑定的 ACP 会话，`/acp ...` 命令仍由 OpenClaw 处理；只要该界面启用了命令处理，`/status` 和 `/unfocus` 也始终保留在本地。
  </Accordion>
  <Accordion title="线程绑定会话">
    当某个渠道适配器启用了线程绑定时：

    - OpenClaw 会将一个线程绑定到目标 ACP 会话。
    - 该线程中的后续消息会路由到已绑定的 ACP 会话。
    - ACP 输出会投递回同一个线程。
    - 取消聚焦/关闭/归档/空闲超时或最大存活期到期都会移除绑定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 网关命令，不是发给 ACP harness 的提示。

    线程绑定 ACP 所需的功能标志：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停 ACP 分发）。
    - 渠道适配器 ACP 线程启动标志已启用（依适配器而定）：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

    线程绑定支持因适配器而异。如果当前渠道
    适配器不支持线程绑定，OpenClaw 会返回明确的
    不支持/不可用消息。

  </Accordion>
  <Accordion title="支持线程的渠道">
    - 任何暴露会话/线程绑定能力的渠道适配器。
    - 当前内置支持：**Discord** 线程/频道、**Telegram** 话题（群组/超级群组中的论坛话题以及私信话题）。
    - 插件渠道也可以通过相同的绑定接口添加支持。
  </Accordion>
</AccordionGroup>

## 持久化渠道绑定

对于非临时工作流，请在
顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

<ParamField path="bindings[].type" type='"acp"'>
  标记一个持久化 ACP 会话绑定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  标识目标会话。各渠道的结构如下：

- **Discord 频道/线程：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 论坛话题：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles 私信/群组：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage 私信/群组：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。对于稳定的群组绑定，优先使用 `chat_id:*`。
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  所属的 OpenClaw 智能体 id。
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可选的 ACP 覆盖值。
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  可选的面向操作员标签。
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  可选的运行时工作目录。
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  可选的后端覆盖值。
  </ParamField>

### 每个智能体的运行时默认值

使用 `agents.list[].runtime` 为每个智能体一次性定义 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 绑定会话的覆盖优先级：**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 全局 ACP 默认值（例如 `acp.backend`）

### 示例

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

### 行为

- OpenClaw 会在使用前确保已配置的 ACP 会话存在。
- 该频道或话题中的消息会被路由到已配置的 ACP 会话。
- 在已绑定的会话中，`/new` 和 `/reset` 会原地重置同一个 ACP 会话键。
- 临时运行时绑定（例如由线程聚焦流程创建的绑定）在存在时仍然会生效。
- 对于跨智能体 ACP 启动，如果未显式指定 `cwd`，OpenClaw 会从智能体配置中继承目标智能体工作区。
- 缺失的继承工作区路径会回退到后端默认 `cwd`；非缺失型访问失败会作为启动错误直接显示。

## 启动 ACP 会话

启动 ACP 会话有两种方式：

<Tabs>
  <Tab title="来自 sessions_spawn">
    使用 `runtime: "acp"` 从智能体轮次或
    工具调用中启动一个 ACP 会话。

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` 默认为 `subagent`，因此对于 ACP 会话需要显式设置 `runtime: "acp"`。
    如果省略 `agentId`，OpenClaw 会在已配置时使用
    `acp.defaultAgent`。`mode: "session"` 需要
    `thread: true` 才能保持一个持久化的绑定会话。
    </Note>

  </Tab>
  <Tab title="来自 /acp 命令">
    使用 `/acp spawn` 从聊天中进行显式的操作员控制。

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

    参见 [Slash commands](/zh-CN/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 参数

<ParamField path="task" type="string" required>
  发送到 ACP 会话的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  对于 ACP 会话，必须为 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目标 harness id。如果已设置，则会回退到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支持时请求线程绑定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久化。如果 `thread: true` 且
  省略了 `mode`，OpenClaw 可能会根据
  运行时路径默认采用持久化行为。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  请求的运行时工作目录（由后端/运行时
  策略验证）。如果省略，ACP 启动会在已配置时继承目标智能体工作区；
  缺失的继承路径会回退到后端
  默认值，而真实访问错误会直接返回。
</ParamField>
<ParamField path="label" type="string">
  在会话/横幅文本中使用的面向操作员标签。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢复现有 ACP 会话，而不是创建一个新会话。
  智能体会通过 `session/load` 重放其会话历史。
  需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 会将初始 ACP 运行的进度摘要以系统事件形式流式返回到
  请求方会话。接受的响应中可能包含
  指向会话范围 JSONL 日志
  （`<sessionId>.acp-stream.jsonl`）的 `streamLogPath`，你可以跟踪它以查看完整中继历史。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  在 N 秒后中止 ACP 子轮次。`0` 会让该轮次走
  Gateway 网关的无超时路径。相同的值会同时应用到 Gateway 网关
  运行和 ACP 运行时，这样卡住/配额耗尽的 harness 就不会
  无限期占用父智能体通道。
</ParamField>
<ParamField path="model" type="string">
  对 ACP 子会话的显式模型覆盖。Codex ACP 启动会在
  `session/new` 之前，将 OpenClaw Codex 引用（例如 `openai-codex/gpt-5.4`）标准化为 Codex
  ACP 启动配置；使用斜杠形式（例如
  `openai-codex/gpt-5.4/high`）还会设置 Codex ACP 的推理强度。
  其他 harness 必须声明 ACP `models` 并支持
  `session/set_model`；否则 OpenClaw/acpx 会明确失败，而不是
  静默回退到目标智能体默认值。
</ParamField>
<ParamField path="thinking" type="string">
  显式的 thinking/推理强度。对于 Codex ACP，`minimal` 映射为
  低强度，`low`/`medium`/`high`/`xhigh` 直接映射，而 `off`
  则省略推理强度启动覆盖。
</ParamField>

## 启动绑定与线程模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式 | 行为 |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 原地绑定当前活动会话；如果当前没有活动会话则失败。 |
    | `off`  | 不创建当前会话绑定。 |

    说明：

    - `--bind here` 是“让这个频道或聊天由 Codex 支持”的最简单操作员路径。
    - `--bind here` 不会创建子线程。
    - `--bind here` 仅在暴露当前会话绑定支持的渠道上可用。
    - `--bind` 和 `--thread` 不能在同一次 `/acp spawn` 调用中同时使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式 | 行为 |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在活动线程中：绑定该线程。在线程外：在支持时创建/绑定一个子线程。 |
    | `here` | 要求当前处于活动线程中；如果不在线程中则失败。 |
    | `off`  | 不绑定。会话以未绑定状态启动。 |

    说明：

    - 在不支持线程绑定的界面上，默认行为实际上等同于 `off`。
    - 线程绑定启动需要渠道策略支持：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
    - 如果你想固定当前会话而不创建子线程，请使用 `--bind here`。

  </Tab>
</Tabs>

## 投递模型

ACP 会话既可以是交互式工作区，也可以是由父级拥有的
后台工作。投递路径取决于其形态。

<AccordionGroup>
  <Accordion title="交互式 ACP 会话">
    交互式会话的设计目标是在一个可见的聊天
    界面中持续对话：

    - `/acp spawn ... --bind here` 会将当前会话绑定到 ACP 会话。
    - `/acp spawn ... --thread ...` 会将某个渠道线程/话题绑定到 ACP 会话。
    - 持久化配置的 `bindings[].type="acp"` 会将匹配的会话路由到同一个 ACP 会话。

    在已绑定会话中的后续消息会直接路由到
    ACP 会话，而 ACP 输出会被投递回同一个
    频道/线程/话题。

    OpenClaw 发送给 harness 的内容：

    - 普通的绑定后续消息会作为提示文本发送，外加附件——但仅在 harness/后端支持它们时才会附带。
    - `/acp` 管理命令和本地 Gateway 网关命令会在 ACP 分发之前被拦截。
    - 运行时生成的完成事件会按目标具体化。OpenClaw 智能体会收到 OpenClaw 的内部 runtime-context 信封；外部 ACP harness 会收到一个普通提示，其中包含子结果和指令。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封绝不应发送给外部 harness，也不应作为 ACP 用户转录文本持久化。
    - ACP 转录条目使用用户可见的触发文本或普通完成提示。在可能的情况下，内部事件元数据会在 OpenClaw 中保持结构化，不会被视为用户撰写的聊天内容。

  </Accordion>
  <Accordion title="父级拥有的一次性 ACP 会话">
    由另一个智能体运行所启动的一次性 ACP 会话是后台
    子级，类似于子智能体：

    - 父级通过 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
    - 子级在它自己的 ACP harness 会话中运行。
    - 子级轮次运行在与原生子智能体启动相同的后台通道上，因此缓慢的 ACP harness 不会阻塞无关的主会话工作。
    - 完成会通过任务完成通知路径回传。OpenClaw 会在发送给外部 harness 之前，将内部完成元数据转换为普通 ACP 提示，因此 harness 不会看到 OpenClaw 专用的运行时上下文标记。
    - 当需要面向用户的回复时，父级会用正常助手口吻重写子级结果。

    **不要**将此路径视为父级
    与子级之间的点对点聊天。子级已经拥有一条回传给
    父级的完成通道。

  </Accordion>
  <Accordion title="sessions_send 与 A2A 投递">
    `sessions_send` 可以在启动之后以另一个会话为目标。对于普通
    对等会话，OpenClaw 会在注入消息后使用一条智能体到智能体（A2A）跟进路径：

    - 等待目标会话的回复。
    - 可选地让请求方和目标交换有限数量的后续轮次。
    - 要求目标生成一条通知消息。
    - 将该通知投递到可见频道或线程。

    对于发送方需要一个
    可见跟进的对等发送场景，这条 A2A 路径是一种回退方案。当一个无关会话能够
    看到并向 ACP 目标发送消息时，它仍然会保持启用，例如在宽泛的
    `tools.sessions.visibility` 设置下。

    只有当请求方是其自身父级拥有的一次性 ACP 子级的
    父级时，OpenClaw 才会跳过 A2A 跟进。在这种情况下，
    在任务完成之上再运行 A2A 可能会用
    子级结果唤醒父级，再把父级回复转发回子级，从而
    形成父子回声循环。对于这种已拥有子级的情况，`sessions_send` 结果会报告
    `delivery.status="skipped"`，
    因为完成路径已经负责处理该结果。

  </Accordion>
  <Accordion title="恢复现有会话">
    使用 `resumeSessionId` 继续一个先前的 ACP 会话，而不是
    重新开始。智能体会通过
    `session/load` 重放其会话历史，因此它可以带着此前的完整上下文继续。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常见使用场景：

    - 将一个 Codex 会话从你的笔记本交接到手机——告诉你的智能体从你停下的地方继续。
    - 继续你之前在 CLI 中以交互方式开始、现在要通过智能体无头继续的编码会话。
    - 接续因 Gateway 网关重启或空闲超时而中断的工作。

    说明：

    - `resumeSessionId` 需要 `runtime: "acp"`——如果与子智能体运行时一起使用会返回错误。
    - `resumeSessionId` 会恢复上游 ACP 会话历史；`thread` 和 `mode` 仍会正常应用到你正在创建的新 OpenClaw 会话，因此 `mode: "session"` 仍然要求 `thread: true`。
    - 目标智能体必须支持 `session/load`（Codex 和 Claude Code 支持）。
    - 如果找不到该会话 id，启动会以明确错误失败——不会静默回退到新会话。

  </Accordion>
  <Accordion title="部署后冒烟测试">
    在 Gateway 网关部署之后，请运行一次实时端到端检查，而不要
    只依赖单元测试：

    1. 在目标主机上验证已部署的 Gateway 网关版本和提交。
    2. 打开一个指向实时智能体的临时 ACPX 桥接会话。
    3. 要求该智能体调用 `sessions_spawn`，参数为 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，任务内容为 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 验证 `accepted=yes`、存在真实的 `childSessionKey`，且没有验证器错误。
    5. 清理该临时桥接会话。

    请将关卡保持在 `mode: "run"`，并跳过 `streamTo: "parent"`——
    线程绑定的 `mode: "session"` 和流式中继路径属于另外的、
    更丰富的集成验证阶段。

  </Accordion>
</AccordionGroup>

## 沙箱兼容性

ACP 会话目前运行在主机运行时上，**不在**
OpenClaw 沙箱内部。

<Warning>
**安全边界：**

- 外部 harness 可以根据其自身 CLI 权限和所选 `cwd` 进行读写。
- OpenClaw 的沙箱策略**不会**包裹 ACP harness 执行。
- OpenClaw 仍会强制执行 ACP 功能门控、允许的智能体、会话所有权、渠道绑定和 Gateway 网关投递策略。
- 对于需要强制沙箱隔离的 OpenClaw 原生工作，请使用 `runtime: "subagent"`。
  </Warning>

当前限制：

- 如果请求方会话已被沙箱隔离，则 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 启动都会被阻止。
- `sessions_spawn` 配合 `runtime: "acp"` 不支持 `sandbox: "require"`。

## 会话目标解析

大多数 `/acp` 操作都接受一个可选的会话目标（`session-key`、
`session-id` 或 `session-label`）。

**解析顺序：**

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试 key
   - 然后尝试 UUID 形态的 session id
   - 再尝试 label
2. 当前线程绑定（如果当前会话/线程已绑定到某个 ACP 会话）。
3. 当前请求方会话回退值。

当前会话绑定和线程绑定都会参与
第 2 步。

如果无法解析出目标，OpenClaw 会返回明确错误
（`Unable to resolve session target: ...`）。

## ACP 控制

| 命令 | 作用 | 示例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP 会话；可选当前绑定或线程绑定。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目标会话中正在进行的轮次。 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 向正在运行的会话发送引导指令。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 关闭会话并解除线程目标绑定。 | `/acp close`                                                  |
| `/acp status`        | 显示后端、模式、状态、运行时选项、能力。 | `/acp status`                                                 |
| `/acp set-mode`      | 为目标会话设置运行时模式。 | `/acp set-mode plan`                                          |
| `/acp set`           | 通用运行时配置选项写入。 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 设置运行时工作目录覆盖值。 | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 设置审批策略配置文件。 | `/acp permissions strict`                                     |
| `/acp timeout`       | 设置运行时超时（秒）。 | `/acp timeout 120`                                            |
| `/acp model`         | 设置运行时模型覆盖值。 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除会话运行时选项覆盖值。 | `/acp reset-options`                                          |
| `/acp sessions`      | 从存储中列出最近的 ACP 会话。 | `/acp sessions`                                               |
| `/acp doctor`        | 后端健康状态、能力、可执行修复。 | `/acp doctor`                                                 |
| `/acp install`       | 打印确定性的安装和启用步骤。 | `/acp install`                                                |

`/acp status` 会显示生效中的运行时选项，以及运行时级别和
后端级别的会话标识符。当某个后端缺少某项能力时，不支持控制错误会被
明确显示。`/acp sessions` 会读取当前绑定或请求方会话的
存储；目标令牌
（`session-key`、`session-id` 或 `session-label`）会通过
Gateway 网关会话发现进行解析，其中包括自定义的按智能体划分的 `session.store`
根目录。

### 运行时选项映射

`/acp` 提供便捷命令和一个通用设置器。等价
操作如下：

| 命令 | 映射到 | 说明 |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | 运行时配置键 `model` | 对于 Codex ACP，OpenClaw 会将 `openai-codex/<model>` 标准化为适配器模型 id，并将斜杠推理后缀（例如 `openai-codex/gpt-5.4/high`）映射为 `reasoning_effort`。 |
| `/acp set thinking <level>`  | 运行时配置键 `thinking` | 对于 Codex ACP，在适配器支持时，OpenClaw 会发送相应的 `reasoning_effort`。 |
| `/acp permissions <profile>` | 运行时配置键 `approval_policy` | — |
| `/acp timeout <seconds>`     | 运行时配置键 `timeout` | — |
| `/acp cwd <path>`            | 运行时 `cwd` 覆盖值 | 直接更新。 |
| `/acp set <key> <value>`     | 通用 | `key=cwd` 使用 `cwd` 覆盖路径。 |
| `/acp reset-options`         | 清除所有运行时覆盖值 | — |

## acpx harness、插件设置和权限

有关 acpx harness 配置（Claude Code / Codex / Gemini CLI
别名）、插件工具和 OpenClaw 工具的 MCP 桥接，以及 ACP
权限模式，请参见
[ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)。

## 故障排除

| 症状 | 可能原因 | 修复方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | 后端插件缺失、被禁用，或被 `plugins.allow` 阻止。 | 安装并启用后端插件；如果设置了 `plugins.allow` 允许列表，请将 `acpx` 包含进去，然后运行 `/acp doctor`。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP 在全局范围内被禁用。 | 设置 `acp.enabled=true`。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 来自普通线程消息的分发已被禁用。 | 设置 `acp.dispatch.enabled=true`。 |
| `ACP agent "<id>" is not allowed by policy` | 智能体不在允许列表中。 | 使用被允许的 `agentId`，或更新 `acp.allowedAgents`。 |
| `/acp doctor` 在启动后立刻报告后端未就绪 | 插件依赖探测或自修复仍在运行。 | 稍等片刻后重新运行 `/acp doctor`；如果仍不健康，请检查后端安装错误以及插件允许/拒绝策略。 |
| 找不到 harness 命令 | 适配器 CLI 未安装，或首次运行的 `npx` 拉取失败。 | 在 Gateway 网关主机上安装/预热适配器，或显式配置 acpx 智能体命令。 |
| harness 返回找不到模型 | 该模型 id 对另一个 provider/harness 有效，但不适用于当前 ACP 目标。 | 使用该 harness 列出的模型、在 harness 中配置该模型，或省略该覆盖值。 |
| harness 返回供应商认证错误 | OpenClaw 本身正常，但目标 CLI/provider 未登录。 | 在 Gateway 网关主机环境中登录或提供所需的 provider 密钥。 |
| `Unable to resolve session target: ...` | key/id/label 令牌错误。 | 运行 `/acp sessions`，复制准确的 key/label 后重试。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在没有活动且可绑定会话的情况下使用了 `--bind here`。 | 移动到目标聊天/频道后重试，或使用不绑定的启动方式。 |
| `Conversation bindings are unavailable for <channel>.` | 适配器缺少当前会话 ACP 绑定能力。 | 在支持时使用 `/acp spawn ... --thread ...`、配置顶层 `bindings[]`，或切换到受支持的渠道。 |
| `--thread here requires running /acp spawn inside an active ... thread` | 在线程上下文之外使用了 `--thread here`。 | 移动到目标线程，或使用 `--thread auto`/`off`。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 当前绑定目标归另一位用户所有。 | 由所有者重新绑定，或使用不同的会话或线程。 |
| `Thread bindings are unavailable for <channel>.` | 适配器缺少线程绑定能力。 | 使用 `--thread off`，或切换到受支持的适配器/渠道。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP 运行时位于主机侧；请求方会话已被沙箱隔离。 | 在沙箱会话中使用 `runtime="subagent"`，或从非沙箱会话启动 ACP。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | 为 ACP 运行时请求了 `sandbox="require"`。 | 若需要强制沙箱隔离，请使用 `runtime="subagent"`；或者从非沙箱会话中结合 `sandbox="inherit"` 使用 ACP。 |
| `Cannot apply --model ... did not advertise model support` | 目标 harness 未暴露通用 ACP 模型切换支持。 | 使用声明了 ACP `models`/`session/set_model` 的 harness、使用 Codex ACP 模型引用，或如果 harness 有自己的启动标志，则直接在其中配置模型。 |
| 已绑定会话缺少 ACP 元数据 | ACP 会话元数据已过期或被删除。 | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦线程。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP 会话中阻止了写入/exec。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway 网关。参见[权限配置](/zh-CN/tools/acp-agents-setup#permission-configuration)。 |
| ACP 会话很早失败且几乎没有输出 | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。 | 检查 Gateway 网关日志中的 `AcpRuntimeError`。若要授予完整权限，设置 `permissionMode=approve-all`；若要优雅降级，设置 `nonInteractivePermissions=deny`。 |
| ACP 会话在完成工作后无限期卡住 | harness 进程已结束，但 ACP 会话没有报告完成。 | 使用 `ps aux \| grep acpx` 监控；手动杀掉过期进程。 |
| harness 看到了 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` | 内部事件信封泄露到了 ACP 边界之外。 | 更新 OpenClaw 并重新运行完成流程；外部 harness 应只接收普通完成提示。 |

## 相关内容

- [ACP 智能体 — 设置](/zh-CN/tools/acp-agents-setup)
- [智能体发送](/zh-CN/tools/agent-send)
- [CLI Backends](/zh-CN/gateway/cli-backends)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（桥接模式）](/zh-CN/cli/acp)
- [子智能体](/zh-CN/tools/subagents)
