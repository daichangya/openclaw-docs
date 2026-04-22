---
read_when:
    - Ollama経由でクラウドモデルまたはローカルモデルと一緒にOpenClawを実行したい場合
    - Ollamaのセットアップと設定のガイダンスが必要です
    - 画像理解のためにOllamaのvisionモデルを使いたい場合
summary: OllamaでOpenClawを実行する（クラウドモデルおよびローカルモデル）
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:27:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClawは、ホスト型クラウドモデルおよびローカル/セルフホストのOllamaサーバー向けに、OllamaのネイティブAPI（`/api/chat`）と統合されています。Ollamaは3つのモードで使用できます: 到達可能なOllamaホストを通す`Cloud + Local`、`https://ollama.com`に対する`Cloud only`、到達可能なOllamaホストに対する`Local only`です。

<Warning>
**Remote Ollamaユーザー**: OpenClawで`/v1`のOpenAI互換URL（`http://host:11434/v1`）を使用しないでください。これはtool callingを壊し、モデルが生のtool JSONを平文として出力することがあります。代わりに、ネイティブOllama API URLを使用してください: `baseUrl: "http://host:11434"`（`/v1`なし）。
</Warning>

## はじめに

希望するセットアップ方法とモードを選択してください。

<Tabs>
  <Tab title="Onboarding (recommended)">
    **最適な用途:** 動作するOllamaクラウドまたはローカルセットアップへの最短経路。

    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard
        ```

        provider一覧から**Ollama**を選択します。
      </Step>
      <Step title="モードを選択">
        - **Cloud + Local** — ローカルOllamaホストに加えて、そのホスト経由でルーティングされるクラウドモデル
        - **Cloud only** — `https://ollama.com`経由のホスト型Ollamaモデル
        - **Local only** — ローカルモデルのみ
      </Step>
      <Step title="モデルを選択">
        `Cloud only`では`OLLAMA_API_KEY`の入力を求められ、ホスト型クラウドのデフォルト候補が提案されます。`Cloud + Local`と`Local only`ではOllamaのbase URLを尋ねられ、利用可能なモデルを検出し、まだ利用できない場合は選択したローカルモデルを自動でpullします。`Cloud + Local`では、そのOllamaホストがクラウドアクセス用にサインイン済みかどうかも確認します。
      </Step>
      <Step title="モデルが利用可能か確認">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非対話モード

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    必要に応じてカスタムbase URLまたはモデルを指定できます:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **最適な用途:** クラウドまたはローカルセットアップを完全に制御したい場合。

    <Steps>
      <Step title="クラウドかローカルかを選択">
        - **Cloud + Local**: Ollamaをインストールし、`ollama signin`でサインインし、そのホスト経由でクラウドリクエストをルーティングする
        - **Cloud only**: `OLLAMA_API_KEY`を使って`https://ollama.com`を使用する
        - **Local only**: [ollama.com/download](https://ollama.com/download)からOllamaをインストールする
      </Step>
      <Step title="ローカルモデルをpullする（local only）">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClawでOllamaを有効化">
        `Cloud only`では実際の`OLLAMA_API_KEY`を使用します。ホストベースのセットアップでは、任意のプレースホルダー値で動作します。

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="モデルを確認して設定">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        または、configでデフォルトを設定します:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## クラウドモデル

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local`は、ローカルモデルとクラウドモデルの両方の制御点として到達可能なOllamaホストを使用します。これはOllamaが推奨するハイブリッドフローです。

    セットアップ時に**Cloud + Local**を使用します。OpenClawはOllamaのbase URLを尋ね、そのホストからローカルモデルを検出し、ホストが`ollama signin`でクラウドアクセス用にサインイン済みかどうかを確認します。ホストがサインイン済みの場合、OpenClawは`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`のようなホスト型クラウドのデフォルト候補も提案します。

    ホストがまだサインインしていない場合、OpenClawは`ollama signin`を実行するまでセットアップをlocal-onlyのまま維持します。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only`は`https://ollama.com`のOllamaホスト型APIに対して動作します。

    セットアップ時に**Cloud only**を使用します。OpenClawは`OLLAMA_API_KEY`の入力を求め、`baseUrl: "https://ollama.com"`を設定し、ホスト型クラウドモデル一覧をシードします。この経路ではローカルOllamaサーバーや`ollama signin`は**不要**です。

    `openclaw onboard`中に表示されるクラウドモデル一覧は、`https://ollama.com/api/tags`からライブで取得され、500件に制限されるため、ピッカーには静的なシードではなく現在のホスト型カタログが反映されます。セットアップ時に`ollama.com`へ到達できないかモデルが返されない場合、OpenClawは以前のハードコードされた候補にフォールバックするため、オンボーディングは引き続き完了できます。

  </Tab>

  <Tab title="Local only">
    local-onlyモードでは、OpenClawは設定済みのOllamaインスタンスからモデルを検出します。この経路はローカルまたはセルフホストのOllamaサーバー向けです。

    OpenClawは現在、ローカルのデフォルトとして`gemma4`を提案します。

  </Tab>
</Tabs>

## モデル検出（暗黙provider）

`OLLAMA_API_KEY`（またはauth profile）を設定し、かつ`models.providers.ollama`を**定義していない**場合、OpenClawは`http://127.0.0.1:11434`のローカルOllamaインスタンスからモデルを検出します。

| 動作 | 詳細 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カタログ問い合わせ | `/api/tags`を問い合わせる |
| 機能検出 | `/api/show`のbest-effortな参照を使用して`contextWindow`を読み取り、機能（visionを含む）を検出する |
| Visionモデル | `/api/show`で`vision`機能が報告されたモデルは、画像対応（`input: ["text", "image"]`）としてマークされるため、OpenClawは自動的に画像をプロンプトへ注入する |
| Reasoning検出 | モデル名のヒューリスティック（`r1`、`reasoning`、`think`）で`reasoning`をマークする |
| トークン上限 | OpenClawが使用するデフォルトのOllama max-token上限に`maxTokens`を設定する |
| コスト | すべてのコストを`0`に設定する |

これにより、カタログをローカルOllamaインスタンスと同期したまま、手動のモデル登録を避けられます。

```bash
# See what models are available
ollama list
openclaw models list
```

新しいモデルを追加するには、Ollamaで単にpullしてください。

```bash
ollama pull mistral
```

新しいモデルは自動的に検出され、使用可能になります。

<Note>
`models.providers.ollama`を明示的に設定した場合、自動検出はスキップされ、モデルを手動で定義する必要があります。以下の明示的設定セクションを参照してください。
</Note>

## Visionと画像説明

バンドル済みOllama Pluginは、Ollamaを画像対応のmedia-understanding providerとして登録します。これにより、OpenClawは明示的な画像説明リクエストや設定済みの画像モデルデフォルトを、ローカルまたはホスト型のOllama visionモデル経由でルーティングできます。

ローカルvisionでは、画像対応モデルをpullしてください。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

その後、infer CLIで確認します。

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model`は完全な`<provider/model>`参照である必要があります。これが設定されている場合、`openclaw infer image describe`は、そのモデルがネイティブvisionをサポートしているために説明をスキップするのではなく、そのモデルを直接実行します。

受信メディア向けのデフォルト画像理解モデルとしてOllamaを使うには、`agents.defaults.imageModel`を設定します。

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

`models.providers.ollama.models`を手動で定義する場合は、visionモデルを画像入力対応としてマークしてください。

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClawは、画像対応としてマークされていないモデルに対する画像説明リクエストを拒否します。暗黙の検出では、`/api/show`がvision機能を報告したときに、OpenClawはこれをOllamaから読み取ります。

## 設定

<Tabs>
  <Tab title="Basic (implicit discovery)">
    最も簡単なlocal-only有効化経路は環境変数経由です。

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY`が設定されている場合、providerエントリ内の`apiKey`は省略でき、OpenClawが可用性チェック用に補完します。
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    ホスト型クラウドセットアップを使いたい場合、Ollamaが別ホスト/別ポートで動作している場合、特定のcontext windowやモデル一覧を強制したい場合、または完全に手動でモデル定義したい場合は、明示的設定を使用してください。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    Ollamaが別のホストまたはポートで動作している場合（明示的設定では自動検出が無効になるため、モデルは手動で定義してください）:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
          },
        },
      },
    }
    ```

    <Warning>
    URLに`/v1`を追加しないでください。`/v1`パスはOpenAI互換モードを使用するため、tool callingの信頼性がありません。パス接尾辞なしのベースOllama URLを使用してください。
    </Warning>

  </Tab>
</Tabs>

### モデル選択

設定が完了すると、すべてのOllamaモデルが利用可能になります。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

OpenClawは、バンドル済みの`web_search` providerとして**Ollama Web Search**をサポートしています。

| プロパティ | 詳細 |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| ホスト | 設定済みのOllamaホストを使用（`models.providers.ollama.baseUrl`が設定されていればそれ、そうでなければ`http://127.0.0.1:11434`） |
| 認証 | キー不要 |
| 要件 | Ollamaが起動中で、`ollama signin`でサインイン済みである必要がある |

