---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要な場合
    - モデルプロバイダー向けの設定例やCLIオンボーディングコマンドを知りたい場合
summary: モデルプロバイダーの概要、設定例、CLIフロー
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-05T12:43:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d8f56a2a5319de03f7b86e7b19b9a89e7023f757930b5b5949568f680352a3a
    source_path: concepts/model-providers.md
    workflow: 15
---

# モデルプロバイダー

このページでは**LLM/モデルプロバイダー**を扱います（WhatsApp/Telegramのようなチャットチャネルではありません）。
モデル選択ルールについては、[/concepts/models](/concepts/models) を参照してください。

## クイックルール

- モデル参照は `provider/model` を使います（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models` を設定すると、それがallowlistになります。
- CLIヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- フォールバックのランタイムルール、クールダウンプローブ、セッション上書きの永続化については、[/concepts/model-failover](/concepts/model-failover) に記載されています。
- `models.providers.*.models[].contextWindow` はネイティブなモデルメタデータです。
  `models.providers.*.models[].contextTokens` は実効ランタイム上限です。
- プロバイダープラグインは `registerProvider({ catalog })` を通じてモデルカタログを注入できます。
  OpenClawはその出力を `models.providers` にマージしてから
  `models.json` を書き込みます。
- プロバイダーマニフェストは `providerAuthEnvVars` を宣言できるため、汎用のenvベース認証プローブでプラグインランタイムを読み込む必要がありません。残るコアのenv-varマップは、現在では非プラグイン/コアプロバイダー用と、AnthropicのAPIキーファーストなオンボーディングのような一部の汎用優先順位ケース用だけです。
- プロバイダープラグインは、`normalizeModelId`、`normalizeTransport`、`normalizeConfig`、
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
  `augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、
  `resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、
  `prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`、および
  `onModelSelected` を通じてプロバイダーランタイム動作も所有できます。
- 注: プロバイダーランタイムの `capabilities` は共有ランナーメタデータ
  （プロバイダーファミリー、トランスクリプト/ツールの癖、トランスポート/キャッシュのヒント）です。これは、プラグインが何を登録するか（テキスト推論、音声など）を説明する[公開capabilityモデル](/plugins/architecture#public-capability-model)とは別物です。

## プラグイン所有のプロバイダー動作

OpenClawが汎用推論ループを維持しつつ、プロバイダープラグインがほとんどのプロバイダー固有ロジックを所有できるようになりました。

一般的な分担:

- `auth[].run` / `auth[].runNonInteractive`: プロバイダーが `openclaw onboard`、`openclaw models auth`、ヘッドレスセットアップ向けのオンボーディング/ログインフローを所有
- `wizard.setup` / `wizard.modelPicker`: プロバイダーが認証選択ラベル、レガシーエイリアス、オンボーディングallowlistヒント、オンボーディング/モデルピッカー内のセットアップ項目を所有
- `catalog`: プロバイダーが `models.providers` に表示される
- `normalizeModelId`: プロバイダーがルックアップや正規化の前にレガシー/プレビューモデルIDを正規化
- `normalizeTransport`: プロバイダーが汎用モデル組み立て前にトランスポート系の `api` / `baseUrl` を正規化。OpenClawはまず一致したプロバイダーを確認し、その後、実際にトランスポートを変更するまでほかのhook対応プロバイダープラグインを順に確認します
- `normalizeConfig`: プロバイダーがランタイム使用前に `models.providers.<id>` 設定を正規化。OpenClawはまず一致したプロバイダーを確認し、その後、実際に設定を変更するまでほかのhook対応プロバイダープラグインを順に確認します。どのプロバイダーフックも設定を書き換えない場合、バンドルされたGoogle系ヘルパーが引き続き対応するGoogleプロバイダーエントリーを正規化します。
- `applyNativeStreamingUsageCompat`: プロバイダーが設定済みプロバイダー向けに、エンドポイント駆動のネイティブなstreaming-usage互換書き換えを適用
- `resolveConfigApiKey`: プロバイダーが、完全なランタイム認証の読み込みを強制せずに、設定済みプロバイダー向けのenv-marker認証を解決。`amazon-bedrock` もここで組み込みのAWS env-markerリゾルバーを持ちますが、Bedrockランタイム認証自体はAWS SDKのデフォルトチェーンを使います。
- `resolveSyntheticAuth`: プロバイダーが、平文シークレットを永続化せずに、local/self-hostedやその他の設定ベース認証の利用可能性を公開できる
- `shouldDeferSyntheticProfileAuth`: プロバイダーが、保存されたsynthetic profile placeholderをenv/configベース認証よりも低優先度として扱える
- `resolveDynamicModel`: プロバイダーが、まだローカルの静的カタログに存在しないモデルIDを受け入れる
- `prepareDynamicModel`: プロバイダーが、動的解決を再試行する前にメタデータ更新を必要とする
- `normalizeResolvedModel`: プロバイダーが、トランスポートまたはbase URLの書き換えを必要とする
- `contributeResolvedModelCompat`: プロバイダーが、別の互換トランスポート経由で届く場合でも、自社ベンダーモデル向けのcompatフラグを提供する
- `capabilities`: プロバイダーがトランスクリプト/ツール/プロバイダーファミリーの癖を公開する
- `normalizeToolSchemas`: プロバイダーが埋め込みランナーに渡る前にツールスキーマを整える
- `inspectToolSchemas`: プロバイダーが正規化後にトランスポート固有のスキーマ警告を表面化する
- `resolveReasoningOutputMode`: プロバイダーがネイティブまたはタグ付きのreasoning-output契約を選択する
- `prepareExtraParams`: プロバイダーがモデルごとのリクエストパラメータをデフォルト化または正規化する
- `createStreamFn`: プロバイダーが通常のストリーム経路を完全カスタムのトランスポートに置き換える
- `wrapStreamFn`: プロバイダーがリクエストヘッダー/本文/モデル互換ラッパーを適用する
- `resolveTransportTurnState`: プロバイダーがターンごとのネイティブトランスポートヘッダーまたはメタデータを提供する
- `resolveWebSocketSessionPolicy`: プロバイダーがネイティブWebSocketセッションヘッダーまたはセッションクールダウンポリシーを提供する
- `createEmbeddingProvider`: プロバイダーが、それがコアのembedding switchboardではなくプロバイダープラグイン側に属すべき場合に、メモリembedding動作を所有する
- `formatApiKey`: プロバイダーが保存済み認証プロファイルを、トランスポートが期待するランタイム `apiKey` 文字列に整形する
- `refreshOAuth`: 共有の `pi-ai` リフレッシャーで足りない場合に、プロバイダーがOAuth更新を所有する
- `buildAuthDoctorHint`: プロバイダーがOAuth更新失敗時に修復ガイダンスを追加する
- `matchesContextOverflowError`: プロバイダーが、汎用ヒューリスティクスでは見逃すプロバイダー固有のcontext-window overflowエラーを認識する
- `classifyFailoverReason`: プロバイダーが、プロバイダー固有の生のtransport/APIエラーを、rate limitやoverloadのようなfailover reasonにマッピングする
- `isCacheTtlEligible`: プロバイダーが、どのupstream model idがprompt-cache TTLをサポートするかを判定する
- `buildMissingAuthMessage`: プロバイダーが、汎用auth-storeエラーをプロバイダー固有の復旧ヒントに置き換える
- `suppressBuiltInModel`: プロバイダーが古いupstream行を隠し、直接解決失敗に対してベンダー所有のエラーを返せる
- `augmentModelCatalog`: プロバイダーが検出と設定マージ後にsynthetic/final catalog行を追加する
- `isBinaryThinking`: プロバイダーが二値のオン/オフthinking UXを所有する
- `supportsXHighThinking`: プロバイダーが選択したモデルを `xhigh` に対応させる
- `resolveDefaultThinkingLevel`: プロバイダーがモデルファミリー向けのデフォルト `/think` ポリシーを所有する
- `applyConfigDefaults`: プロバイダーが、認証モード、env、またはモデルファミリーに基づいて、設定の具現化時にプロバイダー固有のグローバルデフォルトを適用する
- `isModernModelRef`: プロバイダーがlive/smoke向けの優先モデル一致を所有する
- `prepareRuntimeAuth`: プロバイダーが設定済み認証情報を短命のランタイムトークンに変換する
- `resolveUsageAuth`: プロバイダーが `/usage` および関連するstatus/reporting画面向けのusage/quota認証情報を解決する
- `fetchUsageSnapshot`: プロバイダーがusage endpointの取得/解析を所有し、コアはサマリーの外枠と整形を引き続き所有する
- `onModelSelected`: プロバイダーが、telemetryやプロバイダー所有のセッション管理のような選択後副作用を実行する

現在のバンドル例:

- `anthropic`: Claude 4.6のforward-compat fallback、auth repair hint、usage endpoint取得、cache-TTL/provider-family metadata、およびauth-awareなグローバル設定デフォルト
- `amazon-bedrock`: Bedrock固有のthrottle/not-readyエラーに対するプロバイダー所有のcontext-overflow一致とfailover reason分類、加えてAnthropicトラフィック上のClaude専用replay-policy guard向け共有 `anthropic-by-model` replay family
- `anthropic-vertex`: Anthropic-messageトラフィック上のClaude専用replay-policy guard
- `openrouter`: パススルーモデルID、リクエストラッパー、プロバイダーcapabilityヒント、プロキシGeminiトラフィック上のGemini thought-signatureサニタイズ、`openrouter-thinking` stream family経由のプロキシreasoning注入、ルーティングメタデータ転送、およびcache-TTLポリシー
- `github-copilot`: オンボーディング/デバイスログイン、forward-compat model fallback、Claude-thinking transcript hint、ランタイムトークン交換、およびusage endpoint取得
- `openai`: GPT-5.4のforward-compat fallback、直接のOpenAIトランスポート正規化、Codex対応のmissing-authヒント、Spark抑制、syntheticなOpenAI/Codex catalog行、thinking/live-model policy、usage-token alias正規化（`input` / `output` および `prompt` / `completion` ファミリー）、ネイティブOpenAI/Codexラッパー向け共有 `openai-responses-defaults` stream family、およびprovider-family metadata
- `google` と `google-gemini-cli`: Gemini 3.1のforward-compat fallback、ネイティブGemini replay validation、bootstrap replay sanitation、タグ付きreasoning-output mode、およびmodern-model matching。Gemini CLI OAuthは、usage画面向けにauth-profile token formatting、usage-token parsing、quota endpoint取得も所有します
- `moonshot`: 共有トランスポート、プラグイン所有のthinking payload正規化
- `kilocode`: 共有トランスポート、プラグイン所有のリクエストヘッダー、reasoning payload正規化、proxy-Gemini thought-signature sanitation、およびcache-TTLポリシー
- `zai`: GLM-5のforward-compat fallback、`tool_stream` デフォルト、cache-TTLポリシー、binary-thinking/live-model policy、およびusage auth + quota取得。未知の `glm-5*` IDはバンドルされた `glm-4.7` テンプレートから合成されます
- `xai`: ネイティブResponsesトランスポート正規化、Grok fastバリアント向け `/fast` エイリアス書き換え、デフォルト `tool_stream`、およびxAI固有のtool-schema / reasoning-payloadクリーンアップ
- `mistral`: プラグイン所有のcapability metadata
- `opencode` と `opencode-go`: プラグイン所有のcapability metadataに加え、proxy-Gemini thought-signature sanitation
- `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi`、
  `nvidia`、`qianfan`、`stepfun`、`synthetic`、`together`、`venice`、
  `vercel-ai-gateway`、および `volcengine`: プラグイン所有のcatalogのみ
- `qwen`: テキストモデル向けのプラグイン所有catalogに加え、そのマルチモーダル画面向けに共有のmedia-understandingおよびvideo-generation provider registration。Qwenの動画生成は、`wan2.6-t2v` や `wan2.7-r2v` などのバンドルWanモデルを含む標準DashScope video endpointを使用します
- `minimax`: プラグイン所有catalog、ハイブリッドAnthropic/OpenAI replay-policy選択、およびusage auth/snapshotロジック
- `xiaomi`: プラグイン所有catalogに加え、usage auth/snapshotロジック

バンドルされた `openai` プラグインは現在、`openai` と
`openai-codex` の両方のprovider idを所有しています。

これは、まだOpenClawの通常トランスポートに収まるプロバイダーを対象としています。完全にカスタムのリクエスト実行器を必要とするプロバイダーは、別のより深い拡張インターフェースです。

## APIキーのローテーション

- 選択されたプロバイダーで汎用プロバイダーローテーションをサポートします。
- 複数キーの設定方法:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` （単一のlive override、最優先）
  - `<PROVIDER>_API_KEYS` （カンマまたはセミコロン区切りのリスト）
  - `<PROVIDER>_API_KEY` （プライマリキー）
  - `<PROVIDER>_API_KEY_*` （番号付きリスト。例: `<PROVIDER>_API_KEY_1`）
