---
read_when:
    - キャッシュ保持によってプロンプトトークンのコストを削減したい場合
    - マルチエージェント構成では、エージェントごとのキャッシュ動作が必要です
    - Heartbeat と cache-ttl の pruning を一緒に調整しています
summary: プロンプトキャッシュの設定項目、マージ順序、Provider の動作、チューニングパターン
title: プロンプトキャッシュ
x-i18n:
    generated_at: "2026-04-25T13:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

プロンプトキャッシュとは、モデル Provider が、毎回再処理する代わりに、ターンをまたいで変更されていないプロンプト接頭辞（通常は system/developer 指示やその他の安定したコンテキスト）を再利用できることを意味します。OpenClaw は、上流 API がそれらのカウンタを直接公開している場合、Provider の使用量を `cacheRead` と `cacheWrite` に正規化します。

ステータス画面では、ライブセッションのスナップショットにキャッシュカウンタがない場合でも、直近の transcript 使用量ログからそれらを復元できるため、部分的にセッションメタデータが失われた後でも `/status` はキャッシュ行を表示し続けられます。既存の 0 以外のライブキャッシュ値は、引き続き transcript からのフォールバック値より優先されます。

これが重要な理由: トークンコストの削減、応答速度の向上、長時間セッションでのより予測可能なパフォーマンスにつながるためです。キャッシュがない場合、ほとんどの入力が変わっていなくても、繰り返されるプロンプトは毎ターン完全なプロンプトコストを支払うことになります。

以下のセクションでは、プロンプト再利用とトークンコストに影響する、すべてのキャッシュ関連設定項目を扱います。

Provider リファレンス:

- Anthropic のプロンプトキャッシュ: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI のプロンプトキャッシュ: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API ヘッダーとリクエスト ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic のリクエスト ID とエラー: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主な設定項目

### `cacheRetention`（グローバルデフォルト、モデルごと、エージェントごと）

すべてのモデルに対するグローバルデフォルトとしてキャッシュ保持を設定します。

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

モデルごとに上書きする場合:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

エージェントごとの上書き:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

設定のマージ順序:

1. `agents.defaults.params`（グローバルデフォルト — すべてのモデルに適用）
2. `agents.defaults.models["provider/model"].params`（モデルごとの上書き）
3. `agents.list[].params`（一致するエージェント ID。キーごとに上書き）

### `contextPruning.mode: "cache-ttl"`

キャッシュ TTL ウィンドウ経過後に古いツール結果コンテキストを pruning し、アイドル後のリクエストで過大な履歴が再キャッシュされないようにします。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完全な動作については、[セッション pruning](/ja-JP/concepts/session-pruning) を参照してください。

### Heartbeat の keep-warm

Heartbeat はキャッシュウィンドウを warm な状態に保ち、アイドル間隔の後に繰り返し発生するキャッシュ書き込みを減らすことができます。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

エージェントごとの Heartbeat は `agents.list[].heartbeat` でサポートされます。

## Provider の動作

### Anthropic（直接 API）

- `cacheRetention` がサポートされます。
- Anthropic の API キー認証プロファイルでは、未設定時に OpenClaw は Anthropic のモデル参照に `cacheRetention: "short"` を初期設定します。
- Anthropic ネイティブ Messages レスポンスは `cache_read_input_tokens` と `cache_creation_input_tokens` の両方を公開するため、OpenClaw は `cacheRead` と `cacheWrite` の両方を表示できます。
- ネイティブ Anthropic リクエストでは、`cacheRetention: "short"` はデフォルトの 5 分エフェメラルキャッシュにマッピングされ、`cacheRetention: "long"` は直接の `api.anthropic.com` ホストでのみ 1 時間 TTL にアップグレードされます。

### OpenAI（直接 API）

