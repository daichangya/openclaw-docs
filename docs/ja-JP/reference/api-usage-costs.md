---
read_when:
    - どの機能が有料 API を呼び出す可能性があるかを理解したいです
    - キー、コスト、使用状況の可視性を監査する必要があります
    - '`/status` または `/usage` のコストレポートを説明しています'
summary: 何が費用を発生させるか、どのキーが使われるか、使用量をどう確認するかを監査する
title: API 使用量とコスト
x-i18n:
    generated_at: "2026-04-25T13:58:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 使用量とコスト

このドキュメントでは、**API キーを呼び出す可能性がある機能**と、そのコストがどこに表示されるかを一覧にしています。プロバイダー使用量や有料 API 呼び出しを発生させる可能性がある OpenClaw の機能に焦点を当てています。

## コストの表示場所（チャット + CLI）

**セッションごとのコストスナップショット**

- `/status` は、現在のセッションモデル、コンテキスト使用量、最後の応答トークン数を表示します。
- モデルが **API キー認証**を使っている場合、`/status` は最後の応答の**推定コスト**も表示します。
- ライブセッションメタデータが少ない場合、`/status` は最新の transcript 使用量エントリからトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを復元できます。既存のゼロ以外のライブ値がある場合はそれが優先され、保存済み合計が欠落しているか小さい場合は、プロンプトサイズの transcript 合計が優先されることがあります。

**メッセージごとのコストフッター**

- `/usage full` は、**推定コスト**（API キーのみ）を含む使用量フッターをすべての返信に追加します。
- `/usage tokens` はトークンのみを表示します。サブスクリプション型の OAuth/トークンや CLI フローではドル建てコストは非表示です。
- Gemini CLI の注意: CLI が JSON 出力を返す場合、OpenClaw は `stats` から使用量を読み取り、`stats.cached` を `cacheRead` に正規化し、必要に応じて `stats.input_tokens - stats.cached` から入力トークンを導出します。

Anthropic に関する注意: Anthropic のスタッフから、OpenClaw スタイルの Claude CLI 使用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude CLI の再利用と `claude -p` の使用をこの統合向けに公認と見なします。ただし Anthropic は、OpenClaw が `/usage full` に表示できるメッセージ単位のドル建て推定値を依然として公開していません。

**CLI 使用量ウィンドウ（プロバイダー割り当て）**

- `openclaw status --usage` と `openclaw channels list` は、プロバイダーの**使用量ウィンドウ**（メッセージ単位コストではなく、割り当てスナップショット）を表示します。
- 人間向け出力は、プロバイダーをまたいで `X% left` に正規化されます。
- 現在の使用量ウィンドウ対応 provider: Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi、z.ai。
- MiniMax に関する注意: 生の `usage_percent` / `usagePercent` フィールドは残り割り当てを意味するため、OpenClaw は表示前にこれを反転します。件数ベースのフィールドが存在する場合は、それが引き続き優先されます。provider が `model_remains` を返す場合、OpenClaw はチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- これらの割り当てウィンドウの使用量認証は、利用可能な場合は provider 固有のフックから取得されます。それ以外の場合、OpenClaw は auth profile、env、または config の一致する OAuth/API キー認証情報にフォールバックします。

詳細と例については、[Token use & costs](/ja-JP/reference/token-use) を参照してください。

## キーの検出方法

OpenClaw は次から認証情報を取得できます。

