---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-04-25T01:34:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

**上下文引擎** 控制 OpenClaw 如何为每次运行构建模型上下文：
包含哪些消息、如何总结较早的历史记录，以及如何跨子智能体边界管理
上下文。

OpenClaw 内置了一个 `legacy` 引擎，并默认使用它——大多数
用户都不需要更改这一点。只有当你希望获得不同的组装、压缩或跨会话召回行为时，
才需要安装并选择插件引擎。

## 快速开始

检查当前启用了哪个引擎：

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### 安装上下文引擎插件

上下文引擎插件的安装方式与其他 OpenClaw 插件相同。先安装，
然后在插槽中选择该引擎：

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

然后在你的配置中启用该插件，并将其选为活动引擎：

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // must match the plugin's registered engine id
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin-specific config goes here (see the plugin's docs)
      },
    },
  },
}
```

安装并配置完成后，重启 Gateway 网关。

要切换回内置引擎，将 `contextEngine` 设为 `"legacy"`（或者
直接删除该键——`"legacy"` 是默认值）。

## 工作原理

每次 OpenClaw 运行模型提示时，上下文引擎都会参与
四个生命周期节点：

1. **摄取** — 当新消息被添加到会话时调用。该引擎
   可以将消息存储或索引到它自己的数据存储中。
2. **组装** — 在每次模型运行前调用。该引擎返回一组有序的
   消息（以及可选的 `systemPromptAddition`），这些内容会适配
   token 预算。
3. **压缩** — 当上下文窗口已满，或当用户运行
   `/compact` 时调用。该引擎会总结较早的历史记录以释放空间。
4. **轮次结束后** — 在一次运行完成后调用。该引擎可以持久化状态、
   触发后台压缩，或更新索引。

对于内置的非 ACP Codex Harness，OpenClaw 会通过将组装后的上下文
映射到 Codex 开发者指令和当前轮次提示中，应用相同的生命周期。
Codex 仍然管理它自己的原生线程历史记录和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

- **prepareSubagentSpawn** — 在子运行
  开始前准备共享上下文状态。该钩子接收父/子会话键、`contextMode`
  （`isolated` 或 `fork`）、可用的转录 id/文件，以及可选的 TTL。
  如果它返回一个回滚句柄，那么当启动在准备成功后失败时，
  OpenClaw 会调用它。
- **onSubagentEnded** — 当子智能体会话完成或被清理时执行清理。

### 系统提示补充

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw
会将其前置到该次运行的系统提示中。这让引擎能够注入
动态召回指导、检索指令或上下文感知提示，
而无需依赖静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器会直接处理消息持久化）。
- **组装**：透传（运行时中现有的 sanitize → validate → limit 流水线
  会处理上下文组装）。
- **压缩**：委托给内置的总结式压缩，它会创建
  一个较早消息的单一摘要，并保持最近消息不变。
- **轮次结束后**：无操作。

legacy 引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或它被设为 `"legacy"`）时，
会自动使用该引擎。

## 插件引擎

插件可以使用插件 API 注册一个上下文引擎：

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

然后在配置中启用它：

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine 接口

必需成员：

| 成员               | 类型     | 用途                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | 属性     | 引擎 id、名称、版本，以及它是否拥有压缩控制权            |
| `ingest(params)`   | 方法     | 存储单条消息                                             |
| `assemble(params)` | 方法     | 为一次模型运行构建上下文（返回 `AssembleResult`）        |
| `compact(params)`  | 方法     | 总结/缩减上下文                                          |

`assemble` 返回一个 `AssembleResult`，其中包含：

- `messages` — 要发送给模型的有序消息。
- `estimatedTokens`（必需，`number`）— 引擎对
  已组装上下文中总 token 数的估算。OpenClaw 会将其用于压缩阈值
  决策和诊断报告。
- `systemPromptAddition`（可选，`string`）— 前置到系统提示中的内容。

可选成员：

| 成员                           | 类型   | 用途                                                                                                           |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 为会话初始化引擎状态。当引擎首次看到一个会话时调用一次（例如导入历史记录）。                                   |
| `ingestBatch(params)`          | 方法   | 以批量方式摄取一个已完成轮次。在一次运行完成后调用，并一次性传入该轮次的所有消息。                             |
| `afterTurn(params)`            | 方法   | 运行后的生命周期工作（持久化状态、触发后台压缩）。                                                             |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前为其设置共享状态。                                                                               |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后进行清理。                                                                                     |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重载期间调用——不是按会话调用。                                              |

### ownsCompaction

`ownsCompaction` 控制 Pi 内置的尝试内自动压缩是否
在该次运行中保持启用：

- `true` — 该引擎拥有压缩行为的控制权。OpenClaw 会禁用 Pi 内置的
  自动压缩功能用于该次运行，而引擎的 `compact()` 实现
  负责处理 `/compact`、溢出恢复压缩，以及它希望在 `afterTurn()`
  中执行的任何主动压缩。OpenClaw 仍然可能运行
  提示前的溢出保护机制；当它预测完整转录会溢出时，
  恢复路径会在再次提交提示之前调用当前活动引擎的 `compact()`。
- `false` 或未设置 — Pi 内置的自动压缩在提示
  执行期间仍可能运行，但活动引擎的 `compact()` 方法仍会用于
  `/compact` 和溢出恢复。

`ownsCompaction: false` **并不**意味着 OpenClaw 会自动回退到
legacy 引擎的压缩路径。

这意味着有两种有效的插件模式：

- **拥有模式** — 实现你自己的压缩算法，并设置
  `ownsCompaction: true`。
- **委托模式** — 设置 `ownsCompaction: false`，并让 `compact()` 调用
  `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用
  OpenClaw 内置的压缩行为。

