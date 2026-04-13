---
read_when:
    - どの機能が有料 API を呼び出す可能性があるかを把握したい場合
    - キー、費用、使用状況の可視性を監査する必要がある場合
    - '`/status` または `/usage` の費用レポートについて説明している場合'
summary: 何が費用を発生させるか、どのキーが使われるか、そして使用状況を確認する方法を監査する
title: API の使用状況と費用
x-i18n:
    generated_at: "2026-04-13T08:50:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5077e74d38ef781ac7a72603e9f9e3829a628b95c5a9967915ab0f321565429
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API の使用状況と費用

このドキュメントでは、**API キーを呼び出す可能性がある機能**と、その費用がどこに表示されるかを一覧化しています。主に、
プロバイダー使用量や有料 API 呼び出しを発生させる可能性がある OpenClaw の機能に焦点を当てています。

## 費用が表示される場所（チャット + CLI）

**セッションごとの費用スナップショット**

- `/status` は、現在のセッションモデル、コンテキスト使用量、最後の応答トークン数を表示します。
- モデルが **API キー認証** を使用している場合、`/status` は最後の返信の **推定費用** も表示します。
- ライブセッションのメタデータが乏しい場合、`/status` は最新の transcript usage
  エントリからトークン / キャッシュのカウンターと、アクティブなランタイムモデルラベルを復元できます。既存の 0 以外のライブ値は引き続き優先され、保存済み合計がないかそれより小さい場合は、プロンプトサイズの transcript 合計が優先されることがあります。

**メッセージごとの費用フッター**

- `/usage full` は、**推定費用**（API キー使用時のみ）を含む使用量フッターをすべての返信に付加します。
- `/usage tokens` はトークン数のみを表示します。サブスクリプション型の OAuth / token および CLI フローではドル費用は表示されません。
- Gemini CLI 注記: CLI が JSON 出力を返す場合、OpenClaw は `stats` から使用量を読み取り、
  `stats.cached` を `cacheRead` に正規化し、必要に応じて
  `stats.input_tokens - stats.cached` から入力トークン数を導出します。

Anthropic 注記: Anthropic のスタッフから、OpenClaw スタイルの Claude CLI 使用は
再び許可されていると案内があったため、Anthropic が新しいポリシーを公開しない限り、
OpenClaw はこの統合における Claude CLI の再利用と `claude -p` の使用を許可済みとして扱います。
ただし Anthropic は、OpenClaw が `/usage full` に表示できるメッセージ単位のドル建て推定額を
依然として公開していません。

**CLI の使用量ウィンドウ（プロバイダーのクォータ）**

- `openclaw status --usage` と `openclaw channels list` は、プロバイダーの **使用量ウィンドウ**
  （メッセージごとの費用ではなく、クォータのスナップショット）を表示します。
- 人間向け出力は、プロバイダー間で `X% left` に正規化されます。
- 現在の使用量ウィンドウ対応プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi、z.ai。
- MiniMax 注記: 生の `usage_percent` / `usagePercent` フィールドは残り
  クォータを意味するため、OpenClaw は表示前にこれを反転します。件数ベースのフィールドが存在する場合は、そちらが引き続き優先されます。プロバイダーが `model_remains` を返す場合、OpenClaw はチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- これらのクォータウィンドウの使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。利用できない場合、OpenClaw は auth profiles、env、または config から一致する OAuth / API キー認証情報にフォールバックします。

詳細と例は [Token use & costs](/ja-JP/reference/token-use) を参照してください。

## キーの検出方法

OpenClaw は以下から認証情報を取得できます。

