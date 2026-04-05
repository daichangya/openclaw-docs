---
read_when:
    - Web検索にPerplexity Searchを使いたい場合
    - '`PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` の設定が必要な場合'
summary: web_search向けのPerplexity Search APIとSonar/OpenRouter互換性
title: Perplexity Search（レガシーパス）
x-i18n:
    generated_at: "2026-04-05T12:50:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba91e63e7412f3b6f889ee11f4a66563014932a1dc7be8593fe2262a4877b89b
    source_path: perplexity.md
    workflow: 15
---

# Perplexity Search API

OpenClawは、`web_search` のproviderとしてPerplexity Search APIをサポートしています。
これは `title`、`url`、`snippet` フィールドを持つ構造化結果を返します。

互換性のために、OpenClawはレガシーなPerplexity Sonar/OpenRouter構成もサポートしています。
`OPENROUTER_API_KEY` を使用する、`plugins.entries.perplexity.config.webSearch.apiKey` に `sk-or-...` キーを使う、または `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` を設定すると、providerはchat-completionsパスに切り替わり、構造化されたSearch API結果の代わりに、引用付きのAI合成回答を返します。

## Perplexity APIキーの取得

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) でPerplexityアカウントを作成します
2. ダッシュボードでAPIキーを生成します
3. キーを設定に保存するか、Gateway環境で `PERPLEXITY_API_KEY` を設定します。

## OpenRouter互換性

すでにOpenRouterをPerplexity Sonar向けに使っている場合は、`provider: "perplexity"` のままにして、Gateway環境で `OPENROUTER_API_KEY` を設定するか、`plugins.entries.perplexity.config.webSearch.apiKey` に `sk-or-...` キーを保存してください。

任意の互換性コントロール:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 設定例

### ネイティブPerplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar互換性

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## キーの設定場所

**設定経由:** `openclaw configure --section web` を実行します。キーは
`~/.openclaw/openclaw.json` の `plugins.entries.perplexity.config.webSearch.apiKey`
に保存されます。このフィールドはSecretRefオブジェクトも受け付けます。

**環境経由:** Gatewayプロセス環境で `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY`
を設定します。gatewayインストールでは、
`~/.openclaw/.env`（またはサービス環境）に設定してください。[Env vars](/help/faq#env-vars-and-env-loading) を参照してください。

`provider: "perplexity"` が設定されていて、PerplexityキーのSecretRefが未解決でenvフォールバックもない場合、起動/再読み込みは即座に失敗します。

## ツールパラメーター

これらのパラメーターは、ネイティブPerplexity Search APIパスに適用されます。

| Parameter             | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `query`               | 検索クエリ（必須）                                   |
| `count`               | 返す結果数（1〜10、デフォルト: 5）                  |
| `country`             | 2文字のISO国コード（例: `"US"`、`"DE"`）            |
| `language`            | ISO 639-1言語コード（例: `"en"`、`"de"`、`"fr"`）   |
| `freshness`           | 時間フィルター: `day`（24時間）、`week`、`month`、または `year` |
| `date_after`          | この日付以降に公開された結果のみ（YYYY-MM-DD）       |
| `date_before`         | この日付以前に公開された結果のみ（YYYY-MM-DD）       |
| `domain_filter`       | ドメインallowlist/denylist配列（最大20）             |
| `max_tokens`          | 合計コンテンツ予算（デフォルト: 25000、最大: 1000000） |
| `max_tokens_per_page` | ページごとのトークン上限（デフォルト: 2048）         |

レガシーのSonar/OpenRouter互換パスでは:

- `query`、`count`、`freshness` を受け付けます
- `count` はその経路では互換性専用です。レスポンスは引き続きN件の結果リストではなく、引用付きの合成回答1件です
- `country`、`language`、`date_after`、
  `date_before`、`domain_filter`、`max_tokens`、`max_tokens_per_page`
  などのSearch API専用フィルターは明示的なエラーを返します

**例:**

```javascript
// 国と言語を指定した検索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近の結果（過去1週間）
await web_search({
  query: "AI news",
  freshness: "week",
});

// 日付範囲検索
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// ドメインフィルタリング（allowlist）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// ドメインフィルタリング（denylist - 接頭辞に - を付ける）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// より多くのコンテンツ抽出
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### ドメインフィルタールール

- フィルターごとに最大20ドメイン
- 同一リクエストでallowlistとdenylistを混在させることはできません
- denylistエントリーには `-` 接頭辞を使います（例: `["-reddit.com"]`）

## 注記

- Perplexity Search APIは構造化されたWeb検索結果（`title`、`url`、`snippet`）を返します
- OpenRouterまたは明示的な `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` により、互換性のためにPerplexityはSonar chat completionsへ戻ります
- Sonar/OpenRouter互換性では、構造化結果行ではなく、引用付きの合成回答1件を返します
- 結果はデフォルトで15分間キャッシュされます（`cacheTtlMinutes` で設定可能）

完全なweb_search設定については [Web tools](/tools/web) を参照してください。
詳細は [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) を参照してください。
