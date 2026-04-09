---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要な場合
    - モデルプロバイダー向けの設定例やCLIオンボーディングコマンドを確認したい場合
summary: 設定例とCLIフロー付きのモデルプロバイダー概要
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-09T01:30:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53e3141256781002bbe1d7e7b78724a18d061fcf36a203baae04a091b8c9ea1b
    source_path: concepts/model-providers.md
    workflow: 15
---

# モデルプロバイダー

このページでは**LLM/モデルプロバイダー**を扱います（WhatsApp/Telegramのようなチャットチャンネルではありません）。
モデル選択ルールについては、[/concepts/models](/ja-JP/concepts/models)を参照してください。

## クイックルール

- モデル参照は`provider/model`を使用します（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models`を設定すると、それが許可リストになります。
- CLIヘルパー: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`。
- フォールバックのランタイムルール、クールダウンプローブ、セッション上書き永続化は
  [/concepts/model-failover](/ja-JP/concepts/model-failover)に記載されています。
- `models.providers.*.models[].contextWindow`はネイティブなモデルメタデータです。
  `models.providers.*.models[].contextTokens`は実効ランタイム上限です。
- プロバイダープラグインは`registerProvider({ catalog })`を通じてモデルカタログを注入できます。
  OpenClawはその出力を`models.providers`にマージしてから
  `models.json`を書き込みます。
- プロバイダーマニフェストでは`providerAuthEnvVars`と
  `providerAuthAliases`を宣言できるため、汎用のenvベース認証プローブやプロバイダーバリアントで
  プラグインランタイムを読み込む必要がありません。残っているコアのenv-varマップは現在、
  非プラグイン/コアプロバイダーと、AnthropicのAPIキーファーストなオンボーディングのような
  いくつかの汎用優先順位ケース専用です。
- プロバイダープラグインは、以下を通じてプロバイダーのランタイム挙動も所有できます:
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, and
  `onModelSelected`。
