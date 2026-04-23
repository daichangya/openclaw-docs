---
read_when:
    - '`web_search`を有効化または設定したい場合'
    - '`x_search`を有効化または設定したい場合'
    - 検索providerを選ぶ必要がある場合
    - 自動検出とproviderフォールバックを理解したい場合
sidebarTitle: Web Search
summary: web_search、x_search、web_fetch -- webを検索し、X投稿を検索し、ページ内容を取得する
title: web検索
x-i18n:
    generated_at: "2026-04-23T04:52:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e568670e1e15f195dbac1a249723a2ad873d6c49217575959b8eea2cb14ef75
    source_path: tools/web.md
    workflow: 15
---

# web検索

`web_search` toolは、設定されたproviderを使ってwebを検索し、結果を返します。
結果はクエリごとに15分間キャッシュされます（設定可能）。

OpenClawには、X（旧Twitter）投稿向けの`x_search`と、軽量なURL取得向けの`web_fetch`も含まれています。このフェーズでは、`web_fetch`はローカルのままですが、`web_search`と`x_search`は内部でxAI Responsesを使うことができます。

<Info>
  `web_search`は軽量なHTTP toolであり、ブラウザー自動化ではありません。JS依存が重いサイトやログインが必要な場合は、[Web Browser](/ja-JP/tools/browser)を使ってください。特定のURLを取得する場合は、[Web Fetch](/ja-JP/tools/web-fetch)を使ってください。
</Info>

## クイックスタート

<Steps>
  <Step title="providerを選ぶ">
    providerを選び、必要なセットアップを完了してください。APIキー不要のproviderもあれば、APIキーを使うproviderもあります。詳細は以下のproviderページを参照してください。
  </Step>
  <Step title="設定する">
    ```bash
    openclaw configure --section web
    ```
    これでproviderと必要な認証情報が保存されます。APIベースproviderでは、環境変数（たとえば`BRAVE_API_KEY`）を設定してこの手順を省略することもできます。
  </Step>
  <Step title="使う">
    これでagentは`web_search`を呼び出せます:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X投稿には次を使います:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## providerを選ぶ

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ja-JP/tools/brave-search">
    スニペット付きの構造化結果。`llm-context`モード、国/言語フィルターをサポート。無料枠あり。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ja-JP/tools/duckduckgo-search">
    キー不要のフォールバック。APIキー不要。非公式のHTMLベース統合。
  </Card>
  <Card title="Exa" icon="brain" href="/ja-JP/tools/exa-search">
    コンテンツ抽出（ハイライト、テキスト、要約）付きのニューラル + キーワード検索。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ja-JP/tools/firecrawl">
    構造化結果。深い抽出には`firecrawl_search`と`firecrawl_scrape`との併用が最適。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ja-JP/tools/gemini-search">
    Google Search grounding経由の引用付きAI合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/ja-JP/tools/grok-search">
    xAI web grounding経由の引用付きAI合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/ja-JP/tools/kimi-search">
    Moonshot web search経由の引用付きAI合成回答。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ja-JP/tools/minimax-search">
    MiniMax Coding Plan search API経由の構造化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ja-JP/tools/ollama-search">
    設定済みのOllamaホスト経由のキー不要検索。`ollama signin`が必要です。
  </Card>
  <Card title="Perplexity" icon="search" href="/ja-JP/tools/perplexity-search">
    コンテンツ抽出制御とドメインフィルタリング付きの構造化結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/ja-JP/tools/searxng-search">
    セルフホストのメタ検索。APIキー不要。Google、Bing、DuckDuckGoなどを集約。
  </Card>
  <Card title="Tavily" icon="globe" href="/ja-JP/tools/tavily">
    検索深度、トピックフィルタリング、およびURL抽出用`tavily_extract`付きの構造化結果。
  </Card>
</CardGroup>

### provider比較

