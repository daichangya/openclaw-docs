---
read_when:
    - OpenClawにおけるPi SDK統合設計の理解
    - Piのエージェントセッションライフサイクル、ツール、またはプロバイダー接続の変更
summary: OpenClawの組み込みPiエージェント統合のアーキテクチャとセッションライフサイクル
title: Pi統合アーキテクチャ
x-i18n:
    generated_at: "2026-04-24T15:21:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

このドキュメントでは、OpenClawがAIエージェント機能を実現するために、[pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) とその関連パッケージ（`pi-ai`、`pi-agent-core`、`pi-tui`）をどのように統合しているかを説明します。

## 概要

OpenClawは、メッセージングGatewayアーキテクチャにAIコーディングエージェントを組み込むためにpi SDKを使用します。piをサブプロセスとして起動したり、RPCモードを使ったりする代わりに、OpenClawは `createAgentSession()` を通じてpiの `AgentSession` を直接インポートしてインスタンス化します。この組み込みアプローチにより、以下が可能になります。

- セッションライフサイクルとイベント処理の完全な制御
- カスタムツールの注入（メッセージング、sandbox、チャネル固有のアクション）
- チャネルやコンテキストごとのシステムプロンプトのカスタマイズ
- ブランチ分岐/Compaction対応のセッション永続化
- フェイルオーバー付きのマルチアカウント認証プロファイルローテーション
- プロバイダー非依存のモデル切り替え

## パッケージ依存関係

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| パッケージ        | 目的                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | コアLLM抽象化: `Model`、`streamSimple`、メッセージ型、プロバイダーAPI                                 |
| `pi-agent-core`   | エージェントループ、ツール実行、`AgentMessage` 型                                                      |
| `pi-coding-agent` | 高水準SDK: `createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、組み込みツール     |
| `pi-tui`          | ターミナルUIコンポーネント（OpenClawのローカルTUIモードで使用）                                       |

## ファイル構造

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ から再エクスポート
├── pi-embedded-runner/
│   ├── run.ts                     # メインエントリ: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # セッション設定を含む単一試行ロジック
│   │   ├── params.ts              # RunEmbeddedPiAgentParams 型
│   │   ├── payloads.ts            # 実行結果からレスポンスペイロードを構築
│   │   ├── images.ts              # Visionモデル向け画像注入
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # 中断エラー検出
│   ├── cache-ttl.ts               # コンテキスト枝刈り用のキャッシュTTL追跡
│   ├── compact.ts                 # 手動/自動Compactionロジック
│   ├── extensions.ts              # 組み込み実行向けpi拡張の読み込み
│   ├── extra-params.ts            # プロバイダー固有のストリームパラメーター
│   ├── google.ts                  # Google/Geminiのターン順序修正
│   ├── history.ts                 # 履歴制限（DM対グループ）
│   ├── lanes.ts                   # セッション/グローバルコマンドレーン
│   ├── logger.ts                  # サブシステムロガー
│   ├── model.ts                   # ModelRegistry経由のモデル解決
│   ├── runs.ts                    # アクティブな実行の追跡、中断、キュー
│   ├── sandbox-info.ts            # システムプロンプト用sandbox情報
│   ├── session-manager-cache.ts   # SessionManagerインスタンスのキャッシュ
│   ├── session-manager-init.ts    # セッションファイル初期化
│   ├── system-prompt.ts           # システムプロンプトビルダー
│   ├── tool-split.ts              # ツールを builtIn と custom に分割
│   ├── types.ts                   # EmbeddedPiAgentMeta、EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevelマッピング、エラー説明
├── pi-embedded-subscribe.ts       # セッションイベントの購読/ディスパッチ
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # イベントハンドラーファクトリー
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # ストリーミングブロック返信のチャンク化
├── pi-embedded-messaging.ts       # メッセージングツールの送信追跡
├── pi-embedded-helpers.ts         # エラー分類、ターン検証
├── pi-embedded-helpers/           # ヘルパーモジュール
├── pi-embedded-utils.ts           # フォーマットユーティリティ
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # ツール向けAbortSignalラッピング
├── pi-tools.policy.ts             # ツール許可/拒否ポリシー
├── pi-tools.read.ts               # readツールのカスタマイズ
├── pi-tools.schema.ts             # ツールスキーマ正規化
├── pi-tools.types.ts              # AnyAgentTool 型エイリアス
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition アダプター
├── pi-settings.ts                 # 設定オーバーライド
├── pi-hooks/                      # カスタムpiフック
│   ├── compaction-safeguard.ts    # セーフガード拡張
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # キャッシュTTLコンテキスト枝刈り拡張
│   └── context-pruning/
├── model-auth.ts                  # 認証プロファイル解決
├── auth-profiles.ts               # プロファイルストア、クールダウン、フェイルオーバー
├── model-selection.ts             # デフォルトモデル解決
├── models-config.ts               # models.json生成
├── model-catalog.ts               # モデルカタログキャッシュ
├── context-window-guard.ts        # コンテキストウィンドウ検証
├── failover-error.ts              # FailoverError クラス
├── defaults.ts                    # DEFAULT_PROVIDER、DEFAULT_MODEL
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

チャネル固有のメッセージアクションランタイムは、現在では `src/agents/tools` 配下ではなく、Plugin所有の拡張ディレクトリ配下に配置されています。たとえば次のようなものです。

- Discord Pluginアクションランタイムファイル
- Slack Pluginアクションランタイムファイル
- Telegram Pluginアクションランタイムファイル
- WhatsApp Pluginアクションランタイムファイル

## コア統合フロー

### 1. 組み込みエージェントの実行

メインのエントリポイントは、`pi-embedded-runner/run.ts` 内の `runEmbeddedPiAgent()` です。

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

`runEmbeddedAttempt()`（`runEmbeddedPiAgent()` から呼び出される）の内部では、pi SDKが使用されます。

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

`subscribeEmbeddedPiSession()` は、piの `AgentSession` イベントを購読します。

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

処理されるイベントには次のものがあります。

- `message_start` / `message_end` / `message_update`（ストリーミングテキスト/思考）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. プロンプト送信

セットアップ後、セッションにプロンプトが送られます。

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDKが完全なエージェントループを処理します。つまり、LLMへの送信、ツール呼び出しの実行、レスポンスのストリーミングを担当します。

画像注入はプロンプトローカルです。OpenClawは現在のプロンプトから画像参照を読み込み、そのターンに対してのみ `images` 経由で渡します。過去の履歴ターンを再スキャンして画像ペイロードを再注入することはありません。

## ツールアーキテクチャ

### ツールパイプライン

1. **ベースツール**: piの `codingTools`（read、bash、edit、write）
2. **カスタム置き換え**: OpenClawはbashを `exec`/`process` で置き換え、sandbox向けにread/edit/writeをカスタマイズ
3. **OpenClawツール**: メッセージング、ブラウザー、canvas、セッション、Cron、Gatewayなど
4. **チャネルツール**: Discord/Telegram/Slack/WhatsApp固有のアクションツール
5. **ポリシーフィルタリング**: プロファイル、プロバイダー、エージェント、グループ、sandboxポリシーによってツールをフィルタリング
6. **スキーマ正規化**: Gemini/OpenAI特有の癖に合わせてスキーマを整形
7. **AbortSignalラッピング**: ツールをラップして中断シグナルを尊重するようにする

### ツール定義アダプター

pi-agent-coreの `AgentTool` は、pi-coding-agentの `ToolDefinition` とは異なる `execute` シグネチャを持っています。`pi-tool-definition-adapter.ts` 内のアダプターがこれを橋渡しします。

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

`splitSdkTools()` は、すべてのツールを `customTools` 経由で渡します。

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // 空。すべてオーバーライドする
    customTools: toToolDefinitions(options.tools),
  };
}
```

