---
read_when:
    - web_search を有効化または設定したい場合
    - x_search を有効化または設定したい場合
    - 検索 provider を選ぶ必要がある場合
    - 自動検出と provider fallback を理解したい場合
sidebarTitle: Web Search
summary: web_search、x_search、web_fetch -- Web を検索する、X の投稿を検索する、またはページ内容を取得する
title: Web Search
x-i18n:
    generated_at: "2026-04-22T04:29:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2517d660465f850b1cfdd255fbf512dc5c828b1ef22e3b24cec6aab097ebd5
    source_path: tools/web.md
    workflow: 15
---

# Web Search

`web_search` tool は、設定された provider を使って Web を検索し、
結果を返します。結果は query ごとに 15 分間キャッシュされます（設定可能）。

OpenClaw には、X（旧 Twitter）投稿向けの `x_search` と、
軽量な URL 取得用の `web_fetch` も含まれています。この段階では、
`web_fetch` はローカルのままですが、`web_search` と `x_search` は内部で xAI Responses を使用できます。

<Info>
  `web_search` は軽量な HTTP tool であり、ブラウザー自動化ではありません。
  JS が多いサイトやログインが必要な場合は [Web Browser](/ja-JP/tools/browser) を使用してください。
  特定の URL を取得するには [Web Fetch](/ja-JP/tools/web-fetch) を使用してください。
</Info>

## クイックスタート

<Steps>
  <Step title="provider を選ぶ">
    provider を選び、必要なセットアップを完了します。provider によっては
    key 不要で、別の provider では API key を使います。詳しくは以下の
    provider ページを参照してください。
  </Step>
  <Step title="設定する">
    ```bash
    openclaw configure --section web
    ```
    これにより、provider と必要な credential が保存されます。API ベースの
    provider では、env var（たとえば `BRAVE_API_KEY`）を設定してこの手順を
    省略することもできます。
  </Step>
  <Step title="使う">
    agent はこれで `web_search` を呼び出せます:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X の投稿には次を使います:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## provider を選ぶ

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ja-JP/tools/brave-search">
    スニペット付きの構造化結果。`llm-context` モード、国/言語フィルターに対応。無料枠あり。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ja-JP/tools/duckduckgo-search">
    key 不要の fallback。API key 不要。非公式の HTML ベース統合。
  </Card>
  <Card title="Exa" icon="brain" href="/ja-JP/tools/exa-search">
    コンテンツ抽出（ハイライト、テキスト、要約）付きの neural + keyword 検索。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ja-JP/tools/firecrawl">
    構造化結果。深い抽出には `firecrawl_search` と `firecrawl_scrape` の組み合わせが最適です。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ja-JP/tools/gemini-search">
    Google Search grounding による引用付き AI 合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/ja-JP/tools/grok-search">
    xAI Web grounding による引用付き AI 合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/ja-JP/tools/kimi-search">
    Moonshot Web search による引用付き AI 合成回答。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ja-JP/tools/minimax-search">
    MiniMax Coding Plan search API による構造化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ja-JP/tools/ollama-search">
    設定済み Ollama host 経由の key 不要検索。`ollama signin` が必要です。
  </Card>
  <Card title="Perplexity" icon="search" href="/ja-JP/tools/perplexity-search">
    コンテンツ抽出制御と domain フィルタリングを備えた構造化結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/ja-JP/tools/searxng-search">
    セルフホスト型のメタ検索。API key 不要。Google、Bing、DuckDuckGo などを集約します。
  </Card>
  <Card title="Tavily" icon="globe" href="/ja-JP/tools/tavily">
    search depth、topic filtering、URL 抽出用の `tavily_extract` を備えた構造化結果。
  </Card>
</CardGroup>

### provider 比較

| Provider                                  | 結果の形式               | フィルター                                       | API key                                                                          |
| ----------------------------------------- | ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/ja-JP/tools/brave-search)              | 構造化スニペット         | 国、言語、時間、`llm-context` モード             | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/ja-JP/tools/duckduckgo-search)    | 構造化スニペット         | --                                               | なし（key 不要）                                                                 |
| [Exa](/ja-JP/tools/exa-search)                  | 構造化 + 抽出            | Neural/keyword モード、日付、コンテンツ抽出      | `EXA_API_KEY`                                                                    |
| [Firecrawl](/ja-JP/tools/firecrawl)             | 構造化スニペット         | `firecrawl_search` tool 経由                     | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/ja-JP/tools/gemini-search)            | AI 合成 + 引用           | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/ja-JP/tools/grok-search)                | AI 合成 + 引用           | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/ja-JP/tools/kimi-search)                | AI 合成 + 引用           | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/ja-JP/tools/minimax-search)   | 構造化スニペット         | リージョン（`global` / `cn`）                    | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/ja-JP/tools/ollama-search) | 構造化スニペット         | --                                               | デフォルトでは不要。`ollama signin` が必要で、host が必要とする場合は Ollama provider bearer auth を再利用できます |
| [Perplexity](/ja-JP/tools/perplexity-search)    | 構造化スニペット         | 国、言語、時間、domain、コンテンツ制限           | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/ja-JP/tools/searxng-search)          | 構造化スニペット         | category、言語                                   | なし（セルフホスト）                                                             |
| [Tavily](/ja-JP/tools/tavily)                   | 構造化スニペット         | `tavily_search` tool 経由                        | `TAVILY_API_KEY`                                                                 |

