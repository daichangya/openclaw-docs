---
read_when:
    - 你正在更改嵌入式智能体运行时或 Harness 注册表
    - 你正在从内置或受信任的插件注册一个智能体 Harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换底层嵌入式智能体执行器的插件实验性 SDK 接口面
title: 智能体 Harness 插件
x-i18n:
    generated_at: "2026-04-23T16:04:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec858acedaae8670c730022f8cc700499ac3b95d3d4144584e01051b224fee64
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# 智能体 Harness 插件

**智能体 harness** 是一个已准备好的 OpenClaw 智能体单次轮次的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。

仅对内置或受信任的原生插件使用此接口面。该契约仍然是实验性的，因为参数类型有意映射当前的嵌入式运行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话运行时，而常规 OpenClaw 提供商传输抽象并不适合时，注册一个智能体 harness。

例如：

- 拥有线程与压缩能力的原生 coding-agent 服务器
- 必须流式传输原生计划 / 推理 / 工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话转录之外，还需要自身 resume id 的模型运行时

不要仅仅为了添加一个新的 LLM API 而注册 harness。对于常规 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责的内容

在选择 harness 之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时凭证状态
- 思考级别和上下文预算
- OpenClaw 转录 / 会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种划分是有意设计的。harness 运行的是一个已准备好的尝试；它不会选择提供商、替代渠道投递，或静默切换模型。

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

OpenClaw 会在提供商 / 模型解析之后选择一个 harness：

1. 现有会话中记录的 harness id 优先生效，因此配置 / 环境变量的变化不会将该转录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 id 的已注册 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会询问已注册的 harness 是否支持已解析的提供商 / 模型。
5. 如果没有匹配的已注册 harness，除非禁用了 PI 回退，否则 OpenClaw 会使用 PI。

插件 harness 失败会表现为运行失败。在 `auto` 模式下，仅当没有已注册的插件 harness 支持已解析的提供商 / 模型时，才会使用 PI 回退。一旦某个插件 harness 已接管一次运行，OpenClaw 就不会通过 PI 重放同一轮次，因为这可能改变凭证 / 运行时语义或造成副作用重复。

嵌入式运行后，所选 harness id 会与会话 id 一起持久化。在 harness 固定机制之前创建的旧会话，一旦拥有转录历史，就会被视为固定到 PI。要在 PI 与原生插件 harness 之间切换，请使用新的 / 重置后的会话。`/status` 会在 `Fast` 旁显示诸如 `codex` 之类的非默认 harness id；PI 作为默认兼容路径则会被隐藏。

内置 Codex 插件将 `codex` 注册为它的 harness id。核心将其视为普通的插件 harness id；Codex 专用别名应属于插件或操作员配置，而不应放在共享运行时选择器中。

## 提供商与 harness 配对

大多数 harness 也应同时注册一个提供商。提供商让模型引用、凭证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。然后，harness 在 `supports(...)` 中声明对该提供商的支持。

内置 Codex 插件遵循这种模式：

- provider id：`codex`
- 用户模型引用：`codex/gpt-5.4`、`codex/gpt-5.2`，或 Codex app server 返回的其他模型
- harness id：`codex`
- 凭证：合成的提供商可用性，因为 Codex harness 拥有原生 Codex 登录 / 会话
- app-server 请求：OpenClaw 向 Codex 发送裸模型 id，并让 harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通的 `openai/gpt-*` 引用仍然是 OpenAI 提供商引用，并继续使用常规 OpenClaw 提供商路径。当你需要 Codex 管理的凭证、Codex 模型发现、原生线程和 Codex app-server 执行时，请选择 `codex/gpt-*`。`/model` 可以在 Codex app server 返回的 Codex 模型之间切换，而无需 OpenAI 提供商凭证。

有关操作员设置、模型前缀示例和仅限 Codex 的配置，请参阅 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 版本为 `0.118.0` 或更高。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未带版本信息的服务器，以确保 OpenClaw 只运行在其已测试过的协议接口面之上。

### Codex app-server 工具结果中间件

当清单声明 `contracts.embeddedExtensionFactories: ["codex-app-server"]` 时，内置插件还可以通过 `api.registerCodexAppServerExtensionFactory(...)` 附加 Codex app-server 专用的 `tool_result` 中间件。这是受信任插件的接口，用于那些需要在原生 Codex harness 内部运行、并在工具输出被投影回 OpenClaw 转录之前执行的异步工具结果转换。

### 原生 Codex harness 模式

内置的 `codex` harness 是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用了限制性 allowlist，还要将 `codex` 加入 `plugins.allow`。它与 `openai-codex/*` 不同：

- `openai-codex/*` 通过常规 OpenClaw 提供商路径使用 ChatGPT / Codex OAuth。
- `codex/*` 使用内置 Codex 提供商，并通过 Codex app-server 路由该轮次。

当此模式运行时，Codex 负责原生线程 id、resume 行为、压缩和 app-server 执行。OpenClaw 仍然负责聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径可以接管运行时，请使用 `embeddedHarness.runtime: "codex"` 配合 `embeddedHarness.fallback: "none"`。该配置仅是一个选择保护：Codex app-server 失败本来就会直接失败，而不会通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 以 `agents.defaults.embeddedHarness` 设置为 `{ runtime: "auto", fallback: "pi" }` 来运行嵌入式智能体。在 `auto` 模式下，已注册的插件 harness 可以接管某个提供商 / 模型组合。如果没有任何匹配，OpenClaw 会回退到 PI。

当你需要在缺少插件 harness 选择时直接失败，而不是使用 PI 时，请设置 `fallback: "none"`。已选中的插件 harness 失败本来就会硬失败。这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅限 Codex 的嵌入式运行：

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

如果你希望任何已注册的插件 harness 都能接管匹配的模型，但又绝不希望 OpenClaw 静默回退到 PI，请保持 `runtime: "auto"` 并禁用回退：

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

按智能体覆盖使用相同的结构：

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

`OPENCLAW_AGENT_RUNTIME` 仍然会覆盖已配置的运行时。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可通过环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

在禁用回退后，如果请求的 harness 未注册、不支持已解析的提供商 / 模型，或者在产生轮次副作用之前失败，则会话会尽早失败。这对仅限 Codex 的部署以及必须证明 Codex app-server 路径确实在使用中的实时测试而言，是有意设计的行为。

此设置只控制嵌入式智能体 harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商特定的模型路由。

## 原生会话与转录镜像

harness 可以保留原生会话 id、线程 id 或守护进程侧的 resume token。请将这种绑定明确关联到 OpenClaw 会话，并继续将用户可见的助手 / 工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下场景的兼容层：

- 渠道可见的会话历史
- 转录搜索与索引
- 在后续轮次切换回内置 PI harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了 sidecar 绑定，请实现 `reset(...)`，这样 OpenClaw 才能在所属 OpenClaw 会话被重置时清除它。

## 工具与媒体结果

核心会构建 OpenClaw 工具列表，并将其传入已准备好的尝试中。当 harness 执行动态工具调用时，请通过 harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批以及消息工具输出，与由 PI 支持的运行走同一条投递路径。

## 当前限制

- 公共导入路径是通用的，但某些 attempt / result 类型别名仍然保留 `Pi` 名称以保持兼容性。
- 第三方 harness 安装仍处于实验阶段。在你确实需要原生会话运行时之前，优先使用提供商插件。
- 支持跨轮次切换 harness。不要在一轮进行过程中、在原生工具、审批、助手文本或消息发送已经开始之后切换 harness。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
