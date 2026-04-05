---
read_when:
    - OpenClawにおけるPi SDK統合設計を理解したい
    - Pi向けのagent sessionライフサイクル、tooling、またはprovider配線を変更している
summary: OpenClawの埋め込みPi agent統合とsessionライフサイクルのアーキテクチャ
title: Pi統合アーキテクチャ
x-i18n:
    generated_at: "2026-04-05T12:50:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 596de5fbb1430008698079f211db200e02ca8485547550fd81571a459c4c83c7
    source_path: pi.md
    workflow: 15
---

# Pi統合アーキテクチャ

このドキュメントでは、OpenClawが [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) とその兄弟パッケージ（`pi-ai`、`pi-agent-core`、`pi-tui`）をどのように統合してAI agent機能を実現しているかを説明します。

## 概要

OpenClawは、メッセージングGatewayアーキテクチャ内にAI coding agentを埋め込むためにpi SDKを使用します。piをsubprocessとして起動したりRPC modeを使ったりする代わりに、OpenClawは `createAgentSession()` を介してpiの `AgentSession` を直接importしてインスタンス化します。この埋め込み方式には次の利点があります。

- sessionライフサイクルとevent handlingを完全に制御できる
- カスタムtool注入（messaging、sandbox、channel固有action）
- channel/contextごとのsystem promptカスタマイズ
- branching/compactionを備えたsession永続化
- failover付きのmulti-account auth profile rotation
- providerに依存しないmodel切り替え