- **Auth profiles**（エージェントごと、`auth-profiles.json` に保存）
- **Environment variables**（例: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`）
- **Config**（`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`）
- **Skills**（`skills.entries.<name>.apiKey`）。この値は skill プロセスの env にキーをエクスポートすることがあります。

## キーを消費する可能性がある機能

### 1) コアモデル応答（チャット + ツール）

すべての返信またはツール呼び出しは、**現在のモデルプロバイダー**（OpenAI、Anthropic など）を使用します。これは
使用量と費用の主な発生源です。

これには、OpenClaw のローカル UI の外側で課金されるサブスクリプション型のホスト型プロバイダーも含まれます。たとえば **OpenAI Codex**、**Alibaba Cloud Model Studio
Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**、
および **Extra Usage** を有効にした Anthropic の OpenClaw Claude-login 経路です。

価格設定については [Models](/ja-JP/providers/models)、表示については [Token use & costs](/ja-JP/reference/token-use) を参照してください。

### 2) メディア理解（音声 / 画像 / 動画）

受信したメディアは、返信の実行前に要約または文字起こしされることがあります。これにはモデル / プロバイダー API が使われます。

- 音声: OpenAI / Groq / Deepgram / Google / Mistral
- 画像: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI
- 動画: Google / Qwen / Moonshot

[Media understanding](/ja-JP/nodes/media-understanding) を参照してください。

### 3) 画像生成と動画生成

共有の生成機能でもプロバイダーキーを消費することがあります。

- 画像生成: OpenAI / Google / fal / MiniMax
- 動画生成: Qwen

画像生成では、`agents.defaults.imageGenerationModel` が未設定の場合、
認証情報に基づくプロバイダーのデフォルトを推論できます。動画生成は現在、
`qwen/wan2.6-t2v` のような明示的な `agents.defaults.videoGenerationModel` を必要とします。

[Image generation](/ja-JP/tools/image-generation)、[Qwen Cloud](/ja-JP/providers/qwen)、
および [Models](/ja-JP/concepts/models) を参照してください。

### 4) メモリ埋め込み + セマンティック検索

セマンティックメモリ検索では、リモートプロバイダー用に設定されている場合、**埋め込み API** を使用します。

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings（ローカル / セルフホスト）
- `memorySearch.provider = "ollama"` → Ollama embeddings（ローカル / セルフホスト。通常はホスト型 API 課金なし）
- ローカル埋め込みが失敗した場合、オプションでリモートプロバイダーにフォールバック

`memorySearch.provider = "local"` を使えばローカルのままにでき、API 使用は発生しません。

[Memory](/ja-JP/concepts/memory) を参照してください。

### 5) Web 検索ツール

`web_search` は、利用するプロバイダーによっては使用量料金が発生する場合があります。

- **Brave Search API**: `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` または `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, または `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, または `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: デフォルトではキー不要ですが、到達可能な Ollama ホストと `ollama signin` が必要です。ホストが必要とする場合は通常の Ollama プロバイダー bearer auth も再利用できます
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, または `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: キー不要のフォールバック（API 課金なし。ただし非公式で HTML ベース）
- **SearXNG**: `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（キー不要 / セルフホスト。ホスト型 API 課金なし）

従来の `tools.web.search.*` プロバイダーパスも一時的な互換 shim を通じて引き続き読み込まれますが、現在は推奨される config surface ではありません。

**Brave Search の無料クレジット:** 各 Brave プランには、毎月更新される
\$5/月の無料クレジットが含まれます。Search プランの料金は 1,000 リクエストあたり \$5 のため、
このクレジットで毎月 1,000 リクエストを無料でまかなえます。想定外の請求を避けるため、
Brave ダッシュボードで使用量上限を設定してください。

[Web tools](/ja-JP/tools/web) を参照してください。

### 5) Web fetch ツール（Firecrawl）

`web_fetch` は、API キーが存在する場合 **Firecrawl** を呼び出すことがあります。

- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl が設定されていない場合、このツールは direct fetch + readability にフォールバックします（有料 API なし）。

[Web tools](/ja-JP/tools/web) を参照してください。

### 6) プロバイダー使用量スナップショット（status/health）

一部の status コマンドは、クォータウィンドウや認証の健全性を表示するために **プロバイダー使用量エンドポイント** を呼び出します。
これらは通常は少量の呼び出しですが、それでもプロバイダー API にはアクセスします。

- `openclaw status --usage`
- `openclaw models status --json`

[Models CLI](/cli/models) を参照してください。

### 7) Compaction 保護の要約

Compaction 保護は、セッション履歴を **現在のモデル** で要約することがあり、
実行時にはプロバイダー API を呼び出します。

[Session management + compaction](/ja-JP/reference/session-management-compaction) を参照してください。

### 8) モデルスキャン / プローブ

`openclaw models scan` は OpenRouter モデルをプローブでき、有効時には `OPENROUTER_API_KEY` を使用します。

[Models CLI](/cli/models) を参照してください。

### 9) Talk（音声）

Talk モードは、設定されている場合 **ElevenLabs** を呼び出すことがあります。

- `ELEVENLABS_API_KEY` または `talk.providers.elevenlabs.apiKey`

[Talk mode](/ja-JP/nodes/talk) を参照してください。

### 10) Skills（サードパーティ API）

Skills は `skills.entries.<name>.apiKey` に `apiKey` を保存できます。skill がそのキーを外部
API に使用する場合、その skill のプロバイダーに応じた費用が発生する可能性があります。

[Skills](/ja-JP/tools/skills) を参照してください。
