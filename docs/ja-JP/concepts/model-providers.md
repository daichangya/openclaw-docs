---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要です
    - モデルプロバイダー向けの設定例またはCLIオンボーディングコマンドが必要です
summary: モデルプロバイダーの概要、設定例、およびCLIフロー
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-25T13:45:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

**LLM/モデルプロバイダー**のリファレンスです（WhatsApp/Telegramのようなチャットチャンネルではありません）。モデル選択ルールについては、[Models](/ja-JP/concepts/models) を参照してください。

## クイックルール

- モデル参照は `provider/model` を使用します（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models` は、設定されている場合は許可リストとして動作します。
- CLIヘルパー: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`。
- `models.providers.*.models[].contextWindow` はネイティブなモデルメタデータで、`contextTokens` は実効ランタイム上限です。
- フォールバックルール、クールダウンプローブ、セッション上書き永続化: [Model failover](/ja-JP/concepts/model-failover)。
- OpenAIファミリーのルートは接頭辞ごとに固有です: `openai/<model>` はPI内の直接OpenAI APIキープロバイダーを使用し、`openai-codex/<model>` はPI内のCodex OAuthを使用し、`openai/<model>` に加えて `agents.defaults.embeddedHarness.runtime: "codex"` を設定するとネイティブCodex app-server harnessを使用します。[OpenAI](/ja-JP/providers/openai) と [Codex harness](/ja-JP/plugins/codex-harness) を参照してください。プロバイダー/ランタイムの分離がわかりにくい場合は、先に [Agent runtimes](/ja-JP/concepts/agent-runtimes) を読んでください。
- Pluginの自動有効化も同じ境界に従います: `openai-codex/<model>` はOpenAI Pluginに属し、Codex Pluginは `embeddedHarness.runtime: "codex"` または旧来の `codex/<model>` 参照によって有効化されます。
- CLIランタイムも同じ分離を使います: `anthropic/claude-*`, `google/gemini-*`, `openai/gpt-*` のような正規モデル参照を選び、ローカルCLIバックエンドを使いたい場合は `agents.defaults.embeddedHarness.runtime` を `claude-cli`, `google-gemini-cli`, `codex-cli` に設定してください。旧来の `claude-cli/*`, `google-gemini-cli/*`, `codex-cli/*` 参照は、ランタイムを別途記録したうえで正規プロバイダー参照に移行されます。
- GPT-5.5 は、PI内の `openai-codex/gpt-5.5`、ネイティブCodex app-server harness、そしてバンドル済みPIカタログがインストール環境向けに `openai/gpt-5.5` を公開している場合は公開OpenAI API経由でも利用できます。

## Plugin所有のプロバイダー動作

ほとんどのプロバイダー固有ロジックは、OpenClawが汎用推論ループを維持する一方で、プロバイダーPlugin（`registerProvider(...)`）内にあります。Pluginは、オンボーディング、モデルカタログ、認証env-varマッピング、転送/設定正規化、ツールスキーマクリーンアップ、フェイルオーバー分類、OAuth更新、使用量レポート、thinking/reasoningプロファイルなどを担当します。

provider-SDKフックの完全な一覧とバンドル済みPlugin例は、[Provider plugins](/ja-JP/plugins/sdk-provider-plugins) にあります。完全にカスタムのリクエスト実行器が必要なプロバイダーは、別のより深い拡張サーフェスになります。

