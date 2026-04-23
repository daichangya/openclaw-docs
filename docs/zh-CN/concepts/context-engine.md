---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在在旧版引擎与插件引擎之间切换
    - 你正在构建一个上下文引擎插件
summary: 上下文引擎：可插拔的上下文组装、压缩与子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-04-23T20:45:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 279def334ff5d719b0d7af878573fa37f2c81083805098bd5ccfa7e459875d17
    source_path: concepts/context-engine.md
    workflow: 15
---

上下文引擎** 控制 OpenClaw 如何为每次运行构建模型上下文。
它决定要包含哪些消息、如何总结较早的历史记录，以及
如何跨子智能体边界管理上下文。

OpenClaw 内置了一个 `legacy` 引擎。插件可以注册
替代引擎，用来替换当前活动的上下文引擎生命周期。

## 快速开始

检查当前活动的是哪个引擎：

```bash
openclaw doctor
# 或直接检查配置：
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### 安装上下文引擎插件

上下文引擎插件的安装方式与其他 OpenClaw 插件相同。先安装，
然后在 slot 中选择该引擎：

```bash
# 从 npm 安装
openclaw plugins install @martian-engineering/lossless-claw

# 或从本地路径安装（用于开发）
openclaw plugins install -l ./my-context-engine
```

然后在你的配置中启用该插件，并将其选为活动引擎：

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
        // 插件专用配置写在这里（参见该插件文档）
      },
    },
  },
}
```

安装并配置后，重启 gateway。

若要切回内置引擎，将 `contextEngine` 设为 `"legacy"`（或
完全移除该键——默认值就是 `"legacy"`）。

## 工作原理

每次 OpenClaw 运行模型提示时，上下文引擎都会参与
四个生命周期节点：

1. **Ingest** —— 在新消息被添加到会话时调用。该引擎
   可以将消息存储或索引到自己的数据存储中。
2. **Assemble** —— 在每次模型运行前调用。该引擎返回一个有序的
   消息集合（以及可选的 `systemPromptAddition`），并确保其适配
   token 预算。
3. **Compact** —— 当上下文窗口已满，或用户运行
   `/compact` 时调用。该引擎会总结较早历史以释放空间。
4. **After turn** —— 在一次运行完成后调用。该引擎可以持久化状态、
   触发后台压缩，或更新索引。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期 hook：

- **prepareSubagentSpawn** —— 在子运行
  启动前准备共享上下文状态。该 hook 会接收父/子会话键、`contextMode`
  （`isolated` 或 `fork`）、可用的 transcript id/文件，以及可选的 TTL。
  如果它返回一个回滚句柄，那么在准备成功后但 spawn 失败时，
  OpenClaw 会调用它。
- **onSubagentEnded** —— 当子智能体会话完成或被清扫时执行清理。

### 系统提示附加内容

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw
会将它预置到本次运行的系统提示前面。这使得引擎可以注入
动态回忆指导、检索说明或上下文感知提示，
而无需依赖静态工作区文件。

## 旧版引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **Ingest**：无操作（消息持久化直接由会话管理器处理）。
- **Assemble**：直通（上下文组装由运行时中现有的 sanitize → validate → limit 流水线处理）。
- **Compact**：委托给内置的总结式压缩，它会
  生成一份较早消息的单一摘要，并保留最近消息不变。
- **After turn**：无操作。

旧版引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或其值为 `"legacy"`）时，
会自动使用该引擎。

## 插件引擎

插件可以通过插件 API 注册一个上下文引擎：

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
      // 总结较早上下文
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

| 成员 | 类型 | 用途 |
| ---- | ---- | ---- |
| `info` | 属性 | 引擎 id、名称、版本，以及它是否拥有压缩控制权 |
| `ingest(params)` | 方法 | 存储单条消息 |
| `assemble(params)` | 方法 | 为一次模型运行构建上下文（返回 `AssembleResult`） |
| `compact(params)` | 方法 | 总结/缩减上下文 |

`assemble` 返回一个 `AssembleResult`，其中包含：

- `messages` —— 发送给模型的有序消息。
- `estimatedTokens`（必填，`number`）—— 引擎对
  已组装上下文总 token 数的估计。OpenClaw 用它来做压缩阈值
  决策和诊断报告。
- `systemPromptAddition`（可选，`string`）—— 预置到系统提示前面的内容。

可选成员：

