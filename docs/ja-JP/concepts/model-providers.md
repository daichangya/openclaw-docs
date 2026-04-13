---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要です
    - モデルプロバイダー用の設定例やCLIオンボーディングコマンドが必要です
summary: 設定例とCLIフローを含むモデルプロバイダーの概要
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-13T08:50:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ba688c4b4366eec07667571e835d4cfeee684896e2ffae11d601b5fa0a4b98
    source_path: concepts/model-providers.md
    workflow: 15
---

# モデルプロバイダー

このページでは**LLM/モデルプロバイダー**を扱います（WhatsApp/Telegramのようなチャットチャネルではありません）。
モデル選択ルールについては、[/concepts/models](/ja-JP/concepts/models)を参照してください。

## クイックルール

- モデル参照は`provider/model`を使います（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models`を設定すると、それが許可リストになります。
- CLIヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- フォールバックのランタイムルール、クールダウンプローブ、セッションオーバーライドの永続化については、[/concepts/model-failover](/ja-JP/concepts/model-failover)に記載されています。
- `models.providers.*.models[].contextWindow`はネイティブなモデルメタデータです。`models.providers.*.models[].contextTokens`は実効ランタイム上限です。
- Provider Plugin は`registerProvider({ catalog })`を介してモデルカタログを注入できます。OpenClawはその出力を`models.providers`にマージしてから`models.json`を書き込みます。
- プロバイダーマニフェストでは`providerAuthEnvVars`と`providerAuthAliases`を宣言できます。これにより、汎用の環境変数ベース認証プローブやプロバイダーバリアントでPluginランタイムをロードする必要がなくなります。残っているコアの環境変数マップは、非Plugin/コアプロバイダー用と、AnthropicのAPIキー優先オンボーディングのようないくつかの汎用優先順位ケース用だけになりました。
- Provider Plugin は、`normalizeModelId`、`normalizeTransport`、`normalizeConfig`、`applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、`resolveSyntheticAuth`、`shouldDeferSyntheticProfileAuth`、`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`contributeResolvedModelCompat`、`capabilities`、`normalizeToolSchemas`、`inspectToolSchemas`、`resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、`resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、`createEmbeddingProvider`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`matchesContextOverflowError`、`classifyFailoverReason`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`、`onModelSelected`を通じて、プロバイダーのランタイム動作も所有できます。
- 注: プロバイダーランタイムの`capabilities`は共有ランナーメタデータです（プロバイダーファミリー、transcript/toolingの癖、transport/cacheのヒント）。これは、Pluginが何を登録するか（テキスト推論、音声など）を説明する[公開 capability モデル](/ja-JP/plugins/architecture#public-capability-model)とは別物です。
- バンドル版の`codex`プロバイダーは、バンドル版Codexエージェントハーネスと組みになっています。Codex所有のログイン、モデル検出、ネイティブなスレッド再開、アプリサーバー実行が必要な場合は、`codex/gpt-*`を使ってください。通常の`openai/gpt-*`参照は引き続きOpenAIプロバイダーと通常のOpenClawプロバイダーtransportを使います。Codex専用デプロイでは、`agents.defaults.embeddedHarness.fallback: "none"`で自動PIフォールバックを無効化できます。詳しくは[Codex Harness](/ja-JP/plugins/codex-harness)を参照してください。

## Plugin所有のプロバイダー動作

Provider Plugin は、OpenClawが汎用推論ループを維持したまま、プロバイダー固有ロジックの大半を所有できるようになりました。

典型的な分担:

- `auth[].run` / `auth[].runNonInteractive`: プロバイダーが`openclaw onboard`、`openclaw models auth`、ヘッドレスセットアップ向けのオンボーディング/ログインフローを所有
- `wizard.setup` / `wizard.modelPicker`: プロバイダーが認証方式ラベル、レガシーエイリアス、オンボーディングの許可リストヒント、オンボーディング/モデルピッカー内のセットアップ項目を所有
- `catalog`: プロバイダーが`models.providers`に現れる
- `normalizeModelId`: プロバイダーが、ルックアップや正規化の前にレガシー/プレビューのモデルIDを正規化
- `normalizeTransport`: プロバイダーが、汎用モデル組み立ての前にtransportファミリーの`api` / `baseUrl`を正規化。OpenClawはまず一致したプロバイダーを確認し、その後、実際にtransportを変更するものが見つかるまで、他のhook対応Provider Plugin を確認します
- `normalizeConfig`: プロバイダーが、ランタイムで使う前に`models.providers.<id>`設定を正規化。OpenClawはまず一致したプロバイダーを確認し、その後、実際に設定を変更するものが見つかるまで、他のhook対応Provider Plugin を確認します。どのプロバイダーhookも設定を書き換えなかった場合、バンドルされているGoogleファミリーのヘルパーが引き続き対応するGoogleプロバイダー項目を正規化します。
- `applyNativeStreamingUsageCompat`: プロバイダーが、設定プロバイダー向けに、エンドポイント駆動のネイティブなストリーミング使用量互換リライトを適用
- `resolveConfigApiKey`: プロバイダーが、完全なランタイム認証ロードを強制せずに、設定プロバイダー向けの環境変数マーカー認証を解決。`amazon-bedrock`にはここに組み込みのAWS環境変数マーカーリゾルバーもありますが、Bedrockのランタイム認証自体はAWS SDKのデフォルトチェーンを使います。
- `resolveSyntheticAuth`: プロバイダーが、平文シークレットを永続化せずに、ローカル/セルフホストやその他の設定ベース認証の可用性を公開可能
- `shouldDeferSyntheticProfileAuth`: プロバイダーが、保存済みのsynthetic profileプレースホルダーを、環境変数/設定ベース認証より低い優先順位として扱うよう指定可能
- `resolveDynamicModel`: プロバイダーが、まだローカル静的カタログに存在しないモデルIDを受け入れる
- `prepareDynamicModel`: プロバイダーが、動的解決を再試行する前にメタデータ更新を必要とする
- `normalizeResolvedModel`: プロバイダーが、transportまたはbase URLのリライトを必要とする
- `contributeResolvedModelCompat`: プロバイダーが、他の互換transport経由で届いた場合でも、そのベンダーモデル向け互換フラグを提供する
- `capabilities`: プロバイダーがtranscript/tooling/プロバイダーファミリーの癖を公開
- `normalizeToolSchemas`: プロバイダーが、埋め込みランナーが参照する前にツールスキーマを整形
- `inspectToolSchemas`: プロバイダーが、正規化後にtransport固有のスキーマ警告を提示
- `resolveReasoningOutputMode`: プロバイダーが、ネイティブまたはタグ付きのreasoning出力契約を選択
- `prepareExtraParams`: プロバイダーが、モデルごとのリクエストパラメータをデフォルト化または正規化
- `createStreamFn`: プロバイダーが、通常のストリーム経路を完全にカスタムなtransportに置き換える
- `wrapStreamFn`: プロバイダーが、リクエストヘッダー/ボディ/モデル互換ラッパーを適用
- `resolveTransportTurnState`: プロバイダーが、ターンごとのネイティブtransportヘッダーまたはメタデータを提供
- `resolveWebSocketSessionPolicy`: プロバイダーが、ネイティブWebSocketセッションヘッダーまたはセッションクールダウンポリシーを提供
- `createEmbeddingProvider`: プロバイダーが、コアのembeddingスイッチボードではなくProvider Plugin に属するべきメモリembedding動作を所有
- `formatApiKey`: プロバイダーが、保存済み認証プロファイルをtransportが期待するランタイム`apiKey`文字列に整形
- `refreshOAuth`: 共有`pi-ai`リフレッシャーでは不十分な場合に、プロバイダーがOAuthリフレッシュを所有
- `buildAuthDoctorHint`: OAuthリフレッシュ失敗時に、プロバイダーが修復ガイダンスを追加
- `matchesContextOverflowError`: プロバイダーが、汎用ヒューリスティクスでは見落とすプロバイダー固有のコンテキストウィンドウ超過エラーを認識
- `classifyFailoverReason`: プロバイダーが、プロバイダー固有の生transport/APIエラーを、レート制限や過負荷などのフェイルオーバー理由にマップ
- `isCacheTtlEligible`: プロバイダーが、どの上流モデルIDがプロンプトキャッシュTTLをサポートするかを判定
- `buildMissingAuthMessage`: プロバイダーが、汎用の認証ストアエラーをプロバイダー固有の復旧ヒントに置き換える
- `suppressBuiltInModel`: プロバイダーが、古い上流行を非表示にし、直接解決失敗時にベンダー所有のエラーを返せる
- `augmentModelCatalog`: プロバイダーが、検出と設定マージの後にsynthetic/finalカタログ行を追加
- `isBinaryThinking`: プロバイダーが、二値のオン/オフthinking UXを所有
- `supportsXHighThinking`: プロバイダーが、選択したモデルで`xhigh`を有効化
- `resolveDefaultThinkingLevel`: プロバイダーが、モデルファミリー向けのデフォルト`/think`ポリシーを所有
- `applyConfigDefaults`: プロバイダーが、認証モード、環境変数、またはモデルファミリーに基づいて、設定具体化中にプロバイダー固有のグローバルデフォルトを適用
- `isModernModelRef`: プロバイダーが、live/smokeの優先モデル照合を所有
- `prepareRuntimeAuth`: プロバイダーが、設定済みクレデンシャルを短命のランタイムトークンに変換
- `resolveUsageAuth`: プロバイダーが、`/usage`および関連するステータス/レポート画面向けの使用量/クォータ認証情報を解決
- `fetchUsageSnapshot`: プロバイダーが、使用量エンドポイントの取得/解析を所有し、コアは引き続き要約シェルと整形を所有
- `onModelSelected`: プロバイダーが、テレメトリーやプロバイダー所有のセッション記録など、選択後の副作用を実行

現在のバンドル例:

- `anthropic`: Claude 4.6の前方互換フォールバック、認証修復ヒント、使用量エンドポイント取得、cache-TTL/プロバイダーファミリーメタデータ、認証対応のグローバル設定デフォルト
- `amazon-bedrock`: Bedrock固有のスロットル/未準備エラー向けに、プロバイダー所有のコンテキスト超過判定とフェイルオーバー理由分類を提供し、さらにClaude専用のリプレイポリシーガード用に共有の`anthropic-by-model`リプレイファミリーも提供
- `anthropic-vertex`: Anthropic-messageトラフィック向けのClaude専用リプレイポリシーガード
- `openrouter`: モデルIDの透過処理、リクエストラッパー、プロバイダーcapabilityヒント、プロキシGeminiトラフィック上でのGemini thought-signatureサニタイズ、`openrouter-thinking`ストリームファミリーを通じたプロキシreasoning注入、ルーティングメタデータ転送、cache-TTLポリシー
- `github-copilot`: オンボーディング/デバイスログイン、前方互換モデルフォールバック、Claude-thinking transcriptヒント、ランタイムトークン交換、使用量エンドポイント取得
- `openai`: GPT-5.4の前方互換フォールバック、直接OpenAI transport正規化、Codex対応の認証欠落ヒント、Spark抑制、synthetic OpenAI/Codexカタログ行、thinking/live-modelポリシー、usage-tokenエイリアス正規化（`input` / `output`および`prompt` / `completion`ファミリー）、ネイティブOpenAI/Codexラッパー用の共有`openai-responses-defaults`ストリームファミリー、プロバイダーファミリーメタデータ、`gpt-image-1`向けのバンドル画像生成プロバイダー登録、`sora-2`向けのバンドル動画生成プロバイダー登録
- `google`と`google-gemini-cli`: Gemini 3.1の前方互換フォールバック、ネイティブGeminiリプレイ検証、ブートストラップリプレイサニタイズ、タグ付きreasoning出力モード、modern-modelマッチング、Gemini image-previewモデル向けのバンドル画像生成プロバイダー登録、Veoモデル向けのバンドル動画生成プロバイダー登録。Gemini CLI OAuthはさらに、認証プロファイルトークン整形、usage-token解析、使用量画面向けクォータエンドポイント取得も所有します
- `moonshot`: 共有transport、Plugin所有のthinkingペイロード正規化
- `kilocode`: 共有transport、Plugin所有のリクエストヘッダー、reasoningペイロード正規化、プロキシGemini thought-signatureサニタイズ、cache-TTLポリシー
- `zai`: GLM-5の前方互換フォールバック、`tool_stream`デフォルト、cache-TTLポリシー、binary-thinking/live-modelポリシー、使用量認証 + クォータ取得。未知の`glm-5*` IDは、バンドルされた`glm-4.7`テンプレートから合成されます
- `xai`: ネイティブResponses transport正規化、Grok高速バリアント向け`/fast`エイリアス書き換え、デフォルト`tool_stream`、xAI固有のtool-schema / reasoning-payloadクリーンアップ、`grok-imagine-video`向けのバンドル動画生成プロバイダー登録
- `mistral`: Plugin所有のcapabilityメタデータ
- `opencode`と`opencode-go`: Plugin所有のcapabilityメタデータ + プロキシGemini thought-signatureサニタイズ
- `alibaba`: `alibaba/wan2.6-t2v`のような直接Wanモデル参照向けのPlugin所有動画生成カタログ
- `byteplus`: Plugin所有カタログ + Seedanceのtext-to-video/image-to-videoモデル向けバンドル動画生成プロバイダー登録
- `fal`: ホスト型サードパーティー動画モデル向けのバンドル動画生成プロバイダー登録、およびFLUX画像モデル向けのホスト型サードパーティー画像生成プロバイダー登録 + ホスト型サードパーティー動画モデル向けのバンドル動画生成プロバイダー登録
- `cloudflare-ai-gateway`、`huggingface`、`kimi`、`nvidia`、`qianfan`、`stepfun`、`synthetic`、`venice`、`vercel-ai-gateway`、`volcengine`: Plugin所有カタログのみ
- `qwen`: テキストモデル向けPlugin所有カタログ + そのマルチモーダル画面向けの共有media-understandingおよび動画生成プロバイダー登録。Qwen動画生成は、`wan2.6-t2v`や`wan2.7-r2v`のようなバンドルWanモデルとともに、標準DashScope動画エンドポイントを使用します
- `runway`: `gen4.5`のようなネイティブRunwayタスクベースモデル向けのPlugin所有動画生成プロバイダー登録
- `minimax`: Plugin所有カタログ、Hailuo動画モデル向けのバンドル動画生成プロバイダー登録、`image-01`向けのバンドル画像生成プロバイダー登録、ハイブリッドAnthropic/OpenAIリプレイポリシー選択、使用量認証/スナップショットロジック
- `together`: Plugin所有カタログ + Wan動画モデル向けのバンドル動画生成プロバイダー登録
- `xiaomi`: Plugin所有カタログ + 使用量認証/スナップショットロジック

バンドル版の`openai` Plugin は現在、`openai`と`openai-codex`の両方のプロバイダーIDを所有しています。

これで、OpenClawの通常transportにまだ適合するプロバイダーをカバーしています。完全にカスタムなリクエスト実行子を必要とするプロバイダーは、別のより深い拡張サーフェスになります。

## APIキーのローテーション

- 選択されたプロバイダー向けに、汎用的なプロバイダーローテーションをサポートします。
- 複数キーの設定方法:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のライブオーバーライド、最優先）
  - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りの一覧）
  - `<PROVIDER>_API_KEY`（プライマリキー）
  - `<PROVIDER>_API_KEY_*`（番号付き一覧。例: `<PROVIDER>_API_KEY_1`）
- Googleプロバイダーでは、`GOOGLE_API_KEY`もフォールバックとして含まれます。
- キー選択順は優先順位を保持しつつ、重複値を排除します。
- リクエストは、レート制限応答時にのみ次のキーで再試行されます（例: `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、または定期的な使用量上限メッセージ）。
- レート制限以外の失敗は即座に失敗し、キーローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダー（pi-ai catalog）

OpenClawにはpi-ai catalogが同梱されています。これらのプロバイダーでは`models.providers`設定は**不要**です。認証を設定してモデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、加えて`OPENCLAW_LIVE_OPENAI_KEY`（単一オーバーライド）
- モデル例: `openai/gpt-5.4`、`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトtransportは`auto`です（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは`agents.defaults.models["openai/<model>"].params.transport`で行います（`"sse"`、`"websocket"`、または`"auto"`）
- OpenAI Responses WebSocketウォームアップは、`params.openaiWsWarmup`（`true`/`false`）でデフォルト有効です
- OpenAI priority processingは、`agents.defaults.models["openai/<model>"].params.serviceTier`で有効化できます
- `/fast`と`params.fastMode`は、直接`openai/*` Responsesリクエストを`api.openai.com`上の`service_tier=priority`にマップします
- 共有の`/fast`トグルではなく明示的なtierを使いたい場合は、`params.serviceTier`を使用してください
- 隠しOpenClaw attributionヘッダー（`originator`、`version`、`User-Agent`）は、`api.openai.com`へのネイティブOpenAIトラフィックにのみ適用され、汎用のOpenAI互換プロキシには適用されません
- ネイティブOpenAIルートでは、Responsesの`store`、プロンプトキャッシュヒント、OpenAI reasoning互換のペイロード整形も維持されます。プロキシルートでは維持されません
- `openai/gpt-5.3-codex-spark`は、ライブOpenAI APIが拒否するため、OpenClawでは意図的に抑制されています。SparkはCodex専用として扱われます

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、加えて`OPENCLAW_LIVE_ANTHROPIC_KEY`（単一オーバーライド）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開Anthropicリクエストは、共有の`/fast`トグルと`params.fastMode`もサポートします。これには`api.anthropic.com`へ送信されるAPIキー認証およびOAuth認証トラフィックが含まれます。OpenClawはこれをAnthropicの`service_tier`（`auto` vs `standard_only`）にマップします
- Anthropic注記: Anthropicスタッフから、OpenClawスタイルのClaude CLI利用は再び許可されていると伝えられているため、Anthropicが新しいポリシーを公開しない限り、OpenClawはClaude CLI再利用と`claude -p`利用をこの統合向けに認可済みとして扱います。
- Anthropic setup-tokenも引き続きサポート対象のOpenClawトークン経路として利用可能ですが、OpenClawは現在、利用可能であればClaude CLI再利用と`claude -p`を優先します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code（Codex）

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- モデル例: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトtransportは`auto`です（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは`agents.defaults.models["openai-codex/<model>"].params.transport`で行います（`"sse"`、`"websocket"`、または`"auto"`）
- `params.serviceTier`も、ネイティブCodex Responsesリクエスト（`chatgpt.com/backend-api`）で転送されます
- 隠しOpenClaw attributionヘッダー（`originator`、`version`、`User-Agent`）は、`chatgpt.com/backend-api`へのネイティブCodexトラフィックにのみ付与され、汎用のOpenAI互換プロキシには付与されません
- 直接`openai/*`と同じ`/fast`トグルおよび`params.fastMode`設定を共有し、OpenClawはこれを`service_tier=priority`にマップします
- `openai-codex/gpt-5.3-codex-spark`は、Codex OAuth catalogが公開している場合は引き続き利用可能です。利用権限に依存します
- `openai-codex/gpt-5.4`は、ネイティブの`contextWindow = 1050000`とデフォルトのランタイム`contextTokens = 272000`を維持します。ランタイム上限は`models.providers.openai-codex.models[].contextTokens`で上書きできます
- ポリシー注記: OpenAI Codex OAuthは、OpenClawのような外部ツール/ワークフロー向けに明示的にサポートされています

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

- [Qwen Cloud](/ja-JP/providers/qwen): Qwen Cloudプロバイダーサーフェス + Alibaba DashScopeおよびCoding Planエンドポイントマッピング
- [MiniMax](/ja-JP/providers/minimax): MiniMax Coding Plan OAuthまたはAPIキーアクセス
- [GLM Models](/ja-JP/providers/glm): Z.AI Coding Planまたは汎用APIエンドポイント

### OpenCode

- 認証: `OPENCODE_API_KEY`（または`OPENCODE_ZEN_API_KEY`）
- Zenランタイムプロバイダー: `opencode`
- Goランタイムプロバイダー: `opencode-go`
- モデル例: `opencode/claude-opus-4-6`、`opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（APIキー）

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY`
- 任意のローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY`フォールバック、加えて`OPENCLAW_LIVE_GEMINI_KEY`（単一オーバーライド）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview`を使う旧OpenClaw設定は、`google/gemini-3-flash-preview`に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 直接Gemini実行では、`agents.defaults.models["google/<model>"].params.cachedContent`（または旧`cached_content`）も受け付け、プロバイダーネイティブな`cachedContents/...`ハンドルを転送します。GeminiキャッシュヒットはOpenClawの`cacheRead`として表示されます

### Google VertexとGemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- 認証: Vertexはgcloud ADCを使用し、Gemini CLIは独自のOAuthフローを使用します
- 注意: OpenClawでのGemini CLI OAuthは非公式な統合です。サードパーティークライアントの使用後にGoogleアカウント制限がかかったという報告があります。利用する場合はGoogleの利用規約を確認し、重要でないアカウントを使ってください。
- Gemini CLI OAuthは、バンドル版`google` Plugin の一部として提供されます。
  - まずGemini CLIをインストールします:
    - `brew install gemini-cli`
    - または `npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
  - 注: `openclaw.json`にclient idやsecretを貼り付けることは**ありません**。CLIログインフローは、トークンをGatewayホスト上の認証プロファイルに保存します。
  - ログイン後にリクエストが失敗する場合は、Gatewayホストで`GOOGLE_CLOUD_PROJECT`または`GOOGLE_CLOUD_PROJECT_ID`を設定してください。
  - Gemini CLIのJSON応答は`response`から解析され、使用量は`stats`にフォールバックし、`stats.cached`はOpenClawの`cacheRead`に正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*`と`z-ai/*`は`zai/*`に正規化されます
  - `zai-api-key`は一致するZ.AIエンドポイントを自動検出します。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`は特定のサーフェスを強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベースURL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックcatalogには`kilocode/kilo/auto`が同梱されます。ライブの`https://api.kilo.ai/api/gateway/models`検出により、ランタイムcatalogがさらに拡張される場合があります。
- `kilocode/kilo/auto`の背後にある正確な上流ルーティングはKilo Gatewayが所有しており、OpenClawにハードコードされていません。

セットアップ詳細は[/providers/kilocode](/ja-JP/providers/kilocode)を参照してください。

### その他のバンドル版Provider Plugin

- OpenRouter: `openrouter`（`OPENROUTER_API_KEY`）
- モデル例: `openrouter/auto`
- OpenClawは、リクエストが実際に`openrouter.ai`を対象としている場合にのみ、OpenRouterの文書化されたapp-attributionヘッダーを適用します
- OpenRouter固有のAnthropic `cache_control`マーカーも同様に、任意のプロキシURLではなく、検証済みのOpenRouterルートにのみ適用されます
- OpenRouterは引き続きプロキシ型のOpenAI互換パス上にあるため、ネイティブOpenAI専用のリクエスト整形（`serviceTier`、Responsesの`store`、プロンプトキャッシュヒント、OpenAI reasoning互換ペイロード）は転送されません
- GeminiベースのOpenRouter参照では、プロキシGemini thought-signatureサニタイズのみが維持されます。ネイティブGeminiのリプレイ検証とブートストラップ書き換えは無効のままです
- Kilo Gateway: `kilocode`（`KILOCODE_API_KEY`）
- モデル例: `kilocode/kilo/auto`
- GeminiベースのKilo参照では、同じプロキシGemini thought-signatureサニタイズ経路が維持されます。`kilocode/kilo/auto`およびその他のプロキシreasoning非対応ヒントでは、プロキシreasoning注入はスキップされます
- MiniMax: `minimax`（APIキー）と`minimax-portal`（OAuth）
- 認証: `minimax`には`MINIMAX_API_KEY`、`minimax-portal`には`MINIMAX_OAUTH_TOKEN`または`MINIMAX_API_KEY`
- モデル例: `minimax/MiniMax-M2.7`または`minimax-portal/MiniMax-M2.7`
- MiniMaxのオンボーディング/APIキー設定では、`input: ["text", "image"]`を持つ明示的なM2.7モデル定義を書き込みます。バンドル版プロバイダーcatalogでは、そのプロバイダー設定が具体化されるまで、チャット参照はテキスト専用のままです
- Moonshot: `moonshot`（`MOONSHOT_API_KEY`）
- モデル例: `moonshot/kimi-k2.5`
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
  - ネイティブのバンドル版xAIリクエストはxAI Responsesパスを使用します
  - `/fast`または`params.fastMode: true`は、`grok-3`、`grok-3-mini`、`grok-4`、`grok-4-0709`をそれぞれの`*-fast`バリアントに書き換えます
  - `tool_stream`はデフォルトで有効です。無効にするには、`agents.defaults.models["xai/<model>"].params.tool_stream`を`false`に設定してください
- Mistral: `mistral`（`MISTRAL_API_KEY`）
- モデル例: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq`（`GROQ_API_KEY`）
- Cerebras: `cerebras`（`CEREBRAS_API_KEY`）
  - Cerebras上のGLMモデルは`zai-glm-4.7`および`zai-glm-4.6`というIDを使用します。
  - OpenAI互換ベースURL: `https://api.cerebras.ai/v1`。
- GitHub Copilot: `github-copilot`（`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`）
- Hugging Face Inferenceのモデル例: `huggingface/deepseek-ai/DeepSeek-R1`。CLI: `openclaw onboard --auth-choice huggingface-api-key`。[Hugging Face (Inference)](/ja-JP/providers/huggingface)を参照してください。

## `models.providers`経由のプロバイダー（カスタム/ベースURL）

`models.providers`（または`models.json`）を使うと、**カスタム**プロバイダーやOpenAI/Anthropic互換プロキシを追加できます。

以下のバンドル版Provider Plugin の多くは、すでにデフォルトcatalogを公開しています。
デフォルトのベースURL、ヘッダー、またはモデル一覧を上書きしたい場合にのみ、明示的な`models.providers.<id>`項目を使用してください。

### Moonshot AI（Kimi）

Moonshotはバンドル版Provider Plugin として提供されます。通常は組み込みプロバイダーを使い、ベースURLまたはモデルメタデータを上書きする必要がある場合にのみ、明示的な`models.providers.moonshot`項目を追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` または `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2モデルID:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
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

旧来の`kimi/k2p5`も互換モデルIDとして引き続き受け付けられます。

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

オンボーディングはデフォルトでcodingサーフェスを選びますが、一般的な`volcengine/*`catalogも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、Volcengineの認証選択は`volcengine/*`行と`volcengine-plan/*`行の両方を優先します。これらのモデルがまだ読み込まれていない場合、OpenClawは空のプロバイダースコープ付きピッカーを表示する代わりに、フィルターなしcatalogへフォールバックします。

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

オンボーディングはデフォルトでcodingサーフェスを選びますが、一般的な`byteplus/*`catalogも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、BytePlusの認証選択は`byteplus/*`行と`byteplus-plan/*`行の両方を優先します。これらのモデルがまだ読み込まれていない場合、OpenClawは空のプロバイダースコープ付きピッカーを表示する代わりに、フィルターなしcatalogへフォールバックします。

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
- MiniMax APIキー（Global）: `--auth-choice minimax-global-api`
- MiniMax APIキー（CN）: `--auth-choice minimax-cn-api`
- 認証: `minimax`には`MINIMAX_API_KEY`、`minimax-portal`には`MINIMAX_OAUTH_TOKEN`または`MINIMAX_API_KEY`

セットアップ詳細、モデルオプション、設定スニペットについては[/providers/minimax](/ja-JP/providers/minimax)を参照してください。

MiniMaxのAnthropic互換ストリーミングパスでは、OpenClawは明示的に設定しない限りthinkingをデフォルトで無効にし、`/fast on`は`MiniMax-M2.7`を`MiniMax-M2.7-highspeed`に書き換えます。

Plugin所有のcapability分割:

- テキスト/チャットのデフォルトは`minimax/MiniMax-M2.7`のままです
- 画像生成は`minimax/image-01`または`minimax-portal/image-01`です
- 画像理解は、両方のMiniMax認証パスでPlugin所有の`MiniMax-VL-01`です
- Web検索は引き続きプロバイダーID `minimax`に残ります

### LM Studio

LM Studioは、ネイティブAPIを使用するバンドル版Provider Plugin として提供されます。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- デフォルト推論ベースURL: `http://localhost:1234/v1`

次にモデルを設定します（`http://localhost:1234/api/v1/models`が返すIDの1つに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClawは、検出 + 自動ロードにはLM Studioネイティブの`/api/v1/models`と`/api/v1/models/load`を使用し、デフォルトでは推論に`/v1/chat/completions`を使用します。セットアップとトラブルシューティングについては[/providers/lmstudio](/ja-JP/providers/lmstudio)を参照してください。

### Ollama

Ollamaはバンドル版Provider Plugin として提供され、OllamaネイティブAPIを使用します。

- プロバイダー: `ollama`
- 認証: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollamaをインストールしてから、モデルをpullします:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY`でオプトインすると、Ollamaはローカルの`http://127.0.0.1:11434`で検出され、バンドル版Provider Plugin がOllamaを`openclaw onboard`とモデルピッカーに直接追加します。オンボーディング、クラウド/ローカルモード、カスタム設定については[/providers/ollama](/ja-JP/providers/ollama)を参照してください。

### vLLM

vLLMは、ローカル/セルフホストのOpenAI互換サーバー向けバンドル版Provider Plugin として提供されます。

- プロバイダー: `vllm`
- 認証: 任意（サーバーに依存）
- デフォルトベースURL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合は任意の値で動作します）:

```bash
export VLLM_API_KEY="vllm-local"
```

次にモデルを設定します（`/v1/models`が返すIDの1つに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳しくは[/providers/vllm](/ja-JP/providers/vllm)を参照してください。

### SGLang

SGLangは、高速なセルフホストOpenAI互換サーバー向けバンドル版Provider Plugin として提供されます。

- プロバイダー: `sglang`
- 認証: 任意（サーバーに依存）
- デフォルトベースURL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合は任意の値で動作します）:

```bash
export SGLANG_API_KEY="sglang-local"
```

次にモデルを設定します（`/v1/models`が返すIDの1つに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳しくは[/providers/sglang](/ja-JP/providers/sglang)を参照してください。

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
  省略した場合、OpenClawのデフォルトは次のとおりです:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: プロキシ/モデルの上限に一致する明示的な値を設定してください。
- ネイティブでないエンドポイント上の`api: "openai-completions"`では（ホストが`api.openai.com`ではない空でない`baseUrl`）、OpenClawは、未対応の`developer`ロールによるプロバイダー400エラーを避けるため、`compat.supportsDeveloperRole: false`を強制します。
- プロキシ型のOpenAI互換ルートでも、ネイティブOpenAI専用のリクエスト整形はスキップされます。`service_tier`、Responsesの`store`、プロンプトキャッシュヒント、OpenAI reasoning互換ペイロード整形、隠しOpenClaw attributionヘッダーはいずれも送信されません。
- `baseUrl`が空または省略されている場合、OpenClawはデフォルトのOpenAI動作（`api.openai.com`に解決）を維持します。
- 安全のため、ネイティブでない`openai-completions`エンドポイントでは、明示的な`compat.supportsDeveloperRole: true`も引き続き上書きされます。

## CLIの例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

関連項目: 完全な設定例については[/gateway/configuration](/ja-JP/gateway/configuration)を参照してください。

## 関連

- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行動作
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — モデル設定キー
- [Providers](/ja-JP/providers) — プロバイダーごとのセットアップガイド
