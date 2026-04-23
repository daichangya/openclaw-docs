---
read_when:
    - 你正在更改内嵌智能体运行时或 harness 注册表
    - 你正在从内置或受信任插件注册一个智能体 harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 供替换底层内嵌智能体执行器的插件使用的实验性 SDK 接口
title: 智能体 harness 插件
x-i18n:
    generated_at: "2026-04-23T20:57:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69d0c4febbc0f0397d4fc8a212039a2d78764798b82f48e600daf68626826904
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

一个**智能体 harness** 是执行一次已准备好的 OpenClaw 智能体轮次的底层执行器。
它不是模型提供商，不是渠道，也不是工具注册表。

仅应将这个接口用于内置或受信任的原生插件。该合约
仍然是实验性的，因为其参数类型有意镜像当前的
内嵌执行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话
运行时，而普通的 OpenClaw 提供商传输抽象并不合适时，请注册一个智能体 harness。

示例：

- 拥有线程和压缩逻辑的原生编码智能体服务器
- 必须流式传输原生计划/推理/工具事件的本地 CLI 或 daemon
- 除 OpenClaw 会话转录外，还需要自身 resume id 的模型运行时

不要仅仅为了增加一个新的 LLM API 就注册 harness。对于普通的 HTTP 或
WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责什么

在选择 harness 之前，OpenClaw 已经解析好了：

- 提供商和模型
- 运行时身份验证状态
- thinking 级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式回调
- 模型回退和实时模型切换策略

这种拆分是有意设计的。Harness 负责运行一次已准备好的尝试；它不会选择
提供商、替代渠道投递，或静默切换模型。

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
    // 启动或恢复你的原生线程。
    // 使用 params.prompt、params.tools、params.images、params.onPartialReply、
    // params.onAgentEvent，以及其他已准备好的尝试字段。
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

OpenClaw 会在提供商/模型解析之后选择 harness：

1. 现有会话中记录的 harness id 优先生效，因此配置/环境变量更改不会
   热切换该转录到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制选择该 id 对应的已注册 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册 harness 询问自己是否支持
   当前解析出的提供商/模型。
5. 如果没有任何已注册 harness 匹配，则 OpenClaw 使用 PI，除非
   PI 回退已被禁用。

插件 harness 失败会表现为运行失败。在 `auto` 模式下，只有在没有任何已注册插件 harness 支持当前解析出的
提供商/模型时，才会使用 PI 回退。一旦某个插件 harness 已经声明接管该次运行，OpenClaw 就不会再通过 PI 重新回放同一轮，因为这可能改变身份验证/运行时语义
或导致副作用重复。

选定的 harness id 会在一次内嵌运行后与会话 id 一起持久化。
在引入 harness 固定前创建的旧会话，一旦有转录历史，就会被视为固定到 PI。
在 PI 和原生插件 harness 之间切换时，请使用一个新的/已重置的会话。
`/status` 会在 `Fast` 旁边显示诸如 `codex`
这样的非默认 harness id；PI 会被隐藏，因为它是默认兼容路径。

内置 Codex 插件将 `codex` 注册为它的 harness id。核心将其视为普通插件 harness id；
Codex 特定别名应归属于插件或运维配置，而不是共享运行时选择器。

## 提供商与 harness 的配对

大多数 harness 也应同时注册一个提供商。提供商会让模型引用、
身份验证状态、模型元数据以及 `/model` 选择对 OpenClaw 的其他部分可见。
然后 harness 在 `supports(...)` 中声明自己接管该提供商。

内置 Codex 插件采用了这种模式：

- provider id：`codex`
- 用户模型引用：规范形式为 `openai/gpt-5.5`，并配合
  `embeddedHarness.runtime: "codex"`；旧版 `codex/gpt-*` 引用仍然为了兼容而被接受
- harness id：`codex`
- 身份验证：合成的提供商可用性，因为 Codex harness 拥有原生 Codex 登录/会话
- app-server 请求：OpenClaw 向 Codex 发送裸模型 id，并让
  harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通的 `openai/gpt-*` 引用仍然走
