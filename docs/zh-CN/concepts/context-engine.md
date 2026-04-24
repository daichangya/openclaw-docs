---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎和插件引擎之间切换
    - 你正在构建一个上下文引擎插件
summary: 上下文引擎：可插拔的上下文组装、压缩和子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-04-24T04:20:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文：
包含哪些消息、如何总结较早的历史记录，以及如何跨子智能体边界管理
上下文。

OpenClaw 内置了 `legacy` 引擎，并默认使用它——大多数
用户都不需要更改。只有当你想要不同的组装、压缩或跨会话召回行为时，
才需要安装并选择插件引擎。

## 快速开始

检查当前激活的是哪个引擎：

```bash
openclaw doctor
# 或直接检查配置：
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### 安装上下文引擎插件

上下文引擎插件的安装方式与其他 OpenClaw 插件相同。先安装，
然后在插槽中选择该引擎：

```bash
# 从 npm 安装
openclaw plugins install @martian-engineering/lossless-claw

# 或从本地路径安装（用于开发）
openclaw plugins install -l ./my-context-engine
```

然后在你的配置中启用该插件，并将其选为当前激活的引擎：

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // 必须与插件注册的引擎 id 匹配
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // 插件特定配置写在这里（参见该插件的文档）
      },
    },
  },
}
```

安装并配置后，重启 Gateway 网关。

若要切换回内置引擎，将 `contextEngine` 设为 `"legacy"`（或者
直接删除该键——`"legacy"` 是默认值）。

## 工作原理

每次 OpenClaw 运行模型提示词时，上下文引擎都会参与
四个生命周期阶段：

1. **摄取**——当新消息被添加到会话时调用。引擎
   可以将该消息存储或索引到它自己的数据存储中。
2. **组装**——在每次模型运行前调用。引擎返回一组按顺序排列的
   消息（以及可选的 `systemPromptAddition`），这些内容会适配
   token 预算。
3. **压缩**——当上下文窗口已满，或当用户运行
   `/compact` 时调用。引擎会总结较早的历史记录以释放空间。
4. **轮次结束后**——在一次运行完成后调用。引擎可以持久化状态、
   触发后台压缩，或更新索引。

对于内置的非 ACP Codex harness，OpenClaw 通过将已组装的上下文投射到
Codex 开发者指令和当前轮次提示词中，应用相同的生命周期。Codex 仍然保留
其原生线程历史记录和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

- **prepareSubagentSpawn**——在子运行开始前准备共享上下文状态。
  该钩子接收父/子会话键、`contextMode`
  （`isolated` 或 `fork`）、可用的转录 id/文件，以及可选的 TTL。
  如果它返回一个回滚句柄，那么当准备成功后生成失败时，
  OpenClaw 会调用它。
- **onSubagentEnded**——在子智能体会话完成或被清理时执行清理。

### 系统提示词追加内容

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw
会将其预置到本次运行的系统提示词前面。这让引擎能够注入
动态召回指引、检索指令或上下文感知提示，
而无需依赖静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **摄取**：无操作（会话管理器会直接处理消息持久化）。
- **组装**：直通（运行时中的现有 sanitize → validate → limit 流水线
  负责处理上下文组装）。
- **压缩**：委托给内置的总结式压缩，它会对较早的消息生成
  单一摘要，并保留最近的消息不变。
- **轮次结束后**：无操作。

legacy 引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或者它被设为 `"legacy"`）时，
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
      // 将消息存储到你的数据存储中
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // 返回适配预算的消息
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
      // 总结较早的上下文
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

| 成员               | 类型     | 用途 |
| ------------------ | -------- | ---- |
| `info`             | 属性     | 引擎 id、名称、版本，以及它是否负责压缩 |
| `ingest(params)`   | 方法     | 存储单条消息 |
| `assemble(params)` | 方法     | 为一次模型运行构建上下文（返回 `AssembleResult`） |
| `compact(params)`  | 方法     | 总结/缩减上下文 |

`assemble` 返回一个 `AssembleResult`，包含：

- `messages`——发送给模型的有序消息。
- `estimatedTokens`（必需，`number`）——引擎对
  已组装上下文总 token 数的估算。OpenClaw 会将其用于压缩阈值
  决策和诊断报告。
- `systemPromptAddition`（可选，`string`）——预置到系统提示词前面的内容。

可选成员：

