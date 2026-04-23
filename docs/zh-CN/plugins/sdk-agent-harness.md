---
read_when:
    - 你正在更改嵌入式智能体运行时或 harness 注册表
    - 你正在从内置或受信任插件注册一个智能体 harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 供插件替换底层嵌入式智能体执行器的实验性 SDK 接口
title: 智能体 harness 插件
x-i18n:
    generated_at: "2026-04-23T22:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**智能体 harness** 是一个已准备好的 OpenClaw 智能体轮次的底层执行器。
它不是模型提供商，不是渠道，也不是工具注册表。

仅对内置或受信任的原生插件使用这一接口。该契约仍处于实验阶段，
因为参数类型有意镜像当前的嵌入式运行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话运行时，而常规的 OpenClaw 提供商传输层并不是合适抽象时，请注册智能体 harness。

示例：

- 拥有线程与压缩能力的原生 coding-agent 服务器
- 必须流式传输原生计划 / 推理 / 工具事件的本地 CLI 或守护进程
- 除了 OpenClaw 会话 transcript 之外，还需要自身 resume id 的模型运行时

不要只是为了添加新的 LLM API 就去注册 harness。对于普通的 HTTP 或
WebSocket 模型 API，请构建[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责的内容

在选择 harness 之前，OpenClaw 已经解析好了：

- 提供商和模型
- 运行时 auth 状态
- thinking 级别和上下文预算
- OpenClaw transcript / 会话文件
- 工作区、沙箱隔离和工具策略
- 渠道回复回调和流式回调
- 模型回退和实时模型切换策略

这种划分是有意为之。harness 负责运行一个已准备好的尝试；它不会选择
提供商、替换渠道投递，也不会静默切换模型。

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

OpenClaw 会在提供商 / 模型解析之后选择 harness：

1. 现有会话中已记录的 harness id 优先，因此配置 / 环境变量更改不会将该 transcript 热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用对应 id 的已注册 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册的 harness 询问自己是否支持已解析的提供商 / 模型。
5. 如果没有匹配的已注册 harness，OpenClaw 会使用 PI，除非已禁用 PI 回退。

插件 harness 失败会表现为运行失败。在 `auto` 模式下，只有当没有任何已注册插件 harness 支持已解析的
提供商 / 模型时，才会使用 PI 回退。一旦某个插件 harness 已经认领了一次运行，OpenClaw 就不会再通过 PI 重放同一轮次，因为那会改变 auth / 运行时语义，或者导致副作用重复。

选中的 harness id 会在一次嵌入式运行后与会话 id 一起持久化。
在 harness 固定机制出现之前创建的旧会话，只要已有 transcript 历史，就会被视为固定到 PI。
当你要在 PI 和原生插件 harness 之间切换时，请使用新的 / 已重置的会话。
`/status` 会在 `Fast` 旁显示像 `codex` 这样的非默认 harness id；
PI 由于是默认兼容路径，因此保持隐藏。
如果你觉得选中的 harness 出乎意料，请启用 `agents/harness` 调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含选中的 harness id、选择原因、运行时 / 回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置 Codex 插件将 `codex` 注册为其 harness id。核心将其视为普通的插件 harness id；Codex 专属别名应放在插件或运维配置中，而不是共享运行时选择器中。

## 提供商与 harness 配对

大多数 harness 也应该注册一个提供商。提供商会让模型引用、auth 状态、模型元数据以及 `/model` 选择对 OpenClaw 其余部分可见。然后 harness 再在 `supports(...)` 中认领该提供商。

内置 Codex 插件遵循这一模式：

- 提供商 id：`codex`
- 用户模型引用：`openai/gpt-5.5` 加上 `embeddedHarness.runtime: "codex"`；
  旧的 `codex/gpt-*` 引用仍因兼容性而被接受
- harness id：`codex`
- auth：合成的提供商可用性，因为 Codex harness 拥有原生 Codex 登录 / 会话
- app-server 请求：OpenClaw 将裸模型 id 发送给 Codex，并让 harness 与原生 app-server 协议通信

Codex 插件是增量性的。普通 `openai/gpt-*` 引用会继续使用
常规 OpenClaw 提供商路径，除非你通过
`embeddedHarness.runtime: "codex"` 强制使用 Codex harness。
旧的 `codex/gpt-*` 引用仍会为兼容性选择 Codex 提供商和 harness。

有关运维设置、模型前缀示例和仅限 Codex 的配置，请参阅
[Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 版本为 `0.118.0` 或更高。
Codex 插件会检查 app-server 初始化握手，并阻止较旧或未标注版本的服务器，以确保 OpenClaw 仅运行在经过测试的协议接口之上。

### Codex app-server tool-result 中间件

内置插件还可以通过 `api.registerCodexAppServerExtensionFactory(...)`
附加 Codex app-server 专用的 `tool_result`
中间件，前提是它们的 manifest 声明了 `contracts.embeddedExtensionFactories: ["codex-app-server"]`。
这是受信任插件的扩展缝隙，用于那些需要在原生 Codex harness 内运行、并在工具输出映射回 OpenClaw transcript 之前执行的异步 tool-result 转换。

### 原生 Codex harness 模式

内置的 `codex` harness 是嵌入式 OpenClaw
智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用了严格允许列表，还需要将 `codex` 加入 `plugins.allow`。
原生 app-server 配置应使用 `openai/gpt-*` 并搭配 `embeddedHarness.runtime: "codex"`。
如果要通过 PI 使用 Codex OAuth，请改用 `openai-codex/*`。
旧的 `codex/*` 模型引用仍然保留，作为原生 harness 的兼容别名。

当此模式运行时，Codex 负责原生线程 id、resume 行为、
压缩和 app-server 执行。OpenClaw 仍负责聊天渠道、
可见 transcript 镜像、工具策略、审批、媒体投递和会话
选择。当你需要证明只有 Codex
app-server 路径可以认领这次运行时，请使用 `embeddedHarness.runtime: "codex"` 搭配
`embeddedHarness.fallback: "none"`。
该配置只是一个选择保护：Codex app-server 失败本就会直接失败，而不会通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 使用
`agents.defaults.embeddedHarness` 设为 `{ runtime: "auto", fallback: "pi" }`
来运行嵌入式智能体。在 `auto` 模式下，已注册的插件
harness 可以认领某个提供商 / 模型对。如果没有匹配项，OpenClaw 会回退到 PI。

当你希望在缺失插件 harness 选择时直接失败，而不是使用 PI，请设置 `fallback: "none"`。
被选中的插件 harness 一旦失败，本来也会直接失败。
这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅限 Codex 的嵌入式运行：

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

如果你希望任何已注册的插件 harness 都可以认领匹配模型，但又不希望 OpenClaw 静默回退到 PI，请保留 `runtime: "auto"` 并禁用回退：

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

按智能体的覆盖使用相同结构：

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
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可以通过
环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果请求的 harness 未注册、
不支持已解析的提供商 / 模型，或在产生轮次副作用之前失败，会话会提前失败。
这正是仅限 Codex 的部署以及必须证明
Codex app-server 路径确实在使用中的实时测试所期望的行为。

此设置仅控制嵌入式智能体 harness。它不会禁用
图像、视频、音乐、TTS、PDF 或其他特定提供商的模型路由。

## 原生会话与 transcript 镜像

harness 可以保留原生 session id、thread id 或守护进程侧的 resume token。
请将这种绑定明确地与 OpenClaw 会话关联起来，并持续将用户可见的 assistant / 工具输出镜像到 OpenClaw transcript 中。

OpenClaw transcript 仍然是以下能力的兼容层：

- 渠道可见的会话历史
- transcript 搜索与索引
- 在后续轮次切回内置 PI harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了一个 sidecar 绑定，请实现 `reset(...)`，这样 OpenClaw 才能在所属 OpenClaw 会话被重置时清除它。

## 工具与媒体结果

核心会构造 OpenClaw 工具列表，并将其传入已准备好的尝试。
当 harness 执行动态工具调用时，请通过 harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批以及消息工具输出，沿用与 PI 支持运行相同的投递路径。

## 当前限制

- 公共导入路径是通用的，但某些 attempt / result 类型别名为了兼容性仍保留 `Pi` 名称。
- 第三方 harness 安装仍处于实验阶段。在你真正需要原生会话运行时之前，请优先使用提供商插件。
- 支持跨轮次切换 harness。不要在一个轮次中途，在原生工具、审批、assistant 文本或消息发送已经开始后切换 harness。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助函数](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
