---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅 Codex 部署禁用 PI 回退 സംവിധ to=final code omitted
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-23T20:56:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65e96ac709a7996878037da3ffb8903cdd3ad83bb5de75c47ab2f0a08882098c
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 可以通过
Codex app-server，而不是内置的 PI harness，来运行嵌入式智能体轮次。

当你希望由 Codex 接管底层智能体会话时，请使用它：模型
发现、原生线程恢复、原生压缩总结，以及 app-server 执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、
审批、媒体传递，以及可见的转录镜像。

原生 Codex 轮次同样遵循共享插件 hooks，因此提示词 shim、
感知压缩总结的自动化、工具中间件以及生命周期观察器都能与
PI harness 保持一致：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

内置插件还可以注册 Codex app-server extension factory，以添加
异步 `tool_result` 中间件。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用
规范为 `openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
旧版 `codex/*` 模型引用仍会为兼容性自动选择该 harness。

## 选择正确的模型前缀

OpenClaw 现在会将 OpenAI GPT 模型引用统一规范为 `openai/*`：

| 模型引用 | 运行时路径 | 适用场景 |
| ----------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.5` | 通过 OpenClaw/PI 流程访问 OpenAI 提供商 | 你希望使用 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | 你希望对嵌入式智能体轮次使用原生 Codex app-server 执行。 |

旧版 `openai-codex/gpt-*` 和 `codex/gpt-*` 引用仍然接受作为
兼容性别名，但新的文档/配置示例应使用 `openai/gpt-*`。

Harness 选择不是一个实时会话控制项。当一个嵌入式轮次运行时，
OpenClaw 会在该会话上记录所选 harness id，并继续在同一会话 id 的后续轮次中使用它。若你希望未来会话改用其他 harness，请更改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在已有会话于 PI 和 Codex 之间切换之前，
请使用 `/new` 或 `/reset` 启动一个全新会话。这可以避免将同一份转录
重放到两个彼此不兼容的原生会话系统中。

在引入 harness pin 之前创建的旧会话，一旦拥有转录历史，就会被视为
固定到 PI。更改配置后，请使用 `/new` 或 `/reset`，将该会话显式切换到
Codex。

`/status` 会在 `Fast` 旁显示生效的非 PI harness，例如
`Fast · codex`。默认的 PI harness 仍显示为 `Runner: pi (embedded)`，并且不会
额外显示单独的 harness 徽章。

## 要求

- OpenClaw，且内置 `codex` 插件可用。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可使用的 Codex 认证。

该插件会阻止旧版或未带版本号的 app-server 握手。这可以确保
OpenClaw 只运行在已测试过的协议表面上。

对于 live 和 Docker smoke 测试，认证通常来自 `OPENAI_API_KEY`，以及
可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
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
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

如果你的配置使用 `plugins.allow`，也请将 `codex` 包含进去：

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
`codex/<model>`，仍会自动启用内置 `codex` 插件。新配置应优先使用
`openai/<model>`，并搭配上面的显式 `embeddedHarness` 条目。

## 添加 Codex 而不替换其他模型

当你希望旧版 `codex/*` 引用选择 Codex，而其他所有情况仍使用
PI 时，请保持 `runtime: "auto"`。对于新配置，建议在需要使用该 harness 的智能体上显式设置 `runtime: "codex"`。

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

采用这种形状时：

- `/model gpt` 或 `/model openai/gpt-5.5` 会为该配置使用 Codex app-server harness。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选择了非 Codex 模型，PI 仍然作为兼容性 harness 保留。

## 仅 Codex 部署

当你需要证明每一个嵌入式智能体轮次都使用
Codex harness 时，请禁用 PI 回退：

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

禁用回退后，如果 Codex 插件被禁用、
app-server 版本过旧，或 app-server 无法启动，OpenClaw 会快速失败。

## 按智能体使用 Codex

你可以让某个智能体仅使用 Codex，而默认智能体保持正常的
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

使用常规会话命令切换智能体和模型。`/new` 会创建一个全新的
OpenClaw 会话，而 Codex harness 会按需创建或恢复其侧车 app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，
并让下一轮再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果
发现失败或超时，它会使用内置的回退目录，其中包括：

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

## App-server 连接与策略

默认情况下，插件会使用以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于
自治 heartbeat 的受信任本地运维姿态：Codex 可以使用 shell 和网络工具，而不会
停在无人响应的原生审批提示上。

若要启用 Codex guardian 审查式审批，请设置 `appServer.mode:
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

Guardian 是原生 Codex 审批审查者。当 Codex 请求离开沙箱、写入工作区之外的内容，或添加像网络访问这样的权限时，Codex 会将该审批请求路由给一个 reviewer subagent，而不是弹出人工提示。该 reviewer 会应用 Codex 的风险框架，并批准或拒绝具体请求。当你希望比 YOLO 模式拥有更多护栏，但仍需要无人值守智能体持续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"` 和 `sandbox: "workspace-write"`。单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。

对于已在运行的 app-server，请使用 WebSocket 传输：

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
| `command` | `"codex"` | stdio 传输所使用的可执行文件。 |
| `args` | `["app-server", "--listen", "stdio://"]` | stdio 传输所使用的参数。 |
| `url` | 未设置 | WebSocket app-server URL。 |
| `authToken` | 未设置 | WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket headers。 |
| `requestTimeoutMs` | `60000` | app-server 控制平面调用的超时时间。 |
| `mode` | `"yolo"` | YOLO 或 guardian 审查执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程启动/恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"guardian_subagent"` 可让 Codex Guardian 审查提示。 |
| `serviceTier` | 未设置 | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。

较旧的环境变量在匹配的配置字段未设置时，仍可作为本地测试的回退方式：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，
因为这样可以将插件行为与 Codex harness 其余设置一起放在同一个已审查文件中。

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

仅验证 Codex harness，并禁用 PI 回退：

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

Guardian 审查式 Codex 审批：

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

使用显式 headers 的远程 app-server：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到已有
Codex 线程时，下一轮会再次将当前选中的
OpenAI 模型、提供商、审批策略、沙箱和服务层级发送给
app-server。将 `openai/gpt-5.5` 切换为 `openai/gpt-5.2` 时，会保留
线程绑定，但会要求 Codex 使用新选中的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为授权的斜杠命令。它是通用的，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接性、模型、账户、速率限制、MCP 服务器和 skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 对附加线程执行压缩总结。
- `/codex review` 为附加线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 正常轮次所使用的相同侧车绑定文件。下一条消息到来时，OpenClaw 会恢复该 Codex 线程，将当前选中的 OpenClaw `codex/*` 模型传入 app-server，并保持扩展历史启用。

该命令表面要求 Codex app-server 版本为 `0.118.0` 或更新。若未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，单个控制方法会报告为 `unsupported by this Codex app-server`。

## 工具、媒体与压缩总结

Codex harness 只改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从
harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出
仍然通过正常的 OpenClaw 传递路径流动。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批请求会通过 OpenClaw 的插件审批流程进行路由；其他请求获取输入的情形以及自由格式输入请求仍然会失败即关闭。

当所选模型使用 Codex harness 时，原生线程压缩总结会委托给
Codex app-server。OpenClaw 会保留转录镜像，用于渠道历史、
搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该
镜像包括用户提示词、最终助手文本，以及在 app-server 发出时的轻量级 Codex
推理或计划记录。目前，OpenClaw 只记录原生压缩总结开始与完成信号。它尚未暴露
人类可读的压缩总结摘要，也未提供可审计的列表来说明 Codex
在压缩总结后保留了哪些条目。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 以及媒体
理解仍然继续使用匹配的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**`/model` 中看不到 Codex：** 启用 `plugins.entries.codex.enabled`，
设置一个 `codex/*` 模型引用，或检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用了 PI 而不是 Codex：** 如果没有 Codex harness 接管该运行，
OpenClaw 可能会使用 PI 作为兼容性后端。测试时请设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置
`embeddedHarness.fallback: "none"`，使得当没有匹配的插件 harness 时直接失败。一旦
Codex app-server 被选中，其失败会直接暴露出来，而无需额外的
回退配置。

**app-server 被拒绝：** 升级 Codex，确保 app-server 握手
报告版本为 `0.118.0` 或更新。

**模型发现很慢：** 调低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，
以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 这是预期行为。Codex harness 只会接管
`codex/*` 模型引用。

## 相关内容

- [智能体 Harness 插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
