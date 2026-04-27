---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 Pi
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-26T20:28:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57c0d66c3ce0cdb26ffd2e6637c1494908c563f4c9750b20a9b33b6bc7810e1b
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件可让 OpenClaw 通过 Codex app-server，而不是内置的 Pi harness，运行嵌入式智能体轮次。

当你希望 Codex 接管底层智能体会话时，可使用此功能：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

如果你正在梳理整体结构，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简短来说：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信界面。

## 这个插件会改变什么

内置的 `codex` 插件提供了几项彼此独立的能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式运行时                  | `agentRuntime.id: "codex"`                          | 通过 Codex app-server 运行 OpenClaw 嵌入式智能体轮次。                        |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 从消息会话中绑定并控制 Codex app-server 线程。                                |
| Codex app-server 提供商/目录      | `codex` 内部机制，通过 harness 暴露                 | 让运行时发现并校验 app-server 模型。                                          |
| Codex 媒体理解路径                | `codex/*` 图像模型兼容路径                          | 为受支持的图像理解模型运行受限的 Codex app-server 轮次。                      |
| 原生钩子转发                      | 围绕 Codex 原生命令事件的插件钩子                   | 让 OpenClaw 观察/阻止受支持的 Codex 原生工具/终结事件。                       |

启用该插件会让这些能力可用。它**不会**：

- 为每个 OpenAI 模型都开始使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认的 Codex 路径
- 热切换那些已经记录了 Pi 运行时的现有会话
- 替换 OpenClaw 的渠道投递、会话文件、auth-profile 存储或消息路由

同一个插件也负责原生 `/codex` 聊天控制命令界面。如果
插件已启用，且用户要求从聊天中绑定、恢复、引导、停止或检查
Codex 线程，智能体应优先使用 `/codex ...`，而不是 ACP。当用户明确要求 ACP/acpx，或正在测试 ACP
Codex 适配器时，ACP 仍然是显式回退选项。

原生 Codex 轮次仍然将 OpenClaw 插件钩子作为公共兼容层。
这些是 OpenClaw 进程内钩子，而不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像的转录记录
- 通过 Codex `Stop` 转发的 `before_agent_finalize`
- `agent_end`

插件也可以注册与运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公共的
`tool_result_persist` 插件钩子是分开的；后者会转换由 OpenClaw 管理的转录工具结果写入。

有关插件钩子语义本身，请参阅 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用
使用规范形式 `openai/gpt-*`，并在需要原生 app-server 执行时，显式强制设置
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用出于兼容性仍会自动选择该 harness，但由运行时支持的旧版提供商前缀不会作为常规模型/提供商选项显示。

如果已启用 `codex` 插件，但主模型仍然是
`openai-codex/*`，`openclaw doctor` 会发出警告，而不是修改路由。这是有意为之：`openai-codex/*` 仍然是 Pi Codex OAuth/订阅路径，而原生 app-server 执行仍然是一个显式运行时选择。

## 路由映射

在更改配置之前，请先查看此表：

