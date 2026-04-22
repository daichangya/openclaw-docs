---
read_when:
    - 你正在更改嵌入式智能体运行时或 Harness 注册表
    - 你正在从内置或受信任的插件注册一个智能体 Harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换低级嵌入式智能体执行器的插件实验性 SDK 接口
title: 智能体 Harness 插件
x-i18n:
    generated_at: "2026-04-22T05:35:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 728fef59ae3cce29a3348842820f1f71a2eac98ae6b276179bce6c85d16613df
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# 智能体 Harness 插件

**智能体 Harness** 是一个已准备好的 OpenClaw 智能体单轮的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。

仅将此接口用于内置或受信任的原生插件。该契约仍处于实验阶段，因为其参数类型有意与当前的嵌入式运行器保持镜像一致。

## 何时使用 Harness

当某个模型家族拥有自己的原生会话运行时，而常规的 OpenClaw 提供商传输层并不是合适的抽象时，请注册一个智能体 Harness。

示例：

- 拥有线程和压缩能力的原生 coding-agent 服务器
- 必须流式传输原生计划/推理/工具事件的本地 CLI 或守护进程
- 除了 OpenClaw 会话转录之外，还需要自己的恢复 id 的模型运行时

**不要** 仅仅为了添加一个新的 LLM API 而注册 Harness。对于常规的 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍负责的内容

在选择 Harness 之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时凭证状态
- 思考级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种划分是有意为之。Harness 运行的是一次已准备好的尝试；它不会选择提供商、替换渠道投递，或静默切换模型。

## 注册 Harness

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

OpenClaw 会在提供商/模型解析完成后选择 Harness：

1. `OPENCLAW_AGENT_RUNTIME=<id>` 会强制使用具有该 id 的已注册 Harness。
2. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI Harness。
3. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册的 Harness 询问自己是否支持已解析的提供商/模型。
4. 如果没有匹配的已注册 Harness，OpenClaw 会使用 PI，除非已禁用 PI 回退。

插件 Harness 失败会显示为运行失败。在 `auto` 模式下，仅当没有任何已注册插件 Harness 支持已解析的提供商/模型时，才会使用 PI 回退。一旦某个插件 Harness 已经接管一次运行，OpenClaw 就不会再通过 PI 重放同一轮，因为这可能会改变凭证/运行时语义，或导致副作用重复发生。

内置的 Codex 插件将 `codex` 注册为其 Harness id。核心将其视为普通的插件 Harness id；Codex 特定别名应属于插件或操作员配置，而不是共享运行时选择器。

## 提供商与 Harness 配对

大多数 Harness 也应注册一个提供商。提供商让模型引用、凭证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。随后，Harness 会在 `supports(...)` 中声明该提供商。

内置的 Codex 插件遵循这一模式：

- provider id: `codex`
- 用户模型引用：`codex/gpt-5.4`、`codex/gpt-5.2`，或 Codex app server 返回的其他模型
- harness id: `codex`
- auth：合成的提供商可用性，因为 Codex Harness 拥有原生 Codex 登录/会话
- app-server 请求：OpenClaw 将裸模型 id 发送给 Codex，并让 Harness 与原生 app-server 协议通信

Codex 插件是增量添加的。普通的 `openai/gpt-*` 引用仍然是 OpenAI 提供商引用，并继续使用常规的 OpenClaw 提供商路径。当你希望使用 Codex 管理的凭证、Codex 模型发现、原生线程和 Codex app-server 执行时，请选择 `codex/gpt-*`。`/model` 可以在 Codex app server 返回的 Codex 模型之间切换，而无需 OpenAI 提供商凭证。

有关操作员设置、模型前缀示例和仅限 Codex 的配置，请参阅 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.118.0` 或更高版本。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未标明版本的服务器，以确保 OpenClaw 仅针对其已测试过的协议接口运行。

### 原生 Codex Harness 模式

内置的 `codex` Harness 是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用限制性 allowlist，还需在 `plugins.allow` 中包含 `codex`。它不同于 `openai-codex/*`：

- `openai-codex/*` 通过常规 OpenClaw 提供商路径使用 ChatGPT/Codex OAuth。
- `codex/*` 使用内置 Codex 提供商，并通过 Codex app-server 路由该轮次。

当此模式运行时，Codex 负责原生线程 id、恢复行为、压缩以及 app-server 执行。OpenClaw 仍负责聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径可以接管该次运行时，请使用 `embeddedHarness.runtime: "codex"` 并设置 `embeddedHarness.fallback: "none"`。该配置仅是一个选择保护：Codex app-server 失败本就会直接失败，而不是通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 运行嵌入式智能体时会将 `agents.defaults.embeddedHarness` 设置为 `{ runtime: "auto", fallback: "pi" }`。在 `auto` 模式下，已注册的插件 Harness 可以接管某个提供商/模型对。如果没有匹配项，OpenClaw 会回退到 PI。

当你需要在缺少插件 Harness 选择时直接失败，而不是使用 PI 时，请设置 `fallback: "none"`。已选中的插件 Harness 失败本来就会硬失败。这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅使用 Codex 的嵌入式运行：

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

如果你希望任何已注册的插件 Harness 都可以接管匹配的模型，但绝不希望 OpenClaw 静默回退到 PI，请保留 `runtime: "auto"` 并禁用回退：

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

每个智能体的覆盖配置使用相同的结构：

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

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置的运行时。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可以通过环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果请求的 Harness 未注册、不支持已解析的提供商/模型，或在产生该轮副作用之前就失败了，会话将提前失败。这对于仅限 Codex 的部署，以及必须证明确实正在使用 Codex app-server 路径的实时测试来说，是有意为之的。

此设置仅控制嵌入式智能体 Harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商特定的模型路由。

## 原生会话和转录镜像

Harness 可以保留原生会话 id、线程 id 或守护进程端恢复令牌。请将这种绑定明确地与 OpenClaw 会话关联，并持续将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下场景的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切换回内置 PI Harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 Harness 存储了侧车绑定，请实现 `reset(...)`，以便 OpenClaw 在所属 OpenClaw 会话重置时清除它。

## 工具和媒体结果

核心会构建 OpenClaw 工具列表，并将其传入已准备好的尝试中。当 Harness 执行动态工具调用时，请通过 Harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批和消息工具输出与基于 PI 的运行使用同一条投递路径。

## 当前限制

- 公共导入路径是通用的，但出于兼容性考虑，一些 attempt/result 类型别名仍保留 `Pi` 命名。
- 第三方 Harness 安装仍处于实验阶段。在你确实需要原生会话运行时之前，优先使用提供商插件。
- 支持跨轮次切换 Harness。不要在某一轮已经开始原生工具、审批、助手文本或消息发送之后，在该轮中途切换 Harness。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
