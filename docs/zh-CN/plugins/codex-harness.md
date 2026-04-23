---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 PI 回退
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-23T22:59:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f226a959bfbc860bd239d14f8363808dbb6a1e46e5475d0bd9b36b6837d6bba1
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件允许 OpenClaw 通过 Codex app-server，而不是内置的 PI harness，来运行嵌入式智能体轮次。

当你希望由 Codex 接管底层智能体会话时，可以使用它：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见的转录镜像。

原生 Codex 轮次也会遵循共享插件钩子，因此 prompt shim、具备 compaction 感知的自动化、工具中间件以及生命周期观察器都能与 PI harness 保持一致：

- `before_prompt_build`
- `before_compaction`、`after_compaction`
- `llm_input`、`llm_output`
- `tool_result`、`after_tool_call`
- `before_message_write`
- `agent_end`

内置插件还可以注册一个 Codex app-server 扩展工厂，以添加异步 `tool_result` 中间件。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为 `openai/gpt-*`，并在希望使用原生 app-server 执行时，显式强制设置
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会自动选择该 harness，以保持兼容性。

## 选择正确的模型前缀

OpenAI 系列路由对前缀非常敏感。当你希望通过 PI 使用 Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接使用 OpenAI API 访问，或者你正在强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| 模型引用 | 运行时路径 | 使用场景 |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | 通过 OpenClaw/PI 管线的 OpenAI 提供商 | 你希望使用 `OPENAI_API_KEY` 访问当前直接可用的 OpenAI Platform API。 |
| `openai-codex/gpt-5.5` | 通过 OpenClaw/PI 的 OpenAI Codex OAuth | 你希望使用 ChatGPT/Codex 订阅凭证，并采用默认 PI runner。 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | 你希望对嵌入式智能体轮次使用原生 Codex app-server 执行。 |

在当前 OpenClaw 中，GPT-5.5 仅支持订阅/OAuth。PI OAuth 请使用
`openai-codex/gpt-5.5`，或者使用 `openai/gpt-5.5` 搭配 Codex
app-server harness。一旦 OpenAI 在公共 API 中启用 GPT-5.5，也会支持对 `openai/gpt-5.5` 的直接 API key 访问。

旧版 `codex/gpt-*` 引用仍然作为兼容性别名被接受。新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server
harness 配置应使用 `openai/gpt-*`，并搭配 `embeddedHarness.runtime:
"codex"`。

使用 `/status` 可确认当前会话生效的 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、runtime/fallback 策略，以及在 `auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会在该会话上记录所选的 harness id，并在同一会话 id 的后续轮次中继续使用它。当你希望未来的会话使用其他 harness 时，请更改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在将现有对话从 PI 切换到 Codex 之前，请使用 `/new` 或 `/reset` 启动一个新会话。这样可以避免把同一份转录回放到两个不兼容的原生会话系统中。

在引入 harness 固定前创建的旧会话，只要已经有转录历史，就会被视为固定到 PI。更改配置后，如需让该对话改用 Codex，请使用 `/new` 或 `/reset`。

`/status` 会在 `Fast` 旁边显示当前生效的非 PI harness，例如
`Fast · codex`。默认的 PI harness 仍显示为 `Runner: pi (embedded)`，不会额外添加单独的 harness 标记。

## 要求

- OpenClaw 已提供内置 `codex` 插件。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 凭证。

该插件会阻止较旧或未带版本的 app-server 握手。这可确保
OpenClaw 始终运行在其已测试过的协议接口上。

对于 live 和 Docker 冒烟测试，凭证通常来自 `OPENAI_API_KEY`，并可选配
Codex CLI 文件，例如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的凭证材料。

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

对于把 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>` 的旧配置，仍会自动启用内置 `codex` 插件。新配置应优先使用 `openai/<model>`，并配合上面的显式 `embeddedHarness` 条目。

## 在不替换其他模型的情况下添加 Codex

如果你希望旧版 `codex/*` 引用选择 Codex，而其他所有模型继续使用 PI，请保持 `runtime: "auto"`。对于新配置，建议在应使用该 harness 的智能体上显式设置 `runtime: "codex"`。

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

采用这种结构时：

