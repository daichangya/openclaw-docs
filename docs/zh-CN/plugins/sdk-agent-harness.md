---
read_when:
    - 你正在更改嵌入式智能体运行时或 harness 注册表
    - 你正在从内置或受信任的插件注册一个智能体 harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换底层嵌入式智能体执行器的插件实验性 SDK 接口
title: Agent harness plugins
x-i18n:
    generated_at: "2026-04-25T23:10:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 623d4d9b6bfe6f0746e2f72e8c221148f0aacc10f1d9de68e3ab9028d750ba34
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**智能体 harness** 是为单次已准备好的 OpenClaw 智能体轮次提供底层执行的组件。它不是模型提供商，不是渠道，也不是工具注册表。
关于面向用户的心智模型，请参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅对内置或受信任的原生插件使用此接口。该契约仍处于实验阶段，因为参数类型有意映射当前的嵌入式运行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话运行时，而常规 OpenClaw 提供商传输抽象并不适合时，请注册一个智能体 harness。

示例：

- 拥有线程和压缩管理能力的原生编码智能体服务器
- 必须流式传输原生计划 / 推理 / 工具事件的本地 CLI 或守护进程
- 除了 OpenClaw 会话转录记录之外，还需要自己的恢复 id 的模型运行时

不要仅为了添加一个新的 LLM API 而注册 harness。对于常规的 HTTP 或 WebSocket 模型 API，请构建一个 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍负责的内容

在选择 harness 之前，OpenClaw 已经解析完成：

- provider 和 model
- 运行时认证状态
- 思考级别和上下文预算
- OpenClaw 转录记录 / 会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种划分是有意设计的。harness 执行的是一次已准备好的尝试；它不会选择提供商、替换渠道投递，或静默切换模型。

该已准备好的尝试还包括 `params.runtimePlan`，这是由 OpenClaw 持有的一组运行时决策策略包，这些策略必须在 PI 和原生 harness 之间保持共享：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)`，用于提供商感知的工具 schema 策略
- `runtimePlan.transcript.resolvePolicy(...)`，用于转录记录清理和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)`，用于共享的 `NO_REPLY` 和媒体投递抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用于模型回退分类
- `runtimePlan.observability`，用于已解析的 provider / model / harness 元数据

harness 可以使用该计划来做出需要与 PI 行为一致的决策，但仍应将其视为由宿主持有的尝试状态。不要修改它，也不要用它在单次轮次中切换 provider / model。

## 注册 harness

**导入：** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 选择策略

OpenClaw 会在 provider / model 解析完成后选择一个 harness：

1. 现有会话中已记录的 harness id 优先生效，因此配置 / 环境变量变更不会将该转录记录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制指定该 id 对应的已注册 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册 harness 判断自己是否支持已解析的 provider / model。
5. 如果没有匹配的已注册 harness，除非禁用了 PI 回退，否则 OpenClaw 会使用 PI。

插件 harness 失败会表现为运行失败。在 `auto` 模式下，仅当没有任何已注册插件 harness 支持已解析的 provider / model 时，才会使用 PI 回退。一旦某个插件 harness 已认领该次运行，OpenClaw 就不会再通过 PI 重放同一轮次，因为这可能改变认证 / 运行时语义，或导致副作用重复发生。

所选的 harness id 会在一次嵌入式运行后与会话 id 一起持久化。对于在 harness 固定机制引入之前创建的旧会话，只要它们已有转录历史，就会被视为固定到 PI。若要在 PI 与原生插件 harness 之间切换，请使用新的 / 已重置的会话。`/status` 会在 `Fast` 旁边显示非默认 harness id，例如 `codex`；PI 因为是默认兼容路径而保持隐藏。如果所选 harness 出乎你的预期，请启用 `agents/harness` 调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。该记录包含所选 harness id、选择原因、运行时 / 回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置 Codex 插件将 `codex` 注册为其 harness id。核心将其视为普通的插件 harness id；Codex 专属别名应由插件或运维配置处理，而不应放入共享运行时选择器中。

## provider 与 harness 配对

大多数 harness 也应同时注册一个 provider。provider 让模型引用、认证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。然后，harness 在 `supports(...)` 中认领该 provider。

内置 Codex 插件遵循这种模式：

- 首选的用户模型引用：`openai/gpt-5.5` 加上
  `embeddedHarness.runtime: "codex"`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍然可接受，但新配置不应将它们作为常规 provider / model 引用使用
- harness id：`codex`
- 认证：使用合成 provider 可用性，因为 Codex harness 持有原生 Codex 登录 / 会话
- app-server 请求：OpenClaw 将裸模型 id 发送给 Codex，并由 harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通 `openai/gpt-*` 引用会继续使用常规 OpenClaw provider 路径，除非你通过 `embeddedHarness.runtime: "codex"` 强制使用 Codex harness。较旧的 `codex/gpt-*` 引用仍会出于兼容性原因选择 Codex provider 和 harness。

