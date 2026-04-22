---
read_when:
    - OpenClawにおけるPi SDK統合設計の理解
    - Pi向けのエージェントセッションライフサイクル、ツール、またはプロバイダー配線の変更
summary: OpenClawに組み込まれたPi agent統合のアーキテクチャとセッションライフサイクル
title: Pi統合アーキテクチャ
x-i18n:
    generated_at: "2026-04-22T04:24:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# Pi統合アーキテクチャ

このドキュメントでは、OpenClawが [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) と、その兄弟パッケージ（`pi-ai`、`pi-agent-core`、`pi-tui`）をどのように統合して、AIエージェント機能を実現しているかを説明します。

## 概要

OpenClawはpi SDKを使って、AIコーディングエージェントをメッセージングGatewayアーキテクチャに埋め込みます。piをサブプロセスとして起動したりRPCモードを使ったりするのではなく、OpenClawは `createAgentSession()` を通じてpiの `AgentSession` を直接importして生成します。この埋め込み方式により、次のことが可能になります。

- セッションライフサイクルとイベント処理の完全な制御
- カスタムツール注入（メッセージング、sandbox、チャネル固有アクション）
- チャネル/コンテキストごとのシステムプロンプトのカスタマイズ
- 分岐/Compactionサポート付きのセッション永続化
- フェイルオーバー付きのマルチアカウント認証プロファイルローテーション
- プロバイダー非依存のモデル切り替え

## パッケージ依存関係

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| パッケージ | 用途 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | コアLLM抽象化: `Model`, `streamSimple`, メッセージ型、プロバイダーAPI |
| `pi-agent-core`   | エージェントループ、ツール実行、`AgentMessage` 型 |
| `pi-coding-agent` | 高レベルSDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, 組み込みツール |
| `pi-tui`          | ターミナルUIコンポーネント（OpenClawのローカルTUIモードで使用） |

## ファイル構成

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ から再エクスポート
├── pi-embedded-runner/
│   ├── run.ts                     # メインエントリ: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # セッション設定付きの単一試行ロジック
│   │   ├── params.ts              # RunEmbeddedPiAgentParams 型
│   │   ├── payloads.ts            # 実行結果から応答ペイロードを構築
│   │   ├── images.ts              # Visionモデルの画像注入
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abortエラー検出
│   ├── cache-ttl.ts               # コンテキスト刈り込み用のキャッシュTTL追跡
│   ├── compact.ts                 # 手動/自動Compactionロジック
│   ├── extensions.ts              # 埋め込み実行向けpi拡張を読み込み
│   ├── extra-params.ts            # プロバイダー固有のストリームパラメーター
│   ├── google.ts                  # Google/Geminiのターン順序修正
│   ├── history.ts                 # 履歴制限（DM vs group）
│   ├── lanes.ts                   # セッション/グローバルコマンドレーン
│   ├── logger.ts                  # サブシステムロガー
│   ├── model.ts                   # ModelRegistry経由のモデル解決
│   ├── runs.ts                    # アクティブ実行の追跡、中断、キュー
│   ├── sandbox-info.ts            # システムプロンプト用のsandbox情報
│   ├── session-manager-cache.ts   # SessionManagerインスタンスキャッシュ
│   ├── session-manager-init.ts    # セッションファイル初期化
│   ├── system-prompt.ts           # システムプロンプトビルダー
│   ├── tool-split.ts              # ツールを builtIn / custom に分割
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevelマッピング、エラー説明
├── pi-embedded-subscribe.ts       # セッションイベント購読/ディスパッチ
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # イベントハンドラーファクトリー
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # ストリーミングブロック返信チャンク化
├── pi-embedded-messaging.ts       # メッセージングツール送信追跡
├── pi-embedded-helpers.ts         # エラー分類、ターン検証
├── pi-embedded-helpers/           # ヘルパーモジュール
├── pi-embedded-utils.ts           # フォーマットユーティリティ
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # ツール用AbortSignalラッピング
├── pi-tools.policy.ts             # ツール許可リスト/拒否リストポリシー
├── pi-tools.read.ts               # 読み取りツールのカスタマイズ
├── pi-tools.schema.ts             # ツールスキーマ正規化
├── pi-tools.types.ts              # AnyAgentTool型エイリアス
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinitionアダプター
├── pi-settings.ts                 # 設定上書き
├── pi-hooks/                      # カスタムpiフック
│   ├── compaction-safeguard.ts    # セーフガード拡張
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # キャッシュTTLコンテキスト刈り込み拡張
│   └── context-pruning/
├── model-auth.ts                  # 認証プロファイル解決
├── auth-profiles.ts               # プロファイルストア、クールダウン、フェイルオーバー
├── model-selection.ts             # デフォルトモデル解決
├── models-config.ts               # models.json生成
├── model-catalog.ts               # モデルカタログキャッシュ
├── context-window-guard.ts        # コンテキストウィンドウ検証
├── failover-error.ts              # FailoverErrorクラス
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # システムプロンプトパラメーター解決
├── system-prompt-report.ts        # デバッグレポート生成
├── tool-summaries.ts              # ツール説明サマリー
├── tool-policy.ts                 # ツールポリシー解決
├── transcript-policy.ts           # トランスクリプト検証ポリシー
├── skills.ts                      # Skillsスナップショット/プロンプト構築
├── skills/                        # Skillsサブシステム
├── sandbox.ts                     # sandboxコンテキスト解決
├── sandbox/                       # sandboxサブシステム
├── channel-tools.ts               # チャネル固有ツール注入
├── openclaw-tools.ts              # OpenClaw固有ツール
├── bash-tools.ts                  # exec/processツール
├── apply-patch.ts                 # apply_patchツール（OpenAI）
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

