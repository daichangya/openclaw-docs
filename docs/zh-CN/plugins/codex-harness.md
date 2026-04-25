---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 Pi
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-04-25T23:54:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 388e4c015e6af99a9c9184539f4a5fa2bcc828f26a7470a338e8398e0cec1a5f
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server，而不是内置的 Pi harness，来运行嵌入式智能体回合。

当你希望 Codex 接管底层智能体会话时，请使用此功能：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及用户可见的转录镜像。

如果你正在熟悉相关概念，请先阅读
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简而言之：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

原生 Codex 回合会将 OpenClaw 插件钩子保留为公开兼容层。
这些是进程内的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像转录记录
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公开的
`tool_result_persist` 插件钩子不同，后者用于转换由 OpenClaw 拥有的转录工具结果写入。

关于插件钩子语义本身，请参阅 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为
`openai/gpt-*`，并在需要原生 app-server 执行时，显式强制指定
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
旧版 `codex/*` 模型引用仍会为了兼容性自动选择该 harness，但由运行时支持的旧版提供商前缀不会显示为普通的模型/提供商选项。

## 选择正确的模型前缀

OpenAI 系列路由依赖特定前缀。当你想通过 Pi 使用 Codex OAuth 时，请使用
`openai-codex/*`；当你想直接使用 OpenAI API 访问，或者你正在强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| Model ref                                             | 运行时路径                                 | 适用场景                                                                  |
| ----------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | 通过 OpenClaw/Pi 流程的 OpenAI provider | 你希望使用带有 `OPENAI_API_KEY` 的当前直接 OpenAI Platform API 访问。 |
| `openai-codex/gpt-5.5`                                | 通过 OpenClaw/Pi 的 OpenAI Codex OAuth | 你希望使用带有默认 Pi 运行器的 ChatGPT/Codex 订阅身份验证。      |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                   | 你希望嵌入式智能体回合使用原生 Codex app-server 执行。   |

GPT-5.5 目前在 OpenClaw 中仅支持订阅/OAuth 方式。请使用
`openai-codex/gpt-5.5` 进行 Pi OAuth，或者将 `openai/gpt-5.5` 与 Codex
app-server harness 搭配使用。对于 `openai/gpt-5.5` 的直接 API 密钥访问，会在 OpenAI 为公共 API 启用 GPT-5.5 后获得支持。

旧版 `codex/gpt-*` 引用仍然作为兼容别名被接受。Doctor 兼容迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅用于回退的旧版引用则保持不变，因为运行时是针对整个智能体容器配置的。
新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
app-server harness 配置应使用 `openai/gpt-*`，并加上
`embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 遵循相同的前缀划分。当图像理解应通过
OpenAI Codex OAuth 提供商路径运行时，请使用 `openai-codex/gpt-*`。
当图像理解应通过受限的 Codex app-server 回合运行时，请使用
`codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本
Codex 模型会在媒体回合开始前失败。

使用 `/status` 来确认当前会话的实际 harness。如果选择结果出乎意料，请为
`agents/harness` 子系统启用调试日志，并检查 Gateway 网关 中结构化的
`agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。当一个嵌入式回合运行时，OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的后续回合中继续使用它。当你希望未来的会话使用另一个 harness 时，请更改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在将现有对话于 Pi 和 Codex 之间切换之前，请使用 `/new` 或 `/reset` 启动一个新会话。这可以避免通过两套不兼容的原生会话系统重放同一份转录。

在引入 harness 固定机制之前创建的旧版会话，只要已经有转录历史，就会被视为固定到 Pi。更改配置后，请使用 `/new` 或 `/reset` 让该对话切换到 Codex。

`/status` 会显示实际模型运行时。默认的 Pi harness 显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，并且内置的 `codex` 插件可用。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理一个兼容的
  Codex app-server 二进制文件，因此 `PATH` 上本地的 `codex` 命令不会影响正常的 harness 启动。
- app-server 进程可用的 Codex 身份验证。

该插件会阻止较旧或无版本的 app-server 握手。这样可以确保
OpenClaw 始终运行在它已经测试过的协议接口上。

对于 live 和 Docker 冒烟测试，身份验证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的身份验证材料。

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
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

如果你的配置使用了 `plugins.allow`，也要把 `codex` 包含进去：

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

旧配置如果将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>`，仍会自动启用内置的 `codex` 插件。新配置应优先使用
`openai/<model>`，并搭配上面的显式 `embeddedHarness` 条目。