- プロンプトキャッシュは、サポートされている最近のモデルでは自動です。OpenClaw はブロック単位のキャッシュマーカーを挿入する必要はありません。
- OpenClaw はターン間でキャッシュルーティングを安定させるために `prompt_cache_key` を使い、`cacheRetention: "long"` が直接の OpenAI ホストで選択されている場合にのみ `prompt_cache_retention: "24h"` を使います。
- OpenAI 互換 Completions Provider は、モデル設定で `compat.supportsPromptCacheKey: true` が明示されている場合にのみ `prompt_cache_key` を受け取ります。`cacheRetention: "none"` は引き続きそれを抑制します。
- OpenAI のレスポンスは、`usage.prompt_tokens_details.cached_tokens`（または Responses API イベント上の `input_tokens_details.cached_tokens`）を通じてキャッシュ済みプロンプトトークンを公開します。OpenClaw はこれを `cacheRead` にマッピングします。
- OpenAI は個別のキャッシュ書き込みトークンカウンタを公開しないため、Provider がキャッシュを warm にしている場合でも、OpenAI 経路では `cacheWrite` は `0` のままです。
- OpenAI は `x-request-id`、`openai-processing-ms`、`x-ratelimit-*` のような有用なトレースおよびレート制限ヘッダーを返しますが、キャッシュヒットの計上はヘッダーではなく usage ペイロードから取得すべきです。
- 実際には、OpenAI は Anthropic 形式の移動する全履歴再利用というより、初期接頭辞キャッシュのように動作することがよくあります。現在のライブプローブでは、安定した長い接頭辞のテキストターンは `4864` キャッシュ済みトークン付近で頭打ちになることがあり、ツールが多い transcript や MCP 形式の transcript は、完全に同じ繰り返しでも `4608` キャッシュ済みトークン付近で頭打ちになることがよくあります。

### Anthropic Vertex

- Vertex AI 上の Anthropic モデル（`anthropic-vertex/*`）は、直接の Anthropic と同じ方法で `cacheRetention` をサポートします。
- `cacheRetention: "long"` は、Vertex AI エンドポイント上の実際の 1 時間プロンプトキャッシュ TTL にマッピングされます。
- `anthropic-vertex` のデフォルトキャッシュ保持は、直接の Anthropic のデフォルトと一致します。
- Vertex リクエストは、キャッシュ再利用が Provider に実際に届く内容と揃うよう、境界認識型のキャッシュシェーピングを通してルーティングされます。

### Amazon Bedrock

- Anthropic Claude モデル参照（`amazon-bedrock/*anthropic.claude*`）は、明示的な `cacheRetention` のパススルーをサポートします。
- Anthropic 以外の Bedrock モデルは、実行時に `cacheRetention: "none"` に強制されます。

### OpenRouter モデル

`openrouter/anthropic/*` のモデル参照について、OpenClaw は、リクエストがまだ検証済みの OpenRouter ルート（デフォルトエンドポイント上の `openrouter`、または `openrouter.ai` に解決される任意の provider/base URL）を対象としている場合にのみ、プロンプトキャッシュ再利用を改善するため、system/developer プロンプトブロックに Anthropic の `cache_control` を注入します。

`openrouter/deepseek/*`、`openrouter/moonshot*/*`、`openrouter/zai/*` のモデル参照では、OpenRouter が Provider 側のプロンプトキャッシュを自動処理するため、`contextPruning.mode: "cache-ttl"` が許可されます。OpenClaw はそれらのリクエストに Anthropic の `cache_control` マーカーを注入しません。

DeepSeek のキャッシュ構築はベストエフォートで、数秒かかることがあります。直後のフォローアップではまだ `cached_tokens: 0` と表示される場合があります。短い遅延の後に同じ接頭辞のリクエストを繰り返して確認し、キャッシュヒットのシグナルとして `usage.prompt_tokens_details.cached_tokens` を使ってください。

モデルを任意の OpenAI 互換プロキシ URL に向け直した場合、OpenClaw はそれらの OpenRouter 固有の Anthropic キャッシュマーカーの注入を停止します。

### その他の Provider

Provider がこのキャッシュモードをサポートしていない場合、`cacheRetention` は効果を持ちません。

### Google Gemini 直接 API

- 直接の Gemini トランスポート（`api: "google-generative-ai"`）は、上流の `cachedContentTokenCount` を通じてキャッシュヒットを報告し、OpenClaw はそれを `cacheRead` にマッピングします。
- 直接の Gemini モデルに `cacheRetention` が設定されている場合、OpenClaw は Google AI Studio 実行で、system プロンプト用の `cachedContents` リソースを自動的に作成、再利用、更新します。これにより、キャッシュ済みコンテンツハンドルを手動で事前作成する必要がなくなります。
- 既存の Gemini キャッシュ済みコンテンツハンドルを、設定済みモデルの `params.cachedContent`（またはレガシーの `params.cached_content`）として引き続き渡すこともできます。
- これは Anthropic/OpenAI のプロンプト接頭辞キャッシュとは別物です。Gemini では、OpenClaw はリクエストにキャッシュマーカーを注入する代わりに、Provider ネイティブの `cachedContents` リソースを管理します。

### Gemini CLI JSON 使用量

