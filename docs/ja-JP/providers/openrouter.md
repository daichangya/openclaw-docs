---
read_when:
    - 多くのLLMに対して1つのAPIキーを使いたい場合
    - OpenClawでOpenRouter経由のモデルを実行したい場合
summary: OpenClawで多くのモデルにアクセスするためにOpenRouterの統一APIを使う
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:28:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouterは、単一のエンドポイントとAPIキーの背後で、多くのモデルへリクエストをルーティングする**統一API**を提供します。OpenAI互換なので、多くのOpenAI SDKはベースURLを切り替えるだけで動作します。

## はじめに

<Steps>
  <Step title="APIキーを取得する">
    [openrouter.ai/keys](https://openrouter.ai/keys) でAPIキーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（任意）特定のモデルに切り替える">
    オンボーディングではデフォルトで `openrouter/auto` が使われます。後で具体的なモデルを選べます:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## 設定例

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## モデル参照

<Note>
モデル参照は `openrouter/<provider>/<model>` の形式に従います。利用可能な
providerとモデルの完全な一覧は、[/concepts/model-providers](/ja-JP/concepts/model-providers) を参照してください。
</Note>

バンドル済みフォールバック例:

| Model ref                            | Notes                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | OpenRouter自動ルーティング    |
| `openrouter/moonshotai/kimi-k2.6`    | MoonshotAI経由のKimi K2.6     |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alphaルート |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alphaルート |

## 認証とヘッダー

OpenRouterは、内部的にはAPIキー付きのBearer tokenを使います。

実際のOpenRouterリクエスト（`https://openrouter.ai/api/v1`）では、OpenClawは
OpenRouterが文書化しているアプリ帰属ヘッダーも追加します:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter providerの向き先を別のproxyやベースURLへ変更した場合、OpenClawは
それらのOpenRouter固有ヘッダーやAnthropic cache markerを**注入しません**。
</Warning>

## 高度な注意事項

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    検証済みのOpenRouterルートでは、Anthropicモデル参照は、システム/developerプロンプトブロックの
    prompt-cache再利用を改善するためにOpenClawが使う、OpenRouter固有のAnthropic
    `cache_control` markerを維持します。
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    サポートされている非 `auto` ルートでは、OpenClawは選択されたthinkingレベルを
    OpenRouter proxy reasoningペイロードへマップします。未対応モデルヒントと
    `openrouter/auto` では、そのreasoning injectionはスキップされます。
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouterは依然としてproxy形式のOpenAI互換パスを通るため、`serviceTier`、Responsesの `store`、
    OpenAI reasoning互換ペイロード、prompt-cacheヒントのような、ネイティブOpenAI専用の
    リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini-backed routes">
    GeminiベースのOpenRouter参照はproxy-Geminiパスのままです。そこではOpenClawは
    Gemini thought-signatureのサニタイズを維持しますが、ネイティブGeminiの
    リプレイ検証やブートストラップ書き換えは有効化しません。
  </Accordion>

  <Accordion title="Provider routing metadata">
    モデルパラメータでOpenRouter providerルーティングを渡した場合、OpenClawは
    共有ストリームラッパーが動作する前に、それをOpenRouter routing metadataとして転送します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、モデル参照、フェイルオーバー動作の選び方。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、provider向けの完全な設定リファレンス。
  </Card>
</CardGroup>