チャネル固有のメッセージアクションランタイムは現在、`src/agents/tools` 配下ではなく、Plugin所有の拡張ディレクトリに置かれています。たとえば次のとおりです。

- Discord Plugin のアクションランタイムファイル
- Slack Plugin のアクションランタイムファイル
- Telegram Plugin のアクションランタイムファイル
- WhatsApp Plugin のアクションランタイムファイル

## コア統合フロー

### 1. 埋め込みエージェントの実行

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

`runEmbeddedPiAgent()` から呼ばれる `runEmbeddedAttempt()` の内部では、pi SDKが使われます。

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

`subscribeEmbeddedPiSession()` はpiの `AgentSession` イベントを購読します。

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

処理対象のイベントには次が含まれます。

- `message_start` / `message_end` / `message_update`（ストリーミングテキスト/thinking）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. プロンプト実行

セットアップ後、セッションにプロンプトを送ります。

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDKは、LLMへの送信、ツール呼び出しの実行、応答のストリーミングを含む、完全なエージェントループを処理します。

画像注入はプロンプトローカルです。OpenClawは現在のプロンプトから画像参照を読み込み、
そのターンに対してのみ `images` 経由で渡します。古い履歴ターンを再走査して
画像ペイロードを再注入することはありません。

## ツールアーキテクチャ

### ツールパイプライン

1. **ベースツール**: piの `codingTools`（read, bash, edit, write）
2. **カスタム置換**: OpenClawはbashを `exec` / `process` に置き換え、sandbox向けにread/edit/writeをカスタマイズ
3. **OpenClawツール**: メッセージング、browser、canvas、sessions、cron、Gateway など
4. **チャネルツール**: Discord / Telegram / Slack / WhatsApp 固有のアクションツール
5. **ポリシーフィルタリング**: プロファイル、プロバイダー、エージェント、グループ、sandboxポリシーでツールをフィルタ
6. **スキーマ正規化**: Gemini / OpenAI の癖に合わせてスキーマを整形
7. **AbortSignalラッピング**: 中断シグナルを尊重するようにツールをラップ

### ツール定義アダプター

pi-agent-coreの `AgentTool` は、pi-coding-agentの `ToolDefinition` とは異なる `execute` シグネチャを持っています。`pi-tool-definition-adapter.ts` のアダプターがこれを橋渡しします。

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### ツール分割戦略

`splitSdkTools()` は、すべてのツールを `customTools` 経由で渡します。

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

これにより、OpenClawのポリシーフィルタリング、sandbox統合、拡張ツールセットが、各プロバイダー間で一貫したまま保たれます。

## システムプロンプト構築

システムプロンプトは `buildAgentSystemPrompt()`（`system-prompt.ts`）で構築されます。Tooling、Tool Call Style、安全ガードレール、OpenClaw CLIリファレンス、Skills、Docs、Workspace、Sandbox、Messaging、Reply Tags、Voice、Silent Replies、Heartbeats、Runtime metadata、さらに有効時のMemoryとReactions、および任意のコンテキストファイルや追加システムプロンプト内容を含むセクションを組み立てます。サブエージェント向けの最小プロンプトモードでは、各セクションはトリミングされます。

このプロンプトは、セッション作成後に `applySystemPromptOverrideToSession()` を通じて適用されます。

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## セッション管理

### セッションファイル