- `/model gpt` 或 `/model openai/gpt-5.5` 会在此配置下使用 Codex app-server harness。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选择的是非 Codex 模型，PI 仍然是兼容性 harness。

## 仅使用 Codex 的部署

当你需要证明每个嵌入式智能体轮次都使用 Codex harness 时，请禁用 PI 回退：

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

禁用回退后，如果 Codex 插件被禁用、app-server 版本过旧，或者 app-server 无法启动，OpenClaw 会提前失败。

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

使用常规会话命令切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，而 Codex harness 会按需创建或恢复其 sidecar app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮根据当前配置重新解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 查询可用模型。如果发现失败或超时，它会使用内置的回退目录，包含：

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

如果你希望启动时不探测 Codex，而是固定使用回退目录，请禁用发现：

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

默认情况下，插件会使用以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而无需停下来等待无人值守情况下无法响应的原生审批提示。

若要选择启用由 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 是一个原生 Codex 审批审查器。当 Codex 请求离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给一个 reviewer 子智能体，而不是弹出人工提示。该 reviewer 会应用 Codex 的风险框架，并对具体请求进行批准或拒绝。当你需要比 YOLO 模式更多的护栏，同时又希望无人值守智能体能够继续推进工作时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"` 和 `sandbox: "workspace-write"`。各个策略字段仍然会覆盖 `mode`，因此高级部署可以将该预设与显式选项混合使用。

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

| 字段 | 默认值 | 含义 |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | `"codex"` | 用于 stdio 传输的可执行文件。 |
| `args` | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url` | 未设置 | WebSocket app-server URL。 |
| `authToken` | 未设置 | 用于 WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket headers。 |
| `requestTimeoutMs` | `60000` | app-server 控制平面调用的超时时间。 |
| `mode` | `"yolo"` | 用于 YOLO 或 guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程 start/resume/turn 的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程 start/resume 的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"guardian_subagent"` 可让 Codex Guardian 审核提示。 |
| `serviceTier` | 未设置 | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。 |

旧的环境变量在对应配置字段未设置时，仍可作为本地测试的回退项：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，因为这样可以将插件行为与 Codex harness 其余设置放在同一个经过审查的文件中。

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

仅使用 Codex 的 harness 验证，并禁用 PI 回退：

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

使用 Guardian 审核的 Codex 审批：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有 Codex 线程时，下一轮会再次向
app-server 发送当前选定的 OpenAI 模型、提供商、审批策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选择的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为一个已授权的斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道中使用。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账号、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 对已附加线程执行压缩。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex account` 显示账号和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 在正常轮次中使用的同一个 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持扩展历史启用。

该命令接口要求 Codex app-server `0.118.0` 或更高版本。如果未来或自定义 app-server 未暴露某个 JSON-RPC 方法，各个控制方法会被报告为 `unsupported by this Codex app-server`。

## 工具、媒体和压缩

Codex harness 仅改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批，以及消息工具输出仍然通过正常的 OpenClaw 投递路径进行处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流程进行路由；其他征询和自由输入请求仍然采用故障关闭处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。该镜像包括用户提示、最终助手文本，以及 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩的开始和完成信号。它尚未公开人类可读的压缩摘要，也尚未提供 Codex 在压缩后保留了哪些条目的可审计列表。

媒体生成不依赖 PI。图像、视频、音乐、PDF、TTS 以及媒体理解仍会继续使用相应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 请启用 `plugins.entries.codex.enabled`，
选择带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用了 PI 而不是 Codex：** 如果没有任何 Codex harness 声明接管该运行，OpenClaw 可能会使用 PI 作为兼容性后端。测试时请设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置
`embeddedHarness.fallback: "none"` 以便在没有插件 harness 匹配时直接失败。一旦选中了 Codex app-server，其失败就会直接暴露，不再经过额外回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手报告版本为 `0.118.0` 或更高。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、`authToken`，以及远端 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 这是预期行为，除非你强制设置了
`embeddedHarness.runtime: "codex"`（或选择了旧版 `codex/*` 引用）。普通的
`openai/gpt-*` 和其他提供商引用会继续走它们正常的提供商路径。

## 相关内容

- [智能体 Harness 插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
