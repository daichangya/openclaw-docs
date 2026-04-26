---
read_when:
    - 你想了解 OpenClaw 如何组装模型上下文
    - 你正在旧版引擎与插件引擎之间切换
    - 你正在构建一个上下文引擎插件
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文组装、压缩与子智能体生命周期
title: 上下文引擎
x-i18n:
    generated_at: "2026-04-26T09:42:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

**上下文引擎** 控制 OpenClaw 如何为每次运行构建模型上下文：包含哪些消息、如何总结较早的历史记录，以及如何跨子智能体边界管理上下文。

OpenClaw 内置了 `legacy` 引擎，并默认使用它——大多数用户永远不需要更改。只有当你希望获得不同的组装、压缩或跨会话回忆行为时，才需要安装并选择插件引擎。

## 快速开始

<Steps>
  <Step title="检查当前激活的是哪个引擎">
    ```bash
    openclaw doctor
    # 或直接查看配置：
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="安装一个插件引擎">
    上下文引擎插件的安装方式与其他 OpenClaw 插件相同。

    <Tabs>
      <Tab title="从 npm 安装">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="从本地路径安装">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="启用并选择该引擎">
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
            // 插件特定配置写在这里（参见插件文档）
          },
        },
      },
    }
    ```

    安装并配置后，重启 Gateway 网关。

  </Step>
  <Step title="切回 legacy（可选）">
    将 `contextEngine` 设为 `"legacy"`（或直接删除该键——默认值就是 `"legacy"`）。
  </Step>
</Steps>

## 工作原理

每当 OpenClaw 运行一次模型提示时，上下文引擎都会参与四个生命周期节点：

<AccordionGroup>
  <Accordion title="1. 接收">
    当一条新消息被添加到会话时调用。引擎可以将该消息存储或索引到它自己的数据存储中。
  </Accordion>
  <Accordion title="2. 组装">
    在每次模型运行前调用。引擎返回一组按顺序排列、适合当前 token 预算的消息（以及可选的 `systemPromptAddition`）。
  </Accordion>
  <Accordion title="3. 压缩">
    当上下文窗口已满，或用户运行 `/compact` 时调用。引擎会总结较早的历史记录以释放空间。
  </Accordion>
  <Accordion title="4. 轮次结束后">
    在一次运行完成后调用。引擎可以持久化状态、触发后台压缩，或更新索引。
  </Accordion>
</AccordionGroup>

对于内置的非 ACP Codex harness，OpenClaw 通过将组装后的上下文投射到 Codex 开发者指令和当前轮次提示中，应用相同的生命周期。Codex 仍然管理其原生线程历史和原生压缩器。

### 子智能体生命周期（可选）

OpenClaw 会调用两个可选的子智能体生命周期钩子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。该钩子会接收父/子会话键、`contextMode`（`isolated` 或 `fork`）、可用的 transcript id/文件，以及可选的 TTL。如果它返回一个回滚句柄，那么当准备成功后生成失败时，OpenClaw 会调用它。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  当子智能体会话完成或被清理时执行清理。
</ParamField>

### 系统提示附加内容

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw 会将其前置到本次运行的系统提示中。这使引擎能够注入动态回忆指导、检索指令或上下文感知提示，而无需依赖静态工作区文件。

## legacy 引擎

内置的 `legacy` 引擎保留了 OpenClaw 的原始行为：

- **接收**：无操作（会话管理器直接处理消息持久化）。
- **组装**：直通（运行时中现有的 sanitize → validate → limit 流水线负责处理上下文组装）。
- **压缩**：委托给内置的总结式压缩，它会创建一份较早消息的单一摘要，并保持近期消息不变。
- **轮次结束后**：无操作。

legacy 引擎不会注册工具，也不会提供 `systemPromptAddition`。

当未设置 `plugins.slots.contextEngine`（或将其设为 `"legacy"`）时，会自动使用该引擎。

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
      // 返回适合预算的消息
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

| 成员               | 类型   | 用途 |
| ------------------ | ------ | ---- |
| `info`             | 属性   | 引擎 id、名称、版本，以及它是否拥有压缩控制权 |
| `ingest(params)`   | 方法   | 存储单条消息 |
| `assemble(params)` | 方法   | 为一次模型运行构建上下文（返回 `AssembleResult`） |
| `compact(params)`  | 方法   | 总结/缩减上下文 |

`assemble` 返回一个 `AssembleResult`，其中包含：

<ParamField path="messages" type="Message[]" required>
  发送给模型的有序消息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎对组装后上下文总 token 数的估计。OpenClaw 用它来决定压缩阈值并进行诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系统提示中。
</ParamField>

可选成员：

