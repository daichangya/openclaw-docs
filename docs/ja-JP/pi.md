---
read_when:
    - OpenClaw における Pi SDK 統合設計を理解する
    - Pi 向けの agent セッションライフサイクル、ツール、または provider 配線を変更する
summary: OpenClaw の埋め込み Pi agent 統合とセッションライフサイクルのアーキテクチャ
title: Pi 統合アーキテクチャ
x-i18n:
    generated_at: "2026-04-25T13:51:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

このドキュメントでは、OpenClaw が [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) と、その兄弟パッケージ（`pi-ai`、`pi-agent-core`、`pi-tui`）をどのように統合して AI agent 機能を実現しているかを説明します。

## 概要

OpenClaw は pi SDK を使って、AI coding agent をメッセージング gateway アーキテクチャに埋め込みます。pi をサブプロセスとして起動したり RPC モードを使ったりする代わりに、OpenClaw は `createAgentSession()` を通じて pi の `AgentSession` を直接 import・インスタンス化します。この埋め込み方式により、次が可能になります。

- セッションライフサイクルとイベント処理の完全な制御
- カスタムツールの注入（メッセージング、sandbox、チャネル固有アクション）
- チャネル/コンテキストごとの system prompt カスタマイズ
- 分岐/Compaction サポート付きのセッション永続化
- フェイルオーバー付きのマルチアカウント auth profile ローテーション
- provider 非依存の model 切り替え