- Googleプロバイダーでは、フォールバックとして `GOOGLE_API_KEY` も含まれます。
- キー選択順は優先順位を維持しつつ値を重複排除します。
- リクエストは、rate-limit応答の場合にのみ次のキーで再試行されます（たとえば `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many
concurrent requests`、`ThrottlingException`、`concurrency limit reached`、
  `workers_ai ... quota limit exceeded`、または定期的なusage-limitメッセージ）。
- rate-limit以外の失敗は即座に失敗し、キーローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダー（pi-ai catalog）

OpenClawにはpi-ai catalogが同梱されています。これらのプロバイダーでは
`models.providers` 設定は**不要**で、認証を設定してモデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY` （単一override）
- モデル例: `openai/gpt-5.4`、`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトのトランスポートは `auto` です（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport` （`"sse"`、`"websocket"`、または `"auto"`）で行います
- OpenAI Responses WebSocket warm-upは、デフォルトで `params.openaiWsWarmup` （`true`/`false`）により有効です
- OpenAI priority processingは `agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、`api.openai.com` への直接 `openai/*` Responsesリクエストを `service_tier=priority` にマップします
- 共有の `/fast` トグルではなく明示的なtierを使いたい場合は `params.serviceTier` を使用してください
- 非表示のOpenClaw attribution header（`originator`、`version`、
  `User-Agent`）は、汎用のOpenAI互換プロキシではなく、`api.openai.com` へのネイティブOpenAIトラフィックにのみ適用されます