<Note>
プロバイダーランタイムの `capabilities` は共有ランナーメタデータ（プロバイダーファミリー、transcript/ツールの癖、転送/キャッシュヒント）です。これは、Pluginが何を登録するか（テキスト推論、音声など）を記述する[公開 capability モデル](/ja-JP/plugins/architecture#public-capability-model)とは異なります。
</Note>

## APIキーのローテーション

- 一部のプロバイダー向けに、汎用プロバイダーローテーションをサポートします。
- 複数キーの設定方法:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のライブ上書き、最優先）
  - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りの一覧）
  - `<PROVIDER>_API_KEY`（プライマリキー）
  - `<PROVIDER>_API_KEY_*`（番号付き一覧、例: `<PROVIDER>_API_KEY_1`）
- Googleプロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。
- キー選択順序は優先順位を維持しつつ、値の重複を除去します。
- リクエストは、レート制限応答の場合にのみ次のキーで再試行されます（例: `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`、または周期的な使用量制限メッセージ）。
- レート制限以外の失敗は即座に失敗し、キーローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダー（pi-aiカタログ）

OpenClawにはpi‑aiカタログが同梱されています。これらのプロバイダーでは `models.providers` 設定は**不要**で、認証を設定してモデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, 加えて `OPENCLAW_LIVE_OPENAI_KEY`（単一上書き）
- モデル例: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- GPT-5.5の直接APIサポートは、インストール環境向けのバンドル済みPIカタログのバージョンに依存します。Codex app-serverランタイムなしで `openai/gpt-5.5` を使う前に、`openclaw models list --provider openai` で確認してください。
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルト転送は `auto`（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`, `"websocket"`, `"auto"`）で行います
- OpenAI Responses WebSocket warm-up は、`params.openaiWsWarmup` (`true`/`false`) によりデフォルトで有効です
- OpenAI priority processing は、`agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、直接 `openai/*` Responsesリクエストを `api.openai.com` 上の `service_tier=priority` にマップします
- 共有 `/fast` トグルの代わりに明示的なtierを使いたい場合は `params.serviceTier` を使用してください
- 非表示のOpenClaw属性ヘッダー（`originator`, `version`, `User-Agent`）は、汎用OpenAI互換proxyではなく、`api.openai.com` へのネイティブOpenAIトラフィックにのみ適用されます
- ネイティブOpenAIルートでは、Responses `store`、prompt-cacheヒント、OpenAI reasoning互換ペイロード整形も保持されます。proxyルートでは保持されません
- `openai/gpt-5.3-codex-spark` は、実際のOpenAI APIリクエストで拒否され、現在のCodexカタログにも存在しないため、OpenClawでは意図的に抑制されています

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, 加えて `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一上書き）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開Anthropicリクエストは、`api.anthropic.com` に送信されるAPIキー認証およびOAuth認証トラフィックを含め、共有 `/fast` トグルと `params.fastMode` をサポートします。OpenClawはこれをAnthropicの `service_tier`（`auto` 対 `standard_only`）にマップします
- Anthropic注記: Anthropicスタッフから、OpenClaw形式のClaude CLI利用は再び許可されていると聞いているため、Anthropicが新たなポリシーを公開しない限り、OpenClawはClaude CLI再利用と `claude -p` 利用をこの統合向けに認可済みとして扱います。
- Anthropic setup-tokenは引き続きサポートされるOpenClawトークン経路として利用可能ですが、OpenClawは現在、利用可能であればClaude CLI再利用と `claude -p` を優先します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- PIモデル参照: `openai-codex/gpt-5.5`
- ネイティブCodex app-server harness参照: `openai/gpt-5.5` と `agents.defaults.embeddedHarness.runtime: "codex"`
- ネイティブCodex app-server harnessドキュメント: [Codex harness](/ja-JP/plugins/codex-harness)
- 旧来のモデル参照: `codex/gpt-*`
- Plugin境界: `openai-codex/*` はOpenAI Pluginをロードします。ネイティブCodex app-server Pluginが選択されるのは、Codex harnessランタイムまたは旧来の `codex/*` 参照による場合のみです。
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルト転送は `auto`（WebSocket優先、SSEフォールバック）
- PIモデルごとの上書きは `agents.defaults.models["openai-codex/<model>"].params.transport`（`"sse"`, `"websocket"`, `"auto"`）で行います
- `params.serviceTier` はネイティブCodex Responsesリクエスト（`chatgpt.com/backend-api`）でも転送されます
- 非表示のOpenClaw属性ヘッダー（`originator`, `version`, `User-Agent`）は、汎用OpenAI互換proxyではなく、`chatgpt.com/backend-api` へのネイティブCodexトラフィックにのみ付与されます
- 直接 `openai/*` と同じ `/fast` トグルと `params.fastMode` 設定を共有し、OpenClawはこれを `service_tier=priority` にマップします
- `openai-codex/gpt-5.5` はCodexカタログ固有の `contextWindow = 400000` と、デフォルトランタイム `contextTokens = 272000` を使用します。ランタイム上限は `models.providers.openai-codex.models[].contextTokens` で上書きしてください
- ポリシー注記: OpenAI Codex OAuthは、OpenClawのような外部ツール/ワークフロー向けに明示的にサポートされています。
- Codex OAuth/サブスクリプション経路を使いたい場合は `openai-codex/gpt-5.5` を、APIキー設定とローカルカタログで公開API経路が利用できる場合は `openai/gpt-5.5` を使ってください。

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

- [Qwen Cloud](/ja-JP/providers/qwen): Qwen Cloudプロバイダーサーフェスに加え、Alibaba DashScopeとCoding Planエンドポイントマッピング
- [MiniMax](/ja-JP/providers/minimax): MiniMax Coding Plan OAuthまたはAPIキーアクセス
- [GLM models](/ja-JP/providers/glm): Z.AI Coding Planまたは汎用APIエンドポイント

### OpenCode

- 認証: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）
- Zenランタイムプロバイダー: `opencode`
- Goランタイムプロバイダー: `opencode-go`
- モデル例: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（APIキー）

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY`
- 任意のローテーション: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一上書き）
- モデル例: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 互換性: 旧来のOpenClaw設定で使われていた `google/gemini-3.1-flash-preview` は `google/gemini-3-flash-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` はGoogle dynamic thinkingを使用します。Gemini 3/3.1では固定の `thinkingLevel` を省略し、Gemini 2.5では `thinkingBudget: -1` を送信します。
- 直接のGemini実行では、`agents.defaults.models["google/<model>"].params.cachedContent`（または旧来の `cached_content`）も受け付け、プロバイダーネイティブな `cachedContents/...` ハンドルを転送します。GeminiキャッシュヒットはOpenClaw `cacheRead` として表れます

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`, `google-gemini-cli`
- 認証: Vertexはgcloud ADCを使用し、Gemini CLIは独自のOAuthフローを使用します
- 注意: OpenClawにおけるGemini CLI OAuthは非公式の統合です。サードパーティクライアント使用後にGoogleアカウント制限が発生したと報告したユーザーもいます。進める場合はGoogleの利用規約を確認し、重要でないアカウントを使ってください。
- Gemini CLI OAuthは、バンドル済み `google` Pluginの一部として提供されます。
  - 先にGemini CLIをインストールしてください:
    - `brew install gemini-cli`
    - または `npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
  - 注: `openclaw.json` にclient idやsecretを貼り付けることは**ありません**。CLIログインフローは、Gatewayホスト上のauth profileにトークンを保存します。
  - ログイン後にリクエストが失敗する場合は、Gatewayホスト上で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  - Gemini CLI JSON返信は `response` から解析され、使用量は `stats` にフォールバックし、`stats.cached` はOpenClaw `cacheRead` に正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` と `z-ai/*` は `zai/*` に正規化されます
  - `zai-api-key` は一致するZ.AIエンドポイントを自動検出します。`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` は特定のサーフェスを強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベースURL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには `kilocode/kilo/auto` が含まれています。実行時カタログは、ライブの `https://api.kilo.ai/api/gateway/models` 検出によってさらに拡張されることがあります。
- `kilocode/kilo/auto` の背後にある正確なupstreamルーティングはKilo Gateway側の管理であり、OpenClawにハードコードされているわけではありません。

設定の詳細については [/providers/kilocode](/ja-JP/providers/kilocode) を参照してください。

### その他のバンドル済みプロバイダーPlugin

| プロバイダー            | ID                               | 認証env                                                     | モデル例                                        |
| ----------------------- | -------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                          | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                          | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                             | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                          | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`        | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                              | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`                   | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                          | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` または `KIMICODE_API_KEY`                    | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                   | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                           | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                          | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                            | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                        | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                           | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY`| `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                           | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                          | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                            | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                        | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                    | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                               | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                            | `xiaomi/mimo-v2-flash`                          |

知っておくとよい癖:

- **OpenRouter** は、そのアプリ属性ヘッダーとAnthropicの `cache_control` マーカーを、検証済み `openrouter.ai` ルートでのみ適用します。DeepSeek、Moonshot、ZAI参照は、OpenRouter管理のprompt caching向けのcache-TTL対象になりますが、Anthropic cacheマーカーは受け取りません。proxy型のOpenAI互換経路であるため、ネイティブOpenAI専用の整形（`serviceTier`, Responses `store`, prompt-cacheヒント, OpenAI reasoning互換）はスキップします。Gemini系参照では、proxy-Geminiのthought-signatureサニタイズのみが維持されます。
- **Kilo Gateway** のGemini系参照も同じproxy-Geminiサニタイズ経路に従います。`kilocode/kilo/auto` やその他のproxy reasoning非対応参照では、proxy reasoning注入をスキップします。
- **MiniMax** のAPIキーオンボーディングでは、明示的なテキスト専用M2.7チャットモデル定義が書き込まれます。画像理解は引き続きPlugin所有の `MiniMax-VL-01` メディアプロバイダー側にあります。
- **xAI** はxAI Responses経路を使用します。`/fast` または `params.fastMode: true` は、`grok-3`, `grok-3-mini`, `grok-4`, `grok-4-0709` をそれぞれの `*-fast` 版に書き換えます。`tool_stream` はデフォルトで有効です。無効にするには `agents.defaults.models["xai/<model>"].params.tool_stream=false` を設定してください。
- **Cerebras** のGLMモデルは `zai-glm-4.7` / `zai-glm-4.6` を使用します。OpenAI互換ベースURLは `https://api.cerebras.ai/v1` です。

## `models.providers` 経由のプロバイダー（カスタム/ベースURL）

**カスタム**プロバイダーやOpenAI/Anthropic互換proxyを追加するには、`models.providers`（または `models.json`）を使います。

以下にあるバンドル済みプロバイダーPluginの多くは、すでにデフォルトカタログを公開しています。デフォルトのベースURL、ヘッダー、モデル一覧を上書きしたい場合にのみ、明示的な `models.providers.<id>` エントリを使ってください。

### Moonshot AI (Kimi)

Moonshotはバンドル済みプロバイダーPluginとして提供されています。通常は組み込みプロバイダーを使い、ベースURLまたはモデルメタデータを上書きしたい場合にのみ、明示的な `models.providers.moonshot` エントリを追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` または `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2のモデルID:

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

Kimi Codingは、Moonshot AIのAnthropic互換エンドポイントを使用します。

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

旧来の `kimi/k2p5` も互換モデルIDとして引き続き受け付けられます。

### Volcano Engine (Doubao)

Volcano Engine（火山引擎）は、中国でDoubaoやその他のモデルへのアクセスを提供します。

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

オンボーディングはデフォルトでコーディング用サーフェスになりますが、汎用の `volcengine/*` カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、Volcengineの認証選択は `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClawは空のプロバイダースコープ付きピッカーを表示する代わりに、フィルターなしカタログにフォールバックします。

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

### BytePlus（インターナショナル）

BytePlus ARKは、海外ユーザー向けにVolcano Engineと同じモデルへのアクセスを提供します。

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

オンボーディングはデフォルトでコーディング用サーフェスになりますが、汎用の `byteplus/*` カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、BytePlusの認証選択は `byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClawは空のプロバイダースコープ付きピッカーを表示する代わりに、フィルターなしカタログにフォールバックします。

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

Syntheticは、`synthetic` プロバイダー配下でAnthropic互換モデルを提供します。

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

MiniMaxはカスタムエンドポイントを使用するため、`models.providers` 経由で設定します。

- MiniMax OAuth（Global）: `--auth-choice minimax-global-oauth`
- MiniMax OAuth（CN）: `--auth-choice minimax-cn-oauth`
- MiniMax APIキー（Global）: `--auth-choice minimax-global-api`
- MiniMax APIキー（CN）: `--auth-choice minimax-cn-api`
- 認証: `minimax` では `MINIMAX_API_KEY`、`minimax-portal` では `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`

設定の詳細、モデルオプション、設定スニペットについては [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

MiniMaxのAnthropic互換ストリーミング経路では、明示的に設定しない限り、OpenClawはデフォルトでthinkingを無効にします。また、`/fast on` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

Plugin所有のcapability分割:

- テキスト/チャットのデフォルトは `minimax/MiniMax-M2.7` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01` です
- 画像理解は、両方のMiniMax認証経路でPlugin所有の `MiniMax-VL-01` です
- Web検索は引き続きプロバイダーID `minimax` にとどまります

### LM Studio

LM Studioは、ネイティブAPIを使うバンドル済みプロバイダーPluginとして提供されています。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- デフォルト推論ベースURL: `http://localhost:1234/v1`

その後、モデルを設定します（`http://localhost:1234/api/v1/models` が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClawは、検出と自動ロードにLM Studioネイティブの `/api/v1/models` と `/api/v1/models/load` を使い、デフォルトでは推論に `/v1/chat/completions` を使います。セットアップとトラブルシューティングについては [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollamaはバンドル済みプロバイダーPluginとして提供され、OllamaのネイティブAPIを使用します。

- プロバイダー: `ollama`
- 認証: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollamaをインストールしてからモデルをpullします:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollamaは、`OLLAMA_API_KEY` で明示的に有効化すると、ローカルの `http://127.0.0.1:11434` で検出されます。バンドル済みプロバイダーPluginにより、Ollamaは `openclaw onboard` とモデルピッカーに直接追加されます。オンボーディング、クラウド/ローカルモード、カスタム設定については [/providers/ollama](/ja-JP/providers/ollama) を参照してください。

### vLLM

vLLMは、ローカル/セルフホストのOpenAI互換サーバー向けのバンドル済みプロバイダーPluginとして提供されています。

- プロバイダー: `vllm`
- 認証: 任意（サーバー依存）
- デフォルトベースURL: `http://127.0.0.1:8000/v1`

ローカル自動検出を有効にするには（サーバーが認証を強制しない場合、値は何でも構いません）:

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

詳細については [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLangは、高速なセルフホストOpenAI互換サーバー向けのバンドル済みプロバイダーPluginとして提供されています。

- プロバイダー: `sglang`
- 認証: 任意（サーバー依存）
- デフォルトベースURL: `http://127.0.0.1:30000/v1`

ローカル自動検出を有効にするには（サーバーが認証を強制しない場合、値は何でも構いません）:

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

詳細については [/providers/sglang](/ja-JP/providers/sglang) を参照してください。

### ローカルproxy（LM Studio、vLLM、LiteLLMなど）

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

- カスタムプロバイダーでは、`reasoning`, `input`, `cost`, `contextWindow`, `maxTokens` は任意です。
  省略時、OpenClawのデフォルトは次のとおりです:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: proxy/モデルの上限に一致する明示的な値を設定してください。
- 非ネイティブエンドポイント上の `api: "openai-completions"` では（`api.openai.com` ではないホストを持つ、空でない `baseUrl` の場合）、OpenClawは未対応の `developer` ロールによるプロバイダー400エラーを避けるため、`compat.supportsDeveloperRole: false` を強制します。
- proxy型のOpenAI互換ルートでは、ネイティブOpenAI専用のリクエスト整形もスキップされます: `service_tier` なし、Responses `store` なし、Completions `store` なし、prompt-cacheヒントなし、OpenAI reasoning互換ペイロード整形なし、非表示のOpenClaw属性ヘッダーなし。
- ベンダー固有フィールドが必要なOpenAI互換Completions proxyでは、`agents.defaults.models["provider/model"].params.extra_body`（または `extraBody`）を設定して、追加JSONを送信リクエストボディにマージしてください。
- `baseUrl` が空または省略されている場合、OpenClawはデフォルトのOpenAI動作を維持します（`api.openai.com` に解決されます）。
- 安全のため、明示的な `compat.supportsDeveloperRole: true` も、非ネイティブ `openai-completions` エンドポイントでは引き続き上書きされます。

## CLI例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

関連項目: 完全な設定例については [Configuration](/ja-JP/gateway/configuration) を参照してください。

## 関連

- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Model failover](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行動作
- [Configuration reference](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [Providers](/ja-JP/providers) — プロバイダーごとのセットアップガイド
