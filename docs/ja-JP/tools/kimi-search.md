---
read_when:
    - web_search にKimiを使いたいとき
    - KIMI_API_KEY または MOONSHOT_API_KEY が必要なとき
summary: Moonshot web search を使ったKimiのウェブ検索
title: Kimi Search
x-i18n:
    generated_at: "2026-04-05T12:59:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753757a5497a683c35b4509ed3709b9514dc14a45612675d0f729ae6668c82a5
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi Search

OpenClawは、Moonshot web search を使用して引用付きのAI合成回答を生成する `web_search` プロバイダーとして、Kimiをサポートしています。

## APIキーを取得する

<Steps>
  <Step title="キーを作成する">
    [Moonshot AI](https://platform.moonshot.cn/) からAPIキーを取得します。
  </Step>
  <Step title="キーを保存する">
    Gateway環境で `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定するか、
    次の方法で構成します:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` または
`openclaw configure --section web` の実行中に **Kimi** を選択すると、
OpenClawは次についても尋ねることがあります:

- Moonshot APIリージョン:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- デフォルトのKimi web-searchモデル（デフォルトは `kimi-k2.5`）

## 設定

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // KIMI_API_KEY または MOONSHOT_API_KEY が設定されている場合は任意
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

チャットにChina APIホスト（`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`）を使用している場合、OpenClawは
`tools.web.search.kimi.baseUrl` が省略されていると、Kimiの
`web_search` にも同じホストを再利用します。これにより、
[platform.moonshot.cn](https://platform.moonshot.cn/) のキーが誤って
国際エンドポイントに送られることを防ぎます（その場合はHTTP 401が返ることがよくあります）。
別の検索用ベースURLが必要な場合は、
`tools.web.search.kimi.baseUrl` で上書きしてください。

**環境変数による代替:** Gateway環境で `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定します。gatewayインストールでは、これを `~/.openclaw/.env` に記述してください。

`baseUrl` を省略した場合、OpenClawのデフォルトは `https://api.moonshot.ai/v1` です。
`model` を省略した場合、OpenClawのデフォルトは `kimi-k2.5` です。

## 仕組み

Kimiは、GeminiやGrokのグラウンデッドレスポンス方式と同様に、Moonshot web search を使用してインライン引用付きの回答を合成します。

## サポートされるパラメーター

Kimi search は `query` をサポートします。

共有の `web_search` 互換性のために `count` も受け付けますが、Kimiは依然として
N件の結果リストではなく、引用付きの1つの合成回答を返します。

プロバイダー固有のフィルターは現在サポートされていません。

## 関連

- [Web Search overview](/tools/web) -- すべてのプロバイダーと自動検出
- [Moonshot AI](/ja-JP/providers/moonshot) -- Moonshotモデル + Kimi Codingプロバイダードキュメント
- [Gemini Search](/tools/gemini-search) -- Google grounding によるAI合成回答
- [Grok Search](/tools/grok-search) -- xAI grounding によるAI合成回答
