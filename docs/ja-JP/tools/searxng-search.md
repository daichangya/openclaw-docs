---
read_when:
    - セルフホスト型のウェブ検索プロバイダーを使いたいとき
    - web_search にSearXNGを使いたいとき
    - プライバシー重視またはエアギャップ環境向けの検索手段が必要なとき
summary: SearXNGウェブ検索 -- セルフホスト型でキー不要のメタ検索プロバイダー
title: SearXNG Search
x-i18n:
    generated_at: "2026-04-05T13:00:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# SearXNG Search

OpenClawは、[SearXNG](https://docs.searxng.org/) を **セルフホスト型** かつ
**キー不要** の `web_search` プロバイダーとしてサポートしています。SearXNGは、
Google、Bing、DuckDuckGo などのソースから結果を集約するオープンソースの
メタ検索エンジンです。

利点:

- **無料かつ無制限** -- APIキーや商用サブスクリプションは不要
- **プライバシー / エアギャップ** -- クエリがネットワーク外へ出ない
- **どこでも使える** -- 商用検索APIのリージョン制限なし

## セットアップ

<Steps>
  <Step title="SearXNGインスタンスを実行する">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    または、アクセス可能な既存のSearXNGデプロイメントを使用してください。実運用向けセットアップについては
    [SearXNG documentation](https://docs.searxng.org/) を参照してください。

  </Step>
  <Step title="設定する">
    ```bash
    openclaw configure --section web
    # プロバイダーとして "searxng" を選択
    ```

    または環境変数を設定し、自動検出に見つけさせます:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

SearXNGインスタンス用のpluginレベル設定:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // 任意
            language: "en", // 任意
          },
        },
      },
    },
  },
}
```

`baseUrl` フィールドは SecretRef オブジェクトも受け付けます。

トランスポートルール:

- `https://` は公開または非公開のSearXNGホストで利用可能
- `http://` は信頼できるプライベートネットワークまたはloopbackホストでのみ受け付けられる
- 公開SearXNGホストでは `https://` を使用する必要がある

## 環境変数

設定の代わりに `SEARXNG_BASE_URL` を設定します:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL` が設定されていて、明示的なプロバイダー設定がない場合、
自動検出は自動的にSearXNGを選択します（優先度は最低です --
キー付きのAPIベースプロバイダーがあればそちらが先に選ばれます）。

## plugin設定リファレンス

| Field        | 説明 |
| ------------ | ---- |
| `baseUrl`    | SearXNGインスタンスのベースURL（必須） |
| `categories` | `general`、`news`、`science` などのカンマ区切りカテゴリ |
| `language`   | `en`、`de`、`fr` などの結果用言語コード |

## 注意

- **JSON API** -- HTMLスクレイピングではなく、SearXNGネイティブの `format=json` エンドポイントを使用
- **APIキー不要** -- どのSearXNGインスタンスでもそのまま動作
- **ベースURL検証** -- `baseUrl` は有効な `http://` または `https://`
  URLである必要があります。公開ホストでは `https://` を使用する必要があります
- **自動検出順序** -- SearXNGは自動検出で最後（順序200）に確認されます。
  キーが設定されたAPIベースプロバイダーが先に実行され、その後
  DuckDuckGo（順序100）、次に Ollama Web Search（順序110）が続きます
- **セルフホスト型** -- インスタンス、クエリ、上流検索エンジンを自分で制御できます
- **カテゴリ** は未設定時に `general` がデフォルトになります

<Tip>
  SearXNG JSON API を動作させるには、SearXNGインスタンスの `settings.yml` にある
  `search.formats` で `json` 形式が有効になっていることを確認してください。
</Tip>

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [DuckDuckGo Search](/tools/duckduckgo-search) -- もう1つのキー不要フォールバック
- [Brave Search](/tools/brave-search) -- 無料ティア付きの構造化結果