- ネイティブOpenAIルートでは、Responsesの `store`、prompt-cacheヒント、OpenAI reasoning-compat payload shapingも保持されます。プロキシルートでは保持されません
- `openai/gpt-5.3-codex-spark` は、live OpenAI APIが拒否するため、OpenClawでは意図的に抑制されています。SparkはCodex専用として扱われます

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および `OPENCLAW_LIVE_ANTHROPIC_KEY` （単一override）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey` または `openclaw onboard --auth-choice anthropic-cli`
- 直接の公開Anthropicリクエストは、`api.anthropic.com` に送られるAPIキー認証トラフィックとOAuth認証トラフィックの両方で、共有の `/fast` トグルと `params.fastMode` をサポートします。OpenClawはこれをAnthropicの `service_tier` （`auto` または `standard_only`）にマップします
- 課金メモ: Anthropicの公開Claude Codeドキュメントでは、依然として直接のClaude Codeターミナル利用がClaudeプラン上限に含まれています。これとは別に、Anthropicは **2026年4月4日 12:00 PM PT / 8:00 PM BST** にOpenClawユーザーへ、**OpenClaw** のClaudeログイン経路はサードパーティーハーネス利用としてカウントされ、サブスクリプションとは別請求の **Extra Usage** が必要であると通知しました。
- Anthropic setup-tokenは、レガシー/手動のOpenClaw経路として再び利用可能です。この経路には **Extra Usage** が必要だとAnthropicがOpenClawユーザーへ通知した前提で使用してください。

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
- デフォルトのトランスポートは `auto` です（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは `agents.defaults.models["openai-codex/<model>"].params.transport` （`"sse"`、`"websocket"`、または `"auto"`）で行います
- `params.serviceTier` は、ネイティブCodex Responsesリクエスト（`chatgpt.com/backend-api`）でも転送されます
- 非表示のOpenClaw attribution header（`originator`、`version`、
  `User-Agent`）は、汎用のOpenAI互換プロキシではなく、
  `chatgpt.com/backend-api` へのネイティブCodexトラフィックにのみ付加されます
- 直接の `openai/*` と同じ `/fast` トグルと `params.fastMode` 設定を共有し、OpenClawはそれを `service_tier=priority` にマップします
- `openai-codex/gpt-5.3-codex-spark` は、Codex OAuth catalogが公開している場合は引き続き利用可能です。entitlement依存です
- `openai-codex/gpt-5.4` はネイティブの `contextWindow = 1050000` とデフォルトランタイムの `contextTokens = 272000` を維持します。ランタイム上限は `models.providers.openai-codex.models[].contextTokens` で上書きしてください
- ポリシーメモ: OpenAI Codex OAuthは、OpenClawのような外部ツール/ワークフロー向けに明示的にサポートされています

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

### そのほかのサブスクリプション型ホストオプション

- [Qwen Cloud](/providers/qwen): Qwen Cloudのプロバイダー画面に加え、Alibaba DashScopeおよびCoding Planエンドポイントのマッピング
- [MiniMax](/providers/minimax): MiniMax Coding Plan OAuthまたはAPIキーアクセス
- [GLM Models](/providers/glm): Z.AI Coding Planまたは一般APIエンドポイント

### OpenCode

- 認証: `OPENCODE_API_KEY` （または `OPENCODE_ZEN_API_KEY`）
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
- 任意のローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY` （単一override）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使うレガシーOpenClaw設定は、`google/gemini-3-flash-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 直接のGemini実行では、`agents.defaults.models["google/<model>"].params.cachedContent`
  （またはレガシーの `cached_content`）も受け付け、プロバイダーネイティブな
  `cachedContents/...` ハンドルを転送します。GeminiのキャッシュヒットはOpenClawの `cacheRead` として表面化されます

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- 認証: Vertexはgcloud ADCを使用し、Gemini CLIは独自のOAuthフローを使用します
- 注意: OpenClawにおけるGemini CLI OAuthは非公式の統合です。サードパーティークライアントを使用した後にGoogleアカウント制限がかかったという報告があります。利用する場合はGoogleの規約を確認し、重要でないアカウントを使用してください。
- Gemini CLI OAuthは、バンドルされた `google` プラグインの一部として提供されています。
  - まずGemini CLIをインストールします:
    - `brew install gemini-cli`
    - または `npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3.1-pro-preview`
  - 注: `openclaw.json` にclient idやsecretを貼り付けることは**ありません**。CLIログインフローは、gateway host上のauth profileにトークンを保存します。
  - ログイン後にリクエストが失敗する場合は、gateway hostで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  - Gemini CLIのJSON応答は `response` から解析され、usageは
    `stats` にフォールバックし、`stats.cached` はOpenClawの `cacheRead` に正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` と `z-ai/*` は `zai/*` に正規化されます
  - `zai-api-key` は一致するZ.AIエンドポイントを自動検出します。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn` は特定の画面を強制します

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
- Base URL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックcatalogには `kilocode/kilo/auto` が同梱され、
  liveな `https://api.kilo.ai/api/gateway/models` 検出によりランタイム
  catalogがさらに拡張されることがあります。
- `kilocode/kilo/auto` の背後にある正確なupstream routingは、OpenClawにハードコードされているのではなく、Kilo Gatewayが所有します。

セットアップの詳細は [/providers/kilocode](/providers/kilocode) を参照してください。

### そのほかのバンドル済みプロバイダープラグイン

- OpenRouter: `openrouter` （`OPENROUTER_API_KEY`）
- モデル例: `openrouter/auto`
- OpenClawは、リクエストが実際に `openrouter.ai` を対象にしている場合にのみ、OpenRouterが文書化しているapp-attribution headerを適用します
- OpenRouter固有のAnthropic `cache_control` マーカーも、任意のプロキシURLではなく、検証済みOpenRouterルートにのみ適用されます
- OpenRouterは引き続きプロキシ型のOpenAI互換経路上にあるため、ネイティブOpenAI専用のリクエスト整形（`serviceTier`、Responses `store`、
  prompt-cacheヒント、OpenAI reasoning-compat payload）は転送されません
- GeminiベースのOpenRouter参照は、proxy-Gemini thought-signature sanitationのみを維持します。ネイティブGemini replay validationおよびbootstrap rewriteは有効になりません
- Kilo Gateway: `kilocode` （`KILOCODE_API_KEY`）
- モデル例: `kilocode/kilo/auto`
- GeminiベースのKilo参照は同じproxy-Gemini thought-signature
  sanitation経路を維持します。`kilocode/kilo/auto` やその他のproxy-reasoning非対応ヒントでは、proxy reasoning injectionはスキップされます
- MiniMax: `minimax` （APIキー）および `minimax-portal` （OAuth）
- 認証: `MINIMAX_API_KEY` は `minimax` 用、`MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY` は `minimax-portal` 用
- モデル例: `minimax/MiniMax-M2.7` または `minimax-portal/MiniMax-M2.7`
- MiniMaxのオンボーディング/APIキーセットアップでは、`input: ["text", "image"]` を持つ明示的なM2.7モデル定義を書き込みます。バンドルされたprovider catalogは、そのprovider設定が具現化されるまではチャット参照をtext-onlyのままにします
- Moonshot: `moonshot` （`MOONSHOT_API_KEY`）
- モデル例: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` （`KIMI_API_KEY` または `KIMICODE_API_KEY`）
- モデル例: `kimi/kimi-code`
- Qianfan: `qianfan` （`QIANFAN_API_KEY`）
- モデル例: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` （`QWEN_API_KEY`、`MODELSTUDIO_API_KEY`、または `DASHSCOPE_API_KEY`）
- モデル例: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` （`NVIDIA_API_KEY`）
- モデル例: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` （`STEPFUN_API_KEY`）
- モデル例: `stepfun/step-3.5-flash`、`stepfun-plan/step-3.5-flash-2603`
- Together: `together` （`TOGETHER_API_KEY`）
- モデル例: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` （`VENICE_API_KEY`）
- Xiaomi: `xiaomi` （`XIAOMI_API_KEY`）
- モデル例: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` （`AI_GATEWAY_API_KEY`）
- Hugging Face Inference: `huggingface` （`HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`）
- Cloudflare AI Gateway: `cloudflare-ai-gateway` （`CLOUDFLARE_AI_GATEWAY_API_KEY`）
- Volcengine: `volcengine` （`VOLCANO_ENGINE_API_KEY`）
- モデル例: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` （`BYTEPLUS_API_KEY`）
- モデル例: `byteplus-plan/ark-code-latest`
- xAI: `xai` （`XAI_API_KEY`）
  - ネイティブのバンドル済みxAIリクエストはxAI Responses経路を使用します
  - `/fast` または `params.fastMode: true` は、`grok-3`、`grok-3-mini`、
    `grok-4`、`grok-4-0709` をそれぞれの `*-fast` バリアントに書き換えます
  - `tool_stream` はデフォルトで有効です。無効にするには
    `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定してください
- Mistral: `mistral` （`MISTRAL_API_KEY`）
- モデル例: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` （`GROQ_API_KEY`）
- Cerebras: `cerebras` （`CEREBRAS_API_KEY`）
  - Cerebras上のGLMモデルは `zai-glm-4.7` および `zai-glm-4.6` というIDを使います。
  - OpenAI互換base URL: `https://api.cerebras.ai/v1`。
- GitHub Copilot: `github-copilot` （`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`）
- Hugging Face Inferenceのモデル例: `huggingface/deepseek-ai/DeepSeek-R1`。CLI: `openclaw onboard --auth-choice huggingface-api-key`。[Hugging Face（Inference）](/providers/huggingface) を参照してください。

## `models.providers` 経由のプロバイダー（カスタム/base URL）

**カスタム**プロバイダーや
OpenAI/Anthropic互換プロキシを追加するには、`models.providers` （または `models.json`）を使います。

以下のバンドル済みプロバイダープラグインの多くは、すでにデフォルトcatalogを公開しています。
デフォルトのbase URL、header、またはmodel listを上書きしたい場合にのみ、明示的な `models.providers.<id>` エントリーを使ってください。

### Moonshot AI（Kimi）

Moonshotはバンドル済みプロバイダープラグインとして提供されています。デフォルトでは組み込みプロバイダーを使用し、base URLまたはモデルメタデータを上書きしたい場合にのみ明示的な `models.providers.moonshot` エントリーを追加してください。

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

レガシーの `kimi/k2p5` も互換モデルIDとして引き続き受け付けられます。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）は、中国でDoubaoやその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine` （coding: `volcengine-plan`）
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

オンボーディングではデフォルトでcoding画面を使用しますが、一般向けの `volcengine/*`
catalogも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、Volcengine認証選択は
`volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClawは空のprovider-scoped pickerを表示する代わりに、フィルターなしcatalogへフォールバックします。

利用可能なモデル:

- `volcengine/doubao-seed-1-8-251228` （Doubao Seed 1.8）
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` （Kimi K2.5）
- `volcengine/glm-4-7-251222` （GLM 4.7）
- `volcengine/deepseek-v3-2-251201` （DeepSeek V3.2 128K）

Codingモデル（`volcengine-plan`）:

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus（International）

BytePlus ARKは、国際ユーザー向けにVolcano Engineと同じモデルへのアクセスを提供します。

- プロバイダー: `byteplus` （coding: `byteplus-plan`）
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

オンボーディングではデフォルトでcoding画面を使用しますが、一般向けの `byteplus/*`
catalogも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、BytePlus認証選択は
`byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClawは空のprovider-scoped pickerを表示する代わりに、フィルターなしcatalogへフォールバックします。

利用可能なモデル:

- `byteplus/seed-1-8-251228` （Seed 1.8）
- `byteplus/kimi-k2-5-260127` （Kimi K2.5）
- `byteplus/glm-4-7-251222` （GLM 4.7）

Codingモデル（`byteplus-plan`）:

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Syntheticは、`synthetic` プロバイダーの背後でAnthropic互換モデルを提供します。

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

MiniMaxはカスタムエンドポイントを使うため、`models.providers` 経由で設定されます。

- MiniMax OAuth（Global）: `--auth-choice minimax-global-oauth`
- MiniMax OAuth（CN）: `--auth-choice minimax-cn-oauth`
- MiniMax APIキー（Global）: `--auth-choice minimax-global-api`
- MiniMax APIキー（CN）: `--auth-choice minimax-cn-api`
- 認証: `MINIMAX_API_KEY` は `minimax` 用、`MINIMAX_OAUTH_TOKEN` または
  `MINIMAX_API_KEY` は `minimax-portal` 用

セットアップ詳細、モデルオプション、設定スニペットについては [/providers/minimax](/providers/minimax) を参照してください。

MiniMaxのAnthropic互換ストリーミング経路では、明示的に設定しない限りthinkingはデフォルトで無効になり、`/fast on` は
`MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

プラグイン所有のcapability分割:

- テキスト/チャットのデフォルトは `minimax/MiniMax-M2.7` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01` です
- 画像理解は、両方のMiniMax認証経路でプラグイン所有の `MiniMax-VL-01` です
- Web検索はプロバイダーID `minimax` のままです

### Ollama

Ollamaはバンドル済みプロバイダープラグインとして提供され、OllamaのネイティブAPIを使用します。

- プロバイダー: `ollama`
- 認証: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# まずOllamaをインストールしてから、モデルをpullします:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY` でローカルopt-inすると、Ollamaは
`http://127.0.0.1:11434` で自動検出され、バンドル済みプロバイダープラグインがOllamaを直接
`openclaw onboard` とモデルピッカーに追加します。オンボーディング、クラウド/ローカルモード、カスタム設定については [/providers/ollama](/providers/ollama)
を参照してください。

### vLLM

vLLMは、local/self-hostedなOpenAI互換
サーバー向けのバンドル済みプロバイダープラグインとして提供されています。

- プロバイダー: `vllm`
- 認証: 任意（サーバー依存）
- デフォルトbase URL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にopt-inするには（サーバーが認証を強制しない場合、値は何でも構いません）:

```bash
export VLLM_API_KEY="vllm-local"
```

その後、モデルを設定します（`/v1/models` が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は [/providers/vllm](/providers/vllm) を参照してください。

### SGLang

SGLangは、高速なself-hosted
OpenAI互換サーバー向けのバンドル済みプロバイダープラグインとして提供されています。

- プロバイダー: `sglang`
- 認証: 任意（サーバー依存）
- デフォルトbase URL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にopt-inするには（サーバーが認証を強制しない場合）:

```bash
export SGLANG_API_KEY="sglang-local"
```

その後、モデルを設定します（`/v1/models` が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細は [/providers/sglang](/providers/sglang) を参照してください。

### ローカルプロキシ（LM Studio、vLLM、LiteLLM など）

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
        apiKey: "LMSTUDIO_KEY",
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

注意:

- カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は任意です。
  省略した場合、OpenClawは次をデフォルトにします:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: プロキシ/モデルの上限に合う明示的な値を設定してください。
- 非ネイティブエンドポイント上の `api: "openai-completions"` では（hostが `api.openai.com` ではない、空でない `baseUrl`）、OpenClawは未対応の `developer` ロールによるプロバイダー400エラーを避けるため、`compat.supportsDeveloperRole: false` を強制します。
- プロキシ型のOpenAI互換ルートでも、ネイティブOpenAI専用のリクエスト整形はスキップされます:
  `service_tier` なし、Responses `store` なし、prompt-cacheヒントなし、
  OpenAI reasoning-compat payload shapingなし、非表示のOpenClaw attribution
  headerなし。
- `baseUrl` が空または省略されている場合、OpenClawはデフォルトのOpenAI動作を維持します（これは `api.openai.com` に解決されます）。
- 安全のため、非ネイティブ `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も引き続き上書きされます。

## CLIの例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

参照: 完全な設定例については [/gateway/configuration](/gateway/configuration) もご覧ください。

## 関連

- [Models](/concepts/models) — モデル設定とエイリアス
- [Model Failover](/concepts/model-failover) — フォールバックチェーンと再試行動作
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — モデル設定キー
- [Providers](/providers) — プロバイダーごとのセットアップガイド