## パッケージ依存関係

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Package           | 用途                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `pi-ai`           | コアLLM抽象化: `Model`、`streamSimple`、message型、provider API                            |
| `pi-agent-core`   | agent loop、tool execution、`AgentMessage` 型                                             |
| `pi-coding-agent` | 高レベルSDK: `createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、組み込みtools |
| `pi-tui`          | ターミナルUIコンポーネント（OpenClawのローカルTUI modeで使用）                              |

## ファイル構成

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ から再エクスポート
├── pi-embedded-runner/
│   ├── run.ts                     # メインエントリー: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # sessionセットアップ付き単一attemptロジック
│   │   ├── params.ts              # RunEmbeddedPiAgentParams 型
│   │   ├── payloads.ts            # 実行結果からresponse payloadを構築
│   │   ├── images.ts              # vision model image注入
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # abort error検出
│   ├── cache-ttl.ts               # context pruning用のcache TTL追跡
│   ├── compact.ts                 # 手動/自動compactionロジック
│   ├── extensions.ts              # 埋め込み実行向けpi extension読み込み
│   ├── extra-params.ts            # provider固有stream params
│   ├── google.ts                  # Google/Geminiのturn順序修正
│   ├── history.ts                 # 履歴制限（DM対group）
│   ├── lanes.ts                   # session/グローバルcommandレーン
│   ├── logger.ts                  # サブシステムlogger
│   ├── model.ts                   # ModelRegistry経由のmodel解決
│   ├── runs.ts                    # アクティブ実行追跡、abort、queue
│   ├── sandbox-info.ts            # system prompt用sandbox情報
│   ├── session-manager-cache.ts   # SessionManagerインスタンスキャッシュ
│   ├── session-manager-init.ts    # sessionファイル初期化
│   ├── system-prompt.ts           # system prompt builder
│   ├── tool-split.ts              # toolsをbuiltInとcustomに分割
│   ├── types.ts                   # EmbeddedPiAgentMeta、EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevelマッピング、error説明
├── pi-embedded-subscribe.ts       # session event購読/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # event handler factory
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # streaming block reply chunking
├── pi-embedded-messaging.ts       # Messaging tool送信追跡
├── pi-embedded-helpers.ts         # error分類、turn検証
├── pi-embedded-helpers/           # helperモジュール
├── pi-embedded-utils.ts           # フォーマットutility
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # tool向けAbortSignalラップ
├── pi-tools.policy.ts             # tool allowlist/denylistポリシー
├── pi-tools.read.ts               # Read toolカスタマイズ
├── pi-tools.schema.ts             # tool schema正規化
├── pi-tools.types.ts              # AnyAgentTool 型alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adapter
├── pi-settings.ts                 # Settings override
├── pi-hooks/                      # カスタムpi hook
│   ├── compaction-safeguard.ts    # safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # auth profile解決
├── auth-profiles.ts               # profileストア、cooldown、failover
├── model-selection.ts             # デフォルトmodel解決
├── models-config.ts               # models.json生成
├── model-catalog.ts               # model catalogキャッシュ
├── context-window-guard.ts        # context window検証
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER、DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # system prompt parameter解決
├── system-prompt-report.ts        # デバッグレポート生成
├── tool-summaries.ts              # tool説明サマリー
├── tool-policy.ts                 # toolポリシー解決
├── transcript-policy.ts           # transcript検証ポリシー
├── skills.ts                      # skill snapshot/prompt構築
├── skills/                        # skillサブシステム
├── sandbox.ts                     # sandbox context解決
├── sandbox/                       # sandboxサブシステム
├── channel-tools.ts               # channel固有tool注入
├── openclaw-tools.ts              # OpenClaw固有tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool (OpenAI)
├── tools/                         # 個別tool実装
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

channel固有のmessage action runtimeは、現在 `src/agents/tools` 配下ではなくplugin所有のextension directoryにあります。たとえば次のものです。

- Discord plugin action runtimeファイル
- Slack plugin action runtimeファイル
- Telegram plugin action runtimeファイル
- WhatsApp plugin action runtimeファイル

## コア統合フロー

### 1. 埋め込みagentの実行

メインエントリーは `pi-embedded-runner/run.ts` 内の `runEmbeddedPiAgent()` です。

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

### 2. Session作成

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

### 3. Event購読

`subscribeEmbeddedPiSession()` はpiの `AgentSession` eventを購読します。

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

処理されるeventには次のものがあります。

- `message_start` / `message_end` / `message_update`（streaming text/thinking）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Prompting

セットアップ後、sessionへpromptが送られます。

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDKが完全なagent loopを処理します。LLMへの送信、tool callの実行、responseのstreamingも含まれます。

image注入はpromptローカルです。OpenClawは現在のpromptからimage refを読み込み、そのturnだけ `images` 経由で渡します。古いhistory turnを再走査してimage payloadを再注入することはありません。

## Toolアーキテクチャ

### Toolパイプライン

1. **Base Tools**: piの `codingTools`（read、bash、edit、write）
2. **Custom Replacements**: OpenClawがbashを `exec`/`process` に置き換え、read/edit/writeをsandbox向けにカスタマイズ
3. **OpenClaw Tools**: messaging、browser、canvas、sessions、cron、gatewayなど
4. **Channel Tools**: Discord/Telegram/Slack/WhatsApp固有action tool
5. **Policy Filtering**: profile、provider、agent、group、sandbox policyでtoolsをフィルタリング
6. **Schema Normalization**: Gemini/OpenAIの癖に合わせてschemaを整形
7. **AbortSignal Wrapping**: abort signalを尊重するようtoolをラップ

### Tool Definition Adapter

pi-agent-coreの `AgentTool` は、pi-coding-agentの `ToolDefinition` と `execute` シグネチャが異なります。`pi-tool-definition-adapter.ts` のadapterがこれを橋渡しします。

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agentのシグネチャはpi-agent-coreと異なる
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Tool Split戦略

`splitSdkTools()` はすべてのtoolを `customTools` 経由で渡します。

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // 空。すべて上書きする
    customTools: toToolDefinitions(options.tools),
  };
}
```

これにより、OpenClawのpolicy filtering、sandbox統合、拡張toolsetがproviderをまたいで一貫したものになります。

## System Prompt構築

system promptは `buildAgentSystemPrompt()`（`system-prompt.ts`）で構築されます。Tooling、Tool Call Style、Safety guardrail、OpenClaw CLI reference、Skills、Docs、Workspace、Sandbox、Messaging、Reply Tags、Voice、Silent Replies、Heartbeats、Runtime metadata、さらに有効時にはMemoryとReactions、任意のcontext fileと追加system prompt contentを含む完全なpromptを組み立てます。sectionはsubagentで使われるminimal prompt mode向けに削減されます。

promptはsession作成後に `applySystemPromptOverrideToSession()` を介して適用されます。

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Session管理

### Sessionファイル

sessionはtree構造（id/parentIdリンク）を持つJSONLファイルです。piの `SessionManager` が永続化を処理します。

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClawはこれを `guardSessionManager()` でラップし、tool resultの安全性を高めています。

### Sessionキャッシュ

`session-manager-cache.ts` は、ファイルの再解析を避けるためにSessionManagerインスタンスをキャッシュします。

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 履歴制限

