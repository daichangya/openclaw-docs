---
read_when:
    - プロバイダーごとのモデルセットアップリファレンスが必要です
    - モデルプロバイダー向けの設定例やCLIオンボーディングコマンドが必要です
summary: モデルプロバイダーの概要、設定例、CLIフロー
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-22T04:22:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# モデルプロバイダー

このページでは**LLM/モデルプロバイダー**を扱います（WhatsApp/Telegramのようなチャットチャンネルではありません）。
モデル選択ルールについては[/concepts/models](/ja-JP/concepts/models)を参照してください。

## クイックルール

- モデル参照は`provider/model`を使用します（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models`を設定すると、それが許可リストになります。
- CLIヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- フォールバック実行時ルール、クールダウンプローブ、セッション上書きの永続化については
  [/concepts/model-failover](/ja-JP/concepts/model-failover)に記載されています。
- `models.providers.*.models[].contextWindow`はネイティブなモデルメタデータです。
  `models.providers.*.models[].contextTokens`は有効な実行時上限です。
- プロバイダーPluginは`registerProvider({ catalog })`を通じてモデルカタログを注入できます。
  OpenClawは`models.json`を書き出す前に、その出力を`models.providers`へマージします。
- プロバイダーmanifestは`providerAuthEnvVars`と
  `providerAuthAliases`を宣言できるため、汎用の環境変数ベース認証プローブやプロバイダーバリアントで
  Plugin実行時をロードする必要がありません。残るコアの環境変数マップは、現在では
  非Plugin/コアプロバイダーと、AnthropicのAPI key優先オンボーディングのような
  いくつかの汎用優先順位ケースのためだけにあります。
- プロバイダーPluginは、以下を通じてプロバイダー実行時の動作も所有できます:
  `normalizeModelId`、`normalizeTransport`、`normalizeConfig`、
  `applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、
  `resolveSyntheticAuth`、`shouldDeferSyntheticProfileAuth`、
  `resolveDynamicModel`、`prepareDynamicModel`、
  `normalizeResolvedModel`、`contributeResolvedModelCompat`、
  `capabilities`、`normalizeToolSchemas`、
  `inspectToolSchemas`、`resolveReasoningOutputMode`、
  `prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、
  `resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、
  `createEmbeddingProvider`、`formatApiKey`、`refreshOAuth`、
  `buildAuthDoctorHint`、
  `matchesContextOverflowError`、`classifyFailoverReason`、
  `isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`resolveThinkingProfile`、`isBinaryThinking`、
  `supportsXHighThinking`、`resolveDefaultThinkingLevel`、
  `applyConfigDefaults`、`isModernModelRef`、
  `prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`、および
  `onModelSelected`。
- 注: プロバイダー実行時の`capabilities`は、共有ランナーのメタデータです（プロバイダーファミリー、
  transcript/toolingの癖、transport/cacheのヒント）。これは
  Pluginが何を登録するか（テキスト推論、音声など）を記述する
  [公開capability model](/ja-JP/plugins/architecture#public-capability-model)
  と同じものではありません。
- バンドルされた`codex`プロバイダーは、バンドルされたCodex agent harnessと組み合わされています。
  Codex所有のログイン、モデル検出、ネイティブスレッド再開、app-server実行が必要な場合は
  `codex/gpt-*`を使ってください。通常の`openai/gpt-*`参照は引き続き
  OpenAIプロバイダーと通常のOpenClawプロバイダーtransportを使用します。
  Codex専用デプロイでは、自動PIフォールバックを
  `agents.defaults.embeddedHarness.fallback: "none"`で無効化できます。詳細は
  [Codex Harness](/ja-JP/plugins/codex-harness)を参照してください。

## Plugin所有のプロバイダー動作

プロバイダーPluginは、OpenClawが汎用推論ループを維持したまま、
ほとんどのプロバイダー固有ロジックを所有できるようになりました。

一般的な分担:

- `auth[].run` / `auth[].runNonInteractive`: プロバイダーは
  `openclaw onboard`、`openclaw models auth`、ヘッドレスセットアップ向けの
  オンボーディング/ログインフローを所有します
- `wizard.setup` / `wizard.modelPicker`: プロバイダーは認証選択ラベル、
  従来のエイリアス、オンボーディング許可リストのヒント、
  オンボーディング/モデルピッカー内のセットアップ項目を所有します
- `catalog`: プロバイダーは`models.providers`に表示されます
- `normalizeModelId`: プロバイダーは、検索または正規化の前に
  従来/プレビューモデルIDを正規化します
- `normalizeTransport`: プロバイダーは、汎用モデル組み立ての前に
  transportファミリーの`api` / `baseUrl`を正規化します。OpenClawはまず一致したプロバイダーを確認し、
  次に、実際にtransportを変更したものが見つかるまで、他のhook対応プロバイダーPluginを確認します
- `normalizeConfig`: プロバイダーは、実行時使用前に`models.providers.<id>`設定を正規化します。
  OpenClawはまず一致したプロバイダーを確認し、
  次に、実際に設定を変更したものが見つかるまで、他のhook対応プロバイダーPluginを確認します。もし
  どのプロバイダーhookも設定を書き換えない場合、バンドルされたGoogleファミリーヘルパーが引き続き
  サポートされるGoogleプロバイダー項目を正規化します。
- `applyNativeStreamingUsageCompat`: プロバイダーは、設定プロバイダー向けに
  エンドポイント駆動のネイティブstreaming-usage互換書き換えを適用します
- `resolveConfigApiKey`: プロバイダーは、完全な実行時認証ロードを強制せずに
  設定プロバイダー向けの環境変数マーカー認証を解決します。
  `amazon-bedrock`にはここに組み込みのAWS環境変数マーカーリゾルバーもありますが、
  Bedrock実行時認証自体はAWS SDKのデフォルトチェーンを使用します
- `resolveSyntheticAuth`: プロバイダーは、平文シークレットを永続化せずに
  local/self-hostedその他の設定ベース認証の可用性を公開できます
- `shouldDeferSyntheticProfileAuth`: プロバイダーは、保存されたsynthetic profile
  プレースホルダーを、環境変数/設定ベース認証より低優先にできます
- `resolveDynamicModel`: プロバイダーは、ローカル静的カタログにまだ存在しない
  モデルIDを受け付けます
- `prepareDynamicModel`: プロバイダーは、動的解決の再試行前に
  メタデータ更新を必要とします
- `normalizeResolvedModel`: プロバイダーは、transportまたはbase URLの書き換えを必要とします
- `contributeResolvedModelCompat`: プロバイダーは、別の互換transport経由で到達した場合でも
  自身のベンダーモデル向け互換フラグを提供します
- `capabilities`: プロバイダーは、transcript/tooling/プロバイダーファミリーの癖を公開します
- `normalizeToolSchemas`: プロバイダーは、埋め込みランナーが参照する前に
  ツールスキーマを整えます
- `inspectToolSchemas`: プロバイダーは、正規化後に
  transport固有のスキーマ警告を提示します
- `resolveReasoningOutputMode`: プロバイダーは、ネイティブまたはタグ付きの
  reasoning-output契約を選択します
- `prepareExtraParams`: プロバイダーは、モデルごとのリクエストパラメーターを
  デフォルト化または正規化します
- `createStreamFn`: プロバイダーは、通常のstreamパスを
  完全にカスタムなtransportへ置き換えます
- `wrapStreamFn`: プロバイダーは、リクエストヘッダー/本文/モデル互換ラッパーを適用します
- `resolveTransportTurnState`: プロバイダーは、ターンごとのネイティブtransport
  ヘッダーまたはメタデータを提供します
- `resolveWebSocketSessionPolicy`: プロバイダーは、ネイティブWebSocketセッション
  ヘッダーまたはセッションクールダウンポリシーを提供します
- `createEmbeddingProvider`: プロバイダーは、コアのembedding切り替え機構ではなく
  プロバイダーPluginに属するmemory embedding動作を所有します
- `formatApiKey`: プロバイダーは、保存された認証プロファイルを
  transportが期待する実行時`apiKey`文字列へ整形します
- `refreshOAuth`: 共有の`pi-ai`
  リフレッシャーで十分でない場合、プロバイダーがOAuth更新を所有します
- `buildAuthDoctorHint`: OAuth更新が失敗した場合、
  プロバイダーが修復ガイダンスを追加します
- `matchesContextOverflowError`: プロバイダーは、汎用ヒューリスティクスでは見逃す
  プロバイダー固有のコンテキストウィンドウ超過エラーを認識します
- `classifyFailoverReason`: プロバイダーは、プロバイダー固有の生transport/APIエラーを
  レート制限や過負荷のようなフェイルオーバー理由へマッピングします
- `isCacheTtlEligible`: プロバイダーは、どの上流モデルIDがprompt-cache TTLをサポートするかを決定します
- `buildMissingAuthMessage`: プロバイダーは、汎用auth-storeエラーを
  プロバイダー固有の復旧ヒントに置き換えます
- `suppressBuiltInModel`: プロバイダーは、古い上流行を非表示にし、
  直接解決失敗時にベンダー所有エラーを返せます
- `augmentModelCatalog`: プロバイダーは、検出と設定マージ後に
  synthetic/finalカタログ行を追加します
- `resolveThinkingProfile`: プロバイダーは、選択されたモデル向けの
  正確な`/think`レベルセット、任意の表示ラベル、デフォルトレベルを所有します
- `isBinaryThinking`: バイナリのオン/オフthinking UX向け互換hook
- `supportsXHighThinking`: 選択された`xhigh`モデル向け互換hook
- `resolveDefaultThinkingLevel`: デフォルトの`/think`ポリシー向け互換hook
- `applyConfigDefaults`: プロバイダーは、認証モード、環境変数、モデルファミリーに基づいて
  設定実体化時にプロバイダー固有のグローバルデフォルトを適用します
- `isModernModelRef`: プロバイダーは、live/smoke優先モデル一致を所有します
- `prepareRuntimeAuth`: プロバイダーは、設定済み認証情報を
  短命の実行時トークンへ変換します
- `resolveUsageAuth`: プロバイダーは、`/usage`
  および関連するステータス/レポート画面向けの使用量/クォータ認証情報を解決します
- `fetchUsageSnapshot`: プロバイダーは、使用量エンドポイントの取得/解析を所有し、
  コアは要約シェルと整形を引き続き所有します
- `onModelSelected`: プロバイダーは、テレメトリーや
  プロバイダー所有セッション記録などの選択後副作用を実行します

現在のバンドル例:

- `anthropic`: Claude 4.6のforward-compatフォールバック、認証修復ヒント、usage
  エンドポイント取得、cache-TTL/プロバイダーファミリーメタデータ、および認証対応のグローバル
  設定デフォルト
- `amazon-bedrock`: Bedrock固有のスロットル/未準備エラー向けの、プロバイダー所有の
  コンテキスト超過一致とフェイルオーバー理由分類。加えて、
  Anthropicトラフィック上のClaude専用replay-policy
  ガード向け共有`anthropic-by-model`リプレイファミリー
- `anthropic-vertex`: Anthropic-message
  トラフィック上のClaude専用replay-policyガード
- `openrouter`: モデルIDのパススルー、リクエストラッパー、プロバイダーcapability
  ヒント、プロキシGeminiトラフィック上のGemini thought-signatureサニタイズ、
  `openrouter-thinking` streamファミリーを通したプロキシ
  reasoning注入、ルーティングメタデータ転送、およびcache-TTLポリシー
- `github-copilot`: オンボーディング/デバイスログイン、forward-compatモデルフォールバック、
  Claude-thinking transcriptヒント、実行時トークン交換、およびusageエンドポイント取得
- `openai`: GPT-5.4のforward-compatフォールバック、直接OpenAI transport
  正規化、Codex対応の認証不足ヒント、Spark抑制、
  synthetic OpenAI/Codexカタログ行、thinking/live-modelポリシー、usage-tokenエイリアス
  正規化（`input` / `output`および`prompt` / `completion`ファミリー）、共有
  `openai-responses-defaults` streamファミリーによるネイティブOpenAI/Codex
  ラッパー、プロバイダーファミリーメタデータ、`gpt-image-2`向けのバンドルされた
  画像生成プロバイダー登録、および`sora-2`向けのバンドルされた
  動画生成プロバイダー登録
- `google`および`google-gemini-cli`: Gemini 3.1のforward-compatフォールバック、
  ネイティブGeminiリプレイ検証、bootstrapリプレイサニタイズ、タグ付き
  reasoning-outputモード、modern-modelマッチング、Gemini image-previewモデル向けの
  バンドルされた画像生成プロバイダー登録、およびVeoモデル向けのバンドルされた
  動画生成プロバイダー登録。Gemini CLI OAuthは、認証プロファイルの
  トークン整形、usage-token解析、usage画面向けのクォータエンドポイント取得も所有します
- `moonshot`: 共有transport、Plugin所有のthinkingペイロード正規化
- `kilocode`: 共有transport、Plugin所有のリクエストヘッダー、reasoningペイロード
  正規化、プロキシGemini thought-signatureサニタイズ、およびcache-TTL
  ポリシー
- `zai`: GLM-5のforward-compatフォールバック、`tool_stream`デフォルト、cache-TTL
  ポリシー、バイナリthinking/live-modelポリシー、およびusage認証 + クォータ取得。
  未知の`glm-5*` IDは、バンドルされた`glm-4.7`テンプレートから合成されます
- `xai`: ネイティブResponses transport正規化、Grok fastバリアント向けの`/fast`エイリアス書き換え、
  デフォルト`tool_stream`、xAI固有のtool-schema /
  reasoning-payloadクリーンアップ、および`grok-imagine-video`向けの
  バンドルされた動画生成プロバイダー登録
- `mistral`: Plugin所有のcapabilityメタデータ
- `opencode`および`opencode-go`: Plugin所有のcapabilityメタデータに加え、
  プロキシGemini thought-signatureサニタイズ
- `alibaba`: `alibaba/wan2.6-t2v`のような直接Wanモデル参照向けの、
  Plugin所有の動画生成カタログ
- `byteplus`: Plugin所有のカタログに加え、Seedance text-to-video/image-to-videoモデル向けの
  バンドルされた動画生成プロバイダー登録
- `fal`: ホスト型サードパーティー画像生成プロバイダー向けの
  FLUX画像モデル用バンドル登録に加え、ホスト型サードパーティー動画モデル向けの
  バンドルされた動画生成プロバイダー登録
- `cloudflare-ai-gateway`、`huggingface`、`kimi`、`nvidia`、`qianfan`、
  `stepfun`、`synthetic`、`venice`、`vercel-ai-gateway`、`volcengine`:
  Plugin所有のカタログのみ
- `qwen`: テキストモデル向けのPlugin所有カタログに加え、その
  マルチモーダル画面向けの共有メディア理解および動画生成プロバイダー登録。
  Qwen動画生成では、`wan2.6-t2v`や`wan2.7-r2v`のようなバンドルされたWanモデルとともに、
  Standard DashScope videoエンドポイントを使用します
- `runway`: `gen4.5`のようなネイティブRunwayタスクベースモデル向けの、
  Plugin所有の動画生成プロバイダー登録
- `minimax`: Plugin所有カタログ、Hailuo動画モデル向けのバンドルされた
  動画生成プロバイダー登録、`image-01`向けのバンドルされた画像生成プロバイダー
  登録、ハイブリッドAnthropic/OpenAI replay-policy
  選択、およびusage認証/スナップショットロジック
- `together`: Plugin所有カタログに加え、Wan動画モデル向けの
  バンドルされた動画生成プロバイダー登録
- `xiaomi`: Plugin所有カタログに加え、usage認証/スナップショットロジック

バンドルされた`openai` Pluginは現在、両方のプロバイダーIDを所有しています: `openai`と
`openai-codex`。

これで、まだOpenClawの通常transportに収まるプロバイダーは網羅しています。完全に
カスタムのリクエスト実行器が必要なプロバイダーは、別のより深い拡張画面です。

## API keyローテーション

- 選択されたプロバイダー向けの汎用プロバイダーローテーションをサポートします。
- 複数キーは次のいずれかで設定します:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のlive上書き、最優先）
  - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りリスト）
  - `<PROVIDER>_API_KEY`（プライマリーキー）
  - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）
- Googleプロバイダーでは、`GOOGLE_API_KEY`もフォールバックとして含まれます。
- キー選択順は優先順位を維持しつつ、値を重複排除します。
- リクエストは、レート制限応答の場合にのみ次のキーで再試行されます（
  たとえば`429`、`rate_limit`、`quota`、`resource exhausted`、`Too many
