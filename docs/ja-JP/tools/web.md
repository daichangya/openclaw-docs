---
read_when:
    - '`web_search` を有効化または設定したいとき'
    - '`x_search` を有効化または設定したいとき'
    - 検索プロバイダーを選ぶ必要があるとき
    - 自動検出とプロバイダーフォールバックを理解したいとき
sidebarTitle: Web Search
summary: '`web_search`、`x_search`、`web_fetch` -- Web を検索し、X の投稿を検索し、ページ内容を取得する'
title: Web Search
x-i18n:
    generated_at: "2026-04-05T13:01:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8b9a5d641dcdcbe7c099c8862898f12646f43151b6c4152d69c26af9b17e0fa
    source_path: tools/web.md
    workflow: 15
---

# Web Search

`web_search` ツールは、設定済みのプロバイダーを使って Web を検索し、
結果を返します。結果はクエリごとに 15 分間キャッシュされます（設定可能）。

OpenClaw には、X（旧 Twitter）の投稿向けの `x_search` と、
軽量な URL 取得のための `web_fetch` も含まれています。このフェーズでは、`web_fetch` は
ローカルのままで、`web_search` と `x_search` は内部的に xAI Responses を使うことがあります。

<Info>
  `web_search` は軽量な HTTP ツールであり、ブラウザー自動化ではありません。
  JS の多いサイトやログインが必要な場合は [Web Browser](/tools/browser) を使ってください。
  特定の URL を取得するには、[Web Fetch](/tools/web-fetch) を使ってください。
</Info>

## クイックスタート

