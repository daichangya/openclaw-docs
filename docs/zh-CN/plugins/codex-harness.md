---
read_when:
    - 你想使用内置的 Codex app-server harness。
    - 你需要 Codex harness 配置示例。
    - 你希望仅使用 Codex 的部署在失败时直接报错，而不是回退到 PI。
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-04-26T03:53:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e43e9683ee0deaa9b97345a51f4a6b5848f0f3738f1ddb9519a01954c247fea5
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件允许 OpenClaw 通过 Codex app-server 来运行嵌入式智能体回合，
而不是使用内置的 PI harness。

当你希望由 Codex 接管底层智能体会话时，请使用此方式：模型
发现、原生线程恢复、原生压缩以及 app-server 执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、
审批、媒体传递以及可见的转录镜像。

如果你正在熟悉这一部分，请先阅读
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简短版本如下：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

## 这个插件会改变什么

内置的 `codex` 插件提供了几项彼此独立的能力：

| 能力                              | 你的使用方式                                      | 它的作用                                                                    |
| --------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| 原生嵌入式运行时                  | `embeddedHarness.runtime: "codex"`                | 通过 Codex app-server 运行 OpenClaw 嵌入式智能体回合。                     |
| 原生聊天控制命令                  | `/codex bind`、`/codex resume`、`/codex steer`... | 从消息对话中绑定并控制 Codex app-server 线程。                              |
| Codex app-server 提供商/目录      | `codex` 内部实现，通过 harness 暴露               | 让运行时能够发现并验证 app-server 模型。                                    |
| Codex 媒体理解路径                | `codex/*` 图像模型兼容路径                        | 为受支持的图像理解模型运行受限的 Codex app-server 回合。                    |
| 原生钩子转发                      | 围绕 Codex 原生事件的插件钩子                     | 让 OpenClaw 能够观察/阻止受支持的 Codex 原生工具/终结事件。                 |

启用该插件会使这些能力可用。它**不会**：

- 为每个 OpenAI 模型都开始使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认的 Codex 路径
- 热切换已经记录了 PI 运行时的现有会话
- 替换 OpenClaw 的渠道传递、会话文件、凭证配置文件存储或
  消息路由

同一个插件还负责原生 `/codex` 聊天控制命令界面。如果
该插件已启用，并且用户要求从聊天中绑定、恢复、引导、停止或检查
Codex 线程，智能体应优先使用 `/codex ...` 而不是 ACP。
当用户明确要求 ACP/acpx 或正在测试 ACP
Codex 适配器时，ACP 仍然是明确的回退路径。

原生 Codex 回合会将 OpenClaw 插件钩子保留为公共兼容层。
这些是进程内的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`、`after_compaction`
- `llm_input`、`llm_output`
- `before_tool_call`、`after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- 通过 Codex `Stop` 转发触发的 `before_agent_finalize`
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，以便在 OpenClaw 执行工具之后、
并在结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公共
`tool_result_persist` 插件钩子不同，后者会转换 OpenClaw 自有的转录
工具结果写入。

关于插件钩子语义本身，请参阅 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用
使用规范形式 `openai/gpt-*`，并在需要原生 app-server 执行时
显式强制设置
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
旧版 `codex/*` 模型引用仍会自动选择该 harness 以保持兼容，
但由运行时支持的旧版提供商前缀不会作为普通模型/提供商选择项显示。

如果启用了 `codex` 插件，但主模型仍然是
`openai-codex/*`，`openclaw doctor` 会发出警告，而不是更改路由。这是
有意为之：`openai-codex/*` 仍然是 PI Codex OAuth/订阅路径，而
原生 app-server 执行始终是一个显式运行时选择。

## 路由映射

在更改配置前，请先使用此表：

| 期望行为                                    | 模型引用                   | 运行时配置                             | 插件要求                    | 预期状态标签                 |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ---------------------------- |
| 通过普通 OpenClaw 运行器使用 OpenAI API     | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI provider             | `Runtime: OpenClaw Pi Default` |
| 通过 PI 使用 Codex OAuth/订阅               | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式回合            | `openai/gpt-*`             | `embeddedHarness.runtime: "codex"`     | `codex` 插件                | `Runtime: OpenAI Codex`      |
| 使用保守自动模式的混合提供商                | 提供商特定引用             | `runtime: "auto", fallback: "pi"`      | 可选插件运行时              | 取决于所选运行时             |
| 显式 Codex ACP 适配器会话                   | 取决于 ACP prompt/model    | `sessions_spawn` with `runtime: "acp"` | 健康的 `acpx` 后端          | ACP task/session status      |