セッションは、ツリー構造（`id` / `parentId` のリンク）を持つJSONLファイルです。piの `SessionManager` が永続化を処理します。

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClawはこれを `guardSessionManager()` でラップし、ツール結果の安全性を確保します。

### セッションキャッシュ

`session-manager-cache.ts` は、ファイルの繰り返し解析を避けるために SessionManager インスタンスをキャッシュします。

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 履歴制限

`limitHistoryTurns()` は、チャネル種別（DM vs group）に応じて会話履歴をトリミングします。

### Compaction

自動Compactionはコンテキストあふれ時に発動します。一般的なあふれシグネチャには、
`request_too_large`、`context length exceeded`、`input exceeds the
maximum number of tokens`、`input token count exceeds the maximum number of
input tokens`、`input is too long for the model`、`ollama error: context
length exceeded` があります。手動Compactionは
`compactEmbeddedPiSessionDirect()` が処理します。

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 認証とモデル解決

### 認証プロファイル

OpenClawは、プロバイダーごとに複数のAPIキーを持てる認証プロファイルストアを維持します。

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

プロファイルは、クールダウン追跡を伴って失敗時にローテーションします。

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### モデル解決

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### フェイルオーバー

設定されている場合、`FailoverError` がモデルのフォールバックを発動します。

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

## Pi拡張

OpenClawは、特化した動作のためにカスタムpi拡張を読み込みます。

### Compactionセーフガード

`src/agents/pi-hooks/compaction-safeguard.ts` は、適応的なトークン予算設定に加え、ツール失敗やファイル操作サマリーを含むCompaction用ガードレールを追加します。

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### コンテキスト刈り込み

`src/agents/pi-hooks/context-pruning.ts` は、キャッシュTTLベースのコンテキスト刈り込みを実装します。

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

## ストリーミングとブロック返信

### ブロックチャンク化

`EmbeddedBlockChunker` は、ストリーミングテキストを離散的な返信ブロックに分割して管理します。

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking / Finalタグの除去

ストリーミング出力は、`<think>` / `<thinking>` ブロックを除去し、`<final>` 内容を抽出するために処理されます。

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### 返信ディレクティブ

`[[media:url]]`、`[[voice]]`、`[[reply:id]]` のような返信ディレクティブは、解析されて抽出されます。

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## エラー処理

### エラー分類

`pi-embedded-helpers.ts` は、適切に扱うためのエラー分類を行います。

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking Levelフォールバック

thinking level がサポートされていない場合、フォールバックします。

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

## Sandbox統合

sandboxモードが有効な場合、ツールとパスが制約されます。

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## プロバイダー固有の処理

### Anthropic

- 拒否時のマジック文字列除去
- 連続ロールに対するターン検証
- 上流Piの厳格なツールパラメーター検証

### Google/Gemini

- Plugin所有のツールスキーマサニタイズ

### OpenAI

- Codexモデル向け `apply_patch` ツール
- thinking level ダウングレード処理

## TUI統合

OpenClawには、pi-tuiコンポーネントを直接使うローカルTUIモードもあります。

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

これにより、piネイティブモードに近い対話型ターミナル体験が提供されます。

## Pi CLIとの主な違い

| 項目 | Pi CLI | OpenClaw埋め込み |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| 呼び出し | `pi` コマンド / RPC | `createAgentSession()` 経由のSDK |
| ツール | デフォルトのコーディングツール | カスタムOpenClawツールスイート |
| システムプロンプト | AGENTS.md + prompts | チャネル/コンテキストごとに動的 |
| セッション保存 | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（または `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| 認証 | 単一認証情報 | ローテーション付きマルチプロファイル |
| 拡張 | ディスクから読み込み | プログラム的 + ディスクパス |
| イベント処理 | TUIレンダリング | コールバックベース（`onBlockReply` など） |

## 今後の検討事項

再設計の可能性がある領域:

1. **ツールシグネチャの整合**: 現在は pi-agent-core と pi-coding-agent のシグネチャ差を吸収している
2. **SessionManagerラッピング**: `guardSessionManager` は安全性を加えるが複雑さも増やす
3. **拡張読み込み**: piの `ResourceLoader` をもっと直接使える可能性がある
4. **ストリーミングハンドラーの複雑さ**: `subscribeEmbeddedPiSession` が大きくなってきている
5. **プロバイダーの癖**: pi側で将来的に処理できるかもしれない、プロバイダー固有コードパスが多い

## テスト

Pi統合のカバレッジは、次のスイートにまたがります。

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

現在の実行コマンドについては、[Pi開発ワークフロー](/ja-JP/pi-dev) を参照してください。
