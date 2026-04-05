---
read_when:
    - どの機能が有料 API を呼び出す可能性があるかを理解したい場合
    - キー、コスト、使用状況の可視性を監査する必要がある場合
    - '`/status` または `/usage` の cost 表示を説明する場合'
summary: 何が費用を発生させる可能性があるか、どのキーが使われるか、使用状況の見方を監査する
title: API Usage and Costs
x-i18n:
    generated_at: "2026-04-05T12:55:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71789950fe54dcdcd3e34c8ad6e3143f749cdfff5bbc2f14be4b85aaa467b14c
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 使用量とコスト

このドキュメントでは、**API キーを使用しうる機能** と、そのコストがどこに表示されるかを一覧にしています。
主に、provider 使用量や有料 API 呼び出しを発生させる可能性のある OpenClaw 機能に焦点を当てています。

## コストが表示される場所（chat + CLI）

**セッションごとの cost スナップショット**

- `/status` には、現在のセッションモデル、コンテキスト使用量、最後の応答トークン数が表示されます。
- モデルが **API キー auth** を使用している場合、`/status` には最後の返信の **推定コスト** も表示されます。
- ライブセッションメタデータが疎な場合、`/status` は最新の transcript usage
  エントリーからトークン / キャッシュカウンターとアクティブな runtime model ラベルを復元できます。既存の非ゼロのライブ値は引き続き優先され、保存済み合計が欠けているか小さい場合は、prompt サイズの transcript 合計が優先されることがあります。

**メッセージごとの cost フッター**

- `/usage full` は、**推定コスト**（API キーのみを使用）を含む usage フッターを各返信に追加します。
- `/usage tokens` はトークンのみを表示します。サブスクリプション型の OAuth / token や CLI フローではドル建てコストは表示されません。
- Gemini CLI に関する注意: CLI が JSON 出力を返す場合、OpenClaw は
  `stats` から usage を読み取り、`stats.cached` を `cacheRead` に正規化し、必要に応じて
  `stats.input_tokens - stats.cached` から input token を導出します。

Anthropic に関する注意: Anthropic の公開 Claude Code ドキュメントには、直接の Claude
Code ターミナル使用が依然として Claude プラン制限に含まれています。一方で、Anthropic は OpenClaw
ユーザーに対し、**2026 年 4 月 4 日 午後 12:00 PT / 午後 8:00 BST** から、
**OpenClaw** の Claude ログイン経路はサードパーティ harness 使用として扱われ、
サブスクリプションとは別に請求される **Extra Usage** が必要になると伝えています。
Anthropic は、OpenClaw が `/usage full` に表示できるメッセージ単位のドル推定値を提供していません。

**CLI usage window（provider quota）**

- `openclaw status --usage` と `openclaw channels list` は、provider の **usage window**
  を表示します（メッセージごとのコストではなく、quota スナップショットです）。
- 人間向け出力は provider をまたいで `X% left` に正規化されます。
- 現在の usage window provider: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai。
- MiniMax に関する注意: 生の `usage_percent` / `usagePercent` フィールドは残り
  quota を意味するため、OpenClaw は表示前にそれらを反転します。件数ベースのフィールドが存在する場合は、引き続きそちらが優先されます。provider が `model_remains` を返す場合、OpenClaw は chat-model エントリーを優先し、必要に応じてタイムスタンプから window ラベルを導出し、プランラベルにモデル名を含めます。
- これらの quota window の usage auth は、利用可能な場合は provider 固有の hook から取得されます。それ以外の場合、OpenClaw は auth profile、env、または config にある一致する OAuth / API キー認証情報にフォールバックします。

詳細と例については [Token use & costs](/reference/token-use) を参照してください。

## キーがどのように検出されるか

OpenClaw は、次の場所から認証情報を取得できます:

