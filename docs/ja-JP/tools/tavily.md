---
read_when:
    - Tavilyベースのウェブ検索を使いたいとき
    - Tavily APIキーが必要なとき
    - web_search プロバイダーとしてTavilyを使いたいとき
    - URLからコンテンツを抽出したいとき
summary: Tavilyの検索および抽出ツール
title: Tavily
x-i18n:
    generated_at: "2026-04-05T13:00:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

OpenClawは **Tavily** を2つの方法で使用できます。

- `web_search` プロバイダーとして
- 明示的なpluginツールとして: `tavily_search` と `tavily_extract`

TavilyはAIアプリケーション向けに設計された検索APIで、LLMでの利用に最適化された構造化結果を返します。設定可能な検索深度、トピック
フィルタリング、ドメインフィルター、AI生成の回答要約、およびURLからのコンテンツ抽出
（JavaScriptレンダリングページを含む）をサポートします。

## APIキーを取得する

1. [tavily.com](https://tavily.com/) でTavilyアカウントを作成します。
2. ダッシュボードでAPIキーを生成します。
3. configに保存するか、gateway環境で `TAVILY_API_KEY` を設定します。

## Tavily検索を設定する

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // TAVILY_API_KEY が設定されている場合は任意
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

注意:

- オンボーディングまたは `openclaw configure --section web` でTavilyを選ぶと、
  同梱のTavily pluginが自動的に有効になります。
- Tavily設定は `plugins.entries.tavily.config.webSearch.*` の下に保存します。
- Tavilyを使用する `web_search` は `query` と `count` をサポートします（最大20件の結果）。
- `search_depth`、`topic`、`include_answer`、
  またはドメインフィルターなどのTavily固有の制御が必要な場合は、`tavily_search` を使用してください。

## Tavily pluginツール

### `tavily_search`

汎用の
`web_search` ではなく、Tavily固有の検索制御を使いたい場合に使用します。

| Parameter         | 説明 |
| ----------------- | ---- |
| `query`           | 検索クエリ文字列（400文字未満にしてください） |
| `search_depth`    | `basic`（デフォルト、バランス型）または `advanced`（最高関連性、低速） |
| `topic`           | `general`（デフォルト）、`news`（リアルタイム更新）、または `finance` |
| `max_results`     | 結果数、1〜20（デフォルト: 5） |
| `include_answer`  | AI生成の回答要約を含める（デフォルト: false） |
| `time_range`      | 新しさでフィルター: `day`、`week`、`month`、または `year` |
| `include_domains` | 結果を制限するドメインの配列 |
| `exclude_domains` | 結果から除外するドメインの配列 |

**検索深度:**

| Depth      | 速度 | 関連性 | 最適な用途 |
| ---------- | ---- | ------ | ---------- |
| `basic`    | 高速 | 高い   | 汎用クエリ（デフォルト） |
| `advanced` | 低速 | 最高   | 精度、特定事実、調査 |

### `tavily_extract`

1つ以上のURLからクリーンなコンテンツを抽出するために使用します。
JavaScriptレンダリングページを処理し、対象を絞った
抽出のために、クエリに重点を置いたチャンク化をサポートします。

| Parameter           | 説明 |
| ------------------- | ---- |
| `urls`              | 抽出するURLの配列（1リクエストあたり1〜20件） |
| `query`             | このクエリへの関連性で抽出チャンクを再ランキング |
| `extract_depth`     | `basic`（デフォルト、高速）または `advanced`（JSの多いページ向け） |
| `chunks_per_source` | URLごとのチャンク数、1〜5（`query` が必要） |
| `include_images`    | 結果に画像URLを含める（デフォルト: false） |

**抽出深度:**

| Depth      | 使用するタイミング |
| ---------- | ------------------ |
| `basic`    | 単純なページ - まずこれを試してください |
| `advanced` | JSレンダリングSPA、動的コンテンツ、表 |

ヒント:

- 1リクエストあたり最大20 URLです。より大きいリストは複数回の呼び出しに分割してください。
- ページ全体ではなく関連コンテンツだけを取得するには、`query` + `chunks_per_source` を使ってください。
- まず `basic` を試し、コンテンツが欠けているか不完全なら `advanced` にフォールバックしてください。

## 適切なツールの選び方

| 必要なもの | ツール |
| ---------- | ------ |
| 手早いウェブ検索、特別なオプションなし | `web_search` |
| 深度、トピック、AI回答付きの検索 | `tavily_search` |
| 特定URLからのコンテンツ抽出 | `tavily_extract` |

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [Firecrawl](/tools/firecrawl) -- コンテンツ抽出付きの検索 + スクレイピング
- [Exa Search](/tools/exa-search) -- コンテンツ抽出付きのニューラル検索