## 将 Codex 与其他模型一起添加

如果同一个智能体需要在 Codex 和非 Codex 提供商模型之间自由切换，请不要全局设置 `runtime: "codex"`。被强制指定的运行时会应用到该智能体或会话的每一个嵌入式回合。如果你在强制该运行时时选择了一个 Anthropic 模型，OpenClaw 仍会尝试使用 Codex harness，并会以关闭式失败，而不会悄悄通过 Pi 路由该回合。

请改用以下其中一种形式：

- 将 Codex 放在一个专用智能体上，并设置 `embeddedHarness.runtime: "codex"`。
- 将默认智能体保留为 `runtime: "auto"`，并为常规混合提供商使用保留
  Pi 回退。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用 `openai/*`，再配合显式的 Codex 运行时策略。

例如，下面的配置会让默认智能体保持普通自动选择，同时添加一个单独的
Codex 智能体：

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
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

使用这种形式时：

- 默认的 `main` 智能体使用普通提供商路径和 Pi 兼容回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该回合会失败，
  而不是悄悄使用 Pi。

## 仅 Codex 部署

当你需要证明每一个嵌入式智能体回合都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不使用 Pi 回退，因此
`fallback: "none"` 是可选的，但通常作为文档说明很有用：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
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

当强制使用 Codex 时，如果 Codex 插件被禁用、app-server 版本过旧，或者
app-server 无法启动，OpenClaw 会尽早失败。仅当你明确希望由 Pi 处理缺失的 harness 选择时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 每个智能体单独配置 Codex

你可以让某一个智能体仅使用 Codex，同时让默认智能体保留正常的自动选择：

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

使用普通会话命令来切换智能体和模型。`/new` 会创建一个新的 OpenClaw
会话，而 Codex harness 会根据需要创建或恢复它的 sidecar app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一回合再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 查询可用模型。如果发现失败或超时，它会使用内置的回退目录，其中包括：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以在 `plugins.entries.codex.config.discovery` 下调整发现设置：

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

当你希望启动时避免探测 Codex，并始终使用回退目录时，可以禁用发现：

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

默认情况下，插件会在本地使用以下命令启动由 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

该受管二进制文件被声明为内置插件运行时依赖，并与 `codex` 插件的其余依赖一起暂存。这样可以将 app-server 版本绑定到内置插件，而不是绑定到本地碰巧安装的某个独立 Codex CLI。只有在你明确想运行不同可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自治心跳的受信任本地操作员姿态：
Codex 可以使用 shell 和网络工具，而不会停在无人应答的原生审批提示上。

如果要启用由 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自动审核审批路径。当 Codex 请求离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给原生审核器，而不是发起人工提示。审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你希望比 YOLO 模式有更多防护措施，但仍需要无人值守的智能体持续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
单独的策略字段仍然会覆盖 `mode`，因此高级部署可以将该预设与显式选项混合使用。较旧的 `guardian_subagent` 审核器值仍然接受为兼容别名，但新配置应使用
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

| Field               | 默认值                                   | 含义                                                                                                      |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                     |
| `command`           | 受管 Codex 二进制文件                    | 用于 stdio 传输的可执行文件。保持未设置以使用受管二进制文件；仅在明确覆盖时设置。 |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                               |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                    |
| `authToken`         | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                        |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                                                     |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                  |
| `mode`              | `"yolo"`                                 | 用于 YOLO 或 Guardian 审核执行的预设。                                                              |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/回合的原生 Codex 审批策略。                                               |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                       |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生审批提示。`guardian_subagent` 仍然是旧版别名。 |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。    |

环境覆盖对于本地测试仍然可用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过受管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复的部署，推荐使用配置，因为它会将插件行为保存在与 Codex harness 其余设置相同且经过审查的文件中。

