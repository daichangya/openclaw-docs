---
read_when:
    - 你想使用内置的 Codex 应用服务器测试工具
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 Pi 回退机制
summary: 通过内置的 Codex 应用服务器测试工具运行 OpenClaw 嵌入式智能体轮次
title: Codex 测试工具
x-i18n:
    generated_at: "2026-04-23T19:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 323ee3e0f4b78017e325288247c025403fc55216059a71e2596acdaaf56e7b25
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 测试工具

内置的 `codex` 插件让 OpenClaw 通过 Codex 应用服务器而不是内置的 Pi 测试工具来运行嵌入式智能体轮次。

当你希望 Codex 接管底层智能体会话时使用它：模型发现、原生线程恢复、原生压缩，以及应用服务器执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

原生 Codex 轮次同样会遵循共享插件钩子，因此提示词垫片、感知压缩的自动化、工具中间件和生命周期观察器都能与 Pi 测试工具保持一致：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

内置插件还可以注册一个 Codex 应用服务器扩展工厂，以添加异步 `tool_result` 中间件。

该测试工具默认关闭。新配置应保持 OpenAI 模型引用的规范形式为 `openai/gpt-*`，并在需要原生应用服务器执行时显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会为了兼容性自动选择该测试工具。

## 选择正确的模型前缀

OpenClaw 现在将 OpenAI GPT 模型引用的规范形式统一为 `openai/*`：