| 成员                           | 类型   | 用途 |
| ------------------------------ | ------ | ---- |
| `bootstrap(params)`            | 方法   | 为会话初始化引擎状态。当引擎首次看到某个会话时调用一次（例如导入历史记录）。 |
| `ingestBatch(params)`          | 方法   | 批量摄取一个已完成的轮次。在一次运行结束后调用，且该轮次的所有消息会一次性传入。 |
| `afterTurn(params)`            | 方法   | 运行后的生命周期工作（持久化状态、触发后台压缩）。 |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前为其设置共享状态。 |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后执行清理。 |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重载时调用——不是按会话调用。 |

### ownsCompaction

`ownsCompaction` 控制 Pi 的内置单次尝试内自动压缩是否在本次运行中
保持启用：

- `true`——该引擎负责压缩行为。OpenClaw 会为该次运行禁用 Pi 的内置
  自动压缩，而引擎的 `compact()` 实现则负责处理 `/compact`、
  溢出恢复压缩，以及它希望在 `afterTurn()` 中执行的任何主动
  压缩。
- `false` 或未设置——Pi 的内置自动压缩仍可能在提示词
  执行期间运行，但当前激活引擎的 `compact()` 方法仍会用于
  `/compact` 和溢出恢复。

`ownsCompaction: false` **并不**意味着 OpenClaw 会自动回退到
legacy 引擎的压缩路径。

这意味着存在两种有效的插件模式：

- **接管模式**——实现你自己的压缩算法，并设置
  `ownsCompaction: true`。
- **委托模式**——设置 `ownsCompaction: false`，并让 `compact()` 调用
  `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，
  以使用 OpenClaw 的内置压缩行为。

对于一个处于激活状态的非接管引擎来说，无操作的 `compact()` 是不安全的，因为它
会禁用该引擎插槽的常规 `/compact` 和溢出恢复压缩路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // 选择当前激活的上下文引擎。默认值："legacy"。
      // 设为某个插件 id 即可使用插件引擎。
      contextEngine: "legacy",
    },
  },
}
```

该插槽在运行时是互斥的——对于一次给定的运行或压缩操作，只会解析
一个已注册的上下文引擎。其他已启用的
`kind: "context-engine"` 插件仍然可以加载并运行其注册
代码；`plugins.slots.contextEngine` 只决定当 OpenClaw 需要上下文引擎时，
它会解析哪个已注册的引擎 id。

## 与压缩和记忆的关系

- **压缩**是上下文引擎的一项职责。legacy 引擎
  委托给 OpenClaw 的内置总结机制。插件引擎可以实现
  任意压缩策略（DAG 摘要、向量检索等）。
- **记忆插件**（`plugins.slots.memory`）与上下文引擎是分开的。
  记忆插件提供搜索/检索；上下文引擎控制
  模型看到什么。它们可以协同工作——上下文引擎可能会在
  组装期间使用记忆插件的数据。想要使用当前激活记忆
  提示路径的插件引擎，应优先使用
  `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，
  它会把当前激活的记忆提示部分转换成可直接预置的
  `systemPromptAddition`。如果引擎需要更底层的
  控制，它仍然可以通过
  `openclaw/plugin-sdk/memory-host-core` 中的
  `buildActiveMemoryPromptSection(...)`
  拉取原始行内容。
- **会话裁剪**（在内存中修剪旧的工具结果）仍会运行，
  无论当前激活的是哪个上下文引擎。

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续保留其当前历史记录。
  新引擎将接管后续运行。
- 引擎错误会被记录并显示在诊断中。如果插件引擎
  注册失败，或无法解析所选引擎 id，OpenClaw
  不会自动回退；运行会失败，直到你修复插件或
  将 `plugins.slots.contextEngine` 切回 `"legacy"`。
- 在开发时，使用 `openclaw plugins install -l ./my-engine` 可以链接
  本地插件目录而不进行复制。

另见：[压缩](/zh-CN/concepts/compaction)、[上下文](/zh-CN/concepts/context)、
[插件](/zh-CN/tools/plugin)、[插件清单](/zh-CN/plugins/manifest)。

## 相关内容

- [上下文](/zh-CN/concepts/context)——如何为智能体轮次构建上下文
- [插件架构](/zh-CN/plugins/architecture)——注册上下文引擎插件
- [压缩](/zh-CN/concepts/compaction)——总结长对话
