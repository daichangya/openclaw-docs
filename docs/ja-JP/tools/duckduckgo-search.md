---
read_when:
    - API キー不要の Web 検索プロバイダーを使いたいとき
    - DuckDuckGo を `web_search` に使いたいとき
    - 設定不要の検索フォールバックが必要なとき
summary: DuckDuckGo Web 検索 -- API キー不要のフォールバックプロバイダー（実験的、HTML ベース）
title: DuckDuckGo Search
x-i18n:
    generated_at: "2026-04-05T12:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# DuckDuckGo Search

OpenClaw は DuckDuckGo を**API キー不要**の `web_search` プロバイダーとしてサポートしています。API
キーやアカウントは不要です。

<Warning>
  DuckDuckGo は、DuckDuckGo の非 JavaScript 検索ページから結果を取得する**実験的で非公式な**統合です。公式 API ではありません。ボット対策ページや HTML の変更によって、ときどき壊れることがあります。
</Warning>

## セットアップ

API キーは不要です。DuckDuckGo をプロバイダーとして設定するだけです。

<Steps>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    # プロバイダーとして "duckduckgo" を選択
    ```
  </Step>
</Steps>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

リージョンと SafeSearch のオプションのプラグインレベル設定:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo のリージョンコード
            safeSearch: "moderate", // "strict"、"moderate"、または "off"
          },
        },
      },
    },
  },
}
```

## ツールパラメーター

| Parameter    | 説明                                                     |
| ------------ | -------------------------------------------------------- |
| `query`      | 検索クエリ（必須）                                       |
| `count`      | 返す結果数（1〜10、デフォルト: 5）                       |
| `region`     | DuckDuckGo のリージョンコード（例: `us-en`、`uk-en`、`de-de`） |
| `safeSearch` | SafeSearch レベル: `strict`、`moderate`（デフォルト）、または `off` |

リージョンと SafeSearch はプラグイン設定でも設定できます（上記参照）。ツール
パラメーターは、クエリごとに設定値を上書きします。

## メモ

- **API キー不要** — そのまま動作し、設定不要
- **実験的** — DuckDuckGo の非 JavaScript HTML
  検索ページから結果を収集します。公式 API や SDK ではありません
- **ボット対策リスク** — DuckDuckGo は、高負荷または自動化された利用時に
  CAPTCHA を返したり、リクエストをブロックしたりする場合があります
- **HTML パース** — 結果はページ構造に依存しており、それは予告なく
  変更されることがあります
- **自動検出順序** — DuckDuckGo は、自動検出における最初の API キー不要フォールバックです
  （順序 100）。キーが設定された API ベースのプロバイダーが先に実行され、
  次に Ollama Web Search（順序 110）、その後に SearXNG（順序 200）が続きます
- 設定されていない場合、**SafeSearch のデフォルトは moderate** です

<Tip>
  本番利用では、[Brave Search](/tools/brave-search)（無料枠
  あり）や、その他の API ベースのプロバイダーを検討してください。
</Tip>

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/tools/brave-search) -- 無料枠付きの構造化結果
- [Exa Search](/tools/exa-search) -- コンテンツ抽出付きのニューラル検索
