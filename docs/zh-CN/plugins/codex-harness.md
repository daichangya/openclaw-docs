---
read_when:
    - 你想使用内置的 Codex 应用服务器测试工具
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 Pi 回退机制
summary: 通过内置的 Codex 应用服务器测试工具运行 OpenClaw 嵌入式智能体轮次
title: Codex 测试工具
x-i18n:
    generated_at: "2026-04-23T16:04:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07e7fb033cd4025e53d65a719bab7bd704335933bf19bfb10648cede42cdee46
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 测试工具

内置的 `codex` 插件让 OpenClaw 通过 Codex 应用服务器运行嵌入式智能体轮次，而不是使用内置的 Pi 测试工具。

当你希望由 Codex 接管底层智能体会话时，请使用此方式：模型发现、原生线程恢复、原生压缩以及应用服务器执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

原生 Codex 轮次也会遵循共享的插件钩子，因此提示词 shim、感知压缩的自动化、工具中间件和生命周期观察器都会与 Pi 测试工具保持一致：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

内置插件还可以注册一个 Codex 应用服务器扩展工厂，以添加异步 `tool_result` 中间件。

该测试工具默认关闭。只有在启用 `codex` 插件且解析后的模型是 `codex/*` 模型时，或者你显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex` 时，才会选中它。
如果你从未配置 `codex/*`，现有的 Pi、OpenAI、Anthropic、Gemini、本地和自定义提供商运行都会保持当前行为。

## 选择正确的模型前缀

OpenClaw 为 OpenAI 访问方式和 Codex 风格的访问方式提供了不同路径：

| 模型引用 | 运行时路径 | 使用场景 |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4` | 通过 OpenClaw/Pi 流程的 OpenAI 提供商 | 你想通过 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。 |
| `openai-codex/gpt-5.4` | 通过 Pi 的 OpenAI Codex OAuth 提供商 | 你想使用 ChatGPT/Codex OAuth，但不使用 Codex 应用服务器测试工具。 |
| `codex/gpt-5.4` | 内置 Codex 提供商加 Codex 测试工具 | 你希望嵌入式智能体轮次使用原生 Codex 应用服务器执行。 |

Codex 测试工具只会接管 `codex/*` 模型引用。现有的 `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、本地和自定义提供商引用都会保持其正常路径。

测试工具选择不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会在该会话上记录所选测试工具的 id，并在同一会话 id 的后续轮次中继续使用它。若你希望未来的会话使用另一种测试工具，请更改 `embeddedHarness` 配置或 `OPENCLAW_AGENT_RUNTIME`；在现有对话于 Pi 和 Codex 之间切换前，请使用 `/new` 或 `/reset` 启动一个新会话。
这样可以避免同一份转录被重放到两个不兼容的原生会话系统中。

在测试工具固定机制引入之前创建的旧会话，一旦已有转录历史，就会被视为固定到 Pi。更改配置后，使用 `/new` 或 `/reset` 可让该对话改为使用 Codex。

`/status` 会在 `Fast` 旁边显示生效的非 Pi 测试工具，例如 `Fast · codex`。默认的 Pi 测试工具不会显示。

## 要求

- OpenClaw，且可使用内置的 `codex` 插件。
- Codex 应用服务器 `0.118.0` 或更高版本。
- 应用服务器进程可用的 Codex 身份验证。

该插件会阻止过旧或未标明版本的应用服务器握手。
这样可以让 OpenClaw 保持在已验证过的协议范围内运行。

对于实时测试和 Docker 冒烟测试，身份验证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex 应用服务器相同的认证材料。

## 最小配置

使用 `codex/gpt-5.4`，启用内置插件，并强制使用 `codex` 测试工具：

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

如果你的配置使用 `plugins.allow`，也要在其中加入 `codex`：

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 时，也会自动启用内置的 `codex` 插件。在共享配置中，显式写出插件条目仍然很有用，因为这能清楚表明部署意图。

## 添加 Codex，但不替换其他模型

如果你希望 `codex/*` 模型使用 Codex，而其他模型仍使用 Pi，请保留 `runtime: "auto"`：

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
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

采用这种配置时：

- `/model codex` 或 `/model codex/gpt-5.4` 会使用 Codex 应用服务器测试工具。
- `/model gpt` 或 `/model openai/gpt-5.4` 会使用 OpenAI 提供商路径。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选择的是非 Codex 模型，Pi 仍然会作为兼容性测试工具。

## 仅使用 Codex 的部署

当你需要证明每一次嵌入式智能体轮次都使用 Codex 测试工具时，请禁用 Pi 回退：

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
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

禁用回退后，如果 Codex 插件被禁用、请求的模型不是 `codex/*` 引用、应用服务器版本过旧，或应用服务器无法启动，OpenClaw 都会尽早失败。

## 按智能体使用 Codex

你可以只让某一个智能体专用 Codex，而默认智能体仍保持正常的自动选择：

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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

使用常规会话命令切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex 测试工具会按需为其创建或恢复配套的应用服务器线程。`/reset` 会清除该线程对应的 OpenClaw 会话绑定，并让下一轮再次根据当前配置解析测试工具。

## 模型发现

默认情况下，Codex 插件会向应用服务器请求可用模型。
如果发现失败或超时，它会使用内置的回退目录：

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

如果你希望启动时避免探测 Codex，并固定使用回退目录，请禁用发现：

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

## 应用服务器连接与策略

默认情况下，插件会用以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex 测试工具会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会因为无人响应的原生审批提示而中断。

如果要启用由 Codex Guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 是原生的 Codex 审批审核器。当 Codex 请求离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给一个审核子智能体，而不是向人工发出提示。审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。如果你希望比 YOLO 模式有更多防护措施，但仍需要无人值守的智能体持续推进，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"` 和 `sandbox: "workspace-write"`。各个策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选项混合使用。

对于已经在运行的应用服务器，请使用 WebSocket 传输：

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
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | `"codex"` | 用于 stdio 传输的可执行文件。 |
| `args` | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url` | 未设置 | WebSocket 应用服务器 URL。 |
| `authToken` | 未设置 | 用于 WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket 标头。 |
| `requestTimeoutMs` | `60000` | 应用服务器控制平面调用的超时时间。 |
| `mode` | `"yolo"` | 用于 YOLO 或 Guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程启动/恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"guardian_subagent"` 让 Codex Guardian 审核提示。 |
| `serviceTier` | 未设置 | 可选的 Codex 应用服务器服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。 |

当对应配置字段未设置时，较旧的环境变量仍可作为本地测试的回退方式：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试时使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，推荐使用配置，
因为这样可以将插件行为与 Codex 测试工具设置的其余部分放在同一个经过审查的文件中。

## 常见用法

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

仅使用 Codex 的测试工具验证，禁用 Pi 回退：

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

带显式标头的远程应用服务器：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的 Codex 线程时，
下一轮会再次将当前选定的 `codex/*` 模型、提供商、审批策略、沙箱和服务层级发送给
应用服务器。从 `codex/gpt-5.4` 切换到 `codex/gpt-5.2` 时，会保留线程绑定，但会要求
Codex 使用新选定的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为授权斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道中使用。

常见形式：

- `/codex status` 显示实时应用服务器连接状态、模型、账户、速率限制、MCP 服务器和 skills。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex 应用服务器压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skills。

`/codex resume` 会写入与测试工具正常轮次所使用的同一个配套绑定文件。
在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw `codex/*`
模型传入应用服务器，并保持启用扩展历史记录。

该命令功能要求 Codex 应用服务器版本为 `0.118.0` 或更高。如果未来版本或自定义的应用服务器
未暴露某个 JSON-RPC 方法，各个控制方法会显示为 `unsupported by this Codex app-server`。

## 工具、媒体与压缩

Codex 测试工具仅改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从测试工具接收动态工具结果。文本、图像、视频、音乐、TTS、
审批和消息工具输出会继续通过正常的 OpenClaw 传递路径处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批请求会通过 OpenClaw 的插件审批流程路由；其他请求输入和自由格式输入请求仍会以失败关闭的方式处理。

当所选模型使用 Codex 测试工具时，原生线程压缩会委托给 Codex 应用服务器。OpenClaw 会保留一份转录镜像，用于渠道历史记录、搜索、`/new`、`/reset`，以及未来的模型或测试工具切换。该镜像包括用户提示、最终助手文本，以及在应用服务器发出时包含轻量级的 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未提供人类可读的压缩摘要，也未提供 Codex 在压缩后保留了哪些条目的可审计列表。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解会继续使用相应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中未显示 Codex：** 启用 `plugins.entries.codex.enabled`，
设置一个 `codex/*` 模型引用，或检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 如果没有 Codex 测试工具接管该运行，
OpenClaw 可能会使用 Pi 作为兼容性后端。测试时设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置
`embeddedHarness.fallback: "none"` 以在没有匹配的插件测试工具时直接失败。
一旦选中了 Codex 应用服务器，它的失败会直接暴露出来，无需额外的回退配置。

**应用服务器被拒绝：** 升级 Codex，使应用服务器握手报告版本
`0.118.0` 或更高。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，
并确认远程应用服务器使用相同的 Codex 应用服务器协议版本。

**非 Codex 模型使用了 Pi：** 这是预期行为。Codex 测试工具只会接管
`codex/*` 模型引用。

## 相关内容

- [智能体测试工具插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
