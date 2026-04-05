---
read_when:
    - キャッシュ保持を使ってプロンプトトークンのコストを削減したい
    - マルチエージェント構成でエージェントごとのキャッシュ動作が必要である
    - heartbeat と cache-ttl のプルーニングを組み合わせて調整している
summary: プロンプトキャッシュの設定項目、マージ順序、プロバイダーの挙動、チューニングパターン
title: プロンプトキャッシュ
x-i18n:
    generated_at: "2026-04-05T12:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# プロンプトキャッシュ

プロンプトキャッシュとは、モデルプロバイダーがターンごとに毎回再処理する代わりに、変化していないプロンプト接頭辞（通常は system/developer instructions やその他の安定したコンテキスト）を再利用できることを意味します。OpenClaw は、上流 API がそれらのカウンターを直接公開している場合、プロバイダーの使用量を `cacheRead` と `cacheWrite` に正規化します。

ステータス表示では、ライブセッションのスナップショットにキャッシュカウンターがない場合でも、最新のトランスクリプト usage ログからそれらを復元できるため、部分的なセッションメタデータ損失の後でも `/status` でキャッシュ行を表示し続けられます。既存の非ゼロのライブキャッシュ値は、引き続きトランスクリプトからのフォールバック値より優先されます。

これが重要な理由: トークンコストの低減、応答の高速化、長時間実行セッションでのより予測しやすいパフォーマンス。キャッシュがなければ、入力の大半が変わっていなくても、繰り返されるプロンプトは毎ターン完全なプロンプトコストを支払うことになります。

このページでは、プロンプトの再利用とトークンコストに影響する、キャッシュ関連のすべての設定項目を扱います。

プロバイダーの参考資料:

- Anthropic のプロンプトキャッシュ: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI のプロンプトキャッシュ: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API のヘッダーとリクエスト ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic のリクエスト ID とエラー: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要な設定項目

### `cacheRetention`（グローバル既定値、モデル別、およびエージェント別）

すべてのモデルに対するグローバル既定値としてキャッシュ保持を設定します:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

モデルごとに上書きします:

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

1. `agents.defaults.params`（グローバル既定値 — すべてのモデルに適用）
2. `agents.defaults.models["provider/model"].params`（モデル別の上書き）
3. `agents.list[].params`（一致するエージェント id。キーごとに上書き）

### `contextPruning.mode: "cache-ttl"`

