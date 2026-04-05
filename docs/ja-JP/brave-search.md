---
read_when:
    - web_search でBrave Searchを使いたいとき
    - BRAVE_API_KEY またはプランの詳細が必要なとき
summary: web_search 向けのBrave Search APIセットアップ
title: Brave Search（レガシーパス）
x-i18n:
    generated_at: "2026-04-05T12:34:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClawは、`web_search`プロバイダーとしてBrave Search APIをサポートしています。

## APIキーを取得する

1. [https://brave.com/search/api/](https://brave.com/search/api/)でBrave Search APIアカウントを作成します
2. ダッシュボードで**Search**プランを選択し、APIキーを生成します。
3. キーを設定に保存するか、Gateway環境で`BRAVE_API_KEY`を設定します。

## 設定例

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
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

Brave固有の検索設定は、現在`plugins.entries.brave.config.webSearch.*`の下にあります。
レガシーの`tools.web.search.apiKey`も互換性シムを通じて引き続き読み込まれますが、正規の設定パスではなくなりました。

`webSearch.mode`はBraveの転送方式を制御します。

- `web`（デフォルト）: タイトル、URL、スニペットを含む通常のBraveウェブ検索
- `llm-context`: グラウンディング用に事前抽出されたテキストチャンクとソースを含むBrave LLM Context API

## ツールパラメーター

| パラメーター | 説明 |
| ------------- | ------------------------------------------------------------------- |
| `query`       | 検索クエリ（必須） |
| `count`       | 返す結果数（1～10、デフォルト: 5） |
| `country`     | 2文字のISO国コード（例: "US"、"DE"） |
| `language`    | 検索結果用のISO 639-1言語コード（例: "en"、"de"、"fr"） |
| `search_lang` | Braveの検索言語コード（例: `en`、`en-gb`、`zh-hans`） |
| `ui_lang`     | UI要素用のISO言語コード |
| `freshness`   | 時間フィルター: `day`（24時間）、`week`、`month`、または`year` |
| `date_after`  | この日付以降に公開された結果のみ（YYYY-MM-DD） |
| `date_before` | この日付以前に公開された結果のみ（YYYY-MM-DD） |

**例:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 注意事項

- OpenClawはBraveの**Search**プランを使用します。レガシーサブスクリプション（例: 月2,000クエリの旧Freeプラン）がある場合でも引き続き有効ですが、LLM Contextやより高いレート制限などの新しい機能は含まれません。
- 各Braveプランには、更新される**月額\$5の無料クレジット**が含まれます。Searchプランの料金は1,000リクエストあたり\$5なので、このクレジットで月1,000クエリをカバーできます。予期しない課金を避けるため、Braveダッシュボードで使用量上限を設定してください。現在のプランについては、[Brave APIポータル](https://brave.com/search/api/)を参照してください。
- Searchプランには、LLM ContextエンドポイントとAI推論権が含まれます。結果を保存してモデルの学習や調整に使うには、明示的な保存権を含むプランが必要です。Braveの[利用規約](https://api-dashboard.search.brave.com/terms-of-service)を参照してください。
- `llm-context`モードは、通常のウェブ検索スニペット形式の代わりに、グラウンディングされたソースエントリーを返します。
- `llm-context`モードは、`ui_lang`、`freshness`、`date_after`、`date_before`をサポートしません。
- `ui_lang`には、`en-US`のような地域サブタグを含める必要があります。
- 結果はデフォルトで15分間キャッシュされます（`cacheTtlMinutes`で設定可能）。

完全なweb_search設定については、[Web tools](/tools/web)を参照してください。
