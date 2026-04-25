---
read_when:
    - Moonshot K2（Moonshot Open Platform）とKimi Codingの設定について知りたい場合
    - 別々のendpoint、キー、model refを理解する必要があります
    - どちらのプロバイダーでも使えるコピペ可能なconfigが欲しい場合
summary: Moonshot K2とKimi Codingを設定する（別々のプロバイダー + キー）
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-25T13:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 15
---

MoonshotはOpenAI互換endpointを持つKimi APIを提供します。providerを設定し、
デフォルトmodelを `moonshot/kimi-k2.6` に設定するか、
Kimi Codingを `kimi/kimi-code` で使ってください。

<Warning>
MoonshotとKimi Codingは**別々のプロバイダー**です。キーは相互利用できず、endpointも異なり、model refも異なります（`moonshot/...` vs `kimi/...`）。
</Warning>

## 組み込みmodel catalog

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | 名前                   | Reasoning | 入力        | Context | 最大出力   |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | いいえ    | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | いいえ    | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | はい      | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | はい      | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | いいえ    | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

現在のMoonshotホストK2 model向けのバンドル済みコスト見積もりは、Moonshotが公開している
従量課金料金を使います: Kimi K2.6はキャッシュヒット $0.16/MTok、
入力 $0.95/MTok、出力 $4.00/MTok です。Kimi K2.5はキャッシュヒット $0.10/MTok、
入力 $0.60/MTok、出力 $3.00/MTok です。その他のレガシーcatalog entryは、
configで上書きしない限り、0コストのplaceholderのままです。

## はじめに

providerを選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Moonshot API">
    **最適な用途:** Moonshot Open Platform経由のKimi K2 model。

    <Steps>
      <Step title="endpointリージョンを選ぶ">
        | 認証選択               | Endpoint                       | リージョン    |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        または、中国endpointの場合:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="デフォルトmodelを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="modelが利用可能か確認する">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="live smoke testを実行する">
        通常のsessionに触れずにmodelアクセスとコスト
        追跡を確認したい場合は、分離されたstate dirを使ってください:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSONレスポンスには `provider: "moonshot"` と
        `model: "kimi-k2.6"` が報告されるはずです。assistant transcript entryには、
        Moonshotがusage metadataを返した場合、正規化済み
        token usageと推定コストが `usage.cost` 配下に保存されます。
      </Step>
    </Steps>

    ### 設定例

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **最適な用途:** Kimi Coding endpoint経由のコード重視タスク。

    <Note>
    Kimi Codingは、Moonshot（`moonshot/...`）とは異なるAPI keyとprovider prefix（`kimi/...`）を使います。レガシーmodel ref `kimi/k2p5` も互換idとして引き続き受け付けられます。
    </Note>

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="デフォルトmodelを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="modelが利用可能か確認する">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### 設定例

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web search

OpenClawには、Moonshot web
searchをバックエンドとする `web_search` providerとして **Kimi** も同梱されています。

<Steps>
  <Step title="対話型web searchセットアップを実行する">
    ```bash
    openclaw configure --section web
    ```

    web-searchセクションで **Kimi** を選ぶと、
    `plugins.entries.moonshot.config.webSearch.*` が保存されます。

  </Step>
  <Step title="web searchリージョンとmodelを設定する">
    対話型セットアップでは次を尋ねます:

    | 設定                | オプション                                                           |
    | ------------------- | -------------------------------------------------------------------- |
    | APIリージョン       | `https://api.moonshot.ai/v1`（international）または `https://api.moonshot.cn/v1`（China） |
    | Web search model    | デフォルトは `kimi-k2.6`                                             |

  </Step>
</Steps>

configは `plugins.entries.moonshot.config.webSearch` 配下に置かれます:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // または KIMI_API_KEY / MOONSHOT_API_KEY を使用
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
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

## 高度な設定

<AccordionGroup>
  <Accordion title="ネイティブthinkingモード">
    Moonshot Kimiは二値のネイティブthinkingをサポートします:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    `agents.defaults.models.<provider/model>.params` を通じてmodelごとに設定します:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClawは、Moonshot向けにruntime `/think` レベルもマッピングします:

    | `/think` レベル     | Moonshotの挙動              |
    | ------------------- | --------------------------- |
    | `/think off`        | `thinking.type=disabled`    |
    | off以外の任意のレベル | `thinking.type=enabled`   |

    <Warning>
    Moonshot thinkingが有効な場合、`tool_choice` は `auto` または `none` でなければなりません。OpenClawは互換性のため、不適合な `tool_choice` 値を `auto` に正規化します。
    </Warning>

    Kimi K2.6は、`reasoning_content` の
    複数ターン保持を制御する任意の `thinking.keep` fieldも受け付けます。ターンをまたいで完全な
    reasoningを保持するには `"all"` に設定してください。省略するか（または `null` のままにするか）、
    サーバーデフォルト戦略を使ってください。OpenClawは `thinking.keep` を
    `moonshot/kimi-k2.6` に対してのみ転送し、他のmodelからは削除します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="tool call idのサニタイズ">
    Moonshot Kimiは、`functions.<name>:<index>` 形式のtool_call idを返します。OpenClawはそれらを変更せず保持するため、複数ターンのtool callが動作し続けます。

    カスタムOpenAI互換providerで厳格なサニタイズを強制するには、`sanitizeToolCallIds: true` を設定してください:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ストリーミングusage互換性">
    ネイティブMoonshot endpoint（`https://api.moonshot.ai/v1` および
    `https://api.moonshot.cn/v1`）は、共有
    `openai-completions` transport上でストリーミングusage互換性を公開します。OpenClawはこれをendpoint
    capabilityに基づいて判定するため、同じネイティブ
    Moonshot hostを対象とする互換カスタムprovider idは、同じストリーミングusage挙動を継承します。

    バンドル済みK2.6価格設定では、入力、出力、
    キャッシュ読み取りtokenを含むストリーミングusageは、`/status`, `/usage full`, `/usage cost`, およびtranscriptバックのsession
    accounting向けに、ローカル推定USDコストにも変換されます。

  </Accordion>

  <Accordion title="endpointとmodel refリファレンス">
    | プロバイダー   | Model refプレフィックス | Endpoint                      | Auth env var        |
    | -------------- | ---------------------- | ----------------------------- | ------------------- |
    | Moonshot       | `moonshot/`            | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN    | `moonshot/`            | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding    | `kimi/`                | Kimi Coding endpoint          | `KIMI_API_KEY`      |
    | Web search     | N/A                    | Moonshot APIリージョンと同じ   | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |

    - Kimi web searchは `KIMI_API_KEY` または `MOONSHOT_API_KEY` を使い、デフォルトでは `https://api.moonshot.ai/v1` とmodel `kimi-k2.6` を使用します。
    - 必要に応じて、`models.providers` 内で価格設定およびcontext metadataを上書きしてください。
    - Moonshotがあるmodelに対して異なるcontext制限を公開した場合は、それに応じて `contextWindow` を調整してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー挙動の選び方。
  </Card>
  <Card title="Web search" href="/ja-JP/tools/web" icon="magnifying-glass">
    Kimiを含むweb search providerの設定。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    provider、model、plugin向けの完全なconfig schema。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API key管理とドキュメント。
  </Card>
</CardGroup>
