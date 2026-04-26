---
read_when:
    - 你正在更改内嵌智能体运行时或 harness 注册表。
    - 你正在从内置插件或受信任插件注册一个智能体 harness。
    - 你需要了解 Codex 插件与模型提供商之间的关系。
sidebarTitle: Agent Harness
summary: 用于替换底层内嵌智能体执行器的插件实验性 SDK 表面
title: Agent harness plugins
x-i18n:
    generated_at: "2026-04-26T07:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**智能体 harness** 是用于执行一次已准备好的 OpenClaw 智能体轮次的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。关于面向用户的心智模型，请参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅应将此表面用于内置插件或受信任的原生插件。该契约目前仍属实验性，因为其参数类型有意镜像当前的内嵌运行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话运行时，而普通 OpenClaw 提供商传输抽象并不适合时，请注册一个智能体 harness。

示例：

- 拥有线程和压缩逻辑的原生 coding-agent 服务器
- 必须流式传输原生计划/推理/工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话转录之外，还需要自己的恢复 ID 的模型运行时

**不要**仅为了接入新的 LLM API 而注册 harness。对于普通的 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## core 仍然负责的内容

在选择 harness 之前，OpenClaw 已经解析好以下内容：

- 提供商和模型
- 运行时认证状态
- 思考级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种划分是有意为之。harness 执行的是一次已准备好的尝试；它不负责选择提供商、不替代渠道投递，也不会静默切换模型。

该已准备好的尝试还包含 `params.runtimePlan`，这是一个由 OpenClaw 持有的运行时策略包，用于那些必须在 PI 和原生 harness 之间共享的运行时决策：

- `runtimePlan.tools.normalize(...)` 和 `runtimePlan.tools.logDiagnostics(...)`，用于 provider 感知的工具 schema 策略
- `runtimePlan.transcript.resolvePolicy(...)`，用于转录净化和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)`，用于共享的 `NO_REPLY` 和媒体投递抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用于模型回退分类
- `runtimePlan.observability`，用于已解析的 provider/模型/harness 元数据

harness 可以在需要与 PI 行为保持一致的决策中使用该 plan，但仍应将其视为由宿主持有的尝试状态。不要修改它，也不要用它在单个轮次内切换提供商/模型。

## 注册 harness

**导入：** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "我的原生智能体 harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // 启动或恢复你的原生线程。
    // 使用 params.prompt、params.tools、params.images、params.onPartialReply、
    // params.onAgentEvent，以及其他已准备好的尝试字段。
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "通过原生智能体守护进程运行选定模型。",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 选择策略

OpenClaw 会在提供商/模型解析完成后选择 harness：

1. 现有会话中记录的 harness ID 优先，因此配置/环境变量变更不会将该转录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 ID 的已注册 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册的 harness 询问自己是否支持已解析的提供商/模型。
5. 如果没有匹配的已注册 harness，OpenClaw 会使用 PI，除非 PI 回退已禁用。

插件 harness 失败会表现为运行失败。在 `auto` 模式下，仅当没有任何已注册插件 harness 支持已解析的提供商/模型时，才会使用 PI 回退。一旦某个插件 harness 已经接管一次运行，OpenClaw 不会再通过 PI 重放同一轮次，因为那可能改变认证/运行时语义，或造成副作用重复执行。

选中的 harness ID 会在一次内嵌运行后与会话 ID 一起持久化。对于在 harness 固定机制引入前创建的旧会话，只要它们已有转录历史，就会被视为已固定到 PI。要在 PI 与原生插件 harness 之间切换，请使用新的/已重置的会话。`/status` 会在 `Fast` 旁边显示非默认 harness ID，例如 `codex`；PI 因为是默认兼容路径，所以会隐藏。如果选中的 harness 出乎你的意料，请启用 `agents/harness` 调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。它包含所选 harness ID、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置 Codex 插件将 `codex` 注册为其 harness ID。core 将其视为普通的插件 harness ID；Codex 特定别名应放在插件或运维配置中，而不应放在共享运行时选择器中。

## 提供商与 harness 配对

大多数 harness 也应注册一个 provider。provider 会让模型引用、认证状态、模型元数据和 `/model` 选择对 OpenClaw 其余部分可见。然后 harness 再在 `supports(...)` 中声明自己接管该 provider。

内置 Codex 插件遵循这一模式：

- 首选用户模型引用：`openai/gpt-5.5` 加上 `agentRuntime.id: "codex"`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍然可用，但新配置不应将其用作普通 provider/模型引用
- harness ID：`codex`
- 认证：合成 provider 可用性，因为 Codex harness 拥有原生 Codex 登录/会话
- app-server 请求：OpenClaw 向 Codex 发送裸模型 ID，并由 harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通 `openai/gpt-*` 引用仍继续使用普通 OpenClaw provider 路径，除非你通过 `agentRuntime.id: "codex"` 强制使用 Codex harness。旧版 `codex/gpt-*` 引用仍会为兼容性目的选择 Codex provider 和 harness。

有关运维设置、模型前缀示例和仅 Codex 配置，请参见 [Codex harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.125.0` 或更高版本。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未带版本号的服务器，以确保 OpenClaw 仅在其已测试过的协议表面上运行。`0.125.0` 这一最低版本包含了在 Codex `0.124.0` 中引入的原生 MCP hook 载荷支持，同时也将 OpenClaw 固定在更新且已验证的稳定版本线上。

