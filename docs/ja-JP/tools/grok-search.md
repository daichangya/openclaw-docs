---
read_when:
    - '`web_search` に Grok を使いたい'
    - ウェブ検索のために `XAI_API_KEY` が必要である
summary: xAI の web-grounded responses を使った Grok のウェブ検索
title: Grok Search
x-i18n:
    generated_at: "2026-04-05T12:59:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Grok Search

OpenClaw は、`web_search` プロバイダーとして Grok をサポートしており、xAI の web-grounded
responses を使って、ライブ検索結果に基づく引用付きの AI 合成回答を生成します。

同じ `XAI_API_KEY` は、X
（旧 Twitter）の投稿検索用組み込み `x_search` ツールにも使用できます。キーを
`plugins.entries.xai.config.webSearch.apiKey` に保存している場合、OpenClaw は現在、
バンドル済み xAI モデルプロバイダーに対してもフォールバックとしてそれを再利用します。

reposts、replies、bookmarks、views のような投稿単位の X メトリクスについては、
広い検索クエリではなく、正確な投稿 URL または status ID を使って `x_search` を使うことを推奨します。

## オンボーディングと設定

次のときに **Grok** を選ぶと:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw は、同じ
`XAI_API_KEY` で `x_search` を有効にするための別の後続ステップを表示できます。この後続ステップは次のとおりです:

- `web_search` に Grok を選んだ後にのみ表示される
- 独立した最上位の web-search プロバイダー選択肢ではない
- 同じフロー中に任意で `x_search` モデルを設定できる

これをスキップした場合でも、後で config で `x_search` を有効化または変更できます。

## API キーを取得する

<Steps>
  <Step title="キーを作成する">
    [xAI](https://console.x.ai/) から API キーを取得します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境に `XAI_API_KEY` を設定するか、次を使って設定します:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // XAI_API_KEY が設定されている場合は任意
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**環境変数の代替手段:** Gateway 環境に `XAI_API_KEY` を設定します。
gateway インストールの場合は、これを `~/.openclaw/.env` に置いてください。

## 仕組み

Grok は、Gemini の Google Search grounding アプローチと同様に、
xAI の web-grounded responses を使ってインライン引用付きの回答を合成します。

## サポートされるパラメーター

Grok search は `query` をサポートします。

`count` は共通の `web_search` 互換性のために受け付けられますが、Grok は依然として
N 件の結果リストではなく、引用付きの 1 つの合成回答を返します。

プロバイダー固有のフィルターは現在サポートされていません。

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [x_search in Web Search](/tools/web#x_search) -- xAI による第一級の X 検索
- [Gemini Search](/tools/gemini-search) -- Google grounding による AI 合成回答