- 注: プロバイダーランタイムの`capabilities`は共有ランナーメタデータです（プロバイダーファミリー、
  transcript/toolingの癖、transport/cacheのヒント）。これは、
  プラグインが何を登録するか（テキスト推論、音声など）を記述する
  [公開 capability モデル](/ja-JP/plugins/architecture#public-capability-model)
  とは異なります。

## プラグイン所有のプロバイダー挙動

プロバイダープラグインは、OpenClawが汎用推論ループを維持したまま、
プロバイダー固有ロジックの大部分を所有できるようになりました。

典型的な分担:

- `auth[].run` / `auth[].runNonInteractive`: `openclaw onboard`、
  `openclaw models auth`、ヘッドレスセットアップ向けのオンボーディング/ログイン
  フローをプロバイダーが所有
- `wizard.setup` / `wizard.modelPicker`: 認証選択ラベル、
  レガシーエイリアス、オンボーディングの許可リストヒント、オンボーディング/モデルピッカー内の
  セットアップ項目をプロバイダーが所有
- `catalog`: プロバイダーが`models.providers`に表示される
- `normalizeModelId`: 検索や正規化の前に、レガシー/プレビューモデルIDを
  プロバイダーが正規化
- `normalizeTransport`: 汎用モデル組み立て前にtransportファミリーの`api` / `baseUrl`を
  プロバイダーが正規化。OpenClawはまず一致したプロバイダーを確認し、
  その後、実際にtransportを変更するものが見つかるまで、他のhook対応プロバイダープラグインを確認します
- `normalizeConfig`: ランタイムが使う前に、`models.providers.<id>`設定を
  プロバイダーが正規化。OpenClawはまず一致したプロバイダーを確認し、その後、
  実際に設定を変更するものが見つかるまで、他のhook対応プロバイダープラグインを確認します。どの
  プロバイダーフックも設定を書き換えない場合、バンドルされたGoogle系ヘルパーが引き続き
  対応するGoogleプロバイダー項目を正規化します。
- `applyNativeStreamingUsageCompat`: 設定プロバイダーに対して、
  エンドポイント駆動のネイティブなstreaming-usage互換書き換えをプロバイダーが適用
- `resolveConfigApiKey`: ランタイム認証全体の読み込みを強制せずに、
  設定プロバイダー向けのenv-marker認証をプロバイダーが解決。
  `amazon-bedrock`には、Bedrockのランタイム認証が
  AWS SDKデフォルトチェーンを使うにもかかわらず、ここに組み込みのAWS env-marker resolverもあります。
- `resolveSyntheticAuth`: プレーンテキスト秘密情報を永続化せずに、
  local/self-hostedやその他の設定ベース認証の利用可否をプロバイダーが公開可能
- `shouldDeferSyntheticProfileAuth`: 保存済みのsynthetic profile
  プレースホルダーを、env/configベース認証より低優先度としてプロバイダーが扱える
- `resolveDynamicModel`: ローカルの静的カタログにまだ存在しないモデルIDを
  プロバイダーが受け付ける
- `prepareDynamicModel`: 動的解決を再試行する前に、
  メタデータ更新が必要であることをプロバイダーが示す
- `normalizeResolvedModel`: transportまたはbase URLの書き換えが
  必要であることをプロバイダーが示す
- `contributeResolvedModelCompat`: 他の互換transport経由で届いた場合でも、
  ベンダーモデル向けの互換フラグをプロバイダーが提供
- `capabilities`: transcript/tooling/provider-familyの癖を
  プロバイダーが公開
- `normalizeToolSchemas`: 埋め込みランナーが見る前にツールスキーマを
  プロバイダーが整形
- `inspectToolSchemas`: 正規化後にtransport固有のスキーマ警告を
  プロバイダーが表示
- `resolveReasoningOutputMode`: ネイティブかタグ付きかの
  reasoning-output契約をプロバイダーが選択
- `prepareExtraParams`: モデルごとのリクエストパラメータを
  プロバイダーがデフォルト化または正規化
- `createStreamFn`: 通常のストリーム経路を完全にカスタムなtransportで
  プロバイダーが置き換える
- `wrapStreamFn`: リクエストヘッダー/ボディ/モデル互換ラッパーを
  プロバイダーが適用
- `resolveTransportTurnState`: ターンごとのネイティブtransport
  ヘッダーまたはメタデータをプロバイダーが提供
- `resolveWebSocketSessionPolicy`: ネイティブWebSocketセッション用の
  ヘッダーまたはセッションクールダウンポリシーをプロバイダーが提供
- `createEmbeddingProvider`: コアのembedding switchboardではなく
  プロバイダープラグイン側に属する場合、メモリembedding挙動をプロバイダーが所有
- `formatApiKey`: 保存済み認証プロファイルを、transportが期待する
  ランタイム`apiKey`文字列へプロバイダーが整形
- `refreshOAuth`: 共通の`pi-ai`
  refreshersでは足りない場合に、OAuth更新をプロバイダーが所有
- `buildAuthDoctorHint`: OAuth更新
  失敗時に修復ガイダンスをプロバイダーが追加
- `matchesContextOverflowError`: 汎用ヒューリスティクスでは見逃す
  プロバイダー固有のコンテキストウィンドウ超過エラーをプロバイダーが認識
- `classifyFailoverReason`: プロバイダー固有の生transport/API
  エラーを、レート制限や過負荷などのフェイルオーバー理由へプロバイダーがマッピング
- `isCacheTtlEligible`: どの上流モデルIDがprompt-cache TTLをサポートするかを
  プロバイダーが判断
- `buildMissingAuthMessage`: 汎用のauth-storeエラーを、
  プロバイダー固有の復旧ヒントにプロバイダーが置き換える
- `suppressBuiltInModel`: 古くなった上流行をプロバイダーが隠し、直接解決失敗時に
  ベンダー所有のエラーを返せる
- `augmentModelCatalog`: 発見と設定マージの後に、synthetic/finalカタログ行を
  プロバイダーが追加
- `isBinaryThinking`: バイナリのオン/オフthinking UXを
  プロバイダーが所有
- `supportsXHighThinking`: 選択されたモデルを`xhigh`に
  プロバイダーが対応させる
- `resolveDefaultThinkingLevel`: モデルファミリーの
  デフォルト`/think`ポリシーをプロバイダーが所有
- `applyConfigDefaults`: 認証モード、env、モデルファミリーに基づいて、
  設定具体化中にプロバイダー固有のグローバルデフォルトをプロバイダーが適用
- `isModernModelRef`: live/smoke向けの推奨モデル一致を
  プロバイダーが所有
- `prepareRuntimeAuth`: 設定済み資格情報を短命な
  ランタイムトークンへプロバイダーが変換
- `resolveUsageAuth`: `/usage`
  や関連する状態/レポート画面向けの使用量/クォータ資格情報をプロバイダーが解決
- `fetchUsageSnapshot`: 使用量エンドポイントの取得/解析を
  プロバイダーが所有し、要約シェルと整形は引き続きコアが所有
- `onModelSelected`: テレメトリーやプロバイダー所有のセッション記録管理など、
  選択後の副作用をプロバイダーが実行

現在のバンドル例:

- `anthropic`: Claude 4.6の前方互換フォールバック、認証修復ヒント、使用量
  エンドポイント取得、cache-TTL/provider-familyメタデータ、認証対応のグローバル
  設定デフォルト
- `amazon-bedrock`: Bedrock固有のスロットル/未準備エラーに対する
  プロバイダー所有のコンテキスト超過判定とフェイルオーバー理由分類に加え、
  Anthropicトラフィック上のClaude専用replay-policy
  ガードのための共通`anthropic-by-model` replayファミリー
- `anthropic-vertex`: Anthropic-message
  トラフィック上のClaude専用replay-policyガード
- `openrouter`: モデルIDの透過、リクエストラッパー、プロバイダーcapability
  ヒント、プロキシGeminiトラフィック上のGemini thought-signatureサニタイズ、
  `openrouter-thinking` streamファミリーを通じたプロキシ
  reasoning注入、ルーティングメタデータ転送、cache-TTLポリシー
- `github-copilot`: オンボーディング/デバイスログイン、前方互換モデルフォールバック、
  Claude-thinking transcriptヒント、ランタイムトークン交換、使用量エンドポイント
  取得
- `openai`: GPT-5.4の前方互換フォールバック、直接OpenAI transport
  正規化、Codex対応の認証不足ヒント、Spark抑制、syntheticな
  OpenAI/Codexカタログ行、thinking/live-modelポリシー、使用量トークンエイリアス
  正規化（`input` / `output`および`prompt` / `completion`ファミリー）、
  ネイティブOpenAI/Codexラッパー用の共通`openai-responses-defaults` streamファミリー、
  provider-familyメタデータ、`gpt-image-1`向けのバンドル済み画像生成プロバイダー
  登録、および`sora-2`向けのバンドル済み動画生成プロバイダー
  登録
- `google`および`google-gemini-cli`: Gemini 3.1の前方互換フォールバック、
  ネイティブGemini replay検証、ブートストラップreplayサニタイズ、タグ付き
  reasoning-outputモード、modern-model一致、Gemini image-previewモデル向けのバンドル済み画像生成
  プロバイダー登録、およびVeoモデル向けのバンドル済み
  動画生成プロバイダー登録。Gemini CLI OAuthはさらに
  認証プロファイルのトークン整形、使用量トークン解析、使用量画面向けのクォータ
  エンドポイント取得も所有します
- `moonshot`: 共通transport、プラグイン所有のthinkingペイロード正規化
- `kilocode`: 共通transport、プラグイン所有のリクエストヘッダー、reasoningペイロード
  正規化、プロキシGemini thought-signatureサニタイズ、cache-TTL
  ポリシー
- `zai`: GLM-5の前方互換フォールバック、`tool_stream`デフォルト、cache-TTL
  ポリシー、binary-thinking/live-modelポリシー、使用量認証 + クォータ取得。
  不明な`glm-5*` IDは、バンドル済みの`glm-4.7`テンプレートから合成されます
- `xai`: ネイティブResponses transport正規化、Grok高速バリアント向けの`/fast`
  エイリアス書き換え、デフォルト`tool_stream`、xAI固有のtool-schema /
  reasoning-payloadクリーンアップ、およびバンドル済み動画生成プロバイダー
  `grok-imagine-video`登録
- `mistral`: プラグイン所有のcapabilityメタデータ
- `opencode`および`opencode-go`: プラグイン所有のcapabilityメタデータに加え、
  プロキシGemini thought-signatureサニタイズ
- `alibaba`: `alibaba/wan2.6-t2v`のような直接Wanモデル参照向けの
  プラグイン所有動画生成カタログ
- `byteplus`: プラグイン所有カタログに加え、Seedance text-to-video/image-to-videoモデル向けの
  バンドル済み動画生成プロバイダー登録
- `fal`: FLUX画像モデル向けのホスト型サードパーティ画像生成プロバイダー
  登録と、ホスト型サードパーティ動画モデル向けのバンドル済み
  動画生成プロバイダー登録
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway`, および`volcengine`:
  プラグイン所有カタログのみ
- `qwen`: テキストモデル向けのプラグイン所有カタログに加え、
  そのマルチモーダル画面向けの共通media-understandingおよび動画生成プロバイダー登録。
  Qwen動画生成は、`wan2.6-t2v`や`wan2.7-r2v`などの
  バンドル済みWanモデルとともに、標準DashScope動画エンドポイントを使用します
- `runway`: `gen4.5`のようなネイティブRunwayタスクベースモデル向けの
  プラグイン所有動画生成プロバイダー登録
- `minimax`: プラグイン所有カタログ、Hailuo動画モデル向けのバンドル済み動画生成プロバイダー
  登録、`image-01`向けのバンドル済み画像生成プロバイダー
  登録、ハイブリッドAnthropic/OpenAI replay-policy
  選択、および使用量認証/スナップショットロジック
- `together`: プラグイン所有カタログに加え、Wan動画モデル向けのバンドル済み動画生成
  プロバイダー登録
- `xiaomi`: プラグイン所有カタログに加え、使用量認証/スナップショットロジック

バンドル済みの`openai`プラグインは現在、`openai`と
`openai-codex`の両方のプロバイダーIDを所有しています。

以上は、OpenClawの通常transportに収まるプロバイダーを対象にしています。完全に
カスタムなリクエスト実行器を必要とするプロバイダーは、別の、より深い拡張サーフェスです。

## APIキーのローテーション

- 選択されたプロバイダー向けの汎用プロバイダーローテーションをサポートします。
- 複数キーの設定方法:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のlive override、最優先）
  - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りのリスト）
  - `<PROVIDER>_API_KEY`（プライマリキー）
  - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）
- Googleプロバイダーでは、フォールバックとして`GOOGLE_API_KEY`も含まれます。
- キー選択順序は優先度を保持し、値を重複排除します。
- リクエストは、レート制限応答時のみ次のキーで再試行されます（
  例: `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`、または周期的な使用量制限メッセージ）。
- レート制限以外の失敗は即座に失敗し、キーのローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダー（pi-ai catalog）

OpenClawにはpi‑ai catalogが同梱されています。これらのプロバイダーでは
`models.providers`設定は**不要**です。認証を設定してモデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, および`OPENCLAW_LIVE_OPENAI_KEY`（単一override）
- 例のモデル: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトtransportは`auto`です（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは`agents.defaults.models["openai/<model>"].params.transport`で行います（`"sse"`, `"websocket"`, または`"auto"`）
- OpenAI Responses WebSocket warm-upは、`params.openaiWsWarmup`（`true`/`false`）によりデフォルトで有効です
- OpenAI priority processingは、`agents.defaults.models["openai/<model>"].params.serviceTier`で有効化できます
- `/fast`と`params.fastMode`は、直接の`openai/*` Responsesリクエストを`api.openai.com`上の`service_tier=priority`へマッピングします
- 共有の`/fast`トグルではなく明示的なtierを使いたい場合は、`params.serviceTier`を使用してください
- 非表示のOpenClaw attributionヘッダー（`originator`, `version`,
  `User-Agent`）は、`api.openai.com`へのネイティブOpenAIトラフィックにのみ適用され、
  汎用のOpenAI互換プロキシには適用されません
- ネイティブOpenAIルートでは、Responsesの`store`、prompt-cacheヒント、
  OpenAI reasoning互換のペイロード整形も維持されます。
  プロキシルートでは維持されません
- `openai/gpt-5.3-codex-spark`は、live OpenAI APIが拒否するため、OpenClawでは意図的に抑制されています。SparkはCodex専用として扱われます

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, および`OPENCLAW_LIVE_ANTHROPIC_KEY`（単一override）
- 例のモデル: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開Anthropicリクエストでは、`api.anthropic.com`に送られるAPIキー認証とOAuth認証のトラフィックを含め、共有の`/fast`トグルと`params.fastMode`をサポートします。OpenClawはこれをAnthropicの`service_tier`（`auto`対`standard_only`）へマッピングします
- Anthropic注記: Anthropicのスタッフから、OpenClaw形式のClaude CLI利用は再び許可されていると伝えられたため、Anthropicが新しいポリシーを公開しない限り、OpenClawはClaude CLI再利用と`claude -p`利用をこの統合向けに認可済みとして扱います。
- Anthropic setup-tokenも、引き続きサポートされるOpenClawトークン経路として利用可能ですが、OpenClawは現在、利用可能な場合はClaude CLI再利用と`claude -p`を優先します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code（Codex）

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- 例のモデル: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトtransportは`auto`です（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは`agents.defaults.models["openai-codex/<model>"].params.transport`で行います（`"sse"`, `"websocket"`, または`"auto"`）
- `params.serviceTier`もネイティブCodex Responsesリクエスト（`chatgpt.com/backend-api`）で転送されます
- 非表示のOpenClaw attributionヘッダー（`originator`, `version`,
  `User-Agent`）は、`chatgpt.com/backend-api`へのネイティブCodexトラフィックにのみ付与され、
  汎用のOpenAI互換プロキシには付与されません
- 直接の`openai/*`と同じ`/fast`トグルおよび`params.fastMode`設定を共有し、OpenClawはこれを`service_tier=priority`へマッピングします
- `openai-codex/gpt-5.3-codex-spark`は、Codex OAuthカタログが公開している場合は引き続き利用可能です。利用権限に依存します
- `openai-codex/gpt-5.4`はネイティブの`contextWindow = 1050000`と、デフォルトのランタイム`contextTokens = 272000`を維持します。ランタイム上限は`models.providers.openai-codex.models[].contextTokens`で上書きしてください
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

- [Qwen Cloud](/ja-JP/providers/qwen): Qwen Cloudプロバイダーサーフェスに加え、Alibaba DashScopeおよびCoding Planエンドポイントのマッピング
- [MiniMax](/ja-JP/providers/minimax): MiniMax Coding Plan OAuthまたはAPIキーアクセス
- [GLM Models](/ja-JP/providers/glm): Z.AI Coding Planまたは汎用APIエンドポイント

### OpenCode

- 認証: `OPENCODE_API_KEY`（または`OPENCODE_ZEN_API_KEY`）
- Zenランタイムプロバイダー: `opencode`
- Goランタイムプロバイダー: `opencode-go`
- 例のモデル: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（APIキー）

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY`
- 任意のローテーション: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY`フォールバック、および`OPENCLAW_LIVE_GEMINI_KEY`（単一override）
- 例のモデル: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview`を使うレガシーOpenClaw設定は、`google/gemini-3-flash-preview`に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 直接のGemini実行では、`agents.defaults.models["google/<model>"].params.cachedContent`
  （または旧式の`cached_content`）も受け付け、プロバイダーネイティブな
  `cachedContents/...`ハンドルを転送します。GeminiのキャッシュヒットはOpenClawの`cacheRead`として表示されます

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`, `google-gemini-cli`
- 認証: Vertexはgcloud ADCを使用し、Gemini CLIは独自のOAuthフローを使用します
- 注意: OpenClawでのGemini CLI OAuthは非公式の統合です。サードパーティクライアントの利用後にGoogleアカウントの制限が発生したと報告しているユーザーもいます。進める場合はGoogleの利用規約を確認し、重要でないアカウントを使用してください。
- Gemini CLI OAuthは、バンドル済みの`google`プラグインの一部として提供されます。
  - まずGemini CLIをインストールします:
    - `brew install gemini-cli`
    - または `npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
  - 注: `openclaw.json`にclient idやsecretを貼り付ける必要は**ありません**。CLIログインフローは
    トークンをGatewayホスト上のauth profileに保存します。
  - ログイン後にリクエストが失敗する場合は、Gatewayホストで`GOOGLE_CLOUD_PROJECT`または`GOOGLE_CLOUD_PROJECT_ID`を設定してください。
  - Gemini CLIのJSON応答は`response`から解析され、使用量は
    `stats`へフォールバックし、`stats.cached`はOpenClawの`cacheRead`へ正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- 例のモデル: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*`と`z-ai/*`は`zai/*`に正規化されます
  - `zai-api-key`は一致するZ.AIエンドポイントを自動検出し、`zai-coding-global`, `zai-coding-cn`, `zai-global`, および`zai-cn`は特定のサーフェスを強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- 例のモデル: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- 例のモデル: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには`kilocode/kilo/auto`が同梱されており、
  liveの`https://api.kilo.ai/api/gateway/models`検出により、ランタイム
  カタログがさらに拡張される場合があります。
- `kilocode/kilo/auto`の背後にある正確な上流ルーティングはKilo Gatewayが所有しており、
  OpenClawにハードコードされていません。

セットアップの詳細は[/providers/kilocode](/ja-JP/providers/kilocode)を参照してください。

### その他のバンドル済みプロバイダープラグイン

- OpenRouter: `openrouter`（`OPENROUTER_API_KEY`）
- 例のモデル: `openrouter/auto`
- OpenClawは、リクエストが実際に`openrouter.ai`を対象としている場合にのみ、
  OpenRouterで文書化されているアプリattributionヘッダーを適用します
- OpenRouter固有のAnthropic `cache_control`マーカーも同様に、
  検証済みのOpenRouterルートにのみ適用され、任意のプロキシURLには適用されません
- OpenRouterは引き続きプロキシ型のOpenAI互換経路上にあるため、ネイティブ
  OpenAI専用のリクエスト整形（`serviceTier`, Responsesの`store`,
  prompt-cacheヒント、OpenAI reasoning互換ペイロード）は転送されません
- GeminiベースのOpenRouter参照では、プロキシGemini thought-signatureサニタイズ
  のみ維持されます。ネイティブGemini replay検証やbootstrap書き換えは無効のままです
- Kilo Gateway: `kilocode`（`KILOCODE_API_KEY`）
- 例のモデル: `kilocode/kilo/auto`
- GeminiベースのKilo参照でも同じプロキシGemini thought-signature
  サニタイズ経路が維持されます。`kilocode/kilo/auto`やその他のプロキシreasoning非対応
  ヒントでは、プロキシreasoning注入はスキップされます
- MiniMax: `minimax`（APIキー）および`minimax-portal`（OAuth）
- 認証: `minimax`には`MINIMAX_API_KEY`、`minimax-portal`には`MINIMAX_OAUTH_TOKEN`または`MINIMAX_API_KEY`
- 例のモデル: `minimax/MiniMax-M2.7` または `minimax-portal/MiniMax-M2.7`
- MiniMaxのオンボーディング/APIキー設定では、`input: ["text", "image"]`付きの
  明示的なM2.7モデル定義が書き込まれます。バンドル済みプロバイダーカタログでは、
  そのプロバイダー設定が具体化されるまで、チャット参照は
  テキスト専用のままです
- Moonshot: `moonshot`（`MOONSHOT_API_KEY`）
- 例のモデル: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi`（`KIMI_API_KEY`または`KIMICODE_API_KEY`）
- 例のモデル: `kimi/kimi-code`
- Qianfan: `qianfan`（`QIANFAN_API_KEY`）
- 例のモデル: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen`（`QWEN_API_KEY`, `MODELSTUDIO_API_KEY`, または`DASHSCOPE_API_KEY`）
- 例のモデル: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia`（`NVIDIA_API_KEY`）
- 例のモデル: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan`（`STEPFUN_API_KEY`）
- 例のモデル: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together`（`TOGETHER_API_KEY`）
- 例のモデル: `together/moonshotai/Kimi-K2.5`
- Venice: `venice`（`VENICE_API_KEY`）
- Xiaomi: `xiaomi`（`XIAOMI_API_KEY`）
- 例のモデル: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway`（`AI_GATEWAY_API_KEY`）
- Hugging Face Inference: `huggingface`（`HUGGINGFACE_HUB_TOKEN`または`HF_TOKEN`）
- Cloudflare AI Gateway: `cloudflare-ai-gateway`（`CLOUDFLARE_AI_GATEWAY_API_KEY`）
- Volcengine: `volcengine`（`VOLCANO_ENGINE_API_KEY`）
- 例のモデル: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus`（`BYTEPLUS_API_KEY`）
- 例のモデル: `byteplus-plan/ark-code-latest`
- xAI: `xai`（`XAI_API_KEY`）
  - ネイティブのバンドル済みxAIリクエストはxAI Responses経路を使用します
  - `/fast`または`params.fastMode: true`は、`grok-3`, `grok-3-mini`,
    `grok-4`, および`grok-4-0709`をそれぞれの`*-fast`バリアントへ書き換えます
  - `tool_stream`はデフォルトでオンです。無効化するには
    `agents.defaults.models["xai/<model>"].params.tool_stream`を`false`に
    設定してください
- Mistral: `mistral`（`MISTRAL_API_KEY`）
- 例のモデル: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq`（`GROQ_API_KEY`）
- Cerebras: `cerebras`（`CEREBRAS_API_KEY`）
  - Cerebras上のGLMモデルでは、ID `zai-glm-4.7`および`zai-glm-4.6`を使用します。
  - OpenAI互換のbase URL: `https://api.cerebras.ai/v1`。
- GitHub Copilot: `github-copilot`（`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`）
- Hugging Face Inferenceの例のモデル: `huggingface/deepseek-ai/DeepSeek-R1`。CLI: `openclaw onboard --auth-choice huggingface-api-key`。[Hugging Face (Inference)](/ja-JP/providers/huggingface)を参照してください。

## `models.providers`経由のプロバイダー（custom/base URL）

**カスタム**プロバイダーまたは
OpenAI/Anthropic互換プロキシを追加するには、`models.providers`（または`models.json`）を使います。

以下のバンドル済みプロバイダープラグインの多くは、すでにデフォルトカタログを公開しています。
デフォルトのbase URL、ヘッダー、モデル一覧を上書きしたい場合にのみ、
明示的な`models.providers.<id>`エントリーを使用してください。

### Moonshot AI（Kimi）

Moonshotはバンドル済みプロバイダープラグインとして提供されています。デフォルトでは
組み込みプロバイダーを使用し、base URLまたはモデルメタデータを上書きする必要がある場合のみ
明示的な`models.providers.moonshot`エントリーを追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- 例のモデル: `moonshot/kimi-k2.5`
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
- 例のモデル: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

旧式の`kimi/k2p5`も、互換モデルIDとして引き続き受け付けられます。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）は、中国でDoubaoおよびその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine`（coding: `volcengine-plan`）
- 認証: `VOLCANO_ENGINE_API_KEY`
- 例のモデル: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

オンボーディングはデフォルトでcodingサーフェスを使用しますが、一般的な`volcengine/*`
カタログも同時に登録されます。

オンボーディング/設定モデルピッカーでは、Volcengine認証選択は
`volcengine/*`と`volcengine-plan/*`の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClawは空のプロバイダースコープピッカーを表示する代わりに、フィルターなしカタログへフォールバックします。

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

BytePlus ARKは、国際ユーザー向けにVolcano Engineと同じモデル群へのアクセスを提供します。

- プロバイダー: `byteplus`（coding: `byteplus-plan`）
- 認証: `BYTEPLUS_API_KEY`
- 例のモデル: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

オンボーディングはデフォルトでcodingサーフェスを使用しますが、一般的な`byteplus/*`
カタログも同時に登録されます。

オンボーディング/設定モデルピッカーでは、BytePlus認証選択は
`byteplus/*`と`byteplus-plan/*`の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClawは空のプロバイダースコープピッカーを表示する代わりに、フィルターなしカタログへフォールバックします。

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
- 例のモデル: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMaxはカスタムエンドポイントを使うため、`models.providers`経由で設定されます。

- MiniMax OAuth（Global）: `--auth-choice minimax-global-oauth`
- MiniMax OAuth（CN）: `--auth-choice minimax-cn-oauth`
- MiniMax APIキー（Global）: `--auth-choice minimax-global-api`
- MiniMax APIキー（CN）: `--auth-choice minimax-cn-api`
- 認証: `minimax`には`MINIMAX_API_KEY`、`minimax-portal`には`MINIMAX_OAUTH_TOKEN`または
  `MINIMAX_API_KEY`

セットアップ詳細、モデルオプション、設定スニペットについては[/providers/minimax](/ja-JP/providers/minimax)を参照してください。

MiniMaxのAnthropic互換ストリーミング経路では、明示的に設定しない限り
OpenClawはthinkingをデフォルトで無効化し、`/fast on`は
`MiniMax-M2.7`を`MiniMax-M2.7-highspeed`へ書き換えます。

プラグイン所有のcapability分割:

- テキスト/チャットのデフォルトは引き続き`minimax/MiniMax-M2.7`
- 画像生成は`minimax/image-01`または`minimax-portal/image-01`
- 画像理解は、両方のMiniMax認証経路でプラグイン所有の`MiniMax-VL-01`
- Web検索はプロバイダーID `minimax`のまま

### Ollama

Ollamaはバンドル済みプロバイダープラグインとして提供され、OllamaのネイティブAPIを使用します。

- プロバイダー: `ollama`
- 認証: 不要（ローカルサーバー）
- 例のモデル: `ollama/llama3.3`
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

Ollamaは、`OLLAMA_API_KEY`でオプトインするとローカルの`http://127.0.0.1:11434`で検出され、
バンドル済みプロバイダープラグインによってOllamaが
`openclaw onboard`とモデルピッカーに直接追加されます。オンボーディング、cloud/localモード、
カスタム設定については[/providers/ollama](/ja-JP/providers/ollama)を参照してください。

### vLLM

vLLMは、local/self-hostedなOpenAI互換
サーバー向けのバンドル済みプロバイダープラグインとして提供されます。

- プロバイダー: `vllm`
- 認証: 任意（サーバー構成による）
- デフォルトbase URL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合は任意の値で可）:

```bash
export VLLM_API_KEY="vllm-local"
```

その後、モデルを設定します（`/v1/models`が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は[/providers/vllm](/ja-JP/providers/vllm)を参照してください。

### SGLang

SGLangは、高速なself-hosted
OpenAI互換サーバー向けのバンドル済みプロバイダープラグインとして提供されます。

- プロバイダー: `sglang`
- 認証: 任意（サーバー構成による）
- デフォルトbase URL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには（サーバーが
認証を強制しない場合は任意の値で可）:

```bash
export SGLANG_API_KEY="sglang-local"
```

その後、モデルを設定します（`/v1/models`が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細は[/providers/sglang](/ja-JP/providers/sglang)を参照してください。

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

注記:

- カスタムプロバイダーでは、`reasoning`, `input`, `cost`, `contextWindow`, および`maxTokens`は任意です。
  省略した場合、OpenClawは次をデフォルトとして使用します:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: プロキシ/モデルの制限に合う明示的な値を設定してください。
- 非ネイティブエンドポイント（`api.openai.com`以外のホストを持つ非空の`baseUrl`）で`api: "openai-completions"`を使う場合、OpenClawは、未対応の`developer`ロールによるプロバイダー400エラーを避けるため、`compat.supportsDeveloperRole: false`を強制します。
- プロキシ型のOpenAI互換ルートでも、ネイティブOpenAI専用のリクエスト
  整形はスキップされます: `service_tier`なし、Responsesの`store`なし、prompt-cacheヒントなし、
  OpenAI reasoning互換ペイロード整形なし、非表示のOpenClaw attribution
  ヘッダーなし。
- `baseUrl`が空または省略されている場合、OpenClawはデフォルトのOpenAI挙動（`api.openai.com`へ解決される）を維持します。
- 安全のため、非ネイティブな`openai-completions`エンドポイントでは、明示的な`compat.supportsDeveloperRole: true`も引き続き上書きされます。

## CLIの例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

完全な設定例については、[/gateway/configuration](/ja-JP/gateway/configuration)も参照してください。

## 関連

- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行挙動
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — モデル設定キー
- [Providers](/ja-JP/providers) — プロバイダーごとのセットアップガイド