## 常见配置示例

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
      embeddedHarness: {
        runtime: "codex",
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

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到现有 Codex 线程时，下一回合会再次向 app-server 发送当前选定的
OpenAI 模型、提供商、审批策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会请求 Codex 使用新选定的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为授权的斜杠命令。它是通用的，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审核。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 正常回合所使用的相同 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持扩展历史记录启用。

该命令界面要求 Codex app-server `0.125.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，则单独的控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| Layer                                 | 所有者                    | 用途                                                             |
| ------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                  | 在 Pi 和 Codex harness 之间提供产品/插件兼容性。         |
| Codex app-server extension middleware | OpenClaw 内置插件         | 围绕 OpenClaw 动态工具的每回合适配器行为。            |
| Codex native hooks                    | Codex                     | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。 |

OpenClaw 不会使用项目级或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，OpenClaw 会为
`PreToolUse`、`PostToolUse` 和 `PermissionRequest` 注入每线程的 Codex 配置。其他 Codex 钩子，例如 `SessionStart`、
`UserPromptSubmit` 和 `Stop`，仍然属于 Codex 级控制；它们在 v1 合约中不会作为 OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，Codex 请求调用后由 OpenClaw 执行该工具，因此
OpenClaw 会在 harness 适配器中触发它所拥有的插件和中间件行为。对于
Codex 原生工具，Codex 拥有规范工具记录。OpenClaw 可以镜像选定事件，但无法改写原生 Codex 线程，除非 Codex 通过 app-server 或原生钩子回调暴露该操作。

压缩和 LLM 生命周期投影来自 Codex app-server 通知以及 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的
`before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级观察结果，而不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为用于轨迹和调试的 `codex_app_server.hook` 智能体事件。
它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式不是“仅仅把底层模型调用换掉的 Pi”。Codex 拥有更多原生模型循环控制权，而 OpenClaw 会围绕这个边界适配它的插件和会话界面。

Codex 运行时 v1 支持的内容：

| Surface                                       | 支持情况                                 | 原因                                                                                                                                                                                                   |
| --------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                     | Codex app-server 负责 OpenAI 回合、原生线程恢复和原生工具续接。                                                                                                                                    |
| OpenClaw 渠道路由与传递                       | 支持                                     | Telegram、Discord、Slack、WhatsApp、iMessage 以及其他渠道仍然独立于模型运行时之外。                                                                                                               |
| OpenClaw 动态工具                             | 支持                                     | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍然处于执行路径中。                                                                                                                            |
| 提示词和上下文插件                            | 支持                                     | OpenClaw 会先构建提示词叠加层并将上下文投射到 Codex 回合中，然后再启动或恢复线程。                                                                                                               |
| 上下文引擎生命周期                            | 支持                                     | 组装、摄取或回合后维护，以及上下文引擎压缩协调，都会为 Codex 回合运行。                                                                                                                           |
| 动态工具钩子                                  | 支持                                     | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕由 OpenClaw 拥有的动态工具运行。                                                                                                     |
| 生命周期钩子                                  | 作为适配器观察结果提供支持               | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式负载触发。                                                                             |
| 原生 shell、patch 和 MCP 的阻止或观察         | 通过原生钩子中继支持                     | 已提交的原生工具界面的 Codex `PreToolUse` 和 `PostToolUse` 会被中继，包括 Codex app-server `0.125.0` 或更高版本上的 MCP 负载。支持阻止；不支持参数改写。 |
| 原生权限策略                                  | 通过原生钩子中继支持                     | 当运行时暴露该能力时，Codex `PermissionRequest` 可以通过 OpenClaw 策略进行路由。如果 OpenClaw 不返回决策，Codex 会继续走它正常的 Guardian 或用户审批路径。     |
| app-server 轨迹捕获                           | 支持                                     | OpenClaw 会记录它发送给 app-server 的请求，以及它收到的 app-server 通知。                                                                                                                       |

Codex 运行时 v1 中不支持的内容：

| Surface                                             | V1 边界                                                                                                                                      | 未来路径                                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 原生工具参数修改                                    | Codex 原生 pre-tool 钩子可以阻止，但 OpenClaw 不会改写 Codex 原生工具参数。                                                                  | 需要 Codex 钩子/模式支持替换工具输入。                            |
| 可编辑的 Codex 原生转录历史                         | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像，并且可以投射未来上下文，但不应修改不受支持的内部实现。 | 如果需要对原生线程进行操作，则添加显式 Codex app-server API。                    |
| 用于 Codex 原生工具记录的 `tool_result_persist`     | 该钩子会转换由 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。                                                                            | 可以镜像转换后的记录，但规范改写需要 Codex 支持。              |
| 丰富的原生压缩元数据                                | OpenClaw 可以观察压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 变化量或摘要负载。                                                      | 需要更丰富的 Codex 压缩事件。                                                     |
| 压缩干预                                            | 当前 OpenClaw 的压缩钩子在 Codex 模式下仅为通知级别。                                                                                          | 如果插件需要否决或改写原生压缩，则添加 Codex 压缩前/后钩子。 |
| 停止或最终答案门控                                  | Codex 有原生停止钩子，但 OpenClaw 不会将最终答案门控作为 v1 插件合约暴露。                                                                     | 未来提供带有循环和超时保护的可选原语。                                 |
| 按字节级别捕获模型 API 请求                         | OpenClaw 可以捕获 app-server 请求和通知，但 Codex 核心会在内部构建最终的 OpenAI API 请求。                                                    | 需要 Codex 模型请求跟踪事件或调试 API。                                   |

## 工具、媒体与压缩

Codex harness 只改变底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出会继续通过正常的 OpenClaw 传递路径处理。

原生钩子中继刻意保持通用，但 v1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP 的
`PreToolUse`、`PostToolUse` 和 `PermissionRequest` 负载。在运行时合约明确命名前，请不要假设未来的每个 Codex 钩子事件都是 OpenClaw 插件界面。

对于 `PermissionRequest`，只有当策略做出决定时，OpenClaw 才会返回明确的允许或拒绝决策。无决策结果并不等于允许。Codex 会将其视为没有钩子决策，并继续走它自己的 Guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批请求会通过 OpenClaw 的插件审批流程进行路由。Codex `request_user_input` 提示会被发送回发起该请求的聊天中，而下一个排队的后续消息将回答该原生服务器请求，而不是被作为额外上下文引导。其他 MCP 请求仍会以关闭式失败。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包含用户提示、最终助手文本，以及当 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未提供人类可读的压缩摘要，也无法提供一份可审计的条目列表来说明 Codex 在压缩后保留了哪些内容。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会改写
Codex 原生工具结果记录。它仅在 OpenClaw 正在写入由 OpenClaw 拥有的会话转录工具结果时适用。

媒体生成不依赖 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍将继续使用匹配的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 没有显示为普通的 `/model` 提供商：** 这对新配置来说是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`embeddedHarness.runtime: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用了 Pi 而不是 Codex：** 当没有 Codex harness 声明该运行时，`runtime: "auto"` 仍然可以使用 Pi 作为兼容后端。测试时请设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex。现在，强制使用
Codex 运行时会直接失败，而不是回退到 Pi，除非你显式设置
`embeddedHarness.fallback: "pi"`。一旦选择了 Codex app-server，它的失败将直接暴露出来，而不会有额外的回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手报告版本
`0.125.0` 或更高。相同版本号的预发布版本或带构建后缀的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为稳定版
`0.125.0` 协议下限才是 OpenClaw 测试所依据的版本。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程
app-server 是否使用相同版本的 Codex app-server 协议。

**某个非 Codex 模型使用了 Pi：** 这是预期行为，除非你为该智能体强制设置了
`embeddedHarness.runtime: "codex"`，或选择了旧版 `codex/*` 引用。普通的
`openai/gpt-*` 和其他提供商引用在 `auto` 模式下会保持其正常的提供商路径。如果你强制设置 `runtime: "codex"`，该智能体的每个嵌入式回合都必须是 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Model providers](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [Configuration reference](/zh-CN/gateway/configuration-reference)
- [Testing](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
