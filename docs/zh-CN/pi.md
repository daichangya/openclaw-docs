---
read_when:
    - 理解 OpenClaw 中的 Pi SDK 集成设计
    - 修改 Pi 的智能体会话生命周期、工具机制或提供商接线
summary: OpenClaw 的内置 Pi 智能体集成架构与会话生命周期
title: Pi 集成架构
x-i18n:
    generated_at: "2026-04-23T20:54:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fad24557f3969b9faa33b9b13fa0e811dd257099ab8bdae02644a0395bcd68b
    source_path: pi.md
    workflow: 15
---

本文档描述了 OpenClaw 如何与 [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) 及其同级包（`pi-ai`、`pi-agent-core`、`pi-tui`）集成，以提供其 AI 智能体能力。

## 概述

OpenClaw 使用 pi SDK，将一个 AI 编码智能体嵌入其消息 Gateway 网关架构中。OpenClaw 不是将 pi 作为子进程启动，也不是使用 RPC 模式，而是直接导入并通过 `createAgentSession()` 实例化 pi 的 `AgentSession`。这种内置方式提供了：

- 对会话生命周期和事件处理的完整控制
- 自定义工具注入（消息、沙箱、渠道专用动作）
- 按渠道/上下文定制 system prompt
- 支持分支/压缩的会话持久化
- 带故障转移的多账户认证配置档案轮换
- 提供商无关的模型切换

## 包依赖

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| 包 | 用途 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai` | 核心 LLM 抽象：`Model`、`streamSimple`、消息类型、提供商 API |
| `pi-agent-core` | 智能体循环、工具执行、`AgentMessage` 类型 |
| `pi-coding-agent` | 高层 SDK：`createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、内置工具 |
| `pi-tui` | 终端 UI 组件（用于 OpenClaw 的本地 TUI 模式） |

## 文件结构