`openclaw onboard`または`openclaw configure --section web`で**Ollama Web Search**を選択するか、次を設定してください:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
完全なセットアップおよび動作の詳細については、[Ollama Web Search](/ja-JP/tools/ollama-search)を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **OpenAI互換モードではtool callingの信頼性がありません。** このモードは、proxyのためにOpenAI形式が必要で、かつネイティブtool calling動作に依存しない場合にのみ使用してください。
    </Warning>

    代わりにOpenAI互換endpointを使う必要がある場合（たとえばOpenAI形式しかサポートしないproxyの背後にある場合）は、`api: "openai-completions"`を明示的に設定してください。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    このモードでは、streamingとtool callingを同時にサポートしないことがあります。モデル設定内で`params: { streaming: false }`を指定してstreamingを無効にする必要がある場合があります。

    Ollamaで`api: "openai-completions"`を使用すると、OpenClawはデフォルトで`options.num_ctx`を注入し、Ollamaが黙って4096のcontext windowへフォールバックしないようにします。proxy/upstreamが未知の`options`フィールドを拒否する場合は、この動作を無効にしてください。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Context windows">
    自動検出されたモデルでは、OpenClawは、利用可能な場合はOllamaが報告するcontext windowを使用し、そうでなければOpenClawが使用するデフォルトのOllama context windowへフォールバックします。

    明示的なprovider設定では、`contextWindow`と`maxTokens`を上書きできます。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClawは、`deepseek-r1`、`reasoning`、`think`のような名前を持つモデルを、デフォルトでreasoning対応として扱います。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    追加設定は不要です。OpenClawが自動的にマークします。

  </Accordion>

  <Accordion title="Model costs">
    Ollamaは無料でローカル実行されるため、すべてのモデルコストは$0に設定されます。これは自動検出モデルにも手動定義モデルにも適用されます。
  </Accordion>

  <Accordion title="Memory embeddings">
    バンドル済みOllama Pluginは、[memory search](/ja-JP/concepts/memory)向けのmemory embedding providerを登録します。設定済みのOllama base URLとAPI keyを使用します。

    | プロパティ | 値 |
    | ------------- | ------------------- |
    | デフォルトモデル | `nomic-embed-text`  |
    | 自動pull | はい — embeddingモデルはローカルに存在しない場合、自動的にpullされます |

    memory searchのembedding providerとしてOllamaを選択するには:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Streaming configuration">
    OpenClawのOllama統合は、デフォルトで**ネイティブOllama API**（`/api/chat`）を使用し、streamingとtool callingの同時利用を完全にサポートします。特別な設定は不要です。

    <Tip>
    OpenAI互換endpointを使う必要がある場合は、上の「Legacy OpenAI-compatible mode」セクションを参照してください。そのモードでは、streamingとtool callingが同時に動作しないことがあります。
    </Tip>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Ollamaが検出されない">
    Ollamaが起動していて、`OLLAMA_API_KEY`（またはauth profile）を設定しており、かつ明示的な`models.providers.ollama`エントリを**定義していない**ことを確認してください。

    ```bash
    ollama serve
    ```

    APIにアクセスできることを確認してください。

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="利用可能なモデルがない">
    モデルが一覧に表示されない場合は、ローカルでそのモデルをpullするか、`models.providers.ollama`で明示的に定義してください。

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="接続が拒否される">
    Ollamaが正しいポートで動作していることを確認してください。

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
さらにヘルプが必要な場合: [Troubleshooting](/ja-JP/help/troubleshooting)と[FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Model providers" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのprovider、モデル参照、フェイルオーバー動作の概要。
  </Card>
  <Card title="Model selection" href="/ja-JP/concepts/models" icon="brain">
    モデルの選び方と設定方法。
  </Card>
  <Card title="Ollama Web Search" href="/ja-JP/tools/ollama-search" icon="magnifying-glass">
    Ollamaを利用したWeb検索の完全なセットアップおよび動作の詳細。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
