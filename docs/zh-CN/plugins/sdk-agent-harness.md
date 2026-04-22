---
read_when:
    - 你正在更改内嵌智能体运行时或 harness 注册表
    - 你正在从内置插件或受信任插件注册一个智能体 harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换底层内嵌智能体执行器的实验性插件 SDK 接口 surface
title: 智能体 Harness 插件
x-i18n:
    generated_at: "2026-04-22T23:23:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# 智能体 Harness 插件

**智能体 harness** 是为一次已准备好的 OpenClaw 智能体轮次提供底层执行的执行器。它不是模型提供商，不是渠道，也不是工具注册表。

仅对内置或受信任的原生插件使用此接口。该契约仍属实验性，因为其参数类型刻意映射当前的内嵌运行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话运行时，而常规的 OpenClaw 提供商传输层并不是合适抽象时，注册智能体 harness。

示例：

- 拥有线程和上下文压缩能力的原生 coding-agent 服务器
- 必须流式传输原生计划 / 推理 / 工具事件的本地 CLI 或守护进程
- 除了 OpenClaw 会话转录之外，还需要自身 resume id 的模型运行时

不要仅为了添加一个新的 LLM API 而注册 harness。对于常规的 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍负责的内容

在选择 harness 之前，OpenClaw 已经解析完成：

- 提供商和模型
- 运行时凭证状态
- 思考等级和上下文预算
- OpenClaw 转录 / 会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种划分是有意为之。Harness 负责运行一次已准备好的尝试；它不会选择提供商、替换渠道投递，也不会静默切换模型。

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

OpenClaw 会在提供商 / 模型解析完成后选择 harness：

1. `OPENCLAW_AGENT_RUNTIME=<id>` 会强制使用具有该 id 的已注册 harness。
2. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI harness。
3. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册的 harness 判断自己是否支持已解析的提供商 / 模型。
4. 如果没有已注册 harness 匹配，OpenClaw 会使用 PI，除非禁用了 PI 回退。

插件 harness 失败会显示为运行失败。在 `auto` 模式下，仅当没有已注册的插件 harness 支持已解析的提供商 / 模型时，才会使用 PI 回退。一旦某个插件 harness 已声明接管某次运行，OpenClaw 就不会再通过 PI 重放同一轮次，因为这可能改变凭证 / 运行时语义，或导致副作用重复。

内置 Codex 插件将 `codex` 注册为其 harness id。核心将其视为普通的插件 harness id；Codex 专用别名应放在插件或运维配置中，而不是共享运行时选择器中。

## 提供商与 harness 配对

大多数 harness 也应该注册一个提供商。提供商会让模型引用、凭证状态、模型元数据和 `/model` 选择对 OpenClaw 其余部分可见。随后，harness 在 `supports(...)` 中声明该提供商。

内置 Codex 插件遵循此模式：

- provider id: `codex`
- 用户模型引用：`codex/gpt-5.4`、`codex/gpt-5.2`，或 Codex app server 返回的其他模型
- harness id: `codex`
- auth：合成的提供商可用性，因为 Codex harness 拥有原生 Codex 登录 / 会话
- app-server 请求：OpenClaw 向 Codex 发送裸模型 id，并让 harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通的 `openai/gpt-*` 引用仍然是 OpenAI 提供商引用，并继续使用常规的 OpenClaw 提供商路径。当你想使用 Codex 管理的凭证、Codex 模型发现、原生线程和 Codex app-server 执行时，请选择 `codex/gpt-*`。`/model` 可以在 Codex app server 返回的 Codex 模型之间切换，而无需 OpenAI 提供商凭证。

有关运维设置、模型前缀示例和仅适用于 Codex 的配置，请参见 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.118.0` 或更高版本。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未带版本信息的服务器，以确保 OpenClaw 仅运行在它已测试过的协议接口之上。

### Codex app-server 工具结果中间件

当清单声明 `contracts.embeddedExtensionFactories: ["codex-app-server"]` 时，内置插件还可以通过 `api.registerCodexAppServerExtensionFactory(...)` 挂载 Codex app-server 专用的 `tool_result` 中间件。这是受信任插件的扩展点，适用于那些需要在原生 Codex harness 内部运行、并在工具输出回投到 OpenClaw 转录之前完成的异步工具结果转换。

### 原生 Codex harness 模式

内置的 `codex` harness 是用于内嵌 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用限制性 allowlist，还需将 `codex` 加入 `plugins.allow`。它与 `openai-codex/*` 不同：

- `openai-codex/*` 通过常规 OpenClaw 提供商路径使用 ChatGPT / Codex OAuth。
- `codex/*` 使用内置 Codex 提供商，并通过 Codex app-server 路由该轮次。

在该模式运行时，Codex 负责原生线程 id、resume 行为、上下文压缩以及 app-server 执行。OpenClaw 仍负责聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径可以接管此次运行时，请使用 `embeddedHarness.runtime: "codex"` 并设置 `embeddedHarness.fallback: "none"`。该配置仅是一个选择保护：Codex app-server 失败本来就会直接失败，而不会再通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 使用 `agents.defaults.embeddedHarness` 为 `{ runtime: "auto", fallback: "pi" }` 来运行内嵌智能体。在 `auto` 模式下，已注册的插件 harness 可以接管某个提供商 / 模型组合。如果没有匹配项，OpenClaw 会回退到 PI。

当你需要在缺少插件 harness 选择时直接失败，而不是使用 PI 时，请设置 `fallback: "none"`。已选中的插件 harness 失败本就会硬失败。这不会阻止显式设置 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅使用 Codex 的内嵌运行：

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

如果你希望任意已注册的插件 harness 都可以接管匹配的模型，但又不希望 OpenClaw 静默回退到 PI，请保持 `runtime: "auto"` 并禁用回退：

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

每个智能体的覆盖配置使用相同结构：

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
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置的 runtime。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可通过环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

在禁用回退后，如果请求的 harness 未注册、不支持已解析的提供商 / 模型，或者在产生轮次副作用前就失败，会话将提早失败。这对于仅使用 Codex 的部署，以及必须证明 Codex app-server 路径确实被使用的实时测试，都是有意设计的行为。

此设置仅控制内嵌智能体 harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商特定的模型路由。

## 原生会话与转录镜像

Harness 可以保留原生 session id、thread id 或守护进程侧的 resume token。请将这种绑定明确地与 OpenClaw 会话关联起来，并持续将用户可见的助手 / 工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下能力的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切换回内置 PI harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了 sidecar 绑定，请实现 `reset(...)`，以便 OpenClaw 在所属 OpenClaw 会话被重置时清除它。

## 工具和媒体结果

核心会构造 OpenClaw 工具列表，并将其传入已准备好的尝试中。当 harness 执行动态工具调用时，请通过 harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批以及消息工具输出与 PI 支持的运行共享同一条投递路径。

## 当前限制

- 公共导入路径是通用的，但某些 attempt / result 类型别名仍因兼容性而保留 `Pi` 命名。
- 第三方 harness 安装仍属实验性。在你确实需要原生会话运行时之前，优先使用提供商插件。
- 支持跨轮次切换 harness。不要在某一轮次中途切换 harness，尤其是在原生工具、审批、助手文本或消息发送已经开始之后。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助函数](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