## パッケージ依存関係

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| パッケージ         | 用途                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | コア LLM 抽象化: `Model`、`streamSimple`、message type、provider API                                   |
| `pi-agent-core`   | agent ループ、ツール実行、`AgentMessage` type                                                          |
| `pi-coding-agent` | 高レベル SDK: `createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、組み込みツール |
| `pi-tui`          | ターミナル UI コンポーネント（OpenClaw のローカル TUI モードで使用）                                  |

## ファイル構成

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ からの再エクスポート
├── pi-embedded-runner/
│   ├── run.ts                     # メインエントリ: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # セッションセットアップ付きの単一試行ロジック
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # 実行結果からレスポンスペイロードを構築
│   │   ├── images.ts              # Vision model への画像注入
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort エラー検出
│   ├── cache-ttl.ts               # コンテキスト削減用のキャッシュ TTL 追跡
│   ├── compact.ts                 # 手動/自動 Compaction ロジック
│   ├── extensions.ts              # 埋め込み実行用の pi extension を読み込む
│   ├── extra-params.ts            # provider 固有のストリームパラメータ
│   ├── google.ts                  # Google/Gemini のターン順序修正
│   ├── history.ts                 # 履歴制限（DM 対 group）
│   ├── lanes.ts                   # セッション/グローバル command lane
│   ├── logger.ts                  # サブシステム logger
│   ├── model.ts                   # ModelRegistry による model 解決
│   ├── runs.ts                    # アクティブ実行の追跡、abort、queue
│   ├── sandbox-info.ts            # system prompt 用の sandbox 情報
│   ├── session-manager-cache.ts   # SessionManager インスタンスキャッシュ
│   ├── session-manager-init.ts    # セッションファイル初期化
│   ├── system-prompt.ts           # system prompt builder
│   ├── tool-split.ts              # ツールを builtIn と custom に分割
│   ├── types.ts                   # EmbeddedPiAgentMeta、EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel マッピング、エラー説明
├── pi-embedded-subscribe.ts       # セッションイベントの購読/配信
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # イベントハンドラーファクトリー
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # ストリーミング block reply のチャンク化
├── pi-embedded-messaging.ts       # Messaging ツール送信の追跡
├── pi-embedded-helpers.ts         # エラー分類、ターン検証
├── pi-embedded-helpers/           # ヘルパーモジュール
├── pi-embedded-utils.ts           # 整形ユーティリティ
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # ツール用 AbortSignal ラッピング
├── pi-tools.policy.ts             # ツール許可/拒否ポリシー
├── pi-tools.read.ts               # Read ツールのカスタマイズ
├── pi-tools.schema.ts             # ツールスキーマの正規化
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition アダプター
├── pi-settings.ts                 # Settings 上書き
├── pi-hooks/                      # カスタム pi フック
│   ├── compaction-safeguard.ts    # safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # キャッシュ TTL コンテキスト削減 extension
│   └── context-pruning/
├── model-auth.ts                  # auth profile 解決
├── auth-profiles.ts               # profile store、cooldown、failover
├── model-selection.ts             # デフォルト model 解決
├── models-config.ts               # models.json 生成
├── model-catalog.ts               # model catalog キャッシュ
├── context-window-guard.ts        # context window 検証
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER、DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # system prompt パラメータ解決
├── system-prompt-report.ts        # デバッグレポート生成
├── tool-summaries.ts              # ツール説明要約
├── tool-policy.ts                 # ツールポリシー解決
├── transcript-policy.ts           # transcript 検証ポリシー
├── skills.ts                      # Skill スナップショット/prompt 構築
├── skills/                        # Skill サブシステム
├── sandbox.ts                     # sandbox コンテキスト解決
├── sandbox/                       # sandbox サブシステム
├── channel-tools.ts               # チャネル固有ツール注入
├── openclaw-tools.ts              # OpenClaw 固有ツール
├── bash-tools.ts                  # exec/process ツール
├── apply-patch.ts                 # apply_patch ツール（OpenAI）
├── tools/                         # 個別ツール実装
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

チャネル固有のメッセージアクションランタイムは現在、`src/agents/tools` 配下ではなく Plugin 所有の extension
ディレクトリにあります。たとえば:

- Discord Plugin のアクションランタイムファイル
- Slack Plugin のアクションランタイムファイル
- Telegram Plugin のアクションランタイムファイル
- WhatsApp Plugin のアクションランタイムファイル

## コア統合フロー

### 1. 埋め込み agent の実行

メインエントリポイントは `pi-embedded-runner/run.ts` の `runEmbeddedPiAgent()` です。

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

### 2. セッション作成

`runEmbeddedAttempt()`（`runEmbeddedPiAgent()` から呼び出される）の内部で、pi SDK が使われます。

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

### 3. イベント購読

`subscribeEmbeddedPiSession()` は pi の `AgentSession` イベントを購読します。

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

処理されるイベントには次が含まれます。

- `message_start` / `message_end` / `message_update`（ストリーミング text/thinking）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. プロンプト送信

セットアップ後、セッションにプロンプトを送ります。

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK は完全な agent ループを処理します。つまり、LLM への送信、ツール呼び出しの実行、レスポンスのストリーミングです。

画像注入はプロンプトローカルです。OpenClaw は現在のプロンプトから image ref を読み込み、
そのターンに限って `images` 経由で渡します。古い履歴ターンを再走査して
画像ペイロードを再注入することはありません。

## ツールアーキテクチャ

### ツールパイプライン

1. **ベースツール**: pi の `codingTools`（read、bash、edit、write）
2. **カスタム置換**: OpenClaw は bash を `exec`/`process` に置き換え、sandbox 用に read/edit/write をカスタマイズ
3. **OpenClaw ツール**: messaging、browser、canvas、sessions、cron、gateway など
4. **チャネルツール**: Discord/Telegram/Slack/WhatsApp 固有のアクションツール
5. **ポリシーフィルタリング**: プロファイル、provider、agent、group、sandbox ポリシーでツールをフィルタ
6. **スキーマ正規化**: Gemini/OpenAI 固有の癖に合わせてスキーマを整形
7. **AbortSignal ラッピング**: abort signal を尊重するようツールをラップ

### ツール定義アダプター

pi-agent-core の `AgentTool` は、pi-coding-agent の `ToolDefinition` とは異なる `execute` シグネチャを持っています。`pi-tool-definition-adapter.ts` のアダプターがこれを橋渡しします。

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent のシグネチャは pi-agent-core と異なる
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### ツール分割戦略

`splitSdkTools()` はすべてのツールを `customTools` 経由で渡します。

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // 空。すべて上書きする
    customTools: toToolDefinitions(options.tools),
  };
}
```

これにより、OpenClaw のポリシーフィルタリング、sandbox 統合、拡張ツールセットが provider 間で一貫したものになります。

## system prompt の構築

system prompt は `buildAgentSystemPrompt()`（`system-prompt.ts`）で構築されます。Tooling、Tool Call Style、安全ガードレール、OpenClaw CLI リファレンス、Skills、Docs、Workspace、Sandbox、Messaging、Reply Tags、Voice、Silent Replies、Heartbeats、Runtime metadata に加え、有効な場合は Memory と Reactions、さらに任意の context file と追加 system prompt コンテンツを含む完全な prompt を組み立てます。セクションは、subagent で使われる最小 prompt モード向けに切り詰められます。

prompt は、セッション作成後に `applySystemPromptOverrideToSession()` を通じて適用されます。

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## セッション管理

### セッションファイル

セッションはツリー構造（`id`/`parentId` のリンク）を持つ JSONL ファイルです。pi の `SessionManager` が永続化を処理します。

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw は、ツール結果の安全性のためにこれを `guardSessionManager()` でラップします。

### セッションキャッシュ

`session-manager-cache.ts` は、ファイルの繰り返し解析を避けるために SessionManager インスタンスをキャッシュします。

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 履歴制限

`limitHistoryTurns()` は、チャネル種別（DM 対 group）に応じて会話履歴を切り詰めます。

### Compaction