对于一个活动的非拥有型引擎来说，无操作的 `compact()` 是不安全的，因为它
会禁用该引擎插槽正常的 `/compact` 和溢出恢复压缩路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

该插槽在运行时是排他的——对于给定的一次运行或压缩操作，
只会解析一个已注册的上下文引擎。其他已启用的
`kind: "context-engine"` 插件仍然可以加载并运行它们的注册
代码；`plugins.slots.contextEngine` 只决定当 OpenClaw 需要
上下文引擎时，会解析哪个已注册的引擎 id。

## 与压缩和记忆的关系

- **压缩** 是上下文引擎的一项职责。legacy 引擎
  委托给 OpenClaw 的内置总结机制。插件引擎可以实现
  任何压缩策略（DAG 摘要、向量检索等）。
- **记忆插件**（`plugins.slots.memory`）与上下文引擎是分离的。
  记忆插件提供搜索/检索；上下文引擎控制
  模型能看到什么。它们可以协同工作——上下文引擎可能会在
  组装期间使用记忆插件的数据。希望使用当前活动记忆
  提示路径的插件引擎，应优先使用
  `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，
  它会将当前活动的记忆提示区段转换为可直接前置的
  `systemPromptAddition`。如果引擎需要更底层的
  控制，它仍然可以通过
  `openclaw/plugin-sdk/memory-host-core` 中的
  `buildActiveMemoryPromptSection(...)`
  提取原始行。
- **会话修剪**（在内存中裁剪旧工具结果）仍会运行，
  无论当前启用了哪个上下文引擎。

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续保留它们当前的历史记录。
  新引擎将接管之后的运行。
- 引擎错误会被记录并显示在诊断信息中。如果插件引擎
  注册失败，或者所选引擎 id 无法解析，OpenClaw
  不会自动回退；在你修复插件或将
  `plugins.slots.contextEngine` 切回 `"legacy"` 之前，运行都会失败。
- 在开发过程中，使用 `openclaw plugins install -l ./my-engine` 可以链接
  本地插件目录，而无需复制。

另请参阅：[压缩](/zh-CN/concepts/compaction)、[上下文](/zh-CN/concepts/context)、
[插件](/zh-CN/tools/plugin)、[插件清单](/zh-CN/plugins/manifest)。

## 相关内容

- [上下文](/zh-CN/concepts/context) — 如何为智能体轮次构建上下文
- [Plugin architecture](/zh-CN/plugins/architecture) — 注册上下文引擎插件
- [压缩](/zh-CN/concepts/compaction) — 总结长对话
