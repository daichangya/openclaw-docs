---
read_when:
    - 你正在将 context-engine 生命周期行为接入 Codex harness
    - 你需要让 lossless-claw 或其他 context-engine 插件能够与 `codex/*` 内嵌 harness 会话一起工作
    - 你正在比较嵌入式 PI 与 Codex app-server 的上下文行为
summary: 使内置的 Codex app-server harness 支持 OpenClaw context-engine 插件的规范
title: Codex Harness Context Engine Port
x-i18n:
    generated_at: "2026-04-24T04:20:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Codex Harness Context Engine Port

## 状态

实施规范草案。

## 目标

让内置的 Codex app-server harness 遵循与嵌入式 PI 轮次当前已遵循的相同 OpenClaw context-engine 生命周期契约。

使用 `agents.defaults.embeddedHarness.runtime: "codex"` 或 `codex/*` 模型的会话，仍应允许所选的 context-engine 插件（例如 `lossless-claw`）在 Codex app-server 边界允许的范围内，控制上下文组装、轮次后摄取、维护以及 OpenClaw 级别的压缩策略。

## 非目标

- 不要重新实现 Codex app-server 内部机制。
- 不要让 Codex 原生线程压缩生成 `lossless-claw` 摘要。
- 不要要求非 Codex 模型使用 Codex harness。
- 不要更改 ACP/acpx 会话行为。此规范仅适用于非 ACP 的嵌入式智能体 harness 路径。
- 不要让第三方插件注册 Codex app-server 扩展工厂；现有的内置插件信任边界保持不变。

## 当前架构

嵌入式运行循环在选择具体的底层 harness 之前，每次运行都会解析一次已配置的 context engine：

- `src/agents/pi-embedded-runner/run.ts`
  - 初始化 context-engine 插件
  - 调用 `resolveContextEngine(params.config)`
  - 将 `contextEngine` 和 `contextTokenBudget` 传入 `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` 会委托给所选的智能体 harness：

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harness 由内置的 Codex 插件注册：

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness 实现接收与 PI 支持的 attempt 相同的 `EmbeddedRunAttemptParams`：

- `extensions/codex/src/app-server/run-attempt.ts`

这意味着所需的 hook 点位于 OpenClaw 可控的代码中。外部边界是 Codex app-server 协议本身：OpenClaw 可以控制发送到 `thread/start`、`thread/resume` 和 `turn/start` 的内容，也可以观察通知，但无法更改 Codex 的内部线程存储或原生压缩器。

## 当前缺口

嵌入式 PI attempt 会直接调用 context-engine 生命周期：

- 在 attempt 之前执行 bootstrap/maintenance
- 在模型调用之前执行 assemble
- 在 attempt 之后执行 afterTurn 或 ingest
- 在成功轮次后执行 maintenance
- 对于拥有压缩能力的引擎，执行 context-engine compaction

相关 PI 代码：

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server attempt 目前会运行通用的智能体 harness hook 并镜像转录记录，但不会调用 `params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest` 或 `params.contextEngine.maintain`。

相关 Codex 代码：

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 期望行为

对于 Codex harness 轮次，OpenClaw 应保留以下生命周期：

1. 读取镜像后的 OpenClaw 会话转录记录。
2. 当存在先前的会话文件时，对活动的 context engine 执行 bootstrap。
3. 在可用时运行 bootstrap maintenance。
4. 使用活动的 context engine 组装上下文。
5. 将组装后的上下文转换为与 Codex 兼容的输入。
6. 使用包含任意 context-engine `systemPromptAddition` 的开发者指令启动或恢复 Codex 线程。
7. 使用组装后的面向用户提示启动 Codex 轮次。
8. 将 Codex 结果镜像回 OpenClaw 转录记录。
9. 如果已实现，则调用 `afterTurn`；否则使用镜像后的转录记录快照调用 `ingestBatch`/`ingest`。
10. 在成功且未中止的轮次后运行轮次 maintenance。
11. 保留 Codex 原生压缩信号和 OpenClaw 压缩 hook。

## 设计约束

### Codex app-server 仍然是原生线程状态的规范来源

Codex 拥有其原生线程以及任何内部扩展历史。OpenClaw 不应尝试修改 app-server 的内部历史，除非通过受支持的协议调用。

OpenClaw 的转录镜像仍然是 OpenClaw 功能的来源：

- 聊天历史
- 搜索
- `/new` 和 `/reset` 记账
- 未来的模型或 harness 切换
- context-engine 插件状态

### Context engine 组装必须投影为 Codex 输入

context-engine 接口返回的是 OpenClaw `AgentMessage[]`，而不是 Codex 线程补丁。Codex app-server 的 `turn/start` 接受当前用户输入，而 `thread/start` 和 `thread/resume` 接受开发者指令。