- **Auth profile**（エージェントごと、`auth-profiles.json` に保存）。
- **環境変数**（例: `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **config**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、`talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`）。skill プロセス環境にキーをエクスポートする場合があります。

## キー消費が発生する可能性のある機能

### 1) コアモデル応答（チャット + ツール）

すべての返信またはツール呼び出しは、**現在のモデル provider**（OpenAI、Anthropic など）を使用します。これは使用量とコストの主要な発生源です。

これには、OpenClaw のローカル UI の外側で課金されるサブスクリプション型ホスト provider も含まれます。たとえば **OpenAI Codex**、**Alibaba Cloud Model Studio Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**、および **Extra Usage** を有効にした Anthropic の OpenClaw Claude ログインパスなどです。

価格設定 config については [Models](/ja-JP/providers/models)、表示については [Token use & costs](/ja-JP/reference/token-use) を参照してください。

### 2) メディア理解（音声/画像/動画）

受信メディアは、返信が実行される前に要約/文字起こしされることがあります。これは model/provider API を使用します。

- 音声: OpenAI / Groq / Deepgram / Google / Mistral
- 画像: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI
- 動画: Google / Qwen / Moonshot

[Media understanding](/ja-JP/nodes/media-understanding) を参照してください。

### 3) 画像および動画生成

共有の生成機能でも provider キーを消費することがあります。

- 画像生成: OpenAI / Google / fal / MiniMax
- 動画生成: Qwen

画像生成では、`agents.defaults.imageGenerationModel` が未設定の場合、auth に基づく provider デフォルトを推論できます。動画生成では、現在 `qwen/wan2.6-t2v` のような明示的な `agents.defaults.videoGenerationModel` が必要です。

[Image generation](/ja-JP/tools/image-generation)、[Qwen Cloud](/ja-JP/providers/qwen)、および [Models](/ja-JP/concepts/models) を参照してください。

### 4) メモリ埋め込み + セマンティック検索

セマンティックメモリ検索は、リモート provider 用に設定されている場合、**埋め込み API** を使用します。

- `memorySearch.provider = "openai"` → OpenAI 埋め込み
- `memorySearch.provider = "gemini"` → Gemini 埋め込み
- `memorySearch.provider = "voyage"` → Voyage 埋め込み
- `memorySearch.provider = "mistral"` → Mistral 埋め込み
- `memorySearch.provider = "lmstudio"` → LM Studio 埋め込み（ローカル/セルフホスト）
- `memorySearch.provider = "ollama"` → Ollama 埋め込み（ローカル/セルフホスト。通常はホスト型 API 課金なし）
- ローカル埋め込みが失敗した場合のリモート provider への任意のフォールバック

`memorySearch.provider = "local"` を使えばローカルのままにできます（API 使用なし）。

[Memory](/ja-JP/concepts/memory) を参照してください。

### 5) Web 検索ツール

`web_search` は、provider に応じて使用料が発生する可能性があります。

- **Brave Search API**: `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**: `GEMINI_API_KEY` または `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**: `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**: `KIMI_API_KEY`、`MOONSHOT_API_KEY`、または `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY`、または `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: デフォルトではキー不要ですが、到達可能な Ollama ホストと `ollama signin` が必要です。ホストが必要とする場合は通常の Ollama provider bearer 認証を再利用することもできます
- **Perplexity Search API**: `PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY`、または `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: キー不要のフォールバック（API 課金なし。ただし非公式で HTML ベース）
- **SearXNG**: `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（キー不要/セルフホスト。ホスト型 API 課金なし）

レガシーな `tools.web.search.*` provider パスも一時的な互換 shim を通じて引き続き読み込まれますが、もはや推奨される config サーフェスではありません。

**Brave Search の無料クレジット:** Brave の各プランには、毎月更新される \$5/月 の無料クレジットが含まれます。Search プランは 1,000 リクエストあたり \$5 のため、このクレジットで毎月 1,000 リクエストが無料になります。予期しない課金を避けるため、Brave ダッシュボードで使用量上限を設定してください。

[Web tools](/ja-JP/tools/web) を参照してください。

### 5) Web fetch ツール（Firecrawl）

`web_fetch` は、API キーが存在する場合 **Firecrawl** を呼び出すことがあります。

- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl が設定されていない場合、このツールは直接 fetch とバンドル済みの `web-readability` Plugin にフォールバックします（有料 API なし）。ローカル Readability 抽出をスキップするには `plugins.entries.web-readability.enabled` を無効にしてください。

[Web tools](/ja-JP/tools/web) を参照してください。

### 6) Provider 使用量スナップショット（status/health）

一部の status コマンドは、割り当てウィンドウや auth health を表示するために **provider 使用量エンドポイント** を呼び出します。
これらは通常は低頻度の呼び出しですが、それでも provider API に到達します。

- `openclaw status --usage`
- `openclaw models status --json`

[Models CLI](/ja-JP/cli/models) を参照してください。

### 7) Compaction safeguard の要約

Compaction safeguard は、セッション履歴を **現在のモデル** で要約することがあり、実行時に provider API を呼び出します。

[Session management + compaction](/ja-JP/reference/session-management-compaction) を参照してください。

### 8) モデルスキャン / プローブ

`openclaw models scan` は OpenRouter モデルをプローブでき、プローブが有効な場合は `OPENROUTER_API_KEY` を使用します。

[Models CLI](/ja-JP/cli/models) を参照してください。

### 9) Talk（音声）

Talk mode は、設定されている場合 **ElevenLabs** を呼び出すことがあります。

- `ELEVENLABS_API_KEY` または `talk.providers.elevenlabs.apiKey`

[Talk mode](/ja-JP/nodes/talk) を参照してください。

### 10) Skills（サードパーティ API）

Skills は `skills.entries.<name>.apiKey` に `apiKey` を保存できます。skill がそのキーを外部 API に使う場合、その skill の provider に応じてコストが発生することがあります。

[Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [Token use and costs](/ja-JP/reference/token-use)
- [Prompt caching](/ja-JP/reference/prompt-caching)
- [Usage tracking](/ja-JP/concepts/usage-tracking)
