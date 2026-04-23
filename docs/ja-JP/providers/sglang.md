---
read_when:
    - ローカルのSGLangサーバーに対してOpenClawを実行したい場合
    - 自分のモデルでOpenAI互換の`/v1`エンドポイントを使いたい場合
summary: SGLang（OpenAI互換のセルフホストサーバー）でOpenClawを実行する
title: SGLang
x-i18n:
    generated_at: "2026-04-23T04:50:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLangは、**OpenAI互換**HTTP API経由でオープンソースモデルを提供できます。OpenClawは、`openai-completions` APIを使ってSGLangに接続できます。

またOpenClawは、`SGLANG_API_KEY`でオプトインし、かつ明示的な`models.providers.sglang`エントリを定義していない場合、SGLangから利用可能なモデルを**自動検出**することもできます。サーバーで認証を強制していなければ、`SGLANG_API_KEY`にはどんな値でも使えます。

OpenClawは`sglang`を、ストリーミング使用量集計をサポートするローカルのOpenAI互換providerとして扱うため、status/context token数は`stream_options.include_usage`レスポンスから更新できます。

## はじめに

<Steps>
  <Step title="SGLangを起動する">
    OpenAI互換サーバーでSGLangを起動します。ベースURLは`/v1`エンドポイント（たとえば`/v1/models`、`/v1/chat/completions`）を公開している必要があります。SGLangは通常、次の場所で動作します。

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="APIキーを設定する">
    サーバーで認証が設定されていない場合は、どんな値でも使えます。

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="オンボーディングを実行するか、モデルを直接設定する">
    ```bash
    openclaw onboard
    ```

    または、モデルを手動で設定します:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## モデル検出（暗黙provider）

`SGLANG_API_KEY`が設定されている（または認証プロファイルが存在する）状態で、**`models.providers.sglang`を定義していない**場合、OpenClawは次を問い合わせます。

- `GET http://127.0.0.1:30000/v1/models`

そして返されたIDをモデルエントリへ変換します。

<Note>
`models.providers.sglang`を明示的に設定した場合、自動検出はスキップされ、モデルを手動で定義する必要があります。
</Note>

## 明示的な設定（手動モデル）

次の場合は明示的な設定を使用します。

- SGLangが別のホスト/ポートで動作している。
- `contextWindow`/`maxTokens`の値を固定したい。
- サーバーが実際のAPIキーを必要とする（またはヘッダーを制御したい）。

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="proxy形式の動作">
    SGLangは、ネイティブなOpenAIエンドポイントではなく、proxy形式のOpenAI互換`/v1`バックエンドとして扱われます。

    | 動作 | SGLang |
    |----------|--------|
    | OpenAI専用のリクエスト整形 | 適用されない |
    | `service_tier`、Responses `store`、prompt-cacheヒント | 送信されない |
    | reasoning互換ペイロード整形 | 適用されない |
    | 隠しattributionヘッダー（`originator`、`version`、`User-Agent`） | カスタムSGLang base URLには注入されない |

  </Accordion>

  <Accordion title="トラブルシューティング">
    **サーバーに到達できない**

    サーバーが起動して応答していることを確認してください。

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **認証エラー**

    リクエストが認証エラーで失敗する場合は、サーバー設定に一致する実際の`SGLANG_API_KEY`を設定するか、`models.providers.sglang`配下でproviderを明示的に設定してください。

    <Tip>
    認証なしでSGLangを実行している場合、モデル検出にオプトインするには、`SGLANG_API_KEY`に空でない任意の値を設定すれば十分です。
    </Tip>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    providerの選択、model ref、フォールオーバー動作。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    providerエントリを含む完全な設定スキーマ。
  </Card>
</CardGroup>