```
src/agents/
├── pi-embedded-runner.ts          # 从 pi-embedded-runner/ 重新导出
├── pi-embedded-runner/
│   ├── run.ts                     # 主入口：runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # 包含会话设置的单次尝试逻辑
│   │   ├── params.ts              # RunEmbeddedPiAgentParams 类型
│   │   ├── payloads.ts            # 从运行结果构建响应载荷
│   │   ├── images.ts              # 视觉模型图像注入
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort 错误检测
│   ├── cache-ttl.ts               # 用于上下文裁剪的缓存 TTL 跟踪
│   ├── compact.ts                 # 手动/自动压缩逻辑
│   ├── extensions.ts              # 为内置运行加载 pi 扩展
│   ├── extra-params.ts            # 提供商专用流参数
│   ├── google.ts                  # Google/Gemini 轮次顺序修复
│   ├── history.ts                 # 历史限制（私信 vs 群组）
│   ├── lanes.ts                   # 会话/全局命令 lanes
│   ├── logger.ts                  # 子系统日志记录器
│   ├── model.ts                   # 通过 ModelRegistry 解析模型
│   ├── runs.ts                    # 活动运行跟踪、中止、队列
│   ├── sandbox-info.ts            # 用于 system prompt 的沙箱信息
│   ├── session-manager-cache.ts   # SessionManager 实例缓存
│   ├── session-manager-init.ts    # 会话文件初始化
│   ├── system-prompt.ts           # System prompt 构建器
│   ├── tool-split.ts              # 将工具拆分为 builtIn 和 custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel 映射、错误描述
├── pi-embedded-subscribe.ts       # 会话事件订阅/分发
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # 事件处理器工厂
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # 流式块回复分块
├── pi-embedded-messaging.ts       # 消息工具 sent 跟踪
├── pi-embedded-helpers.ts         # 错误分类、轮次校验
├── pi-embedded-helpers/           # 辅助模块
├── pi-embedded-utils.ts           # 格式化工具
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # 工具的 AbortSignal 包装
├── pi-tools.policy.ts             # 工具 allowlist/denylist 策略
├── pi-tools.read.ts               # Read 工具定制
├── pi-tools.schema.ts             # 工具 schema 规范化
├── pi-tools.types.ts              # AnyAgentTool 类型别名
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition 适配器
├── pi-settings.ts                 # 设置覆盖
├── pi-hooks/                      # 自定义 pi hooks
│   ├── compaction-safeguard.ts    # safeguard 扩展
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # 缓存 TTL 上下文裁剪扩展
│   └── context-pruning/
├── model-auth.ts                  # 认证配置档案解析
├── auth-profiles.ts               # 配置档案存储、冷却、故障转移
├── model-selection.ts             # 默认模型解析
├── models-config.ts               # models.json 生成
├── model-catalog.ts               # 模型目录缓存
├── context-window-guard.ts        # 上下文窗口校验
├── failover-error.ts              # FailoverError 类
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # System prompt 参数解析
├── system-prompt-report.ts        # 调试报告生成
├── tool-summaries.ts              # 工具描述摘要
├── tool-policy.ts                 # 工具策略解析
├── transcript-policy.ts           # 转录校验策略
├── skills.ts                      # Skills 快照/提示词构建
├── skills/                        # Skills 子系统
├── sandbox.ts                     # 沙箱上下文解析
├── sandbox/                       # 沙箱子系统
├── channel-tools.ts               # 渠道专用工具注入
├── openclaw-tools.ts              # OpenClaw 专用工具
├── bash-tools.ts                  # exec/process 工具
├── apply-patch.ts                 # apply_patch 工具（OpenAI）
├── tools/                         # 各个独立工具实现
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

渠道专用消息动作运行时现在位于插件自有扩展目录中，而不是 `src/agents/tools` 下，例如：

- Discord 插件动作运行时文件
- Slack 插件动作运行时文件
- Telegram 插件动作运行时文件
- WhatsApp 插件动作运行时文件

## 核心集成流程

### 1. 运行内置智能体

主入口是 `pi-embedded-runner/run.ts` 中的 `runEmbeddedPiAgent()`：

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. 创建会话

在 `runEmbeddedAttempt()`（由 `runEmbeddedPiAgent()` 调用）内部，会使用 pi SDK：

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. 事件订阅

`subscribeEmbeddedPiSession()` 会订阅 pi 的 `AgentSession` 事件：

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

被处理的事件包括：

- `message_start` / `message_end` / `message_update`（流式文本/thinking）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. 提示词交互

完成设置后，会向会话发送提示词：

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK 会处理完整智能体循环：发送到 LLM、执行工具调用、流式返回响应。

图像注入是按提示词局部进行的：OpenClaw 会从当前提示词中加载图像引用，
并仅通过 `images` 在该轮中传入。它不会重新扫描较旧历史轮次来重新注入图像载荷。

## 工具架构

### 工具流水线

1. **基础工具**：pi 的 `codingTools`（read、bash、edit、write）
2. **自定义替换**：OpenClaw 将 bash 替换为 `exec`/`process`，并为沙箱定制 read/edit/write
3. **OpenClaw 工具**：消息、浏览器、画布、会话、cron、gateway 等
4. **渠道工具**：Discord/Telegram/Slack/WhatsApp 专用动作工具
5. **策略过滤**：按 profile、provider、智能体、群组、沙箱策略过滤工具
6. **Schema 规范化**：为 Gemini/OpenAI 特性清洗 schema
7. **AbortSignal 包装**：包装工具以尊重 abort signals

### 工具定义适配器

pi-agent-core 的 `AgentTool` 与 pi-coding-agent 的 `ToolDefinition` 在 `execute` 签名上不同。`pi-tool-definition-adapter.ts` 中的适配器用于桥接这一差异：

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent 的签名与 pi-agent-core 不同
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### 工具拆分策略

`splitSdkTools()` 会通过 `customTools` 传递所有工具：

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // 为空。我们会覆盖一切
    customTools: toToolDefinitions(options.tools),
  };
}
```

这可确保 OpenClaw 的策略过滤、沙箱集成和扩展工具集在各个提供商之间保持一致。

## System Prompt 构建

system prompt 在 `buildAgentSystemPrompt()`（`system-prompt.ts`）中构建。它会组装一个完整提示词，其中包括 Tooling、Tool Call Style、安全护栏、OpenClaw CLI 参考、Skills、文档、工作区、沙箱、消息、Reply Tags、语音、静默回复、心跳、运行时元数据，以及在启用时的 Memory 和 Reactions，还可选地加入上下文文件和额外 system prompt 内容。对 subagents 使用的最小提示词模式会对各个区段进行裁剪。

该提示词会在会话创建后通过 `applySystemPromptOverrideToSession()` 应用：

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## 会话管理

### 会话文件

会话是带树结构的 JSONL 文件（通过 id/parentId 链接）。Pi 的 `SessionManager` 负责持久化：

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw 会使用 `guardSessionManager()` 包装它，以保障工具结果安全。

### 会话缓存

`session-manager-cache.ts` 会缓存 SessionManager 实例，以避免重复解析文件：

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 历史限制

