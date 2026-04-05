---
read_when:
    - plugin から core helper（TTS、STT、image gen、web search、subagent）を呼び出す必要がある場合
    - '`api.runtime` が何を公開しているか理解したい場合'
    - plugin コードから config、agent、または media helper にアクセスする場合
sidebarTitle: Runtime Helpers
summary: api.runtime -- plugin で利用できる注入済み runtime helper
title: Plugin Runtime Helpers
x-i18n:
    generated_at: "2026-04-05T12:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667edff734fd30f9b05d55eae6360830a45ae8f3012159f88a37b5e05404e666
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Plugin Runtime Helpers

registration 中に各 plugin に注入される `api.runtime` オブジェクトのリファレンスです。
ホスト内部を直接 import する代わりに、これらの helper を使用してください。

<Tip>
  **チュートリアルを探していますか?** [Channel Plugins](/plugins/sdk-channel-plugins)
  または [Provider Plugins](/plugins/sdk-provider-plugins) のステップごとのガイドを参照してください。
  これらの helper が実際の文脈でどのように使われるかを確認できます。
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Runtime namespace

### `api.runtime.agent`

agent の identity、ディレクトリー、およびセッション管理です。

```typescript
// agent の作業ディレクトリーを解決する
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// agent workspace を解決する
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// agent identity を取得する
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// デフォルトの thinking レベルを取得する
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// agent timeout を取得する
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// workspace が存在することを保証する
await api.runtime.agent.ensureAgentWorkspace(cfg);

// 埋め込み Pi agent を実行する
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "最新の変更を要約して",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

**Session store helper** は `api.runtime.agent.session` 配下にあります:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

デフォルトの model および provider 定数です:

```typescript
const model = api.runtime.agent.defaults.model; // 例: "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // 例: "anthropic"
```

### `api.runtime.subagent`

バックグラウンド subagent 実行を起動して管理します。

```typescript
// subagent 実行を開始する
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "このクエリを、焦点を絞った追加検索に展開して。",
  provider: "openai", // 任意の override
  model: "gpt-4.1-mini", // 任意の override
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
  model override（`provider` / `model`）には、config 内の
  `plugins.entries.<id>.subagent.allowModelOverride: true` による
  operator のオプトインが必要です。
  信頼されていない plugin でも subagent を実行できますが、override リクエストは拒否されます。
</Warning>

### `api.runtime.taskFlow`

既存の OpenClaw session key または信頼された tool
context に Task Flow runtime を bind し、呼び出しごとに owner を渡さずに
Task Flow を作成して管理します。

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "新しい pull request をレビューする",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "PR #123 をレビューする",
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

独自の binding layer からすでに信頼された OpenClaw session key を持っている場合は、
`bindSession({ sessionKey, requesterOrigin })` を使用してください。生の
ユーザー入力から bind しないでください。

### `api.runtime.tts`

text-to-speech 合成です。

```typescript
// 標準 TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 電話向けに最適化された TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 利用可能な voice を一覧表示する
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

core の `messages.tts` 設定と provider 選択を使用します。PCM audio
buffer + sample rate を返します。

### `api.runtime.mediaUnderstanding`

画像、音声、動画の解析です。

```typescript
// 画像を説明する
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// 音声を文字起こしする
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // 任意。MIME を推定できない場合に使用
});

// 動画を説明する
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// 汎用ファイル解析
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

出力が生成されない場合（例: 入力がスキップされた場合）は `{ text: undefined }` を返します。

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` は、互換性用 alias として
  `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` のまま残っています。
</Info>

### `api.runtime.imageGeneration`

画像生成です。

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "夕日を描くロボット",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

web 検索です。

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

低レベルの media ユーティリティです。

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

config の読み込みと書き込みです。

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

model および provider の auth 解決です。

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

state ディレクトリーの解決です。

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

memory tool factory と CLI です。

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

channel 固有の runtime helper です（channel plugin が読み込まれているときに利用可能です）。

## runtime 参照を保存する

`register` callback の外で使用するために runtime 参照を保存するには、
`createPluginRuntimeStore` を使用してください:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// entry point 内
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// 他のファイル内
export function getRuntime() {
  return store.getRuntime(); // 初期化されていなければ throw する
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // 初期化されていなければ null を返す
}
```

## そのほかのトップレベル `api` フィールド

`api.runtime` に加えて、API オブジェクトは次も提供します:

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | plugin id                                                                                   |
| `api.name`               | `string`                  | plugin の表示名                                                                         |
| `api.config`             | `OpenClawConfig`          | 現在の config snapshot（利用可能な場合はアクティブなインメモリ runtime snapshot）                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの plugin 固有 config                                   |
| `api.logger`             | `PluginLogger`            | スコープ付き logger（`debug`, `info`, `warn`, `error`）                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の load mode。`"setup-runtime"` は軽量な pre-full-entry startup/setup window です |
| `api.resolvePath(input)` | `(string) => string`      | plugin ルートからの相対パスを解決する                                                  |

## 関連

- [SDK Overview](/plugins/sdk-overview) -- subpath リファレンス
- [SDK Entry Points](/plugins/sdk-entrypoints) -- `definePluginEntry` オプション
- [Plugin Internals](/plugins/architecture) -- capability モデルと registry