标准 OpenClaw 提供商路径，除非你通过
`embeddedHarness.runtime: "codex"` 强制使用 Codex harness。旧版 `codex/gpt-*` 引用
仍然会为了兼容而选择 Codex 提供商和 harness。

关于运维设置、模型前缀示例和仅 Codex 配置，请参见
[Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 版本为 `0.118.0` 或更高。Codex 插件会检查
app-server 初始化握手，并阻止较旧或未标明版本的服务器，
以确保 OpenClaw 仅在其已测试过的协议接口上运行。

### Codex app-server 工具结果中间件

当其 manifest 声明 `contracts.embeddedExtensionFactories: ["codex-app-server"]` 时，
内置插件还可以通过 `api.registerCodexAppServerExtensionFactory(...)` 挂接 Codex app-server 特定的 `tool_result`
中间件。
这是受信任插件的扩展点，用于在原生 Codex harness 内部运行异步工具结果转换，然后再将工具输出映射回 OpenClaw 转录。

### 原生 Codex harness 模式

内置的 `codex` harness 是内嵌 OpenClaw
智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件，并且如果你的配置使用了严格 allowlist，请将 `codex` 加入
`plugins.allow`。新配置应使用 `openai/gpt-*` 并配合 `embeddedHarness.runtime: "codex"`。旧版
`openai-codex/*` 和 `codex/*` 模型引用仍保留为兼容别名。

当该模式运行时，Codex 拥有原生线程 id、恢复行为、
压缩逻辑和 app-server 执行。OpenClaw 仍负责聊天渠道、
可见转录镜像、工具策略、审批、媒体投递和会话
选择。当你需要证明只有 Codex
app-server 路径能够接管该次运行时，请使用 `embeddedHarness.runtime: "codex"` 并配合
`embeddedHarness.fallback: "none"`。该配置只是一个选择保护：
Codex app-server 失败本来就会直接失败，而不是通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 会以 `agents.defaults.embeddedHarness`
设置为 `{ runtime: "auto", fallback: "pi" }` 来运行内嵌智能体。在 `auto` 模式下，已注册插件
harness 可以接管某个提供商/模型对。如果没有任何匹配，OpenClaw 会回退到 PI。

当你需要在缺少插件 harness 选择时直接失败，而不是改用 PI，
请设置 `fallback: "none"`。已选中的插件 harness 失败本来就会硬失败。
这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅 Codex 的内嵌运行：

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

如果你希望任何已注册插件 harness 都可以接管匹配模型，但绝不希望 OpenClaw 静默回退到 PI，请保持 `runtime: "auto"` 并禁用回退：

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

按智能体划分的覆盖使用相同结构：

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

`OPENCLAW_AGENT_RUNTIME` 仍然会覆盖已配置的运行时。使用
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可从环境变量中禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，当所请求的 harness 未注册、
不支持已解析的提供商/模型，或在产生轮次副作用前失败时，会话会提前失败。
这对于仅 Codex 部署以及必须证明 Codex
app-server 路径确实被使用的在线测试来说，是有意为之的行为。

此设置仅控制内嵌智能体 harness。它不会禁用
图片、视频、音乐、TTS、PDF 或其他按提供商划分的模型路由。

## 原生会话与转录镜像

Harness 可以保留原生 session id、thread id 或 daemon 侧 resume token。
请将这种绑定与 OpenClaw 会话显式关联，并持续
将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下内容的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次中切换回内置 PI harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了一个 sidecar 绑定，请实现 `reset(...)`，这样 OpenClaw
才能在所属 OpenClaw 会话被重置时清除它。

## 工具与媒体结果

核心会构建 OpenClaw 工具列表，并将其传入已准备好的尝试。
当 harness 执行动态工具调用时，请通过
harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图片、视频、音乐、TTS、审批以及消息工具输出
与基于 PI 的运行保持相同的投递路径。

## 当前限制

- 公开导入路径是通用的，但某些尝试/结果类型别名
  仍然为了兼容而保留 `Pi` 命名。
- 第三方 harness 安装仍是实验性的。在你确实需要原生会话运行时之前，
  优先使用提供商插件。
- 支持跨轮次切换 harness。不要在一轮执行过程中，在原生工具、审批、助手文本或消息发送已经开始后
  再切换 harness。

## 相关

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
