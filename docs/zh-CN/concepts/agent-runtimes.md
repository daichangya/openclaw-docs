---
read_when:
    - 你正在 PI、Codex、ACP 或其他原生智能体运行时之间进行选择
    - 你对 Status 或配置中的提供商 / 模型 / 运行时标签感到困惑
    - 你正在为原生 harness 记录支持对等性
summary: OpenClaw 如何区分模型提供商、模型、渠道和 Agent Runtimes
title: Agent Runtimes
x-i18n:
    generated_at: "2026-04-26T07:48:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**智能体运行时** 是拥有单个已准备模型循环的组件：它接收提示词，驱动模型输出，处理原生工具调用，并将完成的轮次返回给 OpenClaw。

运行时很容易与提供商混淆，因为两者都会出现在模型配置附近。它们是不同的层：

| 层级 | 示例 | 含义 |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 提供商 | `openai`、`anthropic`、`openai-codex` | OpenClaw 如何进行身份验证、发现模型以及命名模型引用。 |
| 模型 | `gpt-5.5`、`claude-opus-4-6` | 为智能体轮次选择的模型。 |
| Agent Runtimes | `pi`、`codex`、`claude-cli` | 执行已准备轮次的底层循环或后端。 |
| 渠道 | Telegram、Discord、Slack、WhatsApp | 消息进入和离开 OpenClaw 的位置。 |

你还会在代码中看到 **harness** 这个词。harness 是提供智能体运行时的实现。例如，内置的 Codex harness 实现了 `codex` 运行时。公开配置使用 `agentRuntime.id`；`openclaw doctor --fix` 会将旧的 runtime-policy 键改写为该结构。

运行时分为两个家族：

- **嵌入式 harness** 在 OpenClaw 已准备的智能体循环内部运行。目前这包括内置的 `pi` 运行时，以及已注册的插件 harness，例如 `codex`。
- **CLI 后端** 运行本地 CLI 进程，同时保持模型引用为规范形式。例如，`anthropic/claude-opus-4-7` 配合 `agentRuntime.id: "claude-cli"` 表示“选择 Anthropic 模型，并通过 Claude CLI 执行”。`claude-cli` 不是嵌入式 harness id，不能传递给 AgentHarness 选择逻辑。

## 三个名为 Codex 的东西

大多数困惑都来自三个不同的表面共用了 Codex 这个名称：

| 表面 | OpenClaw 名称 / 配置 | 作用 |
| ---------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Codex OAuth 提供商路由 | `openai-codex/*` 模型引用 | 通过普通的 OpenClaw PI 运行器使用 ChatGPT / Codex 订阅 OAuth。 |
| 原生 Codex app-server 运行时 | `agentRuntime.id: "codex"` | 通过内置的 Codex app-server harness 运行嵌入式智能体轮次。 |
| Codex ACP 适配器 | `runtime: "acp"`、`agentId: "codex"` | 通过外部 ACP / acpx 控制平面运行 Codex。仅在明确要求 ACP / acpx 时使用。 |
| 原生 Codex chat-control 命令集 | `/codex ...` | 从聊天中绑定、恢复、引导、停止并检查 Codex app-server 线程。 |
| 用于 GPT / Codex 风格模型的 OpenAI Platform API 路由 | `openai/*` 模型引用 | 使用 OpenAI API 密钥身份验证，除非有运行时覆盖（例如 `runtime: "codex"`）来执行该轮次。 |

这些表面是有意彼此独立的。启用 `codex` 插件会使原生 app-server 功能可用；它不会将 `openai-codex/*` 改写为 `openai/*`，不会更改现有会话，也不会让 ACP 成为 Codex 的默认值。选择 `openai-codex/*` 表示“使用 Codex OAuth 提供商路由”，除非你另外强制指定运行时。