有关运维设置、模型前缀示例和仅适用于 Codex 的配置，请参见
[Codex harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 版本为 `0.125.0` 或更高。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未提供版本信息的服务器，以确保 OpenClaw 仅在其已测试过的协议接口上运行。`0.125.0` 的最低要求包含了在 Codex `0.124.0` 中引入的原生 MCP hook 负载支持，同时将 OpenClaw 固定在更新且已验证稳定的版本线上。

### 工具结果中间件

当内置插件在其 manifest 的 `contracts.agentToolResultMiddleware` 中声明目标运行时 id 时，可以通过
`api.registerAgentToolResultMiddleware(...)` 挂接与运行时无关的工具结果中间件。这个受信任接口用于异步工具结果转换，这些转换必须在 PI 或 Codex 将工具输出回送给模型之前运行。

旧版内置插件仍可使用
`api.registerCodexAppServerExtensionFactory(...)` 来实现仅适用于 Codex app-server 的中间件，但新的结果转换应使用与运行时无关的 API。
仅适用于 Pi 的 `api.registerEmbeddedExtensionFactory(...)` hook 已被移除；Pi 的工具结果转换必须使用与运行时无关的中间件。

### 终态结果分类

拥有自己协议投影的原生 harness 可以在已完成轮次未产生可见助手文本时，使用来自
`openclaw/plugin-sdk/agent-harness-runtime` 的
`classifyAgentHarnessTerminalOutcome(...)`。该辅助函数会返回 `empty`、`reasoning-only` 或 `planning-only`，以便 OpenClaw 的回退策略决定是否在其他模型上重试。它有意不对提示错误、进行中的轮次，以及像 `NO_REPLY` 这样有意静默的回复进行分类。

### 原生 Codex harness 模式

内置的 `codex` harness 是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用了限制性 allowlist，请在 `plugins.allow` 中包含 `codex`。原生 app-server 配置应使用 `openai/gpt-*` 并搭配 `embeddedHarness.runtime: "codex"`。如果要通过 PI 使用 Codex OAuth，请改用 `openai-codex/*`。旧版 `codex/*` 模型引用仍保留为原生 harness 的兼容性别名。

当此模式运行时，Codex 持有原生线程 id、恢复行为、压缩和 app-server 执行。OpenClaw 仍持有聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径可以认领该次运行时，请使用不带 `fallback` 覆盖项的 `embeddedHarness.runtime: "codex"`。显式插件运行时默认已经是失败即关闭。只有在你有意希望 PI 处理缺失的 harness 选择时，才设置 `fallback: "pi"`。Codex app-server 故障本身已经会直接失败，而不是通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 通过将 `agents.defaults.embeddedHarness`
设置为 `{ runtime: "auto", fallback: "pi" }` 来运行嵌入式智能体。在 `auto` 模式下，已注册的插件 harness 可以认领 provider / model 配对。如果没有任何匹配项，OpenClaw 会回退到 PI。

在 `auto` 模式下，当你需要在缺少插件 harness 选择时直接失败而不是使用 PI 时，请设置 `fallback: "none"`。像 `runtime: "codex"` 这样的显式插件运行时，默认已经是失败即关闭，除非在同一配置或环境覆盖范围中设置了 `fallback: "pi"`。已选中的插件 harness 一旦失败，总是会直接失败。这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅使用 Codex 的嵌入式运行：

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

如果你希望任意已注册的插件 harness 认领匹配的模型，但又不希望 OpenClaw 静默回退到 PI，请保持 `runtime: "auto"` 并禁用回退：

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

每个智能体的覆盖项使用相同结构：

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置的运行时。使用
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可通过环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

在禁用回退后，如果所请求的 harness 未注册、不支持已解析的 provider / model，或在产生轮次副作用之前即失败，会话会提前失败。这对于仅使用 Codex 的部署，以及必须证明 Codex app-server 路径确实正在使用的实时测试来说，是有意设计的行为。

此设置仅控制嵌入式智能体 harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商特定模型路由。

## 原生会话与转录镜像

harness 可以保留原生会话 id、线程 id 或守护进程端恢复令牌。请将这种绑定显式关联到 OpenClaw 会话，并继续将面向用户可见的助手 / 工具输出镜像到 OpenClaw 转录记录中。

OpenClaw 转录记录仍然是以下能力的兼容层：

- 渠道可见的会话历史
- 转录记录搜索与索引
- 在后续轮次切回内置 PI harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了 sidecar 绑定，请实现 `reset(...)`，以便 OpenClaw 在所属 OpenClaw 会话被重置时清除它。

## 工具和媒体结果

核心会构建 OpenClaw 工具列表，并将其传入已准备好的尝试。
当 harness 执行动态工具调用时，请通过 harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批以及消息工具输出与基于 PI 的运行保持在同一投递路径上。

## 当前限制

- 公共导入路径是通用的，但某些 attempt / result 类型别名仍带有 `Pi` 名称，以保持兼容性。
- 第三方 harness 安装仍处于实验阶段。在你确实需要原生会话运行时之前，请优先使用提供商插件。
- 支持跨轮次切换 harness。不要在单次轮次进行到一半时切换 harness，尤其是在原生工具、审批、助手文本或消息发送已经开始之后。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