关键区别在于提供商与运行时：

- `openai-codex/*` 回答的是“PI 应该使用哪条提供商/凭证路径？”
- `embeddedHarness.runtime: "codex"` 回答的是“哪个循环应执行这个
  嵌入式回合？”
- `/codex ...` 回答的是“这个聊天应绑定或控制哪个原生 Codex 对话？”
- ACP 回答的是“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路由对前缀很敏感。当你想通过 PI 使用
Codex OAuth 时，请使用 `openai-codex/*`；当你想直接使用 OpenAI API，或者
要强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| 模型引用                                             | 运行时路径                                   | 使用场景                                                                  |
| ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | 通过 OpenClaw/PI 管道的 OpenAI provider      | 你希望通过 `OPENAI_API_KEY` 使用当前直接 OpenAI Platform API 访问。       |
| `openai-codex/gpt-5.5`                               | 通过 OpenClaw/PI 的 OpenAI Codex OAuth       | 你希望使用默认 PI 运行器通过 ChatGPT/Codex 订阅凭证。                     |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                    | 你希望在嵌入式智能体回合中使用原生 Codex app-server 执行。                |

GPT-5.5 目前在 OpenClaw 中仅支持订阅/OAuth 方式。请使用
`openai-codex/gpt-5.5` 进行 PI OAuth，或使用 `openai/gpt-5.5` 搭配 Codex
app-server harness。一旦 OpenAI 在公共 API 上启用 GPT-5.5，
就会支持 `openai/gpt-5.5` 的直接 API 密钥访问。

旧版 `codex/gpt-*` 引用仍然接受，作为兼容别名。Doctor
兼容性迁移会将旧版主运行时引用重写为规范模型
引用，并将运行时策略单独记录；而仅用于回退的旧版引用会保持不变，
因为运行时是为整个智能体容器配置的。
新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
app-server harness 配置应使用 `openai/gpt-*`，再加上
`embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀划分。当图像理解应通过 OpenAI
Codex OAuth 提供商路径运行时，请使用
`openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 回合运行时，请使用
`codex/gpt-*`。Codex app-server 模型必须
声明支持图像输入；纯文本 Codex 模型会在媒体回合
开始前失败。

使用 `/status` 来确认当前会话的实际 harness。如果选择结果出乎意料，
请为 `agents/harness` 子系统启用调试日志，
并检查 Gateway 网关的结构化 `agent harness selected` 记录。它
包含所选 harness id、选择原因、运行时/回退策略，以及在
`auto` 模式下每个插件候选项的支持结果。

### doctor 警告意味着什么

当以下条件全部满足时，`openclaw doctor` 会发出警告：

- 内置 `codex` 插件已启用或被允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的实际运行时不是 `codex`

之所以有这个警告，是因为用户常常会以为“启用了 Codex 插件”就意味着
“使用原生 Codex app-server 运行时”。OpenClaw 不会自动这样做。该警告表示：

- 如果你的目标是通过 PI 使用 ChatGPT/Codex OAuth，**则无需更改**。
- 如果你的目标是原生 app-server
  执行，请将模型更改为 `openai/<model>`，并设置
  `embeddedHarness.runtime: "codex"`。
- 现有会话在运行时更改后仍然需要 `/new` 或 `/reset`，
  因为会话运行时固定是粘性的。

Harness 选择不是实时会话控制。当嵌入式回合运行时，
OpenClaw 会在该会话上记录所选 harness id，并在相同会话 id 的后续回合中
继续使用它。当你希望未来的会话使用另一个 harness 时，
请更改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在将现有对话从 PI 切换到 Codex 或反向切换之前，
请使用 `/new` 或 `/reset` 开启一个新会话。
这样可以避免将同一份转录内容通过两个不兼容的原生会话系统进行回放。

在引入 harness 固定机制之前创建的旧会话，一旦拥有转录历史，
就会被视为固定到 PI。更改配置后，如需让该对话改用 Codex，
请使用 `/new` 或 `/reset`。

`/status` 会显示实际模型运行时。默认的 PI harness 会显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 会显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，并且可用内置的 `codex` 插件。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理一个兼容的
  Codex app-server 二进制文件，因此 `PATH` 中本地 `codex` 命令
  不会影响正常的 harness 启动。
- app-server 进程可用的 Codex 凭证。

该插件会阻止较旧或未带版本信息的 app-server 握手。
这样可确保 OpenClaw 仅运行在它已经测试过的协议表面之上。

