---
read_when:
    - ローカルのvLLM serverに対してOpenClawを実行したいです
    - 独自のmodelでOpenAI互換の `/v1` endpointを使いたいです
summary: OpenAI互換のローカルserverであるvLLMを使ってOpenClawを実行する
title: vLLM
x-i18n:
    generated_at: "2026-04-23T04:50:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6c4ceeb59cc10079630e45263485747eadfc66a66267d27579f466d0c0a91a1
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLMは、**OpenAI互換** のHTTP API経由でオープンソースmodel（および一部のカスタムmodel）を提供できます。OpenClawは `openai-completions` APIを使ってvLLMに接続します。

OpenClawは、`VLLM_API_KEY` を指定して有効化し、かつ `models.providers.vllm` の明示的なentryを定義していない場合、vLLMから利用可能なmodelを**自動検出**することもできます（serverがauthを強制しない場合は、値は何でも構いません）。

OpenClawは `vllm` を、ストリーミングされたusage accountingをサポートするローカルのOpenAI互換providerとして扱います。そのため、status/context token数は `stream_options.include_usage` のresponseから更新できます。

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| Provider ID      | `vllm`                                   |
| API              | `openai-completions`（OpenAI互換） |
| Auth             | `VLLM_API_KEY` 環境変数      |
| Default base URL | `http://127.0.0.1:8000/v1`               |

## はじめに

<Steps>
  <Step title="OpenAI互換serverとしてvLLMを起動する">
    base URLは `/v1` endpoint（例: `/v1/models`, `/v1/chat/completions`）を公開している必要があります。vLLMは一般に次で動作します。

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API key環境変数を設定する">
    serverがauthを強制しない場合は、任意の値で構いません。

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="modelを選択する">
    自分のvLLM model IDのいずれかに置き換えてください。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="modelが利用可能か確認する">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Model discovery（暗黙provider）

`VLLM_API_KEY` が設定されている（またはauth profileが存在する）状態で、**`models.providers.vllm` を定義していない** 場合、OpenClawは次を問い合わせます。

```
GET http://127.0.0.1:8000/v1/models
```

そして返されたIDをmodel entryへ変換します。

<Note>
`models.providers.vllm` を明示的に設定した場合、自動検出はスキップされ、modelは手動定義が必要です。
</Note>

## 明示的設定（手動model）

次の場合は明示的configを使います。

- vLLMが別のhostまたはportで動作している
- `contextWindow` や `maxTokens` の値を固定したい
- serverが実際のAPI keyを必要とする（またはheaderを制御したい）

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "ローカルvLLM Model",
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

## 高度な注記

<AccordionGroup>
  <Accordion title="Proxy型の動作">
    vLLMは、ネイティブ
    OpenAI endpointではなく、proxy型のOpenAI互換 `/v1` backendとして扱われます。これは次を意味します。

    | Behavior | Applied? |
    |----------|----------|
    | ネイティブOpenAIのrequest shaping | いいえ |
    | `service_tier` | 送信されません |
    | responseの `store` | 送信されません |
    | prompt-cache hint | 送信されません |
    | OpenAI reasoning互換payload shaping | 適用されません |
    | 非公開のOpenClaw attribution header | カスタムbase URLでは注入されません |

  </Accordion>

  <Accordion title="カスタムbase URL">
    vLLM serverがデフォルト以外のhostまたはportで動作している場合は、明示的provider configで `baseUrl` を設定します。

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "リモートvLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Serverに到達できない">
    vLLM serverが起動していてアクセス可能か確認してください。

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    接続エラーが出る場合は、host、port、およびvLLMがOpenAI互換server modeで起動していることを確認してください。

  </Accordion>

  <Accordion title="requestでauth errorが出る">
    requestがauth errorで失敗する場合は、server設定に一致する実際の `VLLM_API_KEY` を設定するか、`models.providers.vllm` 配下でproviderを明示的に設定してください。

    <Tip>
    vLLM serverがauthを強制しない場合、OpenClawに対する有効化シグナルとして、`VLLM_API_KEY` には空でない任意の値を設定すれば構いません。
    </Tip>

  </Accordion>

  <Accordion title="modelが検出されない">
    自動検出には、**`VLLM_API_KEY` が設定されていること** と **明示的な `models.providers.vllm` config entryがないこと** の両方が必要です。providerを手動定義している場合、OpenClawは自動検出をスキップし、宣言したmodelのみを使います。
  </Accordion>
</AccordionGroup>

<Warning>
さらにヘルプが必要な場合: [Troubleshooting](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、およびfailover動作の選び方。
  </Card>
  <Card title="OpenAI" href="/ja-JP/providers/openai" icon="bolt">
    ネイティブOpenAI providerとOpenAI互換routeの動作。
  </Card>
  <Card title="OAuth and auth" href="/ja-JP/gateway/authentication" icon="key">
    authの詳細とcredential再利用ルール。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とその解決方法。
  </Card>
</CardGroup>
