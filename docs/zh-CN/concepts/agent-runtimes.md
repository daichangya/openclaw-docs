---
read_when:
    - 你正在 PI、Codex、ACP 或其他原生智能体运行时之间进行选择
    - 你对 Status 或配置中的提供商 / 模型 / 运行时标签感到困惑
    - 你正在为原生 harness 记录支持一致性
summary: OpenClaw 如何区分模型提供商、模型、渠道和 Agent Runtimes
title: Agent Runtimes
x-i18n:
    generated_at: "2026-04-26T03:53:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729bfef9d30efe37ed8a3f697398be0d2faf72bdac46f219b983b7c8ca69de7d
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**智能体运行时**是负责一个已准备好的模型循环的组件：它接收提示，驱动模型输出，处理原生工具调用，并将完成后的轮次返回给 OpenClaw。

运行时很容易与提供商混淆，因为两者都会出现在模型配置附近。它们属于不同层级：

| 层级 | 示例 | 含义 |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 提供商 | `openai`、`anthropic`、`openai-codex` | OpenClaw 如何进行身份验证、发现模型，以及命名模型引用。 |
| 模型 | `gpt-5.5`、`claude-opus-4-6` | 为智能体轮次选择的模型。 |
| Agent Runtimes | `pi`、`codex`、由 ACP 支持的运行时 | 执行已准备轮次的底层循环。 |
| 渠道 | Telegram、Discord、Slack、WhatsApp | 消息进入和离开 OpenClaw 的位置。 |

你还会在代码和配置中看到 **harness** 这个词。harness 是提供某个智能体运行时的实现。例如，内置的 Codex harness 实现了 `codex` 运行时。出于兼容性考虑，配置键仍然命名为 `embeddedHarness`，但面向用户的文档和 Status 输出通常应使用“运行时”。

## 三个都叫 Codex 的东西

大多数困惑来自三个不同的表面都共用了 Codex 这个名字：

| 表面 | OpenClaw 名称 / 配置 | 作用 |
| ---------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Codex OAuth provider 路由 | `openai-codex/*` 模型引用 | 通过常规 OpenClaw PI 运行器使用 ChatGPT / Codex 订阅 OAuth。 |
| 原生 Codex app-server 运行时 | `embeddedHarness.runtime: "codex"` | 通过内置的 Codex app-server harness 运行嵌入式智能体轮次。 |
| Codex ACP 适配器 | `runtime: "acp"`、`agentId: "codex"` | 通过外部 ACP / acpx 控制平面运行 Codex。仅在明确要求 ACP / acpx 时使用。 |
| 原生 Codex 聊天控制命令集 | `/codex ...` | 在聊天中绑定、恢复、引导、停止和检查 Codex app-server 线程。 |
| 面向 GPT / Codex 风格模型的 OpenAI Platform API 路由 | `openai/*` 模型引用 | 使用 OpenAI API key 身份验证，除非某个运行时覆盖（例如 `runtime: "codex"`）来执行该轮次。 |

这些表面是有意彼此独立的。启用 `codex` 插件会使原生 app-server 功能可用；它不会将 `openai-codex/*` 改写为 `openai/*`，不会更改现有会话，也不会让 ACP 成为 Codex 的默认方式。选择 `openai-codex/*` 的意思是“使用 Codex OAuth provider 路由”，除非你另外强制指定运行时。

