---
read_when:
    - 你需要从插件中调用核心辅助工具（TTS、STT、图像生成、Web 搜索、subagent）
    - 你想了解 `api.runtime` 暴露了什么
    - 你正在从插件代码中访问配置、智能体或媒体辅助工具
sidebarTitle: Runtime Helpers
summary: api.runtime —— 可供插件使用的注入式运行时辅助工具
title: 插件运行时辅助工具
x-i18n:
    generated_at: "2026-04-23T20:58:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9025693a82c89c1a5b7f72771a34aa2f14836d2987424cec5b3eb3252a1ad82a
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

关于 `api.runtime` 对象的参考，它会在插件注册期间注入到每个插件中。
请使用这些辅助工具，而不要直接导入主机内部实现。

<Tip>
  **想看完整示例？** 请参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)
  或 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)，那里有分步骤指南，
  会结合上下文展示这些辅助工具的使用方式。
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 运行时命名空间

### `api.runtime.agent`

智能体身份、目录和会话管理。

```typescript
// 解析智能体工作目录
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// 解析智能体工作区
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// 获取智能体身份
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// 获取默认 thinking 级别
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// 获取智能体超时
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// 确保工作区存在
await api.runtime.agent.ensureAgentWorkspace(cfg);

// 运行一个嵌入式智能体轮次
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` 是从插件代码启动普通 OpenClaw
智能体轮次的中性辅助工具。它使用与渠道触发回复相同的提供商/模型解析和
agent-harness 选择逻辑。

`runEmbeddedPiAgent(...)` 仍保留作为兼容性别名。

**会话存储辅助工具**位于 `api.runtime.agent.session` 下：

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

默认模型和提供商常量：

```typescript
const model = api.runtime.agent.defaults.model; // 例如 "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // 例如 "anthropic"
```

### `api.runtime.subagent`

启动和管理后台 subagent 运行。

```typescript
// 启动一次 subagent 运行
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // 可选覆盖项
  model: "gpt-4.1-mini", // 可选覆盖项
  deliver: false,
});

// 等待完成
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// 读取会话消息
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// 删除会话
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  模型覆盖（`provider`/`model`）需要通过配置中的
  `plugins.entries.<id>.subagent.allowModelOverride: true`
  进行 operator 显式启用。
  不受信任插件仍可运行 subagents，但覆盖请求会被拒绝。
</Warning>

### `api.runtime.taskFlow`

将 Task Flow 运行时绑定到现有 OpenClaw 会话键或受信任的工具
上下文，然后无需在每次调用时传入 owner，就可以创建和管理 Task Flow。

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Review new pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Review PR #123",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

当你已经从自己的绑定层中拿到了一个受信任的 OpenClaw 会话键时，请使用
`bindSession({ sessionKey, requesterOrigin })`。不要从原始
用户输入中进行绑定。

### `api.runtime.tts`

文本转语音合成。

```typescript
// 标准 TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 电信优化 TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 列出可用语音
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

使用核心 `messages.tts` 配置和提供商选择。返回 PCM 音频
buffer + 采样率。

### `api.runtime.mediaUnderstanding`

图像、音频和视频分析。

```typescript
// 描述图像
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// 转录音频
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // 可选，用于无法推断 MIME 时
});

// 描述视频
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// 通用文件分析
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

当没有生成输出时（例如输入被跳过），返回 `{ text: undefined }`。

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` 仍保留为
  `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容性别名。
</Info>

### `api.runtime.imageGeneration`

图像生成。

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Web 搜索。

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

底层媒体辅助工具。

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
  scale: 6, // 1-12
  marginModules: 4, // 0-16
});
```

### `api.runtime.config`

配置加载与写入。

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

系统级辅助工具。

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

事件订阅。

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

日志。

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

模型与提供商认证解析。

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

状态目录解析。

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Memory 工具工厂与 CLI。

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

渠道特定运行时辅助工具（在加载渠道插件时可用）。

`api.runtime.channel.mentions` 是供使用运行时注入的内置渠道插件使用的共享入站提及策略表面：

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

可用的提及辅助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` 有意不暴露旧版的
`resolveMentionGating*` 兼容性辅助工具。请优先使用规范化后的
`{ facts, policy }` 路径。

## 存储运行时引用

使用 `createPluginRuntimeStore` 存储运行时引用，以便在
`register` 回调之外使用：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// 在你的入口点中
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// 在其他文件中
export function getRuntime() {
  return store.getRuntime(); // 未初始化时抛出异常
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // 未初始化时返回 null
}
```

对于 runtime-store 标识，优先使用 `pluginId`。较低层级的 `key` 形式
适用于少见情况，即一个插件有意需要多个运行时槽位时。

## 其他顶级 `api` 字段

除 `api.runtime` 之外，API 对象还提供：

| 字段 | 类型 | 描述 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id` | `string` | 插件 ID |
| `api.name` | `string` | 插件显示名称 |
| `api.config` | `OpenClawConfig` | 当前配置快照（可用时为活动的内存运行时快照） |
| `api.pluginConfig` | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专属配置 |
| `api.logger` | `PluginLogger` | 带作用域的日志记录器（`debug`、`info`、`warn`、`error`） |
| `api.registrationMode` | `PluginRegistrationMode` | 当前加载模式；`"setup-runtime"` 是完整入口前的轻量启动/设置窗口 |
| `api.resolvePath(input)` | `(string) => string` | 解析相对于插件根目录的路径 |

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) -- 子路径参考
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) -- `definePluginEntry` 选项
- [插件内部结构](/zh-CN/plugins/architecture) -- 能力模型与注册表
