---
read_when:
    - Web 検索に Perplexity Search を使いたいとき
    - PERPLEXITY_API_KEY または OPENROUTER_API_KEY の設定が必要なとき
summary: web_search 向けの Perplexity Search API と Sonar/OpenRouter 互換性
title: Perplexity Search
x-i18n:
    generated_at: "2026-04-05T13:00:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d97498e26e5570364e1486cb75584ed53b40a0091bf0210e1ea62f62d562ea
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw は `web_search` プロバイダーとして Perplexity Search API をサポートしています。
これは `title`、`url`、`snippet` フィールドを持つ構造化結果を返します。

互換性のために、OpenClaw は従来の Perplexity Sonar/OpenRouter 構成もサポートしています。
`OPENROUTER_API_KEY` を使う場合、`plugins.entries.perplexity.config.webSearch.apiKey` に `sk-or-...` キーを使う場合、または `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` を設定した場合、プロバイダーは chat-completions パスに切り替わり、構造化された Search API 結果の代わりに、引用付きの AI 合成回答を返します。

## Perplexity API キーの取得

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) で Perplexity アカウントを作成します
2. ダッシュボードで API キーを生成します
3. 設定にキーを保存するか、Gateway 環境で `PERPLEXITY_API_KEY` を設定します。

## OpenRouter 互換性

すでに OpenRouter を Perplexity Sonar 用に使っている場合は、`provider: "perplexity"` を維持し、Gateway 環境で `OPENROUTER_API_KEY` を設定するか、`plugins.entries.perplexity.config.webSearch.apiKey` に `sk-or-...` キーを保存してください。

任意の互換コントロール:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 設定例

### ネイティブ Perplexity Search API

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

### OpenRouter / Sonar 互換性

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
に保存されます。
このフィールドは SecretRef オブジェクトも受け付けます。

**環境経由:** Gateway プロセス環境で `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY`
を設定します。Gateway インストールでは、これを
`~/.openclaw/.env`（またはサービス環境）に置いてください。[Env vars](/ja-JP/help/faq#env-vars-and-env-loading) を参照してください。

`provider: "perplexity"` が設定されていて、Perplexity キーの SecretRef が未解決かつ env フォールバックもない場合、起動/再読み込みは即座に失敗します。

## ツールパラメータ

これらのパラメータは、ネイティブ Perplexity Search API パスに適用されます。

| Parameter             | 説明                                          |
| --------------------- | --------------------------------------------- |
| `query`               | 検索クエリ（必須）                            |
| `count`               | 返す結果数（1-10、デフォルト: 5）             |
| `country`             | 2 文字の ISO 国コード（例: `"US"`, `"DE"`）   |
| `language`            | ISO 639-1 言語コード（例: `"en"`, `"de"`, `"fr"`） |
| `freshness`           | 時間フィルター: `day`（24時間）、`week`、`month`、または `year` |
| `date_after`          | この日付以降に公開された結果のみ（YYYY-MM-DD） |
| `date_before`         | この日付以前に公開された結果のみ（YYYY-MM-DD） |
| `domain_filter`       | ドメイン allowlist/denylist 配列（最大 20）   |
| `max_tokens`          | コンテンツ総予算（デフォルト: 25000、最大: 1000000） |
| `max_tokens_per_page` | ページごとのトークン上限（デフォルト: 2048）  |

従来の Sonar/OpenRouter 互換パスでは:

- `query`、`count`、`freshness` が受け付けられます
- そこでの `count` は互換性専用です。応答は依然として N 件の結果リストではなく、引用付きの単一の合成回答です
- `country`、`language`、`date_after`、
  `date_before`、`domain_filter`、`max_tokens`、`max_tokens_per_page`
  のような Search API 専用フィルターは明示的なエラーを返します

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

// より多いコンテンツ抽出
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### ドメインフィルターのルール

- フィルターごとの最大ドメイン数は 20
- 同一リクエスト内で allowlist と denylist は混在できません
- denylist エントリには `-` 接頭辞を使います（例: `["-reddit.com"]`）

## 注意

- Perplexity Search API は構造化された Web 検索結果（`title`、`url`、`snippet`）を返します
- OpenRouter または明示的な `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` により、Perplexity は互換性のため Sonar chat completions に戻ります
- Sonar/OpenRouter 互換性では、構造化結果行ではなく、引用付きの単一の合成回答を返します
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で設定可能）

## 関連

- [Web Search の概要](/tools/web) -- すべてのプロバイダーと自動検出
- [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) -- Perplexity 公式ドキュメント
- [Brave Search](/tools/brave-search) -- 国/言語フィルター付きの構造化結果
- [Exa Search](/tools/exa-search) -- コンテンツ抽出を備えたニューラル検索
