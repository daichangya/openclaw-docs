---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 Pi 回退
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体回合
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T07:26:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

内置的 `codex` 插件让 OpenClaw 能够通过 Codex app-server 运行嵌入式智能体回合，而不是使用内置的 Pi harness。

当你希望由 Codex 接管底层智能体会话时，请使用此方式：模型发现、
原生线程恢复、原生压缩，以及 app-server 执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、
批准、媒体投递，以及可见的对话记录镜像。

原生 Codex 回合同样遵循共享插件钩子，因此 prompt shim、
感知压缩的自动化、工具中间件和生命周期观察器都能与 Pi harness 保持一致：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

内置插件还可以注册一个 Codex app-server 扩展工厂，以添加
异步 `tool_result` 中间件。

该 harness 默认关闭。只有在启用 `codex` 插件且解析后的模型是
`codex/*` 模型时，或者你显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex` 时，才会选择它。
如果你从未配置 `codex/*`，现有的 Pi、OpenAI、Anthropic、Gemini、本地和自定义提供商运行方式都会保持当前行为。

## 选择正确的模型前缀

OpenClaw 为 OpenAI 访问和 Codex 形态的访问分别提供了不同路由：

| 模型引用 | 运行时路径 | 使用场景 |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | 通过 OpenClaw/Pi 管线的 OpenAI 提供商 | 你希望使用 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。 |
| `openai-codex/gpt-5.4` | 通过 Pi 的 OpenAI Codex OAuth 提供商 | 你希望使用 ChatGPT/Codex OAuth，但不使用 Codex app-server harness。 |
| `codex/gpt-5.4`        | 内置 Codex 提供商 + Codex harness | 你希望为嵌入式智能体回合使用原生 Codex app-server 执行。 |

Codex harness 仅接管 `codex/*` 模型引用。现有的 `openai/*`、
`openai-codex/*`、Anthropic、Gemini、xAI、本地和自定义提供商引用都会保持正常路径。

## 要求

- OpenClaw，且内置 `codex` 插件可用。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 认证信息。

该插件会阻止较旧版本或未标明版本的 app-server 握手。
这可确保 OpenClaw 使用的是其已测试过的协议表面。

对于 live 和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及
可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的认证材料。

## 最小配置

使用 `codex/gpt-5.4`，启用内置插件，并强制使用 `codex` harness：

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 也会
自动启用内置 `codex` 插件。显式插件条目在共享配置中依然很有用，因为它能清楚表明部署意图。

## 添加 Codex 而不替换其他模型

如果你希望 `codex/*` 模型使用 Codex，而其他所有模型使用 Pi，
请保持 `runtime: "auto"`：

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

在这种配置下：

- `/model codex` 或 `/model codex/gpt-5.4` 使用 Codex app-server harness。
- `/model gpt` 或 `/model openai/gpt-5.4` 使用 OpenAI 提供商路径。
- `/model opus` 使用 Anthropic 提供商路径。
- 如果选择的是非 Codex 模型，Pi 仍然是兼容性 harness。

## 仅使用 Codex 的部署

当你需要证明每个嵌入式智能体回合都使用 Codex harness 时，
请禁用 Pi 回退：

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

禁用回退后，如果 Codex 插件被禁用、
请求的模型不是 `codex/*` 引用、app-server 版本过旧，或者
app-server 无法启动，OpenClaw 都会尽早失败。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体仍保持正常的
自动选择：

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

使用常规会话命令切换智能体和模型。`/new` 会创建一个全新的
OpenClaw 会话，而 Codex harness 会按需创建或恢复其 sidecar app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果
发现失败或超时，它会使用内置的回退目录：

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

如果你希望启动时避免探测 Codex，并固定使用回退目录，
请禁用发现：

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

## app-server 连接和策略

默认情况下，插件会使用以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在无人响应的原生批准提示上。

如果要启用由 Codex guardian 审查的批准，请设置 `appServer.mode:
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

Guardian 模式会展开为：

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

Guardian 是原生 Codex 批准审查器。当 Codex 请求离开
沙箱、在工作区外写入，或添加网络访问等权限时，
Codex 会将该批准请求路由给审查子智能体，而不是人类提示。
审查器会收集上下文并应用 Codex 的风险框架，然后
批准或拒绝该具体请求。当你希望比 YOLO 模式有更多防护措施，
但仍需要无人值守的智能体和心跳继续推进时，Guardian 会很有用。

当设置了 `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1` 时，
Docker live harness 会包含一个 Guardian 探针。它会以
Guardian 模式启动 Codex harness，验证一个无害的提权 shell 命令会被批准，
并验证向不受信任的外部目标上传伪造密钥会被拒绝，
从而使智能体回过头来请求显式批准。

各个独立策略字段的优先级仍高于 `mode`，因此高级部署可以
将该预设与显式选择混合使用。

对于已在运行的 app-server，请使用 WebSocket 传输协议：

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
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command`           | `"codex"`                                | 用于 stdio 传输协议的可执行文件。 |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输协议的参数。 |
| `url`               | 未设置 | WebSocket app-server URL。 |
| `authToken`         | 未设置 | 用于 WebSocket 传输协议的 Bearer token。 |
| `headers`           | `{}`                                     | 额外的 WebSocket 请求头。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。 |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 审查执行的预设。 |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/回合的原生 Codex 批准策略。 |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 可让 Codex Guardian 审查提示。 |
| `serviceTier`       | 未设置 | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。 |

较旧的环境变量仍可作为本地测试的回退方式使用，前提是
对应的配置字段未设置：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，
更推荐使用配置，因为这样可以将插件行为与其余 Codex harness 设置一起保存在同一个经过审查的文件中。

## 常见方案

使用默认 stdio 传输协议的本地 Codex：

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

仅使用 Codex 的 harness 验证，并禁用 Pi 回退：

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

由 Guardian 审查的 Codex 批准：

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

使用显式请求头的远程 app-server：

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

模型切换仍由 OpenClaw 控制。当某个 OpenClaw 会话附加到现有
Codex 线程时，下一回合会再次将当前选定的
`codex/*` 模型、提供商、批准策略、沙箱和服务层级发送给
app-server。从 `codex/gpt-5.4` 切换到 `codex/gpt-5.2` 会保留
线程绑定，但会要求 Codex 继续使用新选择的模型。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用命令，
可用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接性、模型、账户、速率限制、MCP 服务器和 skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 正常回合所使用的相同 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw `codex/*` 模型传入 app-server，并保持扩展历史记录启用。

该命令表面要求 Codex app-server `0.118.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，各个具体控制方法会显示为 `unsupported by this Codex app-server`。

## 工具、媒体和压缩

Codex harness 仅改变底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。
文本、图像、视频、音乐、TTS、批准以及消息工具输出仍然通过
正常的 OpenClaw 投递路径继续处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具批准征询会通过 OpenClaw 的插件批准流程路由；其他征询和自由形式输入请求仍会以失败关闭方式处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给
Codex app-server。OpenClaw 会保留一个对话记录镜像，用于渠道历史、
搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包括用户提示、最终助手文本，以及在 app-server 发出时的轻量级 Codex 推理或计划记录。当前，OpenClaw 仅记录原生压缩的开始和完成信号。它尚未提供
人类可读的压缩摘要，也未提供 Codex 在压缩后保留了哪些条目的可审计列表。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解
仍继续使用匹配的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**`/model` 中没有显示 Codex：** 启用 `plugins.entries.codex.enabled`，
设置一个 `codex/*` 模型引用，或者检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 如果没有任何 Codex harness 接管该运行，
OpenClaw 可能会使用 Pi 作为兼容性后端。测试时可设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex，或者设置
`embeddedHarness.fallback: "none"`，以便在没有匹配插件 harness 时直接失败。一旦选定了 Codex app-server，其失败会直接暴露出来，而无需额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手
报告版本 `0.118.0` 或更高。

**模型发现速度慢：** 调低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输协议立即失败：** 检查 `appServer.url`、`authToken`，
以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用了 Pi：** 这是预期行为。Codex harness 仅接管
`codex/*` 模型引用。

## 相关内容

- [Agent Harness Plugins](/zh-CN/plugins/sdk-agent-harness)
- [Model Providers](/zh-CN/concepts/model-providers)
- [Configuration Reference](/zh-CN/gateway/configuration-reference)
- [Testing](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
