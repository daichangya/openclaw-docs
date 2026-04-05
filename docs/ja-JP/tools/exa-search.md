---
read_when:
    - Exa を `web_search` に使いたいとき
    - '`EXA_API_KEY` が必要なとき'
    - ニューラル検索またはコンテンツ抽出を使いたいとき
summary: Exa AI 検索 -- コンテンツ抽出付きのニューラル検索とキーワード検索
title: Exa Search
x-i18n:
    generated_at: "2026-04-05T12:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Exa Search

OpenClaw は [Exa AI](https://exa.ai/) を `web_search` プロバイダーとしてサポートしています。Exa
は、組み込みのコンテンツ
抽出（ハイライト、テキスト、要約）を備えた、ニューラル、キーワード、ハイブリッド検索モードを提供します。

## API キーを取得する

<Steps>
  <Step title="アカウントを作成">
    [exa.ai](https://exa.ai/) でサインアップし、
    ダッシュボードから API キーを生成します。
  </Step>
  <Step title="キーを保存">
    Gateway 環境で `EXA_API_KEY` を設定するか、次を使って設定します:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 設定

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // EXA_API_KEY が設定されていれば省略可
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**環境変数の代替方法:** Gateway 環境で `EXA_API_KEY` を設定します。
gateway インストールでは、これを `~/.openclaw/.env` に置きます。

## ツールパラメーター

| Parameter     | 説明                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| `query`       | 検索クエリ（必須）                                                     |
| `count`       | 返す結果数（1〜100）                                                   |
| `type`        | 検索モード: `auto`、`neural`、`fast`、`deep`、`deep-reasoning`、または `instant` |
| `freshness`   | 時間フィルター: `day`、`week`、`month`、または `year`                  |
| `date_after`  | この日付以降の結果（YYYY-MM-DD）                                       |
| `date_before` | この日付以前の結果（YYYY-MM-DD）                                       |
| `contents`    | コンテンツ抽出オプション（下記参照）                                   |

### コンテンツ抽出

Exa は、検索結果とあわせて抽出済みコンテンツを返すことができます。有効にするには `contents`
オブジェクトを渡します。

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // ページ全文テキスト
    highlights: { numSentences: 3 }, // 重要な文
    summary: true, // AI 要約
  },
});
```

| Contents option | Type                                                                  | 説明                 |
| --------------- | --------------------------------------------------------------------- | -------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | ページ全文を抽出     |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 重要な文を抽出       |
| `summary`       | `boolean \| { query }`                                                | AI 生成の要約        |

### 検索モード

| Mode             | 説明                                 |
| ---------------- | ------------------------------------ |
| `auto`           | Exa が最適なモードを選択（デフォルト） |
| `neural`         | セマンティック/意味ベースの検索      |
| `fast`           | 高速なキーワード検索                 |
| `deep`           | 徹底的な深掘り検索                   |
| `deep-reasoning` | 推論付きの深掘り検索                 |
| `instant`        | 最速の結果                           |

## メモ

- `contents` オプションが指定されていない場合、Exa のデフォルトは `{ highlights: true }`
  となり、結果に重要文の抜粋が含まれます
- 利用可能な場合、結果には Exa API
  レスポンスの `highlightScores` と `summary` フィールドが保持されます
- 結果の説明は、利用可能なものに応じて、まず highlights、次に summary、
  最後に全文テキストから解決されます
- `freshness` と `date_after`/`date_before` は併用できません。時間フィルターは
  いずれか 1 つのモードを使ってください
- クエリごとに最大 100 件の結果を返せます（Exa の検索タイプ
  制限に従います）
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で設定可能）
- Exa は、構造化 JSON レスポンスを持つ公式 API 統合です

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/tools/brave-search) -- 国/言語フィルター付きの構造化結果
- [Perplexity Search](/tools/perplexity-search) -- ドメインフィルタリング付きの構造化結果
