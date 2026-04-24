---
read_when:
    - 你想要使用内置的 Codex app-server harness
    - 你需要 Codex 模型引用和配置示例
    - 你想要为仅使用 Codex 的部署禁用 PI 回退
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-24T03:18:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6185e11a7f04957548465a500c2cc1eb85237787103e4a507225bb890566e077
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server，而不是内置的 PI harness，来运行嵌入式智能体轮次。

当你希望由 Codex 接管底层智能体会话时，请使用此方式：模型发现、原生线程恢复、原生压缩以及 app-server 执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、批准、媒体传输，以及可见的 transcript 镜像。

原生 Codex 轮次会保留 OpenClaw 插件钩子作为公共兼容层。
这些是 OpenClaw 进程内钩子，而不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- 用于镜像 transcript 记录的 `before_message_write`
- `agent_end`

内置插件还可以注册一个 Codex app-server 扩展工厂，以添加异步 `tool_result` 中间件。
该中间件会在 OpenClaw 执行完工具之后、结果返回给 Codex 之前，对 OpenClaw 动态工具运行。
它不同于公共 `tool_result_persist` 插件钩子；后者会转换由 OpenClaw 拥有的 transcript 工具结果写入。

该 harness 默认关闭。新配置应将 OpenAI 模型引用保持为规范形式 `openai/gpt-*`，并在希望使用原生 app-server 执行时，显式强制设置
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
出于兼容性考虑，旧版 `codex/*` 模型引用仍会自动选择该 harness。

## 选择正确的模型前缀

OpenAI 系列路由对前缀很敏感。当你希望通过 PI 使用 Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接使用 OpenAI API 访问，或者你正在强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| 模型引用                                              | 运行时路径                                  | 适用场景                                                                  |
| ----------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | 通过 OpenClaw / PI 管线的 OpenAI provider   | 你希望使用 `OPENAI_API_KEY` 访问当前的 OpenAI Platform API。              |
| `openai-codex/gpt-5.5`                                | 通过 OpenClaw / PI 的 OpenAI Codex OAuth    | 你希望使用 ChatGPT / Codex 订阅 auth，并使用默认的 PI runner。            |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                    | 你希望嵌入式智能体轮次使用原生 Codex app-server 执行。                    |

GPT-5.5 目前在 OpenClaw 中仅支持订阅 / OAuth。
如需 PI OAuth，请使用 `openai-codex/gpt-5.5`；如需 Codex
app-server harness，请使用 `openai/gpt-5.5`。
一旦 OpenAI 在公共 API 上启用 GPT-5.5，就会支持对 `openai/gpt-5.5` 的直接 API key 访问。

旧版 `codex/gpt-*` 引用仍然接受，作为兼容性别名。
新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server
harness 配置应使用 `openai/gpt-*`，并配合 `embeddedHarness.runtime:
"codex"`。

`agents.defaults.imageModel` 也遵循同样的前缀区分。
当图像理解应通过 OpenAI Codex OAuth provider 路径运行时，使用
`openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 轮次运行时，使用
`codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；仅文本的 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 来确认当前会话的实际 harness。
如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 gateway 的结构化 `agent harness selected` 记录。
其中包含已选择的 harness id、选择原因、runtime / fallback 策略，以及在 `auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。
当嵌入式轮次运行时，OpenClaw 会在该会话上记录已选择的 harness id，并在同一会话 id 的后续轮次中继续使用它。
如果你希望未来会话使用另一个 harness，请更改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在将现有对话从 PI 切换到 Codex 或反向切换之前，请使用 `/new` 或 `/reset` 启动一个新会话。
这样可以避免让同一份 transcript 在两个不兼容的原生会话系统之间重放。

在引入 harness pin 之前创建的旧会话，只要已有 transcript 历史，就会被视为固定到 PI。
更改配置后，请使用 `/new` 或 `/reset`，以让该对话切换到 Codex。

`/status` 会在 `Fast` 旁边显示实际生效的非 PI harness，例如
`Fast · codex`。默认 PI harness 仍显示为 `Runner: pi (embedded)`，不会额外添加单独的 harness 标记。

## 要求

- 可使用内置 `codex` 插件的 OpenClaw。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex auth。

该插件会阻止较旧或未带版本的 app-server 握手。
这样可以确保 OpenClaw 始终运行在它已测试过的协议表面上。

对于 live 和 Docker 冒烟测试，auth 通常来自 `OPENAI_API_KEY`，外加可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。
请使用与你本地 Codex app-server 相同的 auth 材料。

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
        fallback: "none",
      },
    },
  },
}
```