因此，实现需要一个投影层。安全的第一个版本应避免假装它可以替换 Codex 内部历史。它应在当前轮次周围，将组装后的上下文注入为确定性的提示/开发者指令材料。

### Prompt-cache 稳定性很重要

对于像 lossless-claw 这样的引擎，在输入未变化时，组装后的上下文应保持确定性。不要向生成的上下文文本中添加时间戳、随机 id 或非确定性排序。

### PI 回退语义不变

harness 选择逻辑保持不变：

- `runtime: "pi"` 强制使用 PI
- `runtime: "codex"` 选择已注册的 Codex harness
- `runtime: "auto"` 允许插件 harness 声明其支持的提供商
- `fallback: "none"` 在没有匹配的插件 harness 时禁用 PI 回退

这项工作改变的是选中 Codex harness 之后发生的行为。

## 实施计划

### 1. 导出或迁移可复用的 context-engine attempt helper

目前，可复用的生命周期 helper 位于 PI runner 下：

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

如果可以避免，Codex 不应从一个名称暗示 PI 的实现路径导入。

创建一个与 harness 无关的模块，例如：

- `src/agents/harness/context-engine-lifecycle.ts`

迁移或重新导出：

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- 一个围绕 `runContextEngineMaintenance` 的小型包装器

通过从旧文件重新导出，或在同一个 PR 中更新 PI 调用点，保持 PI 导入继续正常工作。

中性的 helper 名称不应提及 PI。

建议命名：

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. 添加一个 Codex 上下文投影 helper

添加一个新模块：

- `extensions/codex/src/app-server/context-engine-projection.ts`

职责：

- 接收组装后的 `AgentMessage[]`、原始镜像历史和当前提示。
- 确定哪些上下文应放入开发者指令，哪些应放入当前用户输入。
- 保留当前用户提示作为最终的可执行请求。
- 以稳定、明确的格式渲染先前消息。
- 避免易变元数据。

建议 API：

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

建议的第一版投影：

- 将 `systemPromptAddition` 放入开发者指令。
- 将组装后的转录上下文放在 `promptText` 中当前提示之前。
- 明确标注这是 OpenClaw 为本轮组装的上下文。
- 保持当前提示位于最后。
- 如果当前用户提示已出现在尾部，则排除重复的当前用户提示。

示例提示结构：

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

这不如原生的 Codex 历史修补优雅，但它可以在 OpenClaw 内部实现，并保留 context-engine 语义。

未来改进：如果 Codex app-server 暴露了用于替换或补充线程历史的协议，则将此投影层切换为使用该 API。

### 3. 在 Codex 线程启动之前接入 bootstrap

在 `extensions/codex/src/app-server/run-attempt.ts` 中：

- 像现在一样读取镜像会话历史。
- 确定本次运行之前会话文件是否已存在。优先使用一个在镜像写入前检查 `fs.stat(params.sessionFile)` 的 helper。
- 打开一个 `SessionManager`，或者如果 helper 需要，使用一个窄接口的会话管理器适配器。
- 当 `params.contextEngine` 存在时，调用中性的 bootstrap helper。

伪流程：

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

使用与 Codex 工具桥接和转录镜像相同的 `sessionKey` 约定。当前 Codex 会根据 `params.sessionKey` 或 `params.sessionId` 计算 `sandboxSessionKey`；除非有理由保留原始 `params.sessionKey`，否则应一致使用该值。

### 4. 在 `thread/start` / `thread/resume` 和 `turn/start` 之前接入 assemble

在 `runCodexAppServerAttempt` 中：

1. 先构建动态工具，这样 context engine 才能看到实际可用的工具名称。
2. 读取镜像会话历史。
3. 当 `params.contextEngine` 存在时，运行 context-engine `assemble(...)`。
4. 将组装结果投影为：
   - 开发者指令追加内容
   - `turn/start` 的提示文本

现有的 hook 调用：

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

应改为具备上下文感知能力：

1. 使用 `buildDeveloperInstructions(params)` 计算基础开发者指令
2. 应用 context-engine 组装/投影
3. 运行 `before_prompt_build`，并传入投影后的提示/开发者指令

这个顺序让通用提示 hook 能看到 Codex 实际会收到的同一份提示。如果我们需要与 PI 严格一致，应在 hook 组合之前运行 context-engine 组装，因为 PI 会在其提示流水线之后，将 context-engine `systemPromptAddition` 应用到最终系统提示中。重要的不变量是：context engine 和 hook 都要得到一个确定且有文档说明的顺序。

第一版实现建议顺序：

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. 将 `systemPromptAddition` 追加/前置到开发者指令中
4. 将组装后的消息投影到提示文本中
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 将最终开发者指令传给 `startOrResumeThread(...)`
7. 将最终提示文本传给 `buildTurnStartParams(...)`

应将该规范编码进测试中，以避免未来的改动意外改变顺序。

