---
read_when:
    - 你正在将上下文引擎生命周期行为接入 Codex harness
    - 你需要让 lossless-claw 或其他上下文引擎插件能够与 codex/* 嵌入式 harness 会话一起工作
    - 你正在比较嵌入式 PI 和 Codex app-server 的上下文行为
summary: 使内置 Codex app-server harness 遵循 OpenClaw 上下文引擎插件的规范
title: Codex Harness Context Engine Port
x-i18n:
    generated_at: "2026-04-24T18:09:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## 状态

草案实现规范。

## 目标

让内置的 Codex app-server harness 遵循与嵌入式 PI 回合已经遵循的同一套 OpenClaw 上下文引擎生命周期契约。

当会话使用 `agents.defaults.embeddedHarness.runtime: "codex"` 或
`codex/*` 模型时，所选的上下文引擎插件（例如
`lossless-claw`）仍应尽可能在 Codex app-server 边界允许的范围内，控制上下文组装、回合后摄取、维护，以及 OpenClaw 级别的压缩策略。

## 非目标

- 不重新实现 Codex app-server 内部机制。
- 不让 Codex 原生线程压缩产出 lossless-claw 摘要。
- 不要求非 Codex 模型使用 Codex harness。
- 不更改 ACP/acpx 会话行为。本规范仅适用于
  非 ACP 的嵌入式智能体 harness 路径。
- 不让第三方插件注册 Codex app-server 扩展工厂；
  现有的内置插件信任边界保持不变。

## 当前架构

嵌入式运行循环在选择具体底层 harness 之前，会为每次运行解析一次已配置的上下文引擎：

- `src/agents/pi-embedded-runner/run.ts`
  - 初始化上下文引擎插件
  - 调用 `resolveContextEngine(params.config)`
  - 将 `contextEngine` 和 `contextTokenBudget` 传入
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` 会委托给所选的智能体 harness：

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harness 由内置 Codex 插件注册：

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness 实现接收与 PI 支持的尝试相同的 `EmbeddedRunAttemptParams`：

- `extensions/codex/src/app-server/run-attempt.ts`

这意味着所需的钩子点位于 OpenClaw 可控代码中。外部
边界是 Codex app-server 协议本身：OpenClaw 可以控制它发送到
`thread/start`、`thread/resume` 和 `turn/start` 的内容，并且可以观察
通知，但无法更改 Codex 的内部线程存储或原生压缩器。

## 当前缺口

嵌入式 PI 尝试会直接调用上下文引擎生命周期：

- 在尝试前执行 bootstrap / maintenance
- 在模型调用前执行 assemble
- 在尝试后执行 `afterTurn` 或 `ingest`
- 在成功回合后执行 maintenance
- 为拥有压缩职责的引擎执行上下文引擎压缩

相关 PI 代码：

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server 尝试当前会运行通用智能体 harness 钩子并镜像
转录内容，但不会调用 `params.contextEngine.bootstrap`、
`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、
`params.contextEngine.ingestBatch`、`params.contextEngine.ingest` 或
`params.contextEngine.maintain`。

相关 Codex 代码：

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 期望行为

对于 Codex harness 回合，OpenClaw 应保留以下生命周期：

1. 读取镜像的 OpenClaw 会话转录。
2. 当存在先前会话文件时，对活动上下文引擎执行 bootstrap。
3. 在可用时运行 bootstrap maintenance。
4. 使用活动上下文引擎组装上下文。
5. 将组装后的上下文转换为与 Codex 兼容的输入。
6. 启动或恢复 Codex 线程，并将任何
   上下文引擎 `systemPromptAddition` 包含在 developer instructions 中。
7. 使用组装后的面向用户提示词启动 Codex 回合。
8. 将 Codex 结果镜像回 OpenClaw 转录。
9. 如果实现了 `afterTurn` 则调用它，否则使用
   镜像的转录快照调用 `ingestBatch`/`ingest`。
10. 在成功且未中止的回合后运行回合 maintenance。
11. 保留 Codex 原生压缩信号和 OpenClaw 压缩钩子。

## 设计约束

### Codex app-server 仍然是原生线程状态的权威来源

Codex 拥有其原生线程及任何内部扩展历史。OpenClaw 不应
尝试通过受支持协议调用以外的方式修改 app-server 的内部历史。

OpenClaw 的转录镜像仍然是 OpenClaw 功能的来源：

- 聊天历史
- 搜索
- `/new` 和 `/reset` 记账
- 未来的模型或 harness 切换
- 上下文引擎插件状态

### 上下文引擎组装必须投影到 Codex 输入中

上下文引擎接口返回的是 OpenClaw `AgentMessage[]`，而不是 Codex
线程补丁。Codex app-server 的 `turn/start` 接受当前用户输入，而
`thread/start` 和 `thread/resume` 接受 developer instructions。

因此，实现需要一个投影层。安全的第一版
应避免假装它可以替换 Codex 内部历史。它应将组装好的上下文作为围绕
当前回合的确定性提示词 / developer-instruction 材料注入。

### Prompt-cache 稳定性很重要

对于 lossless-claw 这样的引擎，组装后的上下文对于未变化的输入应保持确定性。不要向生成的上下文文本中加入时间戳、随机 id 或非确定性排序。

### PI 回退语义不变

Harness 选择保持现状：

- `runtime: "pi"` 强制使用 PI
- `runtime: "codex"` 选择已注册的 Codex harness
- `runtime: "auto"` 让插件 harness 声明支持的 provider
- `fallback: "none"` 在没有插件 harness 匹配时禁用 PI 回退

这项工作更改的是 Codex harness 被选中之后发生的事情。

## 实现计划

### 1. 导出或迁移可复用的上下文引擎尝试辅助函数

当前，可复用的生命周期辅助函数位于 PI runner 下：

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

通过从旧文件重新导出，或在同一个 PR 中更新 PI
调用点，以保持 PI 导入仍可工作。

中立的辅助函数命名不应提及 PI。

建议名称：

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. 添加一个 Codex 上下文投影辅助函数

添加一个新模块：

- `extensions/codex/src/app-server/context-engine-projection.ts`

职责：

- 接收已组装的 `AgentMessage[]`、原始镜像历史和当前
  提示词。
- 判断哪些上下文应放入 developer instructions，哪些应放入当前用户
  输入。
- 保留当前用户提示词作为最终可执行请求。
- 以稳定、显式的格式渲染先前消息。
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

推荐的第一版投影：

- 将 `systemPromptAddition` 放入 developer instructions。
- 将组装后的转录上下文放在 `promptText` 中当前提示词之前。
- 清晰标记它是 OpenClaw 组装的上下文。
- 保持当前提示词位于最后。
- 如果当前用户提示词已经出现在尾部，则排除重复项。

示例提示词形状：

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

这不如原生 Codex 历史修补优雅，但它可以在 OpenClaw 内部实现，并保留上下文引擎语义。

未来改进：如果 Codex app-server 暴露了用于替换或
补充线程历史的协议，则将此投影层切换为使用该 API。

### 3. 在 Codex 线程启动前接入 bootstrap

在 `extensions/codex/src/app-server/run-attempt.ts` 中：

- 按当前方式读取镜像会话历史。
- 判断本次运行前会话文件是否已存在。优先使用一个
  在镜像写入之前检查 `fs.stat(params.sessionFile)` 的辅助函数。
- 打开一个 `SessionManager`，或者如果辅助函数
  需要它，则使用一个窄化的会话管理器适配器。
- 当 `params.contextEngine` 存在时，调用中立的 bootstrap 辅助函数。

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

使用与 Codex 工具桥接和转录镜像相同的 `sessionKey` 约定。当前 Codex 会根据 `params.sessionKey` 或
`params.sessionId` 计算 `sandboxSessionKey`；除非有理由保留原始 `params.sessionKey`，否则应一致使用它。

### 4. 在 `thread/start` / `thread/resume` 和 `turn/start` 之前接入 assemble

在 `runCodexAppServerAttempt` 中：

1. 先构建动态工具，以便上下文引擎能看到实际可用的
   工具名称。
2. 读取镜像会话历史。
3. 当 `params.contextEngine` 存在时运行上下文引擎 `assemble(...)`。
4. 将组装结果投影为：
   - developer instruction addition
   - 用于 `turn/start` 的提示词文本

现有的钩子调用：

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

应变为具备上下文感知能力：

1. 使用 `buildDeveloperInstructions(params)` 计算基础 developer instructions
2. 应用上下文引擎组装 / 投影
3. 使用投影后的提示词 / developer instructions 运行 `before_prompt_build`

这种顺序可让通用提示词钩子看到 Codex 将实际接收的同一提示词。如果
需要严格的 PI 对齐，则应在钩子组合之前运行上下文引擎组装，
因为 PI 会在其提示词流水线之后，将上下文引擎 `systemPromptAddition` 应用到最终系统提示词中。重要的不变量是：上下文
引擎和钩子都获得一个确定且有文档说明的顺序。

第一版实现的推荐顺序：

1. `buildDeveloperInstructions(params)`
2. 上下文引擎 `assemble()`
3. 将 `systemPromptAddition` 追加 / 前置到 developer instructions
4. 将组装后的消息投影到提示词文本中
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 将最终 developer instructions 传入 `startOrResumeThread(...)`
7. 将最终提示词文本传入 `buildTurnStartParams(...)`

该规范应通过测试编码，以防未来更改不小心重排顺序。

### 5. 保持 prompt-cache 格式稳定

投影辅助函数必须对相同输入产出字节级稳定的输出：

- 稳定的消息顺序
- 稳定的角色标签
- 无生成的时间戳
- 无对象键顺序泄漏
- 无随机分隔符
- 无每次运行 id

使用固定分隔符和显式分节。

### 6. 在转录镜像之后接入回合后流程

Codex 的 `CodexAppServerEventProjector` 会为当前回合构建一个本地 `messagesSnapshot`。
`mirrorTranscriptBestEffort(...)` 会将该快照写入 OpenClaw 转录镜像。

无论镜像成功还是失败，在此之后都应使用最佳可用的消息快照调用上下文引擎终结器：

- 优先使用写入后的完整镜像会话上下文，因为 `afterTurn`
  期望的是会话快照，而不只是当前回合。
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

如果镜像失败，仍然要使用回退快照调用 `afterTurn`，但要记录
上下文引擎正在使用回退回合数据进行摄取。

### 7. 规范化 usage 和 prompt-cache 运行时上下文

Codex 结果在可用时会包含来自 app-server token 通知的规范化 usage。
将该 usage 传入上下文引擎运行时上下文。

如果 Codex app-server 将来暴露 cache read/write 详情，则将其映射到
`ContextEnginePromptCacheInfo`。在此之前，应省略 `promptCache`，而不是虚构零值。

### 8. 压缩策略

存在两套压缩系统：

1. OpenClaw 上下文引擎 `compact()`
2. Codex app-server 原生 `thread/compact/start`

不要静默地将它们混为一谈。

#### `/compact` 和显式 OpenClaw 压缩

当所选上下文引擎满足 `info.ownsCompaction === true` 时，显式
OpenClaw 压缩应优先使用上下文引擎的 `compact()` 结果来处理 OpenClaw 转录镜像和插件状态。

当所选 Codex harness 具有原生线程绑定时，我们还可以额外请求
Codex 原生压缩，以保持 app-server 线程健康，但这必须在 details 中作为一个独立的后端动作报告。

建议行为：

- 如果 `contextEngine.info.ownsCompaction === true`：
  - 先调用上下文引擎 `compact()`
  - 然后在存在线程绑定时尽最大努力调用 Codex 原生压缩
  - 返回上下文引擎结果作为主结果
  - 在 `details.codexNativeCompaction` 中包含 Codex 原生压缩状态
- 如果活动上下文引擎不拥有压缩职责：
  - 保留当前 Codex 原生压缩行为

这很可能需要更改 `extensions/codex/src/app-server/compact.ts`，或从通用压缩路径对其进行包装，具体取决于
`maybeCompactAgentHarnessSession(...)` 的调用位置。

#### 回合内 Codex 原生 `contextCompaction` 事件

Codex 可能会在回合期间发出 `contextCompaction` item 事件。保留当前
`event-projector.ts` 中 before/after 压缩钩子的发出逻辑，但不要将其视为一次已完成的上下文引擎压缩。

对于拥有压缩职责的引擎，当 Codex 仍然执行原生压缩时，发出一个显式诊断：

- 流 / 事件名称：现有的 `compaction` 流可以接受
- details：`{ backend: "codex-app-server", ownsCompaction: true }`

这样可以让这一区分具有可审计性。

### 9. 会话重置和绑定行为

现有的 Codex harness `reset(...)` 会从
OpenClaw 会话文件中清除 Codex app-server 绑定。保留这一行为。

同时还要确保上下文引擎状态清理继续通过现有的
OpenClaw 会话生命周期路径进行。不要添加 Codex 特定的清理逻辑，除非当前所有 harness 的上下文引擎生命周期都遗漏了 reset/delete 事件。

### 10. 错误处理

遵循 PI 语义：

- bootstrap 失败时发出警告并继续
- assemble 失败时发出警告，并回退到未组装的流水线消息 / 提示词
- afterTurn/ingest 失败时发出警告，并将回合后终结标记为不成功
- maintenance 仅在成功、未中止、未 yield 的回合后运行
- 压缩错误不应作为新的提示词进行重试

Codex 特定补充：

- 如果上下文投影失败，发出警告并回退到原始提示词。
- 如果转录镜像失败，仍然尝试使用回退消息执行上下文引擎终结。
- 如果在上下文引擎压缩成功之后，Codex 原生压缩失败，
  则当上下文引擎是主路径时，不应让整个 OpenClaw 压缩失败。

## 测试计划

### 单元测试

在 `extensions/codex/src/app-server` 下添加测试：

1. `run-attempt.context-engine.test.ts`
   - 当会话文件存在时，Codex 会调用 `bootstrap`。
   - Codex 会使用镜像消息、token budget、工具名称、
     citations 模式、model id 和 prompt 调用 `assemble`。
   - `systemPromptAddition` 会包含在 developer instructions 中。
   - 组装后的消息会在当前请求之前投影到提示词中。
   - Codex 会在转录镜像后调用 `afterTurn`。
   - 没有 `afterTurn` 时，Codex 会调用 `ingestBatch` 或逐消息 `ingest`。
   - 回合 maintenance 会在成功回合后运行。
   - 当提示词错误、中止或 yield 中止时，不会运行回合 maintenance。

2. `context-engine-projection.test.ts`
   - 对相同输入输出稳定
   - 当组装历史已包含当前提示词时，不重复当前提示词
   - 处理空历史
   - 保留角色顺序
   - 仅在 developer instructions 中包含 system prompt addition

3. `compact.context-engine.test.ts`
   - 拥有压缩职责的上下文引擎主结果优先生效
   - 当也尝试了 Codex 原生压缩时，details 中会出现其状态
   - Codex 原生失败不会导致拥有压缩职责的上下文引擎压缩失败
   - 不拥有压缩职责的上下文引擎会保留当前原生压缩行为

### 需要更新的现有测试

- `extensions/codex/src/app-server/run-attempt.test.ts`，如果存在；否则更新
  最接近的 Codex app-server 运行测试。
- `extensions/codex/src/app-server/event-projector.test.ts`，仅当压缩
  事件 details 发生变化时。
- `src/agents/harness/selection.test.ts` 应无需更改，除非配置
  行为发生变化；它应保持稳定。
- PI 上下文引擎测试应继续保持不变并通过。

### 集成 / 实时测试

添加或扩展实时 Codex harness 冒烟测试：

- 将 `plugins.slots.contextEngine` 配置为测试引擎
- 将 `agents.defaults.model` 配置为 `codex/*` 模型
- 配置 `agents.defaults.embeddedHarness.runtime = "codex"`
- 断言测试引擎观察到了：
  - bootstrap
  - assemble
  - afterTurn 或 ingest
  - maintenance

避免在 OpenClaw 核心测试中要求使用 lossless-claw。请使用仓库内一个小型的 fake
上下文引擎插件。

## 可观测性

在 Codex 上下文引擎生命周期调用周围添加调试日志：

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` 并附带原因
- `codex native compaction completed alongside context-engine compaction`

避免记录完整提示词或转录内容。

在合适时添加结构化字段：

- `sessionId`
- `sessionKey` 根据现有日志实践进行脱敏或省略
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 迁移 / 兼容性

这应当向后兼容：

- 如果未配置上下文引擎，则旧版上下文引擎行为应与当前 Codex harness 行为等价。
- 如果上下文引擎 `assemble` 失败，Codex 应继续使用原始
  提示词路径。
- 现有 Codex 线程绑定应继续有效。
- 动态工具指纹不应包含上下文引擎输出；否则
  每次上下文变化都可能强制创建一个新 Codex 线程。只有工具目录
  应影响动态工具指纹。

## 未决问题

1. 组装后的上下文应全部注入到用户提示词中、全部
   注入到 developer instructions 中，还是拆分处理？

   建议：拆分。将 `systemPromptAddition` 放入 developer instructions；
   将组装后的转录上下文放入用户提示词包装中。这最符合
   当前 Codex 协议，同时不会修改原生线程历史。

2. 当上下文引擎拥有
   压缩职责时，是否应禁用 Codex 原生压缩？

   建议：不，至少初期不这样做。Codex 原生压缩可能仍然
   是维持 app-server 线程存活所必需的。但它必须被报告为
   Codex 原生压缩，而不是上下文引擎压缩。

3. `before_prompt_build` 应在上下文引擎组装之前还是之后运行？

   建议：对于 Codex，在上下文引擎投影之后运行，这样通用 harness
   钩子就能看到 Codex 将实际接收的提示词 / developer instructions。如果为了与 PI
   保持一致需要相反顺序，请在测试中编码选定顺序，并在
   此处记录。

4. Codex app-server 是否可以接受未来的结构化上下文 / 历史覆盖？

   未知。如果可以，则用该协议替换文本投影层，并保持生命周期调用不变。

## 验收标准

- 一个 `codex/*` 嵌入式 harness 回合会调用所选上下文引擎的
  assemble 生命周期。
- 上下文引擎 `systemPromptAddition` 会影响 Codex developer instructions。
- 组装后的上下文会以确定性方式影响 Codex 回合输入。
- 成功的 Codex 回合会调用 `afterTurn` 或 ingest 回退路径。
- 成功的 Codex 回合会运行上下文引擎回合 maintenance。
- 失败 / 中止 / yield 中止的回合不会运行回合 maintenance。
- 由上下文引擎拥有的压缩对于 OpenClaw / 插件状态仍然是主路径。
- Codex 原生压缩仍然可以作为原生 Codex 行为被审计。
- 现有 PI 上下文引擎行为保持不变。
- 当未选择非旧版上下文引擎
  或当组装失败时，现有 Codex harness 行为保持不变。
