---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要です
    - モデルプロバイダー向けの設定例やCLIオンボーディングコマンドが必要です
summary: モデルプロバイダーの概要（設定例とCLIフロー付き）
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-24T08:57:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

このページでは**LLM/モデルプロバイダー**を扱います（WhatsApp/Telegram のようなチャットチャネルではありません）。
モデル選択ルールについては、[/concepts/models](/ja-JP/concepts/models) を参照してください。

## クイックルール

- モデル参照は `provider/model` を使用します（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models` は、設定されている場合は許可リストとして機能します。
- CLIヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`
- `models.providers.*.models[].contextWindow` はネイティブなモデルメタデータです。`contextTokens` は実効ランタイム上限です。
- フォールバックルール、クールダウンプローブ、セッション上書きの永続化: [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
- OpenAIファミリーのルートはプレフィックスごとに異なります: `openai/<model>` はPIの直接OpenAI APIキープロバイダーを使用し、`openai-codex/<model>` はPIのCodex OAuthを使用し、`openai/<model>` に `agents.defaults.embeddedHarness.runtime: "codex"` を組み合わせるとネイティブなCodex app-server harnessを使用します。[OpenAI](/ja-JP/providers/openai) と [Codex harness](/ja-JP/plugins/codex-harness) を参照してください。
- Plugin の自動有効化も同じ境界に従います: `openai-codex/<model>` はOpenAI Plugin に属し、Codex Plugin は `embeddedHarness.runtime: "codex"` またはレガシーな `codex/<model>` 参照によって有効になります。
- GPT-5.5 は現在、サブスクリプション/OAuthルート経由で利用できます: PIでは `openai-codex/gpt-5.5`、またはCodex app-server harnessでは `openai/gpt-5.5` を使用します。`openai/gpt-5.5` の直接APIキールートは、OpenAIが公開APIでGPT-5.5を有効にするとサポートされます。それまでは `OPENAI_API_KEY` セットアップでは `openai/gpt-5.4` のようなAPI対応モデルを使用してください。

## Plugin 所有のプロバイダー動作

ほとんどのプロバイダー固有ロジックはプロバイダー Plugin（`registerProvider(...)`）内にあり、OpenClaw は汎用の推論ループを維持します。Plugin は、オンボーディング、モデルカタログ、認証env varのマッピング、転送/設定の正規化、ツールスキーマのクリーンアップ、フェイルオーバー分類、OAuth更新、使用量レポート、thinking/reasoningプロファイルなどを担当します。

プロバイダーSDKフックの完全な一覧とバンドル済みPlugin の例は [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) にあります。完全にカスタムなリクエスト実行器が必要なプロバイダーは、別のより深い拡張サーフェスになります。

<Note>
プロバイダーランタイムの `capabilities` は、共有ランナーメタデータ（プロバイダーファミリー、トランスクリプト/ツールの癖、転送/キャッシュのヒント）です。これは、Plugin が何を登録するか（テキスト推論、音声など）を説明する [公開 capability モデル](/ja-JP/plugins/architecture#public-capability-model) と同じではありません。
</Note>

## APIキーのローテーション

- 選択されたプロバイダーで汎用のプロバイダーローテーションをサポートします。
- 複数キーは次の方法で設定します:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のライブ上書き、最優先）
  - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りリスト）
  - `<PROVIDER>_API_KEY`（プライマリキー）
  - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）
- Googleプロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。
- キーの選択順序は優先順位を保持し、値を重複排除します。
- リクエストは、レート制限レスポンス時にのみ次のキーで再試行されます（例: `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、または定期的な使用量制限メッセージ）。
- レート制限以外の失敗では即座に失敗し、キーローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダー（pi-aiカタログ）

OpenClaw には pi‑ai カタログが同梱されています。これらのプロバイダーでは `models.providers` 設定は**不要**です。認証を設定してモデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY`（単一上書き）
- モデル例: `openai/gpt-5.4`、`openai/gpt-5.4-mini`
- GPT-5.5 の直接APIサポートは、OpenAIがAPIでGPT-5.5を公開するとここで利用可能になります
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルト転送は `auto` です（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- OpenAI Responses WebSocketウォームアップは、`params.openaiWsWarmup`（`true`/`false`）によりデフォルトで有効です
- OpenAI優先処理は `agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、直接の `openai/*` Responses リクエストを `api.openai.com` 上の `service_tier=priority` にマッピングします
- 共有の `/fast` トグルの代わりに明示的なティアを指定したい場合は `params.serviceTier` を使用してください
- 非表示のOpenClaw帰属ヘッダー（`originator`、`version`、`User-Agent`）は、汎用のOpenAI互換プロキシではなく、`api.openai.com` へのネイティブなOpenAIトラフィックにのみ適用されます
- ネイティブなOpenAIルートは Responses の `store`、prompt-cacheヒント、OpenAI reasoning互換のペイロード整形も維持します。プロキシルートでは維持されません
- `openai/gpt-5.3-codex-spark` は、実際のOpenAI APIリクエストで拒否され、現在のCodexカタログでも公開されていないため、OpenClaw では意図的に抑制されています

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一上書き）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開Anthropicリクエストは、`api.anthropic.com` に送信されるAPIキー認証およびOAuth認証トラフィックを含め、共有の `/fast` トグルと `params.fastMode` をサポートします。OpenClaw はこれを Anthropic の `service_tier`（`auto` または `standard_only`）にマッピングします
- Anthropic に関する注記: Anthropicのスタッフから、OpenClawスタイルのClaude CLI利用は再び許可されていると伝えられたため、Anthropicが新しいポリシーを公開しない限り、OpenClaw は Claude CLI の再利用と `claude -p` の使用をこの統合で認可済みとして扱います。
- Anthropic setup-token は、サポートされるOpenClawトークンパスとして引き続き利用可能ですが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- PIモデル参照: `openai-codex/gpt-5.5`
- ネイティブなCodex app-server harness参照: `openai/gpt-5.5` と `agents.defaults.embeddedHarness.runtime: "codex"`
- レガシーモデル参照: `codex/gpt-*`
- Plugin の境界: `openai-codex/*` はOpenAI Plugin を読み込みます。ネイティブなCodex app-server Plugin は、Codex harnessランタイムまたはレガシーな `codex/*` 参照によってのみ選択されます。
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルト転送は `auto` です（WebSocket優先、SSEフォールバック）
- PIモデルごとの上書きは `agents.defaults.models["openai-codex/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- `params.serviceTier` もネイティブなCodex Responses リクエスト（`chatgpt.com/backend-api`）で転送されます
- 非表示のOpenClaw帰属ヘッダー（`originator`、`version`、`User-Agent`）は、汎用のOpenAI互換プロキシではなく、`chatgpt.com/backend-api` へのネイティブなCodexトラフィックにのみ付与されます
- 直接の `openai/*` と同じ `/fast` トグルおよび `params.fastMode` 設定を共有し、OpenClaw はこれを `service_tier=priority` にマッピングします
- `openai-codex/gpt-5.5` はネイティブな `contextWindow = 1000000` とデフォルトのランタイム `contextTokens = 272000` を維持します。ランタイム上限は `models.providers.openai-codex.models[].contextTokens` で上書きしてください
- ポリシー注記: OpenAI Codex OAuth は、OpenClaw のような外部ツール/ワークフロー向けに明示的にサポートされています。
- 現在のGPT-5.5アクセスは、OpenAIが公開APIでGPT-5.5を有効にするまで、このOAuth/サブスクリプションルートを使用します。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### その他のサブスクリプション型ホストオプション

- [Qwen Cloud](/ja-JP/providers/qwen): Qwen CloudプロバイダーサーフェスとAlibaba DashScopeおよびCoding Planエンドポイントのマッピング
- [MiniMax](/ja-JP/providers/minimax): MiniMax Coding Plan OAuth またはAPIキーアクセス
- [GLM Models](/ja-JP/providers/glm): Z.AI Coding Plan または一般APIエンドポイント

### OpenCode

- 認証: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）
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
- 任意のローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一上書き）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使用するレガシーなOpenClaw設定は `google/gemini-3-flash-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 直接のGemini実行は、`agents.defaults.models["google/<model>"].params.cachedContent`（またはレガシーな `cached_content`）も受け付け、プロバイダーネイティブな `cachedContents/...` ハンドルを転送します。GeminiのキャッシュヒットはOpenClawの `cacheRead` として表面化します

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- 認証: Vertex は gcloud ADC を使用し、Gemini CLI は独自のOAuthフローを使用します
- 注意: OpenClaw における Gemini CLI OAuth は非公式の統合です。サードパーティークライアントの使用後にGoogleアカウント制限が発生したと報告したユーザーもいます。利用する場合はGoogleの利用規約を確認し、重要でないアカウントを使用してください。
- Gemini CLI OAuth は、バンドル済みの `google` Plugin の一部として提供されます。
  - まず Gemini CLI をインストールします:
    - `brew install gemini-cli`
    - または `npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
  - 注記: `openclaw.json` にクライアントIDやシークレットを貼り付ける必要は**ありません**。CLIログインフローは、Gatewayホスト上の認証プロファイルにトークンを保存します。
  - ログイン後にリクエストが失敗する場合は、Gatewayホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  - Gemini CLI のJSON応答は `response` から解析され、使用量は `stats` にフォールバックされます。`stats.cached` は OpenClaw の `cacheRead` に正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` と `z-ai/*` は `zai/*` に正規化されます
  - `zai-api-key` は一致するZ.AIエンドポイントを自動検出します。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn` は特定のサーフェスを強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベースURL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには `kilocode/kilo/auto` が同梱されています。ライブの `https://api.kilo.ai/api/gateway/models` 検出により、ランタイムカタログがさらに拡張される場合があります。
- `kilocode/kilo/auto` の背後にある正確な上流ルーティングは、OpenClaw にハードコードされておらず、Kilo Gateway が管理します。

セットアップの詳細は [/providers/kilocode](/ja-JP/providers/kilocode) を参照してください。

### その他のバンドル済みプロバイダー Plugin

| プロバイダー | Id | 認証env | モデル例 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus | `byteplus` / `byteplus-plan` | `BYTEPLUS_API_KEY` | `byteplus-plan/ark-code-latest` |
| Cerebras | `cerebras` | `CEREBRAS_API_KEY` | `cerebras/zai-glm-4.7` |
| Cloudflare AI Gateway | `cloudflare-ai-gateway` | `CLOUDFLARE_AI_GATEWAY_API_KEY` | — |
| GitHub Copilot | `github-copilot` | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | — |
| Groq | `groq` | `GROQ_API_KEY` | — |
| Hugging Face Inference | `huggingface` | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` | `huggingface/deepseek-ai/DeepSeek-R1` |
| Kilo Gateway | `kilocode` | `KILOCODE_API_KEY` | `kilocode/kilo/auto` |
| Kimi Coding | `kimi` | `KIMI_API_KEY` または `KIMICODE_API_KEY` | `kimi/kimi-code` |
| MiniMax | `minimax` / `minimax-portal` | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN` | `minimax/MiniMax-M2.7` |
| Mistral | `mistral` | `MISTRAL_API_KEY` | `mistral/mistral-large-latest` |
| Moonshot | `moonshot` | `MOONSHOT_API_KEY` | `moonshot/kimi-k2.6` |
| NVIDIA | `nvidia` | `NVIDIA_API_KEY` | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | `openrouter/auto` |
| Qianfan | `qianfan` | `QIANFAN_API_KEY` | `qianfan/deepseek-v3.2` |
| Qwen Cloud | `qwen` | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus` |
| StepFun | `stepfun` / `stepfun-plan` | `STEPFUN_API_KEY` | `stepfun/step-3.5-flash` |
| Together | `together` | `TOGETHER_API_KEY` | `together/moonshotai/Kimi-K2.5` |
| Venice | `venice` | `VENICE_API_KEY` | — |
| Vercel AI Gateway | `vercel-ai-gateway` | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY` | `volcengine-plan/ark-code-latest` |
| xAI | `xai` | `XAI_API_KEY` | `xai/grok-4` |
| Xiaomi | `xiaomi` | `XIAOMI_API_KEY` | `xiaomi/mimo-v2-flash` |

知っておくとよい癖:

- **OpenRouter** は、アプリ帰属ヘッダーと Anthropic の `cache_control` マーカーを、検証済みの `openrouter.ai` ルートでのみ適用します。プロキシ型のOpenAI互換パスとして、ネイティブOpenAI専用の整形（`serviceTier`、Responses の `store`、prompt-cacheヒント、OpenAI reasoning互換）はスキップします。Geminiベースの参照では、プロキシGeminiの thought-signature サニタイズのみ維持されます。
- **Kilo Gateway** のGeminiベース参照も同じプロキシGeminiサニタイズパスに従います。`kilocode/kilo/auto` およびその他のプロキシreasoning非対応参照では、プロキシreasoning挿入をスキップします。
- **MiniMax** のAPIキーオンボーディングは、`input: ["text", "image"]` を持つ明示的なM2.7モデル定義を書き込みます。バンドル済みカタログでは、その設定が具体化されるまではチャット参照をテキスト専用として扱います。
- **xAI** は xAI Responses パスを使用します。`/fast` または `params.fastMode: true` は、`grok-3`、`grok-3-mini`、`grok-4`、`grok-4-0709` をそれぞれの `*-fast` バリアントに書き換えます。`tool_stream` はデフォルトで有効です。無効にするには `agents.defaults.models["xai/<model>"].params.tool_stream=false` を設定します。
- **Cerebras** のGLMモデルは `zai-glm-4.7` / `zai-glm-4.6` を使用します。OpenAI互換のベースURLは `https://api.cerebras.ai/v1` です。

## `models.providers` 経由のプロバイダー（カスタム/ベースURL）

`models.providers`（または `models.json`）を使用して、**カスタム**プロバイダーや
OpenAI/Anthropic互換プロキシを追加します。

以下のバンドル済みプロバイダー Plugin の多くは、すでにデフォルトカタログを公開しています。
明示的な `models.providers.<id>` エントリを使用するのは、デフォルトの
ベースURL、ヘッダー、またはモデル一覧を上書きしたい場合だけです。

### Moonshot AI (Kimi)

Moonshot はバンドル済みプロバイダー Plugin として提供されます。デフォルトでは組み込みプロバイダーを使用し、
ベースURLまたはモデルメタデータを上書きする必要がある場合のみ、明示的な `models.providers.moonshot` エントリを追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` または `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 のモデルId:

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

Kimi Coding は Moonshot AI のAnthropic互換エンドポイントを使用します。

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

レガシーな `kimi/k2p5` も互換モデルIdとして引き続き受け付けられます。

### Volcano Engine (Doubao)

Volcano Engine（火山引擎）は、中国でDoubaoおよびその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine`（コーディング用: `volcengine-plan`）
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

オンボーディングではデフォルトでコーディング用サーフェスを使用しますが、一般向けの `volcengine/*`
カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、Volcengine の認証選択は
`volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClaw は空のプロバイダースコープピッカーを表示する代わりに、フィルタなしカタログへフォールバックします。

利用可能なモデル:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

コーディングモデル（`volcengine-plan`）:

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus（International）

BytePlus ARK は、国際ユーザー向けに Volcano Engine と同じモデルへのアクセスを提供します。

- プロバイダー: `byteplus`（コーディング用: `byteplus-plan`）
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

オンボーディングではデフォルトでコーディング用サーフェスを使用しますが、一般向けの `byteplus/*`
カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、BytePlus の認証選択は
`byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClaw は空のプロバイダースコープピッカーを表示する代わりに、フィルタなしカタログへフォールバックします。

利用可能なモデル:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

コーディングモデル（`byteplus-plan`）:

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic は、`synthetic` プロバイダーの背後で Anthropic 互換モデルを提供します。

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

MiniMax はカスタムエンドポイントを使用するため、`models.providers` 経由で設定します。

- MiniMax OAuth（Global）: `--auth-choice minimax-global-oauth`
- MiniMax OAuth（CN）: `--auth-choice minimax-cn-oauth`
- MiniMax APIキー（Global）: `--auth-choice minimax-global-api`
- MiniMax APIキー（CN）: `--auth-choice minimax-cn-api`
- 認証: `minimax` では `MINIMAX_API_KEY`、`minimax-portal` では `MINIMAX_OAUTH_TOKEN` または
  `MINIMAX_API_KEY`

セットアップの詳細、モデルオプション、設定スニペットについては [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

MiniMax の Anthropic 互換ストリーミングパスでは、明示的に設定しない限り、
OpenClaw はデフォルトで thinking を無効にし、`/fast on` は
`MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

Plugin 所有の capability 分割:

- テキスト/チャットのデフォルトは `minimax/MiniMax-M2.7` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01` です
- 画像理解は、両方の MiniMax 認証パスで Plugin 所有の `MiniMax-VL-01` です
- Web検索はプロバイダーid `minimax` のままです

### LM Studio

LM Studio はネイティブAPIを使用するバンドル済みプロバイダー Plugin として提供されます。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- デフォルト推論ベースURL: `http://localhost:1234/v1`

次にモデルを設定します（`http://localhost:1234/api/v1/models` が返す ID のいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw は、検出と自動ロードに LM Studio ネイティブの `/api/v1/models` と `/api/v1/models/load` を使用し、デフォルトでは推論に `/v1/chat/completions` を使用します。セットアップとトラブルシューティングについては [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollama はバンドル済みプロバイダー Plugin として提供され、Ollama のネイティブAPIを使用します:

- プロバイダー: `ollama`
- 認証: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama をインストールしてから、モデルを pull します:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama は、`OLLAMA_API_KEY` でオプトインすると `http://127.0.0.1:11434` でローカル検出され、
バンドル済みプロバイダー Plugin によって Ollama が `openclaw onboard` とモデルピッカーに直接追加されます。オンボーディング、クラウド/ローカルモード、カスタム設定については [/providers/ollama](/ja-JP/providers/ollama)
を参照してください。

### vLLM

vLLM は、ローカル/セルフホストのOpenAI互換
サーバー向けバンドル済みプロバイダー Plugin として提供されます。

- プロバイダー: `vllm`
- 認証: 任意（サーバー設定による）
- デフォルトベースURL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合は任意の値で動作します）:

```bash
export VLLM_API_KEY="vllm-local"
```

次にモデルを設定します（`/v1/models` が返す ID のいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLang は、高速なセルフホスト
OpenAI互換サーバー向けバンドル済みプロバイダー Plugin として提供されます。

- プロバイダー: `sglang`
- 認証: 任意（サーバー設定による）
- デフォルトベースURL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合は任意の値で動作します）:

```bash
export SGLANG_API_KEY="sglang-local"
```

次にモデルを設定します（`/v1/models` が返す ID のいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細は [/providers/sglang](/ja-JP/providers/sglang) を参照してください。

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

注記:

- カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は任意です。
  省略した場合、OpenClaw のデフォルトは次のとおりです:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: プロキシ/モデルの制限に一致する明示的な値を設定してください。
- ネイティブでないエンドポイント上の `api: "openai-completions"` では（ホストが `api.openai.com` ではない空でない `baseUrl`）、OpenClaw は、サポートされない `developer` ロールによるプロバイダーの400エラーを避けるため、`compat.supportsDeveloperRole: false` を強制します。
- プロキシ型のOpenAI互換ルートでも、ネイティブOpenAI専用のリクエスト整形はスキップされます:
  `service_tier` なし、Responses の `store` なし、prompt-cacheヒントなし、
  OpenAI reasoning互換のペイロード整形なし、非表示のOpenClaw帰属
  ヘッダーなし。
- `baseUrl` が空または省略されている場合、OpenClaw はデフォルトのOpenAI動作を維持します（`api.openai.com` に解決されます）。
- 安全のため、ネイティブでない `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も引き続き上書きされます。

## CLIの例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

関連項目: 完全な設定例については [/gateway/configuration](/ja-JP/gateway/configuration) を参照してください。

## 関連

- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行の動作
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [Providers](/ja-JP/providers) — プロバイダーごとのセットアップガイド