| 成员                           | 类型   | 用途 |
| ------------------------------ | ------ | ---- |
| `bootstrap(params)`            | 方法   | 为一个会话初始化引擎状态。在引擎第一次看到某个会话时调用一次（例如导入历史记录）。 |
| `ingestBatch(params)`          | 方法   | 批量接收一个已完成轮次。一次运行完成后调用，并一次性提供该轮次的所有消息。 |
| `afterTurn(params)`            | 方法   | 运行后的生命周期工作（持久化状态、触发后台压缩）。 |
| `prepareSubagentSpawn(params)` | 方法   | 在子会话开始前为其设置共享状态。 |
| `onSubagentEnded(params)`      | 方法   | 在子智能体结束后进行清理。 |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 网关关闭或插件重载期间调用——不是按会话调用。 |

### ownsCompaction

`ownsCompaction` 控制 Pi 内置的尝试内自动压缩是否在该次运行中保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    该引擎拥有压缩行为控制权。OpenClaw 会在该次运行中禁用 Pi 内置的自动压缩，而引擎的 `compact()` 实现则负责处理 `/compact`、溢出恢复压缩，以及它希望在 `afterTurn()` 中执行的任何主动压缩。OpenClaw 仍可能运行提示前溢出保护；当它预测完整 transcript 会溢出时，恢复路径会在提交另一个提示之前调用当前激活引擎的 `compact()`。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Pi 内置的自动压缩在提示执行期间仍可能运行，但对于 `/compact` 和溢出恢复，仍会调用当前激活引擎的 `compact()` 方法。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **并不**意味着 OpenClaw 会自动回退到 legacy 引擎的压缩路径。
</Warning>

这意味着有两种有效的插件模式：

<Tabs>
  <Tab title="拥有模式">
    实现你自己的压缩算法，并设置 `ownsCompaction: true`。
  </Tab>
  <Tab title="委托模式">
    设置 `ownsCompaction: false`，并让 `compact()` 调用 `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 的内置压缩行为。
  </Tab>
</Tabs>

对于一个激活的非拥有型引擎来说，无操作的 `compact()` 并不安全，因为它会禁用该引擎槽位的常规 `/compact` 和溢出恢复压缩路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // 选择当前激活的上下文引擎。默认值："legacy"。
      // 设为某个插件 id 以使用插件引擎。
      contextEngine: "legacy",
    },
  },
}
```

<Note>
该槽位在运行时是排他的——对于给定的一次运行或压缩操作，只会解析一个已注册的上下文引擎。其他已启用的 `kind: "context-engine"` 插件仍然可以加载并运行它们的注册代码；`plugins.slots.contextEngine` 只决定当 OpenClaw 需要上下文引擎时，它会解析哪个已注册的引擎 id。
</Note>

<Note>
**插件卸载：** 当你卸载当前被选为 `plugins.slots.contextEngine` 的插件时，OpenClaw 会将该槽位重置回默认值（`legacy`）。相同的重置行为也适用于 `plugins.slots.memory`。无需手动编辑配置。
</Note>

## 与压缩和 memory 的关系

<AccordionGroup>
  <Accordion title="压缩">
    压缩是上下文引擎的职责之一。legacy 引擎将其委托给 OpenClaw 的内置总结功能。插件引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="Memory 插件">
    Memory 插件（`plugins.slots.memory`）与上下文引擎是分开的。Memory 插件提供搜索/检索；上下文引擎控制模型能看到什么。两者可以协同工作——上下文引擎可能会在组装期间使用 Memory 插件的数据。希望使用当前激活 memory 提示路径的插件引擎，应优先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它会将当前激活的 memory 提示片段转换为可直接前置的 `systemPromptAddition`。如果引擎需要更底层的控制，它仍然可以通过 `openclaw/plugin-sdk/memory-host-core` 中的 `buildActiveMemoryPromptSection(...)` 拉取原始行。
  </Accordion>
  <Accordion title="会话裁剪">
    无论当前激活的是哪个上下文引擎，内存中的旧工具结果裁剪仍会继续运行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证你的引擎是否正确加载。
- 如果切换引擎，现有会话会继续沿用它们当前的历史记录。新引擎会接管后续运行。
- 引擎错误会被记录并显示在诊断信息中。如果插件引擎注册失败，或无法解析所选的引擎 id，OpenClaw 不会自动回退；运行会失败，直到你修复插件或将 `plugins.slots.contextEngine` 切回 `"legacy"`。
- 在开发过程中，使用 `openclaw plugins install -l ./my-engine` 可以链接本地插件目录，而无需复制。

## 相关内容

- [压缩](/zh-CN/concepts/compaction) — 总结长对话
- [上下文](/zh-CN/concepts/context) — 智能体轮次的上下文是如何构建的
- [插件架构](/zh-CN/plugins/architecture) — 注册上下文引擎插件
- [插件清单](/zh-CN/plugins/manifest) — 插件清单字段
- [插件](/zh-CN/tools/plugin) — 插件概览