これにより、OpenClawのポリシーフィルタリング、sandbox統合、拡張ツールセットが、プロバイダー間で一貫した状態に保たれます。

## システムプロンプト構築

システムプロンプトは、`buildAgentSystemPrompt()`（`system-prompt.ts`）で構築されます。Tooling、Tool Call Style、安全ガードレール、OpenClaw CLIリファレンス、Skills、Docs、Workspace、Sandbox、Messaging、Reply Tags、Voice、Silent Replies、Heartbeats、ランタイムメタデータに加え、有効な場合はMemoryとReactions、さらに任意のコンテキストファイルや追加のシステムプロンプト内容を含む各セクションを組み立てます。サブエージェントで使用される最小プロンプトモードでは、セクションはトリミングされます。

プロンプトは、セッション作成後に `applySystemPromptOverrideToSession()` を通じて適用されます。

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## セッション管理

### セッションファイル

セッションは、ツリー構造（`id`/`parentId` のリンク）を持つJSONLファイルです。piの `SessionManager` が永続化を処理します。

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClawはこれを `guardSessionManager()` でラップし、ツール結果の安全性を確保します。

### セッションキャッシュ

`session-manager-cache.ts` は、ファイルの再解析を避けるためにSessionManagerインスタンスをキャッシュします。

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 履歴制限

`limitHistoryTurns()` は、チャネル種別（DMまたはグループ）に基づいて会話履歴をトリミングします。