如果你的配置使用了 `plugins.allow`，也请将 `codex` 包含进去：

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

如果旧版配置将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>`，仍会自动启用内置 `codex` 插件。
新配置应优先使用 `openai/<model>`，并配合上面的显式 `embeddedHarness` 条目。

## 添加 Codex，而不替换其他模型

如果你希望旧版 `codex/*` 引用选择 Codex，而其他所有模型仍使用 PI，请保留 `runtime: "auto"`。
对于新配置，更推荐在应使用该 harness 的智能体上显式设置 `runtime: "codex"`。

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
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

在这种配置下：

- `/model gpt` 或 `/model openai/gpt-5.5` 会为该配置使用 Codex app-server harness。
- `/model opus` 使用 Anthropic provider 路径。
- 如果选择了非 Codex 模型，PI 仍然是兼容性 harness。

## 仅使用 Codex 的部署

如果你需要证明每个嵌入式智能体轮次都使用 Codex harness，请禁用 PI 回退：

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

环境变量覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果 Codex 插件被禁用、app-server 版本过旧，或 app-server 无法启动，OpenClaw 会提前失败。

## 按智能体使用 Codex

你可以让某个智能体仅使用 Codex，而默认智能体仍保留正常的自动选择：

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

使用正常的会话命令切换智能体和模型。
`/new` 会创建一个新的 OpenClaw 会话，而 Codex harness 会按需创建或恢复其 sidecar app-server 线程。
`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮根据当前配置重新解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 查询可用模型。
如果发现失败或超时，它会使用一个内置的回退目录，包含：

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

如果你希望启动时避免探测 Codex，并固定使用回退目录，可以禁用发现：

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

## App-server 连接和策略

默认情况下，插件会通过以下方式在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。
这是用于自主 heartbeat 的受信任本地运维姿态：Codex 可以使用 shell 和网络工具，而不会停下来等待原生批准提示，因为现场没有人来回答。

如果你想选择加入由 Codex guardian 审核的批准，请设置 `appServer.mode:
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

Guardian 是原生 Codex 批准审核者。
当 Codex 请求离开沙箱、在工作区之外写入，或添加诸如网络访问之类的权限时，Codex 会将该批准请求路由给审核子智能体，而不是向人类提示。
审核者会应用 Codex 的风险框架，并批准或拒绝该具体请求。
如果你希望获得比 YOLO 模式更多的护栏，但仍需要无人值守的智能体持续推进，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"` 和 `sandbox: "workspace-write"`。
各个策略字段仍然可以覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。

对于一个已经在运行的 app-server，请使用 WebSocket 传输：

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

| 字段                  | 默认值                                   | 含义                                                                                                     |
| --------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `transport`           | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                   |
| `command`             | `"codex"`                                | 用于 stdio 传输的可执行文件。                                                                            |
| `args`                | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                                  |
| `url`                 | 未设置                                   | WebSocket app-server URL。                                                                               |
| `authToken`           | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                     |
| `headers`             | `{}`                                     | 额外的 WebSocket headers。                                                                               |
| `requestTimeoutMs`    | `60000`                                  | app-server 控制平面调用的超时时间。                                                                      |
| `mode`                | `"yolo"`                                 | 用于 YOLO 或 guardian 审核执行的预设。                                                                   |
| `approvalPolicy`      | `"never"`                                | 发送到线程 start / resume / turn 的原生 Codex 批准策略。                                                 |
| `sandbox`             | `"danger-full-access"`                   | 发送到线程 start / resume 的原生 Codex 沙箱模式。                                                        |
| `approvalsReviewer`   | `"user"`                                 | 使用 `"guardian_subagent"` 可让 Codex Guardian 审核提示。                                                |
| `serviceTier`         | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。                    |

较旧的环境变量在对应配置字段未设置时，仍可作为本地测试的回退：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性的本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复的部署，更推荐使用配置，因为这样可以将插件行为与 Codex harness 的其余设置保存在同一个经过审查的文件中。

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

仅使用 Codex 的 harness 验证，禁用 PI 回退：

```json5
{
  embeddedHarness: {
    fallback: "none",
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

由 Guardian 审核的 Codex 批准：

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

带显式 headers 的远程 app-server：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有 Codex 线程时，下一轮会再次将当前选定的 OpenAI 模型、provider、批准策略、sandbox 和服务层级发送给 app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 时，会保留线程绑定，但会要求 Codex 使用新选择的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为授权斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道上工作。

常见形式：

- `/codex status` 显示实时 app-server 连接性、模型、账户、速率限制、MCP 服务器和技能。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server skills。

`/codex resume` 会写入与 harness 正常轮次使用的同一个 sidecar 绑定文件。在下一条消息时，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传给 app-server，并继续启用扩展历史记录。

该命令表面要求 Codex app-server `0.118.0` 或更高版本。如果未来或自定义 app-server 未暴露某个 JSON-RPC 方法，各个控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 在 PI 和 Codex harness 之间提供产品 / 插件兼容性。                 |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐轮适配器行为。                            |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。               |

OpenClaw 不会使用项目级或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。Codex 原生钩子适用于由 Codex 拥有的操作，例如 shell 策略、原生工具结果审查、停止处理以及原生压缩 / 模型生命周期，但它们不是 OpenClaw 插件 API。

对于 OpenClaw 动态工具，Codex 请求调用之后，由 OpenClaw 执行工具，因此 OpenClaw 会在 harness 适配器中触发它所拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范的工具记录。OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调暴露该操作，否则 OpenClaw 无法改写原生 Codex 线程。

当较新的 Codex app-server 构建暴露原生压缩和模型生命周期钩子事件时，OpenClaw 应按版本控制该协议支持，并在语义真实的前提下将这些事件映射到现有的 OpenClaw 钩子契约中。在那之前，OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件属于适配器层观察，并不是对 Codex 内部请求或压缩载荷的逐字节捕获。

## 工具、媒体和压缩

Codex harness 只会改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、批准以及消息工具输出，仍然通过正常的 OpenClaw 传输路径处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具批准征询会通过 OpenClaw 的插件批准流程路由；其他征询和自由形式输入请求仍然会保持故障关闭。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留 transcript 镜像，用于渠道历史、搜索、`/new`、`/reset`，以及将来切换模型或 harness。该镜像包含用户提示、最终助手文本，以及当 app-server 发出这些信息时的轻量 Codex reasoning 或 plan 记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未提供可供人阅读的压缩摘要，也尚未提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 目前不会改写 Codex 原生工具结果记录。它仅在 OpenClaw 写入 OpenClaw 自有会话 transcript 工具结果时适用。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解仍然继续使用相应的 provider / model 设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 启用 `plugins.entries.codex.enabled`，选择带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用了 PI 而不是 Codex：** 如果没有 Codex harness 声明该运行，OpenClaw 可能会使用 PI 作为兼容性后端。测试时请设置
`embeddedHarness.runtime: "codex"` 来强制选择 Codex，或者设置
`embeddedHarness.fallback: "none"` 以便在没有匹配插件 harness 时直接失败。一旦选择了 Codex app-server，它的失败会直接暴露出来，而无需额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告版本
`0.118.0` 或更高。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 这是预期行为，除非你强制设置了
`embeddedHarness.runtime: "codex"`（或选择了旧版 `codex/*` 引用）。普通的
`openai/gpt-*` 和其他 provider 引用会继续使用其正常的 provider 路径。

## 相关

- [Agent Harness Plugins](/zh-CN/plugins/sdk-agent-harness)
- [Model Providers](/zh-CN/concepts/model-providers)
- [Configuration Reference](/zh-CN/gateway/configuration-reference)
- [Testing](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
