---
read_when:
    - 你想使用内置的 Codex 应用服务器 Codex harness
    - 你需要 Codex harness 配置示例
    - 你希望仅 Codex 部署在失败时直接报错，而不是回退到 PI
summary: 通过内置的 Codex 应用服务器 Codex harness 运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-04-26T07:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex 应用服务器运行嵌入式智能体回合，而不是使用内置的 PI harness。

当你希望由 Codex 接管底层智能体会话时，请使用它：模型发现、原生线程恢复、原生压缩以及应用服务器执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

如果你正在尝试建立整体认知，请先阅读
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简要来说：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

## 这个插件会改变什么

内置的 `codex` 插件提供几个彼此独立的能力：

| 能力 | 使用方式 | 作用 |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式运行时 | `agentRuntime.id: "codex"` | 通过 Codex 应用服务器运行 OpenClaw 嵌入式智能体回合。 |
| 原生聊天控制命令 | `/codex bind`、`/codex resume`、`/codex steer`、... | 从消息对话中绑定和控制 Codex 应用服务器线程。 |
| Codex 应用服务器 provider/目录 | `codex` 内部机制，通过 harness 暴露 | 让运行时能够发现并验证应用服务器模型。 |
| Codex 媒体理解路径 | `codex/*` 图像模型兼容路径 | 对受支持的图像理解模型运行受限的 Codex 应用服务器回合。 |
| 原生钩子中继 | 围绕 Codex 原生事件的插件钩子 | 让 OpenClaw 可以观察/阻止受支持的 Codex 原生工具/终结事件。 |

启用该插件会使这些能力可用。它**不会**：

- 开始对每个 OpenAI 模型都使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 使 ACP/acpx 成为默认 Codex 路径
- 对已经记录了 PI 运行时的现有会话进行热切换
- 替换 OpenClaw 渠道传递、会话文件、认证配置文件存储或
  消息路由

同一个插件还拥有原生 `/codex` 聊天控制命令界面。如果
插件已启用，且用户要求从聊天中绑定、恢复、引导、停止或检查
Codex 线程，智能体应优先使用 `/codex ...` 而不是 ACP。当用户明确要求 ACP/acpx 或正在测试 ACP
Codex 适配器时，ACP 仍然是显式回退方案。

原生 Codex 回合保留 OpenClaw 插件钩子作为公共兼容层。
这些是在进程内的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`、`after_compaction`
- `llm_input`、`llm_output`
- `before_tool_call`、`after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- 通过 Codex `Stop` 中继的 `before_agent_finalize`
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，以便在 OpenClaw 执行工具之后、将结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公共
`tool_result_persist` 插件钩子是分开的，后者用于转换由 OpenClaw 拥有的转录
工具结果写入。