キャッシュ TTL の期間後に古い tool-result コンテキストをプルーニングし、アイドル後のリクエストで肥大化した履歴が再キャッシュされないようにします。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完全な動作については [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### ハートビートによるウォーム維持

heartbeat はキャッシュウィンドウをウォームな状態に保ち、アイドル時間の後に繰り返されるキャッシュ書き込みを減らせます。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

エージェントごとの heartbeat は `agents.list[].heartbeat` でサポートされています。

## プロバイダーの挙動

### Anthropic（直接 API）

- `cacheRetention` がサポートされています。
- Anthropic の API キー認証プロファイルでは、未設定時に Anthropic モデル参照へ `cacheRetention: "short"` を OpenClaw が初期設定します。
- Anthropic ネイティブ Messages レスポンスは `cache_read_input_tokens` と `cache_creation_input_tokens` の両方を公開するため、OpenClaw は `cacheRead` と `cacheWrite` の両方を表示できます。
- ネイティブ Anthropic リクエストでは、`cacheRetention: "short"` は既定の 5 分間のエフェメラルキャッシュに対応し、`cacheRetention: "long"` は直接の `api.anthropic.com` ホストでのみ TTL 1 時間へ引き上げられます。

### OpenAI（直接 API）

- プロンプトキャッシュは、対応する最近のモデルでは自動です。OpenClaw がブロック単位のキャッシュマーカーを挿入する必要はありません。
- OpenClaw は、ターン間でキャッシュルーティングを安定させるために `prompt_cache_key` を使用し、直接の OpenAI ホストで `cacheRetention: "long"` が選ばれた場合にのみ `prompt_cache_retention: "24h"` を使用します。
- OpenAI のレスポンスは、`usage.prompt_tokens_details.cached_tokens`（または Responses API イベント上の `input_tokens_details.cached_tokens`）を通じてキャッシュ済みプロンプトトークンを公開します。OpenClaw はこれを `cacheRead` に対応付けます。
- OpenAI は別個の cache-write トークンカウンターを公開しないため、プロバイダーがキャッシュをウォームしている場合でも、OpenAI 経路では `cacheWrite` は `0` のままです。
- OpenAI は `x-request-id`、`openai-processing-ms`、`x-ratelimit-*` などの有用なトレースおよびレート制限ヘッダーを返しますが、キャッシュヒットの集計はヘッダーではなく usage ペイロードから取得するべきです。
- 実際には、OpenAI は Anthropic のような移動する完全履歴の再利用というより、初期接頭辞キャッシュのように振る舞うことがよくあります。安定した長い接頭辞のテキストターンでは、現在のライブプローブで `4864` キャッシュ済みトークン付近のプラトーに達することがあり、tool-heavy または MCP 形式のトランスクリプトでは、完全に同じ繰り返しでも `4608` キャッシュ済みトークン付近で頭打ちになることがよくあります。

### Anthropic Vertex

- Vertex AI 上の Anthropic モデル（`anthropic-vertex/*`）は、直接の Anthropic と同じ方法で `cacheRetention` をサポートします。
- `cacheRetention: "long"` は、Vertex AI エンドポイント上で実際の 1 時間のプロンプトキャッシュ TTL に対応します。
- `anthropic-vertex` の既定のキャッシュ保持は、直接の Anthropic の既定値と一致します。
- Vertex リクエストは、プロバイダーが実際に受け取る内容にキャッシュ再利用が一致するよう、境界を考慮したキャッシュ整形を通じてルーティングされます。

### Amazon Bedrock

- Anthropic Claude モデル参照（`amazon-bedrock/*anthropic.claude*`）は、明示的な `cacheRetention` の透過をサポートします。
- Anthropic 以外の Bedrock モデルは、実行時に `cacheRetention: "none"` へ強制されます。

### OpenRouter Anthropic models

`openrouter/anthropic/*` モデル参照では、OpenClaw は Anthropic の
`cache_control` を system/developer prompt blocks に注入し、プロンプトキャッシュの
再利用を改善します。ただし、これはリクエストが引き続き検証済みの OpenRouter ルート
（既定エンドポイント上の `openrouter`、または `openrouter.ai` に解決される任意の provider/base URL）
を対象としている場合に限られます。

モデルの向き先を任意の OpenAI 互換プロキシ URL に変更した場合、OpenClaw は
それらの OpenRouter 固有の Anthropic キャッシュマーカーの注入を停止します。

### その他のプロバイダー

プロバイダーがこのキャッシュモードをサポートしていない場合、`cacheRetention` は効果を持ちません。

### Google Gemini 直接 API

- 直接の Gemini トランスポート（`api: "google-generative-ai"`）は、上流の `cachedContentTokenCount` を通じてキャッシュヒットを報告します。OpenClaw はこれを `cacheRead` に対応付けます。
- 直接の Gemini モデルに `cacheRetention` が設定されると、OpenClaw は Google AI Studio 実行向けに system prompts の `cachedContents` リソースを自動的に作成、再利用、更新します。これは、キャッシュ済みコンテンツハンドルを事前に手動作成する必要がなくなったことを意味します。
- 既存の Gemini キャッシュ済みコンテンツハンドルは、設定済みモデル上で `params.cachedContent`（または旧式の `params.cached_content`）として引き続き渡せます。
- これは Anthropic/OpenAI のプロンプト接頭辞キャッシュとは別物です。Gemini では、OpenClaw はリクエストにキャッシュマーカーを注入するのではなく、プロバイダーネイティブの `cachedContents` リソースを管理します。

### Gemini CLI JSON usage

- Gemini CLI の JSON 出力でも、`stats.cached` を通じてキャッシュヒットが表れることがあります。OpenClaw はこれを `cacheRead` に対応付けます。
- CLI が直接の `stats.input` 値を省略した場合、OpenClaw は `stats.input_tokens - stats.cached` から入力トークン数を導出します。
- これは usage の正規化にすぎません。OpenClaw が Gemini CLI に対して Anthropic/OpenAI 形式のプロンプトキャッシュマーカーを作成していることを意味するわけではありません。

## システムプロンプトのキャッシュ境界

OpenClaw は、システムプロンプトを内部の cache-prefix boundary で区切られた **安定した
接頭辞** と **変動する接尾辞** に分割します。境界より上のコンテンツ
（tool definitions、skills metadata、workspace files、その他の比較的静的なコンテキスト）は、
ターン間でバイト列が同一のまま保たれるよう順序付けされます。
境界より下のコンテンツ（たとえば `HEARTBEAT.md`、実行時タイムスタンプ、その他のターンごとのメタデータ）は、
キャッシュ済み接頭辞を無効化せずに変化できます。

主な設計上の選択:

- 安定した workspace project-context files は `HEARTBEAT.md` より前に順序付けされるため、
  heartbeat の変動が安定した接頭辞を壊しません。
- この境界は Anthropic 系、OpenAI 系、Google、および CLI トランスポート整形全体に適用されるため、
  すべての対応プロバイダーが同じ接頭辞安定性の恩恵を受けます。
- Codex Responses と Anthropic Vertex のリクエストは、
  キャッシュ再利用がプロバイダーが実際に受け取る内容と一致するよう、
  境界を考慮したキャッシュ整形を通じてルーティングされます。
- システムプロンプトのフィンガープリントは正規化され
  （空白、改行コード、フックによって追加されたコンテキスト、実行時 capability の順序）、
  意味的に変化していないプロンプトがターン間で同じ KV/キャッシュを共有できるようにします。

設定または workspace の変更後に予期しない `cacheWrite` の急増が見られる場合、
その変更がキャッシュ境界の上にあるか下にあるかを確認してください。
変動するコンテンツを境界の下へ移動する（または安定化する）ことで、
問題が解決することがよくあります。

## OpenClaw のキャッシュ安定性ガード

OpenClaw はまた、リクエストがプロバイダーに到達する前に、いくつかのキャッシュに敏感なペイロード形状を決定的に保ちます:

- バンドルされた MCP ツールカタログは、tool
  registration の前に決定的にソートされるため、`listTools()` の順序変化で tools ブロックが揺らいで
  プロンプトキャッシュ接頭辞が壊れることを防ぎます。
- 永続化された画像ブロックを持つ旧式セッションでは、**最新の 3 件の
  完了ターン** をそのまま維持します。より古く、すでに処理済みの画像ブロックは
  マーカーに置き換えられる場合があり、画像が多いフォローアップで大きく古い
  ペイロードが繰り返し再送されるのを防ぎます。

## チューニングパターン

### 混在トラフィック（推奨される既定値）

メインエージェントでは長寿命のベースラインを維持し、突発的な notifier エージェントではキャッシュを無効にします:

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

- ベースラインの `cacheRetention: "short"` を設定します。
- `contextPruning.mode: "cache-ttl"` を有効にします。
- ウォームキャッシュの恩恵があるエージェントに対してのみ、heartbeat を TTL 未満に保ちます。

## キャッシュ診断

OpenClaw は、埋め込みエージェント実行向けに専用の cache-trace 診断を公開しています。

通常のユーザー向け診断では、ライブセッションエントリーにこれらのカウンターがない場合、
`/status` やその他の usage サマリーは、最新のトランスクリプト usage エントリーを
`cacheRead` / `cacheWrite` のフォールバックソースとして使用できます。

## ライブ回帰テスト

OpenClaw は、繰り返し接頭辞、ツールターン、画像ターン、MCP 形式のツールトランスクリプト、および Anthropic の no-cache コントロールに対して、1 つの統合ライブキャッシュ回帰ゲートを維持しています。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

絞り込んだライブゲートを実行するには:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ベースラインファイルは、直近で観測されたライブ値と、テストで使用されるプロバイダー別の回帰下限値を保存します。
また、ランナーは新しい実行ごとのセッション ID とプロンプト名前空間を使用するため、以前のキャッシュ状態が現在の回帰サンプルを汚染しません。

これらのテストは、意図的にプロバイダー間で同一の成功基準を使用していません。

### Anthropic のライブ期待値

- `cacheWrite` による明示的なウォームアップ書き込みを期待します。
- Anthropic のキャッシュ制御は会話を通じてキャッシュブレークポイントを前進させるため、繰り返しターンでは会話履歴のほぼ全体が再利用されることを期待します。
- 現在のライブアサーションでも、安定パス、ツールパス、画像パスに対して高いヒット率しきい値を使用しています。

### OpenAI のライブ期待値

- `cacheRead` のみを期待します。`cacheWrite` は `0` のままです。
- 繰り返しターンのキャッシュ再利用は、Anthropic のような移動する完全履歴の再利用ではなく、プロバイダー固有のプラトーとして扱います。
- 現在のライブアサーションでは、`gpt-5.4-mini` で観測されたライブ挙動に基づく保守的な下限チェックを使用しています:
  - 安定した接頭辞: `cacheRead >= 4608`、ヒット率 `>= 0.90`
  - ツールトランスクリプト: `cacheRead >= 4096`、ヒット率 `>= 0.85`
  - 画像トランスクリプト: `cacheRead >= 3840`、ヒット率 `>= 0.82`
  - MCP 形式トランスクリプト: `cacheRead >= 4096`、ヒット率 `>= 0.85`

2026-04-04 の新規統合ライブ検証結果:

- 安定した接頭辞: `cacheRead=4864`、ヒット率 `0.966`
- ツールトランスクリプト: `cacheRead=4608`、ヒット率 `0.896`
- 画像トランスクリプト: `cacheRead=4864`、ヒット率 `0.954`
- MCP 形式トランスクリプト: `cacheRead=4608`、ヒット率 `0.891`

統合ゲートの最近のローカル実行時間は、およそ `88s` でした。

アサーションが異なる理由:

- Anthropic は明示的なキャッシュブレークポイントと、移動する会話履歴の再利用を公開しています。
- OpenAI のプロンプトキャッシュも依然として正確な接頭辞に敏感ですが、ライブ Responses トラフィックで実際に再利用可能な接頭辞は、完全なプロンプトより早く頭打ちになることがあります。
- そのため、Anthropic と OpenAI を単一のプロバイダー横断パーセンテージしきい値で比較すると、誤った回帰判定が生じます。

### `diagnostics.cacheTrace` 設定

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # 任意
    includeMessages: false # 既定値 true
    includePrompt: false # 既定値 true
    includeSystem: false # 既定値 true
```

既定値:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### 環境変数トグル（単発のデバッグ）

- `OPENCLAW_CACHE_TRACE=1` はキャッシュトレースを有効にします。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` は出力パスを上書きします。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` は完全なメッセージペイロードの取得を切り替えます。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` はプロンプトテキストの取得を切り替えます。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` はシステムプロンプトの取得を切り替えます。

### 確認すべき点

- キャッシュトレースイベントは JSONL で、`session:loaded`、`prompt:before`、`stream:context`、`session:after` などの段階的スナップショットを含みます。
- ターンごとのキャッシュトークン影響は、通常の usage 表示で `cacheRead` と `cacheWrite` を通じて確認できます（たとえば `/usage full` やセッション usage サマリー）。
- Anthropic では、キャッシュが有効なとき `cacheRead` と `cacheWrite` の両方を期待します。
- OpenAI では、キャッシュヒット時に `cacheRead` を期待し、`cacheWrite` は `0` のままであることを期待します。OpenAI は別個の cache-write トークンフィールドを公開しません。
- リクエストトレースが必要な場合は、リクエスト ID とレート制限ヘッダーをキャッシュメトリクスとは別に記録してください。OpenClaw の現在の cache-trace 出力は、生のプロバイダーレスポンスヘッダーではなく、プロンプト/セッション形状と正規化されたトークン usage に焦点を当てています。

## クイックトラブルシューティング

- ほとんどのターンで `cacheWrite` が高い: 変動するシステムプロンプト入力を確認し、モデル/プロバイダーがキャッシュ設定をサポートしていることを検証してください。
- Anthropic で `cacheWrite` が高い: 多くの場合、キャッシュブレークポイントが毎回変化するコンテンツに当たっていることを意味します。
- OpenAI で `cacheRead` が低い: 安定した接頭辞が先頭にあること、繰り返される接頭辞が少なくとも 1024 トークンであること、同じ `prompt_cache_key` がキャッシュ共有すべきターン間で再利用されていることを検証してください。
- `cacheRetention` に効果がない: モデルキーが `agents.defaults.models["provider/model"]` に一致していることを確認してください。
- キャッシュ設定付きの Bedrock Nova/Mistral リクエスト: 実行時に `none` へ強制されるのが想定動作です。

関連ドキュメント:

- [Anthropic](/ja-JP/providers/anthropic)
- [Token Use and Costs](/reference/token-use)
- [Session Pruning](/ja-JP/concepts/session-pruning)
- [Gateway Configuration Reference](/ja-JP/gateway/configuration-reference)