常见的 Codex 配置会将 `openai` 提供商与 `codex` 运行时搭配使用：

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
}
```

这表示 OpenClaw 先选择一个 OpenAI 模型引用，然后要求 Codex app-server 运行时来运行嵌入式智能体轮次。这并不意味着渠道、模型提供商目录或 OpenClaw 会话存储会变成 Codex。

启用内置 `codex` 插件后，自然语言的 Codex 控制应使用原生 `/codex` 命令表面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。只有当用户明确要求 ACP / acpx，或正在测试 ACP 适配器路径时，才对 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 以及类似的外部 harness 仍然使用 ACP。

这是面向智能体的决策树：

1. 如果用户要求 **Codex bind / control / thread / resume / steer / stop**，并且已启用内置 `codex` 插件，则使用原生 `/codex` 命令表面。
2. 如果用户要求 **将 Codex 用作嵌入式运行时**，则使用 `openai/<model>` 并设置 `embeddedHarness.runtime: "codex"`。
3. 如果用户要求 **在常规 OpenClaw 运行器上使用 Codex OAuth / 订阅身份验证**，则使用 `openai-codex/<model>`，并将运行时保持为 PI。
4. 如果用户明确提到 **ACP**、**acpx** 或 **Codex ACP 适配器**，则使用 ACP，并设置 `runtime: "acp"` 和 `agentId: "codex"`。
5. 如果请求涉及 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness**，则使用 ACP / acpx，而不是原生子智能体运行时。

| 你的意思是…… | 使用…… |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天 / 线程控制 | 来自内置 `codex` 插件的 `/codex ...` |
| Codex app-server 嵌入式智能体运行时 | `embeddedHarness.runtime: "codex"` |
| 在 PI 运行器上使用 OpenAI Codex OAuth | `openai-codex/*` 模型引用 |
| Claude Code 或其他外部 harness | ACP / acpx |

关于 OpenAI 家族前缀拆分，参见 [OpenAI](/zh-CN/providers/openai) 和 [模型提供商](/zh-CN/concepts/model-providers)。关于 Codex 运行时支持契约，参见 [Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract)。

## 运行时归属

不同运行时拥有的循环部分不同。

| 表面 | OpenClaw PI 嵌入式 | Codex app-server |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 模型循环所有者 | OpenClaw 通过 PI 嵌入式运行器 | Codex app-server |
| 规范线程状态 | OpenClaw transcript | Codex 线程，以及 OpenClaw transcript 镜像 |
| OpenClaw 动态工具 | 原生 OpenClaw 工具循环 | 通过 Codex 适配器桥接 |
| 原生 shell 和文件工具 | PI / OpenClaw 路径 | Codex 原生工具，在支持时通过原生钩子桥接 |
| 上下文引擎 | 原生 OpenClaw 上下文组装 | OpenClaw 项目将组装后的上下文注入 Codex 轮次 |
| 压缩 | OpenClaw 或选定的上下文引擎 | Codex 原生压缩，并带有 OpenClaw 通知和镜像维护 |
| 渠道投递 | OpenClaw | OpenClaw |

这个归属划分是主要的设计规则：

- 如果某个表面由 OpenClaw 拥有，OpenClaw 就可以提供常规插件钩子行为。
- 如果某个表面由原生运行时拥有，OpenClaw 就需要运行时事件或原生钩子。
- 如果原生运行时拥有规范线程状态，OpenClaw 应该镜像并投射上下文，而不是重写不受支持的内部实现。

## 运行时选择

OpenClaw 会在提供商和模型解析之后选择一个嵌入式运行时：

1. 会话中已记录的运行时优先。配置变更不会将现有 transcript 热切换到不同的原生线程系统。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为新会话或已重置的会话强制指定该运行时。
3. `agents.defaults.embeddedHarness.runtime` 或 `agents.list[].embeddedHarness.runtime` 可以设置为 `auto`、`pi` 或某个已注册的运行时 ID，例如 `codex`。
4. 在 `auto` 模式下，已注册的插件运行时可以声明其支持的提供商 / 模型组合。
5. 如果在 `auto` 模式下没有运行时声明某个轮次，且设置了 `fallback: "pi"`（默认值），OpenClaw 会使用 PI 作为兼容性回退。将 `fallback: "none"` 设为回退值，则会让未匹配的 `auto` 模式选择直接失败。

显式插件运行时默认采用失败即关闭的方式。例如，`runtime: "codex"` 表示要么使用 Codex，要么返回明确的选择错误，除非你在同一覆盖范围中设置 `fallback: "pi"`。运行时覆盖不会继承更广范围的回退设置，因此即使默认值使用了 `fallback: "pi"`，智能体级别的 `runtime: "codex"` 也不会被静默路由回 PI。

`auto` 模式有意保持保守。插件运行时可以声明它们理解的提供商 / 模型组合，但 Codex 插件不会在 `auto` 模式下声明 `openai-codex` 提供商。这样可以让 `openai-codex/*` 继续作为显式的 PI Codex OAuth 路由，并避免将基于订阅身份验证的配置静默迁移到原生 app-server harness 上。

如果 `openclaw doctor` 警告说 `codex` 插件已启用，而 `openai-codex/*` 仍通过 PI 路由，请将其视为诊断，而不是迁移。当你想要的是 PI Codex OAuth 时，请保持配置不变。只有当你想要使用原生 Codex app-server 执行时，才切换到 `openai/<model>` 加上 `runtime: "codex"`。

## 兼容性契约

当运行时不是 PI 时，它应记录自己支持哪些 OpenClaw 表面。运行时文档应使用如下结构：

| 问题 | 为什么重要 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 谁拥有模型循环？ | 决定重试、工具续接和最终答案决策发生在哪里。 |
| 谁拥有规范线程历史？ | 决定 OpenClaw 能否编辑历史，还是只能镜像它。 |
| OpenClaw 动态工具是否可用？ | 消息、会话、cron 和 OpenClaw 自有工具都依赖这一点。 |
| 动态工具钩子是否可用？ | 插件期望在 OpenClaw 自有工具周围存在 `before_tool_call`、`after_tool_call` 和中间件。 |
| 原生工具钩子是否可用？ | shell、patch 和运行时自有工具需要原生钩子来实现策略和观测。 |
| 上下文引擎生命周期是否运行？ | Memory 和上下文插件依赖 assemble、ingest、after-turn 和 compaction 生命周期。 |
| 暴露了哪些压缩数据？ | 有些插件只需要通知，而另一些则需要保留 / 丢弃元数据。 |
| 哪些内容是有意不支持的？ | 当原生运行时拥有更多状态时，用户不应假设它与 PI 等价。 |

Codex 运行时支持契约记录在 [Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract) 中。

## Status 标签

Status 输出可能同时显示 `Execution` 和 `Runtime` 标签。应将它们理解为诊断信息，而不是提供商名称。

- 像 `openai/gpt-5.5` 这样的模型引用告诉你所选的提供商 / 模型。
- 像 `codex` 这样的运行时 ID 告诉你是哪个循环在执行该轮次。
- 像 Telegram 或 Discord 这样的渠道标签告诉你对话发生在哪里。

如果在更改运行时配置后，会话仍然显示为 PI，请使用 `/new` 开启新会话，或使用 `/reset` 清除当前会话。现有会话会保留其已记录的运行时，以避免某个 transcript 被通过两个不兼容的原生会话系统重放。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [OpenAI](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Models](/zh-CN/concepts/models)
- [Status](/zh-CN/cli/status)