concurrent requests`、`ThrottlingException`、`concurrency limit reached`、
  `workers_ai ... quota limit exceeded`、または定期的なusage-limitメッセージ）。
- レート制限以外の失敗は即座に失敗し、キーのローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダー（pi-aiカタログ）

OpenClawにはpi‑aiカタログが同梱されています。これらのプロバイダーでは
`models.providers`設定は**不要**です。認証を設定してモデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および`OPENCLAW_LIVE_OPENAI_KEY`（単一上書き）
- モデル例: `openai/gpt-5.4`、`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトtransportは`auto`です（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは`agents.defaults.models["openai/<model>"].params.transport`で行います（`"sse"`、`"websocket"`、または`"auto"`）
- OpenAI Responses WebSocketウォームアップは`params.openaiWsWarmup`（`true`/`false`）でデフォルト有効です
- OpenAI優先処理は`agents.defaults.models["openai/<model>"].params.serviceTier`で有効にできます
- `/fast`と`params.fastMode`は、直接`openai/*` Responsesリクエストを`api.openai.com`上の`service_tier=priority`へマップします
- 共有`/fast`トグルの代わりに明示的なtierを使いたい場合は`params.serviceTier`を使用してください
- 非表示のOpenClaw attributionヘッダー（`originator`、`version`、
  `User-Agent`）は、汎用のOpenAI互換プロキシではなく、`api.openai.com`へのネイティブOpenAIトラフィックにのみ適用されます