- Gemini CLI の JSON 出力でも、`stats.cached` を通じてキャッシュヒットが表れることがあり、OpenClaw はそれを `cacheRead` にマッピングします。
- CLI が直接の `stats.input` 値を省略した場合、OpenClaw は `stats.input_tokens - stats.cached` から入力トークンを導出します。
- これは使用量の正規化にすぎません。OpenClaw が Gemini CLI に対して Anthropic/OpenAI 形式のプロンプトキャッシュマーカーを作成していることを意味するわけではありません。

## system プロンプトのキャッシュ境界

OpenClaw は system プロンプトを、内部のキャッシュ接頭辞境界で区切られた **安定した接頭辞** と **変動する接尾辞** に分割します。境界より上のコンテンツ（ツール定義、Skills メタデータ、ワークスペースファイル、その他の比較的静的なコンテキスト）は、ターン間でバイト列が同一のままになるように順序付けされます。境界より下のコンテンツ（たとえば `HEARTBEAT.md`、ランタイムタイムスタンプ、その他のターンごとのメタデータ）は、キャッシュ済み接頭辞を無効化せずに変更できます。

主な設計上の選択:

- 安定したワークスペースのプロジェクトコンテキストファイルは `HEARTBEAT.md` より前に順序付けされるため、Heartbeat の変動によって安定した接頭辞が壊れません。
- この境界は Anthropic 系、OpenAI 系、Google、および CLI トランスポートシェーピング全体に適用されるため、サポートされているすべての Provider が同じ接頭辞安定性の恩恵を受けます。
- Codex Responses と Anthropic Vertex リクエストは、キャッシュ再利用が Provider に実際に届く内容と揃うよう、境界認識型キャッシュシェーピングを通じてルーティングされます。
- system プロンプトのフィンガープリントは正規化されます（空白、改行、フックで追加されたコンテキスト、ランタイム機能の順序など）。これにより、意味的に変化していないプロンプトはターンをまたいで KV/キャッシュを共有できます。

設定やワークスペースの変更後に予期しない `cacheWrite` の急増が見られる場合は、その変更がキャッシュ境界の上と下のどちらに入るかを確認してください。変動するコンテンツを境界の下に移す（または安定化する）ことで、問題が解決することがよくあります。

## OpenClaw のキャッシュ安定性ガード

OpenClaw は、リクエストが Provider に到達する前に、いくつかのキャッシュ感度の高いペイロード形状も決定的に保ちます。

- Bundle MCP ツールカタログは、ツール登録前に決定的にソートされるため、`listTools()` の順序変更によって tools ブロックが変動し、プロンプトキャッシュ接頭辞が壊れることを防ぎます。
- 永続化された画像ブロックを持つレガシーセッションでは、**直近 3 件の完了ターン** をそのまま保持します。より古く、すでに処理済みの画像ブロックはマーカーに置き換えられる場合があるため、画像の多いフォローアップで古い大きなペイロードが再送され続けません。

## チューニングパターン

### 混在トラフィック（推奨デフォルト）

メインエージェントには長寿命のベースラインを維持し、バースト的な notifier エージェントではキャッシュを無効にします。

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### コスト優先のベースライン

- ベースラインを `cacheRetention: "short"` に設定します。
- `contextPruning.mode: "cache-ttl"` を有効にします。
- warm キャッシュの恩恵を受けるエージェントに対してのみ、TTL 未満の Heartbeat を維持します。

## キャッシュ診断

OpenClaw は、埋め込みエージェント実行向けに専用のキャッシュトレース診断を公開しています。

通常のユーザー向け診断では、ライブセッションエントリにそれらのカウンタがない場合、`/status` やその他の使用量サマリーは、`cacheRead` / `cacheWrite` のフォールバックソースとして最新の transcript 使用量エントリを使えます。

## ライブ回帰テスト

OpenClaw は、繰り返し接頭辞、ツールターン、画像ターン、MCP 形式ツール transcript、Anthropic の no-cache コントロールに対して、1 つの統合ライブキャッシュ回帰ゲートを維持しています。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

絞り込んだライブゲートを実行するには:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ベースラインファイルには、直近に観測されたライブ値と、テストで使用される Provider 固有の回帰下限が保存されます。
ランナーは、以前のキャッシュ状態が現在の回帰サンプルを汚染しないよう、実行ごとに新しいセッション ID とプロンプト名前空間も使用します。

これらのテストでは、Provider 間で意図的に同一の成功基準を使用していません。

### Anthropic のライブ期待値

