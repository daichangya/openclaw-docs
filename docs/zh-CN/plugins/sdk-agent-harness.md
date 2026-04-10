---
read_when:
    - 你正在更改内嵌智能体运行时或 Harness 注册表
    - 你正在从内置或受信任插件注册一个智能体 Harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换底层内嵌智能体执行器的插件实验性 SDK 接口层
title: 智能体 Harness 插件
x-i18n:
    generated_at: "2026-04-10T20:23:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba482dd6a2e4730c2d623b4739e2e6037cec8bb71bf7164b4e9d7ea8e43056d8
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# 智能体 Harness 插件

**智能体 Harness** 是一个已准备好的 OpenClaw 智能体单次轮转的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。

仅对内置或受信任的原生插件使用此接口层。该契约仍处于实验阶段，因为参数类型有意映射当前的内嵌运行器。

## 何时使用 Harness

当某个模型家族拥有自己的原生会话运行时，而常规 OpenClaw 提供商传输抽象并不适用时，请注册一个智能体 Harness。

示例：

- 拥有线程和上下文压缩能力的原生 coding-agent 服务器
- 必须流式传输原生计划/推理/工具事件的本地 CLI 或守护进程
- 除了 OpenClaw 会话转录之外，还需要自己的恢复 id 的模型运行时

不要仅为了添加一个新的 LLM API 而注册 Harness。对于普通的 HTTP 或 WebSocket 模型 API，请构建一个 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责的内容

在选择 Harness 之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时凭证状态
- 思考级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式回调
- 模型回退和实时模型切换策略

这种拆分是有意设计的。Harness 负责运行一个已准备好的尝试；它不会选择提供商、替换渠道投递，也不会静默切换模型。

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

OpenClaw 会在提供商/模型解析之后选择 Harness：

1. `OPENCLAW_AGENT_RUNTIME=<id>` 会强制使用具有该 id 的已注册 Harness。
2. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI Harness。
3. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册的 Harness 查询其是否支持已解析的提供商/模型。
4. 如果没有匹配的已注册 Harness，OpenClaw 会使用 PI。

被强制指定的插件 Harness 如果失败，会作为运行失败呈现。在 `auto` 模式下，如果所选插件 Harness 在某次轮转产生副作用之前失败，OpenClaw 可能会回退到 PI。

内置 Codex 插件将 `codex` 注册为其 Harness id。为兼容起见，当你手动设置 `OPENCLAW_AGENT_RUNTIME` 时，`codex-app-server` 和 `app-server` 也会解析到同一个 Harness。

## 提供商与 Harness 配对

大多数 Harness 也应该注册一个提供商。提供商会让模型引用、凭证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。然后 Harness 在 `supports(...)` 中声明该提供商。

内置 Codex 插件遵循这一模式：

- provider id: `codex`
- 用户模型引用：`codex/gpt-5.4`、`codex/gpt-5.2`，或 Codex app server 返回的其他模型
- harness id: `codex`
- 凭证：合成提供商可用性，因为 Codex Harness 拥有原生 Codex 登录/会话
- app-server 请求：OpenClaw 向 Codex 发送裸模型 id，并让 Harness 与原生 app-server 协议通信

Codex 插件是增量性的。普通 `openai/gpt-*` 引用仍然是 OpenAI 提供商引用，并继续使用常规 OpenClaw 提供商路径。当你希望使用由 Codex 管理的凭证、Codex 模型发现、原生线程以及 Codex app-server 执行时，请选择 `codex/gpt-*`。`/model` 可以在 Codex app server 返回的 Codex 模型之间切换，而无需 OpenAI 提供商凭证。

OpenClaw 要求 Codex app-server 版本为 `0.118.0` 或更高。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未带版本信息的服务器，从而确保 OpenClaw 仅在它已测试过的协议接口层上运行。

## Harness 选择策略

默认情况下，OpenClaw 运行内嵌智能体时，`agents.defaults.embeddedHarness` 设置为 `{ runtime: "auto", fallback: "pi" }`。在 `auto` 模式下，已注册的插件 Harness 可以声明某个提供商/模型对。如果都不匹配，或者自动选中的插件 Harness 在产生输出之前失败，OpenClaw 会回退到 PI。

当你需要证明某个插件 Harness 是唯一被执行的运行时时，请设置 `fallback: "none"`：

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

## 原生会话与转录镜像

Harness 可以保留原生 session id、thread id 或守护进程侧恢复 token。请将这种绑定明确关联到 OpenClaw 会话，并继续将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下能力的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮转中切换回内置 PI Harness
- 通用 `/new`、`/reset` 和会话删除行为

如果你的 Harness 存储了 sidecar 绑定，请实现 `reset(...)`，这样 OpenClaw 才能在所属 OpenClaw 会话重置时清除它。

## 工具和媒体结果

核心会构造 OpenClaw 工具列表并将其传入已准备好的尝试中。当 Harness 执行动态工具调用时，请通过 Harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批和消息工具输出与基于 PI 的运行共享同一条投递路径。

## 当前限制

- 公共导入路径是通用的，但某些 attempt/result 类型别名仍然保留 `Pi` 名称以保持兼容性。
- 第三方 Harness 安装仍处于实验阶段。在你确实需要原生会话运行时之前，请优先使用提供商插件。
- 支持跨轮转切换 Harness。不要在某次轮转中途切换 Harness，尤其是在原生工具、审批、助手文本或消息发送已经开始之后。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [模型提供商](/zh-CN/concepts/model-providers)