コンテキストオーバーフロー時に自動 Compaction が発動します。一般的なオーバーフローシグネチャには
`request_too_large`、`context length exceeded`、`input exceeds the
maximum number of tokens`、`input token count exceeds the maximum number of
input tokens`、`input is too long for the model`、および `ollama error: context
length exceeded` が含まれます。`compactEmbeddedPiSessionDirect()` は手動
Compaction を処理します。

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 認証と model 解決

### auth profile

OpenClaw は、provider ごとに複数 API キーを持つ auth profile ストアを維持します。

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

profile は、cooldown 追跡付きで失敗時にローテーションされます。

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### model 解決

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// pi の ModelRegistry と AuthStorage を使用
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### フェイルオーバー

設定されている場合、`FailoverError` は model フォールバックを発動します。

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

## Pi extension

OpenClaw は、特化した動作のためにカスタム pi extension を読み込みます。

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` は、適応的なトークン予算化に加え、ツール失敗とファイル操作の要約を含む Compaction 用ガードレールを追加します。

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` は、cache-TTL ベースのコンテキスト削減を実装します。

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

## ストリーミングと block reply

### block のチャンク化

`EmbeddedBlockChunker` は、ストリーミング text を離散的な reply block に分割して管理します。

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### thinking/final タグの除去

ストリーミング出力は、`<think>`/`<thinking>` ブロックを取り除き、`<final>` コンテンツを抽出するよう処理されます。

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> コンテンツを除去
  // enforceFinalTag の場合、<final>...</final> コンテンツだけを返す
};
```

### reply ディレクティブ

`[[media:url]]`、`[[voice]]`、`[[reply:id]]` のような reply ディレクティブは解析・抽出されます。

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## エラー処理

### エラー分類

`pi-embedded-helpers.ts` は、適切に処理するためにエラーを分類します。

```typescript
isContextOverflowError(errorText)     // コンテキストが大きすぎる
isCompactionFailureError(errorText)   // Compaction に失敗
isAuthAssistantError(lastAssistant)   // auth 失敗
isRateLimitAssistantError(...)        // rate limit
isFailoverAssistantError(...)         // フェイルオーバーすべき
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### thinking レベルのフォールバック

thinking レベルがサポートされていない場合は、フォールバックします。

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

## sandbox 統合

sandbox mode が有効な場合、ツールとパスは制約されます。

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // sandbox 化された read/edit/write ツールを使用
  // Exec はコンテナ内で実行
  // Browser は bridge URL を使用
}
```

## provider 固有の処理

### Anthropic

- refusal の magic string 除去
- 連続ロールに対するターン検証
- 厳格な upstream Pi ツールパラメータ検証

### Google/Gemini

- Plugin 所有のツールスキーマサニタイズ

### OpenAI

- Codex model 用の `apply_patch` ツール
- thinking レベルのダウングレード処理

## TUI 統合

OpenClaw には、pi-tui コンポーネントを直接使うローカル TUI モードもあります。

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

これにより、pi のネイティブモードに似た対話型ターミナル体験が提供されます。

## Pi CLI との主な違い

| 項目              | Pi CLI                  | OpenClaw Embedded                                                                                     |
| ----------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| 呼び出し方法      | `pi` コマンド / RPC     | `createAgentSession()` 経由の SDK                                                                     |
| ツール            | デフォルト coding ツール | カスタム OpenClaw ツール群                                                                            |
| system prompt     | AGENTS.md + prompt      | チャネル/コンテキストごとの動的生成                                                                   |
| セッション保存    | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（または `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| auth              | 単一資格情報            | ローテーション付きマルチ profile                                                                      |
| extension         | ディスクから読み込み    | プログラム的 + ディスクパス                                                                           |
| イベント処理      | TUI レンダリング        | コールバックベース（`onBlockReply` など）                                                             |

## 今後の検討事項

再設計の可能性がある領域:

1. **ツールシグネチャの整合**: 現在は pi-agent-core と pi-coding-agent のシグネチャ差を吸収している
2. **SessionManager のラップ**: `guardSessionManager` は安全性を加えるが、複雑さも増す
3. **extension 読み込み**: pi の `ResourceLoader` をより直接使える可能性がある
4. **ストリーミングハンドラーの複雑さ**: `subscribeEmbeddedPiSession` が大きくなっている
5. **provider の癖**: provider 固有コードパスが多く、pi 側で吸収できる可能性がある

## テスト

Pi 統合のカバレッジは次のスイートにまたがっています。

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

ライブ/オプトイン:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts`（`OPENCLAW_LIVE_TEST=1` を有効化）

現在の実行コマンドについては [Pi Development Workflow](/ja-JP/pi-dev) を参照してください。

## 関連

- [Pi development workflow](/ja-JP/pi-dev)
- [Install overview](/ja-JP/install)