- **Auth profile**（エージェントごと、`auth-profiles.json` に保存）
- **環境変数**（例: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`）
- **config**（`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`）
- **Skills**（`skills.entries.<name>.apiKey`）。skill のプロセス env にキーをエクスポートできます

## キーを使用する可能性がある機能

### 1) core のモデル応答（chat + tools）

すべての返信または tool 呼び出しは、**現在のモデル provider**（OpenAI, Anthropic など）を使用します。これが使用量とコストの主な発生源です。

これには、OpenClaw のローカル UI 外で引き続き課金されるサブスクリプション型のホスト provider も含まれます。たとえば **OpenAI Codex**、**Alibaba Cloud Model Studio
Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**、および
**Extra Usage** が有効な Anthropic の OpenClaw Claude-login 経路です。

価格設定 config については [Models](/providers/models)、表示については [Token use & costs](/reference/token-use) を参照してください。

### 2) media understanding（音声 / 画像 / 動画）

受信メディアは、返信実行前に要約 / 文字起こしされることがあります。これは model / provider API を使用します。

- 音声: OpenAI / Groq / Deepgram / Google / Mistral
- 画像: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI
- 動画: Google / Qwen / Moonshot

[Media understanding](/nodes/media-understanding) を参照してください。

### 3) 画像生成と動画生成

共有の生成機能でも provider キーを消費することがあります:

- 画像生成: OpenAI / Google / fal / MiniMax
- 動画生成: Qwen

画像生成では、`agents.defaults.imageGenerationModel` が未設定のとき、
auth に裏付けられた provider デフォルトを推論できます。動画生成では現在、
`qwen/wan2.6-t2v` のような明示的な `agents.defaults.videoGenerationModel` が必要です。

[Image generation](/tools/image-generation), [Qwen Cloud](/providers/qwen),
[Models](/concepts/models) を参照してください。

### 4) memory embedding + セマンティック検索

セマンティック memory 検索は、リモート provider 用に設定されている場合、
**embedding API** を使用します:

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "ollama"` → Ollama embeddings（ローカル / セルフホスト型。通常はホスト型 API 課金なし）
- ローカル embedding が失敗した場合、任意でリモート provider にフォールバック

`memorySearch.provider = "local"` を使えばローカルに保てます（API 使用なし）。

[Memory](/concepts/memory) を参照してください。

### 5) web search ツール

`web_search` は provider によって使用料金が発生することがあります:

- **Brave Search API**: `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**: `GEMINI_API_KEY` または `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**: `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, または `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, または `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: デフォルトではキー不要ですが、到達可能な Ollama ホストと `ollama signin` が必要です。ホストが必要とする場合は通常の Ollama provider bearer auth を再利用することもできます
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, または `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: キー不要のフォールバック（API 課金なし。ただし非公式で HTML ベース）
- **SearXNG**: `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（キー不要 / セルフホスト型。ホスト型 API 課金なし）

レガシーの `tools.web.search.*` provider path も一時的な互換 shim を通じて引き続き読み込まれますが、もはや推奨される config サーフェスではありません。

**Brave Search の無料クレジット:** 各 Brave プランには、毎月更新される
5 ドル分の無料クレジットが含まれます。Search プランは 1,000 リクエストあたり 5 ドルなので、
このクレジットで月 1,000 リクエストまで無料になります。予期しない請求を避けるため、
Brave ダッシュボードで usage 上限を設定してください。

[Web tools](/tools/web) を参照してください。

### 5) web fetch ツール（Firecrawl）

`web_fetch` は、API キーがある場合に **Firecrawl** を呼び出すことがあります:

- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl が設定されていない場合、この tool は直接 fetch + readability にフォールバックします（有料 API なし）。

[Web tools](/tools/web) を参照してください。

### 6) provider usage スナップショット（status / health）

一部の status コマンドは、quota window や auth health を表示するために **provider usage endpoint** を呼び出します。
これらは通常は低頻度の呼び出しですが、それでも provider API には到達します:

- `openclaw status --usage`
- `openclaw models status --json`

[Models CLI](/cli/models) を参照してください。

### 7) compaction の safeguard 要約

compaction safeguard は、**現在のモデル** を使ってセッション履歴を要約することがあり、
実行されると provider API を呼び出します。

[Session management + compaction](/reference/session-management-compaction) を参照してください。

### 8) model scan / probe

`openclaw models scan` は OpenRouter モデルを probe でき、有効時の
probe に `OPENROUTER_API_KEY` を使用します。

[Models CLI](/cli/models) を参照してください。

### 9) Talk（speech）

Talk mode は、設定されている場合に **ElevenLabs** を呼び出すことがあります:

- `ELEVENLABS_API_KEY` または `talk.providers.elevenlabs.apiKey`

[Talk mode](/nodes/talk) を参照してください。

### 10) Skills（サードパーティ API）

Skills は `skills.entries.<name>.apiKey` に `apiKey` を保存できます。skill がそのキーを外部
API に使用する場合、その skill の provider に応じてコストが発生することがあります。

[Skills](/tools/skills) を参照してください。