### 5. 保持 prompt-cache 的稳定格式

投影 helper 必须对相同输入生成字节稳定的输出：

- 稳定的消息顺序
- 稳定的角色标签
- 不生成时间戳
- 不泄露对象键顺序
- 不使用随机分隔符
- 不使用每次运行都变化的 id

使用固定分隔符和明确的分段。

### 6. 在转录镜像之后接入轮次后处理

Codex 的 `CodexAppServerEventProjector` 会为当前轮次构建一个本地 `messagesSnapshot`。`mirrorTranscriptBestEffort(...)` 会将该快照写入 OpenClaw 转录镜像。

在镜像成功或失败之后，使用最佳可用的消息快照调用 context-engine finalizer：

- 优先使用写入后的完整镜像会话上下文，因为 `afterTurn` 期望的是会话快照，而不只是当前轮次。
- 如果无法重新打开会话文件，则回退到 `historyMessages + result.messagesSnapshot`。

伪流程：

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

如果镜像失败，仍然使用回退快照调用 `afterTurn`，但要记录 context engine 正在使用回退轮次数据进行摄取。

### 7. 规范化 usage 和 prompt-cache 运行时上下文

Codex 结果在可用时会包含来自 app-server token 通知的规范化 usage。将该 usage 传入 context-engine 运行时上下文。

如果 Codex app-server 未来暴露缓存读/写细节，将其映射到 `ContextEnginePromptCacheInfo`。在此之前，省略 `promptCache`，而不是虚构零值。

### 8. 压缩策略

存在两套压缩系统：

1. OpenClaw context-engine `compact()`
2. Codex app-server 原生 `thread/compact/start`

不要悄悄将它们混为一谈。

#### `/compact` 和显式 OpenClaw 压缩

当所选 context engine 具有 `info.ownsCompaction === true` 时，显式 OpenClaw 压缩应优先使用 context engine 的 `compact()` 结果，以更新 OpenClaw 转录镜像和插件状态。

当所选 Codex harness 具有原生线程绑定时，我们还可以额外请求 Codex 原生压缩，以保持 app-server 线程健康，但这必须在详情中作为单独的后端操作进行报告。

建议行为：

- 如果 `contextEngine.info.ownsCompaction === true`：
  - 先调用 context-engine `compact()`
  - 然后在存在线程绑定时尽力调用 Codex 原生压缩
  - 返回 context-engine 结果作为主结果
  - 在 `details.codexNativeCompaction` 中包含 Codex 原生压缩状态
- 如果活动的 context engine 不拥有压缩能力：
  - 保留当前 Codex 原生压缩行为

这可能需要修改 `extensions/codex/src/app-server/compact.ts`，或从通用压缩路径中对其进行包装，具体取决于 `maybeCompactAgentHarnessSession(...)` 的调用位置。

#### 轮次内 Codex 原生 `contextCompaction` 事件

Codex 可能在轮次中发出 `contextCompaction` item 事件。保留 `event-projector.ts` 中当前的压缩前/压缩后 hook 发射逻辑，但不要将其视为已完成的 context-engine 压缩。

对于拥有压缩能力的引擎，当 Codex 仍然执行原生压缩时，发出明确的诊断信息：

- stream/event 名称：现有的 `compaction` stream 可以接受
- details：`{ backend: "codex-app-server", ownsCompaction: true }`

这样可以让这一区分可审计。

### 9. 会话重置与绑定行为

现有的 Codex harness `reset(...)` 会从 OpenClaw 会话文件中清除 Codex app-server 绑定。保留该行为。

同时，确保 context-engine 状态清理继续通过现有 OpenClaw 会话生命周期路径进行。不要添加 Codex 专用清理，除非当前的 context-engine 生命周期对所有 harness 都遗漏了 reset/delete 事件。

### 10. 错误处理

遵循 PI 语义：

- bootstrap 失败时发出警告并继续
- assemble 失败时发出警告，并回退到未组装的流水线消息/提示
- afterTurn/ingest 失败时发出警告，并将轮次后 finalize 标记为不成功
- maintenance 仅在成功、未中止、非 yield 终止的轮次后运行
- 压缩错误不应作为新的提示重试

Codex 专属补充：

- 如果上下文投影失败，发出警告并回退到原始提示。
- 如果转录镜像失败，仍尝试使用回退消息执行 context-engine finalize。
- 如果在 context-engine 压缩成功后 Codex 原生压缩失败，当 context engine 是主路径时，不要让整个 OpenClaw 压缩失败。

## 测试计划

### 单元测试

在 `extensions/codex/src/app-server` 下添加测试：