## 自動検出

## ネイティブ Codex Web search

Codex 対応 model は、OpenClaw 管理の `web_search` function の代わりに、
provider ネイティブの Responses `web_search` tool を任意で使用できます。

- `tools.web.search.openaiCodex` で設定します
- 有効になるのは Codex 対応 model のみです（`openai-codex/*` または `api: "openai-codex-responses"` を使用する provider）
- Codex 非対応 model では、引き続き管理された `web_search` が適用されます
- `mode: "cached"` がデフォルトかつ推奨設定です
- `tools.web.search.enabled: false` は管理版とネイティブ版の両方の検索を無効にします

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

ネイティブ Codex search が有効でも、現在の model が Codex 対応でない場合、
OpenClaw は通常の管理された `web_search` 動作を維持します。

## Web search のセットアップ

docs とセットアップフローの provider 一覧はアルファベット順です。自動検出は
別の優先順位を維持します。

`provider` が設定されていない場合、OpenClaw は次の順で provider を確認し、
準備できている最初のものを使用します:

まず API ベースの provider:

1. **Brave** -- `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` または `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `GEMINI_API_KEY` または `plugins.entries.google.config.webSearch.apiKey`（順序 20）
4. **Grok** -- `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` または `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` または `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）

その後に key 不要の fallback:

10. **DuckDuckGo** -- account や API key が不要な key 不要 HTML fallback（順序 100）
11. **Ollama Web Search** -- 設定済み Ollama host 経由の key 不要 fallback。Ollama に到達でき、`ollama signin` でサインイン済みである必要があり、host が必要とする場合は Ollama provider bearer auth を再利用できます（順序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

provider が検出されない場合、Brave にフォールバックします（key がない場合は、
設定を促す missing-key error が表示されます）。

<Note>
  すべての provider key field は SecretRef object をサポートします。`plugins.entries.<plugin>.config.webSearch.apiKey` 配下の plugin スコープ SecretRef は、
  provider が `tools.web.search.provider` で明示的に選ばれた場合でも、
  自動検出で選択された場合でも、バンドル済みの Exa、Firecrawl、Gemini、Grok、Kimi、Perplexity、Tavily provider に対して解決されます。
  自動検出モードでは、OpenClaw は選択された provider key のみを解決します。非選択の SecretRef は非アクティブのままなので、
  使用していない provider の解決コストを払わずに複数 provider を設定しておけます。
</Note>

## Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

provider 固有の config（API key、base URL、mode）は
`plugins.entries.<plugin>.config.webSearch.*` の下に置かれます。例については
各 provider ページを参照してください。

`web_fetch` の fallback provider 選択は別です:

- `tools.web.fetch.provider` で選択します
- またはその field を省略し、利用可能な credential から最初に準備できた web-fetch
  provider を OpenClaw に自動検出させます
- 現在、バンドル済みの web-fetch provider は Firecrawl で、
  `plugins.entries.firecrawl.config.webFetch.*` の下で設定します

`openclaw onboard` または
`openclaw configure --section web` で **Kimi** を選ぶと、OpenClaw は次も確認することがあります:

- Moonshot API リージョン（`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`）
- デフォルトの Kimi Web search model（デフォルトは `kimi-k2.6`）

`x_search` については `plugins.entries.xai.config.xSearch.*` を設定します。これは
Grok Web search と同じ `XAI_API_KEY` fallback を使用します。
レガシーな `tools.web.x_search.*` config は `openclaw doctor --fix` により自動移行されます。
`openclaw onboard` または `openclaw configure --section web` で Grok を選ぶと、
OpenClaw は同じ key を使う任意の `x_search` セットアップも提示できます。
これは Grok パス内の個別の追加ステップであり、独立したトップレベルの
web-search provider 選択ではありません。別の provider を選んだ場合、
OpenClaw は `x_search` のプロンプトを表示しません。

### API key の保存