- `cacheWrite` を通じた明示的な warmup 書き込みを期待します。
- Anthropic の cache control が会話を通じてキャッシュ境界点を前進させるため、繰り返しターンではほぼ全履歴の再利用を期待します。
- 現在のライブアサーションでも、安定、ツール、画像の各経路に対して高いヒット率のしきい値を使用しています。

### OpenAI のライブ期待値

- `cacheRead` のみを期待します。`cacheWrite` は `0` のままです。
- 繰り返しターンでのキャッシュ再利用は、Anthropic 形式の移動する全履歴再利用ではなく、Provider 固有の頭打ち値として扱います。
- 現在のライブアサーションでは、`gpt-5.4-mini` で観測されたライブ動作から導いた保守的な下限チェックを使用しています。
  - 安定した接頭辞: `cacheRead >= 4608`、ヒット率 `>= 0.90`
  - ツール transcript: `cacheRead >= 4096`、ヒット率 `>= 0.85`
  - 画像 transcript: `cacheRead >= 3840`、ヒット率 `>= 0.82`
  - MCP 形式 transcript: `cacheRead >= 4096`、ヒット率 `>= 0.85`

2026-04-04 時点での最新の統合ライブ検証結果:

- 安定した接頭辞: `cacheRead=4864`、ヒット率 `0.966`
- ツール transcript: `cacheRead=4608`、ヒット率 `0.896`
- 画像 transcript: `cacheRead=4864`、ヒット率 `0.954`
- MCP 形式 transcript: `cacheRead=4608`、ヒット率 `0.891`

統合ゲートの最近のローカル実行時間は約 `88s` でした。

アサーションが異なる理由:

- Anthropic は明示的なキャッシュ境界点と、移動する会話履歴の再利用を公開しています。
- OpenAI のプロンプトキャッシュも引き続き正確な接頭辞に敏感ですが、ライブ Responses トラフィックで実際に再利用可能な接頭辞は、完全なプロンプトより早い段階で頭打ちになることがあります。
- そのため、Anthropic と OpenAI を単一の Provider 横断パーセンテージしきい値で比較すると、誤った回帰検出が発生します。

### `diagnostics.cacheTrace` 設定

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

デフォルト:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### 環境変数トグル（一時的なデバッグ）

- `OPENCLAW_CACHE_TRACE=1` でキャッシュトレースを有効化します。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` で出力パスを上書きします。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` で完全なメッセージペイロード取得を切り替えます。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` でプロンプトテキスト取得を切り替えます。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` で system プロンプト取得を切り替えます。

### 確認すべき内容

- キャッシュトレースイベントは JSONL で、`session:loaded`、`prompt:before`、`stream:context`、`session:after` などの段階的スナップショットを含みます。
- ターンごとのキャッシュトークン影響は、通常の使用量画面で `cacheRead` と `cacheWrite` を通じて確認できます（例: `/usage full` やセッション使用量サマリー）。
- Anthropic では、キャッシュが有効なとき `cacheRead` と `cacheWrite` の両方が見えることを期待してください。
- OpenAI では、キャッシュヒット時に `cacheRead` が見え、`cacheWrite` は `0` のままであることを期待してください。OpenAI は個別のキャッシュ書き込みトークン項目を公開していません。
- リクエストトレースが必要な場合は、リクエスト ID とレート制限ヘッダーをキャッシュメトリクスとは別に記録してください。現在の OpenClaw のキャッシュトレース出力は、生の Provider レスポンスヘッダーではなく、プロンプト/セッション形状と正規化済みトークン使用量に焦点を当てています。

## クイックトラブルシューティング

- 多くのターンで `cacheWrite` が高い: 変動する system プロンプト入力を確認し、モデル/Provider がキャッシュ設定をサポートしていることを検証してください。
- Anthropic で `cacheWrite` が高い: 多くの場合、キャッシュ境界点がリクエストごとに変化するコンテンツに当たっていることを意味します。
- OpenAI で `cacheRead` が低い: 安定した接頭辞が先頭にあること、繰り返される接頭辞が少なくとも 1024 トークンあること、キャッシュを共有すべきターンで同じ `prompt_cache_key` が再利用されていることを確認してください。
- `cacheRetention` の効果がない: モデルキーが `agents.defaults.models["provider/model"]` と一致していることを確認してください。
- キャッシュ設定付きの Bedrock Nova/Mistral リクエスト: 実行時に `none` へ強制されるのは想定どおりです。

関連ドキュメント:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [セッション pruning](/ja-JP/concepts/session-pruning)
- [Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference)

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