`limitHistoryTurns()` は、channel種別（DM対group）に応じて会話履歴を切り詰めます。

### Compaction

auto-compactionはcontext overflow時に発動します。一般的なoverflowシグネチャには
`request_too_large`、`context length exceeded`、`input exceeds the
maximum number of tokens`、`input token count exceeds the maximum number of
input tokens`、`input is too long for the model`、`ollama error: context
length exceeded` があります。`compactEmbeddedPiSessionDirect()` が手動
compactionを処理します。

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 認証とModel解決

### Auth Profile

OpenClawは、providerごとに複数のAPI keyを持つauth profileストアを維持します。

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

profileはcooldown追跡付きで失敗時にrotationされます。

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Model解決

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// piのModelRegistryとAuthStorageを使用
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` は、設定されている場合にmodel fallbackを発動します。

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

OpenClawは、特化した動作のためにカスタムpi extensionを読み込みます。

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` は、adaptive token budgetingとtool failureおよびfile operation summaryを含むcompaction guardrailを追加します。

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` は、cache-TTLベースのcontext pruningを実装します。

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

## StreamingとBlock Reply

### Block Chunking

`EmbeddedBlockChunker` は、streaming textを個別のreply blockへまとめる処理を行います。

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final tag除去

streaming出力は、`<think>`/`<thinking>` blockを除去し、`<final>` contentを抽出するよう処理されます。

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> contentを除去
  // enforceFinalTagが有効なら <final>...</final> contentのみ返す
};
```

### Reply Directive

`[[media:url]]`、`[[voice]]`、`[[reply:id]]` などのreply directiveは解析され、抽出されます。

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Error Handling

### Error分類

`pi-embedded-helpers.ts` は、適切に処理するためにerrorを分類します。

```typescript
isContextOverflowError(errorText)     // Contextが大きすぎる
isCompactionFailureError(errorText)   // Compaction失敗
isAuthAssistantError(lastAssistant)   // Auth失敗
isRateLimitAssistantError(...)        // レート制限
isFailoverAssistantError(...)         // failoverすべき
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking Level fallback

thinking levelが未対応の場合はfallbackします。

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

sandbox modeが有効なときは、toolとpathが制約されます。

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // sandbox化されたread/edit/write toolを使う
  // Execはcontainer内で実行
  // Browserはbridge URLを使う
}
```

## Provider固有の処理

### Anthropic

- refusal magic stringの除去
- 連続role向けturn検証
- Claude Code parameter互換性

### Google/Gemini

- plugin所有のtool schema sanitization

### OpenAI

- Codex model向け `apply_patch` tool
- thinking level downgrade処理

## TUI統合

OpenClawには、pi-tuiコンポーネントを直接使うローカルTUI modeもあります。

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

これにより、piネイティブmodeに近い対話型ターミナル体験が提供されます。

## Pi CLIとの主な違い

| Aspect          | Pi CLI                  | OpenClaw Embedded                                                                                  |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Invocation      | `pi` command / RPC      | `createAgentSession()` 経由のSDK                                                                   |
| Tools           | デフォルトcoding tools  | カスタムOpenClaw toolスイート                                                                       |
| System prompt   | AGENTS.md + prompts     | channel/contextごとに動的                                                                           |
| Session storage | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（または `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| Auth            | 単一資格情報            | rotation付きmulti-profile                                                                           |
| Extensions      | ディスクから読み込み     | プログラム的指定 + ディスクpath                                                                     |
| Event handling  | TUI描画                 | callbackベース（onBlockReplyなど）                                                                  |

## 今後の検討事項

将来的に再設計の可能性がある領域:

1. **Toolシグネチャ整合**: 現在はpi-agent-coreとpi-coding-agentのシグネチャをadapterで橋渡ししている
2. **Session managerラップ**: `guardSessionManager` は安全性を追加する一方で複雑さも増している
3. **Extension読み込み**: piの `ResourceLoader` をより直接使える可能性がある
4. **Streaming handlerの複雑化**: `subscribeEmbeddedPiSession` が大きくなってきている
5. **Providerの癖**: 多くのprovider固有コードパスがあり、pi側で処理できる可能性がある

## テスト

Pi統合のカバレッジは次のsuiteにまたがっています。

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

ライブ/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts`（`OPENCLAW_LIVE_TEST=1` を有効化）

現在の実行commandについては [Pi Development Workflow](/pi-dev) を参照してください。