1. `run-attempt.context-engine.test.ts`
   - 当会话文件存在时，Codex 调用 `bootstrap`。
   - Codex 使用镜像消息、token budget、工具名称、citations 模式、模型 id 和提示调用 `assemble`。
   - `systemPromptAddition` 会包含在开发者指令中。
   - 组装后的消息会在当前请求之前投影到提示中。
   - Codex 会在转录镜像之后调用 `afterTurn`。
   - 在没有 `afterTurn` 时，Codex 调用 `ingestBatch` 或按消息逐条调用 `ingest`。
   - 轮次 maintenance 会在成功轮次后运行。
   - 在提示错误、中止或 yield 中止时，不运行轮次 maintenance。

2. `context-engine-projection.test.ts`
   - 相同输入生成稳定输出
   - 当组装后的历史已包含当前提示时，不重复当前提示
   - 处理空历史
   - 保留角色顺序
   - 仅在开发者指令中包含 system prompt addition

3. `compact.context-engine.test.ts`
   - 拥有压缩能力的 context engine 主结果优先
   - 在同时尝试时，详情中会出现 Codex 原生压缩状态
   - Codex 原生压缩失败不会导致拥有压缩能力的 context-engine 压缩失败
   - 不拥有压缩能力的 context engine 保留当前原生压缩行为

### 需要更新的现有测试

- `extensions/codex/src/app-server/run-attempt.test.ts`，如果存在；否则更新最近的 Codex app-server 运行测试。
- `extensions/codex/src/app-server/event-projector.test.ts`，仅当压缩事件详情发生变化时更新。
- `src/agents/harness/selection.test.ts` 除非配置行为发生变化，否则不应需要修改；它应保持稳定。
- PI context-engine 测试应继续在不改动的情况下通过。

### 集成 / 实时测试

添加或扩展实时 Codex harness 冒烟测试：

- 配置 `plugins.slots.contextEngine` 为测试引擎
- 配置 `agents.defaults.model` 为 `codex/*` 模型
- 配置 `agents.defaults.embeddedHarness.runtime = "codex"`
- 断言测试引擎已观察到：
  - bootstrap
  - assemble
  - afterTurn 或 ingest
  - maintenance

避免在 OpenClaw 核心测试中要求依赖 lossless-claw。使用仓库内一个小型的 fake context engine 插件。

## 可观测性

围绕 Codex context-engine 生命周期调用添加调试日志：

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped`，并带上原因
- `codex native compaction completed alongside context-engine compaction`

避免记录完整提示或转录内容。

在有用时添加结构化字段：

- `sessionId`
- `sessionKey`，根据现有日志实践进行脱敏或省略
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 迁移 / 兼容性

这应当保持向后兼容：

- 如果未配置 context engine，旧版 context engine 行为应与当前 Codex harness 行为等价。
- 如果 context-engine `assemble` 失败，Codex 应继续使用原始提示路径。
- 现有 Codex 线程绑定应继续有效。
- 动态工具指纹不应包含 context-engine 输出；否则每次上下文变化都可能强制创建新的 Codex 线程。只有工具目录应影响动态工具指纹。

## 未决问题

1. 组装后的上下文应全部注入用户提示、全部注入开发者指令，还是拆分注入？

   建议：拆分。将 `systemPromptAddition` 放入开发者指令；将组装后的转录上下文放入用户提示包装中。这最符合当前 Codex 协议，同时不修改原生线程历史。

2. 当 context engine 拥有压缩能力时，是否应禁用 Codex 原生压缩？

   建议：不，至少初期不要。Codex 原生压缩可能仍然是保持 app-server 线程存活所必需的。但必须将其报告为 Codex 原生压缩，而不是 context-engine 压缩。

3. `before_prompt_build` 应在 context-engine assemble 之前还是之后运行？

   建议：对于 Codex，在 context-engine 投影之后运行，这样通用 harness hook 能看到 Codex 实际会收到的提示/开发者指令。如果与 PI 的一致性要求相反，应在测试中编码所选顺序，并在此处记录。

4. Codex app-server 是否可以接受未来的结构化上下文/历史覆盖？

   未知。如果可以，用该协议替换文本投影层，并保持生命周期调用不变。

## 验收标准

- 一个 `codex/*` 内嵌 harness 轮次会调用所选 context engine 的 assemble 生命周期。
- context-engine `systemPromptAddition` 会影响 Codex 开发者指令。
- 组装后的上下文会以确定性的方式影响 Codex 轮次输入。
- 成功的 Codex 轮次会调用 `afterTurn` 或 ingest 回退路径。
- 成功的 Codex 轮次会运行 context-engine 轮次 maintenance。
- 失败/中止/yield 中止的轮次不会运行轮次 maintenance。
- 由 context-engine 拥有的压缩仍然是 OpenClaw/插件状态的主路径。
- Codex 原生压缩仍然可作为原生 Codex 行为被审计。
- 现有 PI context-engine 行为保持不变。
- 当未选择非旧版 context engine，或当 assemble 失败时，现有 Codex harness 行为保持不变。
