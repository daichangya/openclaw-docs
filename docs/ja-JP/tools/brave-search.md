---
read_when:
    - web_search に Brave Search を使いたい
    - BRAVE_API_KEY またはプランの詳細が必要
summary: web_search 向けの Brave Search API セットアップ
title: Brave Search
x-i18n:
    generated_at: "2026-04-05T12:58:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc026a69addf74375a0e407805b875ff527c77eb7298b2f5bb0e165197f77c0c
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw は、`web_search` プロバイダーとして Brave Search API をサポートしています。

## API キーを取得する

1. [https://brave.com/search/api/](https://brave.com/search/api/) で Brave Search API アカウントを作成します
2. ダッシュボードで **Search** プランを選択し、API キーを生成します。
3. キーを設定に保存するか、Gateway 環境で `BRAVE_API_KEY` を設定します。

## 設定例

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // または "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Brave 検索固有の設定は、現在 `plugins.entries.brave.config.webSearch.*` 配下にあります。
従来の `tools.web.search.apiKey` も互換性 shim を通じて引き続き読み込まれますが、正規の設定パスではなくなりました。

`webSearch.mode` は Brave の転送方式を制御します。

- `web`（デフォルト）: タイトル、URL、スニペットを含む通常の Brave web search
- `llm-context`: グラウンディング用に事前抽出されたテキストチャンクとソースを返す Brave LLM Context API

## ツールパラメーター

| Parameter     | 説明                                                              |
| ------------- | ----------------------------------------------------------------- |
| `query`       | 検索クエリ（必須）                                                |
| `count`       | 返す結果数（1〜10、デフォルト: 5）                                |
| `country`     | 2 文字の ISO 国コード（例: "US", "DE"）                           |
| `language`    | 検索結果用の ISO 639-1 言語コード（例: "en", "de", "fr"）         |
| `search_lang` | Brave の検索言語コード（例: `en`, `en-gb`, `zh-hans`）            |
| `ui_lang`     | UI 要素用の ISO 言語コード                                         |
| `freshness`   | 時間フィルター: `day`（24h）、`week`、`month`、または `year`      |
| `date_after`  | この日付以降に公開された結果のみ（YYYY-MM-DD）                    |
| `date_before` | この日付以前に公開された結果のみ（YYYY-MM-DD）                    |

**例:**

```javascript
// 国と言語を指定した検索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近の結果（過去 1 週間）
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
```

## 注意事項

- OpenClaw は Brave の **Search** プランを使用します。レガシーサブスクリプション（例: 月 2,000 クエリの元の Free プラン）がある場合、それは引き続き有効ですが、LLM Context やより高いレート制限のような新しい機能は含まれません。
- 各 Brave プランには、毎月更新される **\$5/月の無料クレジット** が含まれます。Search プランの料金は 1,000 リクエストあたり \$5 なので、このクレジットで月 1,000 クエリをカバーできます。予期しない請求を避けるため、Brave ダッシュボードで使用量制限を設定してください。最新のプランについては [Brave API portal](https://brave.com/search/api/) を参照してください。
- Search プランには、LLM Context エンドポイントと AI 推論権が含まれます。モデルの学習や調整のために結果を保存するには、明示的な保存権を含むプランが必要です。Brave の [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service) を参照してください。
- `llm-context` モードは、通常の web-search スニペット形式ではなく、グラウンディングされたソースエントリを返します。
- `llm-context` モードは、`ui_lang`、`freshness`、`date_after`、`date_before` をサポートしません。
- `ui_lang` には、`en-US` のようなリージョンサブタグを含める必要があります。
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で設定可能）。

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [Perplexity Search](/tools/perplexity-search) -- ドメインフィルタリング付きの構造化結果
- [Exa Search](/tools/exa-search) -- コンテンツ抽出付きのニューラル検索