| 模型引用 | 运行时路径 | 适用场景 |
| ----------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.5` | 通过 OpenClaw/Pi 管线的 OpenAI 提供商 | 你希望使用 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex 应用服务器测试工具 | 你希望对嵌入式智能体轮次使用原生 Codex 应用服务器执行。 |

旧版 `openai-codex/gpt-*` 和 `codex/gpt-*` 引用仍然被接受为兼容别名，但新的文档和配置示例应使用 `openai/gpt-*`。

测试工具选择并不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会在该会话上记录所选测试工具的 id，并在同一会话 id 的后续轮次中继续使用它。当你希望未来的会话使用另一个测试工具时，请更改 `embeddedHarness` 配置或 `OPENCLAW_AGENT_RUNTIME`；在将现有对话从 Pi 切换到 Codex 之前，使用 `/new` 或 `/reset` 启动一个新的会话。这可以避免通过两个不兼容的原生会话系统重放同一份转录内容。

在测试工具固定机制出现之前创建的旧会话，一旦具有转录历史，就会被视为固定到 Pi。在更改配置后，使用 `/new` 或 `/reset` 可让该对话改为使用 Codex。

`/status` 会在 `Fast` 旁边显示生效的非 Pi 测试工具，例如 `Fast · codex`。默认的 Pi 测试工具不会显示。

## 要求

- OpenClaw，且内置的 `codex` 插件可用。
- Codex 应用服务器 `0.118.0` 或更高版本。
- 应用服务器进程可用的 Codex 认证信息。

该插件会阻止较旧版本或无版本的应用服务器握手。这可确保 OpenClaw 只运行在已经过测试的协议表面上。

对于实时测试和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex 应用服务器相同的认证材料。

## 最小配置

使用 `openai/gpt-5.5`，启用内置插件，并强制使用 `codex` 测试工具：

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 的旧配置仍会自动启用内置的 `codex` 插件。新配置应优先使用 `openai/<model>`，并搭配上面的显式 `embeddedHarness` 条目。

## 在不替换其他模型的情况下添加 Codex

当你希望旧版 `codex/*` 引用选择 Codex，而其他所有情况都使用 Pi 时，请保持 `runtime: "auto"`。对于新配置，更推荐只在需要使用该测试工具的智能体上显式设置 `runtime: "codex"`。

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

- `/model gpt` 或 `/model openai/gpt-5.5` 会为此配置使用 Codex 应用服务器测试工具。
- `/model opus` 使用 Anthropic 提供商路径。
- 如果选择了非 Codex 模型，Pi 仍然是兼容性测试工具。

## 仅使用 Codex 的部署

当你需要证明每一个嵌入式智能体轮次都使用 Codex 测试工具时，请禁用 Pi 回退：

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

禁用回退后，如果 Codex 插件被禁用、应用服务器版本过旧，或应用服务器无法启动，OpenClaw 会尽早失败。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体继续保持普通的自动选择：

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

使用正常的会话命令切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex 测试工具会按需创建或恢复其 sidecar 应用服务器线程。`/reset` 会清除 OpenClaw 对该线程的会话绑定，并让下一轮再次根据当前配置解析测试工具。

## 模型发现

默认情况下，`codex` 插件会向应用服务器请求可用模型。如果发现失败或超时，它会使用内置的回退目录，其中包含：

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

当你希望启动时避免探测 Codex，并固定使用回退目录时，可以禁用发现：

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

默认情况下，插件会在本地通过以下命令启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex 测试工具会话：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在无人应答的原生审批提示上。

若要启用由 Codex Guardian 审核的审批，请设置 `appServer.mode: "guardian"`：

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

Guardian 是原生的 Codex 审批审查者。当 Codex 请求离开沙箱、在工作区外写入，或添加网络访问之类的权限时，Codex 会将该审批请求路由给审查子智能体，而不是向人类发出提示。审查者会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你希望获得比 YOLO 模式更多的护栏，同时仍需要无人值守的智能体持续推进工作时，请使用 Guardian。

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
| `transport` | `"stdio"` | `"stdio"` 会生成 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | `"codex"` | 用于 stdio 传输的可执行文件。 |
| `args` | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url` | 未设置 | WebSocket 应用服务器 URL。 |
| `authToken` | 未设置 | 用于 WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket 请求头。 |
| `requestTimeoutMs` | `60000` | 应用服务器控制平面调用的超时时间。 |
| `mode` | `"yolo"` | 用于 YOLO 或 Guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程启动/恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"guardian_subagent"` 可让 Codex Guardian 审核提示。 |
| `serviceTier` | 未设置 | 可选的 Codex 应用服务器服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。 |

较早的环境变量在对应配置字段未设置时，仍可作为本地测试的回退方式使用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性的本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置方式，因为这样可以将插件行为与 Codex 测试工具其余设置放在同一个经过审查的文件中。

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

仅使用 Codex 的测试工具验证，且禁用 Pi 回退：

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

模型切换仍由 OpenClaw 控制。当某个 OpenClaw 会话附加到现有的 Codex 线程时，下一轮会再次将当前选定的 OpenAI 模型、提供商、审批策略、沙箱和服务层级发送给应用服务器。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会请求 Codex 使用新选择的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用命令，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时的应用服务器连接状态、模型、账户、速率限制、MCP 服务器和技能。
- `/codex models` 列出实时的 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex 应用服务器压缩当前附加的线程。
- `/codex review` 为当前附加的线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skills。

`/codex resume` 会写入与测试工具正常轮次相同的 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw `codex/*` 模型传入应用服务器，并保持启用扩展历史记录。

该命令面要求 Codex 应用服务器版本为 `0.118.0` 或更高。如果未来版本或自定义应用服务器未暴露某个 JSON-RPC 方法，则各个控制方法会显示为 `unsupported by this Codex app-server`。

## 工具、媒体与压缩

Codex 测试工具只改变底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从测试工具接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，都会继续通过普通的 OpenClaw 传递路径处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批请求会通过 OpenClaw 的插件审批流程路由；其他请求获取输入和自由格式输入请求仍然会以默认拒绝方式失败。

当所选模型使用 Codex 测试工具时，原生线程压缩会委托给 Codex 应用服务器。OpenClaw 会保留一份转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或测试工具切换。该镜像包括用户提示、最终助手文本，以及应用服务器发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩的开始和完成信号。它尚未提供人类可读的压缩摘要，也未提供 Codex 在压缩后保留了哪些条目的可审计列表。

媒体生成不依赖 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍会继续使用相应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有显示 Codex：** 启用 `plugins.entries.codex.enabled`，设置 `codex/*` 模型引用，或检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 如果没有 Codex 测试工具接管本次运行，OpenClaw 可能会使用 Pi 作为兼容性后端。测试时请设置 `embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置 `embeddedHarness.fallback: "none"` 以在没有匹配插件测试工具时直接失败。一旦选择了 Codex 应用服务器，其失败会直接暴露出来，而不会再经过额外的回退配置。

**应用服务器被拒绝：** 升级 Codex，使应用服务器握手报告版本为 `0.118.0` 或更高。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现功能。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程应用服务器是否使用相同版本的 Codex 应用服务器协议。

**非 Codex 模型使用了 Pi：** 这是预期行为。Codex 测试工具只会接管 `codex/*` 模型引用。

## 相关内容

- [智能体测试工具插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