| 期望行为                                  | 模型引用                   | 运行时配置                             | 插件要求                    | 预期 Status 标签              |
| ----------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通过普通 OpenClaw 运行器使用 OpenAI API   | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI provider             | `Runtime: OpenClaw Pi Default` |
| 通过 Pi 使用 Codex OAuth/订阅             | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式轮次          | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` 插件                | `Runtime: OpenAI Codex`        |
| 使用保守自动模式的混合提供商              | 提供商特定引用             | `agentRuntime.id: "auto"`              | 可选插件运行时              | 取决于所选运行时               |
| 显式 Codex ACP 适配器会话                 | 取决于 ACP 提示词/模型     | `sessions_spawn` 配合 `runtime: "acp"` | 健康的 `acpx` 后端          | ACP 任务/会话状态              |

这里的重要区分是提供商与运行时：

- `openai-codex/*` 回答的是“Pi 应该使用哪条提供商/认证路径？”
- `agentRuntime.id: "codex"` 回答的是“哪个循环应执行这个
  嵌入式轮次？”
- `/codex ...` 回答的是“这个聊天应该绑定或控制哪个原生 Codex 会话？”
- ACP 回答的是“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路由依赖具体前缀。想通过 Pi 使用 Codex OAuth 时，请用 `openai-codex/*`；想直接使用 OpenAI API，或
想强制使用原生 Codex app-server harness 时，请用 `openai/*`：

| 模型引用                                      | 运行时路径                                    | 适用场景                                                                  |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 通过 OpenClaw/Pi 管道的 OpenAI provider       | 你希望通过 `OPENAI_API_KEY` 使用当前的 OpenAI Platform API 直接访问。     |
| `openai-codex/gpt-5.5`                        | 通过 OpenClaw/Pi 的 OpenAI Codex OAuth        | 你希望在默认 Pi 运行器中使用 ChatGPT/Codex 订阅认证。                     |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                      | 你希望对嵌入式智能体轮次使用原生 Codex app-server 执行。                  |

GPT-5.5 当前在 OpenClaw 中仅支持订阅/OAuth。Pi OAuth 请使用
`openai-codex/gpt-5.5`，或将 `openai/gpt-5.5` 与 Codex
app-server harness 搭配使用。一旦 OpenAI 在公共 API 上启用 GPT-5.5，
就会支持通过 API key 直接访问 `openai/gpt-5.5`。

旧版 `codex/gpt-*` 引用仍然接受为兼容别名。Doctor
兼容性迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略，而仅用作回退的旧版引用则保持不变，因为运行时是为整个智能体容器配置的。新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
app-server harness 配置应使用 `openai/gpt-*`，并配合
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循同样的前缀划分。若图像理解应通过 OpenAI
Codex OAuth provider 路径运行，请使用 `openai-codex/gpt-*`。若图像理解应通过受限的 Codex app-server 轮次运行，请使用
`codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前会话实际使用的 harness。如果结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关结构化的 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

### doctor 警告是什么意思

当以下条件全部为真时，`openclaw doctor` 会发出警告：

- 内置的 `codex` 插件已启用或被允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的实际运行时不是 `codex`

之所以有这个警告，是因为用户通常会以为“已启用 Codex 插件”意味着
“原生 Codex app-server 运行时”。OpenClaw 不会自动做出这个跳转。这个警告的含义是：

- 如果你本来就打算通过 Pi 使用 ChatGPT/Codex OAuth，**则无需更改**。
- 如果你本来打算使用原生 app-server
  执行，请将模型改为 `openai/<model>`，并设置
  `agentRuntime.id: "codex"`。
- 运行时变更后，现有会话仍需要执行 `/new` 或 `/reset`，
  因为会话运行时固定是粘性的。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，
OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的后续轮次中继续使用它。当你希望未来会话使用其他 harness 时，请更改 `agentRuntime` 配置或
`OPENCLAW_AGENT_RUNTIME`；在现有会话于 Pi 与 Codex 之间切换之前，请使用 `/new` 或 `/reset` 启动一个新会话。这可以避免让同一份转录在两个不兼容的原生会话系统之间重放。

在 harness 固定功能引入之前创建的旧会话，一旦有转录历史，就会被视为固定到 Pi。更改配置后，请使用 `/new` 或 `/reset` 将该会话切换到 Codex。

`/status` 会显示实际模型运行时。默认的 Pi harness 显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- 已安装可用内置 `codex` 插件的 OpenClaw。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理兼容的
  Codex app-server 二进制文件，因此 `PATH` 上本地的 `codex` 命令
  不会影响正常的 harness 启动。
- app-server 进程可用的 Codex 认证信息。

该插件会阻止较旧或无版本号的 app-server 握手。这可以确保
OpenClaw 始终运行在其已测试过的协议接口上。

对于实时与 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。请使用与你本地 Codex app-server
相同的认证材料。

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

如果旧配置将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>`，仍会自动启用内置 `codex` 插件。新配置应优先使用
`openai/<model>`，并配合上面显式的 `agentRuntime` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体需要在 Codex 和非 Codex 提供商模型之间自由切换，请不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用到该智能体或会话的每一个嵌入式轮次。如果你在该运行时被强制启用时选择 Anthropic 模型，OpenClaw 仍会尝试使用 Codex harness，并以失败关闭，而不是悄悄通过 Pi 路由该轮次。

请改用以下其中一种配置方式：

- 将 Codex 放在一个专用智能体上，并设置 `agentRuntime.id: "codex"`。
- 将默认智能体保持为 `agentRuntime.id: "auto"`，并为正常的混合
  提供商使用保留 Pi 回退。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用
  `openai/*`，并配合显式的 Codex 运行时策略。

例如，下面的配置会让默认智能体继续使用常规自动选择，并
额外添加一个独立的 Codex 智能体：

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

采用这种配置方式后：

- 默认的 `main` 智能体使用常规提供商路径和 Pi 兼容性回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或当前不受支持，该轮次会直接失败，
  而不是悄悄改用 Pi。

## 智能体命令路由

智能体应根据用户意图来路由请求，而不是仅凭 “Codex” 这个词：

| 用户要求……                                               | 智能体应使用……                                  |
| -------------------------------------------------------- | ------------------------------------------------ |
| “将这个聊天绑定到 Codex”                                 | `/codex bind`                                    |
| “在这里恢复 Codex 线程 `<id>`”                           | `/codex resume <id>`                             |
| “显示 Codex 线程”                                        | `/codex threads`                                 |
| “将 Codex 用作这个智能体的运行时”                        | 将配置更改为 `agentRuntime.id`                   |
| “用我的 ChatGPT/Codex 订阅配合普通 OpenClaw”             | `openai-codex/*` 模型引用                        |
| “通过 ACP/acpx 运行 Codex”                               | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor”        | ACP/acpx，而不是 `/codex`，也不是原生子智能体    |

只有在 ACP 已启用、可分发，并且由已加载的运行时后端支持时，
OpenClaw 才会向智能体公布 ACP 启动指引。如果 ACP 不可用，
系统提示词和插件 Skills 不应向智能体传授 ACP
路由方式。

## 仅 Codex 部署

当你需要证明每个嵌入式智能体轮次都
使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不使用 Pi 回退，因此
`fallback: "none"` 是可选的，但通常有助于作为文档说明：

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

环境覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

当强制使用 Codex 时，如果 Codex 插件被禁用、app-server 版本过旧，或
app-server 无法启动，OpenClaw 会提前失败。仅当你确实希望由 Pi 处理缺失的 harness 选择时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让某个智能体仅使用 Codex，同时让默认智能体保持正常的
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

使用常规会话命令来切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，而 Codex harness 会根据需要创建或恢复其旁挂的 app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，
并让下一轮再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果
发现失败或超时，它会使用内置的回退目录，包含：

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

如果你希望启动时避免探测 Codex，并固定使用
回退目录，可以禁用发现：

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

## App-server 连接与策略

默认情况下，插件会在本地使用以下命令启动 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

该托管二进制文件被声明为内置插件运行时依赖项，并与
`codex` 插件的其余依赖一起分阶段部署。这样可以让 app-server 版本绑定到内置插件，而不是绑定到本地恰好安装的某个独立 Codex CLI。
仅当你明确想运行其他可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员模式：Codex 可以使用 shell 和网络工具，而不会停下来等待没有人在场时根本无法响应的原生审批提示。

若要启用由 Codex Guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 原生的自动审核审批路径。当 Codex 请求
离开沙箱、在工作区之外写入，或添加网络访问等权限时，Codex 会将该审批请求路由给原生审核器，而不是人类提示。审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你希望比 YOLO 模式有更多护栏，但又仍然需要无人值守的智能体继续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
单独的策略字段仍然会覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。较旧的 `guardian_subagent` 审核器值仍被接受作为兼容别名，但新配置应使用
`auto_review`。

对于已经在运行的 app-server，请使用 WebSocket 传输：

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

| 字段                | 默认值                                   | 含义                                                                                                         |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                       |
| `command`           | 托管的 Codex 二进制文件                  | 用于 stdio 传输的可执行文件。留空则使用托管二进制文件；仅在明确覆盖时设置。                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                                      |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                   |
| `authToken`         | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                         |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                                                      |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                          |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 审核执行的预设。                                                                            |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。                                                              |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                   |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生审批提示。`guardian_subagent` 仍保留为旧版别名。                      |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                      |

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，
`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试时使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，
因为这样可以将插件行为与 Codex harness 设置的其余部分一起保存在同一个已审查文件中。

## Computer use

Computer Use 是一个 Codex 原生 MCP 插件。OpenClaw 不会内置桌面
控制应用，也不会自行执行桌面操作；它会启用 Codex app-server
插件，在请求时安装配置好的 Codex marketplace 插件，检查
`computer-use` MCP 服务器是否可用，然后在 Codex 模式轮次期间让 Codex
处理原生 MCP 工具调用。

当你希望 Codex 模式轮次必须使用 Computer Use 时，请设置
`plugins.entries.codex.config.computerUse`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

如果未设置 marketplace 字段，OpenClaw 会请求 Codex app-server 使用其已发现的
marketplace。在全新的 Codex 主目录中，app-server 会预置官方精选
marketplace，而 OpenClaw 会遵循与 Codex 相同的加载方式：它会在安装期间轮询
`plugin/list`，然后才将 Computer Use 视为不可用。默认的发现等待时间为 60 秒，可通过
`marketplaceDiscoveryTimeoutMs` 调整。如果多个已知的 Codex marketplaces 都包含
Computer Use，OpenClaw 会先使用 Codex 的 marketplace 优先顺序，
若仍然出现未知的歧义匹配，则会以失败关闭。

对于 app-server 可添加的非默认 Codex marketplace 来源，请使用 `marketplaceSource`；对于机器上已经存在的本地 marketplace 文件，请使用 `marketplacePath`。如果该 marketplace 已经注册到
Codex app-server，请改用 `marketplaceName`。默认值为
`pluginName: "computer-use"` 和 `mcpServerName: "computer-use"`。
出于安全考虑，轮次开始时的自动安装只会使用 app-server
已经发现的 marketplaces。若要从已配置的 `marketplaceSource` 或 `marketplacePath` 显式安装，请使用 `/codex computer-use install`。

同样的设置也可以通过命令界面检查或安装：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use 仅适用于 macOS，在 Codex MCP 服务器能够控制应用之前，可能需要本地操作系统权限。如果 `computerUse.enabled` 为 true 且
MCP 服务器不可用，则 Codex 模式轮次会在线程启动前直接失败，而不是静默地在没有原生 Computer Use 工具的情况下继续运行。

## 常见示例

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

带显式标头的远程 app-server：

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

模型切换仍由 OpenClaw 控制。当某个 OpenClaw 会话已附加到现有 Codex 线程时，下一轮会再次将当前选中的
OpenAI 模型、提供商、审批策略、沙箱和服务层级发送给
app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选定的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为授权的斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道中使用。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex computer-use status` 检查已配置的 Computer Use 插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的 Computer Use 插件并重新加载 MCP 服务器。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 在正常轮次中使用的相同旁挂绑定文件。下一条消息到来时，OpenClaw 会恢复该 Codex 线程，将当前选中的 OpenClaw 模型传入 app-server，并保持扩展历史启用。

该命令界面要求 Codex app-server `0.125.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，则各个控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 在 Pi 和 Codex harness 之间提供产品/插件兼容性。                    |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的每轮适配器行为。                            |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                |

OpenClaw 不会使用项目级或全局的 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为每个线程注入 Codex 配置，用于 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop`。其他 Codex 钩子，如 `SessionStart` 和
`UserPromptSubmit`，仍然是 Codex 级控制；它们不会在 v1 合约中作为 OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，Codex 发出调用请求后由 OpenClaw 执行该工具，因此
OpenClaw 会在 harness 适配器中触发其拥有的插件与中间件行为。对于 Codex 原生工具，Codex 拥有规范的工具记录。OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调暴露该操作，否则 OpenClaw 无法重写原生 Codex 线程。

压缩和 LLM 生命周期投影来自 Codex app-server
通知以及 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级观察结果，而不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知
会被投影为用于轨迹与调试的 `codex_app_server.hook` 智能体事件。
它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是“底层换了一个模型调用的 Pi”。Codex 接管了更多
原生模型循环，而 OpenClaw 会围绕这个边界适配其插件和会话界面。

在 Codex 运行时 v1 中受支持的内容：

| 界面                                          | 支持情况                             | 原因                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                 | Codex app-server 接管 OpenAI 轮次、原生线程恢复和原生工具续接。                                                                                                                                         |
| OpenClaw 渠道路由与投递                       | 支持                                 | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道仍然位于模型运行时之外。                                                                                                                         |
| OpenClaw 动态工具                             | 支持                                 | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍然处于执行路径中。                                                                                                                                  |
| 提示词与上下文插件                            | 支持                                 | OpenClaw 会在启动或恢复线程之前构建提示词覆盖层，并将上下文投影到 Codex 轮次中。                                                                                                                        |
| 上下文引擎生命周期                            | 支持                                 | Assemble、ingest 或轮次后维护，以及上下文引擎压缩协调都会在 Codex 轮次中运行。                                                                                                                         |
| 动态工具钩子                                  | 支持                                 | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕由 OpenClaw 管理的动态工具运行。                                                                                                           |
| 生命周期钩子                                  | 作为适配器观察结果受支持             | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式负载触发。                                                                                      |
| 最终答案修订门控                              | 通过原生钩子转发受支持               | Codex `Stop` 会转发到 `before_agent_finalize`；`revise` 会在最终完成前请求 Codex 再进行一次模型处理。                                                                                                  |
| 原生 shell、patch 和 MCP 的阻止或观察         | 通过原生钩子转发受支持               | Codex `PreToolUse` 和 `PostToolUse` 会针对已提交的原生工具界面进行转发，包括 Codex app-server `0.125.0` 或更高版本上的 MCP 负载。支持阻止；不支持参数重写。                                          |
| 原生权限策略                                  | 通过原生钩子转发受支持               | 当运行时暴露该能力时，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 未返回决定，Codex 会继续走其正常的 guardian 或用户审批路径。                                                |
| App-server 轨迹捕获                           | 支持                                 | OpenClaw 会记录它发送给 app-server 的请求以及收到的 app-server 通知。                                                                                                                                   |

在 Codex 运行时 v1 中不受支持：

| 界面                                              | V1 边界                                                                                                                                          | 未来路径                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                                  | Codex 原生预工具钩子可以阻止调用，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                       | 需要 Codex 钩子/模式支持替换工具输入。                                                    |
| 可编辑的 Codex 原生转录历史                       | Codex 拥有规范的原生线程历史。OpenClaw 拥有一个镜像，并可投影未来上下文，但不应修改不受支持的内部实现。                                         | 如果需要原生线程手术式修改，则需添加显式的 Codex app-server API。                        |
| 用于 Codex 原生工具记录的 `tool_result_persist`   | 该钩子转换的是由 OpenClaw 管理的转录写入，而不是 Codex 原生工具记录。                                                                            | 可以镜像转换后的记录，但规范性重写仍需要 Codex 支持。                                    |
| 丰富的原生压缩元数据                              | OpenClaw 可以观察压缩开始与完成，但不会收到稳定的保留/丢弃列表、token 差值或摘要负载。                                                           | 需要更丰富的 Codex 压缩事件。                                                             |
| 压缩干预                                          | 当前 OpenClaw 的压缩钩子在 Codex 模式下仅为通知级。                                                                                              | 如果插件需要否决或重写原生压缩，则需添加 Codex 压缩前/后钩子。                           |
| 逐字节的模型 API 请求捕获                         | OpenClaw 可以捕获 app-server 请求与通知，但最终的 OpenAI API 请求由 Codex core 在内部构建。                                                       | 需要 Codex 模型请求跟踪事件或调试 API。                                                   |

## 工具、媒体和压缩

Codex harness 只会改变底层的嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从
harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出
仍然通过常规 OpenClaw 投递路径处理。

原生钩子转发被有意设计为通用机制，但 v1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具与权限路径。在
Codex 运行时中，这包括 shell、patch 和 MCP 的 `PreToolUse`、
`PostToolUse` 以及 `PermissionRequest` 负载。除非运行时合约明确命名，否则不要假设未来每个
Codex 钩子事件都会成为 OpenClaw 插件界面。

对于 `PermissionRequest`，只有在策略做出决定时，OpenClaw 才会返回显式的允许或拒绝结果。无决定结果并不等于允许。Codex 会将其视为没有
钩子决定，并回退到它自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件
审批流程路由。Codex 的 `request_user_input` 提示会被发送回原始聊天，
而下一条排队的后续消息会用于回答该原生服务器请求，而不是作为额外上下文进行引导。其他 MCP 征询请求仍然会以失败关闭。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包括用户提示词、最终助手文本，以及在 app-server 发出时提供的轻量 Codex 推理或计划记录。目前，OpenClaw 仅记录原生压缩的开始和完成信号。它尚未公开可供人阅读的压缩摘要，也不提供 Codex 压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前
不会重写 Codex 原生工具结果记录。它仅适用于
OpenClaw 正在写入由 OpenClaw 管理的会话转录工具结果时。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体
理解仍会继续使用对应的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**Codex 没有显示为常规 `/model` 提供商：** 对于
新配置，这是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`agentRuntime.id: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 当没有 Codex harness 声明接管运行时，`agentRuntime.id: "auto"` 仍然可以使用 Pi 作为
兼容性后端。测试时请设置
`agentRuntime.id: "codex"` 以强制选择 Codex。现在，强制的 Codex 运行时会直接失败，而不是回退到 Pi，除非你
显式设置 `agentRuntime.fallback: "pi"`。一旦选择了 Codex app-server，
其失败会直接暴露出来，不会再经过额外的回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手
报告版本 `0.125.0` 或更高。相同版本号的预发布版本或带构建后缀的
版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为
OpenClaw 测试的是稳定版 `0.125.0` 协议下限。

**模型发现很慢：** 请降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、`authToken`，
以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 Pi：** 除非你为该智能体强制设置了
`agentRuntime.id: "codex"`，或选择了旧版
`codex/*` 引用，否则这是预期行为。普通 `openai/gpt-*` 和其他提供商引用在 `auto` 模式下会继续走其正常的
提供商路径。如果你强制设置 `agentRuntime.id: "codex"`，则该智能体的每个嵌入式
轮次都必须是 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Model providers](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