### Compaction

自動Compactionは、コンテキストオーバーフロー時にトリガーされます。よくあるオーバーフローシグネチャには、`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded` などがあります。`compactEmbeddedPiSessionDirect()` は手動Compactionを処理します。

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 認証とモデル解決

### 認証プロファイル

OpenClawは、プロバイダーごとに複数のAPIキーを持つ認証プロファイルストアを維持します。

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

プロファイルは、クールダウン追跡付きで障害時にローテーションされます。

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

// piの ModelRegistry と AuthStorage を使用
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### フェイルオーバー

設定されている場合、`FailoverError` はモデルのフォールバックをトリガーします。

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

OpenClawは、特殊な動作のためにカスタムPi拡張を読み込みます。

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` は、適応的なトークン予算編成に加え、ツール障害およびファイル操作の要約を含むガードレールをCompactionに追加します。

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### コンテキスト枝刈り

`src/agents/pi-hooks/context-pruning.ts` は、キャッシュTTLベースのコンテキスト枝刈りを実装します。

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

`EmbeddedBlockChunker` は、ストリーミングテキストを個別の返信ブロックに分割して管理します。

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### 思考/最終タグの除去

ストリーミング出力は、`<think>`/`<thinking>` ブロックを除去し、`<final>` の内容を抽出するために処理されます。

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> の内容を除去
  // enforceFinalTag の場合は、<final>...</final> の内容のみ返す
};
```

### 返信ディレクティブ

`[[media:url]]`、`[[voice]]`、`[[reply:id]]` のような返信ディレクティブは解析され、抽出されます。

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## エラーハンドリング

### エラー分類

`pi-embedded-helpers.ts` は、適切に処理するためにエラーを分類します。

```typescript
isContextOverflowError(errorText)     // コンテキストが大きすぎる
isCompactionFailureError(errorText)   // Compactionに失敗した
isAuthAssistantError(lastAssistant)   // 認証失敗
isRateLimitAssistantError(...)        // レート制限
isFailoverAssistantError(...)         // フェイルオーバーすべき
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking Levelフォールバック

Thinking Levelがサポートされていない場合は、フォールバックします。

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

## sandbox統合

sandboxモードが有効な場合、ツールとパスは制約されます。

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // sandbox化された read/edit/write ツールを使用
  // Exec はコンテナー内で実行
  // Browser はブリッジURLを使用
}
```

## プロバイダー固有の処理

### Anthropic

- 拒否マジック文字列の除去
- 連続するロールに対するターン検証
- 厳格なアップストリームPiツールパラメーター検証

### Google/Gemini

- Plugin所有のツールスキーマサニタイズ

### OpenAI

- Codexモデル向け `apply_patch` ツール
- Thinking Levelダウングレード処理

## TUI統合

OpenClawには、pi-tuiコンポーネントを直接使用するローカルTUIモードもあります。

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

これにより、piのネイティブモードに似た対話型ターミナル体験が提供されます。

## Pi CLIとの主な違い

| 項目            | Pi CLI                  | OpenClaw Embedded                                                                                 |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| 呼び出し        | `pi` コマンド / RPC     | `createAgentSession()` 経由のSDK                                                                  |
| ツール          | デフォルトのコーディングツール | カスタムOpenClawツールスイート                                                                    |
| システムプロンプト | AGENTS.md + プロンプト   | チャネル/コンテキストごとに動的                                                                   |
| セッション保存  | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（または `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| 認証            | 単一の資格情報          | ローテーション付きマルチプロファイル                                                               |
| 拡張            | ディスクから読み込み     | プログラム的指定 + ディスクパス                                                                    |
| イベント処理    | TUIレンダリング          | コールバックベース（`onBlockReply` など）                                                          |

## 今後の検討事項

再設計の候補となる領域は次のとおりです。

1. **ツールシグネチャの整合**: 現在はpi-agent-coreとpi-coding-agentのシグネチャ間を適応している
2. **SessionManagerラッピング**: `guardSessionManager` は安全性を追加するが、複雑さも増す
3. **拡張読み込み**: piの `ResourceLoader` をより直接的に使用できる可能性がある
4. **ストリーミングハンドラーの複雑さ**: `subscribeEmbeddedPiSession` が大きくなってきている
5. **プロバイダー固有の癖**: pi側で処理できる可能性のあるプロバイダー固有コードパスが多い

## テスト

Pi統合のカバレッジは、以下のスイートにまたがっています。

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

現在の実行コマンドについては、[Pi Development Workflow](/ja-JP/pi-dev) を参照してください。

## 関連

- [Pi development workflow](/ja-JP/pi-dev)
- [Install overview](/ja-JP/install)