- ネイティブOpenAIルートでは、Responsesの`store`、prompt-cacheヒント、
  OpenAI reasoning互換ペイロード整形も維持されます。プロキシルートでは維持されません
- `openai/gpt-5.3-codex-spark`は、live OpenAI APIが拒否するため、OpenClawでは意図的に抑制されています。SparkはCodex専用として扱われます

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および`OPENCLAW_LIVE_ANTHROPIC_KEY`（単一上書き）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開Anthropicリクエストでは、共有`/fast`トグルと`params.fastMode`もサポートされ、`api.anthropic.com`に送られるAPI key認証およびOAuth認証トラフィックも含まれます。OpenClawはこれをAnthropicの`service_tier`（`auto` vs `standard_only`）にマップします
- Anthropic注記: Anthropicのスタッフから、OpenClawスタイルのClaude CLI利用は再び許可されていると伝えられたため、Anthropicが新たなポリシーを公開しない限り、OpenClawはClaude CLI再利用と`claude -p`利用をこの統合で認可済みとして扱います。
- Anthropic setup-tokenもサポート対象のOpenClawトークンパスとして引き続き利用可能ですが、OpenClawは現在、利用可能な場合はClaude CLI再利用と`claude -p`を優先します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code（Codex）

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- モデル例: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex`または`openclaw models auth login --provider openai-codex`
- デフォルトtransportは`auto`です（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは`agents.defaults.models["openai-codex/<model>"].params.transport`で行います（`"sse"`、`"websocket"`、または`"auto"`）
- `params.serviceTier`はネイティブCodex Responsesリクエスト（`chatgpt.com/backend-api`）でも転送されます
- 非表示のOpenClaw attributionヘッダー（`originator`、`version`、
  `User-Agent`）は、汎用のOpenAI互換プロキシではなく、
  `chatgpt.com/backend-api`へのネイティブCodexトラフィックにのみ付与されます
- 直接`openai/*`と同じ`/fast`トグルおよび`params.fastMode`設定を共有し、OpenClawはこれを`service_tier=priority`にマップします
- `openai-codex/gpt-5.3-codex-spark`は、Codex OAuthカタログで公開されている場合は引き続き利用可能です。利用権に依存します
- `openai-codex/gpt-5.4`はネイティブの`contextWindow = 1050000`とデフォルト実行時`contextTokens = 272000`を維持します。実行時上限は`models.providers.openai-codex.models[].contextTokens`で上書きしてください
- ポリシー注記: OpenAI Codex OAuthは、OpenClawのような外部ツール/ワークフロー向けに明示的にサポートされています。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### その他のサブスクリプション型ホストオプション

- [Qwen Cloud](/ja-JP/providers/qwen): Qwen Cloudプロバイダー画面に加え、Alibaba DashScopeおよびCoding Planエンドポイントマッピング
- [MiniMax](/ja-JP/providers/minimax): MiniMax Coding Plan OAuthまたはAPI keyアクセス
- [GLM Models](/ja-JP/providers/glm): Z.AI Coding Planまたは一般APIエンドポイント

### OpenCode

- 認証: `OPENCODE_API_KEY`（または`OPENCODE_ZEN_API_KEY`）
- Zen実行時プロバイダー: `opencode`
- Go実行時プロバイダー: `opencode-go`
- モデル例: `opencode/claude-opus-4-6`、`opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen`または`openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API key）

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY`
- 任意のローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY`フォールバック、および`OPENCLAW_LIVE_GEMINI_KEY`（単一上書き）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview`を使う従来のOpenClaw設定は`google/gemini-3-flash-preview`へ正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 直接Gemini実行では、`agents.defaults.models["google/<model>"].params.cachedContent`
  （または従来の`cached_content`）も受け付け、プロバイダーネイティブな
  `cachedContents/...`ハンドルを転送します。GeminiキャッシュヒットはOpenClawの`cacheRead`として表示されます

### Google VertexとGemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- 認証: Vertexはgcloud ADCを使用し、Gemini CLIは独自のOAuthフローを使用します
- 注意: OpenClawでのGemini CLI OAuthは非公式の統合です。サードパーティークライアントの使用後にGoogleアカウント制限がかかったという報告があります。利用を進める場合は、Googleの利用規約を確認し、重要でないアカウントを使用してください。
- Gemini CLI OAuthは、バンドルされた`google` Pluginの一部として提供されます。
  - まずGemini CLIをインストールします:
    - `brew install gemini-cli`
    - または`npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
  - 注: `openclaw.json`にclient idやsecretを貼り付けることは**ありません**。CLIログインフローは
    トークンをGatewayホスト上の認証プロファイルに保存します。
  - ログイン後にリクエストが失敗する場合は、Gatewayホストで`GOOGLE_CLOUD_PROJECT`または`GOOGLE_CLOUD_PROJECT_ID`を設定してください。
  - Gemini CLIのJSON応答は`response`から解析され、usageは
    `stats`へフォールバックします。`stats.cached`はOpenClawの`cacheRead`へ正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*`および`z-ai/*`は`zai/*`へ正規化されます
  - `zai-api-key`は一致するZ.AIエンドポイントを自動検出します。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`は特定の画面を強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`、
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベースURL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには`kilocode/kilo/auto`が同梱されます。live
  `https://api.kilo.ai/api/gateway/models`検出により、実行時
  カタログをさらに拡張できます。
- `kilocode/kilo/auto`の背後にある正確な上流ルーティングはKilo Gatewayが所有しており、
  OpenClawにハードコードされているわけではありません。

セットアップの詳細は[/providers/kilocode](/ja-JP/providers/kilocode)を参照してください。

### その他のバンドル済みプロバイダーPlugin

- OpenRouter: `openrouter`（`OPENROUTER_API_KEY`）
- モデル例: `openrouter/auto`、`openrouter/moonshotai/kimi-k2.6`
- OpenClawは、リクエストが実際に`openrouter.ai`を対象とする場合にのみ、
  OpenRouterが文書化しているアプリattributionヘッダーを適用します
- OpenRouter固有のAnthropic `cache_control`マーカーも同様に、
  任意のプロキシURLではなく、検証済みのOpenRouterルートにのみ制限されます
- OpenRouterは引き続きプロキシ型のOpenAI互換パス上にあるため、
  ネイティブOpenAI専用のリクエスト整形（`serviceTier`、Responses `store`、
  prompt-cacheヒント、OpenAI reasoning互換ペイロード）は転送されません
- GeminiベースのOpenRouter参照では、プロキシGemini thought-signatureサニタイズのみが維持されます。
  ネイティブGeminiリプレイ検証やbootstrap書き換えは無効のままです
- Kilo Gateway: `kilocode`（`KILOCODE_API_KEY`）
- モデル例: `kilocode/kilo/auto`
- GeminiベースのKilo参照でも同じプロキシGemini thought-signature
  サニタイズ経路が維持されます。`kilocode/kilo/auto`およびその他のproxy-reasoning非対応
  ヒントでは、proxy reasoning注入をスキップします
- MiniMax: `minimax`（API key）および`minimax-portal`（OAuth）
- 認証: `minimax`には`MINIMAX_API_KEY`、`minimax-portal`には`MINIMAX_OAUTH_TOKEN`または`MINIMAX_API_KEY`
- モデル例: `minimax/MiniMax-M2.7`または`minimax-portal/MiniMax-M2.7`
- MiniMaxオンボーディング/API keyセットアップでは、
  `input: ["text", "image"]`付きの明示的なM2.7モデル定義が書き込まれます。バンドルされたプロバイダーカタログでは、
  そのプロバイダー設定が実体化されるまではチャット参照はテキスト専用のままです
- Moonshot: `moonshot`（`MOONSHOT_API_KEY`）
- モデル例: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi`（`KIMI_API_KEY`または`KIMICODE_API_KEY`）
- モデル例: `kimi/kimi-code`
- Qianfan: `qianfan`（`QIANFAN_API_KEY`）
- モデル例: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen`（`QWEN_API_KEY`、`MODELSTUDIO_API_KEY`、または`DASHSCOPE_API_KEY`）
- モデル例: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia`（`NVIDIA_API_KEY`）
- モデル例: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan`（`STEPFUN_API_KEY`）
- モデル例: `stepfun/step-3.5-flash`、`stepfun-plan/step-3.5-flash-2603`
- Together: `together`（`TOGETHER_API_KEY`）
- モデル例: `together/moonshotai/Kimi-K2.5`
- Venice: `venice`（`VENICE_API_KEY`）
- Xiaomi: `xiaomi`（`XIAOMI_API_KEY`）
- モデル例: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway`（`AI_GATEWAY_API_KEY`）
- Hugging Face Inference: `huggingface`（`HUGGINGFACE_HUB_TOKEN`または`HF_TOKEN`）
- Cloudflare AI Gateway: `cloudflare-ai-gateway`（`CLOUDFLARE_AI_GATEWAY_API_KEY`）
- Volcengine: `volcengine`（`VOLCANO_ENGINE_API_KEY`）
- モデル例: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus`（`BYTEPLUS_API_KEY`）
- モデル例: `byteplus-plan/ark-code-latest`
- xAI: `xai`（`XAI_API_KEY`）
  - ネイティブのバンドル済みxAIリクエストはxAI Responsesパスを使用します
  - `/fast`または`params.fastMode: true`は、`grok-3`、`grok-3-mini`、
    `grok-4`、`grok-4-0709`をそれぞれの`*-fast`バリアントへ書き換えます
  - `tool_stream`はデフォルトで有効です。無効にするには
    `agents.defaults.models["xai/<model>"].params.tool_stream`を`false`に
    設定してください
- Mistral: `mistral`（`MISTRAL_API_KEY`）
- モデル例: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq`（`GROQ_API_KEY`）
- Cerebras: `cerebras`（`CEREBRAS_API_KEY`）
  - Cerebras上のGLMモデルでは、ID `zai-glm-4.7`および`zai-glm-4.6`を使用します。
  - OpenAI互換ベースURL: `https://api.cerebras.ai/v1`。
- GitHub Copilot: `github-copilot`（`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`）
- Hugging Face Inferenceのモデル例: `huggingface/deepseek-ai/DeepSeek-R1`。CLI: `openclaw onboard --auth-choice huggingface-api-key`。[Hugging Face (Inference)](/ja-JP/providers/huggingface)を参照してください。

## `models.providers`経由のプロバイダー（カスタム/ベースURL）

`models.providers`（または`models.json`）を使うと、**カスタム**プロバイダーや
OpenAI/Anthropic互換プロキシを追加できます。

以下のバンドル済みプロバイダーPluginの多くは、すでにデフォルトカタログを公開しています。
デフォルトのベースURL、ヘッダー、モデル一覧を上書きしたい場合にのみ、
明示的な`models.providers.<id>`項目を使用してください。

### Moonshot AI（Kimi）

Moonshotはバンドル済みプロバイダーPluginとして提供されます。通常は組み込みプロバイダーを
使い、ベースURLまたはモデルメタデータを上書きしたい場合にのみ、
明示的な`models.providers.moonshot`項目を追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key`または`openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2モデルID:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi CodingはMoonshot AIのAnthropic互換エンドポイントを使用します。

- プロバイダー: `kimi`
- 認証: `KIMI_API_KEY`
- モデル例: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

従来の`kimi/k2p5`も互換モデルIDとして引き続き受け付けられます。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）は、中国でDoubaoやその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine`（coding: `volcengine-plan`）
- 認証: `VOLCANO_ENGINE_API_KEY`
- モデル例: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

オンボーディングではデフォルトでcoding画面が選ばれますが、一般的な`volcengine/*`
カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、Volcengine認証選択は
`volcengine/*`と`volcengine-plan/*`の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClawは、プロバイダー限定ピッカーを空に表示する代わりに、
フィルタなしカタログへフォールバックします。

利用可能なモデル:

- `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127`（Kimi K2.5）
- `volcengine/glm-4-7-251222`（GLM 4.7）
- `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）

Codingモデル（`volcengine-plan`）:

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus（International）

BytePlus ARKは、国際ユーザー向けにVolcano Engineと同じモデルへのアクセスを提供します。

- プロバイダー: `byteplus`（coding: `byteplus-plan`）
- 認証: `BYTEPLUS_API_KEY`
- モデル例: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

オンボーディングではデフォルトでcoding画面が選ばれますが、一般的な`byteplus/*`
カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、BytePlus認証選択は
`byteplus/*`と`byteplus-plan/*`の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClawは、プロバイダー限定ピッカーを空に表示する代わりに、
フィルタなしカタログへフォールバックします。

利用可能なモデル:

- `byteplus/seed-1-8-251228`（Seed 1.8）
- `byteplus/kimi-k2-5-260127`（Kimi K2.5）
- `byteplus/glm-4-7-251222`（GLM 4.7）

Codingモデル（`byteplus-plan`）:

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Syntheticは、`synthetic`プロバイダーの背後でAnthropic互換モデルを提供します。

- プロバイダー: `synthetic`
- 認証: `SYNTHETIC_API_KEY`
- モデル例: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMaxはカスタムエンドポイントを使用するため、`models.providers`経由で設定します。

- MiniMax OAuth（Global）: `--auth-choice minimax-global-oauth`
- MiniMax OAuth（CN）: `--auth-choice minimax-cn-oauth`
- MiniMax API key（Global）: `--auth-choice minimax-global-api`
- MiniMax API key（CN）: `--auth-choice minimax-cn-api`
- 認証: `minimax`には`MINIMAX_API_KEY`、`minimax-portal`には`MINIMAX_OAUTH_TOKEN`または
  `MINIMAX_API_KEY`

セットアップの詳細、モデルオプション、設定スニペットについては[/providers/minimax](/ja-JP/providers/minimax)を参照してください。

MiniMaxのAnthropic互換streamingパスでは、明示的に設定しない限り、
OpenClawはデフォルトでthinkingを無効にし、`/fast on`は
`MiniMax-M2.7`を`MiniMax-M2.7-highspeed`へ書き換えます。

Plugin所有のcapability分割:

- テキスト/チャットのデフォルトは`minimax/MiniMax-M2.7`のままです
- 画像生成は`minimax/image-01`または`minimax-portal/image-01`です
- 画像理解は、両方のMiniMax認証パスでPlugin所有の`MiniMax-VL-01`です
- Web検索はプロバイダーID `minimax`のままです

### LM Studio

LM Studioは、ネイティブAPIを使用するバンドル済みプロバイダーPluginとして提供されます。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- デフォルト推論ベースURL: `http://localhost:1234/v1`

次にモデルを設定します（`http://localhost:1234/api/v1/models`が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClawは、検出と自動ロードのためにLM Studioのネイティブ`/api/v1/models`と`/api/v1/models/load`を使用し、
推論にはデフォルトで`/v1/chat/completions`を使用します。
セットアップとトラブルシューティングについては[/providers/lmstudio](/ja-JP/providers/lmstudio)を参照してください。

### Ollama

Ollamaはバンドル済みプロバイダーPluginとして提供され、OllamaのネイティブAPIを使用します。

- プロバイダー: `ollama`
- 認証: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama をインストールしてから、モデルを pull:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY`でオプトインすると、Ollamaはローカルの`http://127.0.0.1:11434`で検出され、
バンドル済みプロバイダーPluginがOllamaを`openclaw onboard`とモデルピッカーへ
直接追加します。オンボーディング、cloud/localモード、カスタム設定については
[/providers/ollama](/ja-JP/providers/ollama)を参照してください。

### vLLM

vLLMは、ローカル/セルフホストのOpenAI互換
サーバー向けバンドル済みプロバイダーPluginとして提供されます。

- プロバイダー: `vllm`
- 認証: 任意（サーバー設定による）
- デフォルトベースURL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合、どの値でも動作します）:

```bash
export VLLM_API_KEY="vllm-local"
```

次にモデルを設定します（`/v1/models`が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は[/providers/vllm](/ja-JP/providers/vllm)を参照してください。

### SGLang

SGLangは、高速なセルフホスト
OpenAI互換サーバー向けバンドル済みプロバイダーPluginとして提供されます。

- プロバイダー: `sglang`
- 認証: 任意（サーバー設定による）
- デフォルトベースURL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を
強制しない場合、どの値でも動作します）:

```bash
export SGLANG_API_KEY="sglang-local"
```

次にモデルを設定します（`/v1/models`が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細は[/providers/sglang](/ja-JP/providers/sglang)を参照してください。

### ローカルプロキシ（LM Studio、vLLM、LiteLLMなど）

例（OpenAI互換）:

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

注:

- カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens`は任意です。
  省略した場合、OpenClawは次をデフォルトにします:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: プロキシ/モデルの上限に合った明示的な値を設定してください。
- 非ネイティブエンドポイント上の`api: "openai-completions"`（ホストが`api.openai.com`ではない、空でない`baseUrl`）では、未対応の`developer`ロールによるプロバイダー400エラーを避けるため、OpenClawは`compat.supportsDeveloperRole: false`を強制します。
- プロキシ型のOpenAI互換ルートでは、ネイティブOpenAI専用のリクエスト
  整形もスキップされます。`service_tier`なし、Responses `store`なし、prompt-cacheヒントなし、
  OpenAI reasoning互換ペイロード整形なし、非表示のOpenClaw attribution
  ヘッダーもありません。
- `baseUrl`が空または省略されている場合、OpenClawはデフォルトのOpenAI動作（`api.openai.com`に解決される）を維持します。
- 安全のため、明示的な`compat.supportsDeveloperRole: true`も、非ネイティブ`openai-completions`エンドポイントでは引き続き上書きされます。

## CLIの例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

あわせて参照: 設定例の詳細は[/gateway/configuration](/ja-JP/gateway/configuration)を参照してください。

## 関連

- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行動作
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — モデル設定キー
- [Providers](/ja-JP/providers) — プロバイダーごとのセットアップガイド