| 成员 | 类型 | 用途 |
| ---- | ---- | ---- |
| `bootstrap(params)` | 方法 | 为会话初始化引擎状态。首次看到某个会话时调用一次（例如导入历史）。 |
| `ingestBatch(params)` | 方法 | 以批处理方式摄取一次完整轮次。一次运行完成后调用，并一次性传入该轮次中的所有消息。 |
| `afterTurn(params)` | 方法 | 运行后的生命周期工作（持久化状态、触发后台压缩）。 |
| `prepareSubagentSpawn(params)` | 方法 | 在子会话开始前设置共享状态。 |
| `onSubagentEnded(params)` | 方法 | 在子智能体结束后执行清理。 |
| `dispose()` | 方法 | 释放资源。在 gateway 关闭或插件重载时调用——而不是按会话调用。 |

### ownsCompaction

`ownsCompaction` 控制 Pi 的内置尝试内自动压缩是否在本次运行中
保持启用：

- `true` —— 该引擎拥有压缩行为控制权。OpenClaw 会为该次运行禁用 Pi 的内置
  自动压缩，而引擎的 `compact()` 实现需要负责 `/compact`、溢出恢复压缩，以及它希望在 `afterTurn()` 中执行的任何主动压缩。
- `false` 或未设置 —— Pi 的内置自动压缩仍可能在提示执行期间运行，但活动引擎的 `compact()` 方法仍会在
  `/compact` 和溢出恢复时被调用。

`ownsCompaction: false` **并不**表示 OpenClaw 会自动回退到
旧版引擎的压缩路径。

这意味着插件有两种有效模式：

- **拥有模式** —— 实现你自己的压缩算法，并设置
  `ownsCompaction: true`。
- **委托模式** —— 设置 `ownsCompaction: false`，并让 `compact()` 调用
  `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用
  OpenClaw 的内置压缩行为。

对于一个活动的非拥有型引擎，空操作的 `compact()` 是不安全的，因为它
会为该引擎 slot 禁用正常的 `/compact` 和溢出恢复压缩路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // 选择活动的上下文引擎。默认："legacy"。
      // 设为某个插件 id 以使用插件引擎。
      contextEngine: "legacy",
    },
  },
}
```

该 slot 在运行时是排他的——对于给定的一次运行或压缩操作，
只会解析一个已注册的上下文引擎。其他已启用的
`kind: "context-engine"` 插件仍然可以加载并运行其注册
代码；`plugins.slots.contextEngine` 只决定当 OpenClaw 需要上下文引擎时，
最终会解析哪个已注册的引擎 id。

## 与压缩和记忆的关系

- **压缩** 是上下文引擎的职责之一。旧版引擎
  委托给 OpenClaw 的内置总结机制。插件引擎则可以实现
  任意压缩策略（DAG 摘要、向量检索等）。
- **记忆插件**（`plugins.slots.memory`）与上下文引擎是分开的。
  记忆插件负责搜索/检索；上下文引擎控制
  模型最终会看到什么。它们可以协同工作——某个上下文引擎可能会在组装期间
  使用记忆插件数据。想使用活动记忆
  提示路径的插件引擎，应优先使用 `openclaw/plugin-sdk/core` 中的
  `buildMemorySystemPromptAddition(...)`，它会把当前活动记忆提示段
  转换为一个可直接预置的 `systemPromptAddition`。如果某个引擎需要更底层的
  控制，也仍然可以通过
  `openclaw/plugin-sdk/memory-host-core` 中的
  `buildActiveMemoryPromptSection(...)`
  拉取原始行。
- **会话修剪**（在内存中裁剪旧工具结果）仍会运行，
  与当前激活的是哪个上下文引擎无关。

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续保留其当前历史。
  新引擎会接管后续运行。
- 引擎错误会被记录并显示在诊断中。如果某个插件引擎
  注册失败，或所选引擎 id 无法解析，OpenClaw
  不会自动回退；在你修复插件或
  将 `plugins.slots.contextEngine` 切回 `"legacy"` 之前，运行都会失败。
- 开发时，可使用 `openclaw plugins install -l ./my-engine` 来链接本地
  插件目录，而无需复制。

另请参见：[Compaction](/zh-CN/concepts/compaction)、[Context](/zh-CN/concepts/context)、
[Plugins](/zh-CN/tools/plugin)、[Plugin manifest](/zh-CN/plugins/manifest)。

## 相关内容

- [Context](/zh-CN/concepts/context) —— 如何为智能体轮次构建上下文
- [Plugin Architecture](/zh-CN/plugins/architecture) —— 注册上下文引擎插件
- [Compaction](/zh-CN/concepts/compaction) —— 总结长对话
