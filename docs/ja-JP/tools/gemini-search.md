---
read_when:
    - Gemini を `web_search` に使いたいとき
    - '`GEMINI_API_KEY` が必要なとき'
    - Google Search grounding を使いたいとき
summary: Google Search grounding を使った Gemini Web 検索
title: Gemini Search
x-i18n:
    generated_at: "2026-04-05T12:59:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Gemini Search

OpenClaw は、組み込みの
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
を備えた Gemini モデルをサポートしています。これは、引用付きの
ライブ Google Search 結果に裏付けられた、AI 合成の回答を返します。

## API キーを取得する

<Steps>
  <Step title="キーを作成">
    [Google AI Studio](https://aistudio.google.com/apikey) にアクセスして、
    API キーを作成します。
  </Step>
  <Step title="キーを保存">
    Gateway 環境で `GEMINI_API_KEY` を設定するか、次を使って設定します:

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // GEMINI_API_KEY が設定されていれば省略可
            model: "gemini-2.5-flash", // デフォルト
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**環境変数の代替方法:** Gateway 環境で `GEMINI_API_KEY` を設定します。
gateway インストールでは、これを `~/.openclaw/.env` に置きます。

## 仕組み

リンクとスニペットの一覧を返す従来の検索プロバイダーとは異なり、
Gemini は Google Search grounding を使って、インライン引用付きの
AI 合成回答を生成します。結果には、合成された回答とソース
URL の両方が含まれます。

- Gemini grounding の引用 URL は、Google の
  リダイレクト URL から直接 URL へ自動的に解決されます。
- リダイレクト解決では、最終的な引用 URL を返す前に、
  SSRF ガード経路（HEAD + リダイレクト検査 +
  http/https 検証）を使用します。
- リダイレクト解決は厳格な SSRF デフォルトを使用するため、
  private/internal なターゲットへのリダイレクトはブロックされます。

## サポートされるパラメーター

Gemini 検索は `query` をサポートします。

共有の `web_search` 互換性のために `count` も受け付けますが、Gemini grounding
は依然として N 件の結果リストではなく、引用付きの 1 つの合成回答を返します。

`country`、`language`、`freshness`、
`domain_filter` のようなプロバイダー固有のフィルターはサポートされていません。

## モデル選択

デフォルトモデルは `gemini-2.5-flash` です（高速でコスト効率が高い）。grounding をサポートする任意の Gemini
モデルを
`plugins.entries.google.config.webSearch.model` で使用できます。

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/tools/brave-search) -- スニペット付きの構造化結果
- [Perplexity Search](/tools/perplexity-search) -- 構造化結果 + コンテンツ抽出