`limitHistoryTurns()` 会根据渠道类型（私信 vs 群组）裁剪对话历史。

### 压缩

自动压缩会在上下文溢出时触发。常见的溢出特征包括
`request_too_large`、`context length exceeded`、`input exceeds the
maximum number of tokens`、`input token count exceeds the maximum number of
input tokens`、`input is too long for the model` 和 `ollama error: context
length exceeded`。`compactEmbeddedPiSessionDirect()` 负责处理手动
压缩：

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 认证与模型解析

### 认证配置档案

OpenClaw 维护一个认证配置档案存储，为每个提供商支持多个 API key：

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

配置档案会在失败时轮换，并带有冷却跟踪：

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### 模型解析

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// 使用 pi 的 ModelRegistry 和 AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### 故障转移

当配置了回退时，`FailoverError` 会触发模型回退：

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Pi 扩展

OpenClaw 会加载自定义 pi 扩展，以支持专门行为：

### 压缩保护

`src/agents/pi-hooks/compaction-safeguard.ts` 会为压缩添加护栏，包括自适应 token 预算，以及工具失败和文件操作摘要：

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### 上下文裁剪

`src/agents/pi-hooks/context-pruning.ts` 实现了基于缓存 TTL 的上下文裁剪：

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## 流式传输与块回复

### 块分块

`EmbeddedBlockChunker` 负责将流式文本管理为离散回复块：

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final 标签剥离

流式输出会经过处理，以剥离 `<think>`/`<thinking>` 块并提取 `<final>` 内容：

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // 剥离 <think>...</think> 内容
  // 如果 enforceFinalTag，仅返回 <final>...</final> 内容
};
```

### 回复指令

诸如 `[[media:url]]`、`[[voice]]`、`[[reply:id]]` 之类的回复指令会被解析并提取：

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## 错误处理

### 错误分类

`pi-embedded-helpers.ts` 会对错误进行分类，以便采用合适处理方式：

```typescript
isContextOverflowError(errorText)     // 上下文过大
isCompactionFailureError(errorText)   // 压缩失败
isAuthAssistantError(lastAssistant)   // 认证失败
isRateLimitAssistantError(...)        // 速率限制
isFailoverAssistantError(...)         // 应触发故障转移
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking Level 回退

如果某个 thinking level 不受支持，则会回退：

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## 沙箱集成

启用沙箱模式时，工具和路径都会受到约束：

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // 使用沙箱化的 read/edit/write 工具
  // Exec 在容器中运行
  // Browser 使用 bridge URL
}
```

## 提供商专用处理

### Anthropic

- 拒绝魔法字符串清理
- 连续角色的轮次校验
- 严格的上游 Pi 工具参数校验

### Google/Gemini

- 插件自有工具 schema 清洗

### OpenAI

- 面向 Codex 模型的 `apply_patch` 工具
- Thinking level 降级处理

## TUI 集成

OpenClaw 也有一个本地 TUI 模式，它会直接使用 pi-tui 组件：

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

这提供了与 pi 原生模式类似的交互式终端体验。

## 与 Pi CLI 的关键区别

| 方面 | Pi CLI | OpenClaw 内置 |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| 调用方式 | `pi` 命令 / RPC | 通过 `createAgentSession()` 使用 SDK |
| 工具 | 默认编码工具 | 自定义 OpenClaw 工具套件 |
| System prompt | AGENTS.md + prompts | 按渠道/上下文动态生成 |
| 会话存储 | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（或 `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| 认证 | 单一凭证 | 带轮换的多配置档案 |
| 扩展 | 从磁盘加载 | 程序化 + 磁盘路径 |
| 事件处理 | TUI 渲染 | 基于回调（`onBlockReply` 等） |

## 未来考量

潜在可重构的方向：

1. **工具签名对齐**：当前仍在适配 pi-agent-core 与 pi-coding-agent 的签名
2. **Session manager 包装**：`guardSessionManager` 增加了安全性，但也提升了复杂度
3. **扩展加载**：可更直接地使用 pi 的 `ResourceLoader`
4. **流式处理器复杂性**：`subscribeEmbeddedPiSession` 已变得很大
5. **提供商特性差异**：存在许多提供商专用代码路径，而这些未来可能可以由 pi 自身处理

## 测试

Pi 集成覆盖以下测试套件：

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

实时/按需启用：

- `src/agents/pi-embedded-runner-extraparams.live.test.ts`（启用 `OPENCLAW_LIVE_TEST=1`）

当前运行命令请参阅 [Pi 开发工作流](/zh-CN/pi-dev)。