常见的 Codex 设置是使用 `openai` 提供商和 `codex` 运行时：

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
}
```

这意味着 OpenClaw 选择一个 OpenAI 模型引用，然后要求 Codex app-server 运行时运行嵌入式智能体轮次。这并不意味着渠道、模型提供商目录或 OpenClaw 会话存储会变成 Codex。

当内置的 `codex` 插件已启用时，自然语言 Codex 控制应使用原生 `/codex` 命令表面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。仅当用户明确要求 ACP / acpx，或正在测试 ACP 适配器路径时，才对 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 以及类似的外部 harness 仍然使用 ACP。

这是面向智能体的决策树：

1. 如果用户要求 **Codex bind / control / thread / resume / steer / stop**，并且内置的 `codex` 插件已启用，则使用原生 `/codex` 命令表面。
2. 如果用户要求 **Codex 作为嵌入式运行时**，则使用 `openai/<model>` 并设置 `agentRuntime.id: "codex"`。
3. 如果用户要求 **在普通 OpenClaw 运行器上使用 Codex OAuth / 订阅认证**，则使用 `openai-codex/<model>`，并将运行时保留为 PI。
4. 如果用户明确提到 **ACP**、**acpx** 或 **Codex ACP adapter**，则使用 ACP，并设置 `runtime: "acp"` 和 `agentId: "codex"`。
5. 如果请求针对 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness**，则使用 ACP / acpx，而不是原生子智能体运行时。

| 你的意思是…… | 使用…… |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天 / 线程控制 | 来自内置 `codex` 插件的 `/codex ...` |
| Codex app-server 嵌入式智能体运行时 | `agentRuntime.id: "codex"` |
| 在 PI 运行器上的 OpenAI Codex OAuth | `openai-codex/*` 模型引用 |
| Claude Code 或其他外部 harness | ACP / acpx |

关于 OpenAI 系列前缀拆分，请参见 [OpenAI](/zh-CN/providers/openai) 和 [模型提供商](/zh-CN/concepts/model-providers)。关于 Codex 运行时支持契约，请参见 [Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract)。

## 运行时归属

不同运行时拥有循环中的不同部分。

| 表面 | OpenClaw PI 嵌入式 | Codex app-server |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 模型循环拥有者 | OpenClaw，通过 PI 嵌入式运行器 | Codex app-server |
| 规范线程状态 | OpenClaw transcript | Codex 线程，以及 OpenClaw transcript 镜像 |
| OpenClaw 动态工具 | 原生 OpenClaw 工具循环 | 通过 Codex 适配器桥接 |
| 原生 shell 和文件工具 | PI / OpenClaw 路径 | Codex 原生工具，在支持的情况下通过原生钩子桥接 |
| 上下文引擎 | 原生 OpenClaw 上下文组装 | OpenClaw 项目将组装后的上下文注入 Codex 轮次 |
| 压缩 | OpenClaw 或所选上下文引擎 | Codex 原生压缩，并带有 OpenClaw 通知和镜像维护 |
| 渠道投递 | OpenClaw | OpenClaw |

这种归属拆分是主要设计规则：

- 如果某个表面由 OpenClaw 拥有，OpenClaw 就可以提供正常的插件钩子行为。
- 如果某个表面由原生运行时拥有，OpenClaw 就需要运行时事件或原生钩子。
- 如果规范线程状态由原生运行时拥有，OpenClaw 应该镜像并投射上下文，而不是重写不受支持的内部结构。

## 运行时选择

OpenClaw 会在提供商和模型解析之后选择嵌入式运行时：

1. 会话中记录的运行时优先。配置更改不会将现有 transcript 热切换到不同的原生线程系统。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为新的或已重置的会话强制指定该运行时。
3. `agents.defaults.agentRuntime.id` 或 `agents.list[].agentRuntime.id` 可以设置为 `auto`、`pi`、已注册的嵌入式 harness id（如 `codex`），或受支持的 CLI 后端别名（如 `claude-cli`）。
4. 在 `auto` 模式下，已注册的插件运行时可以声明其支持的提供商 / 模型组合。
5. 如果在 `auto` 模式下没有运行时声明某个轮次，并且设置了 `fallback: "pi"`（默认值），OpenClaw 会使用 PI 作为兼容性回退。将 `fallback: "none"` 设置为在 `auto` 模式匹配失败时直接报错，而不是回退。

显式插件运行时默认是失败即关闭。例如，`runtime: "codex"` 表示要么使用 Codex，要么得到明确的选择错误，除非你在同一个覆盖作用域中设置 `fallback: "pi"`。运行时覆盖不会继承更宽作用域的回退设置，因此，智能体级别的 `runtime: "codex"` 不会仅因为默认值使用了 `fallback: "pi"` 就被悄悄路由回 PI。

CLI 后端别名与嵌入式 harness id 不同。推荐的 Claude CLI 形式是：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

像 `claude-cli/claude-opus-4-7` 这样的旧式引用仍然为了兼容性而受支持，但新配置应保持提供商 / 模型为规范形式，并将执行后端放在 `agentRuntime.id` 中。

`auto` 模式是有意保持保守的。插件运行时可以声明它们理解的提供商 / 模型组合，但 Codex 插件不会在 `auto` 模式下声明 `openai-codex` 提供商。这样可以将 `openai-codex/*` 保持为显式的 PI Codex OAuth 路由，并避免将基于订阅认证的配置悄悄迁移到原生 app-server harness 上。

如果 `openclaw doctor` 警告说 `codex` 插件已启用，而 `openai-codex/*` 仍然通过 PI 路由，请将其视为诊断，而不是迁移。如果你想要的是 PI Codex OAuth，就保持配置不变。只有当你希望使用原生 Codex app-server 执行时，才切换到 `openai/<model>` 加 `agentRuntime.id: "codex"`。

## 兼容性契约

当某个运行时不是 PI 时，它应记录自己支持哪些 OpenClaw 表面。运行时文档应使用以下结构：

| 问题 | 为什么重要 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 谁拥有模型循环？ | 这决定了重试、工具续接和最终答案判定发生在哪里。 |
| 谁拥有规范线程历史？ | 这决定了 OpenClaw 是可以编辑历史，还是只能镜像历史。 |
| OpenClaw 动态工具是否可用？ | 消息传递、会话、cron 和 OpenClaw 自有工具都依赖这一点。 |
| 动态工具钩子是否可用？ | 插件期望围绕 OpenClaw 自有工具有 `before_tool_call`、`after_tool_call` 和中间件。 |
| 原生工具钩子是否可用？ | shell、patch 和运行时自有工具需要原生钩子来实现策略和观察。 |
| 上下文引擎生命周期是否运行？ | Memory 和上下文插件依赖 assemble、ingest、after-turn 和 compaction 生命周期。 |
| 暴露了哪些压缩数据？ | 有些插件只需要通知，而另一些需要保留 / 丢弃的元数据。 |
| 哪些内容是有意不支持的？ | 当原生运行时拥有更多状态时，用户不应假设它与 PI 完全等价。 |

Codex 运行时支持契约记录在 [Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract) 中。

## Status 标签

Status 输出可能同时显示 `Execution` 和 `Runtime` 标签。应将它们理解为诊断信息，而不是提供商名称。

- 像 `openai/gpt-5.5` 这样的模型引用会告诉你所选的提供商 / 模型。
- 像 `codex` 这样的运行时 id 会告诉你是哪个循环在执行该轮次。
- 像 Telegram 或 Discord 这样的渠道标签会告诉你对话发生在哪里。

如果你在更改运行时配置后，会话仍然显示 PI，请使用 `/new` 启动新会话，或使用 `/reset` 清除当前会话。现有会话会保留其记录的运行时，这样 transcript 就不会通过两个不兼容的原生会话系统被重放。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [OpenAI](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Models](/zh-CN/concepts/models)
- [Status](/zh-CN/cli/status)