<Tabs>
  <Tab title="Config file">
    `openclaw configure --section web` を実行するか、key を直接設定します:

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
  <Tab title="Environment variable">
    Gateway process の環境変数に provider の env var を設定します:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Gateway install では、これを `~/.openclaw/.env` に置いてください。
    [Env vars](/ja-JP/help/faq#env-vars-and-env-loading) を参照してください。

  </Tab>
</Tabs>

## tool parameter

| Parameter             | 説明                                                   |
| --------------------- | ------------------------------------------------------ |
| `query`               | 検索 query（必須）                                     |
| `count`               | 返す結果数（1-10、デフォルト: 5）                      |
| `country`             | 2 文字の ISO 国コード（例: `"US"`, `"DE"`）            |
| `language`            | ISO 639-1 言語コード（例: `"en"`, `"de"`）             |
| `search_lang`         | 検索言語コード（Brave のみ）                           |
| `freshness`           | 時間フィルター: `day`、`week`、`month`、`year`         |
| `date_after`          | この日付以降の結果（YYYY-MM-DD）                       |
| `date_before`         | この日付以前の結果（YYYY-MM-DD）                       |
| `ui_lang`             | UI 言語コード（Brave のみ）                            |
| `domain_filter`       | domain allowlist/denylist 配列（Perplexity のみ）      |
| `max_tokens`          | 総コンテンツ予算、デフォルト 25000（Perplexity のみ）  |
| `max_tokens_per_page` | ページごとの token 上限、デフォルト 2048（Perplexity のみ） |

<Warning>
  すべての parameter がすべての provider で動作するわけではありません。Brave の `llm-context` モードは
  `ui_lang`、`freshness`、`date_after`、`date_before` を拒否します。
  Gemini、Grok、Kimi は引用付きの 1 つの合成回答を返します。これらは共有 tool 互換性のために `count` を受け付けますが、
  grounded answer の形は変わりません。
  Perplexity も Sonar/OpenRouter
  互換パス（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` または `OPENROUTER_API_KEY`）を使う場合は同様に動作します。
  SearXNG は trusted な private-network または loopback host に対してのみ `http://` を受け付けます。
  public な SearXNG endpoint では `https://` を使用する必要があります。
  Firecrawl と Tavily は `web_search` 経由では `query` と `count` のみをサポートします --
  高度なオプションにはそれぞれの専用 tool を使用してください。
</Warning>

## x_search

`x_search` は xAI を使って X（旧 Twitter）投稿を検索し、
引用付きの AI 合成回答を返します。自然言語 query と、任意の構造化フィルターを受け付けます。OpenClaw は、この tool call を処理する request に対してのみ、
組み込み xAI `x_search` tool を有効にします。

<Note>
  xAI のドキュメントでは、`x_search` は keyword search、semantic search、user
  search、thread fetch をサポートしています。repost、reply、bookmark、view などの投稿ごとの engagement 統計には、
  正確な投稿 URL または status ID を対象にした lookup を優先してください。
  broad な keyword search でも正しい投稿が見つかることはありますが、
  投稿ごとの metadata は不完全になりやすいです。よいパターンは、
  まず投稿を特定し、その後その正確な投稿に絞った 2 回目の `x_search` query を実行することです。
</Note>

### x_search config

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
            apiKey: "xai-...", // XAI_API_KEY が設定されていれば任意
          },
        },
      },
    },
  },
}
```

### x_search parameter

| Parameter                    | 説明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 検索 query（必須）                                     |
| `allowed_x_handles`          | 結果を特定の X handle に制限する                       |
| `excluded_x_handles`         | 特定の X handle を除外する                             |
| `from_date`                  | この日付以降の投稿のみを含める（YYYY-MM-DD）           |
| `to_date`                    | この日付以前の投稿のみを含める（YYYY-MM-DD）           |
| `enable_image_understanding` | xAI に一致した投稿に添付された画像を解析させる         |
| `enable_video_understanding` | xAI に一致した投稿に添付された動画を解析させる         |

### x_search の例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 投稿ごとの統計: 可能なら正確な status URL または status ID を使用する
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

// domain フィルタリング（Perplexity のみ）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## tool profile

tool profile または allowlist を使用する場合は、`web_search`、`x_search`、または `group:web` を追加してください:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // または: allow: ["group:web"]  （web_search、x_search、web_fetch を含む）
  },
}
```

## 関連

- [Web Fetch](/ja-JP/tools/web-fetch) -- URL を取得して読みやすい内容を抽出する
- [Web Browser](/ja-JP/tools/browser) -- JS の多いサイト向けの完全なブラウザー自動化
- [Grok Search](/ja-JP/tools/grok-search) -- `web_search` provider としての Grok
- [Ollama Web Search](/ja-JP/tools/ollama-search) -- Ollama host 経由の key 不要 Web search
