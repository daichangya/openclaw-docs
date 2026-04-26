---
read_when:
    - ローカルの vLLM サーバーに対して OpenClaw を実行したい場合
    - 独自のモデルで OpenAI 互換の `/v1` エンドポイントを使いたい場合
summary: vLLM（OpenAI 互換のローカルサーバー）で OpenClaw を実行する
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:39:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM は、**OpenAI 互換**の HTTP API を通じて、オープンソースモデル（および一部のカスタムモデル）を提供できます。OpenClaw は `openai-completions` API を使って vLLM に接続します。

OpenClaw は、`VLLM_API_KEY` を使って明示的に有効化した場合（サーバーが認証を強制しないなら任意の値で可）で、かつ明示的な `models.providers.vllm` エントリーを定義していない場合、vLLM から利用可能なモデルを**自動検出**することもできます。

OpenClaw は `vllm` を、ストリーミングされた使用量集計をサポートするローカルの OpenAI 互換プロバイダーとして扱うため、status/context トークン数は `stream_options.include_usage` レスポンスから更新できます。

| プロパティ         | 値                                       |
| ------------------ | ---------------------------------------- |
| Provider ID        | `vllm`                                   |
| API                | `openai-completions` (OpenAI 互換)       |
| Auth               | `VLLM_API_KEY` 環境変数                  |
| デフォルト base URL | `http://127.0.0.1:8000/v1`               |

## はじめに

<Steps>
  <Step title="OpenAI 互換サーバーとして vLLM を起動する">
    base URL は `/v1` エンドポイント（例: `/v1/models`、`/v1/chat/completions`）を公開している必要があります。vLLM は通常次の場所で動作します。

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API キー環境変数を設定する">
    サーバーが認証を強制しない場合は、任意の値で動作します。

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="モデルを選択する">
    vLLM のモデル ID のいずれかに置き換えてください。

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
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## モデル検出（暗黙的プロバイダー）

`VLLM_API_KEY` が設定されている（または認証プロファイルが存在する）状態で、`models.providers.vllm` を**定義していない**場合、OpenClaw は次を問い合わせます。

```
GET http://127.0.0.1:8000/v1/models
```

そして返された ID をモデルエントリーに変換します。

<Note>
`models.providers.vllm` を明示的に設定すると、自動検出はスキップされ、モデルを手動で定義する必要があります。
</Note>

## 明示的な設定（手動モデル）

次の場合は明示的な設定を使ってください。

- vLLM が別のホストまたはポートで動作している
- `contextWindow` や `maxTokens` の値を固定したい
- サーバーが実際の API キーを必要とする（またはヘッダーを制御したい）
- 信頼された loopback、LAN、または Tailscale の vLLM エンドポイントに接続する

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "ローカル vLLM モデル",
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
  <Accordion title="プロキシスタイルの動作">
    vLLM はネイティブな OpenAI エンドポイントではなく、プロキシスタイルの OpenAI 互換 `/v1` バックエンドとして扱われます。これは次を意味します。

    | 動作 | 適用されるか |
    |----------|----------|
    | ネイティブ OpenAI のリクエスト整形 | いいえ |
    | `service_tier` | 送信されない |
    | Responses `store` | 送信されない |
    | プロンプトキャッシュヒント | 送信されない |
    | OpenAI reasoning 互換ペイロード整形 | 適用されない |
    | 非公開の OpenClaw attribution header | カスタム base URL には注入されない |

  </Accordion>

  <Accordion title="Nemotron 3 の thinking 制御">
    vLLM/Nemotron 3 は、chat-template kwargs を使って、reasoning を隠し reasoning として返すか、可視の回答テキストとして返すかを制御できます。OpenClaw セッションで thinking をオフにした `vllm/nemotron-3-*` を使う場合、OpenClaw は次を送信します。

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    これらの値をカスタマイズするには、model params 配下に `chat_template_kwargs` を設定します。
    `params.extra_body.chat_template_kwargs` も設定した場合は、`extra_body` がリクエストボディの最後のオーバーライドであるため、そちらが最終的に優先されます。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="カスタム base URL">
    vLLM サーバーがデフォルト以外のホストまたはポートで動作している場合は、明示的なプロバイダー設定で `baseUrl` を設定してください。

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "リモート vLLM モデル",
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
  <Accordion title="サーバーに到達できない">
    vLLM サーバーが動作していてアクセス可能であることを確認してください。

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    接続エラーが表示される場合は、ホスト、ポート、および vLLM が OpenAI 互換サーバーモードで起動していることを確認してください。
    明示的な loopback、LAN、または Tailscale エンドポイントについては、
    `models.providers.vllm.request.allowPrivateNetwork: true` も設定してください。プロバイダーリクエストは、
    プロバイダーが明示的に信頼されていない限り、デフォルトでプライベートネットワーク URL をブロックします。

  </Accordion>

  <Accordion title="リクエストで認証エラーが出る">
    リクエストが認証エラーで失敗する場合は、サーバー設定に一致する実際の `VLLM_API_KEY` を設定するか、`models.providers.vllm` 配下でプロバイダーを明示的に設定してください。

    <Tip>
    vLLM サーバーが認証を強制しない場合、空でない任意の `VLLM_API_KEY` 値が、OpenClaw に対するオプトインシグナルとして機能します。
    </Tip>

  </Accordion>

  <Accordion title="モデルが検出されない">
    自動検出には、`VLLM_API_KEY` が設定されていることに加え、明示的な `models.providers.vllm` config エントリーがないことが必要です。プロバイダーを手動で定義している場合、OpenClaw は検出をスキップし、宣言したモデルだけを使います。
  </Accordion>
</AccordionGroup>

<Warning>
詳細は [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq) を参照してください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選び方。
  </Card>
  <Card title="OpenAI" href="/ja-JP/providers/openai" icon="bolt">
    ネイティブ OpenAI プロバイダーと OpenAI 互換ルートの動作。
  </Card>
  <Card title="OAuth and auth" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と資格情報の再利用ルール。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とその解決方法。
  </Card>
</CardGroup>