| provider | 結果形式 | フィルター | APIキー |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/ja-JP/tools/brave-search) | 構造化スニペット | 国、言語、時間、`llm-context`モード | `BRAVE_API_KEY` |
| [DuckDuckGo](/ja-JP/tools/duckduckgo-search) | 構造化スニペット | -- | なし（キー不要） |
| [Exa](/ja-JP/tools/exa-search) | 構造化 + 抽出済み | Neural/keywordモード、日付、コンテンツ抽出 | `EXA_API_KEY` |
| [Firecrawl](/ja-JP/tools/firecrawl) | 構造化スニペット | `firecrawl_search` tool経由 | `FIRECRAWL_API_KEY` |
| [Gemini](/ja-JP/tools/gemini-search) | AI合成 + 引用 | -- | `GEMINI_API_KEY` |
| [Grok](/ja-JP/tools/grok-search) | AI合成 + 引用 | -- | `XAI_API_KEY` |
| [Kimi](/ja-JP/tools/kimi-search) | AI合成 + 引用 | -- | `KIMI_API_KEY` / `MOONSHOT_API_KEY` |
| [MiniMax Search](/ja-JP/tools/minimax-search) | 構造化スニペット | 地域（`global` / `cn`） | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` |
| [Ollama Web Search](/ja-JP/tools/ollama-search) | 構造化スニペット | -- | デフォルトでは不要。`ollama signin`が必要で、ホストが必要とする場合はOllama provider bearer authを再利用可能 |
| [Perplexity](/ja-JP/tools/perplexity-search) | 構造化スニペット | 国、言語、時間、ドメイン、コンテンツ制限 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |
| [SearXNG](/ja-JP/tools/searxng-search) | 構造化スニペット | カテゴリー、言語 | なし（セルフホスト） |
| [Tavily](/ja-JP/tools/tavily) | 構造化スニペット | `tavily_search` tool経由 | `TAVILY_API_KEY` |

## 自動検出

## ネイティブOpenAI web検索

直接のOpenAI Responsesモデルは、OpenClaw web検索が有効で、かつ管理providerが固定されていない場合、自動的にOpenAIホスト型の`web_search` toolを使用します。これは同梱OpenAI Plugin内のprovider所有動作であり、ネイティブOpenAI APIトラフィックにのみ適用されます。OpenAI互換proxy base URLやAzureルートには適用されません。OpenAIモデル向けに管理`web_search` toolを維持したい場合は、`tools.web.search.provider`を`brave`のような別providerに設定してください。管理検索とネイティブOpenAI検索の両方を無効にしたい場合は、`tools.web.search.enabled: false`を設定してください。

## ネイティブCodex web検索

Codex対応モデルは、OpenClawの管理`web_search`関数の代わりに、providerネイティブのResponses `web_search` toolを任意で使用できます。

- `tools.web.search.openaiCodex`配下で設定します
- 有効になるのはCodex対応モデル（`openai-codex/*`または`api: "openai-codex-responses"`を使うprovider）のみです
- 管理`web_search`は、Codex非対応モデルには引き続き適用されます
- `mode: "cached"`がデフォルトかつ推奨設定です
- `tools.web.search.enabled: false`は管理検索とネイティブ検索の両方を無効にします

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

ネイティブCodex検索が有効でも、現在のモデルがCodex対応でない場合、OpenClawは通常の管理`web_search`動作を維持します。

## web検索のセットアップ

ドキュメントおよびセットアップフロー内のprovider一覧はアルファベット順です。自動検出は別の優先順位を維持します。

`provider`が設定されていない場合、OpenClawは次の順序でproviderを確認し、準備ができている最初のものを使用します。

まずAPIベースprovider:

1. **Brave** -- `BRAVE_API_KEY`または`plugins.entries.brave.config.webSearch.apiKey`（順序10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`または`plugins.entries.minimax.config.webSearch.apiKey`（順序15）
3. **Gemini** -- `GEMINI_API_KEY`または`plugins.entries.google.config.webSearch.apiKey`（順序20）
4. **Grok** -- `XAI_API_KEY`または`plugins.entries.xai.config.webSearch.apiKey`（順序30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY`または`plugins.entries.moonshot.config.webSearch.apiKey`（順序40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`または`plugins.entries.perplexity.config.webSearch.apiKey`（順序50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY`または`plugins.entries.firecrawl.config.webSearch.apiKey`（順序60）
8. **Exa** -- `EXA_API_KEY`または`plugins.entries.exa.config.webSearch.apiKey`（順序65）
9. **Tavily** -- `TAVILY_API_KEY`または`plugins.entries.tavily.config.webSearch.apiKey`（順序70）

その後にキー不要のフォールバック:

10. **DuckDuckGo** -- accountやAPIキー不要のキー不要HTMLフォールバック（順序100）
11. **Ollama Web Search** -- 設定済みOllamaホスト経由のキー不要フォールバック。Ollamaへの到達性と`ollama signin`によるサインインが必要で、ホストが必要とする場合はOllama provider bearer authを再利用できます（順序110）
12. **SearXNG** -- `SEARXNG_BASE_URL`または`plugins.entries.searxng.config.webSearch.baseUrl`（順序200）

providerが1つも検出されない場合、Braveへフォールバックします（キー不足エラーが返り、設定を促されます）。

<Note>
  すべてのprovider keyフィールドはSecretRef objectをサポートします。`plugins.entries.<plugin>.config.webSearch.apiKey`配下のpluginスコープSecretRefsは、providerが`tools.web.search.provider`で明示選択された場合でも、自動検出で選択された場合でも、同梱Exa、Firecrawl、Gemini、Grok、Kimi、Perplexity、Tavily providerに対して解決されます。
  自動検出モードでは、OpenClawは選択されたprovider keyのみを解決します。未選択のSecretRefsは非アクティブのままなので、使用していないproviderの解決コストを払わずに複数providerを設定しておけます。
</Note>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // デフォルト: true
        provider: "brave", // または省略して自動検出
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

provider固有の設定（APIキー、base URL、モード）は`plugins.entries.<plugin>.config.webSearch.*`配下にあります。例についてはproviderページを参照してください。

`web_fetch`のフォールバックprovider選択は別です。

- `tools.web.fetch.provider`で選びます
- またはそのフィールドを省略し、利用可能な認証情報からOpenClawが準備済みの最初のweb-fetch providerを自動検出するようにします
- 現時点で同梱のweb-fetch providerはFirecrawlで、`plugins.entries.firecrawl.config.webFetch.*`配下で設定します

`openclaw onboard`または`openclaw configure --section web`中に**Kimi**を選ぶと、OpenClawは次も尋ねることができます。

- Moonshot APIリージョン（`https://api.moonshot.ai/v1`または`https://api.moonshot.cn/v1`）
- デフォルトのKimi web-searchモデル（デフォルトは`kimi-k2.6`）

`x_search`については、`plugins.entries.xai.config.xSearch.*`を設定してください。これはGrok web検索と同じ`XAI_API_KEY`フォールバックを使います。
レガシーの`tools.web.x_search.*`設定は、`openclaw doctor --fix`によって自動移行されます。
`openclaw onboard`または`openclaw configure --section web`中にGrokを選ぶと、OpenClawは同じキーで任意の`x_search`セットアップも提示できます。
これはGrok経路内の別個の追加入力ステップであり、別のトップレベルweb-search provider選択ではありません。別のproviderを選んだ場合、OpenClawは`x_search` promptを表示しません。

### APIキーの保存

<Tabs>
  <Tab title="設定ファイル">
    `openclaw configure --section web`を実行するか、キーを直接設定します:

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
    Gatewayプロセス環境でproviderの環境変数を設定します:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Gatewayインストールでは、これを`~/.openclaw/.env`に書いてください。
    [Env vars](/ja-JP/help/faq#env-vars-and-env-loading)を参照してください。

  </Tab>
</Tabs>

## toolパラメーター

| パラメーター | 説明 |
| --------------------- | ----------------------------------------------------- |
| `query` | 検索クエリ（必須） |
| `count` | 返す結果数（1〜10、デフォルト: 5） |
| `country` | 2文字のISO国コード（例: `"US"`、`"DE"`） |
| `language` | ISO 639-1言語コード（例: `"en"`、`"de"`） |
| `search_lang` | 検索言語コード（Braveのみ） |
| `freshness` | 時間フィルター: `day`、`week`、`month`、または`year` |
| `date_after` | この日付以降の結果（YYYY-MM-DD） |
| `date_before` | この日付以前の結果（YYYY-MM-DD） |
| `ui_lang` | UI言語コード（Braveのみ） |
| `domain_filter` | ドメインallowlist/deny list配列（Perplexityのみ） |
| `max_tokens` | 総コンテンツ予算、デフォルト25000（Perplexityのみ） |
| `max_tokens_per_page` | ページごとのtoken上限、デフォルト2048（Perplexityのみ） |

<Warning>
  すべてのパラメーターがすべてのproviderで動作するわけではありません。Braveの`llm-context`モードは`ui_lang`、`freshness`、`date_after`、`date_before`を拒否します。
  Gemini、Grok、Kimiは引用付きの1つの合成回答を返します。共有tool互換性のために`count`は受け付けますが、grounded回答の形状は変わりません。
  Perplexityも、Sonar/OpenRouter互換パス（`plugins.entries.perplexity.config.webSearch.baseUrl` / `model`または`OPENROUTER_API_KEY`）を使う場合は同じ挙動になります。
  SearXNGは、信頼済みプライベートネットワークまたはloopbackホストに対してのみ`http://`を受け付けます。公開SearXNGエンドポイントは`https://`を使う必要があります。
  FirecrawlとTavilyは、`web_search`経由では`query`と`count`のみをサポートします。高度なオプションには専用toolを使ってください。
</Warning>

## x_search

`x_search`はxAIを使ってX（旧Twitter）投稿を検索し、引用付きのAI合成回答を返します。自然言語クエリと任意の構造化フィルターを受け付けます。OpenClawは、このtool callを処理するリクエストでのみ、組み込みのxAI `x_search` toolを有効にします。

<Note>
  xAIは`x_search`がキーワード検索、セマンティック検索、ユーザー検索、スレッド取得をサポートすると文書化しています。repost、reply、bookmark、viewのような投稿単位のエンゲージメント統計には、正確な投稿URLまたはstatus IDに対する対象指定lookupを優先してください。広いキーワード検索でも正しい投稿を見つけられる場合はありますが、投稿単位メタデータの完全性は低くなることがあります。よいパターンは、まず投稿を特定し、その後その正確な投稿に絞った2回目の`x_search`クエリを実行することです。
</Note>

### x_search設定

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
            apiKey: "xai-...", // XAI_API_KEYが設定されていれば任意
          },
        },
      },
    },
  },
}
```

### x_searchパラメーター

| パラメーター | 説明 |
| ---------------------------- | ------------------------------------------------------ |
| `query` | 検索クエリ（必須） |
| `allowed_x_handles` | 結果を特定のX handleに制限する |
| `excluded_x_handles` | 特定のX handleを除外する |
| `from_date` | この日付以降の投稿のみを含める（YYYY-MM-DD） |
| `to_date` | この日付以前の投稿のみを含める（YYYY-MM-DD） |
| `enable_image_understanding` | xAIに一致投稿へ添付された画像を調べさせる |
| `enable_video_understanding` | xAIに一致投稿へ添付された動画を調べさせる |

### x_searchの例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 投稿単位の統計: 可能なら正確なstatus URLまたはstatus IDを使ってください
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

// 最近の結果（過去1週間）
await web_search({ query: "AI developments", freshness: "week" });

// 日付範囲
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// ドメインフィルタリング（Perplexityのみ）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## tool profile

tool profileまたはallowlistを使っている場合は、`web_search`、`x_search`、または`group:web`を追加してください。

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // または: allow: ["group:web"]  （web_search、x_search、web_fetchを含む）
  },
}
```

## 関連

- [Web Fetch](/ja-JP/tools/web-fetch) -- URLを取得して読みやすい内容を抽出する
- [Web Browser](/ja-JP/tools/browser) -- JS依存が重いサイト向けの完全なブラウザー自動化
- [Grok Search](/ja-JP/tools/grok-search) -- `web_search` providerとしてのGrok
- [Ollama Web Search](/ja-JP/tools/ollama-search) -- Ollamaホスト経由のキー不要web検索
