---
read_when:
    - '`web_search` に MiniMax を使いたい'
    - MiniMax Coding Plan キーが必要である
    - MiniMax の CN/global search host ガイダンスが必要である
summary: Coding Plan search API を使った MiniMax Search
title: MiniMax Search
x-i18n:
    generated_at: "2026-04-05T12:59:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# MiniMax Search

OpenClaw は、MiniMax
Coding Plan search API を通じて、`web_search` プロバイダーとして MiniMax をサポートしています。これは、タイトル、URL、
snippet、および related queries を含む構造化検索結果を返します。

## Coding Plan キーを取得する

<Steps>
  <Step title="キーを作成する">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    で MiniMax Coding Plan キーを作成またはコピーします。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境に `MINIMAX_CODE_PLAN_KEY` を設定するか、次を使って設定します:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw は、env エイリアスとして `MINIMAX_CODING_API_KEY` も受け付けます。`MINIMAX_API_KEY`
も、すでに coding-plan token を指している場合は互換性のためのフォールバックとして引き続き読み取られます。

## 設定

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // MINIMAX_CODE_PLAN_KEY が設定されている場合は任意
            region: "global", // または "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**環境変数の代替手段:** Gateway 環境に `MINIMAX_CODE_PLAN_KEY` を設定します。
gateway インストールの場合は、これを `~/.openclaw/.env` に置いてください。

## リージョン選択

MiniMax Search は次のエンドポイントを使用します:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` が未設定の場合、OpenClaw は
次の順序でリージョンを解決します:

1. `tools.web.search.minimax.region` / plugin 所有の `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

つまり、CN のオンボーディングまたは `MINIMAX_API_HOST=https://api.minimaxi.com/...`
では、MiniMax Search も自動的に CN ホストに維持されます。

OAuth の `minimax-portal` 経路を通じて MiniMax を認証した場合でも、
ウェブ検索は引き続きプロバイダー ID `minimax` として登録されます。OAuth プロバイダー base URL
は、CN/global ホスト選択のためのリージョンヒントとしてのみ使われます。

## サポートされるパラメーター

MiniMax Search は次をサポートします:

- `query`
- `count`（OpenClaw は返された結果リストを要求された件数まで切り詰めます）

プロバイダー固有のフィルターは現在サポートされていません。

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [MiniMax](/ja-JP/providers/minimax) -- モデル、画像、音声、および認証セットアップ