### 工具结果中间件

当内置插件在其清单中的 `contracts.agentToolResultMiddleware` 声明了目标运行时 ID 时，它们可以通过 `api.registerAgentToolResultMiddleware(...)` 附加运行时中立的工具结果中间件。这个受信任接缝适用于那些必须在 PI 或 Codex 将工具输出回传给模型之前运行的异步工具结果转换。

旧版内置插件仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 处理仅适用于 Codex app-server 的中间件，但新的结果转换应使用运行时中立 API。仅适用于 Pi 的 `api.registerEmbeddedExtensionFactory(...)` hook 已被移除；Pi 工具结果转换必须使用运行时中立中间件。

### 终态结果分类

拥有自身协议投影的原生 harness，可在一次已完成轮次未产生可见 assistant 文本时，使用 `openclaw/plugin-sdk/agent-harness-runtime` 中的 `classifyAgentHarnessTerminalOutcome(...)`。该辅助函数会返回 `empty`、`reasoning-only` 或 `planning-only`，以便 OpenClaw 的回退策略判断是否应在不同模型上重试。它有意不对提示错误、进行中的轮次，以及诸如 `NO_REPLY` 之类的有意静默回复进行分类。

### 原生 Codex harness 模式

内置的 `codex` harness 是内嵌 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用了限制性允许列表，还需要将 `codex` 加入 `plugins.allow`。原生 app-server 配置应使用 `openai/gpt-*` 搭配 `agentRuntime.id: "codex"`。如果要通过 PI 使用 Codex OAuth，请改用 `openai-codex/*`。旧版 `codex/*` 模型引用仍作为原生 harness 的兼容别名保留。

在此模式下运行时，Codex 负责原生线程 ID、恢复行为、压缩和 app-server 执行。OpenClaw 仍负责聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径才能接管该次运行时，请使用不带 `fallback` 覆盖的 `agentRuntime.id: "codex"`。显式插件运行时默认已经是失败即关闭。只有在你明确希望由 PI 处理缺失的 harness 选择时，才设置 `fallback: "pi"`。Codex app-server 失败本来就会直接失败，而不会通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 会以 `agents.defaults.agentRuntime` 设置为 `{ id: "auto", fallback: "pi" }` 来运行内嵌智能体。在 `auto` 模式下，已注册的插件 harness 可以接管某个 provider/模型组合。如果没有匹配项，OpenClaw 会回退到 PI。

在 `auto` 模式下，如果你需要在没有插件 harness 选中时直接失败，而不是使用 PI，请设置 `fallback: "none"`。显式插件运行时（如 `runtime: "codex"`）默认已经是失败即关闭，除非在同一配置或环境变量覆盖作用域中设置了 `fallback: "pi"`。已选中的插件 harness 失败总是会硬失败。这不会阻止显式 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅使用 Codex 的内嵌运行：

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

如果你希望任何已注册插件 harness 都能接管匹配的模型，但又绝不希望 OpenClaw 静默回退到 PI，请保持 `runtime: "auto"` 并禁用回退：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

针对单个智能体的覆盖使用相同结构：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置运行时。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可通过环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

在禁用回退后，如果请求的 harness 未注册、不支持已解析的 provider/模型，或在产生轮次副作用之前就失败了，会话就会提前失败。对于仅 Codex 部署，以及那些必须证明确实在使用 Codex app-server 路径的在线测试来说，这正是预期行为。

此设置仅控制内嵌智能体 harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他特定 provider 的模型路由。

## 原生会话与转录镜像

harness 可以保留一个原生会话 ID、线程 ID 或守护进程端恢复 token。请将这种绑定明确关联到 OpenClaw 会话，并持续将用户可见的 assistant/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下场景的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切回内置 PI harness
- 通用 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了侧车绑定，请实现 `reset(...)`，以便 OpenClaw 在所属 OpenClaw 会话被重置时清除它。

## 工具和媒体结果

core 会构建 OpenClaw 工具列表，并将其传入已准备好的尝试。当 harness 执行动态工具调用时，请通过 harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批和消息工具输出，与基于 PI 的运行保持在同一投递路径上。

## 当前限制

- 公共导入路径是通用的，但出于兼容性考虑，某些 attempt/result 类型别名仍然带有 `Pi` 名称。
- 第三方 harness 安装仍属实验性。在你确实需要原生会话运行时之前，请优先使用提供商插件。
- 支持跨轮次切换 harness。不要在单个轮次中途切换 harness，尤其是在原生工具、审批、assistant 文本或消息发送已经开始之后。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
