---
read_when:
    - URL を取得して可読コンテンツを抽出したいとき
    - web_fetch またはその Firecrawl フォールバックを設定したいとき
    - web_fetch の制限とキャッシュを理解したいとき
sidebarTitle: Web Fetch
summary: web_fetch ツール -- 可読コンテンツ抽出付きの HTTP fetch
title: Web Fetch
x-i18n:
    generated_at: "2026-04-05T13:00:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Web Fetch

`web_fetch` ツールは通常の HTTP GET を行い、可読コンテンツを抽出します
（HTML を markdown または text に変換）。JavaScript は**実行しません**。

JS を多用するサイトやログイン保護されたページには、
代わりに [Web Browser](/tools/browser) を使ってください。

## クイックスタート

`web_fetch` は**デフォルトで有効**です -- 設定は不要です。エージェントは
すぐに呼び出せます。

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## ツールパラメータ

| Parameter     | Type     | 説明                              |
| ------------- | -------- | --------------------------------- |
| `url`         | `string` | 取得する URL（必須、`http/https` のみ） |
| `extractMode` | `string` | `"markdown"`（デフォルト）または `"text"` |
| `maxChars`    | `number` | 出力をこの文字数で切り詰める       |

## 動作の仕組み

<Steps>
  <Step title="Fetch">
    Chrome 風の User-Agent と `Accept-Language`
    ヘッダーを付けて HTTP GET を送信します。プライベート/内部ホスト名をブロックし、リダイレクトも再確認します。
  </Step>
  <Step title="Extract">
    HTML 応答に対して Readability（メインコンテンツ抽出）を実行します。
  </Step>
  <Step title="Fallback (optional)">
    Readability が失敗し、Firecrawl が設定されている場合は、
    bot 回避モード付きで Firecrawl API 経由に再試行します。
  </Step>
  <Step title="Cache">
    同じ URL の繰り返し取得を減らすため、結果は 15 分間（設定可能）
    キャッシュされます。
  </Step>
</Steps>

## 設定

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // デフォルト: true
        provider: "firecrawl", // 任意。自動検出する場合は省略
        maxChars: 50000, // 最大出力文字数
        maxCharsCap: 50000, // maxChars パラメータのハード上限
        maxResponseBytes: 2000000, // 切り詰め前の最大ダウンロードサイズ
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // Readability 抽出を使う
        userAgent: "Mozilla/5.0 ...", // User-Agent を上書き
      },
    },
  },
}
```

## Firecrawl フォールバック

Readability 抽出が失敗した場合、`web_fetch` は
bot 回避やより良い抽出のために [Firecrawl](/tools/firecrawl) にフォールバックできます。

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 任意。利用可能な認証情報から自動検出する場合は省略
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // FIRECRAWL_API_KEY が設定されている場合は任意
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // キャッシュ期間（1日）
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` は SecretRef オブジェクトに対応しています。
従来の `tools.web.fetch.firecrawl.*` 設定は `openclaw doctor --fix` により自動移行されます。

<Note>
  Firecrawl が有効で、その SecretRef が未解決であり、
  `FIRECRAWL_API_KEY` の env フォールバックもない場合、gateway の起動は即座に失敗します。
</Note>

<Note>
  Firecrawl の `baseUrl` 上書きは制限されています。`https://` を使い、
  公式の Firecrawl ホスト（`api.firecrawl.dev`）でなければなりません。
</Note>

現在のランタイム動作:

- `tools.web.fetch.provider` は fetch フォールバックプロバイダーを明示的に選択します。
- `provider` を省略した場合、OpenClaw は利用可能な認証情報から、準備完了状態の最初の web-fetch
  プロバイダーを自動検出します。現時点でのバンドルプロバイダーは Firecrawl です。
- Readability が無効な場合、`web_fetch` は選択された
  プロバイダーフォールバックへ直接進みます。利用可能なプロバイダーがない場合は fail closed します。

## 制限と安全性

- `maxChars` は `tools.web.fetch.maxCharsCap` にクランプされます
- 応答本文は解析前に `maxResponseBytes` で上限が設けられます。大きすぎる
  応答は警告付きで切り詰められます
- プライベート/内部ホスト名はブロックされます
- リダイレクトは確認され、`maxRedirects` によって制限されます
- `web_fetch` はベストエフォートです -- 一部サイトでは [Web Browser](/tools/browser) が必要です

## ツールプロファイル

ツールプロファイルまたは allowlist を使っている場合は、`web_fetch` または `group:web` を追加してください。

```json5
{
  tools: {
    allow: ["web_fetch"],
    // または: allow: ["group:web"]  (`web_fetch`、`web_search`、`x_search` を含む)
  },
}
```

## 関連

- [Web Search](/tools/web) -- 複数プロバイダーで Web を検索
- [Web Browser](/tools/browser) -- JS を多用するサイト向けの完全なブラウザー自動化
- [Firecrawl](/tools/firecrawl) -- Firecrawl の検索およびスクレイプツール
