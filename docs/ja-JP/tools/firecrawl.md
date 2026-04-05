---
read_when:
    - Firecrawl による Web 抽出を使いたいとき
    - Firecrawl API キーが必要なとき
    - Firecrawl を `web_search` プロバイダーとして使いたいとき
    - '`web_fetch` でアンチボット抽出を使いたいとき'
summary: Firecrawl 検索、スクレイプ、および `web_fetch` フォールバック
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T12:59:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw は **Firecrawl** を 3 つの方法で利用できます。

- `web_search` プロバイダーとして
- 明示的なプラグインツールとして: `firecrawl_search` と `firecrawl_scrape`
- `web_fetch` のフォールバック抽出器として

これは、ボット回避とキャッシュをサポートするホスト型の抽出/検索サービスであり、
JS の多いサイトや、通常の HTTP fetch をブロックするページで役立ちます。

## API キーを取得する

1. Firecrawl アカウントを作成し、API キーを生成します。
2. それを config に保存するか、gateway 環境で `FIRECRAWL_API_KEY` を設定します。

## Firecrawl 検索を設定する

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

メモ:

- オンボーディングまたは `openclaw configure --section web` で Firecrawl を選ぶと、同梱の Firecrawl プラグインが自動的に有効になります。
- Firecrawl を使う `web_search` は `query` と `count` をサポートします。
- `sources`、`categories`、結果のスクレイプなど、Firecrawl 固有の制御を使うには `firecrawl_search` を使用してください。
- `baseUrl` の上書きは `https://api.firecrawl.dev` のままでなければなりません。
- `FIRECRAWL_BASE_URL` は、Firecrawl の検索とスクレイプの base URL に対する共通の環境変数フォールバックです。

## Firecrawl スクレイプ + `web_fetch` フォールバックを設定する

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

メモ:

- Firecrawl フォールバックの試行は、API キーが利用可能な場合にのみ実行されます（`plugins.entries.firecrawl.config.webFetch.apiKey` または `FIRECRAWL_API_KEY`）。
- `maxAgeMs` は、キャッシュ結果の許容経過時間（ミリ秒）を制御します。デフォルトは 2 日です。
- レガシーな `tools.web.fetch.firecrawl.*` config は `openclaw doctor --fix` によって自動移行されます。
- Firecrawl の scrape/base URL 上書きは `https://api.firecrawl.dev` に制限されます。

`firecrawl_scrape` は、同じ `plugins.entries.firecrawl.config.webFetch.*` 設定と環境変数を再利用します。

## Firecrawl プラグインツール

### `firecrawl_search`

汎用の `web_search` ではなく、Firecrawl 固有の検索制御を使いたい場合にこれを使用します。

主要パラメーター:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

通常の `web_fetch` では弱い、JS の多いページやボット保護されたページにこれを使用します。

主要パラメーター:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / ボット回避

Firecrawl は、ボット回避のための **proxy mode** パラメーター（`basic`、`stealth`、または `auto`）を公開しています。
OpenClaw は Firecrawl リクエストに対して常に `proxy: "auto"` と `storeInCache: true` を使います。
proxy が省略された場合、Firecrawl のデフォルトは `auto` です。`auto` は basic の試行が失敗した場合に stealth proxy で再試行するため、basic のみのスクレイプより多くのクレジットを使う可能性があります。

## `web_fetch` が Firecrawl を使う方法

`web_fetch` の抽出順序:

1. Readability（ローカル）
2. Firecrawl（選択されているか、アクティブな web-fetch フォールバックとして自動検出された場合）
3. 基本的な HTML クリーンアップ（最後のフォールバック）

選択ノブは `tools.web.fetch.provider` です。これを省略すると、OpenClaw は
利用可能な認証情報から、準備ができている最初の web-fetch プロバイダーを自動検出します。
現時点での同梱プロバイダーは Firecrawl です。

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [Web Fetch](/tools/web-fetch) -- Firecrawl フォールバック付きの web_fetch ツール
- [Tavily](/tools/tavily) -- 検索 + 抽出ツール