对于实时和 Docker 烟雾测试，凭证通常来自 `OPENAI_API_KEY`，并可附带
可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
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

仍将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>` 的旧配置，仍会自动启用内置的 `codex` 插件。新配置应
优先使用 `openai/<model>`，再配合上面的显式
`embeddedHarness` 条目。

## 将 Codex 与其他模型一起添加

如果同一个智能体需要在 Codex 和非 Codex 提供商模型之间自由切换，
请不要全局设置 `runtime: "codex"`。强制运行时会应用到该智能体或会话的每一次
嵌入式回合。如果你在强制该运行时时选择了 Anthropic 模型，
OpenClaw 仍会尝试使用 Codex harness，并以关闭失败的方式报错，而不是悄悄地将该回合路由到 PI。

请改用以下其中一种形式：

- 为 Codex 单独设置一个智能体，并使用 `embeddedHarness.runtime: "codex"`。
- 将默认智能体保持为 `runtime: "auto"`，并在正常混合
  提供商用法下使用 PI 回退。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用
  `openai/*`，并搭配显式的 Codex 运行时策略。

例如，下面的配置会让默认智能体保持正常的自动选择，同时
新增一个独立的 Codex 智能体：

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

在这种形式下：

- 默认的 `main` 智能体使用正常的提供商路径和 PI 兼容回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或 Codex 不受支持，该回合会
  直接失败，而不是悄悄使用 PI。

## 智能体命令路由

智能体应按用户意图路由请求，而不是仅仅根据 “Codex” 这个词：

| 用户请求的是……                                         | 智能体应使用……                                 |
| ------------------------------------------------------ | ---------------------------------------------- |
| “将这个聊天绑定到 Codex”                               | `/codex bind`                                  |
| “在这里恢复 Codex 线程 `<id>`”                         | `/codex resume <id>`                           |
| “显示 Codex 线程”                                      | `/codex threads`                               |
| “将 Codex 用作这个智能体的运行时”                      | 将配置更改为 `embeddedHarness.runtime`         |
| “用我的 ChatGPT/Codex 订阅配合普通 OpenClaw”           | `openai-codex/*` 模型引用                      |
| “通过 ACP/acpx 运行 Codex”                             | ACP `sessions_spawn({ runtime: "acp", ... })`  |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor”      | ACP/acpx，而不是 `/codex`，也不是原生子智能体   |

只有在 ACP 已启用、可分发，并且由已加载的运行时后端支持时，
OpenClaw 才会向智能体展示 ACP 启动指导。如果 ACP 不可用，
系统提示词和插件 Skills 不应向智能体传授 ACP
路由方式。

## 仅 Codex 部署

当你需要证明每一个嵌入式智能体回合
都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不使用 PI 回退，因此
`fallback: "none"` 是可选的，但通常对文档说明很有帮助：

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
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

在强制使用 Codex 的情况下，如果 Codex 插件被禁用、app-server
版本过旧，或 app-server 无法启动，OpenClaw 会尽早失败。只有当你明确希望
PI 处理缺失的 harness 选择时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，同时让默认智能体保持正常的
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

使用常规会话命令来切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，而 Codex harness 会按需创建或恢复它的 sidecar app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，
并让下一次回合再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果
发现失败或超时，它会使用内置的回退目录来支持以下模型：

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

## App-server 连接与策略

默认情况下，插件会在本地使用以下命令启动由 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

该受管二进制文件被声明为内置插件运行时依赖，并与其余 `codex` 插件依赖一起
进行准备。这使 app-server 版本绑定到内置插件，而不是绑定到本地
恰好安装的独立 Codex CLI。只有在你明确希望运行其他可执行文件时，
才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自治 heartbeat 的受信任本地操作员姿态：
Codex 可以使用 shell 和网络工具，而不会停在
无人应答的原生审批提示上。

若要启用由 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自动审核审批路径。当 Codex 请求
离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，
Codex 会将该审批请求路由给原生审核器，而不是发出人工提示。
审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。
当你希望比 YOLO 模式有更多护栏，但仍需要无人值守智能体持续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
单独的策略字段仍会覆盖 `mode`，因此高级部署可以将
该预设与显式选择混合使用。旧的 `guardian_subagent` 审核器值
仍可作为兼容别名使用，但新配置应使用
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

| 字段                | 默认值                                   | 含义                                                                                                       |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                     |
| `command`           | 受管 Codex 二进制文件                    | 用于 stdio 传输的可执行文件。留空则使用受管二进制文件；仅在明确覆盖时设置。                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                                    |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                 |
| `authToken`         | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                       |
| `headers`           | `{}`                                     | 额外的 WebSocket headers。                                                                                 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                        |
| `mode`              | `"yolo"`                                 | 用于 YOLO 或 guardian 审核执行的预设。                                                                     |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/回合的原生 Codex 审批策略。                                                            |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                 |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 可让 Codex 审核原生审批提示。`guardian_subagent` 仍是旧版别名。                      |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                   |

环境变量覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，
`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过受管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于
可重复部署，优先使用配置，因为这样可以将插件行为与 Codex harness 其余设置
放在同一个经过审查的文件中。

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的
Codex 线程时，下一次回合会再次将当前所选的
OpenAI 模型、提供商、审批策略、沙箱和服务层级发送到
app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留
线程绑定，但会要求 Codex 使用新选定的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为一个已授权的斜杠命令。它是通用的，
适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到一个现有的 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审核。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server skills。

`/codex resume` 会写入与 harness 在
常规回合中使用的同一个 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，
将当前选定的 OpenClaw 模型传入 app-server，并保持扩展历史记录
处于启用状态。

该命令界面要求 Codex app-server `0.125.0` 或更高版本。如果未来或自定义的
app-server 未暴露相应 JSON-RPC 方法，各个单独的
控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 具有三层钩子：

| 层级                                  | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 在 PI 和 Codex harness 之间提供产品/插件兼容性。                   |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐回合适配器行为。                         |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。               |

OpenClaw 不会使用项目级或全局的 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为每个线程注入 Codex 配置，用于 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop`。其他 Codex 钩子，例如 `SessionStart` 和
`UserPromptSubmit`，仍然属于 Codex 级控制；它们不会作为
v1 合同中的 OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，Codex 发出调用请求之后由 OpenClaw 执行该工具，
因此 OpenClaw 会在
harness 适配器中触发它所拥有的插件和中间件行为。对于 Codex 原生工具，
Codex 拥有规范工具记录。OpenClaw 可以镜像选定事件，
但无法重写原生 Codex 线程，
除非 Codex 通过 app-server 或原生钩子
回调暴露该操作。

压缩和 LLM 生命周期投影来自 Codex app-server
通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级观察结果，而不是
对 Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知
会被投影为 `codex_app_server.hook` 智能体事件，用于轨迹记录和调试。
它们不会调用 OpenClaw 插件钩子。

## V1 支持合同

Codex 模式并不是在底层换了一个模型调用的 PI。Codex 接管了更多
原生模型循环，而 OpenClaw 会围绕这一边界适配它的插件和会话界面。

Codex 运行时 v1 中支持的内容：

| 界面                                          | 支持情况                        | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 运行 OpenAI 模型循环               | 支持                            | Codex app-server 负责 OpenAI 回合、原生线程恢复和原生工具续接。                                                                                                                                       |
| OpenClaw 渠道路由与传递                       | 支持                            | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道保持在模型运行时之外。                                                                                                                        |
| OpenClaw 动态工具                             | 支持                            | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍在执行路径中。                                                                                                                                    |
| 提示词和上下文插件                            | 支持                            | OpenClaw 会在启动或恢复线程之前构建提示词叠加层，并将上下文投影到 Codex 回合中。                                                                                                                     |
| 上下文引擎生命周期                            | 支持                            | 组装、摄取或回合后维护，以及上下文引擎压缩协调，都会在 Codex 回合中运行。                                                                                                                             |
| 动态工具钩子                                  | 支持                            | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 自有动态工具运行。                                                                                                             |
| 生命周期钩子                                  | 作为适配器观察结果提供支持      | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会使用符合实际的 Codex 模式载荷触发。                                                                             |
| 最终答案修订门                                | 通过原生钩子转发提供支持        | Codex `Stop` 会转发给 `before_agent_finalize`；`revise` 会要求 Codex 在最终化之前再进行一次模型调用。                                                                                               |
| 原生 shell、patch 和 MCP 的阻止或观察         | 通过原生钩子转发提供支持        | Codex `PreToolUse` 和 `PostToolUse` 会针对已承诺的原生工具界面进行转发，包括 Codex app-server `0.125.0` 或更高版本上的 MCP 载荷。支持阻止；不支持参数重写。                                         |
| 原生权限策略                                  | 通过原生钩子转发提供支持        | 当运行时暴露该能力时，Codex `PermissionRequest` 可以通过 OpenClaw 策略进行路由。如果 OpenClaw 不返回决策，Codex 会继续其正常的 guardian 或用户审批路径。                                             |
| app-server 轨迹捕获                           | 支持                            | OpenClaw 会记录它发送给 app-server 的请求，以及它接收到的 app-server 通知。                                                                                                                          |

Codex 运行时 v1 中不支持的内容：

| 界面                                                | V1 边界                                                                                                                                       | 未来路径                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                                    | Codex 原生 pre-tool 钩子可以阻止，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                   | 需要 Codex 钩子/模式支持替换后的工具输入。                                               |
| 可编辑的 Codex 原生转录历史                         | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像，并可以投影未来上下文，但不应变更不受支持的内部结构。                                          | 如果需要对原生线程进行手术式修改，则需添加显式 Codex app-server API。                    |
| 用于 Codex 原生工具记录的 `tool_result_persist`     | 该钩子转换的是 OpenClaw 自有的转录写入，而不是 Codex 原生工具记录。                                                                             | 可以镜像转换后的记录，但规范性重写需要 Codex 支持。                                       |
| 丰富的原生压缩元数据                                | OpenClaw 能观察到压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 增量或摘要载荷。                                                         | 需要更丰富的 Codex 压缩事件。                                                             |
| 压缩干预                                            | 当前 OpenClaw 的压缩钩子在 Codex 模式下仅限通知级别。                                                                                           | 如果插件需要否决或重写原生压缩，则需添加 Codex 的 pre/post 压缩钩子。                    |
| 逐字节模型 API 请求捕获                             | OpenClaw 可以捕获 app-server 请求和通知，但最终 OpenAI API 请求由 Codex 核心在内部构建。                                                       | 需要 Codex 模型请求追踪事件或调试 API。                                                   |

## 工具、媒体与压缩

Codex harness 只改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从
harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出
仍然通过常规 OpenClaw 传递路径处理。

原生钩子转发刻意保持通用，但 v1 支持合同
仅限于 OpenClaw 测试过的 Codex 原生工具和权限路径。在
Codex 运行时中，这包括 shell、patch 和 MCP 的 `PreToolUse`、
`PostToolUse` 以及 `PermissionRequest` 载荷。不要假定未来的每个
Codex 钩子事件都会成为 OpenClaw 插件界面，除非运行时合同
明确命名它。

对于 `PermissionRequest`，只有在策略作出决定时，OpenClaw 才会返回明确的允许或拒绝
决策。无决策结果并不等于允许。Codex 会将其视为没有
钩子决策，并继续走它自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件
审批流进行路由。Codex 的 `request_user_input` 提示会被发送回
发起的聊天中，而下一个排队的后续消息会回答该原生
服务器请求，而不是被作为额外上下文引导。其他 MCP 征询
请求仍会以关闭失败方式处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给
Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史记录、
搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该
镜像包括用户提示词、最终助手文本，以及在 app-server 发出时的轻量级 Codex
推理或计划记录。目前，OpenClaw 只记录原生压缩的开始和完成信号。
它尚未暴露人类可读的压缩摘要，也尚未提供一份可审计的条目列表，
说明 Codex 在压缩后保留了哪些内容。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 目前不会
重写 Codex 原生工具结果记录。它仅在
OpenClaw 正在写入 OpenClaw 自有会话转录工具结果时才会生效。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 以及媒体理解
仍会继续使用匹配的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**Codex 没有显示为普通的 `/model` 提供商：** 这对
新配置来说是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`embeddedHarness.runtime: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用了 PI 而不是 Codex：** `runtime: "auto"` 在没有
Codex harness 认领该运行时，仍然会使用 PI 作为兼容后端。测试时请设置
`embeddedHarness.runtime: "codex"` 来强制选择 Codex。
强制 Codex 运行时现在会直接失败，而不是回退到 PI，除非你
显式设置了 `embeddedHarness.fallback: "pi"`。一旦选中了 Codex app-server，
其失败会直接暴露出来，不需要额外回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手
报告的版本为 `0.125.0` 或更高。相同版本号的预发布版本或带构建后缀的
版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，也会被拒绝，因为
OpenClaw 测试所依据的协议最低版本是稳定版 `0.125.0`。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、`authToken`，
并确认远程 app-server 使用的是相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 除非你为该智能体强制设置了
`embeddedHarness.runtime: "codex"`，或选择了旧版
`codex/*` 引用，否则这是预期行为。普通的 `openai/gpt-*` 和其他提供商引用
在 `auto` 模式下会继续使用各自的常规提供商路径。如果你强制设置了
`runtime: "codex"`，则该智能体的每一个嵌入式回合
都必须是受 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