有关插件钩子语义本身，请参阅 [插件钩子](/zh-CN/plugins/hooks)
和 [插件守卫行为](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为 `openai/gpt-*`，并在
需要原生应用服务器执行时，显式强制使用
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
旧版 `codex/*` 模型引用仍会自动选择
该 harness 以保持兼容，但由运行时支持的旧版 provider 前缀不会显示为普通模型/提供商选项。

如果启用了 `codex` 插件，但主模型仍然是
`openai-codex/*`，`openclaw doctor` 会发出警告，而不是更改路由。这是
有意设计的：`openai-codex/*` 仍然是 PI Codex OAuth/订阅路径，而
原生应用服务器执行仍然是一个显式运行时选择。

## 路由映射

在修改配置前，请先使用此表：

| 期望行为 | 模型引用 | 运行时配置 | 插件要求 | 预期状态标签 |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通过普通 OpenClaw 运行器访问 OpenAI API | `openai/gpt-*` | 省略或 `runtime: "pi"` | OpenAI provider | `Runtime: OpenClaw Pi Default` |
| 通过 PI 使用 Codex OAuth/订阅 | `openai-codex/gpt-*` | 省略或 `runtime: "pi"` | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex 应用服务器嵌入式回合 | `openai/gpt-*` | `agentRuntime.id: "codex"` | `codex` 插件 | `Runtime: OpenAI Codex` |
| 混合提供商的保守自动模式 | provider 特定引用 | `agentRuntime.id: "auto"` | 可选插件运行时 | 取决于所选运行时 |
| 显式 Codex ACP 适配器会话 | 取决于 ACP prompt/模型 | `sessions_spawn` 搭配 `runtime: "acp"` | 正常工作的 `acpx` 后端 | ACP task/session 状态 |

关键区别在于 provider 与运行时：

- `openai-codex/*` 回答的是“PI 应该使用哪条 provider/认证路径？”
- `agentRuntime.id: "codex"` 回答的是“应由哪个循环执行这个
  嵌入式回合？”
- `/codex ...` 回答的是“这个聊天应绑定
  或控制哪个原生 Codex 对话？”
- ACP 回答的是“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路由按前缀区分。当你想通过 PI 使用
Codex OAuth 时，请使用 `openai-codex/*`；当你想使用直接 OpenAI API 访问，或
当你要强制使用原生 Codex 应用服务器 harness 时，请使用 `openai/*`：

| 模型引用 | 运行时路径 | 使用场景 |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | 通过 OpenClaw/PI 管线的 OpenAI provider | 你想使用当前通过 `OPENAI_API_KEY` 提供的直接 OpenAI Platform API 访问。 |
| `openai-codex/gpt-5.5` | 通过 OpenClaw/PI 的 OpenAI Codex OAuth | 你想通过默认 PI 运行器使用 ChatGPT/Codex 订阅认证。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex 应用服务器 harness | 你希望嵌入式智能体回合使用原生 Codex 应用服务器执行。 |

GPT-5.5 当前在 OpenClaw 中仅支持订阅/OAuth。请使用
`openai-codex/gpt-5.5` 进行 PI OAuth，或使用 `openai/gpt-5.5` 搭配 Codex
应用服务器 harness。一旦 OpenAI 在公共 API 上启用 GPT-5.5，
`openai/gpt-5.5` 的直接 API 密钥访问也会得到支持。

旧版 `codex/gpt-*` 引用仍被接受为兼容别名。Doctor
兼容迁移会将旧版主运行时引用重写为规范模型
引用，并单独记录运行时策略，而仅用于回退的旧版引用则保持不变，因为运行时是为整个智能体容器配置的。
新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
应用服务器 harness 配置应使用 `openai/gpt-*` 加上
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀拆分。使用
`openai-codex/gpt-*`，当图像理解应通过 OpenAI
Codex OAuth provider 路径运行时。使用 `codex/gpt-*`，当图像理解应通过
受限的 Codex 应用服务器回合运行时。Codex 应用服务器模型必须
声明支持图像输入；纯文本 Codex 模型会在媒体回合开始前失败。

使用 `/status` 确认当前会话的实际 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，
并检查 Gateway 网关的结构化 `agent harness selected` 记录。它
包含所选 harness id、选择原因、运行时/回退策略，以及在
`auto` 模式下每个插件候选项的支持结果。

### doctor 警告意味着什么

当以下条件全部满足时，`openclaw doctor` 会发出警告：

- 内置 `codex` 插件已启用或被允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的实际运行时不是 `codex`

之所以存在这个警告，是因为用户经常会以为“启用了 Codex 插件”就意味着
“使用原生 Codex 应用服务器运行时”。OpenClaw 不会自动做出这种推断。这个警告意味着：

- 如果你的本意是通过 PI 使用 ChatGPT/Codex OAuth，**则无需更改**。
- 如果你的本意是使用原生应用服务器
  执行，请将模型改为 `openai/<model>`，并设置
  `agentRuntime.id: "codex"`。
- 现有会话在运行时变更后仍然需要 `/new` 或 `/reset`，
  因为会话运行时固定是粘性的。

Harness 选择不是实时会话控制。当嵌入式回合运行时，
OpenClaw 会在该会话上记录所选 harness id，并在
同一会话 id 的后续回合中继续使用它。当你希望未来的会话使用其他 harness 时，请更改 `agentRuntime` 配置或
`OPENCLAW_AGENT_RUNTIME`；
在将现有对话从 PI 切换到 Codex 之前，请使用 `/new` 或 `/reset` 启动一个全新会话。
这样可以避免将同一份转录通过两个不兼容的原生会话系统重复回放。

在引入 harness 固定机制之前创建的旧版会话，一旦拥有转录历史，就会被视为固定到 PI。更改配置后，请使用 `/new` 或 `/reset` 将该对话切换到
Codex。

`/status` 会显示实际模型运行时。默认 PI harness 显示为
`Runtime: OpenClaw Pi Default`，Codex 应用服务器 harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- 已提供内置 `codex` 插件的 OpenClaw。
- Codex 应用服务器 `0.125.0` 或更高版本。内置插件默认会管理兼容的
  Codex 应用服务器二进制文件，因此 `PATH` 中本地的 `codex` 命令
  不会影响正常的 harness 启动。
- 应用服务器进程可用的 Codex 认证。

该插件会阻止较旧或未带版本信息的应用服务器握手。这样可以确保
OpenClaw 始终使用它已经验证过的协议接口。

对于实时和 Docker smoke 测试，认证通常来自 `OPENAI_API_KEY`，再加上可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。请使用与你本地 Codex 应用服务器相同的认证材料。

## 最小配置

使用 `openai/gpt-5.5`，启用内置插件，并强制使用 `codex` harness：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

如果你的配置使用 `plugins.allow`，也请将 `codex` 包含在其中：

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

旧版配置如果将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>`，仍会自动启用内置 `codex` 插件。新配置应优先
使用 `openai/<model>` 加上上面的显式 `agentRuntime` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体需要在 Codex 和非 Codex provider 模型之间自由切换，请不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用到该智能体或会话的每一个
嵌入式回合。如果你在该运行时被强制时选择了 Anthropic 模型，OpenClaw 仍会尝试使用 Codex harness，并以失败关闭，而不是静默地通过 PI 路由该回合。

请改用以下其中一种结构：

- 将 Codex 放到一个专用智能体上，并设置 `agentRuntime.id: "codex"`。
- 将默认智能体保持为 `agentRuntime.id: "auto"`，并为常规混合
  provider 使用保留 PI 回退。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先
  使用 `openai/*` 加上显式 Codex 运行时策略。

例如，下面的配置会让默认智能体保持正常的自动选择，并
添加一个单独的 Codex 智能体：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

在这种结构下：

- 默认的 `main` 智能体使用正常 provider 路径和 PI 兼容回退。
- `codex` 智能体使用 Codex 应用服务器 harness。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该回合会失败，
  而不是悄悄改用 PI。

## 智能体命令路由

智能体应根据用户意图而不是仅凭“Codex”这个词来路由请求：

| 用户请求的是... | 智能体应使用... |
| -------------------------------------------------------- | ------------------------------------------------ |
| “将这个聊天绑定到 Codex” | `/codex bind` |
| “在这里恢复 Codex 线程 `<id>`” | `/codex resume <id>` |
| “显示 Codex 线程” | `/codex threads` |
| “将 Codex 用作这个智能体的运行时” | 将 `agentRuntime.id` 改为相应配置 |
| “用我的 ChatGPT/Codex 订阅配合普通 OpenClaw 使用” | `openai-codex/*` 模型引用 |
| “通过 ACP/acpx 运行 Codex” | ACP `sessions_spawn({ runtime: "acp", ... })` |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor” | ACP/acpx，而不是 `/codex`，也不是原生子智能体 |

仅当 ACP 已启用、可调度并且有已加载的运行时后端支持时，
OpenClaw 才会向智能体公开 ACP 启动指引。如果 ACP 不可用，
系统提示和插件 Skills 不应向智能体传授 ACP
路由方式。

## 仅 Codex 部署

当你需要证明每一个嵌入式智能体回合都
使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不使用 PI 回退，因此
`fallback: "none"` 是可选的，但通常对文档说明很有帮助：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

环境变量覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

在强制使用 Codex 的情况下，如果 Codex 插件被禁用、
应用服务器版本过旧，或应用服务器无法启动，OpenClaw 会尽早失败。只有当你明确希望在缺少 harness 选择时由 PI 处理时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让某个智能体仅使用 Codex，而默认智能体仍保持正常
自动选择：

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

使用普通会话命令切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，而 Codex harness 会按需创建或恢复其侧车应用服务器
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，
并让下一回合根据当前配置再次解析 harness。

## 模型发现

默认情况下，Codex 插件会向应用服务器请求可用模型。如果
发现失败或超时，它会使用一个内置回退目录，包含：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以在 `plugins.entries.codex.config.discovery` 下调整发现行为：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

当你希望启动时避免探测 Codex，并固定使用
回退目录时，可禁用发现：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## 应用服务器连接和策略

默认情况下，插件会在本地使用以下命令启动 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

该受管二进制文件被声明为内置插件运行时依赖，并与其余 `codex` 插件依赖一起暂存。
这样可以让应用服务器版本绑定到内置插件，而不是绑定到本地恰好安装的某个独立 Codex CLI。
只有在你明确想运行不同可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自治心跳的受信任本地操作员姿态：
Codex 可以使用 shell 和网络工具，而不会停在无人可响应的原生审批提示上。

如果你想启用由 Codex guardian 审核的审批，请设置 `appServer.mode:
"guardian"`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian 模式使用 Codex 原生自动审查审批路径。当 Codex 请求
离开沙箱、写入工作区之外，或添加诸如网络访问之类的权限时，
Codex 会将该审批请求路由给原生审查器，而不是人工提示。
该审查器会应用 Codex 的风险框架，并批准或拒绝具体请求。
当你想要比 YOLO 模式更多的防护措施，
但仍需要无人值守智能体持续推进工作时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
单独的策略字段仍会覆盖 `mode`，因此高级部署可以将
该预设与显式选择混合使用。较旧的 `guardian_subagent` 审查器值
仍被接受为兼容别名，但新配置应使用
`auto_review`。

对于已经运行的应用服务器，请使用 WebSocket 传输：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

支持的 `appServer` 字段：

| 字段 | 默认值 | 含义 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | 受管 Codex 二进制文件 | 用于 stdio 传输的可执行文件。留空则使用受管二进制文件；只有在明确覆盖时才设置它。 |
| `args` | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url` | 未设置 | WebSocket 应用服务器 URL。 |
| `authToken` | 未设置 | 用于 WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket 请求头。 |
| `requestTimeoutMs` | `60000` | 应用服务器控制平面调用的超时时间。 |
| `mode` | `"yolo"` | YOLO 或 guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程启动/恢复/回合的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程启动/恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"auto_review"` 让 Codex 审核原生审批提示。`guardian_subagent` 仍是旧版别名。 |
| `serviceTier` | 未设置 | 可选的 Codex 应用服务器服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。 |

环境变量覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当
`appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过受管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者
在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，
因为它可以将插件行为与 Codex harness 其余设置一起保存在同一个经过审查的文件中。

## 常见配方

使用默认 stdio 传输的本地 Codex：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

仅 Codex harness 验证：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

由 Guardian 审核的 Codex 审批：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

带显式请求头的远程应用服务器：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有
Codex 线程时，下一回合会再次向
app-server 发送当前选定的
OpenAI 模型、provider、审批策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留
线程绑定，但会要求 Codex 使用新选定的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为一个已授权斜杠命令。它是
通用的，可在任何支持 OpenClaw 文本命令的渠道上使用。

常见形式：

- `/codex status` 显示实时 app-server 连接性、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 在
正常回合中使用的同一个侧车绑定文件。在下一条消息时，OpenClaw 会恢复该 Codex 线程，将
当前选定的 OpenClaw 模型传入 app-server，并保持启用扩展历史记录。

该命令界面要求 Codex app-server `0.125.0` 或更高版本。如果
未来版本或自定义 app-server 未公开某个 JSON-RPC 方法，
对应控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级 | 所有者 | 用途 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子 | OpenClaw | 在 PI 和 Codex harness 之间保持产品/插件兼容性。 |
| Codex app-server 扩展中间件 | OpenClaw 内置插件 | 围绕 OpenClaw 动态工具的逐回合适配器行为。 |
| Codex 原生钩子 | Codex | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。 |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为每个线程注入 Codex 配置，用于 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop`。其他 Codex 钩子，例如 `SessionStart` 和
`UserPromptSubmit`，仍然属于 Codex 级控制；在 v1 合约中，它们不会作为
OpenClaw 插件钩子公开。

对于 OpenClaw 动态工具，Codex 请求调用后由 OpenClaw 执行该工具，因此 OpenClaw 会在
harness 适配器中触发它所拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。
OpenClaw 可以镜像选定事件，但无法重写原生 Codex
线程，除非 Codex 通过 app-server 或原生钩子
回调公开该操作。

压缩和 LLM 生命周期投影来自 Codex app-server
通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级观察结果，而不是对
Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知
会被投影为用于轨迹和调试的 `codex_app_server.hook` 智能体事件。
它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是“底层换了个模型调用的 PI”。Codex 接管了更多
原生模型循环，而 OpenClaw 会围绕这个边界适配它的插件和会话界面。

Codex 运行时 v1 中受支持的内容：

| 界面 | 支持情况 | 原因 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 运行 OpenAI 模型循环 | 支持 | Codex app-server 负责 OpenAI 回合、原生线程恢复和原生工具继续执行。 |
| OpenClaw 渠道路由和传递 | 支持 | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道保持在模型运行时之外。 |
| OpenClaw 动态工具 | 支持 | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍处于执行路径中。 |
| 提示和上下文插件 | 支持 | OpenClaw 会在启动或恢复线程之前构建提示覆盖层，并将上下文投影到 Codex 回合中。 |
| 上下文引擎生命周期 | 支持 | Assemble、摄取或回合后维护，以及上下文引擎压缩协调都会为 Codex 回合运行。 |
| 动态工具钩子 | 支持 | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 拥有的动态工具运行。 |
| 生命周期钩子 | 作为适配器观察结果受支持 | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会触发，并携带真实的 Codex 模式载荷。 |
| 最终答案修订门控 | 通过原生钩子中继支持 | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会在最终完成前请求 Codex 再执行一次模型推理。 |
| 阻止或观察原生 shell、patch 和 MCP | 通过原生钩子中继支持 | 对于已提交的原生工具界面，包括 Codex app-server `0.125.0` 或更高版本中的 MCP 载荷，Codex `PreToolUse` 和 `PostToolUse` 会被中继。支持阻止；不支持参数重写。 |
| 原生权限策略 | 通过原生钩子中继支持 | 当运行时公开该能力时，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 未返回决定，Codex 会继续走它自己的 guardian 或用户审批路径。 |
| App-server 轨迹捕获 | 支持 | OpenClaw 会记录它发送给 app-server 的请求以及它接收到的 app-server 通知。 |

Codex 运行时 v1 中不支持的内容：

| 界面 | V1 边界 | 未来路径 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更 | Codex 原生预工具钩子可以阻止调用，但 OpenClaw 不会重写 Codex 原生工具参数。 | 需要 Codex 钩子/schema 支持替换工具输入。 |
| 可编辑的 Codex 原生转录历史 | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像并可以投影未来上下文，但不应修改不受支持的内部结构。 | 如果需要原生线程外科式修改，则需增加显式 Codex app-server API。 |
| 用于 Codex 原生工具记录的 `tool_result_persist` | 该钩子转换的是 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。 | 可以镜像转换后的记录，但规范重写需要 Codex 支持。 |
| 丰富的原生压缩元数据 | OpenClaw 能观察到压缩开始和完成，但不会接收到稳定的保留/丢弃列表、token 增量或摘要载荷。 | 需要更丰富的 Codex 压缩事件。 |
| 压缩干预 | 当前 OpenClaw 压缩钩子在 Codex 模式下仅处于通知级别。 | 如果插件需要否决或重写原生压缩，则需增加 Codex 压缩前/后钩子。 |
| 逐字节模型 API 请求捕获 | OpenClaw 可以捕获 app-server 请求和通知，但最终的 OpenAI API 请求由 Codex core 在内部构建。 | 需要 Codex 模型请求追踪事件或调试 API。 |

## 工具、媒体和压缩

Codex harness 只改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从
harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出
仍然通过正常的 OpenClaw 传递路径进行处理。

原生钩子中继被有意设计为通用机制，但 v1 支持合约
仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。在
Codex 运行时中，这包括 shell、patch 和 MCP 的 `PreToolUse`、
`PostToolUse` 以及 `PermissionRequest` 载荷。不要假设未来所有
Codex 钩子事件都会成为 OpenClaw 插件界面，除非运行时合约明确
命名了它。

对于 `PermissionRequest`，仅当策略做出决定时，OpenClaw 才会返回显式允许或拒绝
决定。无决定结果并不等于允许。Codex 会将其视为没有
钩子决定，并继续走它自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件
审批流程进行路由。Codex `request_user_input` 提示会被发送回
发起聊天，而下一个排队的后续消息会回答该原生
服务器请求，而不是作为额外上下文被引导处理。其他 MCP 征询
请求仍然会以失败关闭。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包含用户提示、最终助手文本，以及当 app-server 发出时的轻量级 Codex reasoning 或计划记录。目前，OpenClaw 仅记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也尚未提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它仅在 OpenClaw 正在写入由 OpenClaw 拥有的会话转录工具结果时生效。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解仍会继续使用匹配的 provider/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 没有作为普通 `/model` provider 出现：** 对于新配置，这是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`agentRuntime.id: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用了 PI 而不是 Codex：** `agentRuntime.id: "auto"` 在没有 Codex harness 声明接管运行时，仍可能使用 PI 作为兼容后端。测试时请设置
`agentRuntime.id: "codex"` 以强制选择 Codex。现在，强制的 Codex 运行时在失败时会直接报错，而不是回退到 PI，除非你显式设置
`agentRuntime.fallback: "pi"`。一旦选中了 Codex app-server，
它的失败会直接暴露出来，不需要额外的回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手
报告版本 `0.125.0` 或更高。相同版本号的预发布版或带构建后缀的
版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为 OpenClaw 测试的是稳定版 `0.125.0` 这一协议下限。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、`authToken`，
以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 这是预期行为，除非你为该智能体强制设置了
`agentRuntime.id: "codex"`，或选择了旧版
`codex/*` 引用。在 `auto` 模式下，普通 `openai/gpt-*` 和其他 provider 引用会保留在各自正常的
provider 路径上。如果你强制设置 `agentRuntime.id: "codex"`，该智能体的每一个嵌入式
回合都必须是 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [插件钩子](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