<Steps>
  <Step title="プロバイダーを選ぶ">
    プロバイダーを選び、必要なセットアップを完了してください。プロバイダーによっては
    API キー不要で使えますが、API キーを使うものもあります。詳細は下記の
    プロバイダーページを参照してください。
  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    ```
    これにより、プロバイダーと必要な認証情報が保存されます。API ベースの
    プロバイダーでは、環境変数（たとえば `BRAVE_API_KEY`）を設定して
    この手順を省略することもできます。
  </Step>
  <Step title="使う">
    これでエージェントは `web_search` を呼び出せます。

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X の投稿には次を使います。

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## プロバイダーを選ぶ

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tools/brave-search">
    スニペット付きの構造化結果。`llm-context` モード、国/言語フィルターに対応。無料枠あり。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tools/duckduckgo-search">
    API キー不要のフォールバック。API キーは不要。非公式の HTML ベース統合。
  </Card>
  <Card title="Exa" icon="brain" href="/tools/exa-search">
    コンテンツ抽出（ハイライト、テキスト、要約）付きのニューラル + キーワード検索。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tools/firecrawl">
    構造化結果。深い抽出には `firecrawl_search` と `firecrawl_scrape` の組み合わせが最適。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tools/gemini-search">
    Google Search grounding による、引用付きの AI 合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/tools/grok-search">
    xAI Web grounding による、引用付きの AI 合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/tools/kimi-search">
    Moonshot Web 検索による、引用付きの AI 合成回答。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tools/minimax-search">
    MiniMax Coding Plan 検索 API による構造化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tools/ollama-search">
    設定済みの Ollama ホスト経由の API キー不要検索。`ollama signin` が必要です。
  </Card>
  <Card title="Perplexity" icon="search" href="/tools/perplexity-search">
    コンテンツ抽出制御とドメインフィルタリング付きの構造化結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/tools/searxng-search">
    セルフホスト型メタ検索。API キー不要。Google、Bing、DuckDuckGo などを集約します。
  </Card>
  <Card title="Tavily" icon="globe" href="/tools/tavily">
    検索深度、トピックフィルタリング、および URL 抽出用の `tavily_extract` を備えた構造化結果。
  </Card>
</CardGroup>

### プロバイダー比較

| Provider                                  | 結果スタイル               | フィルター                                       | API キー                                                                              |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| [Brave](/tools/brave-search)              | 構造化スニペット           | 国、言語、時間、`llm-context` モード             | `BRAVE_API_KEY`                                                                       |
| [DuckDuckGo](/tools/duckduckgo-search)    | 構造化スニペット           | --                                               | なし（API キー不要）                                                                  |
| [Exa](/tools/exa-search)                  | 構造化 + 抽出済み内容      | ニューラル/キーワードモード、日付、コンテンツ抽出 | `EXA_API_KEY`                                                                         |
| [Firecrawl](/tools/firecrawl)             | 構造化スニペット           | `firecrawl_search` ツール経由                    | `FIRECRAWL_API_KEY`                                                                   |
| [Gemini](/tools/gemini-search)            | AI 合成 + 引用             | --                                               | `GEMINI_API_KEY`                                                                      |
| [Grok](/tools/grok-search)                | AI 合成 + 引用             | --                                               | `XAI_API_KEY`                                                                         |
| [Kimi](/tools/kimi-search)                | AI 合成 + 引用             | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                   |
| [MiniMax Search](/tools/minimax-search)   | 構造化スニペット           | リージョン（`global` / `cn`）                    | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                    |
| [Ollama Web Search](/tools/ollama-search) | 構造化スニペット           | --                                               | デフォルトでは不要。`ollama signin` が必要。Ollama プロバイダーの bearer auth を再利用可能 |
| [Perplexity](/tools/perplexity-search)    | 構造化スニペット           | 国、言語、時間、ドメイン、コンテンツ制限         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                           |
| [SearXNG](/tools/searxng-search)          | 構造化スニペット           | カテゴリ、言語                                   | なし（セルフホスト）                                                                  |
| [Tavily](/tools/tavily)                   | 構造化スニペット           | `tavily_search` ツール経由                       | `TAVILY_API_KEY`                                                                      |

## 自動検出

## ネイティブ Codex Web 検索

Codex 対応モデルは、OpenClaw 管理の `web_search` 関数の代わりに、
プロバイダーネイティブな Responses `web_search` ツールを使うこともできます。

- これは `tools.web.search.openaiCodex` で設定します
- 有効になるのは Codex 対応モデル（`openai-codex/*` または `api: "openai-codex-responses"` を使うプロバイダー）のみです
- Codex 非対応モデルには、引き続き管理された `web_search` が適用されます
- `mode: "cached"` がデフォルトであり、推奨設定です
- `tools.web.search.enabled: false` は管理型検索とネイティブ検索の両方を無効化します

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

ネイティブ Codex 検索が有効でも、現在のモデルが Codex 対応でない場合、OpenClaw は通常の管理型 `web_search` の挙動を維持します。

## Web 検索を設定する

ドキュメントとセットアップフローのプロバイダー一覧はアルファベット順です。自動検出は
別の優先順位を維持します。

`provider` が設定されていない場合、OpenClaw は次の順でプロバイダーを確認し、
準備ができている最初のものを使います。

まず API ベースのプロバイダー:

1. **Brave** -- `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` または `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `GEMINI_API_KEY` または `plugins.entries.google.config.webSearch.apiKey`（順序 20）
4. **Grok** -- `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` または `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` または `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）

その後に API キー不要のフォールバック:

10. **DuckDuckGo** -- アカウントや API キー不要の、HTML ベースの API キー不要フォールバック（順序 100）
11. **Ollama Web Search** -- 設定済みの Ollama ホスト経由の API キー不要フォールバック。Ollama に到達可能であり、`ollama signin` でサインイン済みである必要があります。ホストが必要とする場合は Ollama プロバイダーの bearer auth を再利用できます（順序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

プロバイダーが検出されない場合は Brave にフォールバックします（設定を促す missing-key
エラーが表示されます）。

<Note>
  すべてのプロバイダーキーフィールドは SecretRef オブジェクトをサポートします。自動検出モードでは、
  OpenClaw は選択されたプロバイダーキーのみを解決し、選択されなかった SecretRefs
  は非アクティブのままです。
</Note>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // デフォルト: true
        provider: "brave", // または自動検出のために省略
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

プロバイダー固有の設定（API キー、base URL、モード）は
`plugins.entries.<plugin>.config.webSearch.*` の下にあります。例は
各プロバイダーページを参照してください。

`web_fetch` のフォールバックプロバイダー選択は別です。

- `tools.web.fetch.provider` で選びます
- またはそのフィールドを省略して、利用可能な認証情報から最初に準備ができている web-fetch
  プロバイダーを OpenClaw に自動検出させます
- 現在の同梱 web-fetch プロバイダーは Firecrawl で、
  `plugins.entries.firecrawl.config.webFetch.*` で設定します

`openclaw onboard` または
`openclaw configure --section web` 中に **Kimi** を選ぶと、OpenClaw は次も質問できます。

- Moonshot API リージョン（`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`）
- デフォルトの Kimi web-search モデル（デフォルトは `kimi-k2.5`）

`x_search` については、`plugins.entries.xai.config.xSearch.*` を設定します。これは
Grok Web 検索と同じ `XAI_API_KEY` フォールバックを使います。
レガシーな `tools.web.x_search.*` config は `openclaw doctor --fix` によって自動移行されます。
`openclaw onboard` または `openclaw configure --section web` 中に Grok を選ぶと、
OpenClaw は同じキーを使った任意の `x_search` セットアップも案内できます。
これは Grok 経路内の別の追加入力ステップであり、トップレベルの
Web 検索プロバイダー選択とは別です。別のプロバイダーを選んだ場合、OpenClaw は
`x_search` のプロンプトを表示しません。

### API キーの保存

<Tabs>
  <Tab title="設定ファイル">
    `openclaw configure --section web` を実行するか、キーを直接設定します。

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="環境変数">
    Gateway プロセス環境でプロバイダー環境変数を設定します。

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    gateway インストールでは、これを `~/.openclaw/.env` に置きます。
    [Env vars](/ja-JP/help/faq#env-vars-and-env-loading) を参照してください。

  </Tab>
</Tabs>

## ツールパラメーター

| Parameter             | 説明                                                   |
| --------------------- | ------------------------------------------------------ |
| `query`               | 検索クエリ（必須）                                     |
| `count`               | 返す結果数（1〜10、デフォルト: 5）                     |
| `country`             | 2 文字の ISO 国コード（例: "US"、"DE"）                |
| `language`            | ISO 639-1 言語コード（例: "en"、"de"）                 |
| `search_lang`         | 検索言語コード（Brave のみ）                           |
| `freshness`           | 時間フィルター: `day`、`week`、`month`、または `year`  |
| `date_after`          | この日付以降の結果（YYYY-MM-DD）                       |
| `date_before`         | この日付以前の結果（YYYY-MM-DD）                       |
| `ui_lang`             | UI 言語コード（Brave のみ）                            |
| `domain_filter`       | ドメインの許可/拒否リスト配列（Perplexity のみ）       |
| `max_tokens`          | 総コンテンツ予算、デフォルト 25000（Perplexity のみ）  |
| `max_tokens_per_page` | ページごとのトークン上限、デフォルト 2048（Perplexity のみ） |

<Warning>
  すべてのパラメーターがすべてのプロバイダーで使えるわけではありません。Brave の `llm-context` モードは
  `ui_lang`、`freshness`、`date_after`、`date_before` を受け付けません。
  Gemini、Grok、Kimi は、引用付きの 1 つの合成回答を返します。これらは
  共有ツール互換性のために `count` を受け付けますが、
  grounding された回答の形は変わりません。
  Perplexity でも、Sonar/OpenRouter
  互換経路（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` または `OPENROUTER_API_KEY`）を使う場合は同様です。
  SearXNG は、信頼されたプライベートネットワークまたは loopback ホストに対してのみ `http://` を受け付けます。
  公開 SearXNG エンドポイントでは `https://` を使う必要があります。
  Firecrawl と Tavily は `web_search` では `query` と `count` のみをサポートします。
  高度なオプションには、それぞれの専用ツールを使ってください。
</Warning>

## x_search

`x_search` は xAI を使って X（旧 Twitter）の投稿をクエリし、
引用付きの AI 合成回答を返します。自然言語クエリと、
任意の構造化フィルターを受け付けます。OpenClaw は、このツール呼び出しに対応するリクエストでのみ、
組み込みの xAI `x_search` ツールを有効にします。

<Note>
  xAI のドキュメントでは、`x_search` はキーワード検索、セマンティック検索、ユーザー
  検索、スレッド取得をサポートするとされています。reposts、
  replies、bookmarks、views のような投稿ごとのエンゲージメント統計については、正確な投稿 URL
  または status ID を対象にしたルックアップを優先してください。
  幅広いキーワード検索でも正しい投稿が見つかることはありますが、返ってくる
  投稿ごとのメタデータは不完全になりがちです。良いパターンは、
  まず投稿を特定し、その後でその正確な投稿に絞った 2 回目の `x_search` クエリを実行することです。
</Note>

### x_search の設定

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // XAI_API_KEY が設定されていれば省略可
          },
        },
      },
    },
  },
}
```

### x_search パラメーター

| Parameter                    | 説明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 検索クエリ（必須）                                     |
| `allowed_x_handles`          | 結果を特定の X ハンドルに限定する                      |
| `excluded_x_handles`         | 特定の X ハンドルを除外する                            |
| `from_date`                  | この日付以降の投稿のみを含める（YYYY-MM-DD）           |
| `to_date`                    | この日付以前の投稿のみを含める（YYYY-MM-DD）           |
| `enable_image_understanding` | xAI に一致した投稿に添付された画像を検査させる         |
| `enable_video_understanding` | xAI に一致した投稿に添付された動画を検査させる         |

### x_search の例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 投稿ごとの統計: 可能な限り正確な status URL または status ID を使う
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 例

```javascript
// 基本検索
await web_search({ query: "OpenClaw plugin SDK" });

// ドイツ向け検索
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// 最近の結果（過去 1 週間）
await web_search({ query: "AI developments", freshness: "week" });

// 日付範囲
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// ドメインフィルタリング（Perplexity のみ）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## ツールプロファイル

ツールプロファイルまたは許可リストを使っている場合は、`web_search`、`x_search`、または `group:web` を追加してください。

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // または: allow: ["group:web"]  （web_search、x_search、web_fetch を含む）
  },
}
```

## 関連

- [Web Fetch](/tools/web-fetch) -- URL を取得して読みやすい内容を抽出する
- [Web Browser](/tools/browser) -- JS の多いサイト向けの完全なブラウザー自動化
- [Grok Search](/tools/grok-search) -- `web_search` プロバイダーとしての Grok
- [Ollama Web Search](/tools/ollama-search) -- Ollama ホスト経由の API キー不要 Web 検索
