---
read_when:
    - Plugin からコアヘルパー（TTS、STT、画像生成、Web 検索、サブエージェント、Node）を呼び出す必要があります
    - '`api.runtime` が何を公開しているかを理解したいです'
    - Plugin コードから config、agent、またはメディアヘルパーにアクセスしています
sidebarTitle: Runtime Helpers
summary: '`api.runtime` — Plugin で利用できる注入済みランタイムヘルパー'
title: Plugin ランタイムヘルパー
x-i18n:
    generated_at: "2026-04-25T13:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

登録時にすべての Plugin に注入される `api.runtime` オブジェクトのリファレンスです。ホスト内部を直接インポートする代わりに、これらのヘルパーを使用してください。

<Tip>
  **手順付きガイドを探していますか？** これらのヘルパーがどのような文脈で使われるかを示すステップごとのガイドについては、[Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) または [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください。
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## ランタイム名前空間

### `api.runtime.agent`

エージェントの識別情報、ディレクトリ、およびセッション管理です。

```typescript
// エージェントの作業ディレクトリを解決する
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// エージェントのワークスペースを解決する
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// エージェントの識別情報を取得する
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// デフォルトの思考レベルを取得する
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// エージェントのタイムアウトを取得する
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// ワークスペースの存在を保証する
await api.runtime.agent.ensureAgentWorkspace(cfg);

// 埋め込みエージェントターンを実行する
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

`runEmbeddedAgent(...)` は、Plugin コードから通常の OpenClaw エージェントターンを開始するための中立的なヘルパーです。チャネルによってトリガーされる返信と同じ provider/model 解決およびエージェントハーネス選択を使用します。

`runEmbeddedPiAgent(...)` は互換性エイリアスとして引き続き残されています。

**セッションストアヘルパー** は `api.runtime.agent.session` の下にあります。

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

デフォルトのモデルおよび provider 定数です。

```typescript
const model = api.runtime.agent.defaults.model; // 例: "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // 例: "anthropic"
```

### `api.runtime.subagent`

バックグラウンドのサブエージェント実行を開始および管理します。

```typescript
// サブエージェント実行を開始する
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // optional override
  model: "gpt-4.1-mini", // optional override
  deliver: false,
});

// 完了を待つ
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// セッションメッセージを読む
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// セッションを削除する
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  モデルオーバーライド（`provider`/`model`）には、config で `plugins.entries.<id>.subagent.allowModelOverride: true` を介したオペレーターのオプトインが必要です。
  信頼されていない Plugin でもサブエージェントは実行できますが、オーバーライド要求は拒否されます。
</Warning>

### `api.runtime.nodes`

接続された Node を一覧表示し、Gateway でロードされた Plugin コードまたは Plugin CLI コマンドから Node ホストコマンドを呼び出します。たとえば別の Mac 上のブラウザーやオーディオブリッジなど、Plugin がペアリング済みデバイス上のローカル作業を所有する場合に使用します。

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Gateway 内では、このランタイムはインプロセスです。Plugin CLI コマンドでは、設定済み Gateway を RPC 経由で呼び出すため、`openclaw googlemeet recover-tab` のようなコマンドはターミナルからペアリング済み Node を検査できます。Node コマンドは引き続き通常の Gateway Node ペアリング、コマンド許可リスト、および Node ローカルのコマンド処理を通ります。

### `api.runtime.taskFlow`

Task Flow ランタイムを既存の OpenClaw セッションキーまたは信頼済みツールコンテキストにバインドし、毎回 owner を渡さずに Task Flow を作成および管理します。

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

自分のバインディング層から信頼済みの OpenClaw セッションキーをすでに持っている場合は、`bindSession({ sessionKey, requesterOrigin })` を使用してください。生のユーザー入力からバインドしないでください。

### `api.runtime.tts`

テキスト読み上げ合成です。

```typescript
// Standard TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Telephony-optimized TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// List available voices
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

コアの `messages.tts` 設定と provider 選択を使用します。PCM オーディオバッファーとサンプルレートを返します。

### `api.runtime.mediaUnderstanding`

画像、音声、および動画の解析です。

```typescript
// Describe an image
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transcribe audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // optional, for when MIME cannot be inferred
});

// Describe a video
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Generic file analysis
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

出力が生成されない場合（たとえば入力がスキップされた場合）は `{ text: undefined }` を返します。

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` は、`api.runtime.mediaUnderstanding.transcribeAudioFile(...)` の互換性エイリアスとして引き続き残されています。
</Info>

### `api.runtime.imageGeneration`

画像生成です。

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Web 検索です。

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

低レベルのメディアユーティリティです。

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
const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
const tmpRoot = resolvePreferredOpenClawTmpDir();
const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
  tmpRoot,
  dirPrefix: "my-plugin-qr-",
  fileName: "qr.png",
});
```

### `api.runtime.config`

Config の読み込みと書き込みです。

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

システムレベルのユーティリティです。

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

イベント購読です。

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

ロギングです。

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

モデルおよび provider 認証の解決です。

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

状態ディレクトリの解決です。

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

メモリツールファクトリーと CLI です。

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

チャネル固有のランタイムヘルパーです（チャネル Plugin がロードされている場合に利用可能です）。

`api.runtime.channel.mentions` は、ランタイム注入を使用するバンドル済みチャネル Plugin 向けの共有受信メンションポリシーサーフェスです。

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

利用可能なメンションヘルパー:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` は、古い `resolveMentionGating*` 互換性ヘルパーを意図的に公開していません。正規化された `{ facts, policy }` パスを優先してください。

## ランタイム参照の保存

`createPluginRuntimeStore` を使用して、`register` コールバックの外で使うためのランタイム参照を保存してください。

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// In your entry point
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In other files
export function getRuntime() {
  return store.getRuntime(); // throws if not initialized
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // returns null if not initialized
}
```

ランタイムストアの識別には `pluginId` を優先してください。より低レベルな `key` 形式は、1 つの Plugin が意図的に複数のランタイムスロットを必要とするまれなケース向けです。

## その他のトップレベル `api` フィールド

`api.runtime` に加えて、API オブジェクトは次も提供します。

| フィールド | 型 | 説明 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                   |
| `api.name`               | `string`                  | Plugin 表示名                                                                         |
| `api.config`             | `OpenClawConfig`          | 現在の config スナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット）                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有 config                                   |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"` は完全なエントリ前の軽量な起動/setup ウィンドウです |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決する                                                  |

## 関連

- [SDK overview](/ja-JP/plugins/sdk-overview) — サブパスのリファレンス
- [SDK entry points](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` のオプション
- [Plugin internals](/ja-JP/plugins/architecture) — 機能モデルとレジストリ
